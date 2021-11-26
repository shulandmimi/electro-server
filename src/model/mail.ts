import { Model, INTEGER } from 'sequelize';
import db from '../tools/db';
import Position from './position';
import UserModel from './user';

export interface MailMamppingState {
    positionId: number;
    accountId: number;
}

const MailMapping = db.define<Model<MailMamppingState>, MailMamppingState>('mailMapping', {
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
    as: 'mail'
});

MailMapping.belongsTo(UserModel, {
    constraints: false,
    foreignKey: 'accountId',
});

export default MailMapping;
