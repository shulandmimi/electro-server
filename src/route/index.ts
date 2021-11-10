import Router from '@koa/router';
import QueryElectro from './queryElectro';

export default new Router().use(QueryElectro.routes()).routes();
