import { beforeAll, describe, expect, test } from "vitest";
import { EmptyFileSystem, type LangiumDocument } from "langium";
import { expandToString as s } from "langium/generate";
import { parseHelper } from "langium/test";
import type { Diagnostic } from "vscode-languageserver-types";
import { createOrunmilangServices } from "../../src/language/orunmilang-module.js";
import { Program, isProgram } from "../../src/language/generated/ast.js";

let services: ReturnType<typeof createOrunmilangServices>;
let parse: ReturnType<typeof parseHelper<Program>>;
let document: LangiumDocument<Program> | undefined;

beforeAll(async () => {
    services = createOrunmilangServices(EmptyFileSystem);
    const doParse = parseHelper<Program>(services.Orunmilang);
    parse = (input: string) => doParse(input, { validation: true });
});

describe('Orunmilang Validation', () => {
    test('no validation errors for correct input', async () => {
        document = await parse(`
            tẹ("Hello");
            tẹ("World");
        `);

        expect(
            checkDocumentValid(document) || document?.diagnostics?.map(diagnosticToString)?.join('\n')
        ).toHaveLength(0);  // Expect no validation errors
    });

    test('correct variable declaration and assignment', async () => {
        document = await parse(`
            pa x pẹlu 5;
            tẹ(x);
        `);

        expect(
            checkDocumentValid(document) || document?.diagnostics?.map(diagnosticToString)?.join('\n')
        ).toHaveLength(0);  // Expect no validation errors
    });

    test('validation error for using undeclared variable', async () => {
        document = await parse(`
            tẹ(undeclaredVar);
        `);

        const diagnostics = document?.diagnostics?.map(diagnosticToString)?.join('\n') || '';
        expect(diagnostics).toContain('Could not resolve reference');
    });


    test('correct variable assignment', async () => {
        document = await parse(`
            pa x pẹlu 10;
            x fi 20;
        `);
        expect(checkDocumentValid(document)).toBeUndefined();
        expect(document?.diagnostics?.length).toBe(0);
    });

    test('validation error for assignment to undeclared variable', async () => {
        document = await parse(`y fi 10;`);
        const diagnostics = document?.diagnostics?.map(diagnosticToString)?.join('\n') || '';
        expect(diagnostics).toContain('Could not resolve reference to VariableDeclaration named \'y\'');
    });


    test('print statement with variable reference', async () => {
        document = await parse(`
            pa x pẹlu 100;
            tẹ(x);
        `);

        expect(
            checkDocumentValid(document) || document?.diagnostics?.map(diagnosticToString)?.join('\n')
        ).toHaveLength(0);  // Expect no validation errors
    });
});


function checkDocumentValid(document: LangiumDocument): string | undefined {
    if (document.parseResult.parserErrors.length > 0) {
        console.log("Parser Errors: ", document.parseResult.parserErrors);
        return s`
            Parser errors:
            ${document.parseResult.parserErrors.map(e => e.message).join('\n  ')}
        `;
    }
    if (document.diagnostics && document.diagnostics.length > 0) {
        console.log("Validation Errors: ", document.diagnostics.map(d => d.message));
        return s`
            Validation errors:
            ${document.diagnostics.map(d => d.message).join('\n  ')}
        `;
    }
    if (document.parseResult.value === undefined) {
        return "ParseResult is 'undefined'.";
    }
    if (!isProgram(document.parseResult.value)) {
        return `Root AST object is a ${document.parseResult.value?.$type}, expected 'Program'.`;
    }
    return undefined;
}

function diagnosticToString(d: Diagnostic) {
    return `[${d.range.start.line}:${d.range.start.character}..${d.range.end.line}:${d.range.end.character}]: ${d.message}`;
}

