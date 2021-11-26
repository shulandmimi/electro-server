import MailMapping from '../model/mail';
import UserModel from '../model/user';

/** 将用户的邮箱和房间映射 */
export async function subscribeMail(accountId: number, positionId: number) {
    return await MailMapping.create({
        accountId,
        positionId,
    });
}

/** 解除映射 */
export async function desubscribeMail(accountId: number, positionId: number) {
    return await MailMapping.destroy({
        where: {
            accountId,
            positionId,
        },
    });
}
