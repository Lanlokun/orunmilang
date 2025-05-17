import chalk from 'chalk';
import { Command } from 'commander';
import { OrunmilangLanguageMetaData } from '../language/generated/module.js';
import { createOrunmilangServices } from '../language/orunmilang-module.js';
import { extractAstNode } from './cli-util.js';
import { generateJavaScript } from './generator.js';
import { NodeFileSystem } from 'langium/node';
import * as url from 'node:url';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
const __dirname = url.fileURLToPath(new URL('.', import.meta.url));
const packagePath = path.resolve(__dirname, '..', '..', 'package.json');
const packageContent = await fs.readFile(packagePath, 'utf-8');
export const generateAction = async (fileName, opts) => {
    const services = createOrunmilangServices(NodeFileSystem).Orunmilang;
    const program = await extractAstNode(fileName, services);
    const generatedFilePath = generateJavaScript(program, fileName, opts.destination);
    console.log(chalk.green(`JavaScript code generated successfully: ${generatedFilePath}`));
};
export default function () {
    const program = new Command();
    program.version(JSON.parse(packageContent).version);
    const fileExtensions = OrunmilangLanguageMetaData.fileExtensions.join(', ');
    program
        .command('generate')
        .argument('<file>', `source file (possible file extensions: ${fileExtensions})`)
        .option('-d, --destination <dir>', 'destination directory of generation')
        .description('generates JavaScript code from Orunmilang source file')
        .action(generateAction);
    program.parse(process.argv);
}
//# sourceMappingURL=main.js.map