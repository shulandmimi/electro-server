import { STRING } from 'sequelize';
import db from '../tools/db';

db.define('account', {
    username: STRING,
});
