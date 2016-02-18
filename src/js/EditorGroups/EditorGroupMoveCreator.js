define(

    'EditorGroups/EditorGroupMoveCreator',

    ['EditorGroups/EditorGroup', 'EditorGroups/EditorTools', 'NodeFactory', 'Strings', 'Tools'],

    function(EditorGroup, EditorTools, NodeFactory, Strings, _) {

        return { create: create };

        function create(changeNodes) {

            var editorGroupMove = new EditorGroup(
                'move', _.getDomElement('editorMove'), filter, focus, bindListeners, updateView
            );

            var input             = _.getDomElement('editorMoveInput');
            var context           = _.getDomElement('editorMoveContext');
            var frameData         = _.getDomElement('editorMoveFrameData');
            var ending            = _.getDomElement('editorMoveEnding');
            var actionStepsParent = _.getDomElement('editorMoveActionSteps');

            return editorGroupMove;

            function filter(data) { return data && NodeFactory.isMoveNode(data); }

            function focus() {
                input.select();
                return true;
            }

            function bindListeners() {
                EditorTools.initInputElement(input,     onInputInput);
                EditorTools.initInputElement(context,   onContextInput);
                EditorTools.initInputElement(frameData, onFrameDataInput);
                EditorTools.initInputElement(ending,    onEndingInput);
            }

            function updateView() {

                var editorGroup = this;

                // FIXME: consider differences between matching nodes

                var nodeView = editorGroup.matchingSelectedViews[0];
                var nodeData = nodeView.fd3Data.binding.targetDataNode;

                console.assert(!!nodeData, 'nodeData is not expected to be falsy');

                var actionStepsAmount = Math.max(
                    nodeData.actionSteps.length,
                    NodeFactory.getActionStepsAmount(nodeData.frameData)
                );
                resetActionStepsDOM(actionStepsAmount);

                input.value     = nodeData && nodeData.input               || '';
                frameData.value = nodeData && nodeData.frameData.join(' ') || '';
                ending.value    = nodeData && nodeData.endsWith            || '';
                context.value   = nodeData && nodeData.context.join(', ')  || '';

                var row;
                for (var i = 0; i < actionStepsParent.children.length; i += 4) {

                    var actionStep = nodeData && nodeData.actionSteps[i / 3] || null;

                    row = actionStepsParent.children[i];
                    row.children[1].children[0].value = nodeData && actionStep.actionMask || '';

                    row = actionStepsParent.children[i + 1];
                    row.children[1].children[0].value = nodeData && actionStep.actionType || '';

                    row = actionStepsParent.children[i + 2];
                    var checkbox = row.children[1].children[0];
                    if (!nodeData || actionStep.isTracking === undefined) {
                        checkbox.indeterminate = true;
                        checkbox.checked = false;
                    } else {
                        checkbox.checked = actionStep.isTracking;
                    }

                    row = actionStepsParent.children[i + 3];
                    row.children[1].children[0].value = nodeData && actionStep.damage || '';
                    
                    // row = actionStepsParent.children[i + 3];
                    // row.children[1].children[0].value = nodeData && actionStep.condition.join(', ') || '';

                    // row = actionStepsParent.children[i + 4];
                    // row.children[1].children[0].value = nodeData && actionStep.tags.join(', ') || '';

                }

            }

            //

            function resetActionStepsDOM(actionStepsAmount) {
                actionStepsParent.innerHTML = '';
                for (var i = 0; i < actionStepsAmount; ++i) {
                    createActionStepDOM(actionStepsParent, i);
                }
            }

            function createActionStepDOM(parent, actionStepIndex) {

                var tr;

                var emptyValue = '';

                tr = createRowWithLabelAndInput(
                    Strings('moveActionMask'), emptyValue,
                    function onActionStepMaskInput(event) {
                        var inputElement = this;
                        changeNodes(inputElement, editorGroupMove, function(inputElement, nodeData) {
                            setActionStepMaskFromInput(inputElement, nodeData, actionStepIndex);
                        });
                    },
                    {
                        description: Strings('moveActionMaskDescription'),
                        example: 'e.g. mid P'
                    }
                );
                parent.appendChild(tr);

                tr = createRowWithLabelAndInput(
                    Strings('moveActionType'), emptyValue,
                    function onActionStepTypeInput(event) {
                        var inputElement = this;
                        changeNodes(inputElement, editorGroupMove, function(inputElement, nodeData) {
                            setActionStepTypeFromInput(inputElement, nodeData, actionStepIndex);
                        });
                    },
                    {
                        description: Strings('moveActionTypeDescription'),
                        example: 'e.g. strike'
                    }
                );
                parent.appendChild(tr);

                tr = createRowWithLabelAndTristateCheckbox(
                    Strings('moveActionTracking'), false,
                    function onActionStepTrackingChange(event) {
                        var inputElement = this;
                        changeNodes(inputElement, editorGroupMove, function(inputElement, nodeData) {
                            setActionStepTrackingFromCheckbox(
                                inputElement, nodeData, actionStepIndex
                            );
                        });
                    },
                    { description: Strings('moveActionTrackingDescription') }
                );
                parent.appendChild(tr);

                tr = createRowWithLabelAndInput(
                    Strings('moveActionDamage'), emptyValue,
                    function onActionStepDamageInput(event) {
                        var inputElement = this;
                        changeNodes(inputElement, editorGroupMove, function(inputElement, nodeData) {
                            setActionStepDamageFromInput(inputElement, nodeData, actionStepIndex);
                        });
                    },
                    {
                        description: Strings('moveActionDamageDescription'),
                        example: 'e.g. 18'
                    }
                );
                parent.appendChild(tr);

                // tr = createRowWithLabelAndInput(
                //     Strings('moveActionCondition'), emptyValue,
                //     function onActionStepConditionInput(event) {
                //         var inputElement = this;
                //         changeNodes(inputElement, editorGroupMove, function(inputElement, nodeData) {
                //             setActionStepConditionFromInput(inputElement, nodeData, actionStepIndex);
                //         });
                //     },
                //     {
                //         description: Strings('moveActionConditionDescription'),
                //         example: 'e.g. neutral/open, stun/open'
                //     }
                // );
                // parent.appendChild(tr);

                // tr = createRowWithLabelAndInput(
                //     Strings('moveActionTags'), emptyValue,
                //     function onActionStepTagsInput(event) {
                //         var inputElement = this;
                //         changeNodes(inputElement, editorGroupMove, function(inputElement, nodeData) {
                //             setActionStepTagsFromInput(inputElement, nodeData, actionStepIndex);
                //         });
                //     },
                //     {
                //         description: Strings('moveActionTagsDescription'),
                //         example: 'e.g. sit-down stun'
                //     }
                // );
                // parent.appendChild(tr);

            }


            // FIXME


            function onInputInput(event) {
                var inputElement = this;
                changeNodes(inputElement, editorGroupMove, setInputFromInput);
            }
            function onContextInput(event) {
                var inputElement = this;
                changeNodes(inputElement, editorGroupMove, setContextFromInput);
            }
            function onFrameDataInput(event) {
                var inputElement = this;
                changeNodes(inputElement, editorGroupMove, setFrameDataFromInput);
            }
            function onEndingInput(event) {
                var inputElement = this;
                changeNodes(inputElement, editorGroupMove, setEndingFromInput);
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

                nodeData.context = newValue;

                return !_.arraysConsistOfSameStrings(oldValue, newValue);

            }

            function mapTrim(element, index, array) { return element.trim(); }


            function setFrameDataFromInput(inputElement, nodeData) {

                var numbers = inputElement.value.match(/\d+/g);
                var newValue = numbers ? numbers.map(mapStrToInt) : [];
                var oldValue = nodeData.frameData || [];

                nodeData.frameData = newValue;

                var changed = !_.arraysAreEqual(oldValue, newValue);

                // FIXME: don't delete action step while user edits frame data
                // FIXME: update dom to edit newly added action steps
                var oldActionStepsAmount = nodeData.actionSteps.length;
                var newActionStepsAmount = NodeFactory.getActionStepsAmount(newValue);
                // if (oldActionStepsAmount > newActionStepsAmount) {
                //     changed = true;
                //     nodeData.actionSteps.length = newActionStepsAmount;
                // } else
                if (oldActionStepsAmount < newActionStepsAmount)
                {
                    changed = true;
                    for (var i = oldActionStepsAmount; i < newActionStepsAmount; ++i) {
                        nodeData.actionSteps.push(NodeFactory.createMoveActionStep());
                    }
                }

                return changed;

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

            function setActionStepDamageFromInput(inputElement, nodeData, actionStepIndex) {
                var actionStep = nodeData.actionSteps[actionStepIndex];
                var newDamage = parseInt(inputElement.value, 10);
                var changed = actionStep.damage !== newDamage;
                actionStep.damage = newDamage;
                return changed;
            }

            // function setActionStepConditionFromInput(inputElement, nodeData, actionStepIndex) {
            //     var actionStep = nodeData.actionSteps[actionStepIndex];
            //     var newConditions = inputElement.value.split(/,\s*/);
            //     var changed = _.arraysConsistOfSameStrings(actionStep.condition, newConditions);
            //     actionStep.condition = newConditions;
            //     return changed;
            // }

            // function setActionStepTagsFromInput(inputElement, nodeData, actionStepIndex) {
            //     var actionStep = nodeData.actionSteps[actionStepIndex];
            //     var newTags = inputElement.value.split(/,\s*/);
            //     var changed = _.arraysConsistOfSameStrings(actionStep.tags, newTags);
            //     actionStep.tags = newTags;
            //     return changed;
            // }


            // DOM helpers


            function createRowWithLabelAndInput(name, value, onInput, hints) {

                var label = document.createElement('label');
                label.appendChild(document.createTextNode(name));

                var input = document.createElement('input');
                input.value = value;

                var tr = createTableRow([label], [input]);

                tr.setAttribute('title', hints.description);
                input.setAttribute('placeholder', hints.example);

                label.addEventListener('click', function(event) { input.focus(); });

                EditorTools.initInputElement(input, onInput);

                return tr;

            }


            function createRowWithLabelAndTristateCheckbox(name, checked, onChange, hints) {

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

                tr.setAttribute('title', hints.description);

                input.addEventListener('change', onChange);

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

        }

    }

);