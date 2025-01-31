#!/usr/bin/env node

import { Command } from 'commander';
import upath from 'upath';
import { UpRun } from './upload';
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
} else if (options.upload) {
    const configFilePath = upath.resolve(options.config);
    console.log('Use configure file: %s', configFilePath)
    UpRun(configFilePath, options.setversion);
}

