define(

    'Analysis/Operators',

    [
        'Model/NodeFactoryMove',
        'Model/NodeFactoryActionStepResult',
        'Tools/ArraySet',
        'Tools/CastingManager',
        'Tools/Tools'
    ],

    function Operators(NodeFactoryMove, NodeFactoryActionStepResult, ArraySet, CastingManager, _) {

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

        var type3Casters = CastingManager.createCastingManager();
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
                return func(getLeft, getRight);
                function getLeft() {
                    return type3Casters.castValue(left.getValue(extra), left.type, typeLeft);
                }
                function getRight() {
                    return type3Casters.castValue(right.getValue(extra), right.type, typeRight);
                }
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
                return func(getRight);
                function getRight() {
                    return type3Casters.castValue(right.getValue(extra), right.type, typeRight);
                }
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
                act: createActOnRight(Type3.Integer, function(getRight) { return -getRight(); })
            },
            unaryPlus: {
                str: [ '+' ],
                type: Type3.Integer,
                check: createCheckRightFunction(Type3.Integer, Type3.Integer),
                act: createActOnRight(Type3.Integer, function(getRight) { return getRight(); })
            },
            absolute: {
                str: [ 'abs', 'absolute' ],
                type: Type3.Integer,
                check: createCheckRightFunction(Type3.Integer),
                act: createActOnRight(Type3.Integer, function(getRight) { return Math.abs(getRight()); })
            },
            isNaN: {
                str: [ 'isNaN', 'notNumber', 'not_a_number' ],
                type: Type3.Boolean,
                check: createCheckRightFunction(Type3.Integer),
                act: createActOnRight(Type3.Integer, function(getRight) { return isNaN(getRight()); })
            },
            isFinite: {
                str: [ 'finite', 'isFinite', 'is_finite' ],
                type: Type3.Boolean,
                check: createCheckRightFunction(Type3.Integer),
                act: createActOnRight(Type3.Integer, function(getRight) { return isFinite(getRight()); })
            },
            multiply: {
                str: [ '*', 'mul', 'multiply', 'times' ],
                type: Type3.Integer,
                check: createCheckBothFunction(Type3.Integer, Type3.Integer),
                act: createActOnBoth(
                    Type3.Integer, Type3.Integer,
                    function(getLeft, getRight) { return getLeft() * getRight(); }
                )
            },
            divide: {
                str: [ '/', 'div', 'divide' ],
                type: Type3.Integer,
                check: createCheckBothFunction(Type3.Integer, Type3.Integer),
                act: createActOnBoth(
                    Type3.Integer, Type3.Integer,
                    function(getLeft, getRight) { return getLeft() / getRight(); }
                )
            },
            modulo: {
                str: [ '%', 'mod', 'modulo' ],
                type: Type3.Integer,
                check: createCheckBothFunction(Type3.Integer, Type3.Integer),
                act: createActOnBoth(
                    Type3.Integer, Type3.Integer,
                    function(getLeft, getRight) { return getLeft() % getRight(); }
                )
            },
            add: {
                str: [ '+', 'plus' ],
                type: Type3.Integer,
                check: createCheckBothFunction(Type3.Integer, Type3.Integer),
                act: createActOnBoth(
                    Type3.Integer, Type3.Integer,
                    function(getLeft, getRight) { return getLeft() + getRight(); }
                )
            },
            subtract: {
                str: [ '-', 'minus', 'sub', 'subtract' ],
                type: Type3.Integer,
                check: createCheckBothFunction(Type3.Integer, Type3.Integer),
                act: createActOnBoth(
                    Type3.Integer, Type3.Integer,
                    function(getLeft, getRight) { return getLeft() - getRight(); }
                )
            },
            lessThan: {
                str: [ '<' ],
                type: Type3.Boolean,
                check: createCheckBothFunction(Type3.Integer, Type3.Integer),
                act: createActOnBoth(
                    Type3.Integer, Type3.Integer,
                    function(getLeft, getRight) { return getLeft() < getRight(); }
                )
            },
            lessThanOrEqualTo: {
                str: [ '<=' ],
                type: Type3.Boolean,
                check: createCheckBothFunction(Type3.Integer, Type3.Integer),
                act: createActOnBoth(
                    Type3.Integer, Type3.Integer,
                    function(getLeft, getRight) { return getLeft() <= getRight(); }
                )
            },
            greaterThan: {
                str: [ '>' ],
                type: Type3.Boolean,
                check: createCheckBothFunction(Type3.Integer, Type3.Integer),
                act: createActOnBoth(
                    Type3.Integer, Type3.Integer,
                    function(getLeft, getRight) { return getLeft() > getRight(); }
                )
            },
            greaterThanOrEqualTo: {
                str: [ '>=' ],
                type: Type3.Boolean,
                check: createCheckBothFunction(Type3.Integer, Type3.Integer),
                act: createActOnBoth(
                    Type3.Integer, Type3.Integer,
                    function(getLeft, getRight) { return getLeft() >= getRight(); }
                )
            },
            equalTo: {
                str: [ 'is', 'are', 'eq', '=', '==', '===' ],
                type: Type3.Boolean,
                check: createCheckBothFunction(Type3.Integer, Type3.Integer),
                act: createActOnBoth(
                    Type3.Integer, Type3.Integer,
                    function(getLeft, getRight) { return getLeft() === getRight(); }
                )
            },
            notEqualTo: {
                str: [ 'notEq', '!=', '!==', '/=', '=/=', '<>' ],
                type: Type3.Boolean,
                check: createCheckBothFunction(Type3.Integer, Type3.Integer),
                act: createActOnBoth(
                    Type3.Integer, Type3.Integer,
                    function(getLeft, getRight) { return getLeft() !== getRight(); }
                )
            },
            // setNot: {
            //     str: [ '!', 'not' ],
            //     type: Type3.ArraySet,
            //     check: createCheckRightFunction(Type3.ArraySet),
            //     act: createActOnRight(
            //         Type3.ArraySet,
            //         function(getRight) { return ArraySet.createNot(getRight()); }
            //     )
            // },
            setAnd: {
                str: [ 'and', '&', '&&' ],
                type: Type3.ArraySet,
                check: createCheckBothFunction(Type3.ArraySet, Type3.ArraySet),
                act: createActOnBoth(
                    Type3.ArraySet, Type3.ArraySet,
                    function(getLeft, getRight) { return ArraySet.createAnd(getLeft(), getRight()); }
                )
            },
            setOr: {
                str: [ 'or', '|', '||' ],
                type: Type3.ArraySet,
                check: createCheckBothFunction(Type3.ArraySet, Type3.ArraySet),
                act: createActOnBoth(
                    Type3.ArraySet, Type3.ArraySet,
                    function(getLeft, getRight) { return ArraySet.createOr(getLeft(), getRight()); }
                )
            },
            containsSet: {
                str: [ 'contains', 'contain', 'includes', 'include', 'has', 'have' ],
                type: Type3.Boolean,
                check: createCheckBothFunction(Type3.ArraySet, Type3.ArraySet),
                act: createActOnBoth(
                    Type3.ArraySet, Type3.ArraySet,
                    function(getLeft, getRight) { return getRight().satisfiesContains(getLeft()); }
                )
            },
            booleanNot: {
                str: [ '!', 'not' ],
                type: Type3.Boolean,
                check: createCheckRightFunction(Type3.Boolean),
                act: createActOnRight(Type3.Boolean, function(getRight) { return !getRight(); })
            },
            stringIs: {
                str: [ 'is', 'are', 'eq', '=', '==', '===' ],
                type: Type3.Boolean,
                check: createCheckBothFunction(Type3.String, Type3.String),
                act: createActOnBoth(
                    Type3.String, Type3.String,
                    function(getLeft, getRight) { return getLeft() === getRight(); }
                )
            },
            stringArrayIs: {
                str: [ 'is', 'are', 'eq', '=', '==', '===' ],
                type: Type3.Boolean,
                check: createCheckBothFunction(Type3.ArraySet, Type3.ArraySet),
                act: createActOnBoth(
                    Type3.ArraySet, Type3.ArraySet,
                    function(getLeft, getRight) { return getRight().satisfiesIs(getLeft()); }
                )
            },
            // containsStr: {
            //     str: [ 'contains', 'contain', 'includes', 'include', 'has', 'have' ],
            //     type: Type3.Boolean,
            //     check: createCheckBothFunction(Type3.String, Type3.String),
            //     act: createActOnBoth(
            //         Type3.String, Type3.String,
            //         function(getLeft, getRight) {
            //             return getLeft().toLowerCase().indexOf(getRight().toLowerCase()) >= 0;
            //         }
            //     )
            // },
            // contains: {
            //     str: [ 'contains', 'contain', 'includes', 'include', 'has', 'have' ],
            //     type: Type3.Boolean,
            //     check: createCheckBothFunction(Type3.ArrayString, Type3.String),
            //     act: createActOnBoth(
            //         Type3.ArrayString, Type3.String,
            //         function(getLeft, getRight) { return _.contains(getLeft(), getRight()); }
            //     )
            // },
            booleanAnd: {
                str: [ 'and', '&', '&&' ],
                type: Type3.Boolean,
                check: createCheckBothFunction(Type3.Boolean, Type3.Boolean),
                act: createActOnBoth(
                    Type3.Boolean, Type3.Boolean,
                    function(getLeft, getRight) { return Boolean(getLeft() && getRight()); }
                )
            },
            booleanOr: {
                str: [ 'or', '|', '||' ],
                type: Type3.Boolean,
                check: createCheckBothFunction(Type3.Boolean, Type3.Boolean),
                act: createActOnBoth(
                    Type3.Boolean, Type3.Boolean,
                    function(getLeft, getRight) { return Boolean(getLeft() || getRight()); }
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
            // {
            //     type:      Type2.String,
            //     predicate: function(str) { return _.contains(['A', 'B', 'C', 'D'], str); },
            //     getValue1:  function(str, extra) { return 'hardcodedString.' + str; }
            // },

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
                    var nodeData = extra.nodeData;
                    if (!NodeFactoryMove.isMoveNode(nodeData)) return '';
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
                    var nodeData = extra.nodeData;
                    if (!NodeFactoryMove.isMoveNode(nodeData)) return '';
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
                    var nodeData = extra.nodeData;
                    if (!NodeFactoryMove.isMoveNode(nodeData)) return '';
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
                    getDuration:            NodeFactoryActionStepResult.getHitBlockOrStun,
                    actionStepResultFilter: NodeFactoryActionStepResult.doesDescribeGuard
                }, {
                    names: ['advantageOnHit', 'advantageOnNeutralHit'],
                    getDuration:            NodeFactoryActionStepResult.getHitBlockOrStun,
                    actionStepResultFilter: NodeFactoryActionStepResult.doesDescribeNeutralHit
                }, {
                    names: ['advantageOnCounterHit'],
                    getDuration:            NodeFactoryActionStepResult.getHitBlockOrStun,
                    actionStepResultFilter: NodeFactoryActionStepResult.doesDescribeCounterHit
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
                            var nodeData = extra.nodeData;
                            if (!NodeFactoryMove.isMoveNode(nodeData)) return NaN;
                            var range = NodeFactoryMove.getAdvantageRange(
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
                            var nodeData = extra.nodeData;
                            if (!NodeFactoryMove.isMoveNode(nodeData)) return NaN;
                            var range = NodeFactoryMove.getAdvantageRange(
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
    }

);
