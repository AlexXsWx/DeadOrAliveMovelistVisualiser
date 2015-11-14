define(

    'editor',

    [ 'd3', 'observer', 'node', 'visualNode', 'keyCodes', 'treeTools', 'tools' ],

    function(d3, createObserver, node, visualNode, keyCodes, treeTools, _) {

        var nodeDataGenerator;
        var selectedSVGNode; // FIXME: use editorGroups[].matchingSelectedViews instead
        var onDataChanged = createObserver();

        var editorGroups = [

            {

                name: "root",
                filter: function(data) { return data && node.isRootNode(data); },
                matchingSelectedViews: [],
                overrideCreator: node.createRootNode,
                domNode: $('editorRoot'),

                focus: function() {
                    $('editorRootCharacterName').select();
                    return true;
                },

                bindListeners: function() {
                    initInputElement('editorRootCharacterName', this, readCharacterName);
                    initInputElement('editorRootGameVersion',   this, readGameVersion);
                },

                updateView: function() {

                    var nodeView = this.matchingSelectedViews[0];
                    var nodeData = nodeView.fd3Data.binding.targetDataNode;

                    $( 'editorRootCharacterName' ).value = nodeData && nodeData.character || '';
                    $( 'editorRootGameVersion'   ).value = nodeData && nodeData.version   || '';

                }

            },

            {
                name: "stance",
                filter: function(data) { return data && node.isStanceNode(data); },
                matchingSelectedViews: [],
                overrideCreator: node.createStanceNode,
                domNode: $('editorStance'),

                focus: function() {
                    $('editorStanceAbbreviation').select();
                    return true;
                },

                bindListeners: function() {
                    initInputElement('editorStanceAbbreviation', this, readStanceAbbreviation);
                    initInputElement('editorStanceDescription',  this, readStanceDescription);
                    initInputElement('editorStanceEnding',       this, readStanceEnding);
                },

                updateView: function() {

                    var nodeView = this.matchingSelectedViews[0];
                    var nodeData = nodeView.fd3Data.binding.targetDataNode;

                    $( 'editorStanceAbbreviation' ).value = nodeData && nodeData.abbreviation || '';
                    $( 'editorStanceDescription'  ).value = nodeData && nodeData.description  || '';
                    $( 'editorStanceEnding'       ).value = nodeData && nodeData.endsWith     || '';

                }

            },

            {

                name: "move",
                filter: function(data) { return data && node.isMoveNode(data); },
                matchingSelectedViews: [],
                overrideCreator: node.createMoveNode,
                domNode: $('editorMove'),

                focus: function() {
                    $('editorMoveInput').select();
                    return true;
                },

                bindListeners: function() {
                    initInputElement('editorMoveInput',     this, readMoveInput);
                    initInputElement('editorMoveContext',   this, readMoveContext);
                    initInputElement('editorMoveFrameData', this, readMoveFrameData);
                    initInputElement('editorMoveEnding',    this, readMoveEnding);
                },

                updateView: function() {

                    // FIXME: consider differences between matching nodes

                    var nodeView = this.matchingSelectedViews[0];
                    var nodeData = nodeView.fd3Data.binding.targetDataNode;

                    $( 'editorMoveInput'     ).value = nodeData && nodeData.input               || '';
                    $( 'editorMoveFrameData' ).value = nodeData && nodeData.frameData.join(' ') || '';
                    $( 'editorMoveEnding'    ).value = nodeData && nodeData.endsWith            || '';
                    $( 'editorMoveContext'   ).value = nodeData && nodeData.context.join(', ')  || '';

                }
            },

            {
                name: "common",
                filter: function(data) { return true; },
                matchingSelectedViews: [],
                overrideCreator: function() { return null; },
                domNode: $('editorOther'),

                focus: function() { return false; },
                bindListeners: function() {

                    initButtonElement( 'addChild',   onClickAddChild);
                    initButtonElement( 'deleteNode', onClickDeleteNode);

                    initButtonElement( 'moveNodeUp',   moveNodeBy.bind(null, -1));
                    initButtonElement( 'moveNodeDown', moveNodeBy.bind(null,  1));

                },

                updateView: function() {

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


        function initEditor(nodeDataGeneratorRef) {
            nodeDataGenerator = nodeDataGeneratorRef;
            updateEditorDomGroups();
            bindListeners();
        }


        function bindListeners() {
            editorGroups.forEach(function(editorGroup) {
                editorGroup.bindListeners();
            });
        }


        function initInputElement(id, editorGroup, action) {
            var inputElement = $(id);
            inputElement.addEventListener('input', function(event) {
                changeSelectedNodes(this, editorGroup, action);
            });
            inputElement.addEventListener('keydown', onInputBlurIfEsc);
        }


        function onInputBlurIfEsc(event) {
            if (event.keyCode === keyCodes.ENTER) this.blur();
        }

        function initButtonElement(id, action) {
            $(id).addEventListener('click', function(event) {
                action();
            });
        }


        function changeSelectedNodes(sourceHTMLElement, editorGroup, changeAction) {

            if (!selectedSVGNode) return;

            var selection = d3.select(selectedSVGNode);
            var nodeView = selection.datum();

            var changes = readCommon(sourceHTMLElement, editorGroup.filter, nodeView, changeAction);

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

            var nodeView = getD3NodeView(selectedSVGNode);
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

            var nodeView = getD3NodeView(selectedSVGNode);

            var newNode = addPlaceholderNode(nodeView, false);
            onDataChanged.dispatch({ added: [ newNode ] });

            // todo: focus on created node

        }


        function moveNodeBy(delta) {

            // if (!selectedSVGNode) return;

            // var nodeView = getD3NodeView(selectedSVGNode);
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

            treeTools.forAllCurrentChildren(
                rootViewNode, 
                visualNode.getAllChildren, 
                function(treeNode) {
                    var newNode = addPlaceholderNode(treeNode, true);
                    addedNodes.push(newNode);
                }
            );

            onDataChanged.dispatch({ added: addedNodes });

        }


        function removePlaceholders(rootViewNode) {

            var removedNodes = [];

            treeTools.forAllCurrentChildren(
                rootViewNode, 
                visualNode.getAllChildren, 
                function(treeNode) {
                    if (treeNode.fd3Data.binding.isPlaceholder) {
                        removedNodes.push(treeNode);
                        visualNode.removeChild(treeNode.fd3Data.treeInfo.parent, treeNode)
                    }
                }
            );

            onDataChanged.dispatch({ deleted: removedNodes });

        }


        function addPlaceholderNode(parent, isEditorElement) {
            var placeholderNode;
            var parentIsRoot = !parent.fd3Data.treeInfo.parent;
            if (parentIsRoot) {
                placeholderNode = nodeDataGenerator.generateGroup('new');
            } else {
                placeholderNode = nodeDataGenerator.generateNode('new');
            }
            placeholderNode.fd3Data.binding.isPlaceholder = isEditorElement;
            visualNode.addChild(parent, placeholderNode);
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
                var nodeView = getD3NodeView(selectedNodeViewDomElements[i]);
                var nodeData = nodeView.fd3Data.binding.targetDataNode;
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
                    _.hideDomElement(editorGroup.domNode);
                    return;
                }

                _.showDomElement(editorGroup.domNode);

                editorGroup.updateView();
                if (!focused) focused = editorGroup.focus();

            });

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


        function $(id) {
            return document.getElementById(id);
        }


        function getD3NodeView(nodeViewDomElement) {
            return d3.select(nodeViewDomElement).datum();
        }

    }

);