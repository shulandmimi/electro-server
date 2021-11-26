import Application from 'koa';
import { AssertionError } from 'assert';
import { StatusCode } from '../tools/types';
import { error} from '../tools/debug';

export default function catchError(app: Application) {
    app.use(async (ctx, next) => {
        try {
            await next();
        } catch (e: any) {
            // console.log(`${error.type}: ${error.message}`);
            if (e instanceof AssertionError) {
                ctx.sendF(e.message, StatusCode.BadRequest);
                error('assert: %s', e.message);
            } else {
                ctx.sendF(`${e.name}: ${e.message}`, StatusCode.ServerFailed);
                error('%s: %s', e.name, e.message);
            }
        }
    });
}
