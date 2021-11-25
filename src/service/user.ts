import Application, { Context, Next } from 'koa';
import jwt from 'jwt-simple';
import { match } from 'node-match-path';
import assert from 'assert';
import config from '../config';
import redis, { select, DBMapping } from '../tools/redis';
import { DAY, SECONDS } from '../tools/time';
import { RegisterMail } from '../route/user';

const REGISTER_MAIL_EXPIRE = SECONDS * 30;

export function registerMailKey(key: string, value: string) {
    select(DBMapping.MailMapping);
    return new Promise((resolve, reject) => {
        redis.setex(key, REGISTER_MAIL_EXPIRE, value, err => {
            if (err) return reject(err);
            resolve(true);
        });
    });
}

export function hasRegisterKey(key: string): Promise<boolean> {
    return new Promise(resolve => {
        redis.exists(key, (err, r) => {
            if (err) return resolve(false);
            resolve(Boolean(r));
        });
    });
}

export function deleteRegisterKey(key: string) {
    return redis.del(key);
}

export function getRegisterValue(key: string): Promise<string | null> {
    return new Promise((resolve, reject) => {
        redis.get(key, (err, value) => {
            if (err) {
                return reject();
            }
            resolve(value);
        });
    });
}

export const JWT_EXPIRES = (DAY * 30) / 1000;

interface Platform {
    name: string;
    version: string;
    os: string;
    layout: string;
}

export const LOGIN_TOKEN = 'token';
export function genernalJWTAccount(ctx: Context): string {
    const { account, platform } = ctx.request.body as RegisterMail & { platform: Platform };
    const key = jwt.encode({ account, expires: Date.now() + JWT_EXPIRES, platform }, config.secret.salt!);

    return key;
}

interface LoginState {
    expires: number;
    account: string;
    platform: Platform;
}

interface CheckLoginOptions {
    include?: string[];
    exclude?: string[];
}
export function middleForCheckLogin(app: Application) {
    app.use(checkLogin({ include: [] }));

    function checkLogin(options: CheckLoginOptions) {
        return async (ctx: Context, next: Next) => {
            if (!(options.include || []).some(item => match(item, ctx.path).matches)) {
                return await next();
            }
            if ((options.exclude || []).some(item => match(item, ctx.path).matches)) {
                return await next();
            }

            const token = ctx.cookies.get(LOGIN_TOKEN);
            if (token) {
                // const { account, platform } = (ctx.request.body || {}) as RegisterMail & { platform: Platform };
                const data: LoginState = jwt.decode(token, config.secret.salt!);
                assert(data.expires > Date.now(), '登录失效');
            }
            await next();
        };
    }
}
