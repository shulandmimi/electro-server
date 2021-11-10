import Application, { Context, Next } from 'koa';
import httpProxy, { ProxyResCallback, ServerOptions } from 'http-proxy';
import { match } from 'node-match-path';
import { isFunction } from 'lodash';

const proxy = httpProxy.createProxy();

const map = new Map();

const queueMap = new Map();

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
                        pres.on('data', (data: Buffer) => {
                            const d = data.toString();
                            if (d.includes('系统异常')) {
                                return;
                            }
                            map.set(type, data.toString());
                        });
                    },
                },
            };
        })
    );
}

interface ProxyOptions {
    target: string;
    changeOrigin: boolean;
    events?: {
        proxyRes: ProxyResCallback;
    };
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

        console.log(`${ctx.req.url} =>> ${'http://61.183.22.187:8988/web/Common/Tsm.html'}`);

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
