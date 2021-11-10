import Application from 'koa';
import addSend from './addSend';
import computerTime from './time';
import catchError from './catchError';
import cors from './cors';
import proxy from './proxy';

export default function startMiddle(app: Application) {
    [computerTime, addSend, catchError, cors, proxy].forEach(middle => middle(app));
}
