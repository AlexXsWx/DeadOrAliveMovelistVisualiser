define(

    'View/NodeView',

    [
        'Analysis/Parser', 'Analysis/Operators',
        'Model/NodeFactory',
        'Model/NodeFactoryMove',
        'Model/NodeFactoryActionStepResult',
        'Model/CommonStances',
        'Tools/TreeTools', 'Tools/Tools'
    ],

    function NodeView(
        Parser, Operators,
        NodeFactory,
        NodeFactoryMove,
        NodeFactoryActionStepResult,
        CommonStances,
        TreeTools, _
    ) {

        var SORTING_ORDER = {
            DEFAULT: sortByDefault,
            SPEED: sortBySpeed,
            DAMAGE: sortByDamage,
            ADVANTAGE_ON_BLOCK: sortByAdvantageOnBlock,
            ADVANTAGE_ON_NEUTRAL_HIT: sortByAdvantageOnNeutralHit,
            ADVANTAGE_ON_COUNTER_HIT: sortByAdvantageOnCounterHit,
        };

        var currentSortFunc = SORTING_ORDER.DEFAULT;

        return {

            text: {
                getName:   getName,
                getEnding: getEnding,
                getToggle: getToggle
            },

            SORTING_ORDER: SORTING_ORDER,
            sortsByDefault: sortsByDefault,
            setSortingOrder: setSortingOrder,
            createCustomSortingOrder: createCustomSortingOrder,

            createViewFromData: createViewFromData,

            resetAppearance:  resetAppearance,
            updateAppearance: updateAppearance,
            getBranchesAfter: getBranchesAfter,

            ungroup: ungroup,
            groupByType: groupByType,
            groupByTypeSC6: groupByTypeSC6,
            hideHiddenByDefault: hideHiddenByDefault,

            getNodeData: getNodeData,
            getParentNodeView: getParentNodeView,
            findAncestorNodeData: findAncestorNodeData,
            getAdjacentVisibleNodeDatas: getAdjacentVisibleNodeDatas,

            setIsPlaceholder:   setIsPlaceholder,
            isPlaceholder:      isPlaceholder,
            isGroupingNodeView: isGroupingNodeView,
            isRootNodeView:     isRootNodeView,

            addChild:    addChild,
            removeChild: removeChild,

            getAllChildren:     getAllChildren,
            getVisibleChildren: getVisibleChildren,

            hasAnyChildren:    hasAnyChildren,
            hasHiddenChildren: hasHiddenChildren,

            showChild:             showChild,
            showAllChildren:       showAllChildren,
            hideAllChildren:       hideAllChildren,
            toggleVisibleChildren: toggleVisibleChildren,
            toggleGivenChildren:   toggleGivenChildren,

            sortVisibleChildren: sortVisibleChildren
        };


        function createNodeView(optParentNodeView) {

            return {

                // Do not reference directly - use getter for whatever you need
                treeInfo: {
                    /** NodeView */
                    parent: optParentNodeView || null,
                    children: {
                        /** Array<NodeView> */
                        visible: [], // FIXME: unique arrays?
                        /** Array<NodeView> */
                        hidden:  [],
                        lazy: false
                    }
                },

                // Do not reference directly - use getter for whatever you need
                appearance: {
                    totalChildren: 0,
                    deepness:      0,
                    branchesAfter: 0
                },

                // Do not reference directly - use getter for whatever you need
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


        function createViewFromData(
            nodeData,
            optVisitedNodeDatasTracker,
            optParentNodeView,
            optForceVisible
        ) {
            var visitedTracker = optVisitedNodeDatasTracker || TreeTools.createVisitedTracker();

            var nodeView = wrapNodeDataInNewNodeView(
                nodeData,
                optParentNodeView && getNodeData(optParentNodeView)
            );

            if (optParentNodeView) {
                addChild(optParentNodeView, nodeView, optForceVisible);
            }

            return nodeView;

            function wrapNodeDataInNewNodeView(nodeData, optParentNodeData) {
                var nodeView = createNodeView();
                var goLazy = false;
                if (visitedTracker.isNotVisited(nodeData)) {
                    visitedTracker.markVisited(nodeData);
                    var children = NodeFactory.getChildren(nodeData);
                    if (_.isNonEmptyArray(children)) {
                        if (children.every(visitedTracker.isVisited)) {
                            goLazy = true;
                        } else {
                            setChildren(
                                nodeView,
                                children.map(function(childNodeData) {
                                    return wrapNodeDataInNewNodeView(childNodeData, nodeData);
                                })
                            );
                        }
                    }
                } else {
                    goLazy = true;
                }

                if (goLazy) {
                    console.assert(
                        NodeFactoryMove.isMoveNode(nodeData),
                        "Only move nodes are supported to be lazy"
                    );
                    console.assert(
                        optParentNodeData && NodeFactoryMove.isMoveNode(optParentNodeData),
                        "Only children of move nodes are supported to be lazy"
                    );
                    nodeView.treeInfo.children.lazy = true;
                }

                setNodeData(nodeView, nodeData);
                return nodeView;
            }
        }


        // ==== Appearance ====

            function resetAppearance(nodeView) {
                var appearance = nodeView.appearance;
                appearance.totalChildren = 0;
                appearance.deepness      = 0;
                appearance.branchesAfter = 0;
            }


            function updateAppearance(nodeView) {
                var parentAppearance = getParentNodeView(nodeView).appearance;
                parentAppearance.branchesAfter += Math.max(1, nodeView.appearance.branchesAfter);
                parentAppearance.totalChildren += 1 + getAllChildrenCount(nodeView);
                parentAppearance.deepness = Math.max(
                    parentAppearance.deepness,
                    nodeView.appearance.deepness + 1
                );
            }

            function getBranchesAfter(nodeView) {
                return nodeView.appearance.branchesAfter;
            }

        // ====================

        function ungroup(stanceNodeView) {
            var childrenToMove = {
                visible: [],
                hidden: []
            };
            getGroupingChildren(stanceNodeView).forEach(function(nodeView) {
                if (getIsHidden(nodeView)) {
                    childrenToMove.hidden = childrenToMove.hidden.concat(getAllChildren(nodeView));
                } else {
                    childrenToMove.visible = childrenToMove.visible.concat(getVisibleChildren(nodeView));
                    childrenToMove.hidden  = childrenToMove.hidden.concat(getHiddenChildren(nodeView));
                }
                removeChild(stanceNodeView, nodeView);
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


        function groupBy(stanceNodeView, obj) {

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

                var nodeViews = getEntry(getNodeData(childNodeView)).nodeViews;
                (visible ? nodeViews.visible : nodeViews.hidden).push(childNodeView);
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
                if (
                    entry.nodeViews.visible.length === 0 &&
                    entry.nodeViews.hidden.length === 0
                ) {
                    return;
                }

                var groupingChild = createNodeView();
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


        function groupByType(rootNodeView) {
            getAllChildren(rootNodeView).forEach(function(stanceNodeView) {
                groupBy(
                    stanceNodeView,
                    [
                        { name: 'punches', func: NodeFactoryMove.isMovePunch },
                        { name: 'kicks',   func: NodeFactoryMove.isMoveKick  },
                        { name: 'throws',  func: NodeFactoryMove.isMoveThrow, hideByDefault: true },
                        { name: 'holds',   func: NodeFactoryMove.isMoveHold,  hideByDefault: true },
                        { name: 'other' }
                    ]
                );
            });
        }


        function groupByTypeSC6(rootNodeView) {
            getAllChildren(rootNodeView).forEach(function(stanceNodeView) {
                groupBy(
                    stanceNodeView,
                    [
                        { name: 'horizontal',    func: NodeFactoryMove.isMoveHorizontal },
                        { name: 'vertical',      func: NodeFactoryMove.isMoveVertical   },
                        { name: 'throws',        func: NodeFactoryMove.isMoveThrow, hideByDefault: true },
                        { name: 'guard impacts', func: NodeFactoryMove.isMoveHold },
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
                    var groupViews = getGroupingChildren(stanceView);
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
            var result = nodeData && NodeFactoryMove.isMoveNode(nodeData) && nodeData.endsWith;
            return result || null;
        }

        function getToggle(nodeView) {

            var CHARS = {
                EXPAND:   '+',
                HIDE:     String.fromCharCode(0x2212), // minus sign
                MIXED:    String.fromCharCode(0x00D7), // cross sign
            };

            var hasVisible = hasVisibleChildren(nodeView);
            var hasHidden  = hasHiddenChildren(nodeView);

            if (!hasVisible && !hasHidden) return '';

            var str;
            if (hasVisible === hasHidden) {
                str = CHARS.MIXED;
            } else {
                str = hasVisible ? CHARS.HIDE : CHARS.EXPAND;
            }

            return str;

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

        function isRootNodeView(nodeView) {
            return !getParentNodeView(nodeView);
        }


        // ==== Children ====

            /** Does not update `parent` of children it dumps away */
            function setChildren(nodeView, newChildren, optNewHiddenChildren) {
                nodeView.treeInfo.children.visible = newChildren;
                nodeView.treeInfo.children.hidden = optNewHiddenChildren || [];
                nodeView.treeInfo.children.lazy = false;
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


            // WARNING: doesn't include "lazy" children
            function getAllChildren(nodeView) {
                return getVisibleChildren(nodeView).concat(getHiddenChildren(nodeView));
            }

            function getGroupingChildren(stanceNodeView) {
                return getAllChildren(stanceNodeView).filter(isGroupingNodeView);
            }

            function getAllChildrenCount(nodeView) {
                return (
                    getVisibleChildren(nodeView).length +
                    getHiddenChildren(nodeView).length +
                    getLazyChildrenCount(nodeView)
                );
            }

            function getLazyChildren(nodeView) {
                if (!nodeView.treeInfo.children.lazy) return [];
                var childrenNodeDatas = NodeFactory.getChildren(getNodeData(nodeView));
                var visibleChildren = getVisibleChildren(nodeView);
                var hiddenChildren  = getHiddenChildren(nodeView);
                return childrenNodeDatas.filter(function(nodeData) {
                    return (
                        visibleChildren.every(isNotThisNodeData) &&
                        hiddenChildren.every(isNotThisNodeData)
                    );
                    function isNotThisNodeData(childNodeView) {
                        return getNodeData(childNodeView) !== nodeData;
                    }
                });
            }

            function getLazyChildrenCount(nodeView) {
                return getLazyChildren(nodeView).length;
            }

            function getVisibleChildren(nodeView) {
                return nodeView.treeInfo.children.visible;
            }

            // WARNING: doesn't include "lazy" children
            function getHiddenChildren(nodeView) {
                return nodeView.treeInfo.children.hidden;
            }


            function hasAnyChildren(nodeView) {
                return (
                    hasVisibleChildren(nodeView) ||
                    hasHiddenChildren(nodeView)
                );
            }

            function hasVisibleChildren(nodeView) {
                return getVisibleChildren(nodeView).length > 0;
            }

            function hasHiddenChildren(nodeView, optExcludeLazy) {
                return (
                    getHiddenChildren(nodeView).length > 0 ||
                    !optExcludeLazy && getLazyChildrenCount(nodeView) > 0
                );
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

            function createCustomSortingOrder(queryStr) {
                var result = Parser.parse(queryStr);
                if (result.type !== Operators.Type3.Integer) {
                    return sortByDefault;
                }
                return sort;
                function runQuery(nodeData) {
                    return result.getValue({ nodeData: nodeData });
                }
                function sort(nodeView) {
                    sortHelper(nodeView, function(rest) {
                        return _.take(rest, function(nodeView) {
                            var nodeData = getNodeData(nodeView);
                            return nodeData && isValidNumber(runQuery(nodeData));
                        }).sort(function(nodeViewA, nodeViewB) {
                            return _.sortFuncAscending(
                                runQuery(getNodeData(nodeViewA)),
                                runQuery(getNodeData(nodeViewB))
                            );
                        });
                    });
                    function isValidNumber(obj) {
                        return typeof obj === 'number' && !isNaN(obj);
                    }
                }
            }

            function sortBySpeed(nodeView) {
                sortHelper(nodeView, function(rest) {
                    return _.take(rest, function(nodeView) {
                        var nodeData = getNodeData(nodeView);
                        return (
                            nodeData &&
                            NodeFactoryMove.isMoveNode(nodeData) &&
                            NodeFactoryMove.hasFrameData(nodeData)
                        );
                    }).sort(function(nodeViewA, nodeViewB) {
                        return _.sortFuncAscending(
                            NodeFactoryMove.getStartupFramesCount(getNodeData(nodeViewA)),
                            NodeFactoryMove.getStartupFramesCount(getNodeData(nodeViewB))
                        );
                    });
                });
            }

            function sortByDamage(nodeView) {
                sortHelper(nodeView, function(rest) {
                    return _.take(rest, function(nodeView) {
                        var nodeData = getNodeData(nodeView);
                        return (
                            nodeData &&
                            NodeFactoryMove.isMoveNode(nodeData) &&
                            NodeFactoryMove.hasFrameData(nodeData)
                        );
                    }).sort(function(nodeViewA, nodeViewB) {
                        return _.sortFuncAscending(
                            NodeFactoryMove.getDamage(getNodeData(nodeViewB)),
                            NodeFactoryMove.getDamage(getNodeData(nodeViewA))
                        );
                    });
                });
            }

            function sortByAdvantage(nodeView, getAdvantageRangeFunc) {
                sortHelper(nodeView, function(rest) {
                    return _.take(rest, function(nodeView) {
                        var nodeData = getNodeData(nodeView);
                        if (!nodeData || !NodeFactoryMove.isMoveNode(nodeData)) return false;
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
                    return NodeFactoryMove.getAdvantageRange(
                        nodeData,
                        NodeFactoryActionStepResult.getHitBlock,
                        NodeFactoryActionStepResult.doesDescribeGuard
                    );
                });
            }

            function sortByAdvantageOnNeutralHit(nodeView) {
                sortByAdvantage(nodeView, function(nodeData) {
                    return NodeFactoryMove.getAdvantageRange(
                        nodeData,
                        NodeFactoryActionStepResult.getHitBlock,
                        NodeFactoryActionStepResult.doesDescribeNeutralHit
                    );
                });
            }

            function sortByAdvantageOnCounterHit(nodeView) {
                sortByAdvantage(nodeView, function(nodeData) {
                    return NodeFactoryMove.getAdvantageRange(
                        nodeData,
                        NodeFactoryActionStepResult.getHitBlock,
                        NodeFactoryActionStepResult.doesDescribeCounterHit
                    );
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

            function showAllChildren(nodeView, optReturnIDs, optDontSort) {
                var children = nodeView.treeInfo.children;
                var result;
                if (optReturnIDs) {
                    result = children.hidden.slice();
                }
                children.visible = children.visible.concat(children.hidden);
                children.hidden = [];
                if (!optDontSort) {
                    sortVisibleChildren(nodeView);
                }
                return result;
            }

            function hideAllChildren(nodeView, optReturnIDs) {
                var children = nodeView.treeInfo.children;
                var result;
                if (optReturnIDs) {
                    result = children.visible.slice();
                }
                children.hidden = children.hidden.concat(children.visible);
                children.visible = [];
                return result;
            }

            function createAndShowLazyAndHiddenChildren(nodeView) {

                var nodeViews = showAllChildren(nodeView, true, true);

                var visitedTracker = TreeTools.createVisitedTracker();
                var newNodeViews = getLazyChildren(nodeView).map(function(childNodeData) {
                    return createViewFromData(childNodeData, visitedTracker, nodeView, true);
                });
                nodeViews = nodeViews.concat(newNodeViews);

                sortVisibleChildren(nodeView);

                return nodeViews;
            }

            function toggleVisibleChildren(nodeView) {
                if (getLazyChildrenCount(nodeView) > 0) {
                    return createAndShowLazyAndHiddenChildren(nodeView);
                } else
                if (hasHiddenChildren(nodeView, true)) {
                    return showAllChildren(nodeView, true);
                } else {
                    return hideAllChildren(nodeView, true);
                }
            }

            function toggleGivenChildren(nodeView, nodeViewsToToggle) {
                var children = nodeView.treeInfo.children;

                var childrenToShow = take(children.hidden,  nodeViewsToToggle);
                var childrenToHide = take(children.visible, nodeViewsToToggle);
                children.visible = children.visible.concat(childrenToShow);
                children.hidden  = children.hidden.concat(childrenToHide);
                if (childrenToShow.length > 0) {
                    sortVisibleChildren(nodeView);
                }
                return childrenToShow.length > 0 || childrenToHide.length > 0;
                function take(nodeViews, nodeViewsToToggle) {
                    return _.take(nodeViews, function(nodeView) {
                        return _.contains(nodeViewsToToggle, nodeView);
                    });
                }
            }

        // ==================
    }
);
