import redis from 'redis';
import config from '../config';
import { error } from './debug';

const client = redis.createClient({
    host: config.DB_HOST,
    auth_pass: config.redis.pass,
    port: config.redis.port,
});

export enum DBMapping {
    MailMapping = 0,
    SendMail,
}

export const select = async (c: DBMapping) =>
    new Promise(resolve => {
        client.select(c, err => {
            if (err) {
                error(err);
                resolve(false);
            } else resolve(true);
        });
    });

export default client;
