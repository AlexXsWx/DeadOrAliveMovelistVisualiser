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
                                getValue2: function(extra) { return entry.value; }
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

            return {
                type:     type.type,
                getValue: function(extra) {
                    return type.getValue(extra);
                }
            };

            function type1RawToType2(value) {

                var getters = [
                    {
                        type: Type2.Operator,
                        predicate: function(str) {
                            return operatorsPerPrio.some(function(operatorsGroup) {
                                return operatorsGroup.operators.some(function(operator) {
                                    return _.contains(operator.str, str);
                                });
                            });
                        },
                        getValue1: function(str, extra) { return str; }
                    }, {
                        type:      Type2.Boolean,
                        predicate: function(str) { return /^(true|false)$/.test(str); },
                        getValue1: function(str, extra) { return str === 'true'; }
                    }, {
                        type:      Type2.Integer,
                        predicate: function(str) { return /^([+-]?(\d+|Infinity)|NaN)$/.test(str); },
                        getValue1: function(str, extra) { return Number(str); }
                    }
                ].concat(Operators.accessors);

                // FIXME: when there is no space next to signed number
                var nonSpaceChunks = value.trim().split(/\s+/).filter(Boolean);
                return nonSpaceChunks.map(
                    function(nonSpaceChunk) {
                        var getter = _.find(getters, function(getter) {
                            return getter.predicate(nonSpaceChunk);
                        });
                        if (getter) {
                            return {
                                type: getter.type,
                                getValue2: function(extra) {
                                    return getter.getValue1(nonSpaceChunk, extra);
                                }
                            };
                        } else {
                            throw new Error('Unexpected part: ' + nonSpaceChunk);
                        }
                    }
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
                        case Type2.Boolean:     copy(types[i], Type3.Boolean,     entry.getValue2); break;
                        case Type2.Integer:     copy(types[i], Type3.Integer,     entry.getValue2); break;
                        case Type2.String:      copy(types[i], Type3.String,      entry.getValue2); break;
                        case Type2.ArrayString: copy(types[i], Type3.ArrayString, entry.getValue2); break;
                        default: throw new Error('Unexpected type ' + entry.type);
                    }
                }

                function copy(type, type3, getValueFunc) {
                    type.type = type3;
                    type.getValue = getValueFunc;
                }

                //

                operatorsPerPrio.some(function(operatorsGroup) {
                    if (types.length <= 1) return true;

                    var indices = types.reduce(
                        function(acc, type, index, types) {
                            if (
                                type.type === null &&
                                type.entry.type === Type2.Operator
                            ) {
                                var operatorStr = type.entry.getValue2();
                                if (
                                    operatorsGroup.operators.some(function(operator) {
                                        return _.contains(operator.str, operatorStr);
                                    })
                                ) {
                                    acc.push(index);
                                }
                            }
                            return acc;
                        },
                        []
                    );

                    if (indices.length > 0) {
                        var leftToRight = operatorsGroup.leftToRight;
                        var start = leftToRight ? 0              : indices.length - 1;
                        var end   = leftToRight ? indices.length : -1;
                        var step  = leftToRight ? 1 : -1;
                        for (var k = start; k !== end; k += step) {
                            (function(){
                                var operatorStr = types[indices[k]].entry.getValue2();
                                var operator = _.find(operatorsGroup.operators, function(operator) {
                                    return (
                                        _.contains(operator.str, operatorStr) &&
                                        operator.check(types, indices[k]).valid
                                    );
                                });
                                if (!operator) return;
                                var checkResult = operator.check(types, indices[k]);
                                var args = checkResult.offsetsToTake.map(function(offset) {
                                    return take(types, indices[k] + offset, indices);
                                });
                                types[indices[k]].type = operator.type;
                                types[indices[k]].getValue = function(extra) {
                                    return operator.act(args, extra);
                                };
                                // TODO: restart from top prio?
                            }());
                        }
                    }

                    return false;

                    function take(types, index, indices) {
                        var result = types.splice(index, 1)[0];
                        for (var i = 0; i < indices.length; i++) {
                            if (indices[i] >= index) {
                                indices[i]--;
                            }
                        }
                        return result;
                    }
                });

                if (types.length === 1) {
                    if (types[0].type !== null) {
                        return {
                            type:     types[0].type,
                            getValue: types[0].getValue
                        };
                    }
                }

                throw new Error('Invalid expression');
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
