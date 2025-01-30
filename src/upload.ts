import fs from 'node:fs';
import path from 'node:path';
import OSS from 'ali-oss';
import upath from 'upath';
import { EventMutex } from './utils/mutex';
import timers from 'node:timers/promises';
import { Command } from 'commander';

type CONFIG_TYPE = {
    oss: {
        type: "ali-oss",
        config: {
            accessKeyId: string,
            accessKeySecret: string,
            bucket: string,
            region: string,
            secure: boolean
        },
        options: any
    }
    uploadConfig: {
        concurrent: number,
        versionControl: {
            enable: boolean,
            fixedName: string,
            namingTemplate: {}
        }
    },
    remoteSource: string,
    localSource: string,
    deployPath: string,
    include: string[],
    exclude: string[],
    exec: string[]
}

const getAllFiles = async (dir: string): Promise<string[]> => {
    const dirents = await fs.promises.readdir(dir, { withFileTypes: true });
    const files = await Promise.all(dirents.map(dirent => {
        const res = upath.join(dir, dirent.name);
        return dirent.isDirectory() ? getAllFiles(res) : res;
    }));
    return files.flat();
}


export const UpRun = async (configFilePath:string) => {
    const configStr = await fs.promises.readFile(configFilePath, { encoding: 'utf8' });
    const config: CONFIG_TYPE = JSON.parse(configStr);

    let aliOSSStore = new OSS(config.oss.config);

    const allFilePaths = await getAllFiles(upath.resolve(config.localSource));

    const mutex = new EventMutex(config.uploadConfig.concurrent);

    const aa = await Promise.all(allFilePaths.map(async (pathString) => {
        await mutex.acquire();
        const relativePath = upath.toUnix(upath.relative(config.localSource, pathString));

        const versionName = config.uploadConfig.versionControl.enable ? config.uploadConfig.versionControl.fixedName : '';

        const remotePath = upath.join(config.remoteSource, versionName, relativePath);
        // await timers.setTimeout(1000);
        const res = await aliOSSStore.put(remotePath, Buffer.from(pathString), config.oss.options);

        console.log('已上传：%s -> %s', pathString, remotePath);
        mutex.release();
        return {
            localFilePath:pathString,
            remoteFilePath:remotePath
        };
    }));

    // console.log(aa)
};


