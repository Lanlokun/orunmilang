#!/usr/bin/env node
import * as fs from 'fs';
import * as path from 'path';
import { URI } from 'langium';
import { DiagnosticSeverity } from 'vscode-languageserver';
import { createOrunmilangServices } from '../language/orunmilang-module.js';
import { simulateExecution } from '../language/orunmilang-interpreter.js';
import { NodeFileSystemProvider } from 'langium/node';
async function main() {
    const args = process.argv.slice(2);
    if (args.length === 0) {
        console.error('Usage: orunmilang <file.orunmilang>');
        process.exit(1);
    }
    const filePath = path.resolve(args[0]);
    const code = fs.readFileSync(filePath, 'utf-8');
    const fileSystemProvider = (services) => new NodeFileSystemProvider();
    const services = createOrunmilangServices({ fileSystemProvider });
    const langiumDocumentFactory = services.shared.workspace.LangiumDocumentFactory;
    const documentBuilder = services.shared.workspace.DocumentBuilder;
    const doc = langiumDocumentFactory.fromString(code, URI.file(filePath));
    await documentBuilder.build([doc]);
    // Get parser errors manually
    const parserErrors = doc.parseResult.parserErrors.map(err => {
        const startLine = err.token?.startLine ?? 1;
        const startColumn = err.token?.startColumn ?? 1;
        const endLine = err.token?.endLine ?? startLine;
        const endColumn = err.token?.endColumn ?? startColumn;
        return {
            message: err.message,
            severity: DiagnosticSeverity.Error,
            range: {
                start: { line: startLine - 1, character: startColumn - 1 },
                end: { line: endLine - 1, character: endColumn - 1 }
            },
            source: 'parser'
        };
    });
    // Combine with validation diagnostics
    const validationDiagnostics = doc.diagnostics ?? [];
    const allDiagnostics = [...parserErrors, ...validationDiagnostics];
    if (allDiagnostics.length > 0) {
        console.error('Errors in Orunmilang code:');
        for (const d of allDiagnostics) {
            console.error(`[${d.severity === 1 ? 'Error' : 'Warning'}] (${d.range.start.line + 1}:${d.range.start.character + 1}) ${d.message}`);
        }
        process.exit(1);
    }
    const output = simulateExecution(doc.parseResult.value);
    if (output.trim()) {
        console.log(output.trim());
    }
    else if (output) {
        console.log('(empty output)');
    }
}
main().catch(err => {
    console.error('Error running Orunmilang file:', err);
    process.exit(1);
});
//# sourceMappingURL=orunmilang-cli.js.map