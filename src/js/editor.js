define(

    'editor',

    ['d3', 'keyCodes', 'tools'],

    function(d3, keyCodes, _) {

        var editModeEnabled = false;

        var updateFunc;
        var updateNode2;
        var nodeGenerator;
        var selectionManager;
        var dataRoot;
        
        return { init: initEditor };


        function initEditor(
            update, updateNode2Ref,
            dataRootRef, nodeGeneratorRef, selectionManagerRef,
            abbreviations
        ) {

            updateFunc       = update;
            updateNode2      = updateNode2Ref;
            dataRoot         = dataRootRef;
            nodeGenerator    = nodeGeneratorRef;
            selectionManager = selectionManagerRef;

            editModeEnabled = d3.select('#editMode').node().checked;
            d3.select('#editMode')
                .on('change', function() {
                    editModeEnabled = this.checked;
                    editModeEnabled ? enterEditMode() : leaveEditMode();
                });

            if (editModeEnabled) enterEditMode();

            d3.select('#nodeInput')

                .on('input', function() {

                    var selectedNode = selectionManager.getSelectedNode();
                    if (!selectedNode) return;

                    var selection = d3.select(selectedNode);
                    var data = selection.datum();

                    data.fd3Data.input = this.value;
                    // todo: update editor elements according to this change
                    nodeGenerator.fillMoveInfoFromInput(data);
                    updateNode2(selection);

                    if (data.fd3Data.isEditorElement) onPlaceholderEdited(data);

                })

                .on('keydown', onInputKeyDown);

            d3.select('#nodeContext')

                .on('input', function() {

                    var selectedNode = selectionManager.getSelectedNode();
                    if (!selectedNode) return;

                    var selection = d3.select(selectedNode);
                    var data = selection.datum();

                    data.fd3Data.context = this.value.split(',').map(function(e) {
                        return e.trim();
                    });
                    
                    if (data.fd3Data.isEditorElement) onPlaceholderEdited(data);

                })

                .on('keydown', onInputKeyDown);

            d3.select('#deleteNode').on('click', function() {

                var selectedNode = selectionManager.getSelectedNode();
                if (!selectedNode) return;

                var datum = d3.select(selectedNode).datum();
                var parent = datum.fd3Data.parent;
                if (!datum.fd3Data.isEditorElement && parent) {
                    nodeGenerator.forgetChild(parent, datum);
                    updateFunc(parent);
                }

            });

            d3.select( '#moveUp'   ).on('click', function() { moveNodeBy.call(this, -1); });
            d3.select( '#moveDown' ).on('click', function() { moveNodeBy.call(this,  1); });

            showAbbreviations(abbreviations);

        }


        function moveNodeBy(delta) {

            var selectedNode = selectionManager.getSelectedNode();
            if (!selectedNode) return;

            var datum = d3.select(selectedNode).datum();
            var parent = datum.fd3Data.parent;

            if (!parent) return;

            var pChildren = parent.fd3Data.children;
            var changed = false;
            if (_.moveArrayElement(pChildren.all,     datum, delta)) changed = true;
            if (_.moveArrayElement(pChildren.visible, datum, delta)) changed = true;
            changed && updateFunc(parent);

        }


        function onPlaceholderEdited(datum) {

            // TODO: optimize update call

            addPlaceholderNode(datum.fd3Data.parent);
            updateFunc(datum.fd3Data.parent);

            // turn node from placeholder to actual node
            datum.fd3Data.isEditorElement = false;
            addPlaceholderNode(datum);
            updateFunc(datum);

        }


        function enterEditMode() {

            editModeEnabled = true;

            // add new node placeholder to every node

            // start from root
            var nodesAtIteratedDepth = [dataRoot];
            do {
                var nodesAtNextDepth = [];
                nodesAtIteratedDepth.forEach(function(node) {
                    Array.prototype.push.apply(
                        nodesAtNextDepth,
                        nodeGenerator.getAllChildren(node)
                    );
                    addPlaceholderNode(node);
                });
                nodesAtIteratedDepth = nodesAtNextDepth;
            } while (nodesAtIteratedDepth.length > 0);

            updateFunc();

        }


        function leaveEditMode() {

            editModeEnabled = false;

            // remove new node placeholder from every node

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
                        nodeGenerator.forgetChild(node.fd3Data.parent, node)
                    }
                });
                nodesAtIteratedDepth = nodesAtNextDepth;
            } while (nodesAtIteratedDepth.length > 0);

            updateFunc();

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
            switch (d3.event.keyCode) {
                case keyCodes.ENTER:
                    this.blur();
                    break;
                case keyCodes.ESC:
                    selectionManager.selectNode.call(null);
                    break;
            }
        }

    }

);