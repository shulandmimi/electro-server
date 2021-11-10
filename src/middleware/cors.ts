import cors from '@koa/cors';
import Application from 'koa';

export default function addCors(app: Application) {
    app.use(cors({ origin: '*' }));
}
