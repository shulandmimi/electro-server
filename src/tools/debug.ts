import d from 'debug';

const prefix = 'electro';
const debug = d(prefix);

export const info = debug.extend('info');
export const error = debug.extend('error');
export const warn = debug.extend('warn');
export default debug;
