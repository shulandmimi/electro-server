import { scheduleJob } from 'node-schedule';
import ElectroModel from '../model/electro';
import PositionModel, { PositionModel as PositionModelT } from '../model/position';
import { fetch_electro } from '../service/electro';
import db from '../tools/db';

var total: number;
var offset: number = 0;

async function dynamicGetTotal() {
    total = await PositionModel.count();
    console.log(`房间总数量：${total}`);
}

db.afterSync(() => {
    dynamicGetTotal();
});

scheduleJob('*/5 * * * *', async fire => {
    console.log(fire.toLocaleString());
    if (typeof total === 'undefined') {
        await dynamicGetTotal();
    }
    if (total === 0) {
        console.log('无需要查询的房间');
        return;
    }
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
    const { area, areaid, room: roomname, roomid, building, buildingid } = room.toJSON() as PositionModelT;
    const electro = await fetch_electro('123', { area: areaid, areaname: area }, { building, buildingid }, { room: roomname, roomid });

    if (typeof electro !== 'number') {
        console.log(electro);
        return;
    }
    console.log(`区域: ${area} 楼栋：${building} 房间：${roomname} 电量：${electro}`);
    ElectroModel.create({ electro, positionId: room.id });
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
