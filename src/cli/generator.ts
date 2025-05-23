// src/cli/generator.ts

import type { Program } from '../language/generated/ast.js';
import { expandToNode, joinToNode, toString } from 'langium/generate';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { extractDestinationAndName } from './cli-util.js';

export function generateJavaScript(program: Program, filePath: string, destination: string | undefined): string {
    const data = extractDestinationAndName(filePath, destination);
    const generatedFilePath = `${path.join(data.destination, data.name)}.js`;

    const allStatements = program.statements.map(stmt => statementToString(stmt));

    const fileNode = expandToNode`
        "use strict";

        ${joinToNode(allStatements, stmt => stmt, { appendNewLineIfNotEmpty: true })}
    `.appendNewLineIfNotEmpty();

    if (!fs.existsSync(data.destination)) {
        fs.mkdirSync(data.destination, { recursive: true });
    }

    fs.writeFileSync(generatedFilePath, toString(fileNode));
    return generatedFilePath;
}

function statementToString(stmt: any): string {
    switch (stmt.$type) {
        case 'VariableDeclaration':
            return `let ${stmt.name} = ${valueToString(stmt.value)};`;
        case 'VariableAssignment':
            return `${stmt.variable?.ref?.name ?? 'undefined'} = ${valueToString(stmt.value)};`;
        case 'PrintStatement':
            return `console.log(${valueToString(stmt.value)});`;
        case 'IfStatement': {
            const condition = valueToString(stmt.condition);
            const thenBlock = stmt.statements.map(statementToString).join('\n');
            let elseIfBlocks = '';
            if (stmt.elseIfs?.length > 0) {
                elseIfBlocks = stmt.elseIfs
                    .map((elseIf: any) => {
                        const elseIfCondition = valueToString(elseIf.condition);
                        const elseIfBody = elseIf.statements.map(statementToString).join('\n');
                        return `else if (${elseIfCondition}) {\n${elseIfBody}\n}`;
                    })
                    .join(' ');
            }
            let elseBlock = '';
            if (stmt.elseBlock) {
                elseBlock = stmt.elseBlock.statements.map(statementToString).join('\n');
                elseBlock = `else {\n${elseBlock}\n}`;
            }
            return `if (${condition}) {\n${thenBlock}\n} ${elseIfBlocks}${elseBlock}`;
        }
        case 'WhileStatement': {
            const condition = valueToString(stmt.condition);
            const body = stmt.statements.map(statementToString).join('\n');
            return `while (${condition}) {\n${body}\n}`;
        }
        case 'FunctionDeclaration': {
            const params = stmt.parameters.map((param: any) => param.name).join(', ');
            const body = stmt.statements.map(statementToString).join('\n');
            return `function ${stmt.name}(${params}) {\n${body}\n}`;
        }
        case 'FunctionCall': {
            const funcName = stmt.ref?.ref?.name ?? 'undefined';
            const args = stmt.arguments?.map((arg: any) => valueToString(arg)).join(', ') ?? '';
            return `${funcName}(${args});`;
        }
        case 'ReturnStatement': {
            return stmt.value ? `return ${valueToString(stmt.value)};` : 'return;';
        }
        default:
            return `// Unsupported statement: ${stmt.$type}`;
    }
}

function valueToString(value: any): string {
    if (!value) return 'undefined';
    switch (value.$type) {
        case 'TextLiteral':
            return `"${value.value.replace(/"/g, '\\"')}"`;
        case 'NumericLiteral':
            return value.value.toString();
        case 'BooleanLiteral':
            return value.bool === 'bẹẹni' ? 'true' : 'false';
        case 'VariableReference':
            return value.variable?.ref?.name ?? 'undefined';
        case 'FunctionCall':
            const funcName = value.ref?.ref?.name ?? 'undefined';
            const args = value.arguments?.map((arg: any) => valueToString(arg)).join(', ') ?? '';
            return `${funcName}(${args})`;
        case 'LogicalOrExpression':
            return `${valueToString(value.left)} || ${value.rights?.map((r: any) => valueToString(r)).join(' || ')}`;
        case 'LogicalAndExpression':
            return `${valueToString(value.left)} && ${value.rights?.map((r: any) => valueToString(r)).join(' && ')}`;
        case 'EqualityExpression':
            return `${valueToString(value.left)} ${value.op[0]} ${value.rights?.map((r: any) => valueToString(r)).join(` ${value.op[0]} `)}`;
        case 'RelationalExpression':
            return `${valueToString(value.left)} ${value.op[0]} ${value.rights?.map((r: any) => valueToString(r)).join(` ${value.op[0]} `)}`;
        case 'AdditiveExpression':
            return value.rights?.reduce(
                (acc: string, right: any, i: number) => `${acc} ${value.op[i]} ${valueToString(right)}`,
                valueToString(value.left)
            ) ?? valueToString(value.left);
        case 'MultiplicativeExpression':
            return value.rights?.reduce(
                (acc: string, right: any, i: number) => `${acc} ${value.op[i]} ${valueToString(right)}`,
                valueToString(value.left)
            ) ?? valueToString(value.left);
        case 'NotExpr':
            return `!${valueToString(value.expression)}`;
        case 'PrimaryExpression':
            if (value.BooleanLiteral) return valueToString(value.BooleanLiteral);
            if (value.NumericLiteral) return valueToString(value.NumericLiteral);
            if (value.TextLiteral) return valueToString(value.TextLiteral);
            if (value.VariableReference) return valueToString(value.VariableReference);
            if (value.FunctionCall) return valueToString(value.FunctionCall);
            if (value.Expression) return `(${valueToString(value.Expression)})`;
            return 'undefined';
        default:
            return 'undefined';
    }
}