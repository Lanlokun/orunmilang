import { afterEach, beforeAll, describe, expect, test } from "vitest";
import { EmptyFileSystem, type LangiumDocument } from "langium";
import { expandToString as s } from "langium/generate";
import { clearDocuments, parseHelper } from "langium/test";
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

afterEach(async () => {
    if (document) {
        clearDocuments(services.shared, [document]);
    }
});

describe('Orunmilang Grammar Parsing Tests', () => {
    test('parses print statements with text literals', async () => {
        document = await parse(`
            tẹ("Bawoni");
            tẹ('Kaabo');
        `);
        expect(checkDocumentValid(document)).toBeUndefined();
        expect(document?.parseResult.value.statements).toHaveLength(2);
    });

    test('parses print statements with numeric literals', async () => {
        document = await parse(`
            tẹ(123);
            tẹ(456);
        `);
        expect(checkDocumentValid(document)).toBeUndefined();
        expect(document?.parseResult.value.statements).toHaveLength(2);
    });

    // Negative and decimal numbers
    test('parses print statements with negative and decimal numbers', async () => {
        document = await parse(`
            tẹ(-123);
            tẹ(45.67);
        `);
        expect(checkDocumentValid(document)).toBeUndefined();
        expect(document?.parseResult.value.statements).toHaveLength(2);
    });

    // Variable declarations
    test('parses variable declarations correctly', async () => {
        document = await parse(`
            pa x pẹlu "Bawo ni";
            pa y pẹlu 123;
        `);
        expect(checkDocumentValid(document)).toBeUndefined();
        expect(document?.parseResult.value.declarations).toHaveLength(2);
    });

    // Variable assignments
    test('parses variable assignments correctly', async () => {
        document = await parse(`
            pa x pẹlu 10;
            x fi 20;
        `);
        expect(checkDocumentValid(document)).toBeUndefined();
        expect(document?.parseResult.value.assignments).toHaveLength(1);
    });
    
    // Non-literal input
    test('detects invalid syntax (non-literal input in print statement)', async () => {
        document = await parse(`tẹ(undeclaredVar);`);
        expect(document.parseResult.parserErrors).toHaveLength(0);
        const diagnostics = document.diagnostics?.map(d => d.message) || [];
        expect(diagnostics).toEqual(expect.arrayContaining([
            expect.stringContaining('Could not resolve reference to')
        ]));    
    });

    test('detects invalid syntax (missing argument in print statement)', async () => {
        document = await parse(`tẹ();`);
        expect(checkDocumentValid(document)).toContain('Parser errors');
    });

    test('detects invalid syntax (missing value in variable declaration)', async () => {
        document = await parse(`pa x;`);
        expect(checkDocumentValid(document)).toContain('Parser errors');
    });

    test('detects invalid syntax (missing "fi" in variable assignment)', async () => {
        document = await parse(`x 123;`);
        expect(checkDocumentValid(document)).toContain('Parser errors');
    });

    test('rejects keyword as variable name', async () => {
        document = await parse(`pa pa pẹlu 5;`);
        expect(checkDocumentValid(document)).toContain('Parser errors');
    });

    // Variable reference in declaration
    test('rejects variable reference in declaration', async () => {
        document = await parse(`pa x pẹlu y;`);
        expect(checkDocumentValid(document)).toContain('Parser errors'); // Update if grammar is fixed
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