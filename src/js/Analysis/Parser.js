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

        var stringBrackets = ['\'', '"', '`'];

        function StringParser() {
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
        var startingBrackets = Object.keys(brackets);

        function BracketsParser() {
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
                        appendToLastString(temp.parsed);
                        i += temp.consumed;
                    } else
                    if (stringParser.canParse(string, i)) {
                        var temp = stringParser.parse(string, i);
                        result.push({
                            startingChar: string[i],
                            parsed: [temp.parsed],
                            consumed: temp.consumed
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
                            startingChar: startingChar,
                            parsed: temp.parsed,
                            consumed: temp.consumed
                        });
                        i += temp.consumed;
                    } else
                    if (optPredicate && optPredicate(string, i)) {
                        break;
                    } else {
                        appendToLastString(string[i]);
                        i++;
                    }
                }
                return {
                    parsed: result,
                    consumed: i - offset
                };
                function appendToLastString(str) {
                    if (result.length === 0 || !_.isString(result[result.length - 1])) {
                        result.push('');
                    }
                    result[result.length - 1] += str;
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
                return temp;
            }
        }

        //

        // FIXME: debug
        window.parse = parse;

        var keywords = ['or', 'and', 'is', 'contains'/*, 'not'*/];

        var Type = {
            Raw:     'raw',
            Group:   'group',
            Keyword: 'keyword',
            String:  'string',
            Number:  'number',
            Other:   'other'
        };

        var escapeParser   = new EscapeParser();
        var stringParser   = new StringParser();
        var bracketsParser = new BracketsParser();
        var restParser     = new Parser();

        return { parse: parse };

        function parse(string) {

            var parsed = new RootParser().parse(string);

            var categorized;
            try {
                categorized = parsed.parsed.map(categorize);
            } catch(error) {
                console.log(error.toString());
            }

            return mapRecursively(
                categorized,
                function(entry, goRecursive) {
                    if (_.isString(entry)) {
                        return [entry];
                    }
                    if (entry.type === Type.String) {
                        return [entry];
                    }
                    if (entry.type === Type.Raw) {
                        return (
                            entry.value.split(/\s+/)
                                .map(function(str) { return str.trim(); })
                                .filter(Boolean)
                                .map(function(str) {
                                    if (_.contains(keywords, str.toLowerCase())) {
                                        return {
                                            type: Type.Keyword,
                                            value: str.toLowerCase()
                                        };
                                    } else {
                                        return {
                                            type: Type.Other,
                                            value: str
                                        };
                                    }
                                })
                        );
                    }
                    if (entry.content) {
                        var result = _.copyKeysInto({}, entry);
                        result.content = goRecursive(entry.content);
                        return [result];
                    } else {
                        return [entry];
                    }
                }
            );

            return categorized;
        }

        function categorize(parseResult) {
            if (_.isString(parseResult)) {
                return {
                    type: Type.Raw,
                    value: parseResult
                };
            } else {
                var mapped = parseResult.parsed.map(categorize);
                if (parseResult.startingChar) {
                    if (_.contains(startingBrackets, parseResult.startingChar)) {
                        return {
                            type: Type.Group,
                            bracketType: parseResult.startingChar,
                            content: mapped
                        };
                    } else
                    if (_.contains(stringBrackets, parseResult.startingChar)) {
                        console.assert(
                            (
                                mapped.length === 0 ||
                                (mapped.length === 1 && mapped[0].type === Type.Raw)
                            ),
                            "unexpected content of string"
                        );
                        return {
                            type: Type.String,
                            value: mapped.length === 1 ? mapped[0].value : ''
                        };
                    } else {
                        throw new Error('Unsupported starting char');
                    }
                } else {
                    throw new Error('Missing starting char');
                }
            }
        }

        function mapRecursively(array, mapFunc, optTemp) {
            var temp = (
                optTemp ||
                (function temp(array) { return mapRecursively(array, mapFunc, temp); })
            );
            return array.reduce(
                function(acc, entry) { return acc.concat(mapFunc(entry, temp)); },
                []
            );
        }
    }

);
