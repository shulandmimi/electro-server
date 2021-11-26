import Application, { Context, Next } from 'koa';
import jwt from 'jwt-simple';
import { match } from 'node-match-path';
import assert from 'assert';
import config from '../config';
import redis, { select, DBMapping } from '../tools/redis';
import { DAY, SECONDS } from '../tools/time';
import { RegisterMail } from '../route/user';
import UserModel from '../model/user';
import { error } from '../tools/debug';
import { UserModelState } from '../model/user';

const REGISTER_MAIL_EXPIRE = SECONDS * 30;

export function registerMailKey(key: string, value: string) {
    return new Promise(async (resolve, reject) => {
        select(DBMapping.MailMapping);
        redis.setex(key, REGISTER_MAIL_EXPIRE, value, err => {
            if (err) return reject(err);
            resolve(true);
        });
    });
}

export function hasRegisterKey(key: string): Promise<boolean> {
    return new Promise(async resolve => {
        await select(DBMapping.MailMapping);
        redis.exists(key, (err, r) => {
            if (err) return resolve(false);
            resolve(Boolean(r));
        });
    });
}

export async function deleteRegisterKey(key: string) {
    await select(DBMapping.MailMapping);
    return new Promise(async resolve => {
        redis.del(key, err => {
            if (err) {
                error(err);
                resolve(false);
            } else resolve(true);
        });
    });
}

export function getRegisterValue(key: string): Promise<string | null> {
    return new Promise(async (resolve, reject) => {
        await select(DBMapping.MailMapping);
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
export async function genernalJWTAccount(ctx: Context): Promise<string> {
    const { account, platform } = ctx.request.body as RegisterMail & { platform: Platform };
    const userModel = await UserModel.findOne({ where: { account } });

    assert(userModel, '无效用户');
    const user = userModel.toJSON() as UserModelState;

    const key = jwt.encode({ account, expires: Date.now() + JWT_EXPIRES, platform, id: user.id }, config.secret.salt!);
    return key;
}

export interface LoginState {
    expires: number;
    id: number;
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
            const tokens = ctx.cookies.get(LOGIN_TOKEN);
            let jwtToken: LoginState | undefined;
            if (tokens) {
                jwtToken = jwt.decode(tokens, config.secret.salt!);
                ctx.tokens = jwtToken;
            }

            if (!(options.include || []).some(item => match(item, ctx.path).matches)) {
                return await next();
            }
            if ((options.exclude || []).some(item => match(item, ctx.path).matches)) {
                return await next();
            }

            if (jwtToken) {
                assert(jwtToken.expires > Date.now(), '登录失效');
            }
            await next();
        };
    }
}
