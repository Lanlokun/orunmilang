import { expandToNode, joinToNode, toString } from 'langium/generate';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { extractDestinationAndName } from './cli-util.js';
export function generateJavaScript(program, filePath, destination) {
    const data = extractDestinationAndName(filePath, destination);
    const generatedFilePath = `${path.join(data.destination, data.name)}.js`;
    // Existing statements
    const declarations = program.statements
        .filter(stmt => stmt.$type === 'VariableDeclaration')
        .map(stmt => {
        const decl = stmt;
        return `let ${decl.name} = ${valueToString(decl.value)};`;
    });
    const assignments = program.statements
        .filter(stmt => stmt.$type === 'VariableAssignment')
        .map(stmt => {
        const assign = stmt;
        return `${assign.variable?.ref?.name ?? 'undefined'} = ${valueToString(assign.value)};`;
    });
    const prints = program.statements
        .filter(stmt => stmt.$type === 'PrintStatement')
        .map(stmt => {
        const print = stmt;
        return `console.log(${valueToString(print.value)});`;
    });
    // New: If Statements
    const ifStatements = program.statements
        .filter(stmt => stmt.$type === 'IfStatement')
        .map(stmt => {
        const ifStmt = stmt;
        const condition = valueToString(ifStmt.condition);
        // assuming ifStmt.thenBlock.statements is an array of statements inside if
        const thenStatements = ifStmt.thenBlock.statements
            .map((s) => statementToString(s))
            .join('\n');
        let elseStatements = '';
        if (ifStmt.elseBlock) {
            elseStatements = ifStmt.elseBlock.statements
                .map((s) => statementToString(s))
                .join('\n');
            return `if (${condition}) {\n${thenStatements}\n} else {\n${elseStatements}\n}`;
        }
        return `if (${condition}) {\n${thenStatements}\n}`;
    });
    // New: While Statements
    const whileStatements = program.statements
        .filter(stmt => stmt.$type === 'WhileStatement')
        .map(stmt => {
        const whileStmt = stmt;
        const condition = valueToString(whileStmt.condition);
        const bodyStatements = whileStmt.body.statements
            .map((s) => statementToString(s))
            .join('\n');
        return `while (${condition}) {\n${bodyStatements}\n}`;
    });
    // Combine all statements into one output node
    const allStatements = [
        ...declarations,
        ...assignments,
        ...prints,
        ...ifStatements,
        ...whileStatements,
    ];
    const fileNode = expandToNode `
        "use strict";

        ${joinToNode(allStatements, stmt => stmt, { appendNewLineIfNotEmpty: true })}
    `.appendNewLineIfNotEmpty();
    if (!fs.existsSync(data.destination)) {
        fs.mkdirSync(data.destination, { recursive: true });
    }
    fs.writeFileSync(generatedFilePath, toString(fileNode));
    return generatedFilePath;
}
// Helper to convert any statement node to JS code string
function statementToString(stmt) {
    switch (stmt.$type) {
        case 'VariableDeclaration':
            return `let ${stmt.name} = ${valueToString(stmt.value)};`;
        case 'VariableAssignment':
            return `${stmt.variable?.ref?.name ?? 'undefined'} = ${valueToString(stmt.value)};`;
        case 'PrintStatement':
            return `console.log(${valueToString(stmt.value)});`;
        case 'IfStatement': {
            const condition = valueToString(stmt.condition);
            const thenBlock = stmt.thenBlock.statements.map(statementToString).join('\n');
            let elseBlock = '';
            if (stmt.elseBlock) {
                elseBlock = stmt.elseBlock.statements.map(statementToString).join('\n');
                return `if (${condition}) {\n${thenBlock}\n} else {\n${elseBlock}\n}`;
            }
            return `if (${condition}) {\n${thenBlock}\n}`;
        }
        case 'WhileStatement': {
            const condition = valueToString(stmt.condition);
            const body = stmt.body.statements.map(statementToString).join('\n');
            return `while (${condition}) {\n${body}\n}`;
        }
        // Add more cases here for other statement types
        default:
            return '// Unsupported statement: ' + stmt.$type;
    }
}
function valueToString(value) {
    if (!value)
        return 'undefined';
    switch (value.$type) {
        case 'TextLiteral':
            return `"${value.value}"`;
        case 'NumericLiteral':
            return value.value.toString();
        case 'BooleanLiteral':
            return value.value ? 'true' : 'false';
        case 'VariableReference':
            return value.name?.ref?.name || value.name?.error?.message || 'undefined';
        // Add support for other literal types like ListLiteral if needed
        default:
            return 'undefined';
    }
}
//# sourceMappingURL=generator.js.map