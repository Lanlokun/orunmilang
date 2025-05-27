// src/language/orunmilang-validator.ts

import type { ValidationAcceptor, ValidationChecks } from 'langium';
import type {
    OrunmilangAstType,
    Program,
    PrintStatement,
    TextLiteral,
    NumericLiteral,
    VariableDeclaration,
    VariableAssignment,
    IfStatement,
    ElseIfStatement,
    ArrayAssignment,
    ArrayLiteral,
    ArrayAccess,
    ElseStatement,
    WhileStatement,
    VariableReference,
    LogicalOrExpression,
    FunctionDeclaration,
    MultiplicativeExpression,
    ReturnStatement,
    FunctionCall,
    Statement
} from './generated/ast.js';
import type { OrunmilangServices } from './orunmilang-module.js';

export function registerValidationChecks(services: OrunmilangServices) {
    try {
        const registry = services.validation.ValidationRegistry;
        const validator = services.validation.OrunmilangValidator;
        const checks: ValidationChecks<OrunmilangAstType> = {
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
            MultiplicativeExpression: validator.checkMultiplicativeExpression.bind(validator),
            FunctionCall: validator.checkFunctionCall.bind(validator),
        };
        registry.register(checks, validator);
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Failed to register validation checks: ${error.message}`);
        } else {
            throw new Error('Failed to register validation checks due to an unknown error');
        }
    }
}

export class OrunmilangValidator {
    checkPrintStatement(print: PrintStatement, accept: ValidationAcceptor): void {
        if (!print.value) {
            accept('error', 'Print statement must have a value', { node: print, property: 'value' });
        }
    }

    checkTextLiteral(text: TextLiteral, accept: ValidationAcceptor): void {
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

    checkNumericLiteral(number: NumericLiteral, accept: ValidationAcceptor): void {
        const value = parseFloat(number.value);
        if (isNaN(value)) {
            accept('error', 'Invalid number format', { node: number, property: 'value' });
        } else if (!Number.isFinite(value)) {
            accept('error', 'Number must be finite', { node: number, property: 'value' });
        } else if (Math.abs(value) > 1e308) {
            accept('warning', 'Number may lose precision', { node: number, property: 'value' });
        }
    }

    checkVariableDeclaration(declaration: VariableDeclaration, accept: ValidationAcceptor): void {
        if (!declaration.value && !declaration.array) {
            accept('error', 'Variable declaration must have an initial value (use "pẹlu" or "=" with array)', { 
                node: declaration,
                property: 'name' // Point to the variable name for better error location
            });
        }
        
        // Additional validation if you want
        if (declaration.array) {
            if (!declaration.array.elements || declaration.array.elements.length === 0) {
                accept('warning', 'Array literal is empty', {
                    node: declaration.array
                });
            }
        }
    }

    checkVariableAssignment(assignment: VariableAssignment, accept: ValidationAcceptor): void {
        if (!assignment.value) {
            accept('error', 'Assignment must have a value', { 
                node: assignment,
                property: 'value'
            });
        }
    }

    checkIfStatement(ifStmt: IfStatement, accept: ValidationAcceptor): void {
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

            // Validate elseif statements
            for (const elseIfStmt of ifStmt.elseIfs ?? []) {
                if (!elseIfStmt.condition) {
                    accept('error', 'Else-if statement must have a condition', { 
                        node: elseIfStmt,
                        property: 'condition'
                    });
                }
                if (!elseIfStmt.statements || elseIfStmt.statements.length === 0) {
                    accept('warning', 'Consider adding statements to the else-if body', { 
                        node: elseIfStmt,
                        property: 'statements'
                    });
                }
            }

        // Validate else block
        if (ifStmt.elseBlock && ifStmt.elseBlock.statements.length === 0) {
            accept('warning', 'Consider adding statements to the else body', { 
                node: ifStmt.elseBlock,
                property: 'statements'
            });
        }
    }
    checkWhileStatement(whileStmt: WhileStatement, accept: ValidationAcceptor): void {
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

    checkMultiplicativeExpression(expr: MultiplicativeExpression, accept: ValidationAcceptor): void {
        const checkOperandType = (operand: any) => {
            // Allow variables of unknown type (they'll be checked at runtime)
            if (operand.$type === 'VariableReference') return true;
            // Allow numeric literals
            if (operand.$type === 'NumericLiteral') return true;
            // Allow function calls (runtime check)
            if (operand.$type === 'FunctionCall') return true;
            return false;
        };

        for (let i = 0; i < (expr.op?.length || 0); i++) {
            const op = expr.op[i];
            if (op === '%') {
                if (!checkOperandType(expr.left)) {
                    accept('warning', 'Left operand of modulo should be numeric', { node: expr.left });
                }
                if (expr.rights && !checkOperandType(expr.rights[i])) {
                    accept('warning', 'Right operand of modulo should be numeric', { node: expr.rights[i] });
                }
            }
        }
    }

    checkVariableReference(ref: VariableReference, accept: ValidationAcceptor): void {
        if (!ref.variable) {
            accept('error', 'Unresolved variable reference', {
                node: ref,
                property: 'variable'
            });
        }
    }

    checkLogicalOrExpression(expr: LogicalOrExpression, accept: ValidationAcceptor): void {
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

    checkFunctionDeclaration(func: FunctionDeclaration, accept: ValidationAcceptor): void {
        if (!func.name) {
            accept('error', 'Function declaration must have a name', {
                node: func,
                property: 'name'
            });
        }

        // Check for duplicate parameter names
        const paramNames = new Set<string>();
        for (const param of func.parameters || []) {
            if (!param.name) {
                accept('error', 'Parameter must have a name', {
                    node: param,
                    property: 'name'
                });
            } else if (paramNames.has(param.name)) {
                accept('error', `Duplicate parameter name: ${param.name}`, {
                    node: param,
                    property: 'name'
                });
            } else {
                paramNames.add(param.name);
            }
        }

        // Check for empty function body
       if (func.statements && func.statements.length > 0) {
            const hasReturn = this.checkAllPathsReturn(func.statements);
            if (!hasReturn) {
                accept('warning', 'Function may not return a value in all code paths', {
                    node: func,
                    property: 'statements'
                });
            }
        }
    }

    private checkAllPathsReturn(statements: Statement[]): boolean {
        for (let i = statements.length - 1; i >= 0; i--) {
            const stmt = statements[i];
            if (stmt.$type === 'ReturnStatement') {
                return true;
            }
            if (stmt.$type === 'IfStatement') {
                const thenReturns = this.checkAllPathsReturn(stmt.statements);
                const elseReturns = stmt.elseBlock 
                    ? this.checkAllPathsReturn(stmt.elseBlock.statements)
                    : false;
                return thenReturns && elseReturns;
            }
        }
        return false;
    }

    checkReturnStatement(returnStmt: ReturnStatement, accept: ValidationAcceptor): void {
        // Ensure return statement is inside a function
        let parent: FunctionDeclaration | IfStatement | ElseIfStatement | ElseStatement | WhileStatement | Program = returnStmt.$container;
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
            parent = parent.$container as FunctionDeclaration | IfStatement | WhileStatement | Program;
        }
        if (!isInsideFunction) {
            accept('error', 'Return statement must be inside a function', {
                node: returnStmt
            });
        }
        const container = returnStmt.$container;
        if (container && 'statements' in container) {
            const statements = container.statements;
            const lastIndex = statements.length - 1;
            const returnIndex = statements.indexOf(returnStmt);
            
            if (returnIndex < lastIndex) {
                accept('warning', 'Code after return statement will never execute', {
                    node: returnStmt
                });
            }
        }
    }
    checkArrayLiteral(array: ArrayLiteral, accept: ValidationAcceptor): void {
        if (!array.elements || array.elements.length === 0) {
            accept('warning', 'Array literal is empty', { node: array });
        }

        // Optional: Check for consistent element types
        const elementTypes = array.elements.map(el => el.$type);
        const firstType = elementTypes[0];
        const inconsistent = elementTypes.some(t => t !== firstType);

        if (inconsistent) {
            accept('warning', 'Array elements are of mixed types', { node: array });
        }
    }

    checkArrayAccess(access: ArrayAccess, accept: ValidationAcceptor): void {
        if (!access.array) {
            accept('error', 'Missing array reference in access expression', { node: access, property: 'array' });
        }

        if (!access.index) {
            accept('error', 'Array access must include an index expression', { node: access, property: 'index' });
        }
    }

    checkArrayAssignment(assign: ArrayAssignment, accept: ValidationAcceptor): void {
        if (!assign.array) {
            accept('error', 'Missing array reference in assignment', { node: assign, property: 'array' });
        }

        if (!assign.index) {
            accept('error', 'Array assignment must include an index expression', { node: assign, property: 'index' });
        }

        if (!assign.value) {
            accept('error', 'Array assignment must include a value', { node: assign, property: 'value' });
        }
    }

    checkFunctionCall(call: FunctionCall, accept: ValidationAcceptor): void {
        if (!call.ref) {
            accept('error', 'Unresolved function reference', {
                node: call,
                property: 'ref'
            });
        } else {
            // Resolve the function declaration
            const func = call.ref.ref;
            if (!func) {
                accept('error', `Could not resolve function: ${call.ref.$refText}`, {
                    node: call,
                    property: 'ref'
                });
            } else {
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