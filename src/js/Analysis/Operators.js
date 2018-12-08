define(

    'Analysis/Operators',

    [],

    function Operators() {

        var Type1 = {
            Raw:     't1_raw',
            Group:   't1_group',
            String:  't1_string'
        };

        var Type2 = {
            Operator: 't2_operator',
            // Other:   't2_other',
            Group:   't2_group',
            Boolean: 't2_boolean',
            Integer: 't2_integer',
            String:  't2_string'
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
            }
            // 'is',
            // 'not',
            // 'contains'
        ];

        return {
            Type1: Type1,
            Type2: Type2,
            Type3: Type3,
            operatorsPerPrio: operatorsPerPrio
        };
    }

);
