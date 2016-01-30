define(

    'editorGroups/editorGroupMoveCreator',

    ['editorGroups/EditorGroup', 'editorGroups/editorTools', 'node', 'Strings', 'tools'],

    function(EditorGroup, editorTools, node, Strings, _) {

        return { create: create };

        function create(changeNodes) {

            var editorGroup = new EditorGroup(
                'move', _.getDomElement('editorMove'), filter, focus, bindListeners, updateView
            );

            var input             = _.getDomElement('editorMoveInput');
            var context           = _.getDomElement('editorMoveContext');
            var frameData         = _.getDomElement('editorMoveFrameData');
            var ending            = _.getDomElement('editorMoveEnding');
            var actionStepsParent = _.getDomElement('editorMoveActionSteps');

            return editorGroup;

            function filter(data) { return data && node.isMoveNode(data); }

            function focus() {
                input.select();
                return true;
            }

            function bindListeners() {
                editorTools.initInputElement(input,     onInputInput);
                editorTools.initInputElement(context,   onContextInput);
                editorTools.initInputElement(frameData, onFrameDataInput);
                editorTools.initInputElement(ending,    onEndingInput);
            }

            function updateView() {

                // FIXME: consider differences between matching nodes

                var nodeView = this.matchingSelectedViews[0];
                var nodeData = nodeView.fd3Data.binding.targetDataNode;

                createInput(this, nodeData);

                input.value     = nodeData && nodeData.input               || '';
                frameData.value = nodeData && nodeData.frameData.join(' ') || '';
                ending.value    = nodeData && nodeData.endsWith            || '';
                context.value   = nodeData && nodeData.context.join(', ')  || '';

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

            function createInput(editorGroup, nodeData) {
                actionStepsParent.innerHTML = '';
                var actionSteps = (nodeData.frameData.length - 1) / 2;
                for (var i = 0; i < actionSteps; ++i) {
                    createInputForMoveActionStep(editorGroup, actionStepsParent, i);
                }
            }

            function createInputForMoveActionStep(editorGroup, actionStepsParent, actionStepIndex) {

                var tr;

                var emptyValue = '';

                tr = createTableInputRow(
                    Strings('moveActionMask'), emptyValue,
                    function onActionStepsMaskInput(event) {
                        var inputElement = this;
                        changeNodes(inputElement, editorGroup, function(inputElement, nodeData) {
                            setActionStepMaskFromInput(inputElement, nodeData, actionStepIndex);
                        });
                    },
                    {
                        description: Strings('moveActionMaskDescription'),
                        example: 'mid P'
                    }
                );
                actionStepsParent.appendChild(tr);

                tr = createTableInputRow(
                    Strings('moveActionType'), emptyValue,
                    function onActionStepsTypeInput(event) {
                        var inputElement = this;
                        changeNodes(inputElement, editorGroup, function(inputElement, nodeData) {
                            setActionStepTypeFromInput(inputElement, nodeData, actionStepIndex);
                        });
                    },
                    {
                        description: Strings('moveActionTypeDescription'),
                        example: 'strike'
                    }
                );
                actionStepsParent.appendChild(tr);

                tr = createTableCheckboxRow(
                    Strings('moveActionTracking'), false,
                    function onActionStepsTrackingChange(event) {
                        var inputElement = this;
                        changeNodes(inputElement, editorGroup, function(inputElement, nodeData) {
                            setActionStepTrackingFromCheckbox(inputElement, nodeData, actionStepIndex);
                        });
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


            function createTableInputRow(name, value, onInput, optHints) {

                var label = document.createElement('label');
                label.appendChild(document.createTextNode(name));

                var input = document.createElement('input');
                input.value = value;

                var tr = createTableRow([label], [input]);

                if (optHints) {
                    if (optHints.description) tr    .setAttribute('title',       optHints.description);
                    if (optHints.example)     input .setAttribute('placeholder', optHints.example);
                }

                label.addEventListener('click', function(event) { input.focus(); });

                editorTools.initInputElement(input, onInput);

                return tr;

            }


            function createTableCheckboxRow(name, checked, changeAction, hints) {

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

                input.addEventListener('change', changeAction);

                indeterminateButton.addEventListener('click', function(event) {
                    input.indeterminate = true;
                    changeAction.call(this);
                });
                label.addEventListener('click', function(event) {
                    input.indeterminate = false;
                    input.checked = !input.checked;
                    changeAction.call(this); 
                });

                return tr;

            }


            // FIXME


            function onInputInput(event) {
                var inputElement = this;
                changeNodes(inputElement, editorGroup, setInputFromInput);
            }
            function onContextInput(event) {
                var inputElement = this;
                changeNodes(inputElement, editorGroup, setContextFromInput);
            }
            function onFrameDataInput(event) {
                var inputElement = this;
                changeNodes(inputElement, editorGroup, setFrameDataFromInput);
            }
            function onEndingInput(event) {
                var inputElement = this;
                changeNodes(inputElement, editorGroup, setEndingFromInput);
            }


            // readers


            function setInputFromInput(inputElement, nodeData) {
                var changed = nodeData.input !== inputElement.value;
                nodeData.input = inputElement.value;
                return changed;
            }


            function setContextFromInput(inputElement, nodeData) {

                var newValue = inputElement.value.split(',').map(mapTrim);
                var oldValue = nodeData.context || [];

                nodeData.context = newValue || undefined;

                return !_.arraysConsistOfSameStrings(oldValue, newValue);

            }

            function mapTrim(element, index, array) { return element.trim(); }


            function setFrameDataFromInput(inputElement, nodeData) {

                var numbers = inputElement.value.match(/\d+/g);
                var newValue = numbers ? numbers.map(mapStrToInt) : [];
                var oldValue = nodeData.frameData || [];

                nodeData.frameData = newValue || undefined;

                return !_.arraysAreEqual(oldValue, newValue);

            }

            function mapStrToInt(element, index, array) { return +element; }


            function setEndingFromInput(inputElement, nodeData) {

                var newValue = inputElement.value;
                var oldValue = nodeData.endsWith;

                nodeData.endsWith = newValue || undefined;

                return oldValue !== newValue;

            }


            function setActionStepMaskFromInput(inputElement, nodeData, actionStepIndex) {
                var actionStep = nodeData.actionSteps[actionStepIndex];
                var changed = actionStep.actionMask !== inputElement.value;
                actionStep.actionMask = inputElement.value;
                return changed;
            }


            function setActionStepTypeFromInput(inputElement, nodeData, actionStepIndex) {
                var actionStep = nodeData.actionSteps[actionStepIndex];
                var changed = actionStep.actionType !== inputElement.value;
                actionStep.actionType = inputElement.value;
                return changed;
            }


            function setActionStepTrackingFromCheckbox(inputElement, nodeData, actionStepIndex) {
                var actionStep = nodeData.actionSteps[actionStepIndex];
                var newValue = inputElement.indeterminate ? undefined : inputElement.checked;
                var changed = actionStep.isTracking !== newValue;
                actionStep.isTracking = newValue;
                return changed;
            }

        }

    }

);