import Router from '@koa/router';
import QueryElectro from './queryElectro';
import User from './user';

export default new Router().use(...[QueryElectro, User].map(item => item.routes())).routes();
