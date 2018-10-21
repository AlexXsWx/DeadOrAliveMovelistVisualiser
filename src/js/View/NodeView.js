define(

    'View/NodeView',

    [ 'Model/NodeFactory', 'Tools/TreeTools', 'Model/CommonStances', 'Tools/Tools' ],

    function NodeView(NodeFactory, TreeTools, CommonStances, _) {

        return {

            createNodeViewGenerator: createNodeViewGenerator,

            createViewFromData: createViewFromData,

            groupByType: groupByType,
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
                        visible: [],
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
                    groupName: undefined // string
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


        function groupByType(rootNodeView, nodeViewGenerator) {

            var allChildrenNodeViews = getAllChildren(rootNodeView);

            // fill groups

            var byType = {
                // 'punches': [],
                // 'kicks':   [],
                'horizontal': [],
                'vertical':   [],
                'throws':  [],
                'holds':   [],
                'other':   []
            };

            for (var i = 0; i < allChildrenNodeViews.length; ++i) {

                var childNodeView = allChildrenNodeViews[i];

                // If it is a group already, kill it but keep its children
                if (isGroupingNodeView(childNodeView)) {
                    allChildrenNodeViews = allChildrenNodeViews.concat(
                        getAllChildren(childNodeView)
                    );
                    removeChild(rootNodeView, childNodeView);
                    continue;
                }

                var type;
                var nodeData = getNodeData(childNodeView);
                switch(true) {
                    // case NodeFactory.isMovePunch(nodeData): type = 'punches'; break;
                    // case NodeFactory.isMoveKick(nodeData):  type = 'kicks';   break;
                    case NodeFactory.isMoveHorizontal(nodeData): type = 'horizontal'; break;
                    case NodeFactory.isMoveVertical(nodeData):   type = 'vertical';   break;
                    case NodeFactory.isMoveThrow(nodeData): type = 'throws';  break;
                    case NodeFactory.isMoveHold(nodeData):  type = 'holds';   break;
                    default: type = 'other';
                }

                byType[type].push(childNodeView);
                removeChild(rootNodeView, childNodeView);

            }

            // assign new children

            // removeAllChildren(rootNodeView);

            for (type in byType) {

                var childrenOfType = byType[type];
                if (childrenOfType.length < 1) continue;

                var groupingChild = nodeViewGenerator();
                groupingChild.binding.groupName = '<' + type + '>';
                setChildren(groupingChild, childrenOfType);

                addVisibleChild(rootNodeView, groupingChild);

            }

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
                        if (!groupView.binding.groupName) continue;
                        // FIXME: this will break with localization
                        if (groupView.binding.groupName.search(/throws|holds/i) >= 0) {
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
            return nodeData ? NodeFactory.toString(nodeData) : nodeView.binding.groupName;
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
            return !getNodeData(nodeView);
        }


        // ==== Children ====

            /** Does not update `parent` of children it dumps away */
            function setChildren(nodeView, newChildren) {

                nodeView.treeInfo.children.visible = newChildren;
                nodeView.treeInfo.children.hidden = [];

                newChildren.forEach(function(child) {
                    child.treeInfo.parent = nodeView;
                });

            }

            function addVisibleChild(nodeView, child) {
                child.treeInfo.parent = nodeView;
                var children = nodeView.treeInfo.children;
                children.visible.push(child);
            }

            function addHiddenChild(nodeView, child) {
                child.treeInfo.parent = nodeView;
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
                    // FIXME: append at correct index, in accordance to bound nodeData
                    children.visible = children.visible.concat(
                        children.hidden.splice(index, 1)
                    );
                }
            }

            function showAllChildren(nodeView) {
                var children = nodeView.treeInfo.children;
                // FIXME: append at correct index, in accordance to bound nodeData
                children.visible = children.visible.concat(children.hidden);
                children.hidden = [];
            }

            function hideAllChildren(nodeView, optReturnIDsBecomeHidden) {
                var children = nodeView.treeInfo.children;
                children.hidden = children.hidden.concat(children.visible);
                children.visible = [];
                if (optReturnIDsBecomeHidden) {
                    _.report('optReturnIDsBecomeHidden is not implemented for hideAllChildren');
                }
            }

            function toggleVisibleChildren(nodeView, optReturnIDsBecomeHidden) {

                if (hasVisibleChildren(nodeView)) {
                    return hideAllChildren(nodeView, optReturnIDsBecomeHidden);
                }

                var children = nodeView.treeInfo.children;
                var temp = children.hidden;
                children.hidden = children.visible; // FIXME: unique arrays?
                // FIXME: sort in accordance to bound nodeData
                children.visible = temp;

                if (!optReturnIDsBecomeHidden) return;

                var idsBecomeHidden = [];
                children.hidden.forEach(function(nodeView) {
                    TreeTools.forAllCurrentChildren(
                        nodeView,
                        getVisibleChildren,
                        function(nodeView) {
                            idsBecomeHidden.push(nodeView.treeInfo.id);
                        }
                    );
                });

                return idsBecomeHidden;

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
                            input: getName(nodeView),
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
                return getId(nodeView) + '#' + getName(nodeView);
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
