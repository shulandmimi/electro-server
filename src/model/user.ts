import { Model, STRING } from 'sequelize';
import db from '../tools/db';

export interface OUserModelState {
    account: string;
    password: string;
}

export interface UserModelState extends OUserModelState, Model<OUserModelState> {
    id: number;
}

const UserModel = db.define<UserModelState, OUserModelState>('user', {
    account: {
        type: STRING,
        comment: '用户名',
        allowNull: false,
    },
    password: {
        type: STRING,
        comment: '密码',
        allowNull: false,
    },
});

export default UserModel;
