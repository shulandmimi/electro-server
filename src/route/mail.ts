import Router from '@koa/router';
import assert from 'assert';
import { desubscribeMail, subscribeMail } from '../service/mail';
import UserModel from '../model/user';

const route = new Router({ prefix: '/mail' });

interface SubscribeMail {
    positionId: number;
}

interface DeSubscribeMail {
    positionId: number;
    account: string;
}

route.post('/subscribeMail', async ctx => {
    const { positionId } = ctx.request.body as SubscribeMail;
    const tokens = ctx.tokens!;

    assert(tokens, '未登录');

    await subscribeMail(tokens.id, positionId);

    ctx.sendS();
});

route.get('/deSubscribeMail', async ctx => {
    const { positionId, account: rawAccount } = ctx.request.query as any as DeSubscribeMail;

    const tokens = ctx.tokens;
    const account = rawAccount || tokens?.account;

    assert(account, '非法用户');

    const user = await UserModel.findOne({
        where: { account: account },
    });

    assert(user, '非法用户');

    await desubscribeMail(user.id, positionId);

    ctx.sendS();
});

export default route;
