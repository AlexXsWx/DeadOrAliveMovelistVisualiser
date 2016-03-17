define(

    'EditorGroups/EditorGroupMoveCreator',

    [
        'EditorGroups/EditorGroup',
        'Input/InputHelper',
        'UI/TableRowInput',
        'UI/TableRowTristateCheckbox',
        'NodeFactory',
        'Strings',
        'Tools'
    ],

    function(
        EditorGroup,
        InputHelper,
        TableRowInput,
        TableRowTristateCheckbox,
        NodeFactory,
        Strings,
        _
    ) {

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
                InputHelper.initInputElement(input,     onInputInput);
                InputHelper.initInputElement(context,   onContextInput);
                InputHelper.initInputElement(frameData, onFrameDataInput);
                InputHelper.initInputElement(ending,    onEndingInput);
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

                updateMoveInputs(nodeData);

            }

            function updateMoveInputs(nodeData) {
                input.value     = nodeData && nodeData.input               || '';
                frameData.value = nodeData && nodeData.frameData.join(' ') || '';
                ending.value    = nodeData && nodeData.endsWith            || '';
                context.value   = nodeData && nodeData.context.join(', ')  || '';

                updateActionStepInputs(nodeData);
            }

            function updateActionStepInputs(nodeData) {

                var row;
                for (var i = 0; i < actionStepsParent.children.length; i += 5) {

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

                    updateActionStepResultInputs(nodeData, actionStepsParent.children[i + 4]);

                }

            }

            function updateActionStepResultInputs(nodeData, domParent) {

            }

            //

            function resetActionStepsDOM(actionStepsAmount) {
                actionStepsParent.innerHTML = '';
                for (var i = 0; i < actionStepsAmount; ++i) {
                    createActionStepDOM(actionStepsParent, i);
                }
            }

            function createActionStepDOM(parent, actionStepIndex) {

                var maskInput = TableRowInput.create({
                    name: Strings('moveActionMask'),
                    description: Strings('moveActionMaskDescription'),
                    placeholder: 'e.g. mid P',
                    onInput: function onActionStepMaskInput(newValue) {
                        changeNodes(editorGroupMove, function(nodeData) {
                            return changeActionMask(newValue, nodeData, actionStepIndex);
                        });
                    }
                });
                parent.appendChild(maskInput.domRoot);

                var actionTypeInput = TableRowInput.create({
                    name: Strings('moveActionType'),
                    onInput: function onActionStepTypeInput(newValue) {
                        changeNodes(editorGroupMove, function(nodeData) {
                            return changeActionStepType(newValue, nodeData, actionStepIndex);
                        });
                    },
                    description: Strings('moveActionTypeDescription'),
                    placeholder: 'e.g. strike'
                });
                parent.appendChild(actionTypeInput.domRoot);

                var trackingInput = TableRowTristateCheckbox.create({
                    name: Strings('moveActionTracking'),
                    isIndeterminate: true,
                    onChange: function onActionStepTrackingChange(isChecked, isIndeterminate) {
                        changeNodes(editorGroupMove, function(nodeData) {
                            return changeActionStepTracking(
                                isChecked, isIndeterminate, nodeData, actionStepIndex
                            );
                        });
                    },
                    description: Strings('moveActionTrackingDescription')
                });
                parent.appendChild(trackingInput.domRoot);

                var damageInput = TableRowInput.create({
                    name: Strings('moveActionDamage'),
                    onInput: function onActionStepDamageInput(event) {
                        changeNodes(editorGroupMove, function(nodeData) {
                            return changeActionStepDamage(newValue, nodeData, actionStepIndex);
                        });
                    },
                    description: Strings('moveActionDamageDescription'),
                    placeholder: 'e.g. 18'
                });
                parent.appendChild(damageInput.domRoot);

                // var actionConditionInput = TableRowInput.create({
                //     name: Strings('moveActionCondition'),
                //     onInput: function onActionStepConditionInput(newValue) {
                //         changeNodes(editorGroupMove, function(nodeData) {
                //             return changeActionStepCondition(newValue, nodeData, actionStepIndex);
                //         });
                //     },
                //     description: Strings('moveActionConditionDescription'),
                //     placeholder: 'e.g. neutral/open, stun/open'
                // });
                // parent.appendChild(actionConditionInput.domRoot);

                // var actionTagsInput = TableRowInput.create({
                //     name: Strings('moveActionTags'),
                //     onInput: function onActionStepTagsInput(newValue) {
                //         changeNodes(editorGroupMove, function(nodeData) {
                //             return changeActionStepTags(newValue, nodeData, actionStepIndex);
                //         });
                //     },
                //     description: Strings('moveActionTagsDescription'),
                //     placeholder: 'e.g. sit-down stun'
                // });
                // parent.appendChild(actionTagsInput.domRoot);

                tr = _.createDomElement({
                    tag: 'tr',
                    attributes: { 'colspan': 2 },
                    children: [ createActionStepResultDOM() ]
                });
                parent.appendChild(tr);

            }


            function createActionStepResultDOM() {
                return _.createDomElement({
                    tag: 'table',
                    children: [

                    ]
                });
            }


            // FIXME


            function onInputInput(event) {
                var inputElement = this;
                var newValue = inputElement.value;
                changeNodes(editorGroupMove, function(nodeData) {
                    return changeInput(newValue, nodeData);
                });
            }
            function onContextInput(event) {
                var inputElement = this;
                var newValue = inputElement.value;
                changeNodes(editorGroupMove, function(nodeData) {
                    return changeContext(newValue, nodeData);
                });
            }
            function onFrameDataInput(event) {
                var inputElement = this;
                var newValue = inputElement.value;
                changeNodes(editorGroupMove, function(nodeData) {
                    return changeFrameData(newValue, nodeData);
                });
            }
            function onEndingInput(event) {
                var inputElement = this;
                var newValue = inputElement.value;
                changeNodes(editorGroupMove, function(nodeData) {
                    return changeEnding(newValue, nodeData);
                });
            }


            // readers


            function changeInput(newValue, nodeData) {
                var oldValue = nodeData.input;
                nodeData.input = newValue;
                return oldValue !== newValue;
            }


            function changeContext(newValueRaw, nodeData) {

                var newValue = newValueRaw.split(',').map(mapTrim);
                var oldValue = nodeData.context || [];

                nodeData.context = newValue;

                return !_.arraysConsistOfSameStrings(oldValue, newValue);

            }

            function mapTrim(element, index, array) { return element.trim(); }


            function changeFrameData(newValueRaw, nodeData) {

                var numbers = newValueRaw.match(/\d+/g);
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
                if (oldActionStepsAmount < newActionStepsAmount) {
                    changed = true;
                    for (var i = oldActionStepsAmount; i < newActionStepsAmount; ++i) {
                        nodeData.actionSteps.push(NodeFactory.createMoveActionStep());
                    }
                }

                return changed;

            }

            function mapStrToInt(element, index, array) { return +element; }


            function changeEnding(newValue, nodeData) {
                var oldValue = nodeData.endsWith;
                nodeData.endsWith = newValue || undefined;
                return oldValue !== newValue;
            }


            function changeActionMask(newValue, nodeData, actionStepIndex) {
                var actionStep = nodeData.actionSteps[actionStepIndex];
                var oldValue = actionStep.actionMask;
                actionStep.actionMask = newValue;
                return oldValue !== newValue;
            }


            function changeActionStepType(newValue, nodeData, actionStepIndex) {
                var actionStep = nodeData.actionSteps[actionStepIndex];
                var oldValue = actionStep.actionType;
                actionStep.actionType = newValue;
                return oldValue !== newValue;
            }


            function changeActionStepTracking(isChecked, isIndeterminate, nodeData, actionStepIndex) {
                var actionStep = nodeData.actionSteps[actionStepIndex];
                var newValue = isIndeterminate ? undefined : isChecked;
                var oldValue = actionStep.isTracking;
                actionStep.isTracking = newValue;
                return oldValue !== newValue;
            }

            function changeActionStepDamage(newValue, nodeData, actionStepIndex) {
                var actionStep = nodeData.actionSteps[actionStepIndex];
                var newDamage = parseInt(newValue, 10);
                var oldValue = actionStep.damage;
                actionStep.damage = newDamage;
                return oldValue !== newDamage;
            }

            // function changeActionStepCondition(newValue, nodeData, actionStepIndex) {
            //     var actionStep = nodeData.actionSteps[actionStepIndex];
            //     var newConditions = newValue.split(/,\s*/);
            //     var changed = _.arraysConsistOfSameStrings(actionStep.condition, newConditions);
            //     actionStep.condition = newConditions;
            //     return changed;
            // }

            // function changeActionStepTags(newValue, nodeData, actionStepIndex) {
            //     var actionStep = nodeData.actionSteps[actionStepIndex];
            //     var newTags = newValue.split(/,\s*/);
            //     var changed = _.arraysConsistOfSameStrings(actionStep.tags, newTags);
            //     actionStep.tags = newTags;
            //     return changed;
            // }

        }

    }

);