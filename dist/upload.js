"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpRun = void 0;
const node_fs_1 = __importDefault(require("node:fs"));
const ali_oss_1 = __importDefault(require("ali-oss"));
const upath_1 = __importDefault(require("upath"));
const mutex_1 = require("./utils/mutex");
const utils_1 = require("./utils/utils");
const getAllFiles = async (dir) => {
    const dirents = await node_fs_1.default.promises.readdir(dir, { withFileTypes: true });
    const files = await Promise.all(dirents.map(dirent => {
        const res = upath_1.default.join(dir, dirent.name);
        return dirent.isDirectory() ? getAllFiles(res) : res;
    }));
    return files.flat();
};
const UpRun = async (configFilePath, versionName) => {
    const configStr = await node_fs_1.default.promises.readFile(configFilePath, { encoding: 'utf8' });
    const config = JSON.parse(configStr);
    config.remoteSource = (0, utils_1.trimPath)(config.remoteSource);
    let aliOSSStore = new ali_oss_1.default(config.oss.config);
    const allFilePaths = await getAllFiles(upath_1.default.resolve(config.localSource));
    const mutex = new mutex_1.EventMutex(config.uploadConfig && config.uploadConfig.concurrent ? config.uploadConfig.concurrent : 10);
    const versionCtrl = config.uploadConfig.versionControl.toLowerCase();
    let versionStr = '';
    if (versionCtrl === 'disable') {
        versionStr = '';
    }
    if (versionCtrl === 'manual') {
        if (versionName !== undefined) {
            versionStr = `${String(Date.now())}-${versionName}`;
        }
        else {
            throw new Error('Empty version name.');
        }
    }
    // if (versionCtrl === 'auto') {
    //     const vstr = `${String(Date.now())}-v`
    // }
    const aa = await Promise.all(allFilePaths.map(async (pathString) => {
        await mutex.acquire();
        const relativePath = upath_1.default.toUnix(upath_1.default.relative(config.localSource, pathString));
        const remotePath = upath_1.default.join(config.remoteSource, versionStr, relativePath);
        // await timers.setTimeout(1000);
        const buf = await node_fs_1.default.promises.readFile(pathString);
        const res = await aliOSSStore.put(remotePath, buf, config.oss.options);
        console.log('已上传：%s -> %s', pathString, remotePath);
        mutex.release();
        return {
            localFilePath: pathString,
            remoteFilePath: remotePath
        };
    }));
    // console.log(aa)
};
exports.UpRun = UpRun;
//# sourceMappingURL=upload.js.map