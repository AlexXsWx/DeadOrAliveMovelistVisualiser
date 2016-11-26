define(

    'Filter',

    [ 'NodeFactory', 'Tools' ],

    function Filter(NodeFactory, _) {

        return {
            isTrackingMidKickNode: isTrackingMidKickNode,
            isGroundAttackNode: isGroundAttackNode,
            doesNodeCauseHardKnockDown: doesNodeCauseHardKnockDown,
            findNodes: findNodes
        };

        function isTrackingMidKickNode(nodeData) {
            if (nodeData && NodeFactory.isMoveNode(nodeData)) {
                for (var i = 0; i < nodeData.actionSteps.length; ++i) {
                    var actionStep = nodeData.actionSteps[i];
                    if (
                        actionStep.isTracking &&
                        NodeFactory.isActionStepKick(actionStep) &&
                        NodeFactory.isActionStepMid(actionStep)
                    ) {
                        return true;
                    }
                }
            }
            return false
        }

        function doesNodeCauseHardKnockDown(nodeData) {
            if (nodeData && NodeFactory.isMoveNode(nodeData)) {
                for (var i = 0; i < nodeData.actionSteps.length; ++i) {
                    var actionStep = nodeData.actionSteps[i];
                    for (var j = 0; j < actionStep.results.length; ++j) {
                        if (NodeFactory.doesActionStepResultTagHasHardKnockDown(actionStep.results[j])) {
                            return true;
                        }
                    }
                }
            }
            return false
        }

        function isGroundAttackNode(nodeData) {
            if (nodeData && NodeFactory.isMoveNode(nodeData)) {
                for (var i = 0; i < nodeData.actionSteps.length; ++i) {
                    var actionStep = nodeData.actionSteps[i];
                    if (NodeFactory.canActionStepHitGround(actionStep)) {
                        return true;
                    }
                }
            }
            return false
        }

        function createWarner(outputObject) {
            var outputWarnings = outputObject || {};
            return warn;
            function warn(fullPath, message) {
                var fullMessage;
                var nodeData = fullPath[fullPath.length - 1];
                if (NodeFactory.isStanceNode(nodeData)) {
                    fullMessage = 'stance ' + NodeFactory.toString(nodeData) + ' ' + message;
                } else {
                    fullMessage = pathHistoryToString(getRelativePath(fullPath)) + ' ' + message;
                }
                outputWarnings[fullMessage] = (outputWarnings[fullMessage] || 0) + 1;
            }
        }

        // Stuff to test on: Rig's 3k6k4 2k should land on frame 72
        function findNodes(
            rootNodeData,
            frameToBeActiveOnStart, // inclusive
            frameToBeActiveOnEnd,   // inclusive
            optNodeDataFilterFunc,
            optOutputWarnings,
            optCurrentStance
        ) {
            var results = [];

            var warnFunc = createWarner(optOutputWarnings);

            var keepLookingRecursive = _.flattenRecursion(keepLooking);
            keepLookingRecursive([], true, 0, optCurrentStance || 'STD');
            function keepLooking(workingPath, restartFromRoot, framesSpent, currentStance) {
                var negativeFramedataTolerance = 10;
                /* Normally it makes sense to stop right after exceeding frameToBeActiveOnEnd,
                 * but then there are negative frame data... */
                if (framesSpent - frameToBeActiveOnEnd >= negativeFramedataTolerance) return;
                if (restartFromRoot) workingPath = workingPath.concat([rootNodeData]);
                var stance = currentStance || 'STD';
                var workingParentNodeData = workingPath[workingPath.length - 1];
                NodeFactory.getChildren(workingParentNodeData).forEach(function(childNodeData) {
                    var childWorkingPath = workingPath.concat(childNodeData);
        // pathHistoryToString(childWorkingPath);
                    if (NodeFactory.isMoveNode(childNodeData)) {
                        var qualifies = checkMoveNode(
                            childWorkingPath,
                            stance,
                            optNodeDataFilterFunc,
                            frameToBeActiveOnStart,
                            frameToBeActiveOnEnd,
                            framesSpent,
                            keepLookingRecursive,
                            warnFunc
                        );
                        if (qualifies) {
                            results.push(childWorkingPath);
                        }
                    } else
                    if (NodeFactory.isStanceNode(childNodeData)) {
                        checkStanceNode(
                            childWorkingPath, stance, framesSpent, keepLookingRecursive, warnFunc
                        );
                    }
                });
            }

            // TODO: handle 7h, 4h, 6h as the same
            // TODO: include +- of active frames (e.g landed on 3rd out of 5 total)
            return filterResultsToString(results);

        }

        /** Assuming nodeData is move node data */
        function checkMoveNode(
            workingPath,
            workingStance,
            optNodeDataFilterFunc,
            frameToBeActiveOnStart, // inclusive
            frameToBeActiveOnEnd,   // inclusive
            framesSpent,
            keepLookingFunc,
            warnFunc
        ) {
            var qualifies = false;
            var nodeData = workingPath[workingPath.length - 1];
            // Filter out BT moves
            if (!doesContextQualify(nodeData, workingStance)) return qualifies;
            if (nodeData.frameData && nodeData.frameData.length > 0) {
                if (
                    (!optNodeDataFilterFunc || optNodeDataFilterFunc(nodeData)) && 
                    NodeFactory.doesMoveContainActiveFrameInRange(
                        nodeData,
                        frameToBeActiveOnStart - framesSpent,
                        frameToBeActiveOnEnd   - framesSpent
                    )
                ) {
                    qualifies = true;
                }

                var moveDurationData = NodeFactory.getMoveDurationData(nodeData);

                // Check followups of this move
                keepLookingFunc(
                    workingPath, false,
                    // FIXME: use followup information instead of ignoring recovery
                    framesSpent + moveDurationData.withoutRecovery,
                    undefined
                );

                // Check followups after free cancel or end of string
                keepLookingFunc(
                    workingPath, true,
                    framesSpent + moveDurationData.total,
                    nodeData.endsWith
                );
            } else {
                warnFunc(workingPath, 'has no frameData');
            }
            return qualifies;
        }

        /** Assuming nodeData is stance node data */
        function checkStanceNode(
            workingPath, workingStance, framesSpent, keepLookingFunc, warnFunc
        ) {
            var nodeData = workingPath[workingPath.length - 1];
            if (doesStanceQualify(nodeData, workingStance)) {
                if (nodeData.appliesExtraFrame === undefined) {
                    warnFunc(workingPath, 'did not define appliesExtraFrame');
                }
                var framesSpentByStance = (nodeData.appliesExtraFrame === false) ? 0 : 1;
                keepLookingFunc(workingPath, false, framesSpent + framesSpentByStance, undefined);
            }
        }

        function doesStanceQualify(stanceNodeData, stance) {
            // FIXME: this doesn't path through moves that end with BT
            return stanceNodeData.abbreviation === stance;
        }

        function doesContextQualify(moveNodeData, stance) {
            return (
                (moveNodeData.context.length === 0) ||
                _.arraysConsistOfSameStrings(
                    moveNodeData.context.join(',').toLowerCase().split(','),
                    stance.toLowerCase().split(',')
                )
            );
        }

        function pathHistoryToString(pathHistory) {
            var result = '';
            if (pathHistory.length === 0) return result;
            var moves = [];
            var firstStance = undefined;
            for (var j = 0; j < pathHistory.length; ++j) {
                var nodeData = pathHistory[j];
                if (NodeFactory.isMoveNode(nodeData)) {
                    moves.push(NodeFactory.toString(nodeData));
                } else
                if (NodeFactory.isRootNode(nodeData)) {
                    if (moves.length > 0) {
                        moves = [moves.join(' ') + ','];
                    }
                } else
                if (!firstStance && NodeFactory.isStanceNode(nodeData)) {
                    firstStance = nodeData;
                }
            }
            if (moves.length > 0) {
                if (firstStance) result += NodeFactory.toString(firstStance) + ': ';
                result += moves.join(' ');
            }
            return result;
        }

        function getRelativePath(pathHistory) {
            for (var i = pathHistory.length - 1; i >= 0; --i) {
                if (NodeFactory.isRootNode(pathHistory[i])) {
                    return pathHistory.slice(i);
                }
            }
            return pathHistory;
        }

        function filterResultsToString(pathHistoryArray) {
            var results = [];
            for (var i = 0; i < pathHistoryArray.length; ++i) {
                var str = pathHistoryToString(pathHistoryArray[i]);
                if (str) results.push(str);
            }
            return results.join('\n');
            // var result = pathHistoryArray.filter(
            //     function(pathHistory) { return pathHistory.length > 0; }
            // );
            // // FIXME: add comma on free cancel
            // return result.map(function(pathHistory) {
            //     if (typeof pathHistory === 'string') return pathHistory;
            //     return pathHistory.filter(
            //         function(nodeData) { return NodeFactory.isMoveNode(nodeData); }
            //     ).map(
            //         function(nodeData) { return NodeFactory.toString(nodeData); }
            //     ).join(' ');
            // }).join('\n');
        }

    }

);