import Router from '@koa/router';
import QueryElectro from './queryElectro';
import User from './user';
import Mail from './mail';

export default new Router().use(...[QueryElectro, User, Mail].map(item => item.routes())).routes();
