import Router from '@koa/router';
import assert from 'assert';
import { col, fn } from 'sequelize';
import PositionModel, { transformToPositionStrcut } from '../model/position';
import ElectroModel from '../model/electro';
import { fetch_and_create_electro } from '../service/electro';
import { QueryElectro, CheckPosition } from '../service/electro/interface';

const route = new Router({ prefix: '/electro' });

route.get('/queryElectro', async ctx => {
    const { account, positions: rawpositions } = ctx.request.query as unknown as QueryElectro;

    const positions = Array.isArray(rawpositions) ? rawpositions : [rawpositions];

    if (!positions.length) {
        ctx.send({ code: 200, data: [] });
        return;
    }
    const rooms = await PositionModel.findAll({
        where: {
            id: positions,
        },
    });

    const electros = await ElectroModel.findAll({
        attributes: ['id', 'electro', 'createdAt'],
        order: [['createdAt', 'DESC']],
        where: {
            positionId: rooms.map(item => item.id),
        },
        group: col('positionId'),
        include: {
            model: PositionModel,
            as: 'position',
            attributes: {
                exclude: ['createdAt', 'updatedAt'],
            },
        },
    });

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

    const [position] = await PositionModel.findOrCreate({
        where: roomData,
    });

    await fetch_and_create_electro(position, area, building, room);

    ctx.send({ code: 200, msg: '房间号正常', data: transformToPositionStrcut(position.toJSON() as any) });
});

export default route;
