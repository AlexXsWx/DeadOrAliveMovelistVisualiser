define(

    'Editor',

    [
        'Tools/Signal',
        'Model/NodeFactory',
        'Model/NodeFactoryRoot',
        'Model/NodeFactoryStance',
        'Model/NodeFactoryMove',
        'View/NodeView',
        'Tools/TreeTools',
        'EditorGroups/EditorGroupRootCreator',
        'EditorGroups/EditorGroupStanceCreator',
        'EditorGroups/EditorGroupMoveCreator',
        'EditorGroups/EditorGroupCommonCreator',
        'Input/KeyCodes',
        'Tools/Executor',
        'Tools/Tools'
    ],

    function(
        createSignal,
        NodeFactory,
        NodeFactoryRoot,
        NodeFactoryStance,
        NodeFactoryMove,
        NodeView,
        TreeTools,
        EditorGroupRootCreator,
        EditorGroupStanceCreator,
        EditorGroupMoveCreator,
        EditorGroupCommonCreator,
        KeyCodes,
        Executor,
        _
    ) {

        var refs = {
            nodeDataGenerator: undefined,
            // FIXME: find a better way to pass this func
            toggleChildren: undefined,
            selectNode:     undefined
        };

        var selectedSVGNode; // FIXME: use editorGroups[].matchingSelectedViews instead
        var buffer = {
            rootNode: null,
            cut: false
        };

        /**
         * Dispatches {
         *     [added: Array<NodeView>],
         *     [changed: Array<NodeView>],
         *     [deleted: Array<NodeView>],
         *     [moved: Array<NodeView>]
         * }
         */
        var onDataChanged = createSignal();


        var editorGroups = [
            EditorGroupCommonCreator.create(
                onClickAddChild, onClickDeleteNode, moveNodeBy, toggleChildren, cutNode, pasteNode
            ),
            EditorGroupRootCreator.create(modifySelectedNodesDataByFunc),
            EditorGroupStanceCreator.create(modifySelectedNodesDataByFunc),
            EditorGroupMoveCreator.create(modifySelectedNodesDataByFunc)
        ];

        var editorsParent = _.getDomElement('editorsParent');
        editorGroups.forEach(function(editorGroup) {
            _.hideDomElement(editorGroup.domRoot);
            editorsParent.appendChild(editorGroup.domRoot);
        });


        return {
            init:               init,
            focus:              focus, // TODO: focus on f2/enter
            reset:              reset,
            addPlaceholders:    addPlaceholders,
            removePlaceholders: removePlaceholders,
            updateBySelection:  updateBySelection,
            onDataChanged:      onDataChanged.listenersManager,

            moveNodeBy: moveNodeBy,
            deleteNode: onClickDeleteNode,
            copyNode: copyNode,
            cutNode: cutNode,
            pasteNode: pasteNode,

            onClickAddChild: onClickAddChild
        };


        function init(nodeDataGeneratorFunc, toggleChildrenFunc, selectNodeFunc) {
            refs.nodeDataGenerator = nodeDataGeneratorFunc;
            refs.toggleChildren    = toggleChildrenFunc;
            refs.selectNode        = selectNodeFunc;
            updateEditorDomGroups(false, false);
        }


        function toggleChildren() {
            if (selectedSVGNode) refs.toggleChildren(selectedSVGNode);
        }


        function modifySelectedNodesDataByFunc(changeAction) {

            if (!selectedSVGNode) return;

            var nodeView = selectedSVGNode.nodeView;

            var changed = false;

            var nodeData = NodeView.getNodeData(nodeView);
            changed = changeAction(nodeData);

            var update = {
                changed: changed ? [selectedSVGNode] : [],
                added: []
            };

            if (NodeView.isPlaceholder(nodeView)) {
                update.added = onPlaceholderEdited(nodeView);
            }

            // Update input values, as summary inputs can change other inputs and vice versa
            if (changed) updateEditorDomGroups(false, true);

            onDataChanged.dispatch(update);

        }


        function onClickDeleteNode(optEvent) {
            deleteNode();
        }

        function deleteNode() {

            var result = {
                succeed: false,
                refs: {}
            };

            if (!selectedSVGNode) return result;

            var nodeView = selectedSVGNode.nodeView;
            var nodeData = NodeView.getNodeData(nodeView);
            var parentNodeView = NodeView.getParentNodeView(nodeView);

            if (
                // TODO: or allow deleting placeholders?..
                NodeView.isPlaceholder(nodeView) ||
                NodeView.isGroupingNodeView(nodeView) ||
                !parentNodeView
            ) {
                return result;
            }

            var firstParentData = NodeView.findAncestorNodeData(nodeView);

            if (!firstParentData) {
                console.warn('Couldn\'t find first parent data');
                return result;
            }
            var success = false;
            var children = NodeFactory.getChildren(firstParentData);
            if (children) {
                success = _.removeElement(children, nodeData);
            }
            if (!success) {
                console.warn(
                    'Failed to remove %O: ' +
                    'nearest parent with data of %O does not contain it',
                    nodeData, parentNodeView
                );
                return result;
            }

            NodeView.removeChild(parentNodeView, nodeView);

            onDataChanged.dispatch({ deleted: [ nodeView ] });

            // TODO: treat as 1 action (for undo)
            refs.selectNode(parentNodeView);

            result.succeed = true;
            result.refs.nodeView = nodeView;
            result.refs.nodeData = nodeData;

            // FIXME: support undo/redo
            Executor.clearHistory();

            return result;
        }


        function copyNode(optEvent) {

            // FIXME: check if root

            // FIXME: cases when e.g. deleting node from a parent which is a soft-copy/link doesn't
            // remove the node view from the source parent

            // if (!selectedSVGNode) {
                return false;
            // }

            // buffer.rootNode = selectedSVGNode.nodeView;
            // buffer.cut = false;

            // return true;
        }


        function cutNode(optEvent) {

            // FIXME: check if root

            var result = deleteNode();
            if (!result.succeed) {
                return false;
            }

            buffer.rootNode = result.refs.nodeView;
            buffer.cut = true;

            return true;
        }


        function pasteNode(optEvent) {
            if (
                !selectedSVGNode ||
                !buffer.rootNode
            ) {
                return false;
            }

            var nodeView = selectedSVGNode.nodeView;

            if (NodeView.isPlaceholder(nodeView)) {
                // TODO: instanciate?
                return false;
            }

            var nodeData;
            if (NodeView.isGroupingNodeView(nodeView)) {
                nodeData = NodeView.findAncestorNodeData(nodeView);
            } else {
                nodeData = NodeView.getNodeData(nodeView);
            }

            if (!nodeData) {
                console.warn(
                    'Failed to paste to %O: ' +
                    'can\'t find parent data for it',
                    nodeView
                );
                return false;
            }

            var nodeDataToPaste = NodeView.getNodeData(buffer.rootNode);

            if (!NodeFactory.canBeDirectParent(nodeData, nodeDataToPaste)) return false;

            var newNodeView;

            if (buffer.cut) {
                newNodeView = buffer.rootNode;
                buffer.rootNode = null;
                NodeView.addChild(nodeView, newNodeView, true);
                addNodeDataToParentData(newNodeView);
            } else {
                if (TreeTools.isDescendant(nodeDataToPaste, nodeData, NodeFactory.getChildren)) {
                    console.log("This would go recursively")
                    return false;
                }

                buffer.rootNode = null;

                newNodeView = addNewNodeView(nodeView, nodeDataToPaste, true);
                addNodeDataToParentData(newNodeView);
            }
            onDataChanged.dispatch({ added: [ newNodeView ] });

            // FIXME: support undo/redo
            Executor.clearHistory();

            return true;
        }


        function onClickAddChild(optEvent) {

            if (!selectedSVGNode) return;

            var nodeView = selectedSVGNode.nodeView;

            // FIXME: make new node a true placeholder
            var newNode = addPlaceholderNode(nodeView, false);
            addNodeDataToParentData(newNode);

            if (NodeView.isPlaceholder(nodeView)) {
                onPlaceholderEdited(nodeView);
            }

            onDataChanged.dispatch({ added: [ newNode ] });

            refs.selectNode(newNode);

            // FIMXE: if not a true placeholder and in edit mode, add placeholder to the new node
            // addPlaceholders(newNode);

        }


        function moveNodeBy(delta) {
            if (!NodeView.sortsByDefault()) return;
            Executor.rememberAndExecute('move node by ' + delta, act, unact);
            return;
            function act() { return doMoveNodeBy(delta); }
            // FIXME: this is not accurate
            function unact(actResult) { if (actResult) doMoveNodeBy(-delta); }
        }


        // TODO: consider multiselection
        function doMoveNodeBy(delta) {

            if (!selectedSVGNode) return false;

            var nodeView = selectedSVGNode.nodeView;
            var parentNodeView = NodeView.getParentNodeView(nodeView);

            if (!parentNodeView) return false;

            var visibleChildren = NodeView.getVisibleChildren(parentNodeView);
            var changed = _.moveArrayElement(visibleChildren, nodeView, delta);

            if (!changed) return false;

            onDataChanged.dispatch({ moved: [ nodeView ] });

            if (!NodeView.isGroupingNodeView(nodeView)) {
                var adjacentVisibleNodeDatas = NodeView.getAdjacentVisibleNodeDatas(nodeView);

                var nodeData = NodeView.getNodeData(nodeView);
                var parentData = NodeView.findAncestorNodeData(nodeView);
                var children = NodeFactory.getChildren(parentData);
                console.assert(Boolean(children), 'Couldn\'t get children array');
                if (children.indexOf(nodeData) >= 0) {
                    _.removeElement(children, nodeData);
                    _.addBetween(
                        children,
                        nodeData,
                        adjacentVisibleNodeDatas.previous,
                        adjacentVisibleNodeDatas.next
                    );
                }
            }

            return true;

        }


        function onPlaceholderEdited(nodeView) {

            var newNodes = [];
            var placeholderNodeView;

            var parentNodeView = NodeView.getParentNodeView(nodeView);

            placeholderNodeView = addPlaceholderNode(parentNodeView, true);
            newNodes.push(placeholderNodeView);

            // turn node from placeholder to actual node

            NodeView.setIsPlaceholder(nodeView, false);

            addNodeDataToParentData(nodeView);

            placeholderNodeView = addPlaceholderNode(nodeView, true);
            newNodes.push(placeholderNodeView);

            return newNodes;

        }


        function addNodeDataToParentData(nodeView) {
            var adjacentVisibleNodeDatas = NodeView.getAdjacentVisibleNodeDatas(nodeView);

            var nodeData = NodeView.getNodeData(nodeView);
            var parentData = NodeView.findAncestorNodeData(nodeView);
            var children = NodeFactory.getChildren(parentData);
            console.assert(Boolean(children), 'Couldn\'t get children array');
            _.addBetween(
                children,
                nodeData,
                adjacentVisibleNodeDatas.previous,
                adjacentVisibleNodeDatas.next
            );
        }


        function addPlaceholders(rootViewNode) {

            var addedNodes = [];

            TreeTools.forAllCurrentChildren(
                rootViewNode,
                NodeView.getAllChildren,
                function(nodeView) {
                    var newNode = addPlaceholderNode(nodeView, true);
                    addedNodes.push(newNode);
                }
            );

            onDataChanged.dispatch({ added: addedNodes });

        }


        function removePlaceholders(rootViewNode) {

            var removedNodes = [];

            TreeTools.forAllCurrentChildren(
                rootViewNode,
                NodeView.getAllChildren,
                function(nodeView) {
                    if (NodeView.isPlaceholder(nodeView)) {
                        removedNodes.push(nodeView);
                        NodeView.removeChild(NodeView.getParentNodeView(nodeView), nodeView)
                    }
                }
            );

            onDataChanged.dispatch({ deleted: removedNodes });

        }


        // WARNING: doesn't link node data to parent's node data
        function addNewNodeView(parentNodeView, nodeData, optForceVisible) {
            var nodeView = NodeView.createViewFromData(nodeData, refs.nodeDataGenerator);
            NodeView.addChild(parentNodeView, nodeView, optForceVisible);
            return nodeView;
        }


        function addPlaceholderNode(parentNodeView, isEditorElement) {
            var nodeView = addNewNodeView(
                parentNodeView,
                createNodeData(parentNodeView),
                !isEditorElement
            );
            NodeView.setIsPlaceholder(nodeView, isEditorElement);
            return nodeView;
        }


        function createNodeData(parentNodeView) {
            var hasParent = Boolean(NodeView.getParentNodeView(parentNodeView));
            var parentIsRoot = !hasParent;
            if (parentIsRoot) return NodeFactoryStance.createStanceNode();
            return NodeFactoryMove.createMoveNode();
        }


        function updateBySelection(selectedNodeViewDomElements, doFocus) {

            // FIXME: keep array of selected elements
            selectedSVGNode = selectedNodeViewDomElements[0] || null;

            var selectedNodeViews = selectedNodeViewDomElements.map(
                function(svgNodeView) { return svgNodeView.nodeView; }
            );
            editorGroups.forEach(function(editorGroup) {
                editorGroup.updateBySelection(selectedNodeViews);
            });

            updateEditorDomGroups(doFocus, false);

        }


        function updateEditorDomGroups(doFocus, keepActiveSummaryContent) {

            editorGroups.forEach(function(editorGroup) {
                if (editorGroup.matchingSelectedViews.length === 0) {
                    _.hideDomElement(editorGroup.domRoot);
                } else {
                    _.showDomElement(editorGroup.domRoot);
                    editorGroup.updateView(keepActiveSummaryContent);
                }
            });

            if (doFocus) focus();

        }


        function focus() {

            for (var i = 0; i < editorGroups.length; ++i) {
                if (
                    editorGroups[i].matchingSelectedViews.length !== 0 &&
                    editorGroups[i].focus()
                ) {
                    return true;
                }
            }

            return false;

        }


        // TODO: find a better way than partial copy of `updateEditorDomGroups`
        function reset() {
            editorGroups.forEach(function(editorGroup) {
                _.hideDomElement(editorGroup.domRoot);
            });
        }

    }

);
