import type { LanguageClientOptions, ServerOptions} from 'vscode-languageclient/node.js';
import * as vscode from 'vscode';
import { URI } from 'langium';
import { createOrunmilangServices } from '../language/orunmilang-module.js';
import { simulateExecution } from '../language/orunmilang-interpreter.js';
import * as path from 'node:path';
import { LanguageClient, TransportKind } from 'vscode-languageclient/node.js';

let client: LanguageClient;


export const fileSystemProvider = (_services: any) => ({
    stat: vscode.workspace.fs.stat.bind(vscode.workspace.fs),

    readDirectory: async (uri: vscode.Uri) => {
        const entries = await vscode.workspace.fs.readDirectory(uri);
        return entries.map(([name, fileType]) => {
        const isDirectory = (fileType & vscode.FileType.Directory) !== 0;
        const isFile = !isDirectory;
        const childUri = URI.parse(path.posix.join(uri.toString(), name));

        return {
            name,
            type: isDirectory ? 'directory' : 'file',
            isDirectory,
            isFile,
            uri: childUri
        };
        });
    },

    createDirectory: vscode.workspace.fs.createDirectory.bind(vscode.workspace.fs),

    readFile: async (resource: vscode.Uri): Promise<string> => {
        const bytes = await vscode.workspace.fs.readFile(resource);
        return new TextDecoder().decode(bytes);
    },

    writeFile: async (resource: vscode.Uri, content: string): Promise<void> => {
        const encoded = new TextEncoder().encode(content);
        await vscode.workspace.fs.writeFile(resource, encoded);
    },

    delete: vscode.workspace.fs.delete.bind(vscode.workspace.fs),

    rename: vscode.workspace.fs.rename.bind(vscode.workspace.fs),

    watch: (_uri: vscode.Uri, _options?: { recursive: boolean; excludes?: string[] }) => ({
        dispose() {
        // no-op for watch
        }
    }),
});


const services = createOrunmilangServices({
  fileSystemProvider
});


// This function is called when the extension is activated.
export function activate(context: vscode.ExtensionContext): void {
    client = startLanguageClient(context);

    context.subscriptions.push(
        vscode.commands.registerCommand('orunmilang.run', async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showErrorMessage('Open an Orunmilang file to run.');
                return;
            }

            const code = editor.document.getText();

            try {
                // Create Langium document from the editor content
                const langiumDocumentFactory = services.shared.workspace.LangiumDocumentFactory;
                const documentBuilder = services.shared.workspace.DocumentBuilder;

                const doc = langiumDocumentFactory.fromString(code, URI.parse('memory://current.oru'));
                await documentBuilder.build([doc]);

                if (doc.diagnostics && doc.diagnostics.length > 0) {
                    vscode.window.showErrorMessage('Validation errors in code; fix before running.');
                    doc.diagnostics.forEach(d => {
                        console.error(`[${d.severity}] ${d.message}`);
                    });
                    return;
                }

                // No diagnostics: run the interpreter
                    const output = simulateExecution(doc.parseResult.value);
                    const outputChannel = vscode.window.createOutputChannel('Orunmilang Output');
                    outputChannel.show(true);
                    outputChannel.appendLine(output);

                vscode.window.showInformationMessage('Orunmilang program executed. Check console output.');
            } catch (err) {
                vscode.window.showErrorMessage(`Error executing Orunmilang code: ${err instanceof Error ? err.message : err}`);
            }
        })
    );
}

// This function is called when the extension is deactivated.
export function deactivate(): Thenable<void> | undefined {
    if (client) {
        return client.stop();
    }
    return undefined;
}

function startLanguageClient(context: vscode.ExtensionContext): LanguageClient {
    const serverModule = context.asAbsolutePath(path.join('out', 'language', 'main.cjs'));
    // The debug options for the server
    // --inspect=6009: runs the server in Node's Inspector mode so VS Code can attach to the server for debugging.
    // By setting `process.env.DEBUG_BREAK` to a truthy value, the language server will wait until a debugger is attached.
    const debugOptions = { execArgv: ['--nolazy', `--inspect${process.env.DEBUG_BREAK ? '-brk' : ''}=${process.env.DEBUG_SOCKET || '6009'}`] };

    // If the extension is launched in debug mode then the debug server options are used
    // Otherwise the run options are used
    const serverOptions: ServerOptions = {
        run: { module: serverModule, transport: TransportKind.ipc },
        debug: { module: serverModule, transport: TransportKind.ipc, options: debugOptions }
    };

    // Options to control the language client
    const clientOptions: LanguageClientOptions = {
        documentSelector: [{ scheme: '*', language: 'orunmilang' }]
    };

    // Create the language client and start the client.
    const client = new LanguageClient(
        'orunmilang',
        'orunmilang',
        serverOptions,
        clientOptions
    );

    // Start the client. This will also launch the server
    client.start();
    return client;
}
