define(

    'Model/NodeFactoryActionStepResult',

    [ 'Tools/Tools' ],

    function NodeFactoryActionStepResult(_) {

        var guardRegex = /block|guard/i;

        return {

            createMoveActionStepResult: createMoveActionStepResult,

            removeGuardCondition: removeGuardCondition,

            doesDescribeNeutralHit:     doesDescribeNeutralHit,
            doesDescribeCounterHit:     doesDescribeCounterHit,
            doesDescribeGuard:          doesDescribeGuard,
            doesDescribeForcetech:      doesDescribeForcetech,
            doesDescribeGroundHit:      doesDescribeGroundHit,
            doesDescribeGroundHitCombo: doesDescribeGroundHitCombo,
            doesTagHasHardKnockDown:    doesTagHasHardKnockDown,
            
            isEmpty: isEmpty,

            getHitBlock: getHitBlock

        };

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

        function removeGuardCondition(actionStepResult) {
            var changed = false;
            while (true) {
                var index = _.searchInStringArray(actionStepResult.condition, guardRegex);
                if (index < 0) break;
                changed = true;
                actionStepResult.condition.splice(index, 1);
            }
            return changed;
        }

        function doesDescribeNeutralHit(actionStepResult) {
            return actionStepResult && _.searchInStringArray(actionStepResult.condition, 'neutral') >= 0;
        }

        function doesDescribeCounterHit(actionStepResult) {
            return actionStepResult && _.searchInStringArray(actionStepResult.condition, 'counter') >= 0;
        }

        function doesDescribeGuard(actionStepResult) {
            return actionStepResult && _.searchInStringArray(actionStepResult.condition, guardRegex) >= 0;
        }

        // When a move forces to get up from first hit
        function doesDescribeForcetech(actionStepResult) {
            return actionStepResult && _.searchInStringArray(actionStepResult.condition, /forcetech/i) >= 0;
        }

        // When a move doesn't force to get up and opponent chooses to remain grounded
        function doesDescribeGroundHit(actionStepResult) {
            return (
                actionStepResult &&
                _.searchInStringArray(actionStepResult.condition, /grounded/i) >= 0 &&
                _.searchInStringArray(actionStepResult.condition, /grounded\ combo/i) < 0
            );
        }

        // When a move that normally doesn't force to get up hits as a combo and so forces to ge tup
        function doesDescribeGroundHitCombo(actionStepResult) {
            return (
                actionStepResult &&
                _.searchInStringArray(actionStepResult.condition, /grounded\ combo/i) >= 0
            );
        }

        function doesTagHasHardKnockDown(actionStepResult) {
            return actionStepResult && _.searchInStringArray(actionStepResult.tags, /hard/i) >= 0;
        }

        function isEmpty(actionStepResult) {
            return !_.withoutFalsyProperties(actionStepResult);
        }

        function getHitBlock(actionStepResult) {
            return actionStepResult.hitBlock;
        }

    }

);
