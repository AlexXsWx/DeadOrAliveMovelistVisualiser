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
            ArrayString: 't2_arrayString'
        };

        var Type3 = {
            Boolean:     't3_boolean',
            Integer:     't3_integer',
            String:      't3_string',
            ArrayString: 't3_arrayString'
        };

        var castType3Map = {};
        // castType3Map[Type3.String] = {};
        // castType3Map[Type3.String][Type3.ArrayString] = function(value) {
        //     return [value];
        // };

        function canCastType3FromTo(type3A, type3B) {
            if (type3A === type3B) return true;
            return (
                castType3Map.hasOwnProperty(type3A) &&
                castType3Map[type3A].hasOwnProperty(type3B)
            );
        }

        function castType3ValueFromTo(value, type3A, type3B) {
            if (type3A === type3B) return value;
            return castType3Map[type3A][type3B](value);
        }

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
         */

        //

        function createCheckBothFunction(typeLeft, typeRight) {
            return function(array, index) {
                var left  = _.getOrThrow(array, index - 1);
                var right = _.getOrThrow(array, index + 1);
                return {
                    valid: (
                        left  && canCastType3FromTo(left.type,  typeLeft) &&
                        right && canCastType3FromTo(right.type, typeRight)
                    ),
                    takeLeft:  true,
                    takeRight: true
                };
            };
        }

        function createActOnBoth(typeLeft, typeRight, func) {
            return function(left, right, extra) {
                var lv = castType3ValueFromTo(left.getValue(extra),  left.type,  typeLeft);
                var rv = castType3ValueFromTo(right.getValue(extra), right.type, typeRight);
                return func(lv, rv);
            }
        }

        //

        function createCheckRightFunction(typeRight, optExcludeTypeLeft) {
            return function(array, index) {
                var right = _.getOrThrow(array, index + 1);
                var valid = right && canCastType3FromTo(right.type, typeRight);
                if (optExcludeTypeLeft && index - 1 >= 0) {
                    var left = _.getOrThrow(array, index - 1);
                    if (left && canCastType3FromTo(left.type, optExcludeTypeLeft)) {
                        valid = false;
                    }
                }
                return {
                    valid: valid,
                    takeLeft:  false,
                    takeRight: true
                };
            };
        }

        function createActOnRight(typeRight, func) {
            return function(left, right, extra) {
                var rv = castType3ValueFromTo(right.getValue(extra), right.type, typeRight);
                return func(rv);
            }
        }

        //

        var operators = {
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
                str: [ 'eq', 'is', '=', '==', '===' ],
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
            booleanNot: {
                str: [ '!', 'not' ],
                type: Type3.Boolean,
                check: createCheckRightFunction(Type3.Boolean),
                act: createActOnRight(Type3.Boolean, function(right) { return !right; })
            },
            stringIs: {
                str: [ 'eq', 'is', '=', '==', '===' ],
                type: Type3.Boolean,
                check: createCheckBothFunction(Type3.String, Type3.String),
                act: createActOnBoth(
                    Type3.String, Type3.String,
                    function(left, right) { return left === right; }
                )
            },
            contains: {
                str: [ 'contains', 'includes', 'has' ],
                type: Type3.Boolean,
                check: createCheckBothFunction(Type3.ArrayString, Type3.String),
                act: createActOnBoth(
                    Type3.ArrayString, Type3.String,
                    function(left, right) { return _.contains(left, right); }
                )
            },
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
            },
            // stringOr: {
            //     str: [ 'or', '|', '||' ],
            //     type: Type3.ArrayString,
            //     check: createCheckBothFunction(Type3.String, Type3.String),
            //     act: function(left, right, extra) {
            //         var lv = castType3ValueFromTo(left.getValue(extra),  left.type,  Type3.String);
            //         var rv = castType3ValueFromTo(right.getValue(extra), right.type, Type3.String);
            //         return new Union(lv, rv);
            //     }
            // }
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
                    operators.divide
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
            { leftToRight: false, operators: [ operators.booleanNot ] },
            { leftToRight: true,  operators: [ operators.stringIs   ] },
            { leftToRight: true,  operators: [ operators.contains   ] },
            { leftToRight: true,  operators: [ operators.booleanAnd ] },
            {
                leftToRight: true,
                operators: [
                    operators.booleanOr,
                    // operators.stringOr
                ]
            }
        ];

        //

        var accessors = [
            // Debug
            /*{
                type:      Type3.Boolean,
                predicate: function(str) { return _.contains(['A', 'B', 'C', 'D'], str); },
                getValue1:  function(str, extra) { return str === 'A' || str === 'C'; }
            }*/

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

            // Advantage on block
            {
                type: Type2.Integer,
                predicate: function(str) {
                    return (
                        str === 'advantageOnBlock' ||
                        str === 'advantageOnBlock.min'
                    );
                },
                getValue1: function(str, extra) {
                    var nodeData = extra;
                    if (!NodeFactory.isMoveNode(nodeData)) return NaN;
                    var range = NodeFactory.getAdvantageRange(
                        nodeData,
                        NodeFactory.getActionStepResultHitBlock,
                        NodeFactory.doesActionStepResultDescribeGuard
                    );
                    if (!range) return NaN;
                    return range.min;
                }
            }, {
                type: Type2.Integer,
                predicate: function(str) { return str === 'advantageOnBlock.max'; },
                getValue1: function(str, extra) {
                    var nodeData = extra;
                    if (!NodeFactory.isMoveNode(nodeData)) return NaN;
                    var range = NodeFactory.getAdvantageRange(
                        nodeData,
                        NodeFactory.getActionStepResultHitBlock,
                        NodeFactory.doesActionStepResultDescribeGuard
                    );
                    if (!range) return NaN;
                    return range.max;
                }
            }
        ];

        return {
            Type1: Type1,
            Type2: Type2,

            Type3:                Type3,
            canCastType3FromTo:   canCastType3FromTo,
            castType3ValueFromTo: castType3ValueFromTo,

            operatorsPerPrio: operatorsPerPrio,
            accessors: accessors
        };
    }

);
