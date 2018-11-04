define(

    'View/NodeView',

    [ 'Model/NodeFactory', 'Tools/TreeTools', 'Model/CommonStances', 'Tools/Tools' ],

    function NodeView(NodeFactory, TreeTools, CommonStances, _) {

        var SORTING_ORDER = {
            DEFAULT: sortByDefault,
            SPEED: sortBySpeed,
            ADVANTAGE_ON_BLOCK: sortByAdvantageOnBlock,
            ADVANTAGE_ON_NEUTRAL_HIT: sortByAdvantageOnNeutralHit,
            ADVANTAGE_ON_COUNTER_HIT: sortByAdvantageOnCounterHit,
        };

        var currentSortFunc = SORTING_ORDER.DEFAULT;

        return {

            SORTING_ORDER: SORTING_ORDER,
            sortsByDefault: sortsByDefault,
            setSortingOrder: setSortingOrder,

            createNodeViewGenerator: createNodeViewGenerator,

            createViewFromData: createViewFromData,

            ungroup: ungroup,
            groupByType: groupByType,
            groupByTypeSC6: groupByTypeSC6,
            hideHiddenByDefault: hideHiddenByDefault,

            setNodeData: setNodeData,
            getNodeData: getNodeData,
            getParentNodeView: getParentNodeView,
            findAncestorNodeData: findAncestorNodeData,
            getAdjacentVisibleNodeDatas: getAdjacentVisibleNodeDatas,

            getId: getId,
            getName: getName,
            getEnding: getEnding,
            setIsPlaceholder:   setIsPlaceholder,
            isPlaceholder:      isPlaceholder,
            isGroupingNodeView: isGroupingNodeView,

            addChild: addChild,
            removeChild:       removeChild,
            removeAllChildren: removeAllChildren,

            getAllChildren:     getAllChildren,
            getVisibleChildren: getVisibleChildren,
            getHiddenChildren:  getHiddenChildren,

            hasAnyChildren:     hasAnyChildren,
            hasVisibleChildren: hasVisibleChildren,
            hasHiddenChildren:  hasHiddenChildren,

            showChild:             showChild,
            showAllChildren:       showAllChildren,
            hideAllChildren:       hideAllChildren,
            toggleVisibleChildren: toggleVisibleChildren,
            toggleChildrenWithIds: toggleChildrenWithIds,

            sortVisibleChildren: sortVisibleChildren,

            debugLogNodeView: debugLogNodeView

            // fillScrollRange: fillScrollRange,
            // resetScrollRange: resetScrollRange

        };


        function createNodeView(id, parentNodeView) {

            return {

                // Do not reference directly - use getter for whatever you need
                treeInfo: {
                    id: id,
                    /** NodeView */
                    parent: parentNodeView || null,
                    children: {
                        /** Array<NodeView> */
                        visible: [], // FIXME: unique arrays?
                        /** Array<NodeView> */
                        hidden:  []
                    }
                },

                appearance: {
                    // scrollRange: {
                    //     from: undefined,
                    //     to:   undefined
                    // }
                    totalChildren: 0,
                    deepness:      0,
                    branchesAfter: 0
                },

                binding: {
                    isPlaceholder: undefined, // bool
                    targetNodeData: null,
                    group: {
                        name: undefined, // string
                        hideByDefault: undefined, // boolean
                        order: undefined // number
                    }
                }

            };

        }


        function createNodeViewGenerator() {
            var counter = 0;
            return function generate(parentNodeView) {
                return createNodeView(counter++, parentNodeView || null);
            };
        }


        function createViewFromData(dataRoot, nodeViewGenerator) {

            var wrappedDataRoot = nodeViewGenerator();
            setChildren(wrappedDataRoot, dataRoot.stances.map(wrapStance));
            setNodeData(wrappedDataRoot, dataRoot);

            // TODO: fill classes and other cached info

            return wrappedDataRoot;


            function wrapStance(stance) {
                var stanceNode = nodeViewGenerator();
                setChildren(stanceNode, stance.moves.map(wrapMove));
                setNodeData(stanceNode, stance);
                return stanceNode;
            }


            function wrapMove(move) {
                var moveNode = nodeViewGenerator();
                if (_.isNonEmptyArray(move.followUps)) {
                    setChildren(moveNode, move.followUps.map(wrapMove));
                }
                setNodeData(moveNode, move);
                return moveNode;
            }

        }

        function ungroup(stanceNodeView) {
            var childrenToMove = {
                visible: [],
                hidden: []
            };
            getAllChildren(stanceNodeView).forEach(function(nodeView) {
                if (isGroupingNodeView(nodeView)) {
                    if (getIsHidden(nodeView)) {
                        childrenToMove.hidden = childrenToMove.hidden.concat(getAllChildren(nodeView));
                    } else {
                        childrenToMove.visible = childrenToMove.visible.concat(getVisibleChildren(nodeView));
                        childrenToMove.hidden  = childrenToMove.hidden.concat(getHiddenChildren(nodeView));
                    }
                    removeChild(stanceNodeView, nodeView);
                }
            });

            var children = stanceNodeView.treeInfo.children;
            children.visible = children.visible.concat(childrenToMove.visible);
            children.hidden  = children.hidden.concat(childrenToMove.hidden);
            childrenToMove.visible.concat(childrenToMove.hidden).forEach(function(childNodeView) {
                setParentNodeView(childNodeView, stanceNodeView);
            });

            if (childrenToMove.visible.length > 0) {
                sortVisibleChildren(stanceNodeView);
            }
        }

        function getIsHidden(nodeView) {
            var nodeViewI = nodeView;
            while (getParentNodeView(nodeViewI)) {
                var parentNodeView = getParentNodeView(nodeViewI);
                if (getHiddenChildren(parentNodeView).indexOf(nodeViewI) >= 0) return true;
                nodeViewI = parentNodeView;
            }
            return false;
        }


        function groupBy(stanceNodeView, nodeViewGenerator, obj) {

            var stanceWasCollapsed = !hasVisibleChildren(stanceNodeView);

            var obj2 = obj.map(function(entry) {
                return {
                    name: entry.name,
                    func: entry.func,
                    hideByDefault: entry.hideByDefault,
                    nodeViews: {
                        visible: [],
                        hidden: []
                    }
                };
            });

            var allChildrenNodeViews = getAllChildren(stanceNodeView);
            var visibles = new Array(allChildrenNodeViews.length);
            for (var i = 0; i < allChildrenNodeViews.length; ++i) {

                var childNodeView = allChildrenNodeViews[i];

                var visible = _.defined(visibles[i], !getIsHidden(childNodeView));

                // If it is a group already, kill it but keep its children
                if (isGroupingNodeView(childNodeView)) {
                    var childrenOfGroup = getAllChildren(childNodeView);
                    allChildrenNodeViews = allChildrenNodeViews.concat(childrenOfGroup);
                    childrenOfGroup.forEach(function(childNodeView) {
                        visibles.push(!getIsHidden(childNodeView));
                    });
                    removeChild(stanceNodeView, childNodeView);
                    continue;
                }

                if (visible) {
                    getEntry(getNodeData(childNodeView)).nodeViews.visible.push(childNodeView);
                } else {
                    getEntry(getNodeData(childNodeView)).nodeViews.hidden.push(childNodeView);
                }
                removeChild(stanceNodeView, childNodeView);

                function getEntry(nodeData) {
                    var fallbackEntry;
                    for (var i = 0; i < obj2.length; ++i) {
                        var entry = obj2[i];
                        if (entry.func) {
                            if (entry.func(nodeData)) {
                                return entry;
                            }
                        } else {
                            fallbackEntry = entry;
                        }
                    }
                    var noInputFollowup = NodeFactory.getNoInputFollowup(nodeData);
                    if (noInputFollowup) {
                        return getEntry(noInputFollowup);
                    }
                    return fallbackEntry;
                }

            }

            // assign new children

            // removeAllChildren(stanceNodeView);

            var stanceGotNewVisibleNodes = false;
            obj2.forEach(function(entry, index) {
                if (entry.nodeViews.visible.length + entry.nodeViews.hidden.length < 1) return;

                var groupingChild = nodeViewGenerator();
                groupingChild.binding.group.name = entry.name;
                groupingChild.binding.group.hideByDefault = entry.hideByDefault;
                groupingChild.binding.group.order = index;
                setChildren(groupingChild, entry.nodeViews.visible, entry.nodeViews.hidden);

                if (stanceWasCollapsed) {
                    addHiddenChild(stanceNodeView, groupingChild);
                } else {
                    addVisibleChild(stanceNodeView, groupingChild);
                    stanceGotNewVisibleNodes = true;
                }
                if (entry.nodeViews.visible.length > 0) {
                    sortVisibleChildren(groupingChild);
                }
            });

            if (stanceGotNewVisibleNodes) {
                sortVisibleChildren(stanceNodeView);
            }

        }


        function groupByType(rootNodeView, nodeViewGenerator) {
            getAllChildren(rootNodeView).forEach(function(stanceNodeView) {
                groupBy(
                    stanceNodeView,
                    nodeViewGenerator,
                    [
                        { name: 'punches', func: NodeFactory.isMovePunch },
                        { name: 'kicks',   func: NodeFactory.isMoveKick  },
                        { name: 'throws',  func: NodeFactory.isMoveThrow, hideByDefault: true },
                        { name: 'holds',   func: NodeFactory.isMoveHold,  hideByDefault: true },
                        { name: 'other' }
                    ]
                );
            });
        }


        function groupByTypeSC6(rootNodeView, nodeViewGenerator) {
            getAllChildren(rootNodeView).forEach(function(stanceNodeView) {
                groupBy(
                    stanceNodeView,
                    nodeViewGenerator,
                    [
                        { name: 'horizontal',    func: NodeFactory.isMoveHorizontal },
                        { name: 'vertical',      func: NodeFactory.isMoveVertical   },
                        { name: 'throws',        func: NodeFactory.isMoveThrow, hideByDefault: true },
                        { name: 'guard impacts', func: NodeFactory.isMoveHold },
                        { name: 'other' }
                    ]
                );
            });
        }


        function hideHiddenByDefault(rootNodeView) {
            var stanceViews = getAllChildren(rootNodeView);
            for (var i = 0; i < stanceViews.length; ++i) {
                var stanceView = stanceViews[i];
                var nodeData = stanceView.binding.targetNodeData;
                if (!nodeData) continue;
                if (
                    nodeData.abbreviation === CommonStances.Sidestepping ||
                    nodeData.abbreviation === CommonStances.Grounded
                ) {
                    hideAllChildren(stanceView);
                } else
                if (nodeData.abbreviation === CommonStances.Standing) {
                    var groupViews = getAllChildren(stanceView);
                    for (var j = 0; j < groupViews.length; ++j) {
                        var groupView = groupViews[j];
                        if (groupView.binding.group.hideByDefault) {
                            hideAllChildren(groupView);
                        }
                    }
                }
            }
        }


        function setNodeData(nodeView, nodeData) {
            nodeView.binding.targetNodeData = nodeData;
        }

        function getNodeData(nodeView) {
            return nodeView.binding.targetNodeData;
        }

        /** Can return grouping node views as well */
        function getParentNodeView(nodeView) {
            return nodeView.treeInfo.parent || null;
        }

        /** Can return grouping node views as well */
        function setParentNodeView(nodeView, newParentNodeView) {
            return nodeView.treeInfo.parent = newParentNodeView;
        }

        /** Skip ancestors that don't have bound data (grouping nodes view and alike) */
        function findAncestorNodeData(nodeView) {
            var parentNodeView = nodeView;
            var result = null;
            while (parentNodeView && !result) {
                var parentNodeView = getParentNodeView(parentNodeView);
                result = getNodeData(parentNodeView) || null;
            }
            return result;
        }

        function getAdjacentVisibleNodeDatas(nodeView) {
            var previous = null;
            var next     = null;

            var parentNodeView = getParentNodeView(nodeView);
            var visibleChildren = getVisibleChildren(parentNodeView);
            var ownIndex = visibleChildren.indexOf(nodeView);
            if (ownIndex !== -1) {
                if (ownIndex > 0) {
                    previous = getNodeData(visibleChildren[ownIndex - 1]);
                }
                if (ownIndex <= visibleChildren.length - 2) {
                    next = getNodeData(visibleChildren[ownIndex + 1]);
                }
            }

            return {
                previous: previous,
                next: next
            };
        }


        function getId(nodeView) {
            return nodeView.treeInfo.id;
        }

        function getName(nodeView) {
            var nodeData = getNodeData(nodeView);
            if (nodeData) {
                return {
                    raw:  NodeFactory.toString(nodeData),
                    rich: NodeFactory.toRichString(nodeData)
                };
            } else {
                return {
                    raw:  nodeView.binding.group.name,
                    rich: [
                        { text: '<',                         className: 'lightgray' },
                        { text: nodeView.binding.group.name, className: 'gray'      },
                        { text: '>',                         className: 'lightgray' }
                    ]
                };
            }
        }

        function getEnding(nodeView) {
            var nodeData = getNodeData(nodeView);
            var result = nodeData && NodeFactory.isMoveNode(nodeData) && nodeData.endsWith;
            return result || null;
        }

        function setIsPlaceholder(nodeView, isPlaceholder) {
            nodeView.binding.isPlaceholder = isPlaceholder;
        }

        function isPlaceholder(nodeView) {
            return nodeView.binding.isPlaceholder;
        }

        function isGroupingNodeView(nodeView) {
            // FIXME: how does this work with placeholders?
            return !getNodeData(nodeView);
        }


        // ==== Children ====

            /** Does not update `parent` of children it dumps away */
            function setChildren(nodeView, newChildren, optNewHiddenChildren) {
                nodeView.treeInfo.children.visible = newChildren;
                nodeView.treeInfo.children.hidden = optNewHiddenChildren || [];
                getAllChildren(nodeView).forEach(function(child) {
                    setParentNodeView(child, nodeView);
                });
            }

            function addVisibleChild(nodeView, child) {
                setParentNodeView(child, nodeView);
                var children = nodeView.treeInfo.children;
                children.visible.push(child);
            }

            function addHiddenChild(nodeView, child) {
                setParentNodeView(child, nodeView);
                var children = nodeView.treeInfo.children;
                children.hidden.push(child);
            }


            function addChild(nodeView, child, optForceVisible) {
                var children = nodeView.treeInfo.children;
                if (
                    optForceVisible ||
                    children.visible.length > 0 ||
                    children.hidden.length === 0
                ) {
                    addVisibleChild(nodeView, child);
                } else {
                    addHiddenChild(nodeView, child);
                }
            }

            /** Does not update `parent` of its old children */
            function removeChild(parentNodeView, child) {
                var parentChildren = parentNodeView.treeInfo.children;
                [
                    parentChildren.visible,
                    parentChildren.hidden
                ].forEach(function(children) {
                    _.removeElement(children, child);
                });
            }

            /** Does not update `parent` of its old children */
            function removeAllChildren(nodeView) {
                nodeView.treeInfo.children.visible = [];
                nodeView.treeInfo.children.hidden  = [];
            }


            function getAllChildren(nodeView) {
                return getVisibleChildren(nodeView).concat(getHiddenChildren(nodeView));
            }

            function getVisibleChildren(nodeView) {
                return nodeView.treeInfo.children.visible;
            }

            function getHiddenChildren(nodeView) {
                return nodeView.treeInfo.children.hidden;
            }


            function hasAnyChildren(nodeView) {
                return hasVisibleChildren(nodeView) || hasHiddenChildren(nodeView);
            }

            function hasVisibleChildren(nodeView) {
                return getVisibleChildren(nodeView).length > 0;
            }

            function hasHiddenChildren(nodeView) {
                return getHiddenChildren(nodeView).length > 0;
            }


            function showChild(nodeView, childNodeView) {
                var children = nodeView.treeInfo.children;
                var index = children.hidden.indexOf(childNodeView);
                if (index >= 0) {
                    children.visible = children.visible.concat(
                        children.hidden.splice(index, 1)
                    );
                    sortVisibleChildren(nodeView);
                }
            }

            // Sorting

            function sortsByDefault() {
                return currentSortFunc === SORTING_ORDER.DEFAULT;
            }

            /** @param newValue {SORTING_ORDER} */
            function setSortingOrder(newValue) {
                var oldValue = currentSortFunc;
                currentSortFunc = newValue;
                if (oldValue !== newValue) {
                    return undo;
                } else {
                    return null;
                }
                function undo() { currentSortFunc = oldValue; }
            }

            function sortVisibleChildren(nodeView) {
                currentSortFunc(nodeView);
            }

            function splitChildrenByType(children) {
                var temp = children.slice(0);

                var groups = _.take(temp, function(nodeView) {
                    // TODO: use isGroupingNodeView?
                    return Boolean(nodeView.binding.group.name);
                });
                var rest = _.take(temp, function(nodeView) {
                    return !nodeView.binding.isPlaceholder;
                });
                var placeholders = temp;

                return {
                    groups:       groups,
                    placeholders: placeholders,
                    rest:         rest
                };
            }

            function sortHelper(nodeView, optSortRest) {
                var children = nodeView.treeInfo.children;
                var byType = splitChildrenByType(children.visible);

                byType.groups.sort(function(nodeViewA, nodeViewB) {
                    return _.sortFuncAscending(
                        nodeViewA.binding.group.order,
                        nodeViewB.binding.group.order
                    );
                });
                var rest = byType.rest;
                var preRest = [];
                if (optSortRest) {
                    preRest = optSortRest(rest);
                }
                rest.sort(function(nodeViewA, nodeViewB) {
                    return compareOrderInData(nodeViewA, nodeViewB) || 0;
                });

                children.visible = (
                    byType.groups
                        .concat(preRest)
                        .concat(rest)
                        .concat(byType.placeholders)
                );
            }

            function sortByDefault(nodeView) {
                sortHelper(nodeView);
            }

            function sortBySpeed(nodeView) {
                sortHelper(nodeView, function(rest) {
                    return _.take(rest, function(nodeView) {
                        var nodeData = getNodeData(nodeView);
                        return (
                            nodeData &&
                            NodeFactory.isMoveNode(nodeData) &&
                            nodeData.frameData &&
                            nodeData.frameData.length > 0
                        );
                    }).sort(function(nodeViewA, nodeViewB) {
                        return _.sortFuncAscending(
                            getNodeData(nodeViewA).frameData[0],
                            getNodeData(nodeViewB).frameData[0]
                        );
                    });
                });
            }

            function sortByAdvantage(nodeView, getAdvantageRangeFunc) {
                sortHelper(nodeView, function(rest) {
                    return _.take(rest, function(nodeView) {
                        var nodeData = getNodeData(nodeView);
                        if (!nodeData || !NodeFactory.isMoveNode(nodeData)) return false;
                        var advantage = getAdvantageRangeFunc(nodeData);
                        return Boolean(advantage);
                    }).sort(function(nodeViewA, nodeViewB) {
                        return -1 * _.sortFuncAscending(
                            getAdvantageRangeFunc(getNodeData(nodeViewA)).min,
                            getAdvantageRangeFunc(getNodeData(nodeViewB)).min
                        );
                    });
                });
            }

            function sortByAdvantageOnBlock(nodeView) {
                sortByAdvantage(nodeView, function(nodeData) {
                    return NodeFactory.getAdvantageRange(
                        nodeData,
                        NodeFactory.doesActionStepResultDescribeGuard,
                        NodeFactory.getActionStepResultHitBlock
                    )
                });
            }

            function sortByAdvantageOnNeutralHit(nodeView) {
                sortByAdvantage(nodeView, function(nodeData) {
                    return NodeFactory.getAdvantageRange(
                        nodeData,
                        NodeFactory.doesActionStepResultDescribeNeutralHit,
                        NodeFactory.getActionStepResultHitBlock
                    )
                });
            }

            function sortByAdvantageOnCounterHit(nodeView) {
                sortByAdvantage(nodeView, function(nodeData) {
                    return NodeFactory.getAdvantageRange(
                        nodeData,
                        NodeFactory.doesActionStepResultDescribeCounterHit,
                        NodeFactory.getActionStepResultHitBlock
                    )
                });
            }

            function compareOrderInData(nodeViewA, nodeViewB) {
                var parentNodeDataA = findAncestorNodeData(nodeViewA);
                var parentNodeDataB = findAncestorNodeData(nodeViewB);
                if (parentNodeDataA !== parentNodeDataB) return undefined;

                var parentNodeData = parentNodeDataA;
                if (!parentNodeData) return undefined;

                var parentNodeDataChildren = NodeFactory.getChildren(parentNodeData);
                var indexA = parentNodeDataChildren.indexOf(getNodeData(nodeViewA));
                var indexB = parentNodeDataChildren.indexOf(getNodeData(nodeViewB));
                if (indexA === -1 || indexB === -1) return undefined;

                return _.sortFuncAscending(indexA, indexB);
            }

            //

            function showAllChildren(nodeView, optReturnIDs) {
                var children = nodeView.treeInfo.children;
                var result;
                if (optReturnIDs) {
                    result = children.hidden.map(getId);
                }
                children.visible = children.visible.concat(children.hidden);
                children.hidden = [];
                sortVisibleChildren(nodeView);
                return result;
            }

            function hideAllChildren(nodeView, optReturnIDs) {
                var children = nodeView.treeInfo.children;
                var result;
                if (optReturnIDs) {
                    result = children.visible.map(getId);
                }
                children.hidden = children.hidden.concat(children.visible);
                children.visible = [];
                return result;
            }

            function toggleVisibleChildren(nodeView, optReturnIDs) {
                if (hasHiddenChildren(nodeView)) {
                    return showAllChildren(nodeView, optReturnIDs);
                } else {
                    return hideAllChildren(nodeView, optReturnIDs);
                }
            }

            function toggleChildrenWithIds(nodeView, ids) {
                var children = nodeView.treeInfo.children;

                var childrenToShow = take(children.hidden,  ids);
                var childrenToHide = take(children.visible, ids);
                children.visible = children.visible.concat(childrenToShow);
                children.hidden  = children.hidden.concat(childrenToHide);
                if (childrenToShow.length > 0) {
                    sortVisibleChildren(nodeView);
                }
                return childrenToShow.length > 0 || childrenToHide.length > 0;
                function take(nodeViews, ids) {
                    return _.take(nodeViews, function(nodeView) {
                        return ids.indexOf(getId(nodeView)) >= 0;
                    });
                }
            }

        // ==================


        // ==== Logging ====

            function debugLogNodeView(nodeView) {

                console.group(nodeView);

                var output = [];

                var nodesAtIteratedDepth = [nodeView];

                do {

                    var nodesAtNextDepth = [];

                    nodesAtIteratedDepth.forEach(function(nodeView) {

                        var parentNodeView = getParentNodeView(nodeView);
                        var visibleChildren = getVisibleChildren(nodeView);
                        var hiddenChildren  = getHiddenChildren(nodeView);

                        output.push({
                            parentNodeView: parentNodeView && getReadableId(parentNodeView),
                            id:    getId(nodeView),
                            input: getName(nodeView).raw,
                            visibleChildren: childReadableIds(visibleChildren),
                            hiddenChildren:  childReadableIds(hiddenChildren),
                            x: nodeView.x,
                            y: nodeView.y,
                            depth: nodeView.depth
                        });

                        Array.prototype.push.apply(
                            nodesAtNextDepth,
                            getAllChildren(nodeView)
                        );

                    });

                    nodesAtIteratedDepth = nodesAtNextDepth;

                } while (nodesAtIteratedDepth.length > 0);

                console.table(output);
                console.groupEnd();

            }

            function getReadableId(nodeView) {
                return getId(nodeView) + '#' + getName(nodeView).raw;
            }

            function childReadableIds(children) {
                return children.map(getReadableId).join(',');
            }

        // =================


        // function resetScrollRange(nodeView) {
        //     nodeView.appearance.scrollRange.from = nodeView.y;
        //     nodeView.appearance.scrollRange.to   = nodeView.y;
        // }

        // function fillScrollRange(data) {

        //     var childrenByDepth = TreeTools.getChildrenMergedByDepth(
        //         data,
        //         getVisibleChildren
        //     );

        //     for (var i = childrenByDepth.length - 1; i > 0; --i) {
        //         var children = childrenByDepth[i];
        //         children.forEach(function(child) {
        //             var parentSr = getParentNodeView(child).appearance.scrollRange;
        //             var childSr = child.appearance.scrollRange;
        //             parentSr.from = Math.min(parentSr.from, child.y); // childSr.from);
        //             parentSr.to   = Math.max(parentSr.to,   child.y); // childSr.to);
        //         });
        //     }

        // }

    }

);
