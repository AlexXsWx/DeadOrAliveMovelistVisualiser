define(

    'Analysis/Parser',

    [ 'Tools/Tools' ],

    function Parser(_) {

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

        var Type1 = {
            Raw:     't1_raw',
            Group:   't1_group',
            String:  't1_string'
        };

        var Type2 = {
            Keyword: 't2_keyword',
            Other:   't2_other',
            Group:   't2_group',
            String:  't2_string'
        };

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

        var keywords = [
            'is'
            // 'or',
            // 'and',
            // 'not',
            // 'contains'
        ];

        return { parse: parse };

        function parse(string) {

            var parsed = new RootParser().parse(string);

            console.log('parsed', parsed);

            var withKeywords = replaceRecursively(
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
                            return _returnMultiple(type1RawToType2Keywords(entry.value));

                        default: throw new Error('Unexpected type');
                    }
                }
            );

            console.log('withKeywords', withKeywords);

            return withKeywords;

            function type1RawToType2Keywords(value) {
                var nonSpaceChunks = value.trim().split(/\s+/);
                return (
                    nonSpaceChunks.map(
                        function toKeywordOrOther(nonSpaceChunk) {
                            if (_.contains(keywords, nonSpaceChunk.toLowerCase())) {
                                return {
                                    type: Type2.Keyword,
                                    value: nonSpaceChunk.toLowerCase()
                                };
                            } else {
                                return {
                                    type: Type2.Other,
                                    value: nonSpaceChunk
                                };
                            }
                        }
                    ).reduce(
                        function joinOthers(acc, curr) {
                            if (
                                curr.type === Type2.Other &&
                                acc.length > 0 &&
                                acc[acc.length - 1].type === Type2.Other
                            ) {
                                acc[acc.length - 1].value += ' ' + curr.value;
                                return acc;
                            }
                            return acc.concat(curr);
                        },
                        []
                    )
                );
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
