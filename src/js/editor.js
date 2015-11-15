define(

    'editor',

    [ 'd3', 'observer', 'node', 'visualNode', 'keyCodes', 'treeTools', 'tools', 'Strings' ],

    function(d3, createObserver, node, visualNode, keyCodes, treeTools, _, Strings) {

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
                    initInputElement($('editorRootCharacterName'), this, readCharacterName);
                    initInputElement($('editorRootGameVersion'),   this, readGameVersion);
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
                    initInputElement($('editorStanceAbbreviation'), this, readStanceAbbreviation);
                    initInputElement($('editorStanceDescription'),  this, readStanceDescription);
                    initInputElement($('editorStanceEnding'),       this, readStanceEnding);
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
                    initInputElement($('editorMoveInput'),     this, readMoveInput);
                    initInputElement($('editorMoveContext'),   this, readMoveContext);
                    initInputElement($('editorMoveFrameData'), this, readMoveFrameData);
                    initInputElement($('editorMoveEnding'),    this, readMoveEnding);
                },

                updateView: function() {

                    // FIXME: consider differences between matching nodes

                    var nodeView = this.matchingSelectedViews[0];
                    var nodeData = nodeView.fd3Data.binding.targetDataNode;

                    createInputForMoveActionSteps(this, nodeData);

                    $( 'editorMoveInput'     ).value = nodeData && nodeData.input               || '';
                    $( 'editorMoveFrameData' ).value = nodeData && nodeData.frameData.join(' ') || '';
                    $( 'editorMoveEnding'    ).value = nodeData && nodeData.endsWith            || '';
                    $( 'editorMoveContext'   ).value = nodeData && nodeData.context.join(', ')  || '';

                    var actionStepsParent = $('editorMoveActionSteps');
                    for (var i = 0; i < actionStepsParent.children.length; i += 3) {
                        actionStepsParent.children[i    ].children[1].children[0].value = nodeData && nodeData.actionSteps[i / 3].actionMask || '';
                        actionStepsParent.children[i + 1].children[1].children[0].value = nodeData && nodeData.actionSteps[i / 3].actionType || '';
                        var checkbox = actionStepsParent.children[i + 2].children[1].children[0];
                        if (!nodeData || nodeData.actionSteps[i / 3].isTracking === undefined) {
                            checkbox.indeterminate = true;
                            checkbox.checked = false;
                        } else {
                            checkbox.checked = nodeData.actionSteps[i / 3].isTracking;
                        }
                    }

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

                    initButtonElement( $('addChild'),   onClickAddChild);
                    initButtonElement( $('deleteNode'), onClickDeleteNode);

                    initButtonElement( $('moveNodeUp'),   moveNodeBy.bind(null, -1));
                    initButtonElement( $('moveNodeDown'), moveNodeBy.bind(null,  1));

                },

                updateView: function() {}
            }

        ];


        return {
            init:               initEditor,
            addPlaceholders:    addPlaceholders,
            removePlaceholders: removePlaceholders,
            updateBySelection:  updateBySelection,
            onDataChanged:      onDataChanged
        };


        function createInputForMoveActionSteps(editorGroup, nodeData) {
            var actionStepsParent = $('editorMoveActionSteps');
            actionStepsParent.innerHTML = '';
            var actionSteps = (nodeData.frameData.length - 1) / 2;
            for (var i = 0; i < actionSteps; ++i) {
                createInputForMoveActionStep(editorGroup, actionStepsParent, i);
            }
        }

        function createInputForMoveActionStep(editorGroup, actionStepsParent, actionStepIndex) {

            var tr;

            tr = createTableInputRow(
                Strings('moveActionMask'), '', editorGroup,
                function(inputElement, nodeData) {
                    return readMoveActionStepMask(inputElement, nodeData, actionStepIndex);
                },
                {
                    description: Strings('moveActionMaskDescription'),
                    example: 'mid P'
                }
            );
            actionStepsParent.appendChild(tr);

            tr = createTableInputRow(
                Strings('moveActionType'), '', editorGroup,
                function(inputElement, nodeData) {
                    return readMoveActionStepType(inputElement, nodeData, actionStepIndex);
                },
                {
                    description: Strings('moveActionTypeDescription'),
                    example: 'strike'
                }
            );
            actionStepsParent.appendChild(tr);

            tr = createTableCheckboxRow(
                Strings('moveActionTracking'), false, editorGroup,
                function(inputElement, nodeData) {
                    return readMoveActionStepTracking(inputElement, nodeData, actionStepIndex);
                },
                {
                    description: Strings('moveActionTrackingDescription')
                }
            );
            actionStepsParent.appendChild(tr);

        }


        function createTableRow(leftChildren, rightChildren) {

            var tr = document.createElement('tr');

            var tdLeft = document.createElement('td');
            leftChildren.forEach(function(leftChild) { tdLeft.appendChild(leftChild); });
            tr.appendChild(tdLeft);

            var tdRight = document.createElement('td');
            rightChildren.forEach(function(rightChild) { tdRight.appendChild(rightChild); });
            tr.appendChild(tdRight);

            return tr;

        }


        function createTableInputRow(name, value, editorGroup, changeAction, hints) {

            var label = document.createElement('label');
            label.appendChild(document.createTextNode(name));

            var input = document.createElement('input');
            input.value = value;

            var tr = createTableRow([label], [input]);

            if (hints.description) tr.setAttribute('title', hints.description);
            if (hints.example) input.setAttribute('placeholder', hints.example);

            label.addEventListener('click', function(event) { input.focus(); });

            initInputElement(input, editorGroup, changeAction);

            return tr;

        }


        function createTableCheckboxRow(name, checked, editorGroup, changeAction, hints) {

            var label = document.createElement('label');
            label.appendChild(document.createTextNode(name));

            var input = document.createElement('input');
            input.setAttribute('type', 'checkbox');
            input.checked = checked;

            var indeterminateButton = document.createElement('input');
            indeterminateButton.setAttribute('type', 'button');
            indeterminateButton.setAttribute('value', 'indeterminate');
            indeterminateButton.setAttribute('title', Strings('indeterminateHint'));

            var tr = createTableRow([label], [input, indeterminateButton]);

            if (hints.description) tr.setAttribute('title', hints.description);

            var onChange = initCheckBoxElement(input, editorGroup, changeAction);

            indeterminateButton.addEventListener('click', function(event) {
                input.indeterminate = true;
                onChange.call(this);
            });
            label.addEventListener('click', function(event) {
                input.indeterminate = false;
                input.checked = !input.checked;
                onChange.call(this); 
            });

            return tr;

        }


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


        function initInputElement(inputElement, editorGroup, changeAction) {
            inputElement.addEventListener('input', onInput);
            inputElement.addEventListener('keydown', onInputBlurIfEsc);
            return onInput;
            function onInput(event) {
                changeSelectedNodes(this, editorGroup, changeAction);
            }
        }

        function initCheckBoxElement(checkboxElement, editorGroup, changeAction) {
            checkboxElement.addEventListener('change', onChange);
            return onChange;
            function onChange(event) {
                changeSelectedNodes(this, editorGroup, changeAction);
            }
        }

        function initButtonElement(buttonElement, changeAction) {
            buttonElement.addEventListener('click', onClick);
            return onClick;
            function onClick(event) {
                changeAction();
            }
        }


        function onInputBlurIfEsc(event) {
            if (event.keyCode === keyCodes.ENTER) this.blur();
        }


        function changeSelectedNodes(sourceHTMLElement, editorGroup, changeAction) {

            if (!selectedSVGNode) return;

            var selection = d3.select(selectedSVGNode);
            var nodeView = selection.datum();

            var changed = false;

            var nodeData = nodeView.fd3Data.binding.targetDataNode;
            // if (editorGroup.filter(nodeData)) { // no need?
                changed = changeAction(sourceHTMLElement, nodeData);
            // }

            var update = {
                changed: changed ? [selection] : [],
                added: []
            };

            if (nodeView.fd3Data.binding.isPlaceholder) {
                update.added = onPlaceholderEdited(nodeView);
            }

            onDataChanged.dispatch(update);

        }


        // ==== Readers ====

            // ==== Root ====

                function readCharacterName(inputElement, nodeData) {
                    var changed = nodeData.character !== inputElement.value;
                    nodeData.character = inputElement.value;
                    return changed;
                }


                function readGameVersion(inputElement, nodeData) {
                    var changed = nodeData.version !== inputElement.value;
                    nodeData.version = inputElement.value;
                    return changed;
                }

            // ==============

            // ==== Stance ====

                function readStanceAbbreviation(inputElement, nodeData) {
                    var changed = nodeData.abbreviation !== inputElement.value;
                    nodeData.abbreviation = inputElement.value;
                    return changed;
                }


                function readStanceDescription(inputElement, nodeData) {
                    var changed = nodeData.description !== inputElement.value;
                    nodeData.description = inputElement.value;
                    return changed;
                }


                function readStanceEnding(inputElement, nodeData) {
                    var changed = nodeData.endsWith !== inputElement.value;
                    nodeData.endsWith = inputElement.value;
                    return changed;
                }

            // ================

            // ==== Move ====

                function readMoveInput(inputElement, nodeData) {
                    var changed = nodeData.input !== inputElement.value;
                    nodeData.input = inputElement.value;
                    return changed;
                }


                function readMoveContext(inputElement, nodeData) {

                    var newValue = inputElement.value.split(',').map(function(e) { return e.trim(); });
                    var oldValue = nodeData.context || [];

                    nodeData.context = newValue || undefined;

                    return !_.arraysConsistOfSameStrings(oldValue, newValue);

                }


                function readMoveFrameData(inputElement, nodeData) {

                    var numbers = inputElement.value.match(/\d+/g);
                    var newValue = numbers ? numbers.map(function(e) { return +e; }) : [];
                    var oldValue = nodeData.frameData || [];

                    nodeData.frameData = newValue || undefined;

                    return !_.arraysAreEqual(oldValue, newValue);

                }


                function readMoveEnding(inputElement, nodeData) {

                    var newValue = inputElement.value;
                    var oldValue = nodeData.endsWith;

                    nodeData.endsWith = newValue || undefined;

                    return oldValue !== newValue;

                }


                function readMoveActionStepMask(inputElement, nodeData, actionStepIndex) {
                    var actionStep = nodeData.actionSteps[actionStepIndex];
                    var changed = actionStep.actionMask !== inputElement.value;
                    actionStep.actionMask = inputElement.value;
                    return changed;
                }


                function readMoveActionStepType(inputElement, nodeData, actionStepIndex) {
                    var actionStep = nodeData.actionSteps[actionStepIndex];
                    var changed = actionStep.actionType !== inputElement.value;
                    actionStep.actionType = inputElement.value;
                    return changed;
                }


                function readMoveActionStepTracking(inputElement, nodeData, actionStepIndex) {
                    var actionStep = nodeData.actionSteps[actionStepIndex];
                    var newValue;
                    if (inputElement.indeterminate) {
                        newValue = undefined;
                    } else {
                        newValue = inputElement.checked;
                    }
                    var changed = actionStep.isTracking !== newValue;
                    actionStep.isTracking = newValue;
                    return changed;
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