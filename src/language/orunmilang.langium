grammar Orunmilang

entry Program:
    statements+=Statement*;

Statement:
    VariableDeclaration ';'
    | VariableAssignment ';'
    | PrintStatement ';'
    | IfStatement
    | WhileStatement
    | FunctionDeclaration
    | ReturnStatement ';'
    | FunctionCall ';';  // Changed from FunctionCallStatement to FunctionCall

VariableDeclaration:
    'pa' name=ID 'pẹlu' value=Expression;

VariableAssignment:
    variable=[VariableDeclaration] 'fi' value=Expression;

PrintStatement:
    'tẹ' '(' value=PrintableValue ')';


IfStatement:
    'ti' '(' condition=Expression ')' ('ṣe')? '{' statements+=Statement* '}'
    ('bí' 'kò' 'ṣe' '{' elseStatements+=Statement* '}')?;

WhileStatement:
    'nigba' '(' condition=Expression ')' 'ṣe' '{' statements+=Statement* '}';

FunctionDeclaration:
    'iṣẹ' name=ID '(' (parameters+=Parameter (',' parameters+=Parameter)*)? ')' '{' statements+=Statement* '}';

Parameter:
    name=ID;

ReturnStatement:
    'pada' (value=Expression)?;

FunctionCall:
    'pe' ref=[FunctionDeclaration] '(' (arguments+=Expression (',' arguments+=Expression)*)? ')';

Expression:
    LogicalOrExpression;

LogicalOrExpression:
    left=LogicalAndExpression
    ( 'tabi' rights+=LogicalAndExpression )*;

LogicalAndExpression:
    left=EqualityExpression
    ( 'ati' rights+=EqualityExpression )*;

EqualityExpression:
    left=RelationalExpression
    ( (op+=('==' | '!=')) rights+=RelationalExpression )*;

RelationalExpression:
    left=AdditiveExpression
    ( (op+=('<' | '<=' | '>' | '>=')) rights+=AdditiveExpression )*;

AdditiveExpression:
    left=MultiplicativeExpression
    ( (op+=('+' | '-')) rights+=MultiplicativeExpression )*;

MultiplicativeExpression:
    left=PrimaryExpression
    ( (op+=('*' | '/')) rights+=PrimaryExpression )*;

PrimaryExpression:
    NumericLiteral
    | TextLiteral
    | BooleanLiteral
    | VariableReference
    | FunctionCall
    | '(' Expression ')';

PrintableValue:
    TextLiteral | NumericLiteral | BooleanLiteral | VariableReference | FunctionCall;

TextLiteral:
    value=STRING;

NumericLiteral:
    value=NUMBER;


NamedElement:
    VariableDeclaration | Parameter;

VariableReference:
    variable=[NamedElement];


terminal BEE_NI: 'bẹẹni';
terminal RARA: 'rara';

BooleanLiteral:
    bool=BEE_NI | bool=RARA;

terminal ID: /[a-zA-ZẹọṣàáèéìíòóùúẸỌṢÀÁÈÉÌÍÒÓÙÚ_][a-zA-Z0-9ẹọṣàáèéìíòóùúẸỌṢÀÁÈÉÌÍÒÓÙÚ_]*/;

terminal NUMBER: /[-]?[0-9]+(\.[0-9]+)?/;

terminal STRING: /"([^"\\]|\\.)*"|'([^'\\]|\\.)*'/;

hidden terminal WS: /\s+/;
hidden terminal ML_COMMENT: /\/\*[^*]*\*+([^/*][^*]*\*+)*\//;
hidden terminal SL_COMMENT: /\/\/.*/;