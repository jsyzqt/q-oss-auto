#!/usr/bin/env node

import { Command } from 'commander';
import upath from 'upath';
import { UpRun } from './upload';
import { deployRun } from './deploy';
const program = new Command();

program
    .option('-c, --config <path>', 'Configure file path.')
    .option('-u, --upload', 'Upload File to OSS.')
    .option('-d, --deploy', 'Deploy File from OSS to local.')
    .option('--sv, --setversion <version>', 'Set version name.')

program.parse();

const options = program.opts();
// console.log(options.upload)

if (options.config === undefined) {
    console.log('No confirgue file specified.')
} else if (options.upload || options.deploy) {
    const configFilePath = upath.resolve(options.config);
    console.log('Use configure file: %s', configFilePath)
    if(options.upload){
        UpRun(configFilePath, options.setversion);
    } else if(options.deploy){
        deployRun(configFilePath);
    }
}

