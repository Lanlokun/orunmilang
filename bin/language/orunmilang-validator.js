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
            accept('error', 'Print statement cannot be empty', { node: print });
        }
        // Linker handles undeclared VariableReference
    }
    checkTextLiteral(text, accept) {
        if (text.value && text.value.length > 100) {
            accept('warning', 'String literals should be less than 100 characters', {
                node: text,
                property: 'value',
            });
        }
        const yorubaDiacritics = /[ẹọṣàáèéìíòóùúẸỌṢÀÁÈÉÌÍÒÓÙÚ]/;
        if (text.value && yorubaDiacritics.test(text.value)) {
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
        else if (value < -1e308 || value > 1e308) {
            accept('warning', 'Number out of safe range', { node: number, property: 'value' });
        }
    }
    checkVariableDeclaration(declaration, accept) {
        if (!declaration.value) {
            accept('error', 'The variable declaration must have a value', { node: declaration });
            return;
        }
        const valueNode = declaration.value;
        const val = valueNode.value;
        // Accept bẹẹni and rara as valid booleans either as BooleanLiteral or TextLiteral
        if (valueNode.$type === 'BooleanLiteral' ||
            (valueNode.$type === 'TextLiteral' && (val === 'bẹẹni' || val === 'rara'))) {
            // Valid boolean
            return;
        }
        if (valueNode.$type === 'BooleanLiteral') {
            if (val !== 'bẹẹni' && val !== 'rara') {
                accept('error', 'Boolean literal must be "bẹẹni" or "rara"', { node: declaration });
            }
        }
        // Optional: add other literal checks
    }
    checkVariableAssignment(assignment, accept) {
        if (!assignment.value) {
            accept('error', 'Variable assignment cannot be empty', { node: assignment });
        }
        // Linker handles undeclared VariableDeclaration
    }
    checkIfStatement(ifStmt, accept) {
        if (!ifStmt.condition) {
            accept('error', 'If statement must have a condition', { node: ifStmt });
        }
        // Optionally validate condition expression deeper here
        if (!ifStmt.statements || ifStmt.statements.length === 0) {
            accept('warning', 'If statement has an empty body', { node: ifStmt });
        }
    }
    checkWhileStatement(whileStmt, accept) {
        if (!whileStmt.condition) {
            accept('error', 'While statement must have a condition', { node: whileStmt });
        }
        if (!whileStmt.statements || whileStmt.statements.length === 0) {
            accept('warning', 'While statement has an empty body', { node: whileStmt });
        }
    }
    checkVariableReference(variableRef, accept) {
        if (!variableRef.variable) {
            accept('error', 'Variable reference must refer to a declared variable', { node: variableRef });
        }
    }
    checkLogicalOrExpression(expr, accept) {
        if (!expr.left) {
            accept('error', 'LogicalOrExpression must have a left operand', { node: expr });
        }
        if (expr.rights && expr.rights.some(right => !right)) {
            accept('error', 'LogicalOrExpression contains invalid right operand', { node: expr });
        }
    }
}
//# sourceMappingURL=orunmilang-validator.js.map