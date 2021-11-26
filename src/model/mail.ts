import { Model, INTEGER } from 'sequelize';
import db from '../tools/db';
import Position from './position';
import UserModel from './user';

interface TMailMappingState {
    positionId: number;
    accountId: number;
}
export interface MailMamppingState extends TMailMappingState {
    id: number;
}

const MailMapping = db.define<Model<TMailMappingState, TMailMappingState>, TMailMappingState>('mailMapping', {
    positionId: {
        type: INTEGER,
        references: {
            model: Position,
            key: 'id',
        },
    },
    accountId: {
        type: INTEGER,
        references: {
            model: UserModel,
            key: 'id',
        },
        allowNull: false,
    },
});

MailMapping.belongsTo(Position, {
    constraints: false,
    foreignKey: 'positionId',
});

Position.belongsTo(MailMapping, {
    constraints: false,
    foreignKey: 'id',
    as: 'mail',
});

MailMapping.belongsTo(UserModel, {
    constraints: false,
    foreignKey: 'accountId',
});

export default MailMapping;
