define('NodeFactory', ['Tools'], function NodeFactory(_) {

    // var RGX = {
    //     PUNCH: /^\d*p(?:\+k)?$/i,
    //     KICK:  /(?:h\+)?k$/i,
    //     HOLD:  /^\d+h$/i,
    //     THROW: /^\d*t$/i
    // };

    return {

        createRootNode:   createRootNode,
        createStanceNode: createStanceNode,
        createMoveNode:   createMoveNode,

        createMoveActionStep: createMoveActionStep,
        createMoveActionStepResult: createMoveActionStepResult,

        getChildren: getChildren,

        isRootNode:   isRootNode,
        isStanceNode: isStanceNode,
        isMoveNode:   isMoveNode,

        toString: toString,

        isMovePunch: isMovePunch,
        isMoveKick:  isMoveKick,
        isMoveThrow: isMoveThrow,
        isMoveHold:  isMoveHold,

        isActionStepPunch:        isActionStepPunch,
        isActionStepKick:         isActionStepKick,
        isActionStepThrow:        isActionStepThrow,
        isActionStepHold:         isActionStepHold,
        isActionStepJumpAttack:   isActionStepJumpAttack,
        isActionStepGroundAttack: isActionStepGroundAttack,
        isActionStepOther:        isActionStepOther,
        isActionStepHigh:         isActionStepHigh,
        isActionStepMid:          isActionStepMid,
        isActionStepLow:          isActionStepLow,

        canActionStepHitGround: canActionStepHitGround,

        getMoveSummary:       getMoveSummary,
        getActionStepSummary: getActionStepSummary

        // guessMoveTypeByInput: guessMoveTypeByInput

    };


    function createRootNode(optSource, optValidateChildren) {

        var result = _.defaults(optSource, {
            character: undefined,
            version:   undefined,
            abbreviations: {},
            stances: []
            // TODO: comment
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

            // TODO: make first element to be Array<Int> for charge attacks
            frameData: [], // Array<Int>

            actionSteps: [ undefined ],

            /** stance / context - like crounching after move or lying after taunt */
            endsWith: undefined,

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

        var actionStep = _.defaults(optSource, {

            // Brad's 66k, Alpha-152's 66p
            // condition: [],

            /**
                Examples:
                    for attack:
                        mid P
                        mid P mid K
                        mid k high p
                        ground mid K
                    for hold:
                        high
                        mid
                        high k
                        mid P high P
                        high low p (akira 9h)
                TODO: if parsed, store as Int
             */
            actionMask: undefined,

            // FIXME: jump attack as the one that got different hold vs the one that can't be OH'ed
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

            reach: undefined, // float

            // condition: undefined,
            tags: [],

            // condition-specific results
            results: [ undefined ]

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

            // stance: any / open / closed
            // facing: forward / back turned
            // status:
            //    standing
            //    crouching (Rig's [BND] 6K)
            //    squatting? (crouching + vulnerability to high throws)
            //    "jumping" / "jump" / "jump (evade lows)" aka airborne (Rig's [BND] 6H+K K)
            //    down (grounded) (has anyone got move that would be different on landing to this status?)
            // surface: normal / slippery
            // hit distance: normal / close hit (Lisa's 2H+K GB on close hit)
            // other: neutral / counter / hi-counter / stun / critical hold / double use / use on CB / over combo limit
            //     2p seems to be an exception from double use
            // environment: default / wall behind (Alpha-152 66P)
            condition: [],

            // Is calculated as amount of active frames after the one that landed + cooldown + (dis-)advantage
            hitBlock: undefined,

            // first number in critical hold interval
            criticalHoldDelay: undefined,
            // second number in critical hold interval with stagger escape off
            stunDurationMin: undefined,
            // second number in critical hold interval with stagger escape on
            stunDurationMax: undefined,

            // tags
            // turnsOpponentAround: undefined, // bool
            // turnsAround:         undefined, // bool
            // swapsPositions:      undefined  // bool

            // launcher, sit-down stun, etc
            tags: []
        });
    }


    function getChildren(node) {
        if (isRootNode(node))   return node.stances;
        if (isStanceNode(node)) return node.moves;
        if (isMoveNode(node))   return node.followUps;
        return null;
    }


    function toString(node) {
        if (isRootNode(node)) {
            return node.character || 'character';
        } else
        if (isStanceNode(node)) {
            return node.abbreviation || 'stance';
        } else
        if (isMoveNode(node)) {
            var input = node.input;
            if (!input) return 'move';
            var context = node.context.join(',');
            if (context) return context + ':' + input;
            return input;
        }
        console.error('Can\'t represent node %O with a string', node);
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

    function getMoveSummary(node) {

        var result = [];

        if (node.context && node.context.length > 0) {
            var context = node.context.join(',').trim();
            if (context) result.push(context + ':');
        };

        result.push(node.input);

        if (node.actionSteps && node.actionSteps.length > 0) {
            result.push(getActionStepSummary(node.actionSteps[0]));
        }

        return result.join(' ').trim();

    }

    function isMovePunch(node) { return node.actionSteps.some(isActionStepPunch); }
    function isMoveKick(node)  { return node.actionSteps.some(isActionStepKick);  }
    function isMoveThrow(node) { return node.actionSteps.some(isActionStepThrow); }
    function isMoveHold(node)  { return node.actionSteps.some(isActionStepHold);  }

    function isActionStepPunch(actionStep) {
        if (!actionStep.actionMask || !actionStep.actionType) return false;
        var actionType = actionStep.actionType.toLowerCase();
        return (actionStep.actionMask.toLowerCase().search('p') >= 0 && (
            actionType.search('strike') >= 0 ||
            actionType.search('attack') >= 0
        ));
    }

    function isActionStepKick(actionStep) {
        if (!actionStep.actionMask || !actionStep.actionType) return false;
        var actionType = actionStep.actionType.toLowerCase();
        return (actionStep.actionMask.toLowerCase().search('k') >= 0 && (
            actionType.search('strike') >= 0 ||
            actionType.search('attack') >= 0
        ));
    }

    function isActionStepThrow(actionStep) {
        if (!actionStep.actionType) return false;
        var actionType = actionStep.actionType.toLowerCase();
        return (
            actionType.search('grab') >= 0 ||
            actionType.search('throw') >= 0 ||
            actionType.search('offensive') >= 0
        );
    }

    function isActionStepHold(actionStep)         { return checkActionStepTypeForWord(actionStep, 'hold');   }
    function isActionStepJumpAttack(actionStep)   { return checkActionStepTypeForWord(actionStep, 'jump');   }
    function isActionStepGroundAttack(actionStep) { return checkActionStepTypeForWord(actionStep, 'ground'); }
    function isActionStepOther(actionStep)        { return checkActionStepTypeForWord(actionStep, 'other');  }

    function isActionStepHigh(actionStep) { return /\bhigh\b/i.test(actionStep.actionMask); }
    function isActionStepMid(actionStep)  { return /\bmid\b/i.test(actionStep.actionMask);  }
    function isActionStepLow(actionStep)  { return /\blow\b/i.test(actionStep.actionMask);  }

    function checkActionStepTypeForWord(actionStep, word) {
        return actionStep.actionType && actionStep.actionType.toLowerCase().search(word) >= 0;
    }

    function canActionStepHitGround(actionStep) {
        return actionStep.tags.join(' ').toLowerCase().search('ground') >= 0;
    }

    function getActionStepSummary(actionStep) {

        var result = '';

        if (actionStep.isTracking !== undefined) result += actionStep.isTracking ? 't' : 'd';
        if (isActionStepJumpAttack(actionStep)) result += 'j';
        if (actionStep.actionMask !== undefined) {
            result += summarizeActionStepMask(actionStep.actionMask)
        }
        if (isActionStepThrow(actionStep)) result += 'g'; // for Grab
        if (isActionStepHold(actionStep))  result += 'c'; // for Counter-hold

        return result;

    }

    function summarizeActionStepMask(actionStepMask) {
        var result = '';
        var lowCased = actionStepMask.toLowerCase();
        // FIXME: order is important!
        if (lowCased.search('high')         >= 0) result += 'h';
        if (lowCased.search('mid')          >= 0) result += 'm';
        if (lowCased.search('low')          >= 0) result += 'l';
        if (lowCased.search('ground')       >= 0) result += 'f'; // for Floor
        if (lowCased.search(/\bp(?:unch)?/) >= 0) result += 'p';
        if (lowCased.search(/\bk(?:ick)?/)  >= 0) result += 'k';
        return result;
    }

});