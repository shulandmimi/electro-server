import Router from '@koa/router';
import md5 from 'md5';
import assert from 'assert';
import UserModel, { UserModelState } from '../model/user';
import { registerMailKey, hasRegisterKey, deleteRegisterKey, getRegisterValue, genernalJWTAccount, LOGIN_TOKEN, JWT_EXPIRES } from '../service/user';
import { sendMail, MailOption } from '../scripts/mail';
import config from '../config';
import { isEmail, isPassword } from '../tools/check';
import { info } from '../tools/debug';
const debug = info.extend('user: ');

const route = new Router({ prefix: '/user' });

export interface RegisterMail {
    account: string;
    password: string;
}

function genernalMailTemplate(title: string, text: string, html: string): MailOption['mail'] {
    return {
        subject: title,
        text,
        html,
    };
}

const tokenKey = 'token';

function genernalValidUrl(token: string) {
    return `${config.application.host}/user/validRegisterMail?${tokenKey}=${token}`;
}

route.post('/registerMailUser', async ctx => {
    const { account, password } = ctx.request.body as RegisterMail;

    assert(isEmail(account), '邮箱格式错误');
    assert(isPassword(password), '密码格式错误');

    debug('用户：%s 密码：%s 发起注册', account, password);

    const user = await UserModel.findOne({ where: { account } });

    assert(!user, '用户已存在');

    const key = md5(account + config.secret.salt);
    assert(!(await hasRegisterKey(key)), '验证码发送过于频繁，请稍后再试');

    await registerMailKey(key, JSON.stringify([account, md5(password)]));

    const validUrl = genernalValidUrl(key as string);
    await sendMail(account, {
        mail: genernalMailTemplate(
            'electro-注册帐号',
            `你的验证地址是: ${validUrl}，请点击前往`,
            `你的验证地址是: <a href="${validUrl}">${validUrl}</a>，请点击前往`
        ),
    });

    ctx.sendS();
});

route.get('/validRegisterMail', async ctx => {
    const { [tokenKey]: token } = ctx.query as { [key: string]: string | undefined };
    debug('%s 验证注册', token);

    assert(token || hasRegisterKey(token!), '无效链接，请稍后再试');

    const rawVal = await getRegisterValue(token!);

    assert(rawVal, '无效链接，请稍后再试');
    const [account, password] = JSON.parse(rawVal) as [UserModelState['account'], UserModelState['password']];

    try {
        debug('%s 进行注册', account);
        await UserModel.create({ account, password });
    } catch (error: any) {
        ctx.body = error.message;
    }

    deleteRegisterKey(token!);
    debug('%s 注册成功', token);

    ctx.sendOM('注册成功');
});

route.post('/login', async ctx => {
    const { account, password } = ctx.request.body as RegisterMail;

    assert(isEmail(account), '邮箱格式错误');
    assert(isPassword(password), '密码格式错误');

    const passwordMD5 = md5(password);

    debug('用户: %s 密码: %s 发起登录', account, passwordMD5);

    const user = await UserModel.findOne({
        where: {
            account,
            password: passwordMD5,
        },
    });

    assert(user, '用户帐号或密码错误');

    const key = await genernalJWTAccount(ctx);

    ctx.response.set('Set-Cookie', `${LOGIN_TOKEN}=${key}; max-age=${JWT_EXPIRES}; path=/`);
    ctx.sendS();
});

export default route;
