import { Model, INTEGER, FLOAT } from 'sequelize';
import Position from './position';
import db from '../tools/db';

interface ElectroModel extends Model {
    electro: number;
}

const Electro = db.define<ElectroModel>('electro', {
    electro: {
        type: FLOAT,
    },
    positionId: {
        type: INTEGER,

        references: {
            model: Position,
            key: 'id',
        },
    },
});

Electro.belongsTo(Position, {
    constraints: false,
    as: 'position',
    foreignKey: 'positionId',
});

export default Electro;
