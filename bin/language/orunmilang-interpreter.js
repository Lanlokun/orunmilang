// src/language/orunmilang-interpreter.ts
function safeStringify(obj, space) {
    const replacer = (key, value) => {
        if (key === '$container' || key === '$cstNode' || key === 'root' || key === 'container')
            return undefined;
        return value;
    };
    return JSON.stringify(obj, replacer, space);
}
export function simulateExecution(program) {
    const variables = {};
    let outputBuffer = '';
    // Helper to execute statements recursively
    function executeStatements(statements) {
        for (const statement of statements) {
            switch (statement.$type) {
                case 'VariableDeclaration':
                    variables[statement.name] = getValue(statement.value, variables);
                    break;
                case 'VariableAssignment':
                    // Custom replacer to skip circular $container
                    const varName = statement.variable?.$refText;
                    const val = getValue(statement.value, variables);
                    if (varName) {
                        variables[varName] = val;
                    }
                    break;
                case 'PrintStatement':
                    const output = getValue(statement.value, variables);
                    outputBuffer += stringify(output) + '\n';
                    break;
                case 'IfStatement':
                    if (!statement.condition || !statement.condition.$type) {
                        console.error('Invalid IfStatement condition:', {
                            $type: statement.condition?.$type,
                            variable: statement.condition?.variable?.$refText
                        });
                        outputBuffer += "⚠️ Invalid If condition.\n";
                        break;
                    }
                    if (evaluateExpression(statement.condition, variables)) {
                        executeStatements(statement.statements);
                    }
                    else if (statement.elseStatements) {
                        executeStatements(statement.elseStatements);
                    }
                    break;
                case 'WhileStatement':
                    while (evaluateExpression(statement.condition, variables)) {
                        executeStatements(statement.statements);
                    }
                    break;
                default:
                    outputBuffer += `⚠️ Unknown statement type: ${statement.$type}\n`;
            }
        }
    }
    function stringify(value) {
        if (typeof value === 'boolean')
            return value ? 'bẹẹni' : 'rara';
        return String(value);
    }
    executeStatements(program.statements);
    return outputBuffer;
}
function evaluateExpression(expr, variables) {
    if (!expr) {
        throw new Error('evaluateExpression called with undefined or null expr');
    }
    if (!expr || !expr.$type) {
        console.error("Invalid expression encountered:", expr);
        throw new Error(`Invalid expression node or missing $type: ${JSON.stringify(expr)}`);
    }
    switch (expr.$type) {
        case 'LogicalOrExpression':
            let leftVal = evaluateExpression(expr.left, variables);
            for (const right of expr.rights ?? []) {
                leftVal = leftVal || evaluateExpression(right, variables);
            }
            return leftVal;
        case 'LogicalAndExpression':
            let leftAndVal = evaluateExpression(expr.left, variables);
            for (const right of expr.rights ?? []) {
                leftAndVal = leftAndVal && evaluateExpression(right, variables);
            }
            return leftAndVal;
        case 'EqualityExpression':
            let result = evaluateExpression(expr.left, variables);
            for (let i = 0; i < (expr.rights?.length || 0); i++) {
                const right = evaluateExpression(expr.rights[i], variables);
                const op = expr.op[i];
                if (op === '==') {
                    // Special handling for boolean literals
                    if (typeof result === 'boolean' || typeof right === 'boolean') {
                        result = Boolean(result) === Boolean(right);
                    }
                    else {
                        result = result === right;
                    }
                }
                else if (op === '!=') {
                    result = result !== right;
                }
                else {
                    throw new Error(`Unknown equality operator: ${op}`);
                }
            }
            return result;
        case 'RelationalExpression':
            if (!expr.left) {
                throw new Error(`RelationalExpression missing left operand at line ${expr.$cstNode?.range?.start?.line || 'unknown'}`);
            }
            const leftRel = evaluateExpression(expr.left, variables);
            if (!expr.op || expr.op.length === 0 || !expr.rights || expr.rights.length === 0) {
                return leftRel; // Return left operand if no relational operation
            }
            const rightRel = evaluateExpression(expr.rights[0], variables);
            const op = expr.op[0];
            if (typeof leftRel === 'number' && typeof rightRel === 'number') {
                switch (op) {
                    case '<': return leftRel < rightRel;
                    case '<=': return leftRel <= rightRel;
                    case '>': return leftRel > rightRel;
                    case '>=': return leftRel >= rightRel;
                    default: throw new Error(`Unknown relational operator: ${op}`);
                }
            }
            return false;
        case 'AdditiveExpression':
            if (!expr.left || !expr.rights || !expr.op) {
                // console.error('Malformed AdditiveExpression:', expr);
                throw new Error('AdditiveExpression missing left, rights, or op');
            }
            let sum = evaluateExpression(expr.left, variables);
            for (let i = 0; i < (expr.op?.length || 0); i++) {
                if (!expr.rights[i]) {
                    // console.error('Missing right operand in AdditiveExpression:', expr);
                    throw new Error('Missing right operand in AdditiveExpression');
                }
                const op = expr.op[i];
                const right = evaluateExpression(expr.rights[i], variables);
                if (op === '+')
                    sum += right;
                else if (op === '-')
                    sum -= right;
            }
            return sum;
        case 'MultiplicativeExpression':
            // Evaluate left and apply * or / with rights
            let prod = evaluateExpression(expr.left, variables);
            for (let i = 0; i < (expr.op?.length || 0); i++) {
                const op = expr.op[i];
                const right = evaluateExpression(expr.rights[i], variables);
                if (op === '*')
                    prod *= right;
                else if (op === '/')
                    prod /= right;
            }
            return prod;
        case 'PrimaryExpression':
            if (expr.NumericLiteral)
                return Number(expr.NumericLiteral.value);
            if (expr.TextLiteral)
                return expr.TextLiteral.value.slice(1, -1);
            if (expr.BooleanLiteral)
                return expr.BooleanLiteral.bool === 'bẹẹni';
            if (expr.VariableReference) {
                const v = expr.VariableReference.variable?.$refText;
                if (!v) {
                    throw new Error('Invalid VariableReference in PrimaryExpression');
                }
                return variables[v] ?? '<undefined variable>';
            }
            if (expr.Expression)
                return evaluateExpression(expr.Expression, variables);
            throw new Error('Invalid PrimaryExpression: ' + JSON.stringify(expr));
        case 'TextLiteral':
            return expr.value.slice(1, -1);
        case 'NumericLiteral':
            return Number(expr.value);
        case 'BooleanLiteral':
            return expr.bool === 'bẹẹni';
        case 'VariableReference':
            const varName = expr.variable?.$refText;
            return varName ? variables[varName] : '<undefined variable>';
        default:
            return '<unknown expression>';
    }
}
function getValue(expr, variables) {
    if (!expr || !expr.$type) {
        throw new Error(`Invalid expression: ${safeStringify(expr, 2)}`);
    }
    switch (expr.$type) {
        case 'SimpleAssignment':
            return getValue(expr.value, variables);
        case 'ExpressionAssignment':
            return evaluateExpression(expr.value, variables);
        case 'PrintableValue':
            return getValue(expr.TextLiteral || expr.NumericLiteral || expr.BooleanLiteral || expr.VariableReference, variables);
        case 'TextLiteral':
            const v = expr.value;
            if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
                return v.slice(1, -1);
            }
            return v;
        case 'NumericLiteral':
            return Number(expr.value);
        case 'BooleanLiteral':
            return expr.bool === 'bẹẹni';
        case 'VariableReference':
            const varRef = expr.variable?.$refText;
            if (!varRef) {
                return `<invalid or unresolved variable>`;
            }
            return variables[varRef] ?? `<undefined variable: ${varRef}>`;
        default:
            return evaluateExpression(expr, variables);
    }
}
//# sourceMappingURL=orunmilang-interpreter.js.map