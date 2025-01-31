import fs from 'node:fs';
import OSS from 'ali-oss';
import upath from 'upath';
import { EventMutex } from './utils/mutex';
import timers from 'node:timers/promises';
import { CONFIG_TYPE } from './interface';



const getAllFiles = async (dir: string): Promise<string[]> => {
    const dirents = await fs.promises.readdir(dir, { withFileTypes: true });
    const files = await Promise.all(dirents.map(dirent => {
        const res = upath.join(dir, dirent.name);
        return dirent.isDirectory() ? getAllFiles(res) : res;
    }));
    return files.flat();
}


export const UpRun = async (configFilePath: string, versionName?: string) => {
    const configStr = await fs.promises.readFile(configFilePath, { encoding: 'utf8' });
    const config: CONFIG_TYPE = JSON.parse(configStr);

    let aliOSSStore = new OSS(config.oss.config);

    const allFilePaths = await getAllFiles(upath.resolve(config.localSource));

    const mutex = new EventMutex(config.uploadConfig.concurrent);

    const versionCtrl = config.uploadConfig.versionControl.toLowerCase();
    let versionStr = '';
    if (versionCtrl === 'disable') {
        versionStr = '';
    }
    if (versionCtrl === 'manual') {
        if (versionName !== undefined) {
            versionStr = `${String(Date.now())}-${versionName}`;
        } else {
            throw new Error('Empty version name.')
        }
    }
    // if (versionCtrl === 'auto') {
    //     const vstr = `${String(Date.now())}-v`
    // }


    const aa = await Promise.all(allFilePaths.map(async (pathString) => {
        await mutex.acquire();
        const relativePath = upath.toUnix(upath.relative(config.localSource, pathString));



        const remotePath = upath.join(config.remoteSource, versionStr, relativePath);
        // await timers.setTimeout(1000);
        const res = await aliOSSStore.put(remotePath, Buffer.from(pathString), config.oss.options);

        console.log('已上传：%s -> %s', pathString, remotePath);
        mutex.release();
        return {
            localFilePath: pathString,
            remoteFilePath: remotePath
        };
    }));

    // console.log(aa)
};


