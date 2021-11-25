import redis from 'redis';

const client = redis.createClient();

export enum DBMapping {
    MailMapping = 0,
}

export const select = (c: DBMapping) => client.select(c);

export default client;
