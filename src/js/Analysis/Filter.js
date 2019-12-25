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

        var backturnedContext = 'BT';

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
                        if (
                            !genericCheckMoveNode(
                                childWorkingPath, stance, framesSpent,
                                traverseRecursive,
                                warnFunc
                            )
                        ) {
                            return;
                        }
                        
                        var intersectingActiveFramesRange = checkMoveNodeActiveFrames(
                            childWorkingPath[childWorkingPath.length - 1], framesSpent
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

            function checkMoveNodeActiveFrames(moveNodeData, framesSpent) {

                var intersectingActiveFramesRange = [];

                // FIXME: filterFunc can be specific to action step
                // E.g. Honoka's 214P+K doesn't have ground hit property on 2nd active frames group
                if (!optNodeDataFilterFunc || optNodeDataFilterFunc(moveNodeData)) {
                    var actionLocalRange = NodeFactoryMove.getActiveFramesRangeThatIntersectsWith(
                        moveNodeData,
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

                return intersectingActiveFramesRange;
            }

        }

        //

        function findNodesToSpendTime(
            rootNodeData,
            framesToSpend,
            framesToSpendMax,
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
                    framesToSpendMax,
                    function checkMoveNodeFunc(childWorkingPath, stance, framesSpent) {
                        var temp = checkMoveNodeDuration(
                            childWorkingPath,
                            stance,
                            framesSpent
                        );
                        if (temp.matches) {
                            results.push({
                                path: childWorkingPath,
                                range: [temp.duration, temp.duration]
                            });
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

            // FIXME
            return filterResultsToString(results, 0, 0);

            /** Last elements of `workingPath` must be a move node data */
            function checkMoveNodeDuration(
                workingPath,
                workingStance,
                framesSpent
            ) {

                var result = { matches: false, duration: undefined };
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
                        if (
                            framesSpent + moveDurationData.total >= framesToSpend &&
                            framesSpent + moveDurationData.total <= framesToSpendMax
                        ) {
                            result.matches = true;
                            result.duration = framesSpent + moveDurationData.total;
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
            // check BT status
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
                traverseRecursive(
                    workingPath, false, framesSpent + framesSpentByStance,
                    (workingStance === backturnedContext) ? backturnedContext : undefined
                );
            }
        }

        function doesStanceQualify(stanceNodeData, stance) {
            return (
                stanceNodeData.abbreviation === stance || (
                    stance === backturnedContext &&
                    stanceNodeData.abbreviation === CommonStances.DEFAULT
                )
            );
        }

        function doesContextQualify(moveNodeData, stance) {
            var parts = moveNodeData.context.join(',').toLowerCase().split(',');
            return (
                _.contains(parts, backturnedContext.toLowerCase()) ===
                (stance === backturnedContext)
            );
            // _.arraysConsistOfSameStrings(
            //     moveNodeData.context.length === 0
            //         ? []
            //         : moveNodeData.context.join(',').toLowerCase().split(','),
            //     stance.toLowerCase().split(',')
            // );
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

        function filterResultsToString(results, latestActiveFrameStart, latestActiveFrameEnd) {
            if (results.length === 0) return [];
            var sorted = sortResults(results, latestActiveFrameStart, latestActiveFrameEnd);
            var stringLines = [];
            var lastRange = undefined;
            var lastEnding = sorted[0].path[sorted[0].path.length - 1];
            var rangeStr = (
                latestActiveFrameStart + '..' +
                latestActiveFrameEnd + 'f'
            );
            for (var i = 0; i < sorted.length; ++i) {
                var result = sorted[i];
                var str = pathHistoryToString(result.path);
                if (str) {
                    // FIXME: localize
                    var range = 'Begins and ends outside ' + rangeStr;
                    if (
                        result.range[0] >= latestActiveFrameStart &&
                        result.range[0] <= latestActiveFrameEnd
                    ) {
                        // FIXME: localize
                        range = 'Begins during ' + rangeStr;
                    } else
                    if (
                        result.range[1] >= latestActiveFrameEnd &&
                        result.range[1] <= latestActiveFrameEnd
                    ) {
                        // FIXME: localize
                        range = 'Ends during ' + rangeStr;
                    }
                    if (range !== lastRange) {
                        stringLines.push('');
                        stringLines.push('');
                        stringLines.push('  ' + range + ':');
                        stringLines.push('');
                        lastRange = range;
                    } else {
                        var ending = result.path[result.path.length - 1];
                        if (lastEnding !== ending) {
                            stringLines.push('');
                            lastEnding = ending;
                        }
                    }
                    var advantageOnBlock = getAdvantageOnBlock(result, latestActiveFrameStart);
                    stringLines.push(
                        str + '; ' +
                        '(' +
                            result.range[0] + '-' + result.range[1] + 'f' +
                            (isFinite(advantageOnBlock) ? '; g' + _.signed(advantageOnBlock) : '') +
                        ')'
                    );
                }
            }
            return stringLines.join('\n');
        }

        function filterResultToMove(filterResult) {
            return filterResult.path[filterResult.path.length - 1];
        }

        // FIXME: account for stances that don't apply initial frame
        // FIXME: account for no-input followup
        function getAdvantageOnBlock(filterResult, rangeStart) {
            var moveNodeData = filterResultToMove(filterResult);
            var range = NodeFactoryMove.getAdvantageRange(
                moveNodeData,
                NodeFactoryActionStepResult.getHitBlockOrStun,
                NodeFactoryActionStepResult.doesDescribeGuard,
            );
            if (!range) return -Infinity;
            return range.min + Math.max(0, rangeStart - filterResult.range[0]);
        }

        function sortResults(results, rangeStart, rangeEnd) {

            var moves = [];
            function getMoveIndex(moveNodeData) {
                var index = moves.indexOf(moveNodeData);
                if (index === -1) {
                    index = moves.push(moveNodeData) - 1;
                }
                return index;
            }

            var move = filterResultToMove;

            function getPerceivedPathLength(filterResult) {
                return filterResult.path.filter(NodeFactoryMove.isMoveNode).length;
            }

            function rangeStartWithinRange(a) {
                return a.range[0] >= rangeStart && a.range[0] <= rangeEnd;
            }

            function rangeEndWithinRange(a) {
                return a.range[1] >= rangeStart && a.range[1] <= rangeEnd;
            }

            var prios = [
                // Moves whose active frame begins at the given frame is the classic unholdable
                function(a, b) { return rangeStartWithinRange(a); },

                // Moves whose active frame ends at the given frame can be unholdable on force tech
                function(a, b) { return rangeEndWithinRange(a); },

                // Throws can be interrupted by an attack
                function(a, b) { return !NodeFactoryMove.isMoveThrow(move(a)); },

                // Despite OHs can be interrupted by a throw it's not a common defense
                function(a, b) { return NodeFactoryMove.isMoveOffensiveHold(move(a)); },

                // Some two-hit moves don't have advantage on block info for the first hit
                function(a, b) { return !isFinite(getAdvantageOnBlock(a, rangeStart)); },

                // Show g+0 or higher first
                function(a, b) { return getAdvantageOnBlock(a, rangeStart) >= 0; },

                // Prioritize mid/low over high since high can be ducked under
                function(a, b) {
                    return move(a).actionSteps.some(function(actionStep) {
                        return (
                            NodeFactoryActionStep.isActionStepMid(actionStep) ||
                            NodeFactoryActionStep.isActionStepLow(actionStep)
                        );
                    });
                },

                // Sort by advantage on block
                function(a, b) {
                    return (
                        getAdvantageOnBlock(a, rangeStart) >
                        getAdvantageOnBlock(b, rangeStart)
                    );
                },

                // TODO: when given range, sort by active frames start, ascending
                // function(a, b) {
                //     if (rangeStartWithinRange(a)) return a.range[0] < b.range[0];
                //     if (rangeEndWithinRange(a))   return a.range[1] < b.range[1];
                //     return false;
                // },

                // Group same moves together
                function(a, b) { return getMoveIndex(move(a)) > getMoveIndex(move(b)); },

                // Show short combos first
                function(a, b) { return getPerceivedPathLength(a) < getPerceivedPathLength(b); },

                // Prioritize by active frames end descending
                function(a, b) { return a.range[1] > b.range[1]; },

                // Prioritize by active frames start descending
                function(a, b) { return a.range[0] > b.range[0]; }

                // TODO:
                // fastest followup / least recovery
                // having lows in between, since they scare opponent to techroll
                // not having throws in between, since they potentially expose to hi-counter hit
            ];

            return results.slice().sort(function(a, b) {
                return _.flatForEach(
                    prios,
                    function(prio) {
                        var aHasPrio = prio(a, b);
                        var bHasPrio = prio(b, a);
                        if (aHasPrio && !bHasPrio) return -1;
                        if (!aHasPrio && bHasPrio) return 1;
                        return 0;
                    },
                    function(result) {
                        return result !== 0;
                    }
                );
            });
        }

    }

);
