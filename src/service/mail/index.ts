import MailMapping from '../../model/mail';
import redis, { DBMapping } from '../../tools/redis';
import { select } from '../../tools/redis';
import md5 from 'md5';
import { DAY } from '../../tools/time';
import { info } from '../../tools/debug';
import { ElectroUrgentState } from './interface';
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

/**
 *
 * 低于阀值对用户邮件列表key
 *
 * 使用先进先出列表
 *
 * */
const MAIL_SUBSCRIBE_KEY = 'SUBSCRIBE';
/**
 * 将需要发出警告对用户信息存到redis中，等待发送
 */
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
/**
 * 将已进入待发送列表中对用户key添加到集合中，避免重复添加到待发送列表中
 */
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

/**
 * 查看用户是否在待发送列表中
 */
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

/**
 * 发送邮件后，将用户从待发送列表中拉出
 */
export async function removeElectroUrgentMapping(key: string) {
    await select(DBMapping.SendMail);
    return new Promise((resolve, reject) => {
        redis.srem(MAIL_SUBSCRIBE_KEY_MAPPING, key, (err, replay) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(Boolean(replay));
        });
    });
}

/**
 * 从redis中获取一个需要发送警告的用户信息
 */
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

/**
 *
 * 对发送邮件对用户进行映射，避免用户池少时短时间内多次发送邮件
 *
 * 同时也是对发送邮件的频率进行限制
 */
/** 一封邮件后的封禁天数 */
const SEND_MAIL_LOCK_EXPIRES = DAY * 3;
/** 邮件封禁key */
const SEND_MAIL_LOCK_KEY = 'SEND_MAIL';
/**
 * 保存用户到已发送列表中
 * 目前期限: 3d
 **/
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

/** 查看是否在已发送邮件列表中 */
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
