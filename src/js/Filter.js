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
                        var intersectingActiveFramesRange = checkMoveNode(
                            childWorkingPath,
                            stance,
                            optNodeDataFilterFunc,
                            frameToBeActiveOnStart,
                            frameToBeActiveOnEnd,
                            framesSpent,
                            keepLookingRecursive,
                            warnFunc
                        );
                        var intersects = intersectingActiveFramesRange.length > 0;
                        if (intersects) {
                            results.push({
                                path: childWorkingPath,
                                range: intersectingActiveFramesRange
                            });
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
            var intersectingActiveFramesRange = [];
            var nodeData = workingPath[workingPath.length - 1];
            // Filter out BT moves
            if (!doesContextQualify(nodeData, workingStance)) return intersectingActiveFramesRange;
            if (nodeData.frameData && nodeData.frameData.length > 0) {
                if (!optNodeDataFilterFunc || optNodeDataFilterFunc(nodeData)) {
                    var actionLocalRange = NodeFactory.getActiveFramesRangeThatIntersectsWith(
                        nodeData,
                        frameToBeActiveOnStart - framesSpent,
                        frameToBeActiveOnEnd   - framesSpent
                    );
                    var intersects = actionLocalRange.length > 0;
                    if (intersects)
                    {
                        intersectingActiveFramesRange = [
                            framesSpent + actionLocalRange[0],
                            framesSpent + actionLocalRange[1]
                        ];
                    }
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
                // FIXME: moves that described with child of input '*' should use them instead of free cancel
                keepLookingFunc(
                    workingPath, true,
                    framesSpent + moveDurationData.total,
                    nodeData.endsWith
                );
            } else {
                warnFunc(workingPath, 'has no frameData, probabilities that use it are excluded');
            }
            return intersectingActiveFramesRange;
        }

        /** Assuming nodeData is stance node data */
        function checkStanceNode(
            workingPath, workingStance, framesSpent, keepLookingFunc, warnFunc
        ) {
            var nodeData = workingPath[workingPath.length - 1];
            if (doesStanceQualify(nodeData, workingStance)) {
                if (nodeData.appliesExtraFrame === undefined) {
                    warnFunc(workingPath, 'did not define appliesExtraFrame, assuming it does');
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

        function filterResultsToString(results) {
            var sorted = sortResults(results);
            var stringLines = [];
            for (var i = 0; i < sorted.length; ++i) {
                var result = sorted[i];
                var str = pathHistoryToString(result.path);
                if (str) {
                    str += ' (' + result.range[0] + '-' + result.range[1] + 'f)';
                    stringLines.push(str);
                }
            }
            return stringLines.join('\n');
        }

        function sortResults(results) {

            // group together options that have same resulting active frames
            var groupedByActiveFrames = _.arrayGroupedByFactor(results, function(a, b) {
                return compareRange(a, b) == 0;
            });

            // put same ending move together
            groupedByActiveFrames = groupedByActiveFrames.map(function(group) {
                var groupedByFinalMove = _.arrayGroupedByFactor(
                    group,
                    function(a, b) {
                        return (
                            a.path.length > 0 &&
                            b.path.length > 0 &&
                            a.path[a.path.length - 1] === b.path[b.path.length - 1]
                        );
                    }
                );
                return flatten(groupedByFinalMove);
            });

            groupedByActiveFrames.sort(function(a, b) {
                return compareRange(a[0], b[0]);
            });

            return flatten(groupedByActiveFrames);

            function compareRange(a, b) {
                if (a.range[0] < b.range[0]) return -1;
                if (a.range[0] > b.range[0]) return 1;
                if (a.range[1] < b.range[1]) return -1;
                if (a.range[1] > b.range[1]) return 1;
                return 0;
            }

            function flatten(arr) {
                return arr.reduce(
                    function(acc, curr) { return acc.concat(curr); },
                    []
                );
            }
        }

    }

);