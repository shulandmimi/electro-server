import Application from 'koa';

export default function computerTime(app: Application) {
    app.use(async (ctx, next) => {
        const start = Date.now();
        console.log(`${ctx.method} ${ctx.path}`);
        await next();
        console.log(`${ctx.method} ${ctx.path} ${Date.now() - start}ms`);
    });
}
