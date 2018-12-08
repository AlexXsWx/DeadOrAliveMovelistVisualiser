define(

    'Analysis/Parser',

    [ 'Analysis/Operators', 'Tools/Tools' ],

    function Parser(Operators, _) {

        // UnexpectedCharError

        function UnexpectedCharError(char, position) {
            this.message = 'Unexpected "' + char + '" at ' + (position + 1);
            this.stack = this.name + ': ' + this.message + '\n' + _.getStack(1);
        }
        UnexpectedCharError.prototype = Object.create(Error.prototype);
        UnexpectedCharError.prototype.constructor = UnexpectedCharError;
        UnexpectedCharError.prototype.name = 'UnexpectedCharError';
        UnexpectedCharError.prototype.toString = function toString() {
            return this.stack;
        };

        // ExpectedCharNotOccuredError

        function ExpectedCharNotOccuredError(char) {
            this.message = 'Expected "' + char + '"';
            this.stack = this.name + ': ' + this.message + '\n' + _.getStack(1);
        }
        ExpectedCharNotOccuredError.prototype = Object.create(Error.prototype);
        ExpectedCharNotOccuredError.prototype.constructor = ExpectedCharNotOccuredError;
        ExpectedCharNotOccuredError.prototype.name = 'ExpectedCharNotOccuredError';
        ExpectedCharNotOccuredError.prototype.toString = function toString() {
            return this.stack;
        };

        // Parsers

        // Escape

        function EscapeParser() {
            return {
                canParse: canParse,
                parse:    parse
            };
            function canParse(string, optOffset) {
                var offset = optOffset || 0;
                return string[offset] === '\\';
            }
            function parse(string, optOffset) {
                var offsetStart = optOffset || 0;
                var lastIndex = string.length - 1;
                if (lastIndex < offsetStart + 1) {
                    throw new UnexpectedCharError('EOL', string.length);
                }
                return {
                    parsed: string[offsetStart + 1],
                    consumed: 2
                };
            }
        }

        // String

        var escapeParser = new EscapeParser();

        function StringParser() {

            var stringBrackets = ['\'', '"', '`'];

            return {
                canParse: canParse,
                parse:    parse
            };
            function canParse(string, optOffset) {
                var offset = optOffset || 0;
                return _.contains(stringBrackets, string[offset]);
            }
            function parse(string, optOffset) {
                var offset = optOffset || 0;
                var finishingChar = string[offset];
                var result = '';
                var i = offset + 1;
                while (i < string.length) {
                    if (escapeParser.canParse(string, i)) {
                        var temp = escapeParser.parse(string, i);
                        result += temp.parsed;
                        i += temp.consumed;
                    } else
                    if (string[i] === finishingChar) {
                        i++;
                        return {
                            parsed: result,
                            consumed: i - offset
                        };
                    }　else {
                        result += string[i];
                        i++;
                    }
                }
                throw new ExpectedCharNotOccuredError(finishingChar);
            }
        }

        // Brackets

        var brackets = {
            '(': ')',
            '[': ']',
            '{': '}'
        };

        function BracketsParser() {

            var startingBrackets = Object.keys(brackets);

            return {
                canParse: canParse,
                parse:    parse
            };
            function canParse(string, optOffset) {
                var offset = optOffset || 0;
                return _.contains(startingBrackets, string[offset]);
            }
            function parse(string, optOffset, parseContent) {
                var offset = optOffset || 0;
                var finishingChar = brackets[string[offset]];
                var result = [];
                var i = offset + 1;
                while (i < string.length) {
                    if (string[i] === finishingChar) {
                        i++;
                        return {
                            parsed: result,
                            consumed: i - offset
                        };
                    } else {
                        var temp = parseContent(
                            string, i,
                            function(string, offset) {
                                return _.contains(_.mapValues(brackets), string[offset]);
                            }
                        );
                        result = result.concat(temp.parsed);
                        i += temp.consumed;
                    }
                }
                throw new ExpectedCharNotOccuredError(finishingChar);
            }
        }

        // All

        var Type1 = Operators.Type1;
        var Type2 = Operators.Type2;
        var Type3 = Operators.Type3;

        var stringParser   = new StringParser();
        var bracketsParser = new BracketsParser();
        var restParser     = new Parser();

        function Parser() {
            return {
                canParse: canParse,
                parse:    parse
            };
            function canParse(string, optOffset) {
                return true;
            }
            function parse(string, optOffset, optPredicate) {
                var offset = optOffset || 0;
                var i = offset;
                var result = [];
                while (i < string.length) {
                    if (escapeParser.canParse(string, i)) {
                        var temp = escapeParser.parse(string, i);
                        appendToLastString(result, temp.parsed);
                        i += temp.consumed;
                    } else
                    if (stringParser.canParse(string, i)) {
                        var temp = stringParser.parse(string, i);
                        result.push({
                            type: Type1.String,
                            value: temp.parsed
                            // startingChar: string[i]
                        });

                        i += temp.consumed;
                    } else
                    if (bracketsParser.canParse(string, i)) {
                        var startingChar = string[i];
                        var finishingChar = brackets[startingChar];
                        var temp = bracketsParser.parse(
                            string, i,
                            function(string, optOffset) {
                                return restParser.parse(
                                    string, optOffset || 0,
                                    function(string, offset) {
                                        var char = string[offset];
                                        if (_.contains(_.mapValues(brackets), char)) {
                                            if (char !== finishingChar) {
                                                throw new UnexpectedCharError(char, offset);
                                            }
                                            return true;
                                        }
                                        return false;
                                    }
                                );
                            }
                        );
                        result.push({
                            type: Type1.Group,
                            content: temp.parsed
                            // bracketType: startingChar
                        });
                        i += temp.consumed;
                    } else
                    if (optPredicate && optPredicate(string, i)) {
                        break;
                    } else {
                        appendToLastString(result, string[i]);
                        i++;
                    }
                }
                return {
                    parsed: result,
                    consumed: i - offset
                };
                function appendToLastString(result, str) {
                    if (
                        result.length === 0 ||
                        result[result.length - 1].type !== Type1.Raw
                    ) {
                        result.push({
                            type: Type1.Raw,
                            value: ''
                        });
                    }
                    result[result.length - 1].value += str;
                }
            }
        }

        // Root

        function RootParser() {
            return {
                canParse: canParse,
                parse:    parse
            };
            function canParse(string, optOffset) {
                return true;
            }
            function parse(string, optOffset) {
                var offset = optOffset || 0;
                var temp = restParser.parse(
                    string, offset,
                    function(string, offset) {
                        var char = string[offset];
                        if (_.contains(_.mapValues(brackets), char)) {
                            throw new UnexpectedCharError(char, offset);
                            return true;
                        }
                        return false;
                    }
                );
                if (temp.consumed !== string.length) {
                    throw new Error('Parsing didn\'t finish');
                }
                return temp.parsed;
            }
        }

        //

        // FIXME: debug
        window.parse = parse;

        var operatorsPerPrio = Operators.operatorsPerPrio;

        return { parse: parse };

        function parse(string) {

            var parsed = new RootParser().parse(string);

            console.log('parsed', parsed);

            var withOperators = replaceRecursively(
                parsed,
                function(entry, _returnOne, _returnMultiple, _goRecursive) {
                    switch (entry.type) {

                        case Type1.String:
                            return _returnOne({
                                type: Type2.String,
                                value: entry.value
                            });

                        case Type1.Group:
                            return _returnOne({
                                type: Type2.Group,
                                content: _goRecursive(entry.content)
                            });

                        case Type1.Raw:
                            return _returnMultiple(type1RawToType2(entry.value));

                        default: throw new Error('Unexpected type');
                    }
                }
            );

            console.log('withOperators', withOperators);

            var type = getType(withOperators);

            console.log('type', type.type);

            return type;

            function type1RawToType2(value) {

                var getters = [
                    {
                        type: Type2.Operator,
                        predicate: function(str) {
                            return operatorsPerPrio.some(function(operatorsGroup) {
                                return operatorsGroup.operators.some(function(operator) {
                                    return operator.str === str;
                                });
                            });
                        },
                        getValue: function(str) {
                            return str;
                            // return _.find(operatorsPerPrio, function(operatorsGroup) {
                            //     return operatorsGroup.operators.some(function(operator) {
                            //         return operator.str === str;
                            //     });
                            // });
                        }
                    }, {
                        type:      Type2.Boolean,
                        predicate: function(str) { return /^(true|false)$/.test(str); },
                        getValue:  function(str) { return str === 'true'; }
                    }, {
                        type:      Type2.Integer,
                        predicate: function(str) { return /^[+-]?\d+$/.test(str); },
                        getValue:  function(str) { return Number(str); }
                    }, {
                        type:      Type2.Boolean,
                        predicate: function(str) { return _.contains(['A', 'B', 'C', 'D'], str); },
                        getValue:  function(str) { return str === 'A' || str === 'C'; }
                    }
                ];
                // FIXME: when there is no space next to signed number
                var nonSpaceChunks = value.trim().split(/\s+/).filter(Boolean);
                return (
                    nonSpaceChunks.map(
                        function(nonSpaceChunk) {
                            var getter = _.find(getters, function(getter) {
                                return getter.predicate(nonSpaceChunk);
                            });
                            if (getter) {
                                return {
                                    type: getter.type,
                                    value: getter.getValue(nonSpaceChunk)
                                };
                            } else {
                                throw new Error('Unexpected part: ' + nonSpaceChunk)
                                // return {
                                //     type: Type2.Other,
                                //     value: nonSpaceChunk
                                // };
                            }
                        }
                    )
                );
            }
        }

        function getType(array) {
            return new TypeParser().parse(array.map(function(entry) {
                return {
                    type: null,
                    entry: entry,
                    getValue: null
                };
            }));
        }

        function TypeParser() {

            return { parse: parse };

            function parse(types) {

                // Special case: empty array

                if (types.length === 0) throw new Error('Empty has no type');

                // resolve primitive types

                for (var i = 0; i < types.length; i++) {
                    var entry = types[i].entry;
                    switch (entry.type) {
                        case Type2.Operator: break; // throw new Error('Operator has no type');
                        case Type2.Group:
                            var temp = getType(entry.content);
                            types[i].type     = temp.type;
                            types[i].getValue = temp.getValue;
                        break;
                        case Type2.Boolean: setPrimitive(types[i], Type3.Boolean, entry.value); break;
                        case Type2.Integer: setPrimitive(types[i], Type3.Integer, entry.value); break;
                        case Type2.String:  setPrimitive(types[i], Type3.String,  entry.value); break;
                        // case Type2.Other: throw new Error('Unexpected part: ' + entry.value);
                        default: throw new Error('Unexpected type ' + entry.type);
                    }
                }

                function setPrimitive(type, type3, value) {
                    type.type = type3;
                    type.getValue = function() {
                        return value;
                    };
                }

                //

                operatorsPerPrio.some(function(operatorsGroup) {
                    if (types.length <= 1) return true;

                    var indexes = types.reduce(
                        function(acc, type, index, types) {
                            if (
                                type.type === null &&
                                type.entry.type === Type2.Operator &&
                                operatorsGroup.operators.some(function(operator) {
                                    return operator.str === type.entry.value;
                                })
                            ) {
                                acc.push(index);
                            }
                            return acc;
                        },
                        []
                    );

                    if (indexes.length > 0) {
                        var leftToRight = operatorsGroup.leftToRight;
                        var start = leftToRight ? 0              : indexes.length - 1;
                        var end   = leftToRight ? indexes.length : -1;
                        var step  = leftToRight ? 1 : -1;
                        for (var k = start; k !== end; k += step) {
                            (function(){
                                var operator = _.find(operatorsGroup.operators, function(operator) {
                                    return operator.str === types[indexes[k]].entry.value;
                                });
                                var left, right;
                                if (leftToRight) {
                                    if (operator.left.length > 0) {
                                        left = take(operator.left, types, indexes[k] - 1, indexes);
                                    }
                                    if (operator.right.length > 0) {
                                        right = take(operator.right, types, indexes[k] + 1, indexes);
                                    }
                                } else {
                                    if (operator.right.length > 0) {
                                        right = take(operator.right, types, indexes[k] + 1, indexes);
                                    }
                                    if (operator.left.length > 0) {
                                        left = take(operator.left, types, indexes[k] - 1, indexes);
                                    }
                                }
                                types[indexes[k]].type = operator.type;
                                types[indexes[k]].getValue = function() {
                                    return operator.act(
                                        left  && left.getValue(),
                                        right && right.getValue()
                                    );
                                };
                            }());
                        }
                    }

                    return false;

                    function take(requirements, types, index, indexes) {
                        if (index < 0 || index > types.length) throw new Error('invalid index');
                        if (
                            !requirements.some(function(type) {
                                return types[index].type === type;
                            })
                        ) {
                            throw new Error('invalid type');
                        }
                        var result = types.splice(index, 1)[0];
                        for (var i = 0; i < indexes.length; i++) {
                            if (indexes[i] >= index) {
                                indexes[i]--;
                            }
                        }
                        return result;
                    }
                });

                if (types.length === 1) {
                    if (types[0].type !== null) {
                        return {
                            type:     types[0].type,
                            getValue: function() {
                                return types[0].getValue();
                            }
                        };
                    }
                }

                throw new Error('Failed to resolve type');
            }

        }

        function replaceRecursively(array, replaceFunc) {

            return goRecursively(array);

            function goRecursively(array) {
                return array.reduce(
                    function(acc, element) {
                        var result = replaceOne(function(returnOne, returnMultiple, getResult) {
                            replaceFunc(element, returnOne, returnMultiple, goRecursively);
                            return getResult([element]);
                        });
                        return acc.concat(result);
                    },
                    []
                );
            }

            function replaceOne(func) {
                var returnManager = createReturnManager();
                return func(returnOne, returnMultiple, getResult);

                function returnOne(returnValue)       { returnManager.setValue([returnValue]);   }
                function returnMultiple(returnValues) { returnManager.setValue(returnValues);    }
                function getResult(optValue)          { return returnManager.getValue(optValue); }

                function createReturnManager() {
                    var valueSet = false;
                    var value;
                    return {
                        setValue: setValue,
                        getValue: getValue
                    };
                    function setValue(newValue) {
                        if (valueSet) throw new Error('Value already set');
                        valueSet = true;
                        value = newValue;
                    }
                    function getValue(optDefaultValue) {
                        return valueSet ? value : optDefaultValue;
                    }
                }
            }
        }
    }

);
