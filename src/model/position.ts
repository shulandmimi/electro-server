import { Model, STRING, DATE, INTEGER } from 'sequelize';
import db from '../tools/db';

export interface PositionModel extends Model {
    id: number;

    /** 校区 */
    area: string;
    /** 校区ID */
    areaid: string;

    /** 建筑 */
    building: string;
    /** 建筑ID */
    buildingid: string;

    /** 房间 */
    room: string;
    /** 房间ID */
    roomid: string;
}

const Position = db.define<PositionModel>('position', {
    area: {
        type: STRING,
        comment: '校区',
    },
    areaid: {
        type: STRING,
        comment: '校区ID',
    },

    building: {
        type: STRING,
        comment: '建筑',
    },
    buildingid: {
        type: STRING,
        comment: '建筑ID',
    },

    room: {
        type: STRING,
        comment: '房间',
    },
    roomid: {
        type: STRING,
        comment: '房间ID',
    },
});
export function transformToPositionStrcut({ area, areaid, building, buildingid, room, roomid, ...other }: PositionModel) {
    return {
        ...other,
        area: {
            area,
            areaid,
        },
        building: {
            building,
            buildingid,
        },
        room: {
            room,
            roomid,
        },
    };
}

export default Position;
