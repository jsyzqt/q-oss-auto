"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deployRun = void 0;
const node_fs_1 = __importDefault(require("node:fs"));
const ali_oss_1 = __importDefault(require("ali-oss"));
const upath_1 = __importDefault(require("upath"));
// import path from 'node:path';
const mutex_1 = require("./utils/mutex");
const utils_1 = require("./utils/utils");
const ossListAllFiles = async (aliOSSStore, remotePath, traverse = true) => {
    let allFileListStore = [];
    let prefixes = [];
    let continuationToken = undefined;
    do {
        const result = await aliOSSStore.listV2({
            prefix: remotePath,
            'continuation-token': continuationToken,
            delimiter: traverse ? '' : '/',
            'max-keys': '100'
        }, {});
        ;
        //@ts-ignore
        continuationToken = result.nextContinuationToken;
        // console.log(result.prefixes)
        const f = result.objects;
        allFileListStore.push(f);
        prefixes.push(result.prefixes);
    } while (continuationToken);
    return {
        objects: allFileListStore.flat(),
        prefixes: prefixes.flat()
    };
};
// const downRun = async (configFilePath: string) => {
// }
const getConfig = async (configFilePath) => {
    const configStr = await node_fs_1.default.promises.readFile(configFilePath, { encoding: 'utf8' });
    const config = JSON.parse(configStr);
    config.remoteSource = (0, utils_1.trimPath)(config.remoteSource);
    return config;
};
const runListAllFiles = async (config, aliOSSStore) => {
    //@ts-ignore
    config.deployConfig.versionUsed = config.deployConfig.versionUsed.toLowerCase();
    if (config.deployConfig.versionUsed == 'disable') {
        const allFileList = await ossListAllFiles(aliOSSStore, config.remoteSource);
        const aa = allFileList.objects.map(e => {
            return upath_1.default.relative(config.remoteSource, e.name);
        }).filter(item => item != null && item !== '');
        // console.log(aa);
        return { filelist: aa, sourceRoot: config.remoteSource };
    }
    if (config.deployConfig.versionUsed == 'latest') {
        const f = await ossListAllFiles(aliOSSStore, config.remoteSource, false);
        let versionFolders = f.prefixes;
        // let versionTime = versionFolders.map(f=>{
        //     return Number(f.split('-')[0]);
        // });
        let b = versionFolders.sort((a, b) => {
            // console.log((upath.relative(config.remoteSource, a)))
            return Number((upath_1.default.relative(config.remoteSource, b)).split('-')[0]) - Number((upath_1.default.relative(config.remoteSource, a)).split('-')[0]);
        });
        const allFileList = await ossListAllFiles(aliOSSStore, b[0]);
        const aa = allFileList.objects.map(e => {
            return upath_1.default.relative(b[0], e.name);
        }).filter(item => item != null && item !== '');
        // console.log(aa);
        // return aa;
        return { filelist: aa, sourceRoot: b[0] };
    }
    // console.log(aa)
};
const runStart1 = async (config) => {
    let aliOSSStore = new ali_oss_1.default(config.oss.config);
    const result = await runListAllFiles(config, aliOSSStore);
    if (result === undefined) {
        return;
    }
    const folderNames = result === null || result === void 0 ? void 0 : result.filelist.map(f => {
        const s = f.split('/');
        const a = s[s.length - 1];
        return f.slice(0, f.length - a.length);
    }).filter(item => item != null && item !== '').map(f => {
        return f.slice(0, -1);
    });
    await Promise.all(folderNames.map(async (f) => {
        // console.log(upath.join(upath.resolve(config.deployPath), f))
        await node_fs_1.default.promises.mkdir(upath_1.default.join(upath_1.default.resolve(config.deployPath), f), { recursive: true });
    }));
    const mutex = new mutex_1.EventMutex(config.deployConfig && config.deployConfig.concurrent ? config.deployConfig.concurrent : 10);
    const a = await Promise.all(result.filelist.map(async (f) => {
        const pRemote = upath_1.default.join(result.sourceRoot, f);
        const pLocal = upath_1.default.join(upath_1.default.resolve(config.deployPath), f);
        // console.log(pLocal);
        await mutex.acquire();
        const res = await aliOSSStore.get(pRemote, pLocal);
        // console.log(res)
        mutex.release();
        return res;
    }));
    console.log(a);
    // console.log(bb)
};
const deployRun = (configFilePath) => {
    getConfig(configFilePath).then((config) => {
        runStart1(config);
    });
};
exports.deployRun = deployRun;
//# sourceMappingURL=deploy.js.map