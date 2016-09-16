define(

    'Filter',

    [ 'NodeFactory'  ],

    function Filter(NodeFactory) {

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
            frameToBeActiveOn,
            doesNodeDataQualify,
            optCurrentStance,
            optCurrentParentPath
        ) {

            var currentParentPath = optCurrentParentPath || [rootNodeData];
            var stance = optCurrentStance || 'STD';

            var result = [];

            var currentParentData = currentParentPath[currentParentPath.length - 1];

            NodeFactory.getChildren(currentParentData).forEach(function(child) {

                var remainingFramesForFreeCancel = -1;
                var remainingFramesForFollowUp = frameToBeActiveOn;
                var childFullPath = currentParentPath.concat(child);
                var keepLooking = true;
                var stanceOnFreeCancel = null;

                if (NodeFactory.isMoveNode(child)) {
                    var frameData = child.frameData;
                    if (frameData && frameData.length > 0) {
                        var frames = 1;
                        // FIXME: this only applies to 1st move in string
                        for (var i = 0; i < frameData.length - 1; i += 2) {
                            frames += frameData[i];
                            var activeFrames = frameData[i + 1];
                            if (frames < frameToBeActive && frameToBeActive <= frames + activeFrames) {
                                if (doesNodeDataQualify(child)) {
                                    result.push(childFullPath);
                                }
                                keepLooking = false;
                            }
                            frames += activeFrames;
                        }
                        remainingFramesForFollowUp = frameToBeActiven - frames;
                        remainingFramesForFreeCancel = remainingFramesForFollowUp - frameData[frameData.length - 1];
                        stanceOnFreeCancel = child.endsWith;
                    } else {
                        keepLooking = false;
                    }
                } else
                if (NodeFactory.isStanceNode(child)) {
                    // FIXME: consider stance's endsWith
                    if (child.abbreviation !== stance) {
                        keepLooking = false;
                    }
                }

                if (keepLooking) {
                    if (remainingFramesForFollowUp > 0) {
                        result = result.concat(
                            findNodes(
                                rootNodeData,
                                remainingFramesForFollowUp,
                                doesNodeDataQualify,
                                null,
                                childFullPath
                            )
                        );
                    }
                    if (remainingFramesForFreeCancel > 0) {
                        result = result.concat(
                            findNodes(
                                rootNodeData,
                                remainingFramesForFreeCancel,
                                doesNodeDataQualify,
                                stanceOnFreeCancel,
                                childFullPath.concat(rootNodeData)
                            )
                        );
                    }
                }

            });

            return filterResultsToString(result);

        }

        function filterResultsToString(results) {
            // FIXME: add comma on free cancel
            return results.filter(
                function(path) { return path.length > 0; }
            ).map(function(path) {
                if (typeof path === 'string') return path;
                return path.filter(
                    function(nodeData) { return NodeFactory.isMoveNode(nodeData); }
                ).map(
                    function(nodeData) { return NodeFactory.toString(nodeData); }
                ).join(' ');
            }).join('\n');
        }

    }

);