import Application, { Context } from 'koa';

function send(ctx: Context, data: any) {
    if (typeof data === 'string') {
        ctx.body = {
            code: 400,
            data,
        };
    } else {
        ctx.body = data;
    }
}

export default function addSend(app: Application) {
    app.use(async (ctx, next) => {
        ctx.send = send.bind(null, ctx);
        await next();
    });
}
