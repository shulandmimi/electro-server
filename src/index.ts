require('dotenv').config();
import Koa from 'koa';
import cors from '@koa/cors';
import proxy, { IBaseKoaProxiesOptions } from 'koa-proxies';
import bodyParser from 'koa-bodyparser';
import startMiddle from './middleware';
import routes from './route';
import db from './tools/db';
import './scripts';

const app = new Koa();

startMiddle(app);

app.use(bodyParser());

app.use(routes);

app.listen(12306, async () => {
    console.log('http://127.0.0.1:12306');

    try {
        await db.authenticate();
        console.log('链接成功');
    } catch (error) {
        console.log(error);
        console.log('connect failed');
        process.exit(1);
    }
    try {
        await db.sync({ alter: true, logging: false });
        console.log('同步成功');
    } catch (error) {
        console.log(error);
        console.log('同步失败');
        process.exit(1);
    }
});
