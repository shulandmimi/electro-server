import Application from 'koa';
import { AssertionError } from 'assert';
import { StatusCode } from '../tools/types';
const debug = require('debug')('error: ');

export default function catchError(app: Application) {
    app.use(async (ctx, next) => {
        try {
            await next();
        } catch (error: any) {
            // console.log(`${error.type}: ${error.message}`);
            if (error instanceof AssertionError) {
                ctx.sendF(error.message, StatusCode.BadRequest);
                debug('[error] assert: %s', error.message);
            } else {
                ctx.sendF(`${error.type}: ${error.message}`, StatusCode.ServerFailed);
                debug('[error] %s: %s', error.type, error.message);
            }
        }
    });
}
