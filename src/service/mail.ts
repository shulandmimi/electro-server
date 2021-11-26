import MailMapping from '../model/mail';
import redis, { DBMapping } from '../tools/redis';
import { select } from '../tools/redis';
import { UserModelState } from '../model/user';
import { PositionState } from '../model/position';
import md5 from 'md5';
import { DAY } from '../tools/time';
import { info } from '../tools/debug';
const debug = info.extend('mail');

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

const MAIL_SUBSCRIBE_KEY = 'SUBSCRIBE';

export interface ElectroUrgentState {
    findTime: string;
    electro: number;
    position: PositionState;
    user: UserModelState;
}

export async function pushElectronUrgentData(rawData: ElectroUrgentState[]) {
    const data = rawData.filter(item => !hasElectronUrgentMapping(`${item.user.id}${item.position.id}`));

    const ids = data.map(item => `${item.user.id}${item.position.id}`);
    debug('共 %d 个邮件需要发送\n%s', data.length, ids);
    if (!data.length) return;

    await select(DBMapping.SendMail);

    const d = await new Promise((resolve, reject) => {
        redis.lpush(
            MAIL_SUBSCRIBE_KEY,
            data.map(item => JSON.stringify(item)),
            err => {
                if (err) return reject(err);
                resolve(true);
            }
        );
    });
    await saveElectronUrgentMapping(ids);
    return d;
}

const MAIL_SUBSCRIBE_KEY_MAPPING = MAIL_SUBSCRIBE_KEY + '_MAPPING';

async function saveElectronUrgentMapping(key: string | string[]) {
    await select(DBMapping.SendMail);
    return new Promise((resolve, reject) => {
        redis.sadd(MAIL_SUBSCRIBE_KEY_MAPPING, key, err => {
            if (err) {
                reject(err);
                return;
            }
            resolve(true);
        });
    });
}

async function hasElectronUrgentMapping(key: string) {
    await select(DBMapping.SendMail);
    return new Promise((resolve, reject) => {
        redis.sismember(MAIL_SUBSCRIBE_KEY_MAPPING, key, (err, replay) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(Boolean(replay));
        });
    });
}

export async function getAlterMail(): Promise<ElectroUrgentState | null> {
    await select(DBMapping.SendMail);
    return new Promise((resolve, reject) => {
        redis.rpop(MAIL_SUBSCRIBE_KEY, (err, res) => {
            if (err) return reject(err);
            if (res) resolve(JSON.parse(res));
            else resolve(null);
        });
    });
}

const SEND_MAIL_LOCK_EXPIRES = DAY * 3;
const SEND_MAIL_LOCK_KEY = 'SEND_MAIL';
export async function saveAlreadySendMailPositionAndAccount(account: string, positionId: number) {
    await select(DBMapping.SendMail);
    return new Promise((resolve, reject) => {
        const key = md5(account + positionId);
        redis.setex(SEND_MAIL_LOCK_KEY + key, SEND_MAIL_LOCK_EXPIRES, '0', err => {
            if (err) {
                reject(err);
                return;
            }
            resolve(true);
        });
    });
}

export async function hasAlredySendMail(account: string, positionId: number) {
    await select(DBMapping.SendMail);
    return new Promise((resolve, reject) => {
        const key = md5(account + positionId);
        redis.exists(SEND_MAIL_LOCK_KEY + key, (err, count) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(Boolean(count));
        });
    });
}
