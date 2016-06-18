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
            input:     0,
            context:   1,
            frameData: 2,
            ending:    3
        };
        var lastSelectedInput = inputEnum.input;

        return { create: create };

        function create(changeNodes) {

            var editorGroupMove = new EditorGroup('move', filter, focus, updateView);

            var input = TableRowInput.create({
                name: Strings('moveInput'),
                description: Strings('moveInputDescription'),
                placeholder: Strings('moveInputPlaceholder'),
                onInput: function onMoveInputInput(newValue) {
                    changeNodes(editorGroupMove, function(nodeData) {
                        return changeInput(newValue, nodeData);
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
                        return changeContext(newValue, nodeData);
                    });
                },
                onFocus: function onMoveContextFocus(event) {
                    MoveActionStep.resetLastSelectedInput();
                    lastSelectedInput = inputEnum.context;
                }
            });

            editorGroupMove.domRoot.appendChild(input.domRoot);
            editorGroupMove.domRoot.appendChild(frameData.domRoot);
            editorGroupMove.domRoot.appendChild(actionStepsParentRow);
            editorGroupMove.domRoot.appendChild(ending.domRoot);
            editorGroupMove.domRoot.appendChild(context.domRoot);

            var actionStepInputs = [];

            return editorGroupMove;

            function filter(data) { return data && NodeFactory.isMoveNode(data); }

            function clear() {
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
                                return changed;
                            });
                        }
                    }());
                }
            }

            function updateMoveInputs(nodeData) {
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


            // readers


            function changeInput(newValue, nodeData) {
                var oldValue = nodeData.input;
                nodeData.input = newValue.trim();
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