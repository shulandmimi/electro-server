import axios from 'axios';
import qs from 'query-string';
import Router from '@koa/router';
import assert from 'assert';
import PositionModel, { PositionModel as PositionModelP, transformToPositionStrcut } from '../model/position';
import ElectroModel from '../model/electro';

const route = new Router({ prefix: '/electro' });

export interface Area {
    area: string;
    areaname: string;
}

export interface Building {
    buildingid: string;
    building: string;
}

export interface Room {
    room: string;
    roomid: string;
}

interface Position {
    area: Area;
    building: Building;
    room: Room;
}

interface QueryElectro {
    positions: (Position & { id: number })[];
    account: string;
}

interface CheckPosition extends Position {
    account: string;
}

enum QueryType {
    Area = 'synjones.onecard.query.elec.area',
    Building = 'synjones.onecard.query.elec.building',
    Electro = 'synjones.onecard.query.elec.roominfo',
}

const QUERY_ID = '0030000000002501';
const STATIC_HEADERS = {
    Host: '61.183.22.187:8988',
    'Proxy-Connection': 'keep-alive',
    Pragma: 'no-cache',
    'Cache-Control': 'no-cache',
    Accept: 'application/json, text/javascript, */*; q=0.01',
    'X-Requested-With': 'XMLHttpRequest',
    'User-Agent':
        'Mozilla/5.0 (Linux; Android 11; Redmi K30 Pro Build/RKQ1.200826.002; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/90.0.4430.210 Mobile Safari/537.36',
    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
    Origin: 'http://61.183.22.187:8988',
    'Accept-Encoding': 'gzip, deflate',
    'Accept-Language': 'zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7',
};

export async function fetch_electro(account: string, area: Area, building: Building, room: Room): Promise<number | string> {
    const data = await axios.post(
        'http://61.183.22.187:8988/web/Common/Tsm.html',
        qs.stringify({
            jsondata: JSON.stringify({
                query_elec_roominfo: {
                    aid: QUERY_ID,
                    account, //'104688',
                    room,
                    floor: { floorid: '', floor: '' },
                    area,
                    building,
                },
            }),
            funname: QueryType.Electro,
            json: true,
        }),
        {
            headers: STATIC_HEADERS,
        }
    );
    const { errmsg = '' } = data?.data?.query_elec_roominfo ?? {};

    const electro = errmsg.match(/[0-9]+[\.]{0,1}[0-9]+/);
    if (Array.isArray(electro)) {
        return Number(electro[0]);
    } else {
        return errmsg;
    }
}

async function fetchElectroAndCreate(id: number | PositionModelP, area: Area, building: Building, room: Room) {
    const positionItem =
        typeof id === 'number'
            ? (await PositionModel.findByPk(id, {
                  attributes: ['room', 'roomid', 'building', 'buildingid', 'area', 'areaid', 'id'],
              }))!
            : id;

    const electro = await fetch_electro('123', area, building, room);
    assert(typeof electro === 'number', electro as string);

    console.log(`区域: ${area} 楼栋：${building} 房间：${room.room} 电量：${electro}`);
    ElectroModel.create({ electro, positionId: positionItem.id });
}

route.post('/queryElectro', async ctx => {
    const { account, positions } = ctx.request.body as QueryElectro;

    assert(Array.isArray(positions), '参数positions必须是一个数组');

    if (!positions.length) {
        ctx.send({ code: 200, data: [] });
        return;
    }
    const rooms = await PositionModel.findAll({
        where: {
            id: positions.map(item => item.id),
        },
    });

    let count = 0;
    const electros = (
        await Promise.allSettled(
            rooms.map(async item => {
                let electro;
                do {
                    electro = await ElectroModel.findOne({
                        attributes: ['id', 'electro', 'createdAt'],
                        order: [['createdAt', 'DESC']],
                        where: {
                            positionId: item.id,
                        },
                        include: {
                            model: PositionModel,
                            as: 'position',
                            attributes: {
                                exclude: ['createdAt', 'updatedAt', 'id'],
                            },
                        },
                    });
                    if (electro) break;
                    const { area, areaid, building, buildingid, roomid, room } = item;
                    fetchElectroAndCreate(item, { area: areaid, areaname: area }, { buildingid, building }, { room, roomid });
                } while (!electro && ++count < 3);
                return electro;
            })
        )
    )
        .map(item => (item.status === 'fulfilled' ? item.value : null))
        .filter(Boolean)
        .map(item => item?.toJSON());
    assert(electros.length, '电量未查询成功，请稍后再试');
    ctx.send({ code: 200, data: electros });
});

route.post('/checkRoom', async ctx => {
    const { area, building, room } = ctx.request.body as CheckPosition;

    const roomData = {
        area: area.areaname,
        areaid: area.area,
        building: building.building,
        buildingid: building.buildingid,
        room: room.room,
        roomid: room.roomid,
    };

    const [position, isSuccess] = await PositionModel.findOrCreate({
        where: roomData,
    });

    if(isSuccess) {
        const electro = await fetch_electro('123', area, building, room);
        assert(typeof electro === 'number', electro as string);
    }


    ctx.send({ code: 200, msg: '房间号正常', data: transformToPositionStrcut(position.toJSON() as any) });
});

export default route;
