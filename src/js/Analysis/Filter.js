define(

    'Analysis/Filter',

    [
        'Analysis/Parser', 'Analysis/Operators',
        'Model/NodeFactory',
        'Model/NodeFactoryRoot',
        'Model/NodeFactoryStance',
        'Model/NodeFactoryMove',
        'Model/NodeFactoryActionStep',
        'Model/NodeFactoryActionStepResult',
        'Model/CommonStances',
        'Localization/Strings', 'Tools/Tools'
    ],

    function Filter(
        Parser, Operators,
        NodeFactory,
        NodeFactoryRoot,
        NodeFactoryStance,
        NodeFactoryMove,
        NodeFactoryActionStep,
        NodeFactoryActionStepResult,
        CommonStances,
        Strings, _
    ) {

        return {
            isTrackingMidKickNode:      isTrackingMidKickNode,
            isGroundAttackNode:         isGroundAttackNode,
            isSC6SoulChargeMove:        isSC6SoulChargeMove,
            isSC6BreakAttack:           isSC6BreakAttack,
            isSC6UnblockableAttack:     isSC6UnblockableAttack,
            isSC6LethalHit:             isSC6LethalHit,
            doesNodeCauseHardKnockDown: doesNodeCauseHardKnockDown,

            findNodes:            findNodes,
            findNodesToSpendTime: findNodesToSpendTime,
            createQuery:          createQuery,

            filterResultsToString: filterResultsToString
        };

        function createQuery(queryStr) {

            var result = Parser.parse(queryStr);
            if (result.type !== Operators.Type3.Boolean) {
                return;
            }
            return function(nodeData) {
                return Boolean(result.getValue(nodeData));
            };
        }

        //

        function isTrackingMidKickNode(nodeData) {
            if (nodeData && NodeFactoryMove.isMoveNode(nodeData)) {
                for (var i = 0; i < nodeData.actionSteps.length; ++i) {
                    var actionStep = nodeData.actionSteps[i];
                    if (
                        actionStep.isTracking &&
                        NodeFactoryActionStep.isActionStepKick(actionStep) &&
                        NodeFactoryActionStep.isActionStepMid(actionStep)
                    ) {
                        return true;
                    }
                }
            }
            return false;
        }

        function doesNodeCauseHardKnockDown(nodeData) {
            if (nodeData && NodeFactoryMove.isMoveNode(nodeData)) {
                return nodeData.actionSteps.some(function(actionStep) {
                    return actionStep.results.some(
                        NodeFactoryActionStepResult.doesTagHasHardKnockDown
                    );
                });
            }
            return false;
        }

        function isGroundAttackNode(nodeData) {
            if (nodeData && NodeFactoryMove.isMoveNode(nodeData)) {
                for (var i = 0; i < nodeData.actionSteps.length; ++i) {
                    var actionStep = nodeData.actionSteps[i];
                    if (NodeFactoryActionStep.canActionStepHitGround(actionStep)) {
                        return true;
                    }
                }
            }
            return false;
        }

        function isSC6SoulChargeMove(nodeData) {
            if (nodeData && NodeFactoryMove.isMoveNode(nodeData)) {
                return nodeData.context.some(function(ctx) {
                    return ctx.toLowerCase() === 'sc';
                });
            }
            return false;
        }

        function isSC6BreakAttack(nodeData) {
            if (nodeData && NodeFactoryMove.isMoveNode(nodeData)) {
                return hasActionStepWithTag(nodeData, 'ba');
            }
            return false;
        }

        function isSC6UnblockableAttack(nodeData) {
            if (nodeData && NodeFactoryMove.isMoveNode(nodeData)) {
                return hasActionStepWithTag(nodeData, 'ua');
            }
            return false;
        }

        function isSC6LethalHit(nodeData) {
            if (nodeData && NodeFactoryMove.isMoveNode(nodeData)) {
                return hasActionStepWithTag(nodeData, 'lh');
            }
            return false;
        }

        function hasActionStepWithTag(nodeData, givenTag) {
            for (var i = 0; i < nodeData.actionSteps.length; ++i) {
                var actionStep = nodeData.actionSteps[i];
                if (
                    actionStep.tags && actionStep.tags.some(function(tag) {
                        return tag.toLowerCase() === givenTag.toLowerCase();
                    })
                ) return true;
            }
            return false;
        }

        //

        function createWarner(outputObject) {
            var outputWarnings = outputObject || {};
            return warn;
            function warn(fullPath, message) {
                var fullMessage;
                var nodeData = fullPath[fullPath.length - 1];
                if (NodeFactoryStance.isStanceNode(nodeData)) {
                    fullMessage = (
                        Strings('stance') + ' ' + NodeFactory.toString(nodeData) + ' ' +
                        message
                    );
                } else {
                    fullMessage = pathHistoryToString(getRelativePath(fullPath)) + ' ' + message;
                }
                outputWarnings[fullMessage] = (outputWarnings[fullMessage] || 0) + 1;
            }
        }

        function createTraverser(
            rootNodeData,
            framesLimit,
            checkMoveNodeFunc,
            checkStanceNodeFunc
        ) {

            return traverse;

            function traverse(workingPath, restartFromRoot, framesSpent, currentStance) {
                // FIXME: replace with min value available or remove completely
                var NEGATIVE_FRAMEDATA_TOLERANCE = 10;
                /* Normally it makes sense to stop right after exceeding `framesLimit`,
                 * but then there are negative frame data... */
                if (framesSpent - framesLimit >= NEGATIVE_FRAMEDATA_TOLERANCE) return;
                if (restartFromRoot) {
                    // concat to make a copy
                    workingPath = workingPath.concat([rootNodeData]);
                }
                var stance = currentStance || CommonStances.DEFAULT;
                var workingParentNodeData = workingPath[workingPath.length - 1];
                NodeFactory.getChildren(workingParentNodeData).forEach(function(childNodeData) {
                    var childWorkingPath = workingPath.concat(childNodeData);
                    if (NodeFactoryMove.isMoveNode(childNodeData)) {
                        checkMoveNodeFunc(childWorkingPath, stance, framesSpent);
                    } else
                    if (NodeFactoryStance.isStanceNode(childNodeData)) {
                        checkStanceNodeFunc(childWorkingPath, stance, framesSpent);
                    }
                });
            }
        }

        //

        // Stuff to test on: Rig's 3k6k4 2k should land on frame 72
        function findNodes(
            rootNodeData,
            frameToBeActiveOnStart, // inclusive
            frameToBeActiveOnEnd,   // inclusive
            optNodeDataFilterFunc,
            optOutputWarnings,
            optCurrentStance,
            optCurrentPath,
            optFramesSpent
        ) {
            var currentStance      = optCurrentStance || CommonStances.DEFAULT;
            var currentFramesSpent = optFramesSpent   || 0;

            var results = [];

            var warnFunc = createWarner(optOutputWarnings);

            var traverseRecursive = _.flattenRecursionDirty(
                createTraverser(
                    rootNodeData,
                    frameToBeActiveOnEnd,
                    function checkMoveNodeFunc(childWorkingPath, stance, framesSpent) {
                        var intersectingActiveFramesRange = checkMoveNodeActiveFrames(
                            childWorkingPath, stance, framesSpent
                        );
                        var intersects = intersectingActiveFramesRange.length > 0;
                        if (intersects) {
                            results.push({
                                path: childWorkingPath,
                                range: intersectingActiveFramesRange
                            });
                        }
                    },
                    function checkStanceNodeFunc(childWorkingPath, stance, framesSpent) {
                        genericCheckStanceNode(
                            childWorkingPath, stance, framesSpent, traverseRecursive, warnFunc
                        );
                    }
                )
            );
            if (optCurrentPath) {
                traverseRecursive(optCurrentPath, false, currentFramesSpent, currentStance);
                traverseRecursive(optCurrentPath, true,  currentFramesSpent, currentStance);
            } else {
                traverseRecursive([], true, currentFramesSpent, currentStance);
            }

            // TODO: check if all stances are accessible

            // TODO: treat 7h, 4h, 6h as the same
            // TODO: include +- of active frames (e.g landed on 3rd out of 5 total)
            return results;

            /** Last element of `workingPath` must be a move node data */
            function checkMoveNodeActiveFrames(workingPath, workingStance, framesSpent) {

                var intersectingActiveFramesRange = [];

                if (
                    genericCheckMoveNode(
                        workingPath, workingStance, framesSpent,
                        traverseRecursive,
                        warnFunc
                    )
                ) {
                    var nodeData = workingPath[workingPath.length - 1];
                    // FIXME: filterFunc can be specific to action step
                    // E.g. Honoka's 214P+K doesn't have ground hit property on 2nd active frames group
                    if (!optNodeDataFilterFunc || optNodeDataFilterFunc(nodeData)) {
                        var actionLocalRange = NodeFactoryMove.getActiveFramesRangeThatIntersectsWith(
                            nodeData,
                            frameToBeActiveOnStart - framesSpent,
                            frameToBeActiveOnEnd   - framesSpent
                        );
                        var intersects = actionLocalRange.length > 0;
                        if (intersects) {
                            intersectingActiveFramesRange = [
                                framesSpent + actionLocalRange[0],
                                framesSpent + actionLocalRange[1]
                            ];
                        }
                    }
                }

                return intersectingActiveFramesRange;
            }

        }

        //

        function findNodesToSpendTime(
            rootNodeData,
            framesToSpend,
            endingStance,
            optNodeDataFilterFunc,
            optOutputWarnings,
            optCurrentStance
        ) {
            var results = [];

            var warnFunc = createWarner(optOutputWarnings);

            var traverseRecursive = _.flattenRecursionDirty(
                createTraverser(
                    rootNodeData,
                    framesToSpend,
                    function checkMoveNodeFunc(childWorkingPath, stance, framesSpent) {
                        if (
                            checkMoveNodeDuration(
                                childWorkingPath,
                                stance,
                                framesSpent
                            )
                        ) {
                            results.push(childWorkingPath);
                        }
                    },
                    function checkStanceNodeFunc(childWorkingPath, stance, framesSpent) {
                        genericCheckStanceNode(
                            childWorkingPath, stance, framesSpent,
                            traverseRecursive, warnFunc
                        );
                    }
                )
            );
            traverseRecursive([], true, 0, optCurrentStance || CommonStances.DEFAULT);

            return results.map(function(r) {
                return pathHistoryToString(r);
            }).join('\n');

            /** Last elements of `workingPath` must be a move node data */
            function checkMoveNodeDuration(
                workingPath,
                workingStance,
                framesSpent
            ) {

                var result = false;
                if (
                    genericCheckMoveNode(
                        workingPath, workingStance, framesSpent,
                        traverseRecursive,
                        warnFunc
                    )
                ) {
                    var nodeData = workingPath[workingPath.length - 1];
                    var moveDurationData = NodeFactoryMove.getMoveDurationData(nodeData);
                    if (filter(nodeData)) {
                        if (framesSpent + moveDurationData.total === framesToSpend) {
                            result = true;
                        }
                    }
                }
                return result;

                function filter(nodeData) {
                    return (
                        (!optNodeDataFilterFunc || optNodeDataFilterFunc(nodeData)) &&
                        (
                            nodeData.endsWith ||
                            CommonStances.DEFAULT
                        ).toLowerCase() === endingStance.toLowerCase()
                    );
                }
            }

        }

        /** Last element of `workingPath` must be a move node data */
        function genericCheckMoveNode(
            workingPath, workingStance, framesSpent,
            traverseRecursive,
            warnFunc
        ) {

            var checkPassed = false;

            var nodeData = workingPath[workingPath.length - 1];
            // Filter out BT moves
            if (!doesContextQualify(nodeData, workingStance)) {
                return checkPassed;
            }
            if (NodeFactoryMove.hasFrameData(nodeData)) {

                checkPassed = true;

                var moveDurationData = NodeFactoryMove.getMoveDurationData(nodeData);

                // Check followups of this move
                traverseRecursive(
                    workingPath, false,
                    // FIXME: use followup information instead of ignoring recovery
                    framesSpent + moveDurationData.withoutRecovery,
                    undefined
                );

                if (
                    Boolean(NodeFactory.getNoInputFollowup(nodeData)) &&
                    !nodeData.endsWith
                ) {
                    // free cancel unavailable
                    warnFunc(workingPath, Strings('skippingFreeCancel'));
                } else {
                    // Check followups after free cancel or end of string
                    traverseRecursive(
                        workingPath, true,
                        framesSpent + moveDurationData.total,
                        nodeData.endsWith
                    );
                }
            } else {
                warnFunc(workingPath, Strings('hasNoFrameData'));
            }

            return checkPassed;
        }

        //

        /** Assuming nodeData is stance node data */
        function genericCheckStanceNode(
            workingPath, workingStance, framesSpent, traverseRecursive, warnFunc
        ) {
            var nodeData = workingPath[workingPath.length - 1];
            if (doesStanceQualify(nodeData, workingStance)) {
                if (nodeData.appliesExtraFrame === undefined) {
                    warnFunc(workingPath, Strings('undefinedInitialFrame'));
                }
                var framesSpentByStance = (nodeData.appliesExtraFrame === false) ? 0 : 1;
                traverseRecursive(workingPath, false, framesSpent + framesSpentByStance, undefined);
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
                if (NodeFactoryMove.isMoveNode(nodeData)) {
                    moves.push(NodeFactory.toString(nodeData));
                } else
                if (NodeFactoryRoot.isRootNode(nodeData)) {
                    if (moves.length > 0) {
                        moves = [moves.join(' ') + ','];
                    }
                } else
                if (!firstStance && NodeFactoryStance.isStanceNode(nodeData)) {
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
                if (NodeFactoryRoot.isRootNode(pathHistory[i])) {
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
                return compareRange(a, b) === 0;
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
