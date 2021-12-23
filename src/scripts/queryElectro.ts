import { scheduleJob } from 'node-schedule';
import ElectroModel from '../model/electro';
import PositionModel, { PositionState } from '../model/position';
import { fetch_electro } from '../service/electro';
import { pushElectronUrgentData } from '../service/mail';
import { ElectroUrgentState } from '../service/mail/interface';
import db from '../tools/db';
import { info } from '../tools/debug';
import MailMapping from '../model/mail';
import UserModel from '../model/user';
import { literal } from 'sequelize';
const debug = info.extend('electro: ');

var total: number;
var offset: number = 0;
const URGENT_ELECTRO = 10;

async function dynamicGetTotal() {
    total = await PositionModel.count();
    debug(`房间总数量：${total}`);
}

db.afterSync(() => {
    dynamicGetTotal();
});

scheduleJob('*/5 * * * *', async fire => {
    debug(fire.toLocaleString());
    if (typeof total === 'undefined') {
        await dynamicGetTotal();
    }
    if (total === 0) {
        debug('无需要查询的房间');
        return;
    }
    debug('获取第 %d 房间，共', offset, total);
    const room = await PositionModel.findOne({
        attributes: ['room', 'roomid', 'building', 'buildingid', 'area', 'areaid', 'id'],
        offset: offset,
    });

    offset += 1;
    if (offset >= total) {
        await dynamicGetTotal();
        if (offset >= total) offset = 0;
    }
    if (!room) return;
    const { area, areaid, room: roomname, roomid, building, buildingid, id } = room.toJSON() as PositionState;
    const electro = await fetch_electro('123', { area: areaid, areaname: area }, { building, buildingid }, { room: roomname, roomid });

    if (typeof electro !== 'number') {
        debug('未查询到电量: %s', electro);
        return;
    }
    debug(`id: %d 区域: %s 楼栋：%s 房间：%s 电量：%d`, id, area, building, roomname, electro);
    ElectroModel.create({ electro, positionId: id });

    if (electro < URGENT_ELECTRO) {
        debug('电量目前是 %d, 低于阀值 %d', electro, URGENT_ELECTRO);
        const mails = await MailMapping.findAll({
            where: { positionId: id },
            attributes: ['id', [literal('(now())'), 'findTime'], [literal(`${electro}`), 'electro']],
            include: [
                {
                    model: UserModel,
                    as: 'user',
                    attributes: ['id', 'account'],
                },
                {
                    model: PositionModel,
                    as: 'position',
                    attributes: ['id', 'area', 'areaid', 'building', 'buildingid', 'room', 'roomid'],
                },
            ],
        });
        debug('共有 %d 个用户需要通知', mails.length);
        if (!mails.length) return;
        pushElectronUrgentData(mails.map(i => i.toJSON()) as any as ElectroUrgentState[]);
    }
});

// interface ResponseElectro {
//     query_elec_roominfo: {
//         retcode: string;
//         errmsg: string;
//         aid: string;
//         account: string;
//         meterflag: string;
//         pkgflag: string;
//         area: Area;
//         building: Building;
//         floor: any;
//         room: Room;
//         pkgtab: any[];
//     };
// }
