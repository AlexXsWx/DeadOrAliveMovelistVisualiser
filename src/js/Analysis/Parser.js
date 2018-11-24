define(

    'Analysis/Parser',

    [ 'Tools/Tools' ],

    function Parser(_) {

        // UnexpectedCharError

        function UnexpectedCharError(char) {
            this.message = 'Unexpected "' + char + '"';
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

        // FIXME: debug
        window.parse = parse;

        return { parse: parse };

        function parse(string) {
            try {
                return debugFlatten(createCharsToBitsParser(string));
            } catch(error) {
                console.log(error.toString());
            }
        }

        function createCharsToBitsParser(string, optStartingChar, optFinishingChar) {

            var stringBrackets = ['\'', '"', '`'];

            var brackets = {
                '\'' : '\'',
                '"'  : '"',
                '`'  : '`',
                '('  : ')',
                '['  : ']'
            };

            var treatAsString = optStartingChar && _.contains(stringBrackets, optStartingChar);

            var parsed = [];

            var buffer = '';

            var escaping = false;

            return parse(string);

            function parse(string) {
                var i = 0;
                var done = false;
                while (i < string.length) {
                    var feedResult = feed(string[i], i, string)
                    i += feedResult.offset;
                    if (feedResult.done) {
                        done = true;
                        break;
                    }
                }
                if (!done && optFinishingChar) {
                    throw new ExpectedCharNotOccuredError(optFinishingChar);
                }
                flushBuffer();
                return {
                    startingChar:  optStartingChar,
                    finishingChar: optFinishingChar,
                    parsed: parsed,
                    offset: i,
                    rest: string.substr(i)
                };
            }

            function feed(char, index, string) {
                if (handleEscaping(char)) {
                    return {
                        offset: 1,
                        done: false
                    };
                }

                if (optFinishingChar && char === optFinishingChar) {
                    flushBuffer();
                    return {
                        offset: 1,
                        done: true
                    };
                }

                if (!treatAsString) {
                    if (brackets.hasOwnProperty(char)) {
                        flushBuffer();
                        var startingChar  = char;
                        var finishingChar = brackets[startingChar];
                        var temp = createCharsToBitsParser(
                            string.substr(index + 1),
                            startingChar,
                            finishingChar
                        );
                        parsed.push(temp);
                        return {
                            offset: 1 + temp.offset,
                            done: false
                        };
                    } else 
                    if (_.contains(_.mapValues(brackets), char)) {
                        throw new UnexpectedCharError(char);
                    }
                }

                buffer += char;
                return {
                    offset: 1,
                    done: false
                };
            }

            function handleEscaping(char) {
                if (escaping) {
                    buffer += char;
                    escaping = false;
                    return true;
                } else {
                    if (char === '\\') {
                        escaping = true;
                        return true;
                    }
                }
                return false;
            }

            function flushBuffer() {
                if (buffer.length > 0) {
                    parsed.push(buffer);
                    buffer = '';
                }
            }
        }

        function debugFlatten(parseResult) {
            if (typeof parseResult === 'string') {
                return parseResult;
            } else {
                return parseResult.parsed.map(debugFlatten);
            }
        }
    }

);
