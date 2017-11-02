define('NodeFactory', ['Tools'], function NodeFactory(_) {

    var guardRegex = /block|guard/i;

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

        isMovePunch:         isMovePunch,
        isMoveKick:          isMoveKick,
        isMoveThrow:         isMoveThrow,
        isMoveOffensiveHold: isMoveOffensiveHold,
        isMoveHold:          isMoveHold,
        isMoveHoldOnly:      isMoveHoldOnly,

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
        canMoveHitGround:       canMoveHitGround,

        getMoveSummary:       getMoveSummary,
        getActionStepSummary: getActionStepSummary,

        removeGuardConditionFromActionStepResult: removeGuardConditionFromActionStepResult,

        doesActionStepResultDescribeGuard: doesActionStepResultDescribeGuard,
        doesActionStepResultDescribeForcetech: doesActionStepResultDescribeForcetech,
        doesActionStepResultDescribeGroundHit: doesActionStepResultDescribeGroundHit,
        getAdvantageRange: getAdvantageRange,
        getActiveFramesRangeThatIntersectsWith: getActiveFramesRangeThatIntersectsWith,
        getMoveDurationData: getMoveDurationData,
        isActionStepResultEmpty: isActionStepResultEmpty,
        doesActionStepResultTagHasHardKnockDown: doesActionStepResultTagHasHardKnockDown,

        getActionStepResultHitBlock: getActionStepResultHitBlock,

        createEmptyData: createEmptyData

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
            abbreviation: undefined, // string
            description: undefined, // string
            appliesExtraFrame: undefined, // bool
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
            frameData: [], // Array<Int> // aka "Timeframe"

            actionSteps: [ undefined ],

            /** stance / context - like crounching after move or lying after taunt */
            endsWith: undefined,

            followUpInterval: [],

            followUps: [],

            /** string */
            comment: undefined

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
                grab for hold (regular, specific (can't be critical) and expert)
                ground attack
                other
             */
            actionType: undefined,

            isTracking: undefined, // bool

            damage: undefined, // int // striking back-faced opponent causes x1.25 damage

            reach: undefined, // float

            // condition: undefined,
            tags: [],

            // condition-specific results
            results: [ undefined ]

        });

        // critical holds have longer recovery than normal holds

        // all attacks that land on sidestepping becomes countering

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
            // surface: normal / "Slip Zone" (doing a counter hit against a low strike causes a bigger stun than normal)
            // hit distance: half hit / normal / close hit (Lisa's 2H+K GB on close hit; "close hit can't occur during critical combo")
            // other: neutral / counter / hi-counter / stun / critical hold / double use aka "critical finish" / use on CB / over combo limit aka "critical limit"
            //     2p seems to be an exception from double use
            //     according to tutorial dealing damage over "critical limit" causes "critical finish", the same term as on double use
            // environment: default / wall behind (Alpha-152 66P)
            condition: [],

            // Is calculated as amount of active frames after the one that landed + recovery + (dis-)advantage
            hitBlock: undefined, // Int

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
            // Making Critical Finish with move that causes sit-down results sit-down bounce that is vulnerable to Close Hit
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
            var abbreviation = node.abbreviation;
            return abbreviation ? '{' + abbreviation + '}' : 'stance';
        } else
        if (isMoveNode(node)) {
            var input = node.input;
            if (!input) return 'move';
            var context = node.context.join(',');
            if (context) return '{' + context + '}' + input;
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

    function isMovePunch(node)         { return node.actionSteps.some(isActionStepPunch); }
    function isMoveKick(node)          { return node.actionSteps.some(isActionStepKick);  }
    function isMoveThrow(node)         { return node.actionSteps.some(isActionStepThrow); }
    function isMoveOffensiveHold(node) { return node.actionSteps.some(isActionStepOffensiveHold); }
    function isMoveHold(node)          { return node.actionSteps.some(isActionStepHold);  }
    function isMoveHoldOnly(node)      { return node.actionSteps.every(isActionStepHold);  }

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

    function isActionStepOffensiveHold(actionStep) {
        if (!actionStep.actionType) return false;
        var actionType = actionStep.actionType.toLowerCase();
        return (
            actionType.search(/\boh\b/) >= 0 ||
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
        return searchInStringArray(actionStep.tags, /ground/i) >= 0;
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

    function removeGuardConditionFromActionStepResult(actionStepResult) {
        var changed = false;
        while (true) {
            var index = searchInStringArray(actionStepResult.condition, guardRegex);
            if (index < 0) break;
            changed = true;
            actionStepResult.condition.splice(index, 1);
        }
        return changed;
    }

    function doesActionStepResultDescribeGuard(actionStepResult) {
        return actionStepResult && searchInStringArray(actionStepResult.condition, guardRegex) >= 0;
    }

    function doesActionStepResultDescribeForcetech(actionStepResult) {
        return actionStepResult && searchInStringArray(actionStepResult.condition, /forcetech/i) >= 0;
    }

    function doesActionStepResultDescribeGroundHit(actionStepResult) {
        return actionStepResult && searchInStringArray(actionStepResult.condition, /grounded/i) >= 0;
    }

    function doesActionStepResultTagHasHardKnockDown(actionStepResult) {
        return actionStepResult && searchInStringArray(actionStepResult.tags, /hard/i) >= 0;
    }

    function getAdvantageRange(nodeData, actionStepResultFilter, getDuration) {
        console.assert(_.isObject(nodeData), 'nodeData is invalid');
        var frameData = nodeData.frameData;
        if (!frameData || frameData.length === 0) return;
        var actionSteps = nodeData.actionSteps;
        if (!actionSteps || actionSteps.length === 0) return;
        var recovery = frameData[frameData.length - 1];
        var activeFramesVarianceRoom = frameData[frameData.length - 2] - 1;
        for (var i = actionSteps.length - 1; i >= 0; --i) {
            var results = actionSteps[i].results;
            if (!results) continue;
            for (var j = 0; j < results.length; ++j) {
                if (actionStepResultFilter(results[j])) {
                    var blockStun = getDuration(results[j]);
                    if (isNaN(blockStun) || !isFinite(blockStun)) continue;
                    var maxAdvantage = blockStun - recovery;
                    var minAdvantage = maxAdvantage - activeFramesVarianceRoom;
                    return {
                        min: minAdvantage,
                        max: maxAdvantage
                    };
                }
            }
        }
    }

    function getActionStepResultHitBlock(actionStepResult) {
        return actionStepResult.hitBlock;
    }

    /**
     * `frameStart` and `frameEnd` inclusive. E.g. 10 (2) 15 is active on 11th and 12th frame
     * This method assumes that nodeData is valid and its `frameData` is not empty
     */
    function getActiveFramesRangeThatIntersectsWith(nodeData, frameStart, frameEnd) {
        console.assert(_.isObject(nodeData), 'nodeData is invalid');
        var frameData = nodeData.frameData; 
        console.assert(frameData.length > 0, 'Frame data is not provided');
        var t = frameData[0];
        for (var i = 1; i < frameData.length; i += 2) {
            var activeFrames = frameData[i];
            var recoveryFrames = _.defined(frameData[i + 1], 0);
            var activeFrameStart = t + 1;
            var activeFrameEnd = t + activeFrames;
            if (!(activeFrameEnd < frameStart || activeFrameStart > frameEnd)) {
                return [activeFrameStart, activeFrameEnd];
            }
            t += activeFrames + recoveryFrames;
        }
        return [];
    }

    /** This method assumes that nodeData is valid and its `frameData` is not empty */
    function getMoveDurationData(nodeData) {
        var frameData = nodeData.frameData;
        var withoutRecovery = 0;
        for (var i = 0; i < frameData.length - 1; ++i) {
            withoutRecovery += frameData[i];
        }
        var recovery = frameData[frameData.length - 1];
        return {
            total: withoutRecovery + recovery,
            withoutRecovery: withoutRecovery
        };
    }

    function isActionStepResultEmpty(actionStepResult) {
        return !_.withoutFalsyProperties(actionStepResult);
    }

    function canMoveHitGround(nodeData) {
        for (var i = 0; i < nodeData.actionSteps.length; ++i) {
            if (canActionStepHitGround(nodeData.actionSteps[i])) return true;
        }
        return false;
    }


    function createEmptyData() {

        return createRootNode({

            stances: [

                createStanceNode({
                    abbreviation: 'STD',
                    description: 'Standing',
                    appliesExtraFrame: true
                }),

                // when a non-tracking on first active frame misses due to sidestep, further active frames will miss too?
                createStanceNode({
                    abbreviation: 'SS',
                    description: 'Side step',
                    appliesExtraFrame: false,
                    moves: [
                        createMoveNode({
                            input: 'P',
                            actionSteps: [
                                createMoveActionStep({
                                    actionMask: 'P',
                                    actionType: 'strike'
                                    // starting from 14th (without counting extra initial frame) frame sidestep untouchable is inactive
                                    // followup: 13.
                                    // when followed up, sidestep untouchable shortens from 20 frames to 13
                                })
                            ]
                        }, true),
                        createMoveNode({
                            input: 'K',
                            actionSteps: [
                                createMoveActionStep({
                                    actionMask: 'K',
                                    actionType: 'strike'
                                })
                            ]
                        }, true),
                        createMoveNode({
                            input: '*',
                            frameData: [ 0, 0, 25 ],
                            endsWith: 'STD'
                        }, true)
                    ]
                }, true),

                createStanceNode({
                    abbreviation: 'GND',
                    description: 'From the ground',
                    appliesExtraFrame: true,
                    moves: [
                        createMoveNode({
                            input: 'K',
                            actionSteps: [
                                createMoveActionStep({
                                    actionMask: 'mid K',
                                    actionType: 'strike',
                                    isTracking: true
                                })
                            ]
                        }, true),
                        createMoveNode({
                            input: '2K',
                            actionSteps: [
                                createMoveActionStep({
                                    actionMask: 'low K',
                                    actionType: 'strike',
                                    isTracking: true,
                                    tags: ['ground attack']
                                })
                            ]
                        }, true)
                    ]
                }, true)

            ]

        }, true);

    }


    function searchInStringArray(array, regexOrString) {
        if (!array || !array.length) return -1;
        for (var i = 0; i < array.length; ++i) {
            if (array[i].search(regexOrString) >= 0) return i;
        }
        return -1;
    }

});