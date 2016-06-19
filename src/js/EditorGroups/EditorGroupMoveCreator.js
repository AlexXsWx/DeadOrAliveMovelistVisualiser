define(

    'EditorGroups/EditorGroupMoveCreator',

    [
        'EditorGroups/EditorGroup',
        'EditorGroups/MoveActionStep',
        'UI/TableRowInput',
        'NodeFactory',
        'Strings',
        'Tools'
    ],

    function EditorGroupMoveCreator(
        EditorGroup,
        MoveActionStep,
        TableRowInput,
        NodeFactory,
        Strings,
        _
    ) {

        var inputEnum = {
            summary:   0,
            input:     1,
            context:   2,
            frameData: 3,
            ending:    4
        };
        var lastSelectedInput = inputEnum.summary;

        return { create: create };

        function create(changeNodes) {

            var editorGroupMove = new EditorGroup('move', filter, focus, updateView);

            // FIXME: Esc is bugged
            var summary = TableRowInput.create({
                name: Strings('moveSummary'),
                description: Strings('moveSummaryDescription'),
                placeholder: Strings('moveSummaryPlaceholder'),
                onInput: function onMoveSummaryInput(newValue) {
                    changeNodes(editorGroupMove, function(nodeData) {
                        return changeSummary(newValue, nodeData);
                    });
                },
                onFocus: function onMoveSummaryFocus(event) {
                    MoveActionStep.resetLastSelectedInput();
                    lastSelectedInput = inputEnum.summary;
                }
            });

            var input = TableRowInput.create({
                name: Strings('moveInput'),
                description: Strings('moveInputDescription'),
                placeholder: Strings('moveInputPlaceholder'),
                onInput: function onMoveInputInput(newValue) {
                    changeNodes(editorGroupMove, function(nodeData) {
                        var changed = changeInput(newValue, nodeData);
                        updateMoveSummaryInputValue(nodeData);
                        return changed;
                    });
                },
                onFocus: function onMoveInputFocus(event) {
                    MoveActionStep.resetLastSelectedInput();
                    lastSelectedInput = inputEnum.input;
                }
            });

            var frameData = TableRowInput.create({
                name: Strings('moveFrameData'),
                description: Strings('moveFrameDataDescription'),
                placeholder: Strings('moveFrameDataPlaceholder'),
                onInput: function onMoveFrameDataInput(newValue) {
                    changeNodes(editorGroupMove, function(nodeData) {
                        return changeFrameData(newValue, nodeData);
                    });
                },
                onFocus: function onMoveFrameDataFocus(event) {
                    MoveActionStep.resetLastSelectedInput();
                    lastSelectedInput = inputEnum.frameData;
                }
            });

            var actionStepsParent = _.createDomElement({ tag: 'table' });

            var actionStepsParentRow = _.createMergedRow(2, [
                _.createDomElement({
                    tag: 'label',
                    attributes: { 'title': Strings('moveActionStepsDescription') },
                    children: [
                        _.createTextNode(Strings('moveActionSteps'))
                    ]
                }),
                actionStepsParent
            ]);

            var ending = TableRowInput.create({
                name: Strings('moveEnding'),
                description: Strings('moveEndingDescription'),
                placeholder: Strings('moveEndingPlaceholder'),
                onInput: function onMoveEndingInput(newValue) {
                    changeNodes(editorGroupMove, function(nodeData) {
                        return changeEnding(newValue, nodeData);
                    });
                },
                onFocus: function onMoveEndingFocus(event) {
                    MoveActionStep.resetLastSelectedInput();
                    lastSelectedInput = inputEnum.ending;
                }
            });

            var context = TableRowInput.create({
                name: Strings('moveContext'),
                description: Strings('moveContextDescription'),
                placeholder: Strings('moveContextPlaceholder'),
                onInput: function onMoveContextInput(newValue) {
                    changeNodes(editorGroupMove, function(nodeData) {
                        var changed = changeContext(newValue, nodeData);
                        updateMoveSummaryInputValue(nodeData);
                        return changed;
                    });
                },
                onFocus: function onMoveContextFocus(event) {
                    MoveActionStep.resetLastSelectedInput();
                    lastSelectedInput = inputEnum.context;
                }
            });

            editorGroupMove.domRoot.appendChild(summary.domRoot);
            editorGroupMove.domRoot.appendChild(context.domRoot);
            editorGroupMove.domRoot.appendChild(input.domRoot);
            editorGroupMove.domRoot.appendChild(ending.domRoot);
            editorGroupMove.domRoot.appendChild(frameData.domRoot);
            editorGroupMove.domRoot.appendChild(actionStepsParentRow);

            var actionStepInputs = [];

            return editorGroupMove;

            function filter(data) { return data && NodeFactory.isMoveNode(data); }

            function clear() {
                summary.setValue('');
                input.setValue('');
                frameData.setValue('');
                ending.setValue('');
                context.setValue('');
                _.removeAllChildren(actionStepsParent);
                actionStepInputs = [];
            }

            function focus() {

                if (!(actionStepInputs.length > 0 && actionStepInputs[0].focus())) {
                    switch (lastSelectedInput) {
                        case inputEnum.summary:   summary.focus();   break;
                        case inputEnum.input:     input.focus();     break;
                        case inputEnum.context:   context.focus();   break;
                        case inputEnum.frameData: frameData.focus(); break;
                        case inputEnum.ending:    ending.focus();    break;
                    }
                }

                return true;

            }

            function updateView() {

                var editorGroup = this;

                // FIXME: consider differences between matching nodes

                var nodeView = editorGroup.matchingSelectedViews[0];
                var nodeData = nodeView.binding.targetDataNode;

                console.assert(!!nodeData, 'nodeData is not expected to be falsy');

                if (!nodeData) {
                    clear();
                    return;
                }

                var actionStepsAmount = Math.max(
                    nodeData.actionSteps.length,
                    NodeFactory.getActionStepsAmount(nodeData.frameData)
                );
                recreateActionStepInputs(actionStepsAmount);

                updateMoveInputs(nodeData);

            }

            function recreateActionStepInputs(actionStepsAmount) {
                actionStepInputs = [];
                _.removeAllChildren(actionStepsParent);
                for (var i = 0; i < actionStepsAmount; ++i) {
                    (function() {
                        var actionStepIndex = i;
                        var actionStepInput = MoveActionStep.create(changeActionStep);
                        actionStepInputs[actionStepIndex] = actionStepInput;
                        actionStepsParent.appendChild(actionStepInput.domRoot);
                        function changeActionStep(changeActionStepProperty) {
                            return changeNodes(editorGroupMove, function(nodeData) {
                                var actionStep = nodeData.actionSteps[actionStepIndex];
                                var changed = changeActionStepProperty(actionStep);
                                if (changed) actionStepInput.fillFromActionStep(actionStep);
                                updateMoveSummaryInputValue(nodeData);
                                return changed;
                            });
                        }
                    }());
                }
            }

            function updateMoveInputs(nodeData) {
                updateMoveSummaryInputValue(nodeData, true);
                input.setValue(nodeData.input || '');
                frameData.setValue(nodeData.frameData.join(' ') || '');
                ending.setValue(nodeData.endsWith || '');
                context.setValue(nodeData.context.join(', ') || '');

                updateActionStepInputs(nodeData);
            }

            function updateActionStepInputs(nodeData) {
                for (var i = 0; i < actionStepInputs.length; ++i) {
                    var actionStep = nodeData && nodeData.actionSteps[i] || null;
                    actionStepInputs[i].fillFromActionStep(actionStep);
                }
            }

            function updateMoveSummaryInputValue(nodeData, optForceUpdate) {
                if (optForceUpdate || document.activeElement !== summary.input) {
                    summary.setValue(NodeFactory.getMoveSummary(nodeData));
                }
            }


            // readers


            function changeSummary(newValue, nodeData) {

                var rest = newValue.trim();
                var parts = rest.split(':');
                if (parts.length > 1) {
                    context.setValue(parts[0], true);
                    rest = parts[1].trim();
                } else {
                    context.setValue('', true);
                }

                var inputData = rest;
                var actionStepSummary = '';
                parts = rest.split(' ');
                if (parts.length > 1) {
                    inputData = parts.slice(0, parts.length - 1).join(' ');
                    actionStepSummary = parts[parts.length - 1];
                }

                input.setValue(inputData, true);

                if (actionStepSummary) {
                    console.assert(nodeData.actionSteps.length > 0, 'move has no actions steps');
                    actionStepInputs[0].changeActionSummary(
                        actionStepSummary,
                        nodeData.actionSteps[0]
                    );
                }

                return false;

            }


            function changeInput(newValue, nodeData) {
                var oldValue = nodeData.input;
                nodeData.input = newValue.trim().toUpperCase().replace(/AP/g, 'Ap');
                return oldValue !== newValue;
            }


            function changeContext(newValueRaw, nodeData) {

                var newValue = newValueRaw.split(/\s*,\s*/);
                var oldValue = nodeData.context || [];

                nodeData.context = newValue;

                return !_.arraysConsistOfSameStrings(oldValue, newValue);

            }


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


            function changeEnding(newValue, nodeData) {
                var oldValue = nodeData.endsWith;
                nodeData.endsWith = newValue || undefined;
                return oldValue !== newValue;
            }


            function mapStrToInt(element, index, array) { return +element; }

        }

    }

);