export interface IMutex {
    acquire: () => Promise<void>; // 不断轮询直到获取锁为止
    release: () => void; // 释放锁
}


export class EventMutex implements IMutex {
    private _queue: Function[] = [];
    private _maxConcurrency = 1; // 最大并发量为1

    constructor(maxConcurrency:number = 1){
        this._maxConcurrency = maxConcurrency;
    }

    async acquire() {
        if (this._maxConcurrency <= 0) {
            await new Promise<void>((resolve) => this._queue.push(resolve));
        }
        this._maxConcurrency--;
    }
    release() {
        this._maxConcurrency++;
        this._queue.shift()?.();
    }
}