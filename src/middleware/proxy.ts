import Application, { Context, Next } from 'koa';
import httpProxy, { ProxyResCallback, ServerOptions, ErrorCallback } from 'http-proxy';
import { match } from 'node-match-path';
import { isFunction } from 'lodash';
import { info } from '../tools/debug';
const debug = info.extend('proxy: ');
const proxy = httpProxy.createProxy();

const map = new Map();

const queueMap = new Map();

function bufferConcat(...buffers: Buffer[]): Buffer {
    const totalLen = buffers.reduce((r, i) => r + i.length, 0);

    const buffer = Buffer.alloc(totalLen);

    buffers.reduce((r, i) => {
        i.copy(buffer, r);
        return r + i.length;
    }, 0);
    return buffer;
}

export default function addProxy(app: Application) {
    app.use(
        proxyMiddle('/electro/queryAreaList', ctx => {
            const { type } = ctx.query;
            if (map.has(type)) {
                ctx.body = map.get(type);
                return;
            }
            return {
                target: 'http://61.183.22.187:8988/web/Common/Tsm.html',
                changeOrigin: false,
                events: {
                    proxyRes: (pres, req, res) => {
                        let datas: Buffer[] = [];
                        pres.on('data', (data: Buffer) => {
                            datas.push(data);
                        });

                        pres.on('end', () => {
                            const data = bufferConcat(...datas).toString();
                            if (data.includes('系统异常')) {
                                return;
                            }
                            map.set(type, data);
                        });
                    },
                    error(err, req, res, target) {
                        debug(err);
                        ctx.body = err.message;
                    },
                },
            };
        })
    );
}

interface ProxyOptions {
    target: string;
    changeOrigin: boolean;
    events?: Partial<{
        proxyRes: ProxyResCallback;
        error: ErrorCallback;
    }>;
    headers?: ServerOptions['headers'];
}

type Options = ProxyOptions | ((ctx: Context) => ProxyOptions | undefined | false);

export function proxyMiddle(proxyUrl: string, options: Options) {
    return async (ctx: Context, next: Next) => {
        const { matches } = match(proxyUrl, ctx.path);
        if (!matches) {
            await next();
            return;
        }

        const rawOpts = typeof options === 'function' ? options(ctx) : options;

        if (!rawOpts) {
            if (rawOpts === false) return await next();
            return;
        }
        const { events, ...opts } = rawOpts;

        Object.entries(events || {}).forEach(([name, handler]) => {
            if (!queueMap.has(name)) {
                proxy.on(name, (...arg) => {
                    const fn = queueMap.get(name);
                    if (isFunction(fn)) {
                        fn(...arg);
                    }
                });
            }
            queueMap.set(name, handler);
        });

        if (!events || Object.keys(events || {}).length === 0) {
            queueMap.clear();
        }

        debug(`${ctx.req.url} =>> ${opts.target}`);

        ctx.req.url = '';

        await new Promise((resolve, reject) => {
            proxy.web(ctx.req, ctx.res, { ...opts }, (e, req, res) => {
                if (e) {
                    reject(e);
                    return;
                }
                resolve(undefined);
            });
        });
    };
}
