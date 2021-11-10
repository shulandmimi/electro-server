import koa from 'koa';
declare module 'koa' {
    interface DefaultContext {
        send(data: any): void;
    }

    interface Context {
        send(data: any): void;
    }
}
