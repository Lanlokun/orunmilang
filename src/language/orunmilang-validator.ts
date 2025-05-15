import type { ValidationAcceptor, ValidationChecks } from 'langium';
import type { OrunmilangAstType, PrintStatement, TextLiteral, NumericLiteral, VariableDeclaration, VariableAssignment } from './generated/ast.js';
import type { OrunmilangServices } from './orunmilang-module.js';

export function registerValidationChecks(services: OrunmilangServices) {
    try {
        const registry = services.validation.ValidationRegistry;
        const validator = services.validation.OrunmilangValidator;
        const checks: ValidationChecks<OrunmilangAstType> = {
            PrintStatement: validator.checkPrintStatement,
            TextLiteral: validator.checkTextLiteral,
            NumericLiteral: validator.checkNumericLiteral,
            VariableDeclaration: validator.checkVariableDeclaration,
            VariableAssignment: validator.checkVariableAssignment
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
            accept('error', 'Print statement cannot be empty', { node: print });
        }
        // Linker handles undeclared VariableReference
    }

    checkTextLiteral(text: TextLiteral, accept: ValidationAcceptor): void {
        if (text.value && text.value.length > 100) {
            accept('warning', 'String literals should be less than 100 characters', {
                node: text,
                property: 'value'
            });
        }
        const yorubaDiacritics = /[ẹọṣàáèéìíòóùúẸỌṢÀÁÈÉÌÍÒÓÙÚ]/;
        if (text.value && yorubaDiacritics.test(text.value)) {
            accept('info', 'Using Yoruba diacritic characters', {
                node: text,
                property: 'value'
            });
        }
    }

    checkNumericLiteral(number: NumericLiteral, accept: ValidationAcceptor): void {
        const value = parseFloat(number.value);
        if (isNaN(value)) {
            accept('error', 'Invalid number format', { node: number, property: 'value' });
        }
        if (value < -1e308 || value > 1e308) {
            accept('warning', 'Number out of safe range', { node: number, property: 'value' });
        }
    }

    checkVariableDeclaration(declaration: VariableDeclaration, accept: ValidationAcceptor): void {
        if (declaration.name && /^[A-Z]/.test(declaration.name)) {
            accept('warning', 'Variable names should be lowercase', {
                node: declaration,
                property: 'name'
            });
        }
        if (!declaration.value) {
            accept('error', 'The variable declaration must have a value', { node: declaration });
        }
    }

    checkVariableAssignment(assignment: VariableAssignment, accept: ValidationAcceptor): void {
        if (!assignment.value) {
            accept('error', 'Variable assignment cannot be empty', { node: assignment });
        }
        // Linker handles undeclared VariableDeclaration
    }
}