define(

    'editor',

    [ 'd3', 'observer', 'node', 'visualNode', 'keyCodes', 'treeTools', 'tools' ],

    function(d3, createObserver, node, visualNode, keyCodes, treeTools, _) {

        var nodeGenerator;
        var selectedSVGNode;
        var onDataChanged = createObserver();

        return {
            init:               initEditor,
            addPlaceholders:    addPlaceholders,
            removePlaceholders: removePlaceholders,
            updateBySelection:  updateBySelection,
            onDataChanged:      onDataChanged
        };


        function initEditor(nodeGeneratorRef) {

            nodeGenerator = nodeGeneratorRef;

            bindListeners();

        }


        function bindListeners() {

            d3.select('#editorMoveInput')
                .on('input',   function() { changeSelectedNodes(this, readInput); })
                .on('keydown', onInputKeyDown);

            d3.select('#editorMoveContext')
                .on('input',   function() { changeSelectedNodes(this, readContext); })
                .on('keydown', onInputKeyDown);

            d3.select('#editorMoveFrameData')
                .on('input',   function() { changeSelectedNodes(this, readFrameData); })
                .on('keydown', onInputKeyDown);

            d3.select('#editorMoveEnding')
                .on('input',   function() { changeSelectedNodes(this, readEnd); })
                .on('keydown', onInputKeyDown);

            d3.select('#addChild').on('click', onClickAddChild);
            d3.select('#deleteNode').on('click', onClickDeleteNode);

            d3.select( '#moveNodeUp'   ).on('click', moveNodeBy.bind(null, -1));
            d3.select( '#moveNodeDown' ).on('click', moveNodeBy.bind(null,  1));

        }


        function readInput(inputElement, nodeView) {

            var changed = false;

            var nodeData = nodeView.fd3Data.binding.targetDataNode;
            if (node.isMoveNode(nodeData)) {

                var oldValue = nodeData.input;
                var newValue = inputElement.value;

                nodeData.input = newValue;
                // todo: update editor elements according to this change
                // node.guessMoveTypeByInput(nodeView);

                changed = oldValue !== newValue;

            }

            return { changed: changed };
        }


        function readContext(inputElement, nodeView) {

            var changed = false;

            var nodeData = nodeView.fd3Data.binding.targetDataNode;
            if (node.isMoveNode(nodeData)) {

                var newValue = inputElement.value.split(',').map(function(e) { return e.trim(); });
                var oldValue = nodeData.context || [];

                nodeData.context = newValue || undefined;

                changed = !_.arraysConsistOfSameStrings(oldValue, newValue);

            }

            return { changed: changed };

        }


        function readFrameData(inputElement, nodeView) {

            var changed = false;

            var nodeData = nodeView.fd3Data.binding.targetDataNode;
            if (node.isMoveNode(nodeData)) {

                var numbers = inputElement.value.match(/\d+/g);
                var newValue = numbers ? numbers.map(function(e) { return +e; }) : [];
                var oldValue = nodeData.frameData || [];

                nodeData.frameData = newValue || undefined;

                changed = !_.arraysAreEqual(oldValue, newValue);

            }

            return { changed: changed };

        }


        function readEnd(inputElement, nodeView) {

            var changed = false;

            var nodeData = nodeView.fd3Data.binding.targetDataNode;
            if (node.isMoveNode(nodeData)) {

                var newValue = inputElement.value;
                var oldValue = nodeData.endsWith;

                nodeData.endsWith = newValue || undefined;

                changed = oldValue !== newValue;

            }

            return { changed: changed };

        }


        function onClickDeleteNode() {

            if (!selectedSVGNode) return;

            var nodeView = d3.select(selectedSVGNode).datum();
            var nodeData = nodeView.fd3Data.binding.targetDataNode;
            var parentNodeView = nodeView.fd3Data.treeInfo.parent;

            if (!nodeView.fd3Data.binding.isPlaceholder && parentNodeView) {

                var firstParentData = findFirstParentData(nodeView);

                if (firstParentData) {
                    if (node.isRootNode(firstParentData)) {
                        _.removeElement(firstParentData.stances, nodeData);
                    } else
                    if (node.isStanceNode(firstParentData)) {
                        _.removeElement(firstParentData.moves, nodeData);
                    } else
                    if (node.isMoveNode(firstParentData)) {
                        _.removeElement(firstParentData.followUps, nodeData);
                    } else {
                        console.warn(
                            'Failed to remove %O: ' +
                            'nearest parent with data of %O does not contain it',
                            nodeData, parentNodeView
                        );
                    }
                } else {
                    console.warn('Couldn\'t find first parent data');
                }

                visualNode.removeChild(parentNodeView, nodeView);

                onDataChanged.dispatch({ deleted: [ nodeView ] });

            }

        }


        function findFirstParentData(nodeView) {
            var parentView = nodeView.fd3Data.treeInfo.parent;;
            var result;
            while (parentView && !result) {
                result = parentView.fd3Data.binding.targetDataNode;
                parentView = parentView.fd3Data.treeInfo.parent;
            }
            return result || null;
        }


        function onClickAddChild() {

            if (!selectedSVGNode) return;

            var nodeView = d3.select(selectedSVGNode).datum();

            var newNode = addPlaceholderNode(nodeView, false);
            onDataChanged.dispatch({ added: [ newNode ] });

            // todo: focus on created node

        }


        function changeSelectedNodes(sourceHTMLElement, changeAction) {

            if (!selectedSVGNode) return;

            var selection = d3.select(selectedSVGNode);
            var nodeView = selection.datum();

            var changes = changeAction(sourceHTMLElement, nodeView);

            var update = {
                changed: changes.changed ? [selection] : [],
                added: []
            };

            if (nodeView.fd3Data.binding.isPlaceholder) {
                update.added = onPlaceholderEdited(nodeView);
            }

            onDataChanged.dispatch(update);

        }


        function moveNodeBy(delta) {

            // if (!selectedSVGNode) return;

            // var nodeView = d3.select(selectedSVGNode).datum();
            // var parent = nodeView.fd3Data.treeInfo.parent;

            // if (!parent) return;

            // var allChildren     = visualNode.getAllChildren(parent);
            // var visibleChildren = visualNode.getVisibleChildren(parent);
            // var changed = false;
            // if (_.moveArrayElement(allChildren,     nodeView, delta)) changed = true;
            // if (_.moveArrayElement(visibleChildren, nodeView, delta)) changed = true;
            // changed && onDataChanged.dispatch({ moved: [ nodeView ] });

        }


        function onPlaceholderEdited(datum) {

            // var newNodes = [];
            // var node;

            // node = addPlaceholderNode(datum.fd3Data.treeInfo.parent, true);
            // newNodes.push(node);

            // // turn node from placeholder to actual node
            // datum.fd3Data.binding.isPlaceholder = false;
            // node = addPlaceholderNode(datum, true);
            // newNodes.push(node);

            // return newNodes;

        }


        function addPlaceholders(dataRoot) {

            var addedNodes = [];

            treeTools.forAllCurrentChildren(dataRoot, visualNode.getAllChildren, function(treeNode) {
                var newNode = addPlaceholderNode(treeNode, true);
                addedNodes.push(newNode);
            });

            onDataChanged.dispatch({ added: addedNodes });

        }


        function removePlaceholders(dataRoot) {

            var removedNodes = [];

            treeTools.forAllCurrentChildren(dataRoot, visualNode.getAllChildren, function(treeNode) {
                if (treeNode.fd3Data.binding.isPlaceholder) {
                    removedNodes.push(treeNode);
                    visualNode.removeChild(treeNode.fd3Data.treeInfo.parent, treeNode)
                }
            });

            onDataChanged.dispatch({ deleted: removedNodes });

        }


        function addPlaceholderNode(parent, isEditorElement) {
            var placeholderNode;
            var parentIsRoot = !parent.fd3Data.treeInfo.parent;
            if (parentIsRoot) {
                placeholderNode = nodeGenerator.generateGroup('new');
            } else {
                placeholderNode = nodeGenerator.generateNode('new');
            }
            placeholderNode.fd3Data.binding.isPlaceholder = isEditorElement;
            visualNode.addChild(parent, placeholderNode);
            return placeholderNode;
        }


        function onInputKeyDown() {
            if (d3.event.keyCode === keyCodes.ENTER) this.blur();
        }


        function updateBySelection(selection, focus) {

            d3.select( '#editorMoveInput'     ).node().value = '';
            d3.select( '#editorMoveFrameData' ).node().value = '';
            d3.select( '#editorMoveEnding'    ).node().value = '';
            d3.select( '#editorMoveContext'   ).node().value = '';
            // todo: disable editor

            selectedSVGNode = null;

            if (selection.length === 0) return;
            if (selection.length > 1) {
                console.error('Error: selections with many elements not yet supported by editor');
                return;
            }
            selectedSVGNode = selection[0];

            var nodeView = d3.select(selectedSVGNode).datum();
            var nodeData = nodeView.fd3Data.binding.targetDataNode;
            if (nodeData && node.isMoveNode(nodeData)) {
                d3.select( '#editorMoveInput'     ).node().value = nodeData.input;
                d3.select( '#editorMoveFrameData' ).node().value = nodeData.frameData.join(' ');
                d3.select( '#editorMoveEnding'    ).node().value = nodeData.endsWith || '';
                d3.select( '#editorMoveContext'   ).node().value = nodeData.context.join(', ');

                focus && d3.select('#editorMoveInput').node().select();
                // todo: enable editor
            }

        }

    }

);