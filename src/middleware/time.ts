import Application from 'koa';
import { info } from '../tools/debug';

export default function computerTime(app: Application) {
    app.use(async (ctx, next) => {
        const start = Date.now();
        info(`${ctx.method} ${ctx.path}`);
        await next();
        info(`${ctx.method} ${ctx.path} ${Date.now() - start}ms`);
    });
}
