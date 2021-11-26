import redis from 'redis';
import { error } from './debug';

const client = redis.createClient();

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
