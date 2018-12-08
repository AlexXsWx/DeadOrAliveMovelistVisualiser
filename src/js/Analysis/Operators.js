define(

    'Analysis/Operators',

    [ 'Model/NodeFactory' ],

    function Operators(NodeFactory) {

        var Type1 = {
            Raw:     't1_raw',
            Group:   't1_group',
            String:  't1_string'
        };

        var Type2 = {
            Operator: 't2_operator',
            Group:    't2_group',
            Boolean:  't2_boolean',
            Integer:  't2_integer',
            String:   't2_string'
        };

        var Type3 = {
            Boolean: 't3_boolean',
            Integer: 't3_integer',
            String:  't3_string'
        };

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

        var operatorsPerPrio = [
            /*{
                leftToRight: false,
                operators: [
                    {
                        str: '-',
                        left:  [],
                        right: [Type3.Integer],
                        type: Type3.Integer,
                        act: function(left, right) {
                            return -right;
                        }
                    }
                ]
            },*/ {
                leftToRight: true,
                operators: [
                    {
                        str: '*',
                        left:  [Type3.Integer],
                        right: [Type3.Integer],
                        type: Type3.Integer,
                        act: function(left, right) {
                            return left * right;
                        }
                    }, {
                        str: '/',
                        left:  [Type3.Integer],
                        right: [Type3.Integer],
                        type: Type3.Integer,
                        act: function(left, right) {
                            return Math.floor(left / right);
                        }
                    }
                ]
            }, {
                leftToRight: true,
                operators: [
                    {
                        str: '+',
                        left:  [Type3.Integer],
                        right: [Type3.Integer],
                        type: Type3.Integer,
                        act: function(left, right) {
                            return left + right;
                        }
                    }, {
                        str: '-',
                        left:  [Type3.Integer],
                        right: [Type3.Integer],
                        type: Type3.Integer,
                        act: function(left, right) {
                            return left - right;
                        }
                    }
                ]
            }, {
                leftToRight: true,
                operators: [
                    {
                        str: '<',
                        left:  [Type3.Integer],
                        right: [Type3.Integer],
                        type: Type3.Boolean,
                        act: function(left, right) {
                            return left < right;
                        }
                    }, {
                        str: '<=',
                        left:  [Type3.Integer],
                        right: [Type3.Integer],
                        type: Type3.Boolean,
                        act: function(left, right) {
                            return left <= right;
                        }
                    }, {
                        str: '>',
                        left:  [Type3.Integer],
                        right: [Type3.Integer],
                        type: Type3.Boolean,
                        act: function(left, right) {
                            return left > right;
                        }
                    }, {
                        str: '>=',
                        left:  [Type3.Integer],
                        right: [Type3.Integer],
                        type: Type3.Boolean,
                        act: function(left, right) {
                            return left >= right;
                        }
                    }, {
                        str: '=',
                        left:  [Type3.Integer],
                        right: [Type3.Integer],
                        type: Type3.Boolean,
                        act: function(left, right) {
                            return left === right;
                        }
                    }
                ]
            }, {
                leftToRight: false,
                operators: [
                    {
                        str: 'not',
                        left:  [],
                        right: [Type3.Boolean],
                        type: Type3.Boolean,
                        act: function(left, right) {
                            return !right;
                        }
                    }
                ]
            }, {
                leftToRight: true,
                operators: [
                    {
                        str: 'and',
                        left:  [Type3.Boolean],
                        right: [Type3.Boolean],
                        type: Type3.Boolean,
                        act: function(left, right) {
                            return Boolean(left && right);
                        }
                    }
                ]
            }, {
                leftToRight: true,
                operators: [
                    {
                        str: 'or',
                        left:  [Type3.Boolean],
                        right: [Type3.Boolean],
                        type: Type3.Boolean,
                        act: function(left, right) {
                            return Boolean(left || right);
                        }
                    }
                ]
            }, {
                leftToRight: true,
                operators: [
                    {
                        str: 'is',
                        left:  [Type3.String],
                        right: [Type3.String],
                        type: Type3.Boolean,
                        act: function(left, right) {
                            return left === right;
                        }
                    }
                ]
            }
            // 'contains'
        ];

        var accessors = [
            /*, {
                type:      Type2.Boolean,
                predicate: function(str) { return _.contains(['A', 'B', 'C', 'D'], str); },
                getValue:  function(str, extra) { return str === 'A' || str === 'C'; }
            }*/
            {
                type: Type2.String,
                predicate: function(str) {
                    return str === 'ending';
                },
                getValue: function(str, extra) {
                    var nodeData = extra;
                    if (!NodeFactory.isMoveNode(nodeData)) return '';
                    return nodeData.endsWith || 'STD';
                }
            }, {
                type: Type2.String,
                predicate: function(str) {
                    return str === 'context';
                },
                getValue: function(str, extra) {
                    var nodeData = extra;
                    if (!NodeFactory.isMoveNode(nodeData)) return '';
                    return nodeData.context.join(',') || '';
                }
            }, {
                type: Type2.Integer,
                predicate: function(str) {
                    return (
                        str === 'advantageOnBlock' ||
                        str === 'advantageOnBlock.min'
                    );
                },
                getValue: function(str, extra) {
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
            }
        ];

        return {
            Type1: Type1,
            Type2: Type2,
            Type3: Type3,
            operatorsPerPrio: operatorsPerPrio,
            accessors: accessors
        };
    }

);
