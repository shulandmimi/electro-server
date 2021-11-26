require('dotenv').config();
import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import startMiddle from './middleware';
import routes from './route';
import db from './tools/db';
import { info } from './tools/debug';
import './scripts';

const app = new Koa();

startMiddle(app);

app.use(bodyParser());

app.use(routes);

app.listen(12306, async () => {
    info('http://127.0.0.1:12306');

    try {
        await db.authenticate();
        info('数据库连接成功');
    } catch (error: any) {
        error(error);
        error('connect failed');
        process.exit(1);
    }
    try {
        await db.sync({ alter: true, logging: false });
        info('同步成功');
    } catch (error: any) {
        error(error);
        error('同步失败');
        process.exit(1);
    }
});
