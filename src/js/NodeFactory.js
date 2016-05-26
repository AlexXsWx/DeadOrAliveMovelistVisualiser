define('NodeFactory', ['Tools'], function Node(_) {

    return {

        createRootNode:   createRootNode,
        createStanceNode: createStanceNode,
        createMoveNode:   createMoveNode,

        createMoveActionStep: createMoveActionStep,
        createMoveActionStepResult: createMoveActionStepResult,
        getActionStepsAmount: getActionStepsAmount,

        getChildren: getChildren,

        isRootNode:   isRootNode,
        isStanceNode: isStanceNode,
        isMoveNode:   isMoveNode

        // guessMoveTypeByInput: guessMoveTypeByInput

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

            // condition: undefined,
            // tags: undefined,

            // condition-specific results
            results: []

        });

        for (var i = 0; i < actionStep.results.length; ++i) {
            actionStep.results[i] = createMoveActionStepResult(actionStep.results[i]);
        }

        return actionStep;

    }


    // function guessMoveTypeByInput(node) {
    //     var input = node.input;
    //     var actionStep = node.actionSteps[0];
    //     if (RGX.PUNCH.test(input)) {
    //         actionStep.actionType = 'strike';
    //         actionStep.actionMask = 'P';
    //     } else
    //     if (RGX.KICK.test(input))  {
    //         actionStep.actionType = 'strike';
    //         actionStep.actionMask = 'K';
    //     } else
    //     if (RGX.HOLD.test(input))  {
    //         actionStep.actionType = 'hold';
    //         actionStep.actionMask = undefined;
    //      } else
    //     if (RGX.THROW.test(input)) {
    //         actionStep.actionType = 'throw';
    //         actionStep.actionMask = undefined;
    //     } else {
    //         actionStep.actionType = 'other';
    //         actionStep.actionMask = undefined;
    //     }
    // }


    function createMoveActionStepResult(optSource) {
        return _.defaults(optSource, {
            // neutral, neutral/open, neutral/closed, stun, crouching, bt, etc
            condition: [],

            // make sure it hit on first active frame..
            hitBlock: undefined, // = cooldown + advantage + active frames after the one that hit
            // rig 6kk only connects on fastest execution where followup frame = 15 (min)
            // frame data is 13 (2) 22, 13 (2) 22
            // first kick is -8 on neutral hit
            // when followup frame is 16 it still connects but cannot be held - can be blocked
            // on 17th frame it is holdable

            // it means on fastest execution first hit lands on frame 1 + 13 + 1 = 15
            // and is active for frames 15 and 16
            // following frame is the extra one
            // and then again 13 + 1
            // so 16 + 1 + 13 + 1 = 31
            // so active frames for the second kick are 31 and 32
            // it means when enemy gets hit on 15th frame and he's missing hit on frame 31
            // he is completely helpless for 15 frames after active frame that hit him
            // when doing attack alone it takes 13 + 1 (active frame that hits) + 1 + 22
            // and that is -8
            // so cooldown + active frames after hit + advantage = block stun

            // now let's compare to a stun
            // 6k on counter gives +13
            // and crit hold interval says 14-36
            // 1 + 22 = 23 + 13 = 36
            // 
 
            // first number in critical hold interval
            criticalHoldDelay: undefined,
            // second number in critical hold interval with stagger escape off
            stunDurationMin: undefined,
            // second number in critical hold interval with stagger escape on
            stunDurationMax: undefined,

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