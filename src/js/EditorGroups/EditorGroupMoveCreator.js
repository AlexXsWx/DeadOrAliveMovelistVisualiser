define(

    'EditorGroups/EditorGroupMoveCreator',

    [
        'EditorGroups/EditorGroup',
        'EditorGroups/EditorCreatorBase',
        'EditorGroups/MoveActionStep',
        'NodeFactory',
        'Strings',
        'Tools'
    ],

    function EditorGroupMoveCreator(
        EditorGroup,
        EditorCreatorBase,
        MoveActionStep,
        NodeFactory,
        Strings,
        _
    ) {

        return { create: create };

        function create(selectedNodesModifier) {

            var reusedInputIds = {
                context: 'context',
                input:   'input'
            };

            var inputs = [
                {
                    // FIXME: Esc is bugged
                    id: 'summary',
                    inputType: EditorCreatorBase.INPUT_TYPES.text,
                    label: Strings('moveSummary'),
                    description: Strings('moveSummaryDescription'),
                    placeholderText: Strings('moveSummaryPlaceholder'),
                    fill: summaryToText,
                    parameterModifier: changeSummary,
                    // isSummary: True
                }, {
                    id: reusedInputIds.context,
                    inputType: EditorCreatorBase.INPUT_TYPES.text,
                    label: Strings('moveContext'),
                    description: Strings('moveContextDescription'),
                    placeholderText: Strings('moveContextPlaceholder'),
                    fill: contextToText,
                    parameterModifier: changeContext,
                    // optIncludedInSummaries: { 'summary': updateMoveSummaryInputValue }
                }, {
                    id: reusedInputIds.input,
                    inputType: EditorCreatorBase.INPUT_TYPES.text,
                    label: Strings('moveInput'),
                    description: Strings('moveInputDescription'),
                    placeholderText: Strings('moveInputPlaceholder'),
                    fill: inputToText,
                    parameterModifier: changeInput,
                    // optIncludedInSummaries: { 'summary': updateMoveSummaryInputValue }
                }, {
                    id: 'ending',
                    inputType: EditorCreatorBase.INPUT_TYPES.text,
                    label: Strings('moveEnding'),
                    description: Strings('moveEndingDescription'),
                    placeholderText: Strings('moveEndingPlaceholder'),
                    fill: endingToText,
                    parameterModifier: changeEnding
                }, {
                    id: 'frameData',
                    inputType: EditorCreatorBase.INPUT_TYPES.text,
                    label: Strings('moveFrameData'),
                    description: Strings('moveFrameDataDescription'),
                    placeholderText: Strings('moveFrameDataPlaceholder'),
                    fill: frameDataToText,
                    parameterModifier: changeFrameData
                }
            ];

            var editorGroupMove2 = EditorCreatorBase.createEditorCreator({
                id: 'move',
                inputs: inputs,
                selectedNodesModifier: selectedNodesModifier,
                childrenStuff: {
                    name: Strings('moveActionSteps'),
                    addButtonValue: 'Add action step',
                    // addButtonDescription: 'TBD: action step description',
                    // overallDescription: Strings('moveActionStepsDescription')

                    focusReset: function() {
                        EditorCreatorBase.resetLastSelectedInputForId(MoveActionStep.id);
                        // FIXME: reset all rest editors in the branch
                    },

                    getChildrenArray:    function(nodeData) { return nodeData.actionSteps; },
                    childrenDataCreator: function() { return NodeFactory.createMoveActionStep(); },
                    childEditorCreator:  function(changeSelectedNodesSubDataByAction, removeFunc) {
                        return MoveActionStep.create(changeSelectedNodesSubDataByAction, removeFunc);
                    }
                }
            });

            var editorGroupMove = new EditorGroup('move', filter, editorGroupMove2.focus, updateView);

            editorGroupMove.domRoot.appendChild(editorGroupMove2.domRoot);

            return editorGroupMove;

            function filter(data) { return data && NodeFactory.isMoveNode(data); }


            function updateView() {

                var editorGroup = this;

                // FIXME: consider differences between matching nodes

                var nodeView = editorGroup.matchingSelectedViews[0];
                var nodeData = nodeView.binding.targetDataNode;

                console.assert(!!nodeData, 'nodeData is not expected to be falsy');

                editorGroupMove2.fill(nodeData);

            }

            // function recreateActionStepInputs(actionStepsAmount) {
            //     actionStepInputs = [];
            //     _.removeAllChildren(actionStepsParent);
            //     for (var i = 0; i < actionStepsAmount; ++i) {
            //         (function() {
            //             var actionStepIndex = i;
            //             var actionStepInput = MoveActionStep.create(changeActionStep);
            //             actionStepInputs[actionStepIndex] = actionStepInput;
            //             actionStepsParent.appendChild(actionStepInput.domRoot);
            //             function changeActionStep(changeActionStepProperty) {
            //                 return selectedNodesModifier(editorGroupMove, function(nodeData) {
            //                     var actionStep = nodeData.actionSteps[actionStepIndex];
            //                     var changed = changeActionStepProperty(actionStep);
            //                     if (changed) actionStepInput.fill(actionStep);
            //                     updateMoveSummaryInputValue(nodeData);
            //                     return changed;
            //                 });
            //             }
            //         }());
            //     }
            // }

            // function updateMoveSummaryInputValue(nodeData, optForceUpdate) {
            //     if (optForceUpdate || document.activeElement !== summary.input) {
            //         summary.setValue(NodeFactory.getMoveSummary(nodeData));
            //     }
            // }


            // readers


            function summaryToText(nodeData) { return NodeFactory.getMoveSummary(nodeData); }
            function changeSummary(newValue, nodeData) {

                var rest = newValue.trim();
                var parts = rest.split(':');
                if (parts.length > 1) {
                    editorGroupMove2.fillTextInput(reusedInputIds.context, parts[0]);
                    rest = parts[1].trim();
                } else {
                    editorGroupMove2.fillTextInput(reusedInputIds.context, '');
                }

                var inputData = rest;
                var actionStepSummary = '';
                parts = rest.split(' ');
                if (parts.length > 1) {
                    inputData = parts.slice(0, parts.length - 1).join(' ');
                    actionStepSummary = parts[parts.length - 1];
                }

                editorGroupMove2.fillTextInput(reusedInputIds.input, inputData);

                if (actionStepSummary) {
                    console.assert(nodeData.actionSteps.length > 0, 'move has no actions steps');
                    editorGroupMove2.getFirstChildrenEditor().extension.changeActionSummary(
                        actionStepSummary,
                        nodeData.actionSteps[0]
                    );
                }

                return false;

            }


            function inputToText(nodeData) { return nodeData.input || ''; }
            function changeInput(newValue, nodeData) {
                var oldValue = nodeData.input;
                nodeData.input = newValue.trim().toUpperCase().replace(/AP/g, 'Ap');
                return oldValue !== newValue;
            }


            function contextToText(nodeData) { return nodeData.context || ''; }
            function changeContext(newValueRaw, nodeData) {

                var newValue = newValueRaw.split(/\s*,\s*/);
                var oldValue = nodeData.context || [];

                nodeData.context = newValue;

                return !_.arraysConsistOfSameStrings(oldValue, newValue);

            }


            function frameDataToText(nodeData) { return nodeData.frameData.join(' ') || ''; }
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


            function endingToText(nodeData) { return nodeData.endsWith || ''; }
            function changeEnding(newValue, nodeData) {
                var oldValue = nodeData.endsWith;
                nodeData.endsWith = newValue || undefined;
                return oldValue !== newValue;
            }


            function mapStrToInt(element, index, array) { return +element; }

        }

    }

);