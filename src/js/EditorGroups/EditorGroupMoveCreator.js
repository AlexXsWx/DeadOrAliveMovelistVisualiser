define(

    'EditorGroups/EditorGroupMoveCreator',

    [
        'EditorGroups/EditorGroup',
        'EditorGroups/MoveActionStep',
        'Input/InputHelper',
        'NodeFactory',
        'Tools'
    ],

    function EditorGroupMoveCreator(
        EditorGroup,
        MoveActionStep,
        InputHelper,
        NodeFactory,
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

            var editorGroupMove = new EditorGroup(
                'move', _.getDomElement('editorMove'), filter, focus, bindListeners, updateView
            );

            // FIXME: use same cancel-changes behavior for esc as in TableRowInput
            var input             = _.getDomElement('editorMoveInput');
            var context           = _.getDomElement('editorMoveContext');
            var frameData         = _.getDomElement('editorMoveFrameData');
            var ending            = _.getDomElement('editorMoveEnding');
            var actionStepsParent = _.getDomElement('editorMoveActionSteps');
            var actionStepInputs  = [];

            return editorGroupMove;

            function filter(data) { return data && NodeFactory.isMoveNode(data); }

            function focus() {

                if (!(actionStepInputs.length > 0 && actionStepInputs[0].focus())) {
                    switch (lastSelectedInput) {
                        case inputEnum.input:     input.select();     break;
                        case inputEnum.context:   context.select();   break;
                        case inputEnum.frameData: frameData.select(); break;
                        case inputEnum.ending:    ending.select();    break;
                    }
                }

                return true;

            }

            function bindListeners() {
                initInputElement(input,     onInputInput,     inputEnum.input);
                initInputElement(context,   onContextInput,   inputEnum.context);
                initInputElement(frameData, onFrameDataInput, inputEnum.frameData);
                initInputElement(ending,    onEndingInput,    inputEnum.ending);
            }

            function initInputElement(element, action, enumValue) {
                InputHelper.initInputElement(element, action);
                element.addEventListener('focus', function(event) {
                    MoveActionStep.resetLastSelectedInput();
                    lastSelected = enumValue;
                });
            }

            function updateView() {

                var editorGroup = this;

                // FIXME: consider differences between matching nodes

                var nodeView = editorGroup.matchingSelectedViews[0];
                var nodeData = nodeView.binding.targetDataNode;

                console.assert(!!nodeData, 'nodeData is not expected to be falsy');

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
                                return changeActionStepProperty(nodeData.actionSteps[actionStepIndex]);
                            });
                        }
                    }());
                }
            }

            function updateMoveInputs(nodeData) {
                input.value     = nodeData && nodeData.input               || '';
                frameData.value = nodeData && nodeData.frameData.join(' ') || '';
                ending.value    = nodeData && nodeData.endsWith            || '';
                context.value   = nodeData && nodeData.context.join(', ')  || '';

                updateActionStepInputs(nodeData);
            }

            function updateActionStepInputs(nodeData) {
                for (var i = 0; i < actionStepInputs.length; ++i) {
                    var actionStep = nodeData && nodeData.actionSteps[i] || null;
                    actionStepInputs[i].fillFromActionStep(actionStep);
                }
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