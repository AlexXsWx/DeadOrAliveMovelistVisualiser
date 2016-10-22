define(

    'Filter',

    [ 'NodeFactory', 'Tools' ],

    function Filter(NodeFactory, _) {

        return {
            isTrackingMidKickNode: isTrackingMidKickNode,
            isGroundAttackNode: isGroundAttackNode,
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

        function findNodes(
            rootNodeData,
            frameToBeActiveOnStart, // inclusive
            frameToBeActiveOnEnd,   // inclusive
            doesNodeDataQualify,
            optWarnings,
            optPathHistory,
            optFramesSpent,
            optCurrentStance
        ) {
            var result = doFindNodes(
                rootNodeData,
                frameToBeActiveOnStart,
                frameToBeActiveOnEnd,
                doesNodeDataQualify,
                optWarnings,
                optPathHistory,
                optFramesSpent,
                optCurrentStance
            );
            return filterResultsToString(result);
        }

        function doFindNodes(
            rootNodeData,
            frameToBeActiveOnStart, // inclusive
            frameToBeActiveOnEnd,   // inclusive
            doesNodeDataQualify,
            optWarnings,
            optPathHistory,
            optFramesSpent,
            optCurrentStance
        ) {

            var currentParentPath = optPathHistory || [rootNodeData];
            var stance = optCurrentStance || 'STD';

            var result = [];

            var currentParentData = currentParentPath[currentParentPath.length - 1];
            NodeFactory.getChildren(currentParentData).forEach(function(child) {

                var framesSpent = _.defined(optFramesSpent, 0);

                var childFullPath = currentParentPath.concat(child);

                if (NodeFactory.isMoveNode(child)) {
                    var frameData = child.frameData;
                    if (frameData && frameData.length > 0) {
                        // Filter out BT moves
                        if (!doesContextQualify(child, stance)) return;
                        if (
                            doesNodeDataQualify(child) && 
                            NodeFactory.doesMoveContainActiveFrameInRange(
                                child,
                                frameToBeActiveOnStart - framesSpent,
                                frameToBeActiveOnEnd   - framesSpent
                            )
                        ) {
                            result.push(childFullPath);
                        }

                        var moveDurationData = NodeFactory.getMoveDurationData(child);

                        // FIXME: use followup information instead of ignoring recovery
                        // Check for possible direct followups
                        var framesSpentWithoutRecovery = framesSpent + moveDurationData.withoutRecovery;
                        if (framesSpentWithoutRecovery < frameToBeActiveOnEnd) {
                            keepLooking(childFullPath, framesSpentWithoutRecovery, undefined);
                        }

                        // Check for possible followups after free cancel or end of string
                        var framesSpentTotal = framesSpent + moveDurationData.total;
                        if (framesSpentTotal < frameToBeActiveOnEnd) {
                            var fullPathHistory = childFullPath.concat(rootNodeData);
                            keepLooking(fullPathHistory, framesSpentTotal, child.endsWith);
                        }
                    } else {
                        var relPath = childFullPath;
                        var restartIndex = childFullPath.lastIndexOf(rootNodeData);
                        if (restartIndex > 0) {
                            relPath = relPath.slice(restartIndex + 1);
                        }
                        warn(pathHistoryToString(relPath) + ' has no frameData');
                    }
                }

                else

                if (NodeFactory.isStanceNode(child) && doesStanceQualify(child, stance)) {
                    if (child.appliesExtraFrame === undefined) {
                        warn('stance ' + NodeFactory.toString(child) + ' has no appliesExtraFrame');
                    } else 
                    if (child.appliesExtraFrame) framesSpent += 1;
                    keepLooking(childFullPath, framesSpent, undefined);
                }

            });

            return result;

            function keepLooking(pathHistory, framesSpent, currentStance) {
                result = result.concat(doFindNodes(
                    rootNodeData,
                    frameToBeActiveOnStart,
                    frameToBeActiveOnEnd,
                    doesNodeDataQualify,
                    optWarnings,
                    pathHistory,
                    framesSpent,
                    currentStance
                ));
            }

            function warn(message) {
                if (_.isObject(optWarnings)) {
                    optWarnings[message] = true;
                }
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