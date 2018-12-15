define(

    'Model/NodeFactoryMove',

    [ 'Model/NodeFactoryActionStep', 'Model/ActionType', 'Tools/Tools' ],

    function NodeFactoryMove(NodeFactoryActionStep, ActionType, _) {

        // var RGX = {
        //     PUNCH: /^\d*p(?:\+k)?$/i,
        //     KICK:  /(?:h\+)?k$/i,
        //     HOLD:  /^\d+h$/i,
        //     THROW: /^\d*t$/i
        // };

        return {

            createMoveNode: createMoveNode,
            isMoveNode:     isMoveNode,

            isMoveHorizontal:    isMoveHorizontal,
            isMoveVertical:      isMoveVertical,
            isMovePunch:         isMovePunch,
            isMoveKick:          isMoveKick,
            isMoveThrow:         isMoveThrow,
            isMoveOffensiveHold: isMoveOffensiveHold,
            isMoveHold:          isMoveHold,
            isMoveHoldOnly:      isMoveHoldOnly,

            canMoveHitGround: canMoveHitGround,

            getMoveSummary: getMoveSummary,
            getAdvantageRange: getAdvantageRange,
            getActiveFramesRangeThatIntersectsWith: getActiveFramesRangeThatIntersectsWith,
            getMoveDurationData: getMoveDurationData,

            hasFrameData:            hasFrameData,
            frameDataToString:       frameDataToString,
            hasMinimalFrameDataInfo: hasMinimalFrameDataInfo,
            getStartupFramesCount:   getStartupFramesCount,
            getActiveFramesCount:    getActiveFramesCount,
            getRecoveryFramesCount:  getRecoveryFramesCount,
            getActiveFrames:         getActiveFrames,
            changeFrameData:         changeFrameData

            // guessMoveTypeByInput: guessMoveTypeByInput

        };

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
                result.actionSteps[i] = NodeFactoryActionStep.createMoveActionStep(
                    result.actionSteps[i]
                );
            }

            if (optValidateChildren) {
                for (var i = 0; i < result.followUps.length; ++i) {
                    result.followUps[i] = createMoveNode(result.followUps[i], true);
                }
            }

            return result;

        }

        function isMoveNode(nodeData) {
            return nodeData.hasOwnProperty('input');
        }

        function isMoveHorizontal(nodeData)    { return nodeData.actionSteps.some(NodeFactoryActionStep.isActionStepHorizontal); }
        function isMoveVertical(nodeData)      { return nodeData.actionSteps.some(NodeFactoryActionStep.isActionStepVertical);  }
        function isMovePunch(nodeData)         { return nodeData.actionSteps.some(NodeFactoryActionStep.isActionStepPunch); }
        function isMoveKick(nodeData)          { return nodeData.actionSteps.some(NodeFactoryActionStep.isActionStepKick);  }
        function isMoveThrow(nodeData)         { return nodeData.actionSteps.some(NodeFactoryActionStep.isActionStepThrow); }
        function isMoveOffensiveHold(nodeData) { return nodeData.actionSteps.some(NodeFactoryActionStep.isActionStepOffensiveHold); }
        function isMoveHold(nodeData)          { return nodeData.actionSteps.some(NodeFactoryActionStep.isActionStepHold);  }
        function isMoveHoldOnly(nodeData)      { return nodeData.actionSteps.every(NodeFactoryActionStep.isActionStepHold);  }

        function canMoveHitGround(nodeData) {
            for (var i = 0; i < nodeData.actionSteps.length; ++i) {
                if (NodeFactoryActionStep.canActionStepHitGround(nodeData.actionSteps[i])) {
                    return true;
                }
            }
            return false;
        }

        function getMoveSummary(nodeData) {

            var result = [];

            if (nodeData.context && nodeData.context.length > 0) {
                var context = nodeData.context.join(',').trim();
                if (context) result.push(context + ':');
            };

            result.push(nodeData.input);

            if (nodeData.actionSteps && nodeData.actionSteps.length > 0) {
                result.push(NodeFactoryActionStep.getActionStepSummary(nodeData.actionSteps[0]));
            }

            return result.join(' ').trim();

        }

        function getAdvantageRange(
            nodeData,
            getDuration,
            optActionStepResultFilter,
            optParentNodeData
        ) {
            console.assert(_.isObject(nodeData), 'nodeData is invalid');

            if (!hasFrameData(nodeData)) return;
            var frameData = nodeData.frameData;

            var activeFramesVarianceRoom = 0;
            var recovery = 0;

            var stun = getStun(nodeData, getDuration, optActionStepResultFilter);

            // FIXME: if !stun && hasNonOtherActionStepResult
            if (stun === null) return;

            if (stun) {
                activeFramesVarianceRoom = frameData[1 + stun.actionStep * 2] - 1;
                recovery = sum(frameData, 1 + stun.actionStep * 2 + 1);
            } else {
                var parentNodeData = optParentNodeData;
                if (!parentNodeData) return;
                console.assert(_.isObject(parentNodeData), 'parentNodeData is invalid');
                if (!isMoveNode(parentNodeData)) return;
                if (!hasFrameData(parentNodeData)) return;
                var parentFrameData = parentNodeData.frameData;
                stun = getStun(parentNodeData, getDuration, optActionStepResultFilter);
                if (!stun) {
                    // FIXME: go on
                    return;
                }
                activeFramesVarianceRoom = parentFrameData[1 + stun.actionStep * 2] - 1;
                recovery = sum(frameData);
            }

            var maxAdvantage = stun.lockDuration - recovery;
            var minAdvantage = maxAdvantage - activeFramesVarianceRoom;
            return {
                min: minAdvantage,
                max: maxAdvantage
            };

            function getStun(nodeData, getDuration, optActionStepResultFilter) {

                var actionSteps = nodeData.actionSteps;
                if (!actionSteps || actionSteps.length === 0) return;

                var hasNonOtherActionStepResult = true;

                for (var i = actionSteps.length - 1; i >= 0; --i) {
                    if (actionSteps[i].actionType === 'strike') {
                        hasNonOtherActionStepResult = false;
                    }
                    var results = actionSteps[i].results;
                    if (!results) continue;
                    for (var j = 0; j < results.length; ++j) {
                        if (!optActionStepResultFilter || optActionStepResultFilter(results[j])) {
                            var lockDuration = getDuration(results[j]);
                            if (isNaN(lockDuration) || !isFinite(lockDuration)) continue;
                            return {
                                lockDuration: lockDuration,
                                actionStep: i
                            };
                        }
                    }
                }

                if (!hasNonOtherActionStepResult) {
                    return null;
                }
            }

            function sum(arrayOfNumbers, optStartIndex) {
                return arrayOfNumbers.slice(optStartIndex || 0).reduce(
                    function(acc, curr) { return acc + curr; },
                    0
                );
            }
        }

        /**
         * `frameStart` and `frameEnd` inclusive. E.g. 10 (2) 15 is active on 11th and 12th frame
         * This method assumes that nodeData is valid and its `frameData` is not empty
         */
        function getActiveFramesRangeThatIntersectsWith(nodeData, frameStart, frameEnd) {
            console.assert(_.isObject(nodeData), 'nodeData is invalid');
            console.assert(hasFrameData(nodeData), 'Frame data is not provided');
            var frameData = nodeData.frameData; 
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

        function hasFrameData(nodeData) {
            return nodeData.frameData && nodeData.frameData.length > 0;
        }

        function frameDataToString(nodeData) {
            return nodeData.frameData.join(' ') || '';
        }

        function hasMinimalFrameDataInfo(nodeData) {
            return nodeData.frameData.length >= 3;
        }

        function getStartupFramesCount(nodeData) {
            return nodeData.frameData[0];
        }

        function getActiveFramesCount(nodeData) {
            return nodeData.frameData[nodeData.frameData.length - 2];
        }

        function getRecoveryFramesCount(nodeData) {
            return nodeData.frameData[nodeData.frameData.length - 1];
        }

        function getActiveFrames(nodeData) {
            var frames = 0;
            frames += nodeData.frameData[0];
            var activeFrames = [];
            for (var i = 1; i < nodeData.frameData.length; i += 2) {
                var localFrames = nodeData.frameData[i];
                for (var j = 0; j < localFrames; ++j) {
                    activeFrames.push(frames + j + 1);
                }
                frames += localFrames + nodeData.frameData[i + 1];
            }
            console.assert(!isNaN(frames), 'Frames are NaN');
            return activeFrames;
        }

        function changeFrameData(nodeData, newValue) {
            var oldValue = nodeData.frameData || [];
            nodeData.frameData = newValue;
            return !_.arraysAreEqual(oldValue, newValue);
        }

        // function guessMoveTypeByInput(nodeData) {
        //     var input = nodeData.input;
        //     var actionStep = nodeData.actionSteps[0];
        //     if (RGX.PUNCH.test(input)) {
        //         actionStep.actionType = ActionType.Strike;
        //         actionStep.actionMask = 'P';
        //     } else
        //     if (RGX.KICK.test(input))  {
        //         actionStep.actionType = ActionType.Strike;
        //         actionStep.actionMask = 'K';
        //     } else
        //     if (RGX.HOLD.test(input))  {
        //         actionStep.actionType = ActionType.Hold;
        //         actionStep.actionMask = undefined;
        //      } else
        //     if (RGX.THROW.test(input)) {
        //         actionStep.actionType = ActionType.Throw;
        //         actionStep.actionMask = undefined;
        //     } else {
        //         actionStep.actionType = ActionType.Other;
        //         actionStep.actionMask = undefined;
        //     }
        // }

        // function canMoveForceTech(nodeData) {

        //     var input = nodeData.input;

        //     // Exclude holds and throws
        //     // FIXME: some throws can grab grounded opponent
        //     if (input.match(/(46|7|4|6|1)h/i) || input.match(/t/i)) {
        //         return false;
        //     }

        //     for (var i = 0; i < nodeData.actionSteps.length; ++i) {

        //         if (NodeFactoryActionStep.canActionStepHitGround(nodeData.actionSteps[i])) {
        //             return true;
        //         }

        //         var actionMask = nodeData.actionSteps[i].actionMask;
        //         if (
        //             !actionMask ||
        //             actionMask.search('high') >= 0
        //         ) {
        //             return false;
        //         }
        //     }

        //     return true;

        // }

    }

);
