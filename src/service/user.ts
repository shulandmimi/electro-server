import redis, { select, DBMapping } from '../tools/redis';
import { SECONDS } from '../tools/time';

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
