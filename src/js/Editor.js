define(

    'Editor',

    [
        'Observer', 'NodeFactory', 'NodeView', 'TreeTools', 'Tools',
        'EditorGroups/EditorGroupRootCreator',
        'EditorGroups/EditorGroupStanceCreator',
        'EditorGroups/EditorGroupMoveCreator',
        'EditorGroups/EditorGroupCommonCreator'
    ],

    function(
        createObserver, NodeFactory, NodeView, TreeTools, _,
        EditorGroupRootCreator,
        EditorGroupStanceCreator,
        EditorGroupMoveCreator,
        EditorGroupCommonCreator
    ) {

        var nodeDataGenerator;
        var selectedSVGNode; // FIXME: use editorGroups[].matchingSelectedViews instead
        var toggleChildrenRef; // FIXME: find a better way to pass this func

        /**
         * Dispatches {
         *     [added: Array<NodeView>],
         *     [changed: Array<NodeView>],
         *     [deleted: Array<NodeView>],
         *     [moved: Array<NodeView>]
         * }
         */
        var onDataChanged = createObserver();


        var editorGroups = [
            EditorGroupCommonCreator.create(onClickAddChild, onClickDeleteNode, moveNodeBy, toggleChildren),
            EditorGroupRootCreator.create(changeSelectedNodes),
            EditorGroupStanceCreator.create(changeSelectedNodes),
            EditorGroupMoveCreator.create(changeSelectedNodes)
        ];

        var editorsParent = _.getDomElement('editorsParent');
        editorGroups.forEach(function(editorGroup) {
            _.hideDomElement(editorGroup.domRoot);
            editorsParent.appendChild(editorGroup.domRoot);
        });


        return {
            init:               init,
            addPlaceholders:    addPlaceholders,
            removePlaceholders: removePlaceholders,
            updateBySelection:  updateBySelection,
            onDataChanged:      onDataChanged
        };


        function init(nodeDataGeneratorRef, argToggleChildrenRef) {
            nodeDataGenerator = nodeDataGeneratorRef;
            toggleChildrenRef = argToggleChildrenRef;
            updateEditorDomGroups();
        }


        function toggleChildren() {
            if (selectedSVGNode) toggleChildrenRef(selectedSVGNode);
        }


        function changeSelectedNodes(/*sourceHTMLElement,*/ editorGroup, changeAction) {

            if (!selectedSVGNode) return;

            var nodeView = selectedSVGNode.nodeView;

            var changed = false;

            var nodeData = nodeView.binding.targetDataNode;
            // if (editorGroup.filter(nodeData)) { // no need?
                changed = changeAction(/*sourceHTMLElement,*/ nodeData);
            // }

            var update = {
                changed: changed ? [selectedSVGNode] : [],
                added: []
            };

            if (NodeView.isPlaceholder(nodeView)) {
                update.added = onPlaceholderEdited(nodeView);
            }

            onDataChanged.dispatch(update);

        }


        function onClickDeleteNode() {

            if (!selectedSVGNode) return;

            var nodeView = selectedSVGNode.nodeView;
            var nodeData = nodeView.binding.targetDataNode;
            var parentNodeView = NodeView.getParentView(nodeView);

            if (
                !NodeView.isPlaceholder(nodeView) &&
                !NodeView.isGroupingNodeView(nodeView) &&
                parentNodeView
            ) {

                var firstParentData = NodeView.getParentDataView(nodeView);

                if (firstParentData) {
                    var success = false;
                    var children = NodeFactory.getChildren(nodeData);
                    if (children) {
                        success = _.removeElement(children, nodeData);
                    }
                    if (!success) {
                        console.warn(
                            'Failed to remove %O: ' +
                            'nearest parent with data of %O does not contain it',
                            nodeData, parentNodeView
                        );
                    }
                } else {
                    console.warn('Couldn\'t find first parent data');
                }

                NodeView.removeChild(parentNodeView, nodeView);

                onDataChanged.dispatch({ deleted: [ nodeView ] });

            }

        }


        function onClickAddChild() {

            if (!selectedSVGNode) return;

            var nodeView = selectedSVGNode.nodeView;

            var newNode = addPlaceholderNode(nodeView, false);
            addNodeDataToParentData(newNode);

            onDataChanged.dispatch({ added: [ newNode ] });

            // TODO: focus on created node

        }


        // TODO: consider multiselection
        function moveNodeBy(delta) {

            if (!selectedSVGNode) return;

            var nodeView = selectedSVGNode.nodeView;
            var parentView = NodeView.getParentView(nodeView);

            if (!parentView) return;

            var allChildren     = NodeView.getAllChildren(parentView);
            var visibleChildren = NodeView.getVisibleChildren(parentView);
            var changed = false;
            if (_.moveArrayElement(allChildren,     nodeView, delta)) changed = true;
            if (_.moveArrayElement(visibleChildren, nodeView, delta)) changed = true;

            if (!changed) return;

            onDataChanged.dispatch({ moved: [ nodeView ] });

            if (NodeView.isGroupingNodeView(nodeView)) return;

            var nodeData = nodeView.binding.targetDataNode;
            var parentData = NodeView.getParentDataView(nodeView);
            var children = NodeFactory.getChildren(parentData);
            if (children) _.moveArrayElement(children, nodeData, delta);

        }


        function onPlaceholderEdited(nodeView) {

            var newNodes = [];
            var placeholderNodeView;

            var parentView = NodeView.getParentView(nodeView);

            placeholderNodeView = addPlaceholderNode(parentView, true);
            newNodes.push(placeholderNodeView);

            // turn node from placeholder to actual node

            nodeView.binding.isPlaceholder = false;

            addNodeDataToParentData(nodeView);

            placeholderNodeView = addPlaceholderNode(nodeView, true);
            newNodes.push(placeholderNodeView);

            return newNodes;

        }


        function addNodeDataToParentData(nodeView) {
            var nodeData = nodeView.binding.targetDataNode;
            var parentData = NodeView.getParentDataView(nodeView);
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
                        NodeView.removeChild(NodeView.getParentView(nodeView), nodeView)
                    }
                }
            );

            onDataChanged.dispatch({ deleted: removedNodes });

        }


        function addPlaceholderNode(parent, isEditorElement) {
            var placeholderNode;
            var parentIsRoot = !NodeView.getParentView(parent);
            if (parentIsRoot) {
                placeholderNode = nodeDataGenerator.generateGroup();
                var nodeData = NodeFactory.createStanceNode();
                NodeView.setBinding(placeholderNode, nodeData);
            } else {
                placeholderNode = nodeDataGenerator.generateNode();
                var nodeData = NodeFactory.createMoveNode();
                NodeView.setBinding(placeholderNode, nodeData);
            }
            placeholderNode.binding.isPlaceholder = isEditorElement;
            NodeView.addChild(parent, placeholderNode);
            return placeholderNode;
        }


        function updateBySelection(selectedNodeViewDomElements, focus) {

            // FIXME - keep array of selected elements
            selectedSVGNode = selectedNodeViewDomElements[0] || null;

            // reset old selection
            editorGroups.forEach(function(editorGroup) {
                editorGroup.matchingSelectedViews = [];
            });

            // update to new one
            for (var i = 0; i < selectedNodeViewDomElements.length; ++i) {
                var nodeView = selectedNodeViewDomElements[i].nodeView;
                var nodeData = nodeView.binding.targetDataNode;
                if (!nodeData) continue;
                for (var j = 0; j < editorGroups.length; ++j) {
                    var editorGroup = editorGroups[j];
                    if (editorGroup.filter(nodeData))
                    {
                        editorGroup.matchingSelectedViews.push(nodeView);
                    }
                }
            }

            updateEditorDomGroups();

        }


        function updateEditorDomGroups() {

            var focused = !focus;

            editorGroups.forEach(function(editorGroup) {

                if (editorGroup.matchingSelectedViews.length === 0) {

                    _.hideDomElement(editorGroup.domRoot);

                } else {

                    _.showDomElement(editorGroup.domRoot);

                    editorGroup.updateView();
                    if (!focused) focused = editorGroup.focus();

                }

            });

        }

    }

);