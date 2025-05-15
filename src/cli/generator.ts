import type { Program } from '../language/generated/ast.js';
import { expandToNode, joinToNode, toString } from 'langium/generate';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { extractDestinationAndName } from './cli-util.js';

/**
 * Generate JavaScript code from an Orunmilang program.
 * @param program The parsed Orunmilang program
 * @param filePath The path of the source Orunmilang file
 * @param destination The destination folder for the generated JavaScript file
 * @returns The path to the generated JavaScript file
 */
export function generateJavaScript(program: Program, filePath: string, destination: string | undefined): string {
    const data = extractDestinationAndName(filePath, destination);
    const generatedFilePath = `${path.join(data.destination, data.name)}.js`;

    // Create variable declarations
    const declarations = program.declarations.map(decl =>
        `let ${decl.name} = ${valueToString(decl.value)};`
    );

    // Create assignments
    const assignments = program.assignments.map(assign =>
        `${assign.variable} = ${valueToString(assign.value)};`
    );

    // Create print statements
    const prints = program.statements.map(print =>
        `console.log(${valueToString(print.value)});`
    );

    const fileNode = expandToNode`
        "use strict";
        
        ${joinToNode(declarations, decl => decl, { appendNewLineIfNotEmpty: true })}
        ${joinToNode(assignments, assign => assign, { appendNewLineIfNotEmpty: true })}
        ${joinToNode(prints, print => print, { appendNewLineIfNotEmpty: true })}
    `.appendNewLineIfNotEmpty();

    // Ensure the destination folder exists
    if (!fs.existsSync(data.destination)) {
        fs.mkdirSync(data.destination, { recursive: true });
    }

    // Write the generated JavaScript code to the file
    fs.writeFileSync(generatedFilePath, toString(fileNode));

    return generatedFilePath;
}

/**
 * Convert a value to its JavaScript string representation.
 * @param value The value to be converted
 * @returns The string representation of the value
 */
function valueToString(value: any): string {
    if (value?.$type === 'TextLiteral') {
        return `"${value.value}"`; // Wrap text literals in quotes
    } else if (value?.$type === 'NumericLiteral') {
        return value.value.toString(); // Numeric values are directly used
    } else if (value?.$type === 'VariableReference') {
        // Handle variable references by resolving their name or error
        const refName = value.name.ref?.name || value.name.error?.message || 'undefined';
        return refName;
    }
    return 'undefined'; // Default fallback for unsupported types
}
