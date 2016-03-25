define(

    'EditorGroups/EditorGroupMoveCreator',

    [
        'EditorGroups/EditorGroup',
        'EditorGroups/MoveActionStep',
        'Input/InputHelper',
        'NodeFactory',
        'Tools'
    ],

    function(
        EditorGroup,
        MoveActionStep,
        InputHelper,
        NodeFactory,
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
            var actionStepInputs  = [];

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
                recreateActionStepInputs(actionStepsAmount);

                updateMoveInputs(nodeData);

            }

            function recreateActionStepInputs(actionStepsAmount) {
                actionStepInputs = [];
                actionStepsParent.innerHTML = '';
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
                nodeData.input = newValue;
                return oldValue !== newValue;
            }


            function changeContext(newValueRaw, nodeData) {

                var newValue = newValueRaw.split(',').map(mapTrim);
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


            function mapTrim(element, index, array) { return element.trim(); }

            function mapStrToInt(element, index, array) { return +element; }

        }

    }

);