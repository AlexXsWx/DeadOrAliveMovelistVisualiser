define(

    'Model/NodeFactoryActionStep',

    [ 'Model/NodeFactoryActionStepResult', 'Model/ActionType', 'Tools/Tools' ],

    function NodeFactoryActionStep(NodeFactoryActionStepResult, ActionType, _) {

        var isActionStepHold       = actionTypeChecker(ActionType.Hold);
        var isActionStepJumpAttack = actionTypeChecker(ActionType.Jump);

        return {
            createMoveActionStep: createMoveActionStep,

            isActionStepPunch:         isActionStepPunch,
            isActionStepKick:          isActionStepKick,
            isActionStepThrow:         isActionStepThrow,
            isActionStepOffensiveHold: isActionStepOffensiveHold,

            isActionStepHold:          isActionStepHold,
            isActionStepJumpAttack:    isActionStepJumpAttack,
            isActionStepGroundAttack:  actionTypeChecker(ActionType.Ground),
            isActionStepOther:         actionTypeChecker(ActionType.Other),

            isActionStepHigh:          isActionStepHigh,
            isActionStepMid:           isActionStepMid,
            isActionStepLow:           isActionStepLow,
            isActionStepHorizontal:    isActionStepHorizontal,
            isActionStepVertical:      isActionStepVertical,


            canActionStepHitGround: canActionStepHitGround,
            getActionStepSummary:   getActionStepSummary,
        };

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
                actionStep.results[i] = NodeFactoryActionStepResult.createMoveActionStepResult(
                    actionStep.results[i]
                );
            }

            return actionStep;

        }

        function isActionStepPunch(actionStep) {
            if (!actionStep.actionMask || !actionStep.actionType) return false;
            var actionType = actionStep.actionType.toLowerCase();
            return (actionStep.actionMask.toLowerCase().search('p') >= 0 && (
                actionType.search(ActionType.Strike) >= 0 ||
                actionType.search(ActionType.HelperAttack) >= 0
            ));
        }

        function isActionStepKick(actionStep) {
            if (!actionStep.actionMask || !actionStep.actionType) return false;
            var actionType = actionStep.actionType.toLowerCase();
            return (actionStep.actionMask.toLowerCase().search('k') >= 0 && (
                actionType.search(ActionType.Strike) >= 0 ||
                actionType.search(ActionType.HelperAttack) >= 0
            ));
        }

        function isActionStepThrow(actionStep) {
            if (!actionStep.actionType) return false;
            var actionType = actionStep.actionType.toLowerCase();
            return (
                actionType.search(ActionType.HelperGrab) >= 0 ||
                actionType.search(ActionType.Throw) >= 0 ||
                actionType.search(ActionType.HelperOffensive) >= 0
            );
        }

        function isActionStepOffensiveHold(actionStep) {
            if (!actionStep.actionType) return false;
            var actionType = actionStep.actionType.toLowerCase();
            return (
                actionType.search(ActionType.HelperOH) >= 0 ||
                actionType.search(ActionType.HelperOffensive) >= 0
            );
        }

        function isActionStepHigh(actionStep) { return /\bhigh\b/i.test(actionStep.actionMask); }
        function isActionStepMid(actionStep)  { return /\bmid\b/i.test(actionStep.actionMask);  }
        function isActionStepLow(actionStep)  { return /\blow\b/i.test(actionStep.actionMask);  }

        function isActionStepHorizontal(actionStep) {
            if (!actionStep.actionMask || !actionStep.actionType) return false;
            var actionType = actionStep.actionType.toLowerCase();
            return (
                (
                    actionStep.actionMask.toLowerCase().search('p') >= 0 ||
                    actionStep.actionMask.toLowerCase().search('k') >= 0
                ) && (
                    actionStep.isTracking === true
                ) && (
                    actionType.search(ActionType.Strike) >= 0 ||
                    actionType.search(ActionType.HelperAttack) >= 0
                )
            );
        }

        function isActionStepVertical(actionStep) {
            if (!actionStep.actionMask || !actionStep.actionType) return false;
            var actionType = actionStep.actionType.toLowerCase();
            return (
                (
                    actionStep.actionMask.toLowerCase().search('p') >= 0 ||
                    actionStep.actionMask.toLowerCase().search('k') >= 0
                ) && (
                    actionStep.isTracking === false
                ) && (
                    actionType.search(ActionType.Strike) >= 0 ||
                    actionType.search(ActionType.HelperAttack) >= 0
                )
            );
        }

        function canActionStepHitGround(actionStep) {
            return _.searchInStringArray(actionStep.tags, /ground/i) >= 0;
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

        // Helpers

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

        function actionTypeChecker(word) {
            return function(actionStep) {
                return (
                    actionStep.actionType &&
                    actionStep.actionType.toLowerCase().search(word) >= 0
                );
            };
        }

    }

);
