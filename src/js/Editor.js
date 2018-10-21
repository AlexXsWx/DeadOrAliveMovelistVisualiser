define(

    'Editor',

    [
        'Tools/Signal', 'Model/NodeFactory', 'View/NodeView', 'Tools/TreeTools',
        'EditorGroups/EditorGroupRootCreator',
        'EditorGroups/EditorGroupStanceCreator',
        'EditorGroups/EditorGroupMoveCreator',
        'EditorGroups/EditorGroupCommonCreator',
        'Input/KeyCodes',
        'Tools/Executor', 'Tools/Tools'
    ],

    function(
        createSignal, NodeFactory, NodeView, TreeTools,
        EditorGroupRootCreator,
        EditorGroupStanceCreator,
        EditorGroupMoveCreator,
        EditorGroupCommonCreator,
        KeyCodes,
        Executor, _
    ) {

        var refs = {
            nodeDataGenerator: undefined,
            // FIXME: find a better way to pass this func
            toggleChildren: undefined,
            selectNode:     undefined
        };

        var selectedSVGNode; // FIXME: use editorGroups[].matchingSelectedViews instead

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
                onClickAddChild, onClickDeleteNode, moveNodeBy, toggleChildren
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

            if (!selectedSVGNode) return;

            var nodeView = selectedSVGNode.nodeView;
            var nodeData = NodeView.getNodeData(nodeView);
            var parentNodeView = NodeView.getParentNodeView(nodeView);

            if (
                // TODO: or allow deleting placeholders?..
                !NodeView.isPlaceholder(nodeView) &&
                !NodeView.isGroupingNodeView(nodeView) &&
                parentNodeView
            ) {

                var firstParentData = NodeView.findAncestorNodeData(nodeView);

                if (firstParentData) {
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
                        return;
                    }
                } else {
                    console.warn('Couldn\'t find first parent data');
                    return;
                }

                NodeView.removeChild(parentNodeView, nodeView);

                onDataChanged.dispatch({ deleted: [ nodeView ] });

                // TODO: treat as 1 action (for undo)
                refs.selectNode(parentNodeView);

            }

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
            Executor.rememberAndExecute('move node by ' + delta, act, unact);
            function act() { doMoveNodeBy(delta); }
            // FIXME: this is not symmetric
            // e.g. when you move down last node 3 times and then undo 3 times
            function unact() { doMoveNodeBy(-delta); }
        }


        // TODO: consider multiselection
        function doMoveNodeBy(delta) {

            if (!selectedSVGNode) return;

            var nodeView = selectedSVGNode.nodeView;
            var parentNodeView = NodeView.getParentNodeView(nodeView);

            if (!parentNodeView) return;

            var allChildren     = NodeView.getAllChildren(parentNodeView);
            var visibleChildren = NodeView.getVisibleChildren(parentNodeView);
            var changed = false;
            if (_.moveArrayElement(allChildren,     nodeView, delta)) changed = true;
            if (_.moveArrayElement(visibleChildren, nodeView, delta)) changed = true;

            if (!changed) return;

            onDataChanged.dispatch({ moved: [ nodeView ] });

            if (NodeView.isGroupingNodeView(nodeView)) return;

            var nodeData = NodeView.getNodeData(nodeView);
            var parentData = NodeView.findAncestorNodeData(nodeView);
            var children = NodeFactory.getChildren(parentData);
            if (children) _.moveArrayElement(children, nodeData, delta);

            // FIXME: When nodes are grouped by type (punches/kicks),
            // this still acts over limit of the group...

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
            var nodeData = NodeView.getNodeData(nodeView);
            var parentData = NodeView.findAncestorNodeData(nodeView);
            var children = NodeFactory.getChildren(parentData);
            if (children) children.push(nodeData);
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


        function addPlaceholderNode(parent, isEditorElement) {
            var placeholderNodeView;
            var parentIsRoot = !NodeView.getParentNodeView(parent);
            if (parentIsRoot) {
                placeholderNodeView = refs.nodeDataGenerator();
                var nodeData = NodeFactory.createStanceNode();
                NodeView.setNodeData(placeholderNodeView, nodeData);
            } else {
                placeholderNodeView = refs.nodeDataGenerator();
                var nodeData = NodeFactory.createMoveNode();
                NodeView.setNodeData(placeholderNodeView, nodeData);
            }
            NodeView.setIsPlaceholder(placeholderNodeView, isEditorElement);
            NodeView.addChild(parent, placeholderNodeView);
            return placeholderNodeView;
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
