// src/language/orunmilang-interpreter.ts

export function simulateExecution(program: any): string {
    const variables: Record<string, any> = {};
    let outputBuffer = '';

    // Helper to execute statements recursively
    function executeStatements(statements: any[]) {
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
                    if (evaluateExpression(statement.condition, variables)) {
                        executeStatements(statement.statements);
                    } else if (statement.elseStatements) {
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

    function stringify(value: any): string {
        if (typeof value === 'boolean') return value ? 'bẹẹni' : 'rara';
        return String(value);
    }

    executeStatements(program.statements);

    return outputBuffer;
}

function evaluateExpression(expr: any, variables: Record<string, any>): any {
    if (!expr || !expr.$type) {
        console.error("Invalid expression encountered:", expr);
        throw new Error(`Invalid expression node or missing $type: ${JSON.stringify(expr)}`);
    }
   // Basic recursive evaluation of expression trees based on your grammar operators
    switch (expr.$type) {
        case 'LogicalOrExpression':
            // Evaluate left then any rights with OR
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
              // rest of your code
            let result = evaluateExpression(expr.left, variables);
            for (let i = 0; i < expr.rights.length; i++) {
                const right = evaluateExpression(expr.rights[i], variables);
                const op = expr.op[i];
                if (op === '=') result = result === right;
                else if (op === '!=') result = result !== right;
                else throw new Error(`Unknown equality operator: ${op}`);
            }
            return result;

        case 'RelationalExpression':
            // Handle first relational operator only (like <, >, <=, >=)
            const leftRel = evaluateExpression(expr.left, variables);
            const rightRel = evaluateExpression(expr.rights?.[0], variables);
            const op = expr.op?.[0];
            if (typeof leftRel === 'number' && typeof rightRel === 'number') {
                switch (op) {
                    case '<': return leftRel < rightRel;
                    case '<=': return leftRel <= rightRel;
                    case '>': return leftRel > rightRel;
                    case '>=': return leftRel >= rightRel;
                }
            }
            return false;

       case 'AdditiveExpression':
            if (!expr.left || !expr.rights || !expr.op) {
                console.error('Malformed AdditiveExpression:', expr);
                throw new Error('AdditiveExpression missing left, rights, or op');
            }
            let sum = evaluateExpression(expr.left, variables);
            for (let i = 0; i < (expr.op?.length || 0); i++) {
                if (!expr.rights[i]) {
                    console.error('Missing right operand in AdditiveExpression:', expr);
                    throw new Error('Missing right operand in AdditiveExpression');
                }
                const op = expr.op[i];
                const right = evaluateExpression(expr.rights[i], variables);
                if (op === '+') sum += right;
                else if (op === '-') sum -= right;
            }
            return sum;

        case 'MultiplicativeExpression':
            // Evaluate left and apply * or / with rights
            let prod = evaluateExpression(expr.left, variables);
            for (let i = 0; i < (expr.op?.length || 0); i++) {
                const op = expr.op[i];
                const right = evaluateExpression(expr.rights[i], variables);
                if (op === '*') prod *= right;
                else if (op === '/') prod /= right;
            }
            return prod;

        case 'PrimaryExpression':
            // PrimaryExpression can wrap other expressions or literals
            if (expr.NumericLiteral) return Number(expr.NumericLiteral.value);
            if (expr.TextLiteral) return expr.TextLiteral.value.slice(1, -1);
            if (expr.BooleanLiteral) return expr.BooleanLiteral.bool === 'bẹẹni';
            if (expr.VariableReference) {
                const v = expr.VariableReference.variable?.$refText;
                return v ? variables[v] : '<undefined variable>';
            }
            if (expr.Expression) return evaluateExpression(expr.Expression, variables);
            break;

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
export function getValue(expr: any, variables: Record<string, any> = {}): any {
    if (!expr) return '<empty expression>';

    switch (expr.$type) {
        case 'TextLiteral': {
            const v = expr.value;
            if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
                return v.slice(1, -1);
            }
            return v;
        }

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

        case 'Expression':
        case 'AdditiveExpression':
        case 'MultiplicativeExpression':
        case 'RelationalExpression':
        case 'EqualityExpression':
        case 'LogicalAndExpression':
        case 'LogicalOrExpression':
            return evaluateExpression(expr, variables);

        default:
            console.error(`Unknown expression type in getValue: ${expr.$type}`, expr);
            return '<unknown expression>';
    }
}