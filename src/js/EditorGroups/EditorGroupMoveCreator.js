define(

    'EditorGroups/EditorGroupMoveCreator',

    [
        'EditorGroups/EditorGroup',
        'EditorGroups/EditorCreatorBase',
        'EditorGroups/MoveActionStep',
        'Model/NodeFactory',
        'Model/NodeFactoryMove',
        'View/NodeView',
        'Localization/Strings',
        'Tools/Tools'
    ],

    function EditorGroupMoveCreator(
        EditorGroup,
        EditorCreatorBase,
        MoveActionStep,
        NodeFactory,
        NodeFactoryMove,
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
                    isSummary: true,
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
                    id: 'summary2',
                    inputType: EditorCreatorBase.INPUT_TYPES.text,
                    label: Strings('moveSummary2'),
                    description: Strings('moveSummary2Description'),
                    placeholderText: Strings('moveSummary2Placeholder'),
                    isSummary: true,
                    fill: summary2ToText,
                    parameterModifier: changeSummary2
                }, {
                    id: 'frameData',
                    inputType: EditorCreatorBase.INPUT_TYPES.text,
                    label: Strings('moveFrameData'),
                    description: Strings('moveFrameDataDescription'),
                    placeholderText: Strings('moveFrameDataPlaceholder'),
                    fill: frameDataToText,
                    parameterModifier: changeFrameData
                }, {
                    id: 'summaryAdvantageOnBlock',
                    inputType: EditorCreatorBase.INPUT_TYPES.text,
                    label: Strings('summaryAdvantageOnBlock'),
                    description: Strings('summaryAdvantageOnBlockDescription'),
                    isSummary: true,
                    placeholderText: 'e.g. "-8"',
                    fill: actionStepResultToAdvantageOnBlock,
                    parameterModifier: changeAdvantageOnBlock
                }, {
                    id: 'followUpInterval',
                    inputType: EditorCreatorBase.INPUT_TYPES.text,
                    label: Strings('followUpInterval'),
                    description: Strings('followUpIntervalDescription'),
                    placeholderText: Strings('followUpIntervalPlaceholder'),
                    fill: followUpIntervalToText,
                    parameterModifier: changeFollowUpInterval
                }, {
                    id: 'comment',
                    inputType: EditorCreatorBase.INPUT_TYPES.text,
                    multiline: true,
                    label: Strings('comment'),
                    description: Strings('commentDescription'),
                    placeholderText: Strings('commentPlaceholder'),
                    fill: commentToText,
                    parameterModifier: changeComment
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
                var parts = rest.split(': ');
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
                }
                changed = editorGroupMove2.getFirstChildrenEditor().extension.changeActionSummary(
                    actionStepSummary,
                    nodeData.actionSteps[0]
                ) || changed;

                return changed;

            }


            function summary2ToText(nodeData) {

                var result = [];

                if (nodeData.actionSteps.length > 0) {
                    var firstActionStep = nodeData.actionSteps[0];
                    if (firstActionStep.isTracking !== undefined) {
                        result.push(firstActionStep.isTracking ? 't' : 'd');
                    }
                }

                result.push(frameDataToText(nodeData));

                var safety = actionStepResultToAdvantageOnBlock(nodeData);
                if (safety) {
                    result.push('/' + safety);
                }

                return result.join(' ');

            }

            function changeSummary2(newValueRaw, nodeData) {

                var changed = false;

                var trackingPart  = '';
                var frameDataPart = '';
                var safetyPart    = '';

                var safetyStart = newValueRaw.indexOf('/');
                var numbersStart = newValueRaw.search(/-?\d/);
                if (safetyStart >= 0 && safetyStart < numbersStart) {
                    numbersStart = -1;
                }

                if (numbersStart > 0) {
                    trackingPart = newValueRaw.substring(0, numbersStart);
                }

                if (numbersStart >= 0) {
                    frameDataPart = newValueRaw.substring(
                        numbersStart,
                        safetyStart >= 0 ? safetyStart : numbersStart.length
                    );
                }

                if (safetyStart >= 0) {
                    safetyPart = newValueRaw.substring(safetyStart + 1);
                }

                changed = editorGroupMove2.getFirstChildrenEditor().extension.changeTrackingFromSummary(
                    trackingPart,
                    nodeData.actionSteps[0]
                ) || changed;

                changed = changeFrameData(frameDataPart, nodeData) || changed;
                changed = changeAdvantageOnBlock(safetyPart, nodeData) || changed;

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


            function frameDataToText(nodeData) {
                return NodeFactoryMove.frameDataToString(nodeData);
            }
            function changeFrameData(newValueRaw, nodeData) {
                // FIXME: dont support negative framedata, use followup range instead
                var numbers = newValueRaw.match(/-?\d+/g);
                var newValue = numbers ? numbers.map(strToIntMapper) : [];
                return NodeFactoryMove.changeFrameData(nodeData, newValue);
            }


            function actionStepResultToAdvantageOnBlock(nodeData) {
                var advantageRange = NodeFactory.getAdvantageRange(
                    nodeData,
                    NodeFactory.getActionStepResultHitBlock,
                    NodeFactory.doesActionStepResultDescribeGuard
                );
                return advantageRange ? advantageRange.min : '';
            }

            function changeAdvantageOnBlock(advantageStr, nodeData) {

                var changed = false;

                // Frame data is required to convert input to storable value
                if (!NodeFactoryMove.hasMinimalFrameDataInfo(nodeData)) {
                    return changed;
                }

                // find last action step
                var actionStep = null;
                for (var i = nodeData.actionSteps.length - 1; i >= 0 && !actionStep; --i) {
                    actionStep = nodeData.actionSteps[i];
                }

                // if there's one
                if (actionStep) {

                    var isNewHitBlockProvided = false;
                    var hitBlock = 0;

                    var advantage = Number(advantageStr);
                    if (advantageStr && !isNaN(advantage)) {
                        var activeFramesCount   = NodeFactoryMove.getActiveFramesCount(nodeData);
                        var recoveryFramesCount = NodeFactoryMove.getRecoveryFramesCount(nodeData);
                        // Assuming advantage is given for situation where first active frame lands
                        var activeFramesAfterLanded = activeFramesCount - 1;
                        hitBlock = activeFramesAfterLanded + recoveryFramesCount + advantage;
                        isNewHitBlockProvided = true;
                    }

                    var actionStepResult = null;

                    // Try to find existing action step result that describes guard
                    for (var i = 0; i < actionStep.results.length; ++i) {
                        var result = actionStep.results[i];
                        if (result && NodeFactory.doesActionStepResultDescribeGuard(result)) {
                            actionStepResult = result;
                            break;
                        }
                    }

                    var cleanupGuard = false;
                    var addGuardCondition = false;
                    var createNewActionStepResult = false;

                    if (isNewHitBlockProvided) {
                        if (actionStepResult) {
                            if (
                                isNewHitBlockProvided &&
                                actionStepResult.condition.length > 1 &&
                                actionStepResult.hitBlock !== hitBlock
                            ) {
                                cleanupGuard = true;
                                createNewActionStepResult = true;
                            }
                        } else {
                            // Try to find empty action step result to use
                            for (var i = 0; i < actionStep.results.length; ++i) {
                                var result = actionStep.results[i];
                                if (NodeFactory.isActionStepResultEmpty(result)) {
                                    actionStepResult = result;
                                    addGuardCondition = true;
                                    break;
                                }
                            }
                            if (!actionStepResult) {
                                createNewActionStepResult = true;
                            }
                        }
                    } else
                    if (actionStepResult) {
                        cleanupGuard = true;
                    }

                    if (cleanupGuard) {
                        changed = true;
                        NodeFactory.removeGuardConditionFromActionStepResult(actionStepResult);
                        if (actionStepResult.condition.length === 0) {
                            actionStep.results.splice(
                                actionStep.results.indexOf(actionStepResult), 1
                            );
                            if (actionStep.results.length === 0) {
                                // Create default placeholder
                                actionStep.results.push(NodeFactory.createMoveActionStepResult());
                            }
                        }
                    }

                    if (createNewActionStepResult) {
                        changed = true;
                        actionStepResult = NodeFactory.createMoveActionStepResult();
                        actionStep.results.push(actionStepResult); 
                        addGuardCondition = true;
                    }

                    if (addGuardCondition) {
                        changed = true;
                        actionStepResult.condition.push('guard');
                    }

                    if (isNewHitBlockProvided && actionStepResult.hitBlock !== hitBlock) {
                        changed = true;
                        actionStepResult.hitBlock = hitBlock;
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


            function followUpIntervalToText(nodeData) { return nodeData.followUpInterval.join('~'); }
            function changeFollowUpInterval(newValueRaw, nodeData) {
                var oldValue = nodeData.followUpInterval;
                var newValue = newValueRaw.match(/\d+/g).map(strToIntMapper);
                nodeData.followUpInterval = newValue;
                return !_.arraysAreEqual(oldValue, newValue);
            }


            function commentToText(nodeData) { return nodeData.comment || ''; }
            function changeComment(newValueRaw, nodeData) {
                var oldValue = nodeData.comment;
                var newValue = newValueRaw.trim();
                nodeData.comment = newValue;
                return oldValue !== newValue;
            }


            function strToIntMapper(element, index, array) { return Number(element); }

        }

    }

);
