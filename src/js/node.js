define('node', ['tools'], function(_) {

    return {

        createRootNode:   createRootNode,
        createStanceNode: createStanceNode,
        createMoveNode:   createMoveNode,

        getChildren: getChildren,

        isRootNode:   isRootNode,
        isStanceNode: isStanceNode,
        isMoveNode:   isMoveNode

    };


    function createRootNode(optSource, optValidateChildren) {

        var result = _.defaults(optSource, {
            character: undefined,
            version:   undefined,
            abbreviations: {},
            stances: []
        });

        if (optValidateChildren) {
            for (var i = 0; i < result.stances.length; ++i) {
                result.stances[i] = createStanceNode(result.stances[i], true);
            }
        }

        return result;
        
    }


    function createStanceNode(optSource, optValidateChildren) {

        var result = _.defaults(optSource, {
            abbreviation: undefined,
            description: undefined,
            endsWith: undefined,
            moves: []
        });

        if (optValidateChildren) {
            for (var i = 0; i < result.moves.length; ++i) {
                result.moves[i] = createMoveNode(result.moves[i], true);
            }
        }

        return result;

    }


    function createMoveNode(optSource, optValidateChildren) {

        var result = _.defaults(optSource, {

            input: undefined,

            /** gen fu - having hat; zack - having teletubie outfit; etc */
            context: [],

            frameData: [], // Array<Int>

            actionSteps: [ createMoveActionStep() ],

            /** stance / context - like crounching after move or lying after taunt */
            endsWith: undefined,

            // turnsOpponentAround: undefined, // bool
            // turnsAround:         undefined, // bool
            // swapsPositions:      undefined  // bool

            followUps: []

        });

        for (var i = 0; i < result.actionSteps.length; ++i) {
            result.actionSteps[i] = createMoveActionStep(result.actionSteps[i]);
        }

        if (optValidateChildren) {
            for (var i = 0; i < result.followUps.length; ++i) {
                result.followUps[i] = createMoveNode(result.followUps[i], true);
            }
        }

        return result;
        
    }


    function createMoveActionStep(optSource) {

        return _.defaults(optSource, {

            /**
                Examples: 
                    for attack:
                        mid P
                        mid P mid K
                        mid k high p
                    for hold:
                        high
                        mid
                        high k
                        mid P high P
             */
            actionMask: undefined,

            /**
                strike
                jump attack
                grab for throw
                OH grab
                grab for hold
                ground attack
                other
             */
            actionType: undefined,

            isTracking: undefined // bool

        });

    }


    function getChildren(node) {
        if (isRootNode(node))   return node.stances;
        if (isStanceNode(node)) return node.moves;
        if (isMoveNode(node))   return node.followUps;
        return null;
    }


    function isRootNode(node) {
        return node.hasOwnProperty('character');
    }

    function isStanceNode(node) {
        return node.hasOwnProperty('description');
    }

    function isMoveNode(node) {
        return node.hasOwnProperty('input');
    }

});