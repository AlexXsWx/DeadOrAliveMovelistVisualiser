define('NodeFactory', ['Tools'], function Node(_) {

    return {

        createRootNode:   createRootNode,
        createStanceNode: createStanceNode,
        createMoveNode:   createMoveNode,

        createMoveActionStep: createMoveActionStep,
        getActionStepsAmount: getActionStepsAmount,

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

            followUps: []

        });

        var actionStepsAmount = Math.max(
            result.actionSteps.length,
            getActionStepsAmount(result.frameData)
        );
        for (var i = 0; i < actionStepsAmount; ++i) {
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

        var actionStep = _.defaults(optSource, {

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
                        high low p (akira 9h)
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

            isTracking: undefined, // bool

            damage: undefined, // int

            // condition-specific results
            result: []

        });

        for (var i = 0; i < actionStep.result.length; ++i) {
            actionStep.result[i] = createMoveActionStepResult(actionStep.result[i]);
        }

        return actionStep;

    }


    function createMoveActionStepResult(optSource) {
        return _.defaults(optSource, {
            // neutral, neutral/open, neutral/closed, stun, crouching, bt, etc
            condition: [],

            // rig's 9p
            // same on double use
            // use on CBed opponent
            // use on exceeding crirical damage
            // same launch height for critical, counter and hi counter

            // tags
            // turnsOpponentAround: undefined, // bool
            // turnsAround:         undefined, // bool
            // swapsPositions:      undefined  // bool

            // launcher, sit-down stun, etc
            tags: []
        });
    }


    function getActionStepsAmount(frameData) {
        return Math.max(0, Math.ceil((frameData.length - 1) / 2));
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