import Router from '@koa/router';
import { col, literal } from 'sequelize';
import PositionModel, { transformToPositionStrcut } from '../model/position';
import ElectroModel from '../model/electro';
import { fetch_and_create_electro } from '../service/electro';
import { QueryElectro, CheckPosition } from '../service/electro/interface';
import MailMappingModel, { MailMamppingState } from '../model/mail';

const route = new Router({ prefix: '/electro' });

route.get('/queryElectro', async ctx => {
    const { account, positions: rawpositions } = ctx.request.query as unknown as QueryElectro;

    const positions = Array.isArray(rawpositions) ? rawpositions : [rawpositions];

    if (!positions.length) {
        ctx.sendSD([]);
        return;
    }

    const electros = await ElectroModel.findAll({
        attributes: ['id', 'electro', 'createdAt'],
        order: [['createdAt', 'DESC']],
        where: {
            positionId: positions,
        },
        offset: 0,
        limit: 1,
        include: {
            model: PositionModel,
            as: 'position',
            attributes: {
                exclude: ['createdAt', 'updatedAt'],
            },
            include: ctx.tokens
                ? [
                      {
                          model: MailMappingModel,
                          attributes: ['id', 'createdAt'],
                          as: 'mail',
                          on: {
                              positionId: literal('position.id'),
                          },
                      },
                  ]
                : [],
        },
    });

    ctx.sendSD(electros);
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

    ctx.sendSDM(transformToPositionStrcut(position.toJSON() as any), '房间号正常');
});

export default route;
