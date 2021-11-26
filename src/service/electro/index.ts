import axios from 'axios';
import qs from 'query-string';
import assert from 'assert';
import PositionModel, { PositionState } from '../../model/position';
import ElectroModel from '../../model/electro';
import { Area, Building, Room, Position } from './interface';
import { info } from '../../tools/debug';

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

export async function fetch_and_create_electro(id: number | InstanceType<typeof PositionModel>, area: Area, building: Building, room: Room) {
    const positionItem = (
        typeof id === 'number'
            ? (await PositionModel.findByPk(id, {
                  attributes: ['room', 'roomid', 'building', 'buildingid', 'area', 'areaid', 'id'],
              }))!
            : id
    ).toJSON() as PositionState;

    const electro = await fetch_electro('123', area, building, room);

    assert(typeof electro === 'number', electro as string);

    info(`区域: ${area.areaname} 楼栋：${building.building} 房间：${room.room} 电量：${electro}`);

    await ElectroModel.create({ electro, positionId: positionItem.id });

    return electro;
}
