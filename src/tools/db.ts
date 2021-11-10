import { Sequelize } from 'sequelize';
import config from '../config';

let sequelize: Sequelize = new Sequelize(config.DB_DATABASE!, config.DB_USER!, config.DB_PASSWORD!, {
    host: config.DB_HOST || 'localhost',
    dialect: 'mysql',
});

export default sequelize;
