#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const upath_1 = __importDefault(require("upath"));
const upload_1 = require("./upload");
const deploy_1 = require("deploy");
const program = new commander_1.Command();
program
    .option('-c, --config <path>', 'Configure file path.')
    .option('-u, --upload', 'Upload File to OSS.')
    .option('-d, --deploy', 'Deploy File from OSS to local.')
    .option('--sv, --setversion <version>', 'Set version name.');
program.parse();
const options = program.opts();
// console.log(options.upload)
if (options.config === undefined) {
    console.log('No confirgue file specified.');
}
else if (options.upload || options.deploy) {
    const configFilePath = upath_1.default.resolve(options.config);
    console.log('Use configure file: %s', configFilePath);
    if (options.upload) {
        (0, upload_1.UpRun)(configFilePath, options.setversion);
    }
    else if (options.deploy) {
        (0, deploy_1.deployRun)(configFilePath);
    }
}
//# sourceMappingURL=index.js.map