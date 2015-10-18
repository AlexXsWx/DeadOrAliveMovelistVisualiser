define(

    'editor',

    [ 'd3', 'observer', 'keyCodes', 'tools' ],

    function(d3, createObserver, keyCodes, _) {

        var editModeEnabled = false;

        var nodeGenerator;
        var dataRoot;
        var selectedNode;
        var onNodeChanged = createObserver();
        
        return {
            init:              initEditor,
            updateBySelection: updateBySelection,
            onNodeChanged:     onNodeChanged
        };


        function initEditor(
            dataRootRef, nodeGeneratorRef,
            abbreviations
        ) {

            dataRoot      = dataRootRef;
            nodeGenerator = nodeGeneratorRef;

            editModeEnabled = d3.select('#editMode').node().checked;
            d3.select('#editMode')
                .on('change', function() {
                    editModeEnabled = this.checked;
                    editModeEnabled ? enterEditMode() : leaveEditMode();
                });

            if (editModeEnabled) enterEditMode();

            d3.select('#nodeInput')

                .on('input', function onInputInput() {
                    genericInputAction(
                        this,
                        function readInput(data) {
                            data.fd3Data.input = this.value;
                            // todo: update editor elements according to this change
                            nodeGenerator.fillMoveInfoFromInput(data);
                        }
                    );
                })

                .on('keydown', onInputKeyDown);

            d3.select('#nodeContext')

                .on('input', function onInputContext() {
                    genericInputAction(
                        this,
                        function readContext(data) {
                            data.fd3Data.context = this.value.split(',').map(function(e) {
                                return e.trim();
                            });
                        }
                    );
                })

                .on('keydown', onInputKeyDown);

            d3.select('#deleteNode').on('click', function onClickDeleteNode() {

                if (!selectedNode) return;

                var datum = d3.select(selectedNode).datum();
                var parent = datum.fd3Data.parent;
                if (!datum.fd3Data.isEditorElement && parent) {
                    nodeGenerator.forgetChild(parent, datum);
                    onNodeChanged.dispatch({
                        deleted: [ datum ]
                    });
                }

            });

            d3.select( '#moveNodeUp'   ).on('click', function() { moveNodeBy.call(this, -1); });
            d3.select( '#moveNodeDown' ).on('click', function() { moveNodeBy.call(this,  1); });

            showAbbreviations(abbreviations);

        }


        function genericInputAction(input, concreteAction) {

            if (!selectedNode) return;

            var selection = d3.select(selectedNode);
            var data = selection.datum();

            concreteAction.call(input, data);

            var update = {
                changed: selection,
                added: []
            };

            if (data.fd3Data.isEditorElement) {
                update.added = onPlaceholderEdited(data);
            }

            onNodeChanged.dispatch(update);

        }


        function moveNodeBy(delta) {

            if (!selectedNode) return;

            var datum = d3.select(selectedNode).datum();
            var parent = datum.fd3Data.parent;

            if (!parent) return;

            var pChildren = parent.fd3Data.children;
            var changed = false;
            if (_.moveArrayElement(pChildren.all,     datum, delta)) changed = true;
            if (_.moveArrayElement(pChildren.visible, datum, delta)) changed = true;
            changed && onNodeChanged.dispatch({ moved: datum });

        }


        function onPlaceholderEdited(datum) {

            var newNodes = [];
            var node;

            node = addPlaceholderNode(datum.fd3Data.parent);
            newNodes.push(node);

            // turn node from placeholder to actual node
            datum.fd3Data.isEditorElement = false;
            node = addPlaceholderNode(datum);
            newNodes.push(node);

            return newNodes;

        }


        function enterEditMode() {

            editModeEnabled = true;

            // add new node placeholder to every node

            var addedNodes = [];

            // start from root
            var nodesAtIteratedDepth = [dataRoot];
            do {
                var nodesAtNextDepth = [];
                nodesAtIteratedDepth.forEach(function(node) {
                    Array.prototype.push.apply(
                        nodesAtNextDepth,
                        nodeGenerator.getAllChildren(node)
                    );
                    var newNode = addPlaceholderNode(node);
                    addedNodes.push(newNode);
                });
                nodesAtIteratedDepth = nodesAtNextDepth;
            } while (nodesAtIteratedDepth.length > 0);

            onNodeChanged.dispatch({
                added: addedNodes
            });

        }


        function leaveEditMode() {

            editModeEnabled = false;

            // remove new node placeholder from every node

            var removedNodes = [];

            // start from root
            var nodesAtIteratedDepth = [dataRoot];
            do {
                var nodesAtNextDepth = [];
                nodesAtIteratedDepth.forEach(function(node) {
                    Array.prototype.push.apply(
                        nodesAtNextDepth,
                        nodeGenerator.getAllChildren(node)
                    );
                    if (node.fd3Data.isEditorElement) {
                        removedNodes.push(node);
                        nodeGenerator.forgetChild(node.fd3Data.parent, node)
                    }
                });
                nodesAtIteratedDepth = nodesAtNextDepth;
            } while (nodesAtIteratedDepth.length > 0);

            onNodeChanged.dispatch({
                deleted: removedNodes
            });

        }


        function addPlaceholderNode(parent) {

            var placeholderNode = nodeGenerator.generate('new', parent);
            placeholderNode.fd3Data.isEditorElement = true;

            var children = parent.fd3Data.children;
            children.all.push(placeholderNode);
            if (children.visible.length > 0 || children.hidden.length === 0) {
                children.visible.push(placeholderNode);
            } else {
                children.hidden.push(placeholderNode);
            }

            return placeholderNode;
        }


        function showAbbreviations(abbreviations) {

            if (!abbreviations) return;

            var table = d3.select('#abbreviations table');

            for (name in abbreviations) {
                var row = table.append('tr');
                row.append('td').text(name);
                row.append('td').append('input').node().value = abbreviations[name];
            }
        }


        function onInputKeyDown() {
            if (d3.event.keyCode === keyCodes.ENTER) this.blur();
        }


        function updateBySelection(selection, focus) {

            d3.select('#nodeInput').node().value = '';
            d3.select('#nodeContext').node().value = '';
            // todo: disable editor

            selectedNode = null;

            if (selection.length === 0) return;
            if (selection.length > 1) {
                console.error('Error: selections with many elements not yet supported by editor');
                return;
            }
            selectedNode = selection[0];

            var datum = d3.select(selectedNode).datum();
            d3.select('#nodeInput').node().value = datum.fd3Data.input;
            focus && d3.select('#nodeInput').node().select();
            d3.select('#nodeContext').node().value = datum.fd3Data.context.join(', ');
            // todo: enable editor

        }

    }

);