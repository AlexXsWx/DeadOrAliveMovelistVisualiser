define(

    'editor',

    [ 'd3', 'observer', 'node', 'visualNode', 'keyCodes', 'treeTools', 'tools' ],

    function(d3, createObserver, node, visualNode, keyCodes, treeTools, _) {

        var nodeGenerator;
        var selectedSVGNode;
        var onDataChanged = createObserver();

        var commonEditorGroup = document.getElementById('editorOther');

        var something = [

            {

                name: "root",
                filter: function(data) { return data && node.isRootNode(data); },
                selectedViews: [],
                dataMask: createDataMask(),
                // viewDataTempOverride: null,
                overrideCreator: node.createRootNode,
                editorGroup: document.getElementById('editorRoot'),

                focus: function() {
                    d3.select('#editorRootCharacterName').node().select();
                },

                updateView: function() {

                    var nodeView = this.selectedViews[0];
                    var nodeData = nodeView.fd3Data.binding.targetDataNode;

                    d3.select( '#editorRootCharacterName' ).node().value = nodeData && nodeData.character || '';
                    d3.select( '#editorRootGameVersion'   ).node().value = nodeData && nodeData.version   || '';

                }

            },

            {
                name: "stance",
                filter: function(data) { return data && node.isStanceNode(data); },
                selectedViews: [],
                dataMask: createDataMask(),
                // viewDataTempOverride: null,
                overrideCreator: node.createStanceNode,
                editorGroup: document.getElementById('editorStance'),

                focus: function() {
                    d3.select('#editorStanceAbbreviation').node().select();
                },

                updateView: function() {

                    var nodeView = this.selectedViews[0];
                    var nodeData = nodeView.fd3Data.binding.targetDataNode;

                    d3.select( '#editorStanceAbbreviation' ).node().value = nodeData && nodeData.abbreviation || '';
                    d3.select( '#editorStanceDescription'  ).node().value = nodeData && nodeData.description  || '';
                    d3.select( '#editorStanceEnding'       ).node().value = nodeData && nodeData.endsWith     || '';

                }

            },

            {

                name: "move",
                filter: function(data) { return data && node.isMoveNode(data); },
                selectedViews: [],
                dataMask: createDataMask(),
                // viewDataTempOverride: null,
                overrideCreator: node.createMoveNode,
                editorGroup: document.getElementById('editorMove'),

                focus: function() {
                    d3.select('#editorMoveInput').node().select();
                },

                updateView: function() {

                    // FIXME: consider this.dataMask

                    var nodeView = this.selectedViews[0];
                    var nodeData = nodeView.fd3Data.binding.targetDataNode;

                    d3.select( '#editorMoveInput'     ).node().value = nodeData && nodeData.input               || '';
                    d3.select( '#editorMoveFrameData' ).node().value = nodeData && nodeData.frameData.join(' ') || '';
                    d3.select( '#editorMoveEnding'    ).node().value = nodeData && nodeData.endsWith            || '';
                    d3.select( '#editorMoveContext'   ).node().value = nodeData && nodeData.context.join(', ')  || '';

                }
            }
        ];


        return {
            init:               initEditor,
            addPlaceholders:    addPlaceholders,
            removePlaceholders: removePlaceholders,
            updateBySelection:  updateBySelection,
            onDataChanged:      onDataChanged
        };


        function initEditor(nodeGeneratorRef) {

            nodeGenerator = nodeGeneratorRef;

            updateEditorDomGroups();

            bindListeners();

        }


        function bindListeners() {

            // root
            initInputElement('#editorRootCharacterName', something[0], readCharacterName);
            initInputElement('#editorRootGameVersion',   something[0], readGameVersion);

            // stance
            initInputElement('#editorStanceAbbreviation', something[1], readStanceAbbreviation);
            initInputElement('#editorStanceDescription',  something[1], readStanceDescription);
            initInputElement('#editorStanceEnding',       something[1], readStanceEnding);

            // move
            initInputElement('#editorMoveInput',     something[2], readMoveInput);
            initInputElement('#editorMoveContext',   something[2], readMoveContext);
            initInputElement('#editorMoveFrameData', something[2], readMoveFrameData);
            initInputElement('#editorMoveEnding',    something[2], readMoveEnding);

            // common
            
            initButtonElement( '#addChild',   onClickAddChild);
            initButtonElement( '#deleteNode', onClickDeleteNode);

            initButtonElement( '#moveNodeUp',   moveNodeBy.bind(null, -1));
            initButtonElement( '#moveNodeDown', moveNodeBy.bind(null,  1));

        }


        function initInputElement(id, somethingJ, action) {
            d3.select(id)
                .on('input',   function() { changeSelectedNodes(this, somethingJ.filter, action); })
                .on('keydown', onInputKeyDown);
        }

        function initButtonElement(id, action) {
            d3.select(id).on('click', action);
        }


        function changeSelectedNodes(sourceHTMLElement, filter, changeAction) {

            if (!selectedSVGNode) return;

            var selection = d3.select(selectedSVGNode);
            var nodeView = selection.datum();

            var changes = readCommon(sourceHTMLElement, filter, nodeView, changeAction);

            var update = {
                changed: changes.changed ? [selection] : [],
                added: []
            };

            if (nodeView.fd3Data.binding.isPlaceholder) {
                update.added = onPlaceholderEdited(nodeView);
            }

            onDataChanged.dispatch(update);

        }


        function readCommon(inputElement, filter, nodeView, uncommon) {

            var changed = false;

            var nodeData = nodeView.fd3Data.binding.targetDataNode;
            if (filter(nodeData)) {
                changed = uncommon(inputElement.value, nodeData, nodeView);
            }

            return { changed: changed };
            
        }


        // ==== Readers ====

            // ==== Root ====

                function readCharacterName(inputValue, nodeData, nodeView) {
                    var changed = nodeData.character !== inputValue;
                    nodeData.character = inputValue;
                    return changed;
                }


                function readGameVersion(inputValue, nodeData, nodeView) {
                    var changed = nodeData.version !== inputValue;
                    nodeData.version = inputValue;
                    return changed;
                }

            // ==============

            // ==== Stance ====

                function readStanceAbbreviation(inputValue, nodeData, nodeView) {
                    var changed = nodeData.abbreviation !== inputValue;
                    nodeData.abbreviation = inputValue;
                    return changed;
                }


                function readStanceDescription(inputValue, nodeData, nodeView) {
                    var changed = nodeData.description !== inputValue;
                    nodeData.description = inputValue;
                    return changed;
                }


                function readStanceEnding(inputValue, nodeData, nodeView) {
                    var changed = nodeData.endsWith !== inputValue;
                    nodeData.endsWith = inputValue;
                    return changed;
                }

            // ================

            // ==== Move ====

                function readMoveInput(inputValue, nodeData, nodeView) {
                    var changed = nodeData.input !== inputValue;
                    nodeData.input = inputValue;
                    // todo: update editor elements according to this change
                    // node.guessMoveTypeByInput(nodeView);
                    return changed;
                }


                function readMoveContext(inputValue, nodeData, nodeView) {

                    var newValue = inputValue.split(',').map(function(e) { return e.trim(); });
                    var oldValue = nodeData.context || [];

                    nodeData.context = newValue || undefined;

                    return !_.arraysConsistOfSameStrings(oldValue, newValue);

                }


                function readMoveFrameData(inputValue, nodeData, nodeView) {

                    var numbers = inputValue.match(/\d+/g);
                    var newValue = numbers ? numbers.map(function(e) { return +e; }) : [];
                    var oldValue = nodeData.frameData || [];

                    nodeData.frameData = newValue || undefined;

                    return !_.arraysAreEqual(oldValue, newValue);

                }


                function readMoveEnding(inputValue, nodeData, nodeView) {

                    var newValue = inputValue;
                    var oldValue = nodeData.endsWith;

                    nodeData.endsWith = newValue || undefined;

                    return oldValue !== newValue;

                }

            // ==============

        // =================


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


        function onClickAddChild() {

            if (!selectedSVGNode) return;

            var nodeView = d3.select(selectedSVGNode).datum();

            var newNode = addPlaceholderNode(nodeView, false);
            onDataChanged.dispatch({ added: [ newNode ] });

            // todo: focus on created node

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


        function addPlaceholders(rootViewNode) {

            var addedNodes = [];

            treeTools.forAllCurrentChildren(rootViewNode, visualNode.getAllChildren, function(treeNode) {
                var newNode = addPlaceholderNode(treeNode, true);
                addedNodes.push(newNode);
            });

            onDataChanged.dispatch({ added: addedNodes });

        }


        function removePlaceholders(rootViewNode) {

            var removedNodes = [];

            treeTools.forAllCurrentChildren(rootViewNode, visualNode.getAllChildren, function(treeNode) {
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

            selectedSVGNode = selection[0] || null; // FIXME - keep array of selected elements

            // reset old selection
            something.forEach(function(somethingJ) {
                somethingJ.selectedViews = [];
                dataMask = createDataMask();
            });

            // update to new one
            for (var i = 0; i < selection.length; ++i) {
                var nodeView = d3.select(selection[i]).datum();
                var nodeData = nodeView.fd3Data.binding.targetDataNode;
                for (var j = 0; j < something.length; ++j) {
                    var somethingJ = something[j];
                    if (somethingJ.filter(nodeData))
                    {
                        somethingJ.selectedViews.push(nodeView);
                        somethingJ.dataMask.restrictBy(nodeData);
                    }
                }
            }

            updateEditorDomGroups();

        }


        function updateEditorDomGroups() {

            var somethingIsSelected = false;

            something.forEach(function(somethingJ) {

                if (somethingJ.selectedViews.length == 0) {
                    _.hideDomElement(somethingJ.editorGroup);
                    return;
                }

                somethingIsSelected = true;
                _.showDomElement(somethingJ.editorGroup);

                somethingJ.updateView();
                if (focus) somethingJ.focus();

            });

            if (somethingIsSelected > 0) {
                _.showDomElement(commonEditorGroup);
            } else {
                _.hideDomElement(commonEditorGroup);
            }

        }


        function createDataMask() {

            var mask = true;

            return { restrictBy: restrictBy };

            function restrictBy(element) {
                if (element === true || mask === false) return;
                if (!_.isObject(mask)) {
                    mask = false;
                    return;
                }
                // etc...
            }

        }


        function findFirstParentData(nodeView) {
            var parentView = nodeView.fd3Data.treeInfo.parent;
            var result;
            while (parentView && !result) {
                result = parentView.fd3Data.binding.targetDataNode;
                parentView = parentView.fd3Data.treeInfo.parent;
            }
            return result || null;
        }

    }

);