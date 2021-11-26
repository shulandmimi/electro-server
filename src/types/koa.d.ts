import koa from 'koa';
import { StatusCode } from '../tools/types';
import { LoginState } from '../service/user';

declare module 'koa' {
    interface DefaultContext {
        send(data: any): void;
        /** sendSuccess */
        sendS(): void;
        /** sendSuccessAndData */
        sendSD(data: any): void;
        /** sendSuccessAndDataAndMessage */
        sendSDM(data: any, msg: string): void;
        /** sendSuccessAndMessage */
        sendM(msg: string): void;
        /** sendSuccessOnlyMessage */
        sendOM(msg: string): void;
        /** sendFailedAndMessage */
        sendF(msg: string, code: StatusCode): void;
        tokens?: LoginState;
    }

}
