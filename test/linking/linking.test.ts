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

describe('Parsing tests', () => {

    test('should parse print statements with numbers correctly', async () => {
        document = await parse(`
            tẹ(123);
            tẹ(456);
        `);
        expect(checkDocumentValid(document)).toBeUndefined();
        expect(document?.parseResult.value.statements).toHaveLength(2);
    });

    test('should parse print statements with negative and decimal numbers', async () => {
        document = await parse(`
            tẹ(-123);
            tẹ(45.67);
        `);
        expect(checkDocumentValid(document)).toBeUndefined();
        expect(document?.parseResult.value.statements).toHaveLength(2);
    });

    // Variable declarations
    test('should parse variable declarations correctly', async () => {
        document = await parse(`
            pa x pẹlu "Bawo ni";
            pa y pẹlu 123;
        `);
        expect(checkDocumentValid(document)).toBeUndefined();
        expect(document?.parseResult.value.declarations).toHaveLength(2);
    });

    // Variable assignments
    test('should parse variable assignments correctly', async () => {
        document = await parse(`
            pa x pẹlu 10;
            x fi 20;
        `);
        expect(checkDocumentValid(document)).toBeUndefined();
        expect(document?.parseResult.value.assignments).toHaveLength(1);
    });

    test('should detect invalid syntax for missing argument in print statement', async () => {
        document = await parse(`tẹ();`);
        expect(checkDocumentValid(document)).toContain('Parser errors');
    });

    // Undefined variable
    test('detects invalid syntax for undefined variable in print statement', async () => {
        document = await parse(`tẹ(undeclaredVar);`);
        expect(document.parseResult.parserErrors).toHaveLength(0);
        const diagnostics = document.diagnostics?.map(d => d.message) || [];
        expect(diagnostics).toEqual(expect.arrayContaining([
            expect.stringContaining('Could not resolve reference to')
        ]));    
    });

    test('should detect invalid syntax for variable assignment without "fi"', async () => {
        document = await parse(`x 123;`);
        expect(checkDocumentValid(document)).toContain('Parser errors');
    });

    test('should detect invalid syntax for missing closing parenthesis in print statement', async () => {
        document = await parse(`tẹ("Hello";`);
        expect(checkDocumentValid(document)).toContain('Parser errors');
    });

    test('should detect invalid syntax for missing value in variable declaration', async () => {
        document = await parse(`pa x;`);
        expect(checkDocumentValid(document)).toContain('Parser errors');
    });

    test('should reject keyword as variable name', async () => {
        document = await parse(`pa pa pẹlu 5;`);
        expect(checkDocumentValid(document)).toContain('Parser errors');
    });

    // Variable reference in declaration
    test('should detect invalid variable declaration with variable reference', async () => {
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