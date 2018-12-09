define(

    'Analysis/Operators',

    [ 'Model/NodeFactory', 'Tools/Tools' ],

    function Operators(NodeFactory, _) {

        var Type1 = {
            Raw:     't1_raw',
            Group:   't1_group',
            String:  't1_string'
        };

        var Type2 = {
            Operator:    't2_operator',
            Group:       't2_group',
            Boolean:     't2_boolean',
            Integer:     't2_integer',
            String:      't2_string',
            ArrayString: 't2_array_string'
        };

        var Type3 = {
            Boolean:     't3_boolean',
            Integer:     't3_integer',
            String:      't3_string',
            ArrayString: 't3_array_string',
            ArraySet:    't3_array_set'
        };

        //

        var type3Casters = createCastingManager();
        type3Casters.addCaster(
            Type3.String, Type3.ArraySet,
            function(value) { return ArraySet.createFromValue(value); }
        );
        type3Casters.addCaster(
            Type3.String, Type3.ArrayString,
            function(value) { return [value]; }
        );
        type3Casters.addCaster(
            Type3.ArrayString, Type3.ArraySet,
            function(value) { return ArraySet.createFromArray(value); }
        );

        //

        function ArraySet(values) {
            var arrays = values;
            return {
                _getArrays: _getArrays,
                satisfiesIs:       satisfiesIs,
                satisfiesContains: satisfiesContains
            };
            function _getArrays() {
                return arrays;
            }
            function satisfiesIs(testSet) {
                return testSet._getArrays().some(function(testArray) {
                    return _getArrays().some(function(array) {
                        return (
                            testArray.length === 0 && array.length === 0 ||
                            arrayContains(testArray, array) &&
                            arrayContains(array, testArray)
                        );
                    });
                });
            }
            function satisfiesContains(testSet) {
                return testSet._getArrays().some(function(testArray) {
                    return _getArrays().some(function(array) {
                        return arrayContains(testArray, array);
                    });
                });
            }
            function arrayContains(array, values) {
                return values.every(function(element) {
                    return _.contains(array, element);
                });
            }
        }
        ArraySet.createFromValue = function(value) {
            return new ArraySet([[value]]);
        };
        ArraySet.createFromArray = function(values) {
            return new ArraySet([values]);
        };
        ArraySet.createAnd = function(leftSet, rightSet) {
            var leftArrays  = leftSet._getArrays();
            var rightArrays = rightSet._getArrays();
            var values = [];
            leftArrays.forEach(function(leftArray) {
                rightArrays.forEach(function(rightArray) {
                    values.push(leftArray.concat(rightArray));
                });
            });
            return new ArraySet(values);
        };
        ArraySet.createOr = function(leftSet, rightSet) {
            var values = leftSet._getArrays().concat(rightSet._getArrays());
            return new ArraySet(values);
        };
        ArraySet.createEmpty = function() {
            return new ArraySet([[]]);
        };

        //

        /**
            move                                 // bool
            stance                               // bool

            move and throw                       // bool and bool
            move and hold  and strike            // bool and bool and bool

            move  or stance                      // bool or bool
            throw or hold   or strike            // bool or bool or bool

            ???
             move and throw  or strike           // bool and bool or bool
            (move and throw) or strike           // bool or bool
             move and (throw or strike)          // bool and bool

             move or throw  and strike           // bool or bool and bool
            (move or throw) and strike           // bool and bool
             move or (throw and strike)          // bool or  bool

            not throw                            // not bool

            stance or not throw
            move and not throw

            stance or not throw
            move and not throw

            ???
            move and not throw or hold           // bool (and not) bool or bool
            move (and not) throw or hold         // bool (and not) bool or bool <-- useless
            move and (not throw) or hold         // bool and bool or bool

            context is "STD"
            ending is "STD" or "BT"
            context is "STD" or ending is "BT"
            context is ending

            ... does not contain ...
            ... is not ...
            ... is ...
            not ...
            ... and ...
            ... or ...
            ... contains ...

            ending is not "STD" or "WF"
            ending is "W..." or "WF" or "WS" or "WC"
            context contains "low hp"
            ending is "BT" and advantageOnBlock >= 0

            A and B contains "str"
            (A contains "str") and (B contains "str")
            [A, B] contains "str"
         */

        //

        function createCheckBothFunction(typeLeft, typeRight) {
            return function(array, index) {
                var leftOffset = -1;
                var rightOffset = 1;
                var left  = _.getOrThrow(array, index + leftOffset);
                var right = _.getOrThrow(array, index + rightOffset);
                return {
                    valid: (
                        left  && type3Casters.canCast(left.type,  typeLeft) &&
                        right && type3Casters.canCast(right.type, typeRight)
                    ),
                    offsetsToTake: [leftOffset, rightOffset]
                };
            };
        }

        function createActOnBoth(typeLeft, typeRight, func) {
            return function(args, extra) {
                var left  = args[0];
                var right = args[1];
                var lv = type3Casters.castValue(left.getValue(extra),  left.type,  typeLeft);
                var rv = type3Casters.castValue(right.getValue(extra), right.type, typeRight);
                return func(lv, rv);
            }
        }

        //

        function createCheckRightFunction(typeRight, optExcludeTypeLeft) {
            return function(array, index) {
                var rightOffset = 1;
                var right = _.getOrThrow(array, index + rightOffset);
                var valid = right && type3Casters.canCast(right.type, typeRight);
                if (optExcludeTypeLeft) {
                    var leftOffset = -1;
                    if (index + leftOffset >= 0) {
                        var left = _.getOrThrow(array, index + leftOffset);
                        if (left && type3Casters.canCast(left.type, optExcludeTypeLeft)) {
                            valid = false;
                        }
                    }
                }
                return {
                    valid: valid,
                    offsetsToTake: [rightOffset]
                };
            };
        }

        function createActOnRight(typeRight, func) {
            return function(args, extra) {
                var right = args[0];
                var rv = type3Casters.castValue(right.getValue(extra), right.type, typeRight);
                return func(rv);
            }
        }

        //

        var operators = {
            // max
            // min
            // ? :
            unaryMinus: {
                str: [ '-', 'neg', 'negate', 'inv', 'invert', 'inverse' ],
                type: Type3.Integer,
                check: createCheckRightFunction(Type3.Integer, Type3.Integer),
                act: createActOnRight(Type3.Integer, function(right) { return -right; })
            },
            unaryPlus: {
                str: [ '+' ],
                type: Type3.Integer,
                check: createCheckRightFunction(Type3.Integer, Type3.Integer),
                act: createActOnRight(Type3.Integer, function(right) { return right; })
            },
            absolute: {
                str: [ 'abs', 'absolute' ],
                type: Type3.Integer,
                check: createCheckRightFunction(Type3.Integer),
                act: createActOnRight(Type3.Integer, function(right) { return Math.abs(right); })
            },
            isNaN: {
                str: [ 'isNaN', 'notNumber', 'not_a_number' ],
                type: Type3.Boolean,
                check: createCheckRightFunction(Type3.Integer),
                act: createActOnRight(Type3.Integer, function(right) { return isNaN(right); })
            },
            isFinite: {
                str: [ 'finite', 'isFinite', 'is_finite' ],
                type: Type3.Boolean,
                check: createCheckRightFunction(Type3.Integer),
                act: createActOnRight(Type3.Integer, function(right) { return isFinite(right); })
            },
            multiply: {
                str: [ '*', 'mul', 'multiply', 'times' ],
                type: Type3.Integer,
                check: createCheckBothFunction(Type3.Integer, Type3.Integer),
                act: createActOnBoth(
                    Type3.Integer, Type3.Integer,
                    function(left, right) { return left * right; }
                )
            },
            divide: {
                str: [ '/', 'div', 'divide' ],
                type: Type3.Integer,
                check: createCheckBothFunction(Type3.Integer, Type3.Integer),
                act: createActOnBoth(
                    Type3.Integer, Type3.Integer,
                    function(left, right) { return left / right; }
                )
            },
            modulo: {
                str: [ '%', 'mod', 'modulo' ],
                type: Type3.Integer,
                check: createCheckBothFunction(Type3.Integer, Type3.Integer),
                act: createActOnBoth(
                    Type3.Integer, Type3.Integer,
                    function(left, right) { return left % right; }
                )
            },
            add: {
                str: [ '+', 'plus' ],
                type: Type3.Integer,
                check: createCheckBothFunction(Type3.Integer, Type3.Integer),
                act: createActOnBoth(
                    Type3.Integer, Type3.Integer,
                    function(left, right) { return left + right; }
                )
            },
            subtract: {
                str: [ '-', 'minus', 'sub', 'subtract' ],
                type: Type3.Integer,
                check: createCheckBothFunction(Type3.Integer, Type3.Integer),
                act: createActOnBoth(
                    Type3.Integer, Type3.Integer,
                    function(left, right) { return left - right; }
                )
            },
            lessThan: {
                str: [ '<' ],
                type: Type3.Boolean,
                check: createCheckBothFunction(Type3.Integer, Type3.Integer),
                act: createActOnBoth(
                    Type3.Integer, Type3.Integer,
                    function(left, right) { return left < right; }
                )
            },
            lessThanOrEqualTo: {
                str: [ '<=' ],
                type: Type3.Boolean,
                check: createCheckBothFunction(Type3.Integer, Type3.Integer),
                act: createActOnBoth(
                    Type3.Integer, Type3.Integer,
                    function(left, right) { return left <= right; }
                )
            },
            greaterThan: {
                str: [ '>' ],
                type: Type3.Boolean,
                check: createCheckBothFunction(Type3.Integer, Type3.Integer),
                act: createActOnBoth(
                    Type3.Integer, Type3.Integer,
                    function(left, right) { return left > right; }
                )
            },
            greaterThanOrEqualTo: {
                str: [ '>=' ],
                type: Type3.Boolean,
                check: createCheckBothFunction(Type3.Integer, Type3.Integer),
                act: createActOnBoth(
                    Type3.Integer, Type3.Integer,
                    function(left, right) { return left >= right; }
                )
            },
            equalTo: {
                str: [ 'is', 'are', 'eq', '=', '==', '===' ],
                type: Type3.Boolean,
                check: createCheckBothFunction(Type3.Integer, Type3.Integer),
                act: createActOnBoth(
                    Type3.Integer, Type3.Integer,
                    function(left, right) { return left === right; }
                )
            },
            notEqualTo: {
                str: [ 'notEq', '!=', '!==', '/=', '=/=', '<>' ],
                type: Type3.Boolean,
                check: createCheckBothFunction(Type3.Integer, Type3.Integer),
                act: createActOnBoth(
                    Type3.Integer, Type3.Integer,
                    function(left, right) { return left === right; }
                )
            },
            // setNot: {
            //     str: [ '!', 'not' ],
            //     type: Type3.ArraySet,
            //     check: createCheckRightFunction(Type3.ArraySet),
            //     act: createActOnRight(
            //         Type3.ArraySet,
            //         function(right) { return ArraySet.createNot(right); }
            //     )
            // },
            setAnd: {
                str: [ 'and', '&', '&&' ],
                type: Type3.ArraySet,
                check: createCheckBothFunction(Type3.ArraySet, Type3.ArraySet),
                act: createActOnBoth(
                    Type3.ArraySet, Type3.ArraySet,
                    function(left, right) { return ArraySet.createAnd(left, right); }
                )
            },
            setOr: {
                str: [ 'or', '|', '||' ],
                type: Type3.ArraySet,
                check: createCheckBothFunction(Type3.ArraySet, Type3.ArraySet),
                act: createActOnBoth(
                    Type3.ArraySet, Type3.ArraySet,
                    function(left, right) { return ArraySet.createOr(left, right); }
                )
            },
            containsSet: {
                str: [ 'contains', 'contain', 'includes', 'include', 'has', 'have' ],
                type: Type3.Boolean,
                check: createCheckBothFunction(Type3.ArraySet, Type3.ArraySet),
                act: createActOnBoth(
                    Type3.ArraySet, Type3.ArraySet,
                    function(left, right) { return right.satisfiesContains(left); }
                )
            },
            booleanNot: {
                str: [ '!', 'not' ],
                type: Type3.Boolean,
                check: createCheckRightFunction(Type3.Boolean),
                act: createActOnRight(Type3.Boolean, function(right) { return !right; })
            },
            stringIs: {
                str: [ 'is', 'are', 'eq', '=', '==', '===' ],
                type: Type3.Boolean,
                check: createCheckBothFunction(Type3.String, Type3.String),
                act: createActOnBoth(
                    Type3.String, Type3.String,
                    function(left, right) { return left === right; }
                )
            },
            stringArrayIs: {
                str: [ 'is', 'are', 'eq', '=', '==', '===' ],
                type: Type3.Boolean,
                check: createCheckBothFunction(Type3.ArraySet, Type3.ArraySet),
                act: createActOnBoth(
                    Type3.ArraySet, Type3.ArraySet,
                    function(left, right) { return right.satisfiesIs(left); }
                )
            },
            // containsStr: {
            //     str: [ 'contains', 'contain', 'includes', 'include', 'has', 'have' ],
            //     type: Type3.Boolean,
            //     check: createCheckBothFunction(Type3.String, Type3.String),
            //     act: createActOnBoth(
            //         Type3.String, Type3.String,
            //         function(left, right) {
            //             return left.toLowerCase().indexOf(right.toLowerCase()) >= 0;
            //         }
            //     )
            // },
            // contains: {
            //     str: [ 'contains', 'contain', 'includes', 'include', 'has', 'have' ],
            //     type: Type3.Boolean,
            //     check: createCheckBothFunction(Type3.ArrayString, Type3.String),
            //     act: createActOnBoth(
            //         Type3.ArrayString, Type3.String,
            //         function(left, right) { return _.contains(left, right); }
            //     )
            // },
            booleanAnd: {
                str: [ 'and', '&', '&&' ],
                type: Type3.Boolean,
                check: createCheckBothFunction(Type3.Boolean, Type3.Boolean),
                act: createActOnBoth(
                    Type3.Boolean, Type3.Boolean,
                    function(left, right) { return Boolean(left && right); }
                )
            },
            booleanOr: {
                str: [ 'or', '|', '||' ],
                type: Type3.Boolean,
                check: createCheckBothFunction(Type3.Boolean, Type3.Boolean),
                act: createActOnBoth(
                    Type3.Boolean, Type3.Boolean,
                    function(left, right) { return Boolean(left || right); }
                )
            }
        };

        //

        var operatorsPerPrio = [
            {
                leftToRight: false,
                operators: [
                    operators.unaryMinus,
                    operators.unaryPlus,
                    operators.absolute,
                    operators.isNaN,
                    operators.isFinite
                ]
            }, {
                leftToRight: true,
                operators: [
                    operators.multiply,
                    operators.divide,
                    operators.modulo

                ]
            }, {
                leftToRight: true,
                operators: [
                    operators.add,
                    operators.subtract
                ]
            }, {
                leftToRight: true,
                operators: [
                    operators.lessThan,
                    operators.lessThanOrEqualTo,
                    operators.greaterThan,
                    operators.greaterThanOrEqualTo,
                    operators.equalTo,
                    operators.notEqualTo
                ]
            },
            // { leftToRight: false, operators: [ operators.setNot      ] },
            { leftToRight: true,  operators: [ operators.setAnd      ] },
            { leftToRight: true,  operators: [ operators.setOr       ] },
            { leftToRight: true,  operators: [ operators.containsSet ] },
            { leftToRight: false, operators: [ operators.booleanNot  ] },
            { leftToRight: true,  operators: [ operators.stringIs,    operators.stringArrayIs ] },
            // { leftToRight: true,  operators: [ operators.containsStr, operators.contains      ] },
            { leftToRight: true,  operators: [ operators.booleanAnd ] },
            { leftToRight: true,  operators: [ operators.booleanOr  ] }
        ];

        //

        var accessors = [
            // Debug
            {
                type:      Type2.String,
                predicate: function(str) { return _.contains(['A', 'B', 'C', 'D'], str); },
                getValue1:  function(str, extra) { return 'hardcodedString.' + str; }
            },

            {
                type: Type2.ArrayString,
                predicate: function(str) { return str === 'empty'; },
                getValue1: function(str, extra) { return []; }
            },

            // Ending
            {
                type: Type2.String,
                predicate: function(str) {
                    return str === 'ending';
                },
                getValue1: function(str, extra) {
                    var nodeData = extra;
                    if (!NodeFactory.isMoveNode(nodeData)) return '';
                    return nodeData.endsWith || 'STD';
                }
            },

            // Context
            {
                type: Type2.ArrayString,
                predicate: function(str) {
                    return str === 'context';
                },
                getValue1: function(str, extra) {
                    var nodeData = extra;
                    if (!NodeFactory.isMoveNode(nodeData)) return '';
                    return nodeData.context || [];
                }
            },

            // Tags
            {
                type: Type2.ArrayString,
                predicate: function(str) {
                    return str === 'tags';
                },
                getValue1: function(str, extra) {
                    var nodeData = extra;
                    if (!NodeFactory.isMoveNode(nodeData)) return '';
                    return nodeData.actionSteps.filter(Boolean).reduce(
                        function(acc, actionStep) {
                            return acc.concat(actionStep.tags).concat(
                                actionStep.results.filter(Boolean).reduce(
                                    function(acc, actionStepResult) {
                                        return acc.concat(actionStepResult.tags);
                                    },
                                    []
                                )
                            );
                        },
                        []
                    );
                }
            }
        ].concat(
            // Advantage
            [
                {
                    names: ['advantageOnBlock'],
                    getDuration:            NodeFactory.getActionStepResultHitBlock,
                    actionStepResultFilter: NodeFactory.doesActionStepResultDescribeGuard
                }, {
                    names: ['advantageOnHit', 'advantageOnNeutralHit'],
                    getDuration:            NodeFactory.getActionStepResultHitBlock,
                    actionStepResultFilter: NodeFactory.doesActionStepResultDescribeNeutralHit
                }, {
                    names: ['advantageOnCounterHit'],
                    getDuration:            NodeFactory.getActionStepResultHitBlock,
                    actionStepResultFilter: NodeFactory.doesActionStepResultDescribeCounterHit
                }
            ].reduce(
                function(acc, info) {
                    acc.push({
                        type: Type2.Integer,
                        predicate: function(str) {
                            return info.names.some(function(name) {
                                return (
                                    str === name ||
                                    str === name + '.' + 'min'
                                );
                            });
                        },
                        getValue1: function(str, extra) {
                            var nodeData = extra;
                            if (!NodeFactory.isMoveNode(nodeData)) return NaN;
                            var range = NodeFactory.getAdvantageRange(
                                nodeData,
                                info.getDuration,
                                info.actionStepResultFilter
                            );
                            if (!range) return NaN;
                            return range.min;
                        }
                    });
                    acc.push({
                        type: Type2.Integer,
                        predicate: function(str) {
                            return info.names.some(function(name) {
                                return str === name + '.' + 'max';
                            });
                        },
                        getValue1: function(str, extra) {
                            var nodeData = extra;
                            if (!NodeFactory.isMoveNode(nodeData)) return NaN;
                            var range = NodeFactory.getAdvantageRange(
                                nodeData,
                                info.getDuration,
                                info.actionStepResultFilter
                            );
                            if (!range) return NaN;
                            return range.max;
                        }
                    });
                    return acc;
                },
                []
            )
        );

        return {
            Type1: Type1,
            Type2: Type2,
            Type3: Type3,
            operatorsPerPrio: operatorsPerPrio,
            accessors: accessors
        };

        //

        function createCastingManager() {
            var castMap = {};
            var existingCasters = [];

            return {
                addCaster: addCaster,
                canCast:   canCast,
                castValue: castValue
            }

            function addCaster(from, to, castFunc, optIndirect) {

                var direct = !optIndirect;

                if (canAdd(from, to, direct)) {

                    castMap[from] = castMap[from] || {};
                    castMap[from][to] = {
                        castFunc: castFunc,
                        direct: direct
                    };

                    existingCasters.push({ from: from, to: to });
                }

                connectCasters(from, to, castMap[from][to].castFunc);
            }

            function canAdd(from, to, direct) {
                if (castMap.hasOwnProperty(from) && castMap[from].hasOwnProperty(to)) {
                    if (direct) {
                        if (castMap[from][to].direct) {
                            console.error(
                                'Replacing already existing caster: ' + from + ' -> ' + to
                            );
                        } else {
                            console.warn(
                                'Refining already existing caster: ' + from + ' -> ' + to
                            );
                        }
                        return true;
                    }
                    return false;
                }
                return true;
            }

            function connectCasters(from, to, castFunc) {
                existingCasters
                    .filter(function(t) {
                        return t.to === from;
                    })
                    .forEach(function(t) {
                        addCaster(
                            t.from, to,
                            function(value) { return castFunc(castValue(value, t.from, t.to)); },
                            true
                        );
                    });

                existingCasters
                    .filter(function(t) { return to === t.from; })
                    .forEach(function(t) {
                        addCaster(
                            from, t.to,
                            function(value) { return castValue(castFunc(value), t.from, t.to); },
                            true
                        );
                    });
            }

            function canCast(typeFrom, typeTo) {
                if (typeFrom === typeTo) return true;
                return (
                    castMap.hasOwnProperty(typeFrom) &&
                    castMap[typeFrom].hasOwnProperty(typeTo)
                );
            }

            function castValue(value, typeFrom, typeTo) {
                if (typeFrom === typeTo) return value;
                return castMap[typeFrom][typeTo].castFunc(value);
            }
        }
    }

);
