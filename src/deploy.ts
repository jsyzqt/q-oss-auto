import fs from 'node:fs';
import OSS from 'ali-oss';
import upath from 'upath';
// import path from 'node:path';
import { EventMutex } from './utils/mutex';
import { CONFIG_TYPE } from './interface';
import { trimPath, checkEmpty } from './utils/utils';

const ossListAllFiles = async (aliOSSStore: OSS, remotePath: string, traverse: boolean = true) => {
    let allFileListStore: OSS.ObjectMeta[][] = [];
    let prefixes: string[][] = [];

    let continuationToken = undefined;

    // console.log({
    //     prefix: remotePath,
    //     'continuation-token': continuationToken,
    //     // delimiter:'/',
    //     // delimiter: traverse ? undefined : '/',
    //     'max-keys': '100',
    //     ... traverse ? {} : {delimiter: '/'}
    // })

    do {
        const result = await aliOSSStore.listV2({
            prefix: remotePath,
            'continuation-token': continuationToken,
            
            // delimiter: traverse ? undefined : '/',
            'max-keys': '100',
            // delimiter:'/',
            ... traverse ? {} : {delimiter: '/'}
        }, {});;

        //@ts-ignore
        continuationToken = result.nextContinuationToken;
        // console.log(result.prefixes)
        const f = result.objects;

        allFileListStore.push(f);
        if(result.prefixes){
            prefixes.push(result.prefixes)
        }
        // console.log(result)
        // prefixes.push(result.prefixes)
        
    } while (continuationToken);

    return {
        objects: allFileListStore.flat(),
        prefixes: prefixes.flat()
    };
}


// const downRun = async (configFilePath: string) => {
// }

const getConfig = async (configFilePath: string) => {
    const configStr = await fs.promises.readFile(configFilePath, { encoding: 'utf8' });
    const config: CONFIG_TYPE = JSON.parse(configStr);

    config.remoteSource = trimPath(config.remoteSource);
    return config;
}

const runListAllFiles = async (config: CONFIG_TYPE, aliOSSStore: OSS) => {




    //@ts-ignore
    config.deployConfig.versionUsed = config.deployConfig.versionUsed.toLowerCase();

    // const rootVersion = await ossListAllFiles(aliOSSStore, config.remoteSource, false);
    // const t = rootVersion.objects.map(e => {
    //     return upath.relative(config.remoteSource, e.name);
    // }).filter(item => item != null && item !== '');

    if (config.deployConfig.versionUsed == 'disable') {


        const allFileList = await ossListAllFiles(aliOSSStore, config.remoteSource);
        const aa = allFileList.objects.map(e => {
            return upath.relative(config.remoteSource, e.name);
        }).filter(item => item != null && item !== '');
        // console.log(aa);
        return { filelist: aa, sourceRoot: config.remoteSource };
    } else if (config.deployConfig.versionUsed == 'latest') {
        // console.log(upath.join(config.remoteSource, '/'))
        const f = await ossListAllFiles(aliOSSStore, upath.join(config.remoteSource, '/'), false);
        // console.log(f)
        let versionFolders = f.prefixes;

        // let versionTime = versionFolders.map(f=>{
        //     return Number(f.split('-')[0]);
        // });

        let b = versionFolders.sort((a, b) => {
            // console.log((upath.relative(config.remoteSource, a)))
            return Number((upath.relative(config.remoteSource, b)).split('-')[0]) - Number((upath.relative(config.remoteSource, a)).split('-')[0]);
        });
        // console.log(b)

        const allFileList = await ossListAllFiles(aliOSSStore, b[0]);
        const aa = allFileList.objects.map(e => {
            return upath.relative(b[0], e.name);
        }).filter(item => item != null && item !== '');

        return { filelist: aa, sourceRoot: b[0] };
    }

    // console.log(aa)
}

const runStart1 = async (config: CONFIG_TYPE) => {

    let aliOSSStore = new OSS(config.oss.config);

    const result = await runListAllFiles(config, aliOSSStore);

    // console.log(result)

    if (result === undefined) {
        return;
    }

    const folderNames = result?.filelist.map(f => {
        const s = f.split('/');
        const a = s[s.length - 1];
        return f.slice(0, f.length - a.length);
    }).filter(item => item != null && item !== '').map(f => {
        return f.slice(0, -1);
    })

    // console.log(folderNames)
    // console.log(upath.basename(result.sourceRoot))

    await Promise.all(folderNames.map(async f => {
        const newDirPath = upath.join(upath.resolve(config.deployPath), upath.basename(result.sourceRoot), f);
        console.log(newDirPath)
        await fs.promises.mkdir(newDirPath, { recursive: true })
    }));

    const mutex = new EventMutex(config.deployConfig && config.deployConfig.concurrent?config.deployConfig.concurrent:10);

    const a = await Promise.all(result.filelist.map(async f => {
        const pRemote = upath.join(result.sourceRoot, f);
        const pLocal = upath.join(upath.resolve(config.deployPath), upath.basename(result.sourceRoot), f)
        console.log(pLocal);
        await mutex.acquire();
        const res = await aliOSSStore.get(pRemote, pLocal);
        // console.log(res)
        mutex.release();
        return res;
    }));

    if(config.deployConfig.autoActivate){
        //activated
        const activatedDirPath = upath.join(upath.resolve(config.deployPath), 'activated');
        const newVersionDirPath = upath.join(upath.resolve(config.deployPath), upath.basename(result.sourceRoot));
        
        try{
            const stat = await fs.promises.lstat(activatedDirPath);
            if(stat.isSymbolicLink()){
                await fs.promises.unlink(activatedDirPath);
            } else {
                throw 'isnotsymlink';
            }
        } catch(e){
            if(typeof e == 'string' && e == 'isnotsymlink'){
                throw new Error('`activated` directory is exist, and is not a symbolic link.')
            }
        }

        await fs.promises.symlink(newVersionDirPath, activatedDirPath, 'dir');
    }

    // console.log(a);

    // console.log(bb)
}

export const deployRun = (configFilePath: string) =>{
    getConfig(configFilePath).then((config) => {
        runStart1(config);
    });
}
