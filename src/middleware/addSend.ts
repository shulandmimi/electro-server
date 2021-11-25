import Application, { Context } from 'koa';
import { StatusCode } from '../tools/types';

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

function sendS(ctx: Context) {
    ctx.body = {
        code: 200,
    };
}
function sendSD(ctx: Context, data: any) {
    ctx.body = {
        code: 200,
        data,
    };
}

function sendSDM(ctx: Context, data: any, msg: string) {
    ctx.body = {
        code: 200,
        data,
        msg,
    };
}

function sendF(ctx: Context, msg: string, code: StatusCode = StatusCode.BadRequest) {
    ctx.body = {
        code,
        msg,
    };
}
function sendM(ctx: Context, msg: string) {
    ctx.body = {
        code: StatusCode.Success,
        msg,
    };
}

function sendOM(ctx: Context, msg: string) {
    ctx.body = msg;
}

export default function addSend(app: Application) {
    app.use(async (ctx, next) => {
        ctx.send = send.bind(null, ctx);
        ctx.sendS = sendS.bind(null, ctx);
        ctx.sendSD = sendSD.bind(null, ctx);
        ctx.sendSDM = sendSDM.bind(null, ctx);
        ctx.sendM = sendM.bind(null, ctx);
        ctx.sendOM = sendOM.bind(null, ctx);
        ctx.sendF = sendF.bind(null, ctx);
        await next();
    });
}
