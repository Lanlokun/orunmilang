// src/language/orunmilang-validator.ts
export function registerValidationChecks(services) {
    try {
        const registry = services.validation.ValidationRegistry;
        const validator = services.validation.OrunmilangValidator;
        const checks = {
            PrintStatement: validator.checkPrintStatement.bind(validator),
            TextLiteral: validator.checkTextLiteral.bind(validator),
            NumericLiteral: validator.checkNumericLiteral.bind(validator),
            VariableDeclaration: validator.checkVariableDeclaration.bind(validator),
            VariableAssignment: validator.checkVariableAssignment.bind(validator),
            IfStatement: validator.checkIfStatement.bind(validator),
            WhileStatement: validator.checkWhileStatement.bind(validator),
            VariableReference: validator.checkVariableReference.bind(validator),
            LogicalOrExpression: validator.checkLogicalOrExpression.bind(validator),
            FunctionDeclaration: validator.checkFunctionDeclaration.bind(validator),
            ReturnStatement: validator.checkReturnStatement.bind(validator),
            FunctionCall: validator.checkFunctionCall.bind(validator),
        };
        registry.register(checks, validator);
    }
    catch (error) {
        if (error instanceof Error) {
            throw new Error(`Failed to register validation checks: ${error.message}`);
        }
        else {
            throw new Error('Failed to register validation checks due to an unknown error');
        }
    }
}
export class OrunmilangValidator {
    checkPrintStatement(print, accept) {
        if (!print.value) {
            accept('error', 'Print statement must have a value', { node: print, property: 'value' });
        }
    }
    checkTextLiteral(text, accept) {
        if (!text.value || text.value.trim().length === 0) {
            accept('warning', 'Empty string literal', { node: text, property: 'value' });
            return;
        }
        if (text.value.length > 100) {
            accept('warning', 'String literals should be less than 100 characters', {
                node: text,
                property: 'value',
            });
        }
        const yorubaDiacritics = /[ẹọṣàáèéìíòóùúẸỌṢÀÁÈÉÌÍÒÓÙÚ]/;
        if (yorubaDiacritics.test(text.value)) {
            accept('info', 'Using Yoruba diacritic characters', {
                node: text,
                property: 'value',
            });
        }
    }
    checkNumericLiteral(number, accept) {
        const value = parseFloat(number.value);
        if (isNaN(value)) {
            accept('error', 'Invalid number format', { node: number, property: 'value' });
        }
        else if (!Number.isFinite(value)) {
            accept('error', 'Number must be finite', { node: number, property: 'value' });
        }
        else if (Math.abs(value) > 1e308) {
            accept('warning', 'Number may lose precision', { node: number, property: 'value' });
        }
    }
    checkVariableDeclaration(declaration, accept) {
        if (!declaration.value) {
            accept('error', 'Variable declaration must have an initial value', {
                node: declaration,
                property: 'value'
            });
        }
    }
    checkVariableAssignment(assignment, accept) {
        if (!assignment.value) {
            accept('error', 'Assignment must have a value', {
                node: assignment,
                property: 'value'
            });
        }
    }
    checkIfStatement(ifStmt, accept) {
        if (!ifStmt.condition) {
            accept('error', 'If statement must have a condition', {
                node: ifStmt,
                property: 'condition'
            });
        }
        if (!ifStmt.statements || ifStmt.statements.length === 0) {
            accept('warning', 'Consider adding statements to the if body', {
                node: ifStmt,
                property: 'statements'
            });
        }
        if (ifStmt.elseStatements && ifStmt.elseStatements.length === 0) {
            accept('warning', 'Consider adding statements to the else body', {
                node: ifStmt,
                property: 'elseStatements'
            });
        }
    }
    checkWhileStatement(whileStmt, accept) {
        if (!whileStmt.condition) {
            accept('error', 'While statement must have a condition', {
                node: whileStmt,
                property: 'condition'
            });
        }
        if (!whileStmt.statements || whileStmt.statements.length === 0) {
            accept('warning', 'Potential infinite loop with empty body', {
                node: whileStmt,
                property: 'statements'
            });
        }
    }
    checkVariableReference(ref, accept) {
        if (!ref.variable) {
            accept('error', 'Unresolved variable reference', {
                node: ref,
                property: 'variable'
            });
        }
    }
    checkLogicalOrExpression(expr, accept) {
        if (!expr.left) {
            accept('error', 'Missing left operand', {
                node: expr,
                property: 'left'
            });
        }
        if (expr.rights?.some(right => !right)) {
            accept('error', 'Invalid right operand', {
                node: expr,
                property: 'rights'
            });
        }
    }
    checkFunctionDeclaration(func, accept) {
        if (!func.name) {
            accept('error', 'Function declaration must have a name', {
                node: func,
                property: 'name'
            });
        }
        // Check for duplicate parameter names
        const paramNames = new Set();
        for (const param of func.parameters || []) {
            if (!param.name) {
                accept('error', 'Parameter must have a name', {
                    node: param,
                    property: 'name'
                });
            }
            else if (paramNames.has(param.name)) {
                accept('error', `Duplicate parameter name: ${param.name}`, {
                    node: param,
                    property: 'name'
                });
            }
            else {
                paramNames.add(param.name);
            }
        }
        // Check for empty function body
        if (!func.statements || func.statements.length === 0) {
            accept('warning', 'Function body is empty', {
                node: func,
                property: 'statements'
            });
        }
    }
    checkReturnStatement(returnStmt, accept) {
        // Ensure return statement is inside a function
        let parent = returnStmt.$container;
        let isInsideFunction = false;
        while (parent) {
            if (parent.$type === 'FunctionDeclaration') {
                isInsideFunction = true;
                break;
            }
            // Stop if we reach the Program node or no further container exists
            if (parent.$type === 'Program' || !parent.$container) {
                break;
            }
            parent = parent.$container;
        }
        if (!isInsideFunction) {
            accept('error', 'Return statement must be inside a function', {
                node: returnStmt
            });
        }
    }
    checkFunctionCall(call, accept) {
        if (!call.ref) {
            accept('error', 'Unresolved function reference', {
                node: call,
                property: 'ref'
            });
        }
        else {
            // Resolve the function declaration
            const func = call.ref.ref;
            if (!func) {
                accept('error', `Could not resolve function: ${call.ref.$refText}`, {
                    node: call,
                    property: 'ref'
                });
            }
            else {
                // Check argument count matches parameter count
                const paramCount = func.parameters?.length || 0;
                const argCount = call.arguments?.length || 0;
                if (argCount !== paramCount) {
                    accept('error', `Function ${func.name} expects ${paramCount} arguments but got ${argCount}`, {
                        node: call,
                        property: 'arguments'
                    });
                }
            }
        }
    }
}
//# sourceMappingURL=orunmilang-validator.js.map