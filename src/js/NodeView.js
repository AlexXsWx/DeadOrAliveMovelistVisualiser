define(

    'NodeView',

    ['NodeFactory', 'TreeTools', 'Tools'],

    function NodeView(NodeFactory, TreeTools, _) {

        var RGX = {
            PUNCH: /^\d*p(?:\+k)?$/i,
            KICK:  /(?:h\+)?k$/i,
            HOLD:  /^\d+h$/i,
            THROW: /^\d*t$/i
        };


        return {

            createGenerators: createGenerators,

            createViewFromData: createViewFromData,

            log: log,

            getParentView:     getParentView,
            getParentDataView: getParentDataView,

            setChildren:     setChildren,
            addChild:        addChild,
            addVisibleChild: addVisibleChild,
            addHiddenChild:  addHiddenChild,

            hasAnyChildren:     hasAnyChildren,
            hasVisibleChildren: hasVisibleChildren,
            hasHiddenChildren:  hasHiddenChildren,

            getAllChildren:     getAllChildren,
            getVisibleChildren: getVisibleChildren,
            getHiddenChildren:  getHiddenChildren,

            removeChild:       removeChild,
            removeAllChildren: removeAllChildren,
            
            toggleVisibleChildren: toggleVisibleChildren,

            setBinding: setBinding,

            getId: getId,
            getName: getName,
            getEnding: getEnding,

            backupPosition: backupPosition,

            isPlaceholder:      isPlaceholder,
            isGroupingNodeView: isGroupingNodeView

            // fillScrollRange: fillScrollRange,
            // resetScrollRange: resetScrollRange

        };


        function setBinding(nodeView, nodeData) {
            nodeView.binding.targetDataNode = nodeData;
        }


        function createViewFromData(dataRoot, nodeViewGenerators) {

            var wrappedDataRoot = nodeViewGenerators.generateRoot();
            setChildren(wrappedDataRoot, dataRoot.stances.map(wrapStance));
            setBinding(wrappedDataRoot, dataRoot);

            // TODO: fill classes and other cached info

            return wrappedDataRoot;


            function wrapStance(stance) {
                var stanceNode = nodeViewGenerators.generateGroup();
                setChildren(stanceNode, stance.moves.map(wrapMove));
                setBinding(stanceNode, stance);
                return stanceNode;
            }


            function wrapMove(move) {
                var moveNode = nodeViewGenerators.generateNode();
                if (_.isNonEmptyArray(move.followUps)) {
                    setChildren(moveNode, move.followUps.map(wrapMove));
                }
                setBinding(moveNode, move);
                return moveNode;
            }

        }


        function createVisualNode(id, parent) {

            return {

                treeInfo: {
                    // Note - prefer using getter
                    id: id,
                    /** NodeView - prefer using getter */
                    parent: parent || null,
                    // Note - prefer using accessor methods
                    children: {
                        /** Array<NodeView> */
                        visible: [],
                        /** Array<NodeView> */
                        hidden:  []
                    }
                },

                appearance: {
                    classes: [],
                    lastPosition: {
                        x: undefined,
                        y: undefined
                    },
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
                    targetDataNode: null,
                    groupName: undefined // string
                    // svgNodeView: null
                }

            };

        }



        function createGenerators() {

            var counter = 1;

            return {
                generateRoot:  generate,
                generateGroup: generate,
                generateNode:  generate
            };

            function generate(parent) {
                return createVisualNode(counter++, parent || null);
            }

        }


        function backupPosition(nodeView) {
            nodeView.appearance.lastPosition.x = nodeView.x;
            nodeView.appearance.lastPosition.y = nodeView.y;
        }



        /** Can return grouping node views as well */
        function getParentView(nodeView) {
            return nodeView.treeInfo.parent || null;
        }


        /** Skip grouping node views */
        function getParentDataView(nodeView) {
            var parentNodeView = nodeView;
            var result = null;
            while (parentNodeView && !result) {
                var parentNodeView = getParentView(parentNodeView);
                result = parentNodeView.binding.targetDataNode || null;
            }
            return result;
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

            function addChild(nodeView, child) {
                var children = nodeView.treeInfo.children;
                if (
                    children.visible.length > 0 ||
                    children.hidden.length === 0
                ) {
                    addVisibleChild(nodeView, child);
                } else {
                    addHiddenChild(nodeView, child);
                }
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


            // unused?
            function hasAnyChildren(nodeView) {
                return hasVisibleChildren(nodeView) || hasHiddenChildren(nodeView);
            }

            function hasVisibleChildren(nodeView) {
                return getVisibleChildren(nodeView).length > 0;
            }

            function hasHiddenChildren(nodeView) {
                return getHiddenChildren(nodeView).length > 0;
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


            function toggleVisibleChildren(nodeView, optReturnIDsBecomeHidden) {

                var children = nodeView.treeInfo.children;
                var temp = children.hidden;
                children.hidden = children.visible; // FIXME: unique arrays?
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

            function log(nodeView) {

                console.group(nodeView);

                var output = [];

                var nodesAtIteratedDepth = [nodeView];

                do {

                    var nodesAtNextDepth = [];

                    nodesAtIteratedDepth.forEach(function(nodeView) {

                        var parent = getParentView(nodeView);
                        var visibleChildren = getVisibleChildren(nodeView);
                        var hiddenChildren  = getHiddenChildren(nodeView);

                        output.push({
                            parent: parent && getReadableId(parent),
                            id:    getId(nodeView),
                            input: getName(nodeView),
                            visibleChildren: childReadableIds(visibleChildren),
                            hiddenChildren:  childReadableIds(hiddenChildren),
                            x: nodeView.x,
                            y: nodeView.y,
                            depth: nodeView.depth,
                            lastX: nodeView.appearance.lastPosition.x,
                            lastY: nodeView.appearance.lastPosition.y
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



        function getId(nodeView) {
            return nodeView.treeInfo.id;
        }


        function getName(nodeView) {
            var targetNode = nodeView.binding.targetDataNode;
            return targetNode ? NodeFactory.toString(targetNode) : nodeView.binding.groupName;
        }


        function getEnding(nodeView) {
            var targetDataNode = nodeView.binding.targetDataNode;
            var result = targetDataNode && (
                NodeFactory.isStanceNode(targetDataNode) && targetDataNode.endsWith ||
                NodeFactory.isMoveNode(targetDataNode)   && targetDataNode.endsWith
            );
            return result || null;
        }


        function isPlaceholder(nodeView) {
            return nodeView.binding.isPlaceholder;
        }

        function isGroupingNodeView(nodeView) {
            return !nodeView.binding.targetDataNode;
        }


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
        //             var parentSr = getParentView(child).appearance.scrollRange;
        //             var childSr = child.appearance.scrollRange;
        //             parentSr.from = Math.min(parentSr.from, child.y); // childSr.from);
        //             parentSr.to   = Math.max(parentSr.to,   child.y); // childSr.to);
        //         });
        //     }

        // }

    }

);