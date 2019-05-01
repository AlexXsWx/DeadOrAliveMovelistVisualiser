define(

    'EditorGroups/EditorGroupMoveCreator',

    [
        'EditorGroups/EditorGroup',
        'EditorGroups/EditorCreatorBase',
        'EditorGroups/MoveActionStep',
        'Model/NodeFactoryMove',
        'Model/NodeFactoryActionStep',
        'Model/NodeFactoryActionStepResult',
        'View/NodeView',
        'Localization/Strings',
        'Tools/Tools'
    ],

    function EditorGroupMoveCreator(
        EditorGroup,
        EditorCreatorBase,
        MoveActionStep,
        NodeFactoryMove,
        NodeFactoryActionStep,
        NodeFactoryActionStepResult,
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
                    childrenDataCreator: function() { return NodeFactoryActionStep.createMoveActionStep(); },
                    childEditorCreator:  function(changeSelectedNodesSubDataByAction, removeFunc) {
                        return MoveActionStep.create(changeSelectedNodesSubDataByAction, removeFunc);
                    }
                }
            });

            var editorGroupMove = new EditorGroup('move', filter, editorGroupMove2.focus, updateView);

            editorGroupMove.domRoot.appendChild(editorGroupMove2.domRoot);

            return editorGroupMove;

            function filter(data) { return data && NodeFactoryMove.isMoveNode(data); }


            function updateView(keepActiveSummaryContent) {

                var editorGroup = this;

                // FIXME: consider differences between matching nodes

                var nodeView = editorGroup.matchingSelectedViews[0];
                var nodeData = NodeView.getNodeData(nodeView);

                console.assert(Boolean(nodeData), 'nodeData is not expected to be falsy');

                editorGroupMove2.fill(nodeData, keepActiveSummaryContent);

            }


            function summaryToText(nodeData) { return NodeFactoryMove.getMoveSummary(nodeData); }
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

                var map = {
                    'g':  NodeFactoryActionStepResult.CONDITION.GUARD,
                    'n':  NodeFactoryActionStepResult.CONDITION.NEUTRAL_HIT,
                    'c':  NodeFactoryActionStepResult.CONDITION.COUNTER_HIT,
                    'hc': NodeFactoryActionStepResult.CONDITION.HI_COUNTER_HIT
                };

                Object.keys(map).forEach(function(prefix) {
                    var condition = map[prefix];
                    var advantage = actionStepResultToAdvantage(nodeData, condition);
                    if (advantage.value || advantage.value === 0) {
                        var str = prefix + signed(advantage.value);
                        if (advantage.stun) str += 's';
                        result.push(str);
                    }
                });

                return result.join(' ');

            }

            function signed(number) {
                return String(number)[0] === '-' ? number : '+' + number;
            }

            function changeSummary2(newValueRaw, nodeData) {

                var changed = false;

                var matchResult = /^(t|d)?\s*(?:([\d+\(\)\s*]+)(.*)?)?$/.exec(newValueRaw);

                var trackingPart  = (matchResult && matchResult[1] || '').trim();
                var frameDataPart = (matchResult && matchResult[2] || '').trim();
                var advantagePart = (matchResult && matchResult[3] || '').trim();

                changed = (
                    editorGroupMove2.getFirstChildrenEditor().extension.changeTrackingFromSummary(
                        trackingPart,
                        nodeData.actionSteps[0]
                    ) || changed
                );

                changed = changeFrameData(frameDataPart, nodeData) || changed;
                changed = changeAdvantage(advantagePart, nodeData) || changed;

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

                var newValue = newValueRaw ? newValueRaw.split(/\s*,\s*/) : [];
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


            function actionStepResultToAdvantage(nodeData, condition) {
                var map = {};
                map[NodeFactoryActionStepResult.CONDITION.GUARD] = (
                    NodeFactoryActionStepResult.doesDescribeGuard
                );
                map[NodeFactoryActionStepResult.CONDITION.NEUTRAL_HIT] = (
                    NodeFactoryActionStepResult.doesDescribeNeutralHit
                );
                map[NodeFactoryActionStepResult.CONDITION.COUNTER_HIT] = (
                    NodeFactoryActionStepResult.doesDescribeCounterHit
                );
                map[NodeFactoryActionStepResult.CONDITION.HI_COUNTER_HIT] = (
                    NodeFactoryActionStepResult.doesDescribeHiCounterHit
                );
                var predicate = map[condition];
                console.assert(predicate, "Missing predicate");
                var advantageRange = NodeFactoryMove.getAdvantageRange(
                    nodeData,
                    NodeFactoryActionStepResult.getHitBlockOrStun,
                    predicate
                );
                return {
                    value: advantageRange ? advantageRange.min : '',
                    stun:  advantageRange ? advantageRange.stun : false
                };
            }

            function changeAdvantage(advantageStr, nodeData) {
                var changed = false;

                var map = {
                    'g': function(advantageOnGuard, stun) {
                        return changeAdvantageHelper(
                            advantageOnGuard, nodeData,
                            NodeFactoryActionStepResult.doesDescribeGuard,
                            NodeFactoryActionStepResult.CONDITION.GUARD,
                            stun
                        );
                    },
                    'n': function(advantageOnNeutralHit, stun) {
                        return changeAdvantageHelper(
                            advantageOnNeutralHit, nodeData,
                            NodeFactoryActionStepResult.doesDescribeNeutralHit,
                            NodeFactoryActionStepResult.CONDITION.NEUTRAL_HIT,
                            stun
                        );
                    },
                    'c': function(advantageOnCounterHit, stun) {
                        return changeAdvantageHelper(
                            advantageOnCounterHit, nodeData,
                            NodeFactoryActionStepResult.doesDescribeCounterHit,
                            NodeFactoryActionStepResult.CONDITION.COUNTER_HIT,
                            stun
                        );
                    },
                    'hc': function(advantageOnHiCounterHit, stun) {
                        return changeAdvantageHelper(
                            advantageOnHiCounterHit, nodeData,
                            NodeFactoryActionStepResult.doesDescribeHiCounterHit,
                            NodeFactoryActionStepResult.CONDITION.HI_COUNTER_HIT,
                            stun
                        );
                    }
                };
                Object.keys(map).forEach(function(prefix) {
                    var regex = new RegExp('\\b' + prefix + '\\s*([-+]?\\s*\\d+)(s)?', 'i');
                    var matchResult = regex.exec(advantageStr);
                    var numberStr = (matchResult && matchResult[1] || '').replace(/\s*/g, '');
                    var stun = matchResult && matchResult[2];
                    changed = map[prefix](numberStr, stun) || changed;
                });
                return changed;
            }

            function changeAdvantageHelper(
                advantageStr,
                nodeData,
                actionStepResultPredicate,
                condition,
                stun
            ) {
                var changed = false;

                // Frame data is required to convert advantage to hitblock/stun duration
                if (!NodeFactoryMove.hasMinimalFrameDataInfo(nodeData)) {
                    return changed;
                }

                var bla = findActionStepAndActionStepResult(nodeData, actionStepResultPredicate);
                if (!bla) return changed;

                var getHitBlockOrStun = stun ? getStun : getHitBlock;
                var setHitBlockOrStun = stun ? setStun : setHitBlock;

                var hitBlockOrStun = getHitBlockOrStunDuration(advantageStr, nodeData);

                var needToCleanUpCondition  = false;
                var needToAddCondition      = false;
                var needNewActionStepResult = false;

                if (hitBlockOrStun.provided) {
                    if (bla.actionStepResult) {
                        if (
                            getHitBlockOrStun(bla.actionStepResult) !== hitBlockOrStun.duration &&
                            bla.actionStepResult.condition.length > 1
                        ) {
                            needToCleanUpCondition  = true;
                            needNewActionStepResult = true;
                        }
                    } else {
                        // Try to find existing action step result to use
                        bla.actionStepResult = _.find(
                            bla.actionStep.results,
                            NodeFactoryActionStepResult.isEmpty
                        );
                        if (bla.actionStepResult) {
                            needToAddCondition = true;
                        } else {
                            needNewActionStepResult = true;
                        }
                    }
                } else
                if (bla.actionStepResult) {
                    needToCleanUpCondition = true;
                }

                if (needToCleanUpCondition) {
                    changed = true;
                    NodeFactoryActionStep.removeActionStepResultCondition(
                        bla.actionStep, bla.actionStepResult, condition
                    );
                }

                if (needNewActionStepResult) {
                    changed = true;
                    bla.actionStepResult = NodeFactoryActionStepResult.createMoveActionStepResult();
                    bla.actionStep.results.push(bla.actionStepResult);
                    needToAddCondition = true;
                }

                if (needToAddCondition) {
                    changed = true;
                    NodeFactoryActionStepResult.addCondition(bla.actionStepResult, condition);
                }

                if (hitBlockOrStun.provided) {
                    changed = (
                        setHitBlockOrStun(bla.actionStepResult, hitBlockOrStun.duration) || changed
                    );
                }

                changed = NodeFactoryActionStep.groupSimilarResults(bla.actionStep) || changed;

                return changed;

                function findActionStepAndActionStepResult(nodeData, actionStepResultPredicate) {
                    // find last action step
                    var actionStep = null;
                    for (var i = nodeData.actionSteps.length - 1; i >= 0 && !actionStep; --i) {
                        actionStep = nodeData.actionSteps[i];
                    }
                    if (!actionStep) return null;

                    var actionStepResult = null;

                    // Try to find existing action step result that describes given condition
                    for (var i = 0; i < actionStep.results.length; ++i) {
                        var result = actionStep.results[i];
                        if (result && actionStepResultPredicate(result)) {
                            actionStepResult = result;
                            break;
                        }
                    }

                    return {
                        actionStep:       actionStep,
                        actionStepResult: actionStepResult
                    };
                }

                function getHitBlock(actionStepResult) { return actionStepResult.hitBlock; }
                function setHitBlock(actionStepResult, value) {
                    var changed = (
                        actionStepResult.hitBlock !== value ||
                        actionStepResult.criticalHoldDelay !== undefined ||
                        actionStepResult.stunDurationMin   !== undefined ||
                        actionStepResult.stunDurationMax   !== undefined
                    );
                    actionStepResult.hitBlock = value;
                    actionStepResult.criticalHoldDelay = undefined;
                    actionStepResult.stunDurationMin   = undefined;
                    actionStepResult.stunDurationMax   = undefined;
                    return changed;
                }
                function getStun(actionStepResult) { return actionStepResult.stunDurationMax; }
                function setStun(actionStepResult, value) {
                    var changed = (
                        actionStepResult.hitBlock !== undefined ||
                        actionStepResult.stunDurationMax !== value
                    );
                    actionStepResult.hitBlock = undefined;
                    actionStepResult.stunDurationMax = value;
                    return changed;
                }

                function getHitBlockOrStunDuration(advantageStr, nodeData) {
                    var result = {
                        duration: 0,
                        provided: false
                    };

                    var advantage = Number(advantageStr);
                    if (advantageStr && !isNaN(advantage)) {
                        var activeFramesCount   = NodeFactoryMove.getActiveFramesCount(nodeData);
                        var recoveryFramesCount = NodeFactoryMove.getRecoveryFramesCount(nodeData);
                        // Assuming advantage is given for situation where first active frame lands
                        var activeFramesAfterLanded = activeFramesCount - 1;
                        result.duration = activeFramesAfterLanded + recoveryFramesCount + advantage;
                        result.provided = true;
                    }

                    return result;
                }
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
                var numbers = newValueRaw.match(/\d+/g);
                var newValue = numbers ? numbers.map(strToIntMapper) : [];
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
