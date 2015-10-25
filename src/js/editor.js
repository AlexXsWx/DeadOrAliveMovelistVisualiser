define(

    'editor',

    [ 'd3', 'observer', 'keyCodes', 'tools' ],

    function(d3, createObserver, keyCodes, _) {

        var nodeGenerator;
        var selectedSVGNode;
        var onDataChanged = createObserver();
        
        return {
            init:              initEditor,
            updateBySelection: updateBySelection,
            showAbbreviations: showAbbreviations,
            onDataChanged:     onDataChanged
        };


        function initEditor(nodeGeneratorRef) {

            nodeGenerator = nodeGeneratorRef;

            bindListeners();
            
        }


        function bindListeners() {

            d3.select('#nodeInput')
                .on('input',   function() { changeSelectedNodes(this, readInput); })
                .on('keydown', onInputKeyDown);

            d3.select('#nodeContext')
                .on('input',   function() { changeSelectedNodes(this, readContext); })
                .on('keydown', onInputKeyDown);

            d3.select('#nodeEnd')
                .on('input',   function() { changeSelectedNodes(this, readEnd); })
                .on('keydown', onInputKeyDown);

            d3.select('#addChild').on('click', onClickAddChild);
            d3.select('#deleteNode').on('click', onClickDeleteNode);

            d3.select( '#moveNodeUp'   ).on('click', moveNodeBy.bind(null, -1));
            d3.select( '#moveNodeDown' ).on('click', moveNodeBy.bind(null,  1));

        }


        function readInput(inputElement, treeNode) {

            var oldValue = treeNode.fd3Data.input;
            var newValue = inputElement.value;

            treeNode.fd3Data.input = newValue;
            // todo: update editor elements according to this change
            nodeGenerator.guessMoveTypeByInput(treeNode);

            return { changed: oldValue !== newValue };
        }


        function readContext(inputElement, treeNode) {

            var newValue = inputElement.value.split(',').map(function(e) { return e.trim(); });
            var oldValue = treeNode.fd3Data.context;

            treeNode.fd3Data.context = newValue;

            return { changed: !_.arraysConsistOfSameStrings(oldValue, newValue) };

        }


        function readEnd(inputElement, treeNode) {

            var newValue = inputElement.value;
            var oldValue = treeNode.fd3Data.moveInfo.endsWith;

            treeNode.fd3Data.moveInfo.endsWith = newValue || undefined;

            return { changed: oldValue !== newValue };

        }


        function onClickDeleteNode() {

            if (!selectedSVGNode) return;

            var datum = d3.select(selectedSVGNode).datum();
            var parent = datum.fd3Data.parent;
            if (!datum.fd3Data.isEditorElement && parent) {
                nodeGenerator.forgetChild(parent, datum);
                onDataChanged.dispatch({ deleted: [ datum ] });
            }

        }


        function onClickAddChild() {

            if (!selectedSVGNode) return;

            var datum = d3.select(selectedSVGNode).datum();

            var newNode = addPlaceholderNode(datum, false);
            onDataChanged.dispatch({ added: [ newNode ] });

            // todo: focus on created node

        }


        function changeSelectedNodes(sourceHTMLElement, changeAction) {

            if (!selectedSVGNode) return;

            var selection = d3.select(selectedSVGNode);
            var data = selection.datum();

            var changes = changeAction(sourceHTMLElement, data);

            var update = {
                changed: changes.changed ? [selection] : [],
                added: []
            };

            if (data.fd3Data.isEditorElement) {
                update.added = onPlaceholderEdited(data);
            }

            onDataChanged.dispatch(update);

        }


        function moveNodeBy(delta) {

            if (!selectedSVGNode) return;

            var datum = d3.select(selectedSVGNode).datum();
            var parent = datum.fd3Data.parent;

            if (!parent) return;

            var pChildren = parent.fd3Data.children;
            var changed = false;
            if (_.moveArrayElement(pChildren.all,     datum, delta)) changed = true;
            if (_.moveArrayElement(pChildren.visible, datum, delta)) changed = true;
            changed && onDataChanged.dispatch({ moved: [ datum ] });

        }


        function onPlaceholderEdited(datum) {

            var newNodes = [];
            var node;

            node = addPlaceholderNode(datum.fd3Data.parent, true);
            newNodes.push(node);

            // turn node from placeholder to actual node
            datum.fd3Data.isEditorElement = false;
            node = addPlaceholderNode(datum, true);
            newNodes.push(node);

            return newNodes;

        }


        function enterEditMode(dataRoot) {

            // add new node placeholder to every node

            var addedNodes = [];

            forAllCurrentChildren(dataRoot, nodeGenerator.getAllChildren, function(node) {
                var newNode = addPlaceholderNode(node, true);
                addedNodes.push(newNode);
            });

            onDataChanged.dispatch({ added: addedNodes });

        }


        function leaveEditMode(dataRoot) {

            // remove new node placeholder from every node

            var removedNodes = [];

            forAllCurrentChildren(dataRoot, nodeGenerator.getAllChildren, function(node) {
                if (node.fd3Data.isEditorElement) {
                    removedNodes.push(node);
                    nodeGenerator.forgetChild(node.fd3Data.parent, node)
                }
            });

            onDataChanged.dispatch({ deleted: removedNodes });

        }


        function forAllCurrentChildren(dataRoot, childrenAccessor, action) {

            var nodesAtIteratedDepth = [dataRoot];

            do {

                var nodesAtNextDepth = [];

                nodesAtIteratedDepth.forEach(function(node) {
                    Array.prototype.push.apply(
                        nodesAtNextDepth,
                        childrenAccessor(node)
                    );
                    action(node);
                });

                nodesAtIteratedDepth = nodesAtNextDepth;

            } while (nodesAtIteratedDepth.length > 0);

        }


        function addPlaceholderNode(parent, editorElement) {

            var placeholderNode = nodeGenerator.generate('new', parent);
            placeholderNode.fd3Data.isEditorElement = editorElement;

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

            d3.select( '#nodeInput'   ).node().value = '';
            d3.select( '#nodeContext' ).node().value = '';
            d3.select( '#nodeEnd'     ).node().value = '';
            // todo: disable editor

            selectedSVGNode = null;

            if (selection.length === 0) return;
            if (selection.length > 1) {
                console.error('Error: selections with many elements not yet supported by editor');
                return;
            }
            selectedSVGNode = selection[0];

            var datum = d3.select(selectedSVGNode).datum();
            d3.select( '#nodeInput'   ).node().value = datum.fd3Data.input;
            d3.select( '#nodeContext' ).node().value = datum.fd3Data.context.join(', ');
            d3.select( '#nodeEnd'     ).node().value = datum.fd3Data.moveInfo.endsWith || '';

            focus && d3.select('#nodeInput').node().select();
            // todo: enable editor

        }

    }

);