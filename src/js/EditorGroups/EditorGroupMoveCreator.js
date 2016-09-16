define(

    'EditorGroups/EditorGroupMoveCreator',

    [
        'EditorGroups/EditorGroup',
        'EditorGroups/EditorCreatorBase',
        'EditorGroups/MoveActionStep',
        'NodeFactory',
        'NodeView',
        'Strings',
        'Tools'
    ],

    function EditorGroupMoveCreator(
        EditorGroup,
        EditorCreatorBase,
        MoveActionStep,
        NodeFactory,
        NodeView,
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
                    // FIXME: offensive holds
                    // TODO: include ending
                    // FIXME: Esc is bugged
                    id: 'summary',
                    inputType: EditorCreatorBase.INPUT_TYPES.text,
                    label: Strings('moveSummary'),
                    description: Strings('moveSummaryDescription'),
                    placeholderText: Strings('moveSummaryPlaceholder'),
                    fill: summaryToText,
                    parameterModifier: changeSummary,
                    focused: true
                }, {
                    id: reusedInputIds.context,
                    inputType: EditorCreatorBase.INPUT_TYPES.text,
                    label: Strings('moveContext'),
                    description: Strings('moveContextDescription'),
                    placeholderText: Strings('moveContextPlaceholder'),
                    fill: contextToText,
                    parameterModifier: changeContext
                }, {
                    id: reusedInputIds.input,
                    inputType: EditorCreatorBase.INPUT_TYPES.text,
                    label: Strings('moveInput'),
                    description: Strings('moveInputDescription'),
                    placeholderText: Strings('moveInputPlaceholder'),
                    fill: inputToText,
                    parameterModifier: changeInput
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
                    addButtonDescription: 'Add description for the part of the move',
                    overallDescription: Strings('moveActionStepsDescription'),

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


            function updateView(keepActiveSummaryContent) {

                var editorGroup = this;

                // FIXME: consider differences between matching nodes

                var nodeView = editorGroup.matchingSelectedViews[0];
                var nodeData = NodeView.getNodeData(nodeView);

                console.assert(!!nodeData, 'nodeData is not expected to be falsy');

                editorGroupMove2.fill(nodeData, keepActiveSummaryContent);

            }


            function summaryToText(nodeData) { return NodeFactory.getMoveSummary(nodeData); }
            function changeSummary(newValue, nodeData) {

                var changed = false;

                var rest = newValue.trim();
                var parts = rest.split(':');
                if (parts.length > 1) {
                    changed = changeContext(parts[0], nodeData) || changed;
                    rest = parts[1].trim();
                } else {
                    changed = changeContext('', nodeData) || changed;
                }

                var inputData = rest;
                var actionStepSummary = '';
                parts = rest.split(' ');
                if (parts.length > 1) {
                    inputData = parts.slice(0, parts.length - 1).join(' ');
                    actionStepSummary = parts[parts.length - 1];
                }

                changed = changeInput(inputData, nodeData) || changed;

                if (actionStepSummary) {
                    console.assert(nodeData.actionSteps.length > 0, 'move has no actions steps');
                    changed = editorGroupMove2.getFirstChildrenEditor().extension.changeActionSummary(
                        actionStepSummary,
                        nodeData.actionSteps[0]
                    ) || changed;
                }

                return changed;

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

                return !_.arraysAreEqual(oldValue, newValue);

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