grammar Orunmilang

entry Program:
    (declarations+=VariableDeclaration ';')*
    (assignments+=VariableAssignment ';')*
    (statements+=PrintStatement ';')*;

VariableDeclaration:
    'pa' name=ID 'pẹlu' value=(TextLiteral | NumericLiteral);

VariableAssignment:
    variable=[VariableDeclaration] 'fi' value=PrintableValue;

PrintStatement:
    'tẹ' '(' value=PrintableValue ')';

PrintableValue:
    TextLiteral | NumericLiteral | VariableReference;

TextLiteral:
    value=STRING;

NumericLiteral:
    value=NUMBER;

VariableReference:
    variable=[VariableDeclaration];

terminal ID: /[a-zA-ZẹọṣàáèéìíòóùúẸỌṢÀÁÈÉÌÍÒÓÙÚ_][a-zA-Z0-9ẹọṣàáèéìíòóùúẸỌṢÀÁÈÉÌÍÒÓÙÚ_]*/;

terminal NUMBER: /[-]?[0-9]+(\.[0-9]+)?/;

terminal STRING: /"([^"\\]|\\.)*"|'([^'\\]|\\.)*'/;

hidden terminal WS: /\s+/;
