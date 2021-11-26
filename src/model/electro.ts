import { Model, INTEGER, FLOAT } from 'sequelize';
import Position from './position';
import db from '../tools/db';

interface PElectroState {
    electro: number;
    positionId: number;
}
export interface ElectroState extends PElectroState {
    id: number;
}

const Electro = db.define<Model<PElectroState, PElectroState>, PElectroState>('electro', {
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
