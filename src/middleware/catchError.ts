import Application from 'koa';
import { AssertionError } from 'assert';

export default function catchError(app: Application) {
    app.use(async (ctx, next) => {
        try {
            await next();
        } catch (error: any) {
            console.log(`${error.type}: ${error.message}`);
            if (error instanceof AssertionError) {
                ctx.send({
                    code: 400,
                    msg: error.message,
                });
            } else {
                ctx.send({
                    code: 500,
                    msg: `${error.type}: ${error.message}`,
                    stack: error.stack,
                });
            }
        }
    });
}
