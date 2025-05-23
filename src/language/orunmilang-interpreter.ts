        // src/language/orunmilang-interpreter.ts

        function safeStringify(obj: any, space?: number): string {
            const replacer = (key: string, value: any) => {
                if (key === '$container' || key === '$cstNode' || key === 'root' || key === 'container') return undefined;
                return value;
            };
            return JSON.stringify(obj, replacer, space);
        }

        export function simulateExecution(program: any): string {
            const variables: Record<string, any> = {};
            const functions: Record<string, any> = {}; // Store function declarations
            let outputBuffer = '';

            // Helper to execute statements recursively
            function executeStatements(statements: any[], localVars: Record<string, any> = variables) {
                for (const statement of statements) {
                    switch (statement.$type) {
                        case 'VariableDeclaration':
                            localVars[statement.name] = getValue(statement.value, localVars);
                            break;

                        case 'VariableAssignment':
                            const varName = statement.variable?.$refText;
                            const val = getValue(statement.value, localVars);
                            if (varName) {
                                localVars[varName] = val;
                            }
                            break;

                        case 'PrintStatement':
                            const output = getValue(statement.value, localVars);
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
                            if (evaluateExpression(statement.condition, localVars)) {
                                executeStatements(statement.statements, localVars);
                            } else if (statement.elseStatements) {
                                executeStatements(statement.elseStatements, localVars);
                            }
                            break;
                            case 'WhileStatement':
                                while (evaluateExpression(statement.condition, localVars)) {
                                    const res: { type: string, value: any } = executeStatements(statement.statements, localVars);
                                    if (res.type === 'return') return res;  // propagate return and stop loop
                                }
                                break;

                        case 'FunctionDeclaration':
                            functions[statement.name] = statement; // Store function in global context
                            break;

                        case 'ReturnStatement':
                            return { type: 'return', value: statement.value ? getValue(statement.value, localVars) : undefined };

                        case 'FunctionCall':
                            const callResult = executeFunctionCall(statement, localVars);
                            if (callResult && callResult.type === 'return') {
                                return callResult; // propagate return upwards
                            }
                            break;

                        default:
                            outputBuffer += `⚠️ Unknown statement type: ${statement.$type}\n`;
                    }
                }
                return { type: 'normal', value: undefined }; // Default return for non-returning blocks
            }

            // Helper to execute a function call
            function executeFunctionCall(call: any, vars: Record<string, any>): any {
                const func = functions[call.ref?.$refText];
                if (!func) {
                    outputBuffer += `⚠️ Undefined function: ${call.ref?.$refText}\n`;
                    return undefined;
                }

                // Evaluate arguments
                const args = call.arguments ? call.arguments.map((arg: any) => getValue(arg, vars)) : [];

                // Create new local scope for function execution
                const localVars: Record<string, any> = { ...vars };
                func.parameters.forEach((param: any, index: number) => {
                    localVars[param.name] = args[index] !== undefined ? args[index] : undefined;
                });

                // Execute function body
                const result = executeStatements(func.statements, localVars);
                return result.type === 'return' ? result.value : undefined;
            }

            function stringify(value: any): string {
                if (value === undefined) return 'undefined';
                if (value === null) return 'null';
                if (typeof value === 'boolean') return value ? 'bẹẹni' : 'rara';
                return String(value); // Direct string conversion for numbers and strings
            }

            function evaluateExpression(expr: any, variables: Record<string, any>): any {
                if (!expr) {
                    throw new Error('evaluateExpression called with undefined or null expr');
                }

                if (!expr.$type) {
                    console.error("Invalid expression encountered:", expr);
                    throw new Error(`Invalid expression node or missing $type: ${safeStringify(expr)}`);
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
                                if (typeof result === 'boolean' || typeof right === 'boolean') {
                                    result = Boolean(result) === Boolean(right);
                                } else {
                                    result = result === right;
                                }
                            } else if (op === '!=') {
                                result = result !== right;
                            } else {
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
                            return leftRel;
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
                            throw new Error('AdditiveExpression missing left, rights, or op');
                        }
                        let sum = evaluateExpression(expr.left, variables);
                        for (let i = 0; i < (expr.op?.length || 0); i++) {
                            if (!expr.rights[i]) {
                                throw new Error('Missing right operand in AdditiveExpression');
                            }
                            const op = expr.op[i];
                            const right = evaluateExpression(expr.rights[i], variables);
                            if (op === '+') sum += right;
                            else if (op === '-') sum -= right;
                        }
                        return sum;

                    case 'MultiplicativeExpression':
                        let prod = evaluateExpression(expr.left, variables);
                        for (let i = 0; i < (expr.op?.length || 0); i++) {
                            const op = expr.op[i];
                            const right = evaluateExpression(expr.rights[i], variables);
                            if (op === '*') prod *= right;
                            else if (op === '/') prod /= right;
                        }
                        return prod;

                    case 'PrimaryExpression':
                        if (expr.NumericLiteral) return Number(expr.NumericLiteral.value);
                        if (expr.TextLiteral) return expr.TextLiteral.value.slice(1, -1);
                        if (expr.BooleanLiteral) return expr.BooleanLiteral.bool === 'bẹẹni';
                        if (expr.VariableReference) {
                            const v = expr.VariableReference.variable?.$refText;
                            if (!v) {
                                throw new Error('Invalid VariableReference in PrimaryExpression');
                            }
                            return variables[v] ?? '<undefined variable>';
                        }
                        if (expr.FunctionCall) {
                            return executeFunctionCall(expr.FunctionCall, variables);
                        }
                        if (expr.Expression) return evaluateExpression(expr.Expression, variables);
                        throw new Error('Invalid PrimaryExpression: ' + safeStringify(expr));

                    case 'TextLiteral':
                        // Remove quotes only if they exist and match
                        const str = expr.value;
                        if ((str.startsWith('"') && str.endsWith('"')) || 
                            (str.startsWith("'") && str.endsWith("'"))) {
                            return str.slice(1, -1);
                        }
                        return str; // Return as-is if no matching quotes

                    case 'NumericLiteral':
                        return Number(expr.value);

                    case 'BooleanLiteral':
                        return expr.bool === 'bẹẹni';

                    case 'VariableReference':
                        const varName = expr.variable?.$refText;
                        return varName ? variables[varName] : '<undefined variable>';

                    case 'FunctionCall':
                        return executeFunctionCall(expr, variables);

                    default:
                        throw new Error(`Unknown expression type: ${expr.$type}`);
                }
            }

            function getValue(expr: any, variables: Record<string, any>): any {
                if (!expr || !expr.$type) {
                    throw new Error(`Invalid expression: ${safeStringify(expr, 2)}`);
                }
                switch (expr.$type) {
                    case 'TextLiteral':
                        // Remove ONLY the surrounding quotes, preserve all other characters
                        const strValue = expr.value;
                        if ((strValue.startsWith('"') && strValue.endsWith('"'))) {
                            return strValue.slice(1, -1);
                        }
                        if ((strValue.startsWith("'") && strValue.endsWith("'"))) {
                            return strValue.slice(1, -1);
                        }
                        return strValue; 
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
                    case 'FunctionCall':
                        return executeFunctionCall(expr, variables);
                    default:
                        return evaluateExpression(expr, variables);
                }
            }

            executeStatements(program.statements);
            return outputBuffer;
        }