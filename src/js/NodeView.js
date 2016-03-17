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

            // guessMoveTypeByInput: guessMoveTypeByInput,

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

            setBinding:                  setBinding,
            updateAppearanceByBoundNode: updateAppearanceByBoundNode,

            getId: getId,
            getName: getName,
            getEnding: getEnding,

            backupPosition: backupPosition,
            swapXY: swapXY

            // fillScrollRange: fillScrollRange,
            // resetScrollRangeForDatum: resetScrollRangeForDatum

        };


        function setBinding(nodeView, nodeData) {
            nodeView.fd3Data.binding.targetDataNode = nodeData;
            updateAppearanceByBoundNode(nodeView);
        }

        function updateAppearanceByBoundNode(nodeView) {
            var appearance = nodeView.fd3Data.appearance;
            var name   = getName(nodeView) || '<unnamed>';
            var ending = getEnding(nodeView);
            if (ending || hasAnyChildren(nodeView)) {
                appearance.textLeft = name;
                appearance.textRight = ending;
            } else {
                appearance.textLeft = null;
                appearance.textRight = name;
            }
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
                    id: id,
                    parent: parent || null,
                    children: {
                        visible: [],
                        hidden:  []
                    }
                },

                appearance: {
                    classes: [],
                    textLeft:  undefined,
                    textRight: undefined,
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
                    targetDataNodeType: undefined, // root / stance / move
                    isPlaceholder: undefined, // bool
                    targetDataNode: null
                    // svgNode: null,
                    // svgIncomingLink: null,
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

                return {

                    /**
                     * hide info in the fuck-d3-data so it has its very own place and is
                     * not affected by d3
                     */
                    fd3Data: createVisualNode(counter++, parent || null),

                    // data filled by d3
                    x: undefined,
                    y: undefined,
                    depth: undefined,
                    parent: undefined,
                    children: undefined
                };

            }

            
        }


        function backupPosition(datum) {
            datum.fd3Data.appearance.lastPosition.x = datum.x;
            datum.fd3Data.appearance.lastPosition.y = datum.y;
        }


        function swapXY(datum) {
            var swap = datum.x;
            datum.x = datum.y;
            datum.y = swap;
        }


        // function guessMoveTypeByInput(datum) {
        //     var input = datum.fd3Data.input;
        //     var moveInfo = datum.fd3Data.moveInfo;
        //     if (RGX.PUNCH.test(input)) {
        //         moveInfo.actionType = 'strike';
        //         moveInfo.strikeType = 'punch';
        //     } else
        //     if (RGX.KICK.test(input))  {
        //         moveInfo.actionType = 'strike';
        //         moveInfo.strikeType = 'kick';
        //     } else
        //     if (RGX.HOLD.test(input))  {
        //         moveInfo.actionType = 'hold';
        //         moveInfo.strikeType = undefined;
        //      } else
        //     if (RGX.THROW.test(input)) {
        //         moveInfo.actionType = 'throw';
        //         moveInfo.strikeType = undefined;
        //     } else {
        //         moveInfo.actionType = 'other';
        //         moveInfo.strikeType = undefined;
        //     }
        // }



        // ==== Children ====

            /** Does not update `parent` of its old children */
            function setChildren(datum, newChildren) {

                datum.fd3Data.treeInfo.children.visible = newChildren;
                datum.fd3Data.treeInfo.children.hidden = [];

                newChildren.forEach(function(child) {
                    child.fd3Data.treeInfo.parent = datum;
                });

            }

            function addChild(datum, child) {
                var children = datum.fd3Data.treeInfo.children;
                if (
                    children.visible.length > 0 ||
                    children.hidden.length === 0
                ) {
                    addVisibleChild(datum, child);
                } else {
                    addHiddenChild(datum, child);
                }
            }

            function addVisibleChild(datum, child) {
                child.fd3Data.treeInfo.parent = datum;
                var children = datum.fd3Data.treeInfo.children;
                children.visible.push(child);
            }

            function addHiddenChild(datum, child) {
                child.fd3Data.treeInfo.parent = datum;
                var children = datum.fd3Data.treeInfo.children;
                children.hidden.push(child);
            }


            function hasAnyChildren(datum) {
                return hasVisibleChildren(datum) || hasHiddenChildren(datum);
            }

            function hasVisibleChildren(datum) {
                return getVisibleChildren(datum).length > 0;
            }

            function hasHiddenChildren(datum) {
                return getHiddenChildren(datum).length > 0;
            }

            function getAllChildren(datum) {
                return getVisibleChildren(datum).concat(getHiddenChildren(datum));
            }

            function getVisibleChildren(datum) {
                return datum.fd3Data.treeInfo.children.visible;
            }

            function getHiddenChildren(datum) {
                return datum.fd3Data.treeInfo.children.hidden;
            }


            /** Does not update `parent` of its old children */
            function removeChild(parentDatum, child) {
                var parentChildren = parentDatum.fd3Data.treeInfo.children;
                [
                    parentChildren.visible,
                    parentChildren.hidden
                ].forEach(function(children) {
                    _.removeElement(children, child);
                });
            }

            /** Does not update `parent` of its old children */
            function removeAllChildren(datum) {
                datum.fd3Data.treeInfo.children.visible = [];
                datum.fd3Data.treeInfo.children.hidden  = [];
            }


            function toggleVisibleChildren(datum) {
                var children = datum.fd3Data.treeInfo.children;
                var temp = children.hidden;
                children.hidden = children.visible; // FIXME: unique arrays?
                children.visible = temp;
            }

        // ==================



        // ==== Logging ====

            function log(datum) {

                console.group(datum);

                var output = [];

                var nodesAtIteratedDepth = [datum];

                do {

                    var nodesAtNextDepth = [];

                    nodesAtIteratedDepth.forEach(function(node) {

                        var treeInfo = node.fd3Data.treeInfo;
                        var children = treeInfo.children;

                        output.push({
                            parent: treeInfo.parent && getReadableId(treeInfo.parent),
                            id:    getId(node),
                            input: getName(node),
                            visibleChildren: childReadabledIds(children.visible),
                            hiddenChildren:  childReadabledIds(children.hidden),
                            x: node.x,
                            y: node.y,
                            depth: node.depth,
                            lastX: node.fd3Data.appearance.lastPosition.x,
                            lastY: node.fd3Data.appearance.lastPosition.y
                        });

                        Array.prototype.push.apply(
                            nodesAtNextDepth,
                            getAllChildren(node)
                        );

                    });

                    nodesAtIteratedDepth = nodesAtNextDepth;

                } while (nodesAtIteratedDepth.length > 0);

                console.table(output);
                console.groupEnd();

            }

            function getReadableId(node) {
                return getId(node) + '#' + getName(node);
            }

            function childReadabledIds(children) {
                return children.map(getReadableId).join(',');
            }

        // =================



        function getId(datum) {
            return datum.fd3Data.treeInfo.id;
        }


        function getName(datum) {
            var targetNode = datum.fd3Data.binding.targetDataNode;
            if (NodeFactory.isRootNode(targetNode)) {
                return targetNode.character || 'character';
            } else
            if (NodeFactory.isStanceNode(targetNode)) {
                return targetNode.abbreviation || 'stance';
            } else
            if (NodeFactory.isMoveNode(targetNode)) {
                var input = targetNode.input;
                if (!input) return 'move';
                var context = targetNode.context.join(',');
                if (context) return context + ':' + input;
                return input;
            }
            console.error('Can\'t resolve name for node %O', datum);
        }


        function getEnding(nodeView) {
            var targetDataNode = nodeView.fd3Data.binding.targetDataNode;
            var result = targetDataNode && (
                NodeFactory.isStanceNode(targetDataNode) && targetDataNode.endsWith ||
                NodeFactory.isMoveNode(targetDataNode) && targetDataNode.endsWith
            );
            return result || null;
        }


        // function resetScrollRangeForDatum(datum) {
        //     datum.fd3Data.appearance.scrollRange.from = datum.y;
        //     datum.fd3Data.appearance.scrollRange.to   = datum.y;
        // }


        // function fillScrollRange(data) {
            
        //     var childrenByDepth = TreeTools.getChildrenMergedByDepth(
        //         data,
        //         getVisibleChildren
        //     );

        //     for (var i = childrenByDepth.length - 1; i > 0; --i) {
        //         var children = childrenByDepth[i];
        //         children.forEach(function(child) {
        //             var parentSr = child.treeInfo.parent.fd3Data.appearance.scrollRange;
        //             var childSr = child.fd3Data.appearance.scrollRange;
        //             parentSr.from = Math.min(parentSr.from, child.y); // childSr.from);
        //             parentSr.to   = Math.max(parentSr.to,   child.y); // childSr.to);
        //         });
        //     }

        // }

    }

);