"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventMutex = void 0;
class EventMutex {
    constructor(maxConcurrency = 1) {
        this._queue = [];
        this._maxConcurrency = 1; // 最大并发量为1
        this._maxConcurrency = maxConcurrency;
    }
    async acquire() {
        if (this._maxConcurrency <= 0) {
            await new Promise((resolve) => this._queue.push(resolve));
        }
        this._maxConcurrency--;
    }
    release() {
        var _a;
        this._maxConcurrency++;
        (_a = this._queue.shift()) === null || _a === void 0 ? void 0 : _a();
    }
}
exports.EventMutex = EventMutex;
//# sourceMappingURL=mutex.js.map