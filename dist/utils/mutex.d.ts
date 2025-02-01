export interface IMutex {
    acquire: () => Promise<void>;
    release: () => void;
}
export declare class EventMutex implements IMutex {
    private _queue;
    private _maxConcurrency;
    constructor(maxConcurrency?: number);
    acquire(): Promise<void>;
    release(): void;
}
//# sourceMappingURL=mutex.d.ts.map