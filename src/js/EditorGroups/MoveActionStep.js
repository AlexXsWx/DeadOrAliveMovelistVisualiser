define(

    'EditorGroups/MoveActionStepNew',

    [
        'NodeFactory',
        'EditorGroups/MoveActionStepResult',
        'UI/TableRowInput',
        'UI/TableRowTristateCheckbox',
        'Strings',
        'Tools'
    ],

    function MoveActionStepNew(
        NodeFactory,
        MoveActionStepResult,
        TableRowInput,
        TableRowTristateCheckbox,
        Strings,
        _
    ) {

        return {
            create: create,
            resetLastSelectedInput: resetLastSelectedInput
        };

        function create(changeActionStep) {

            var reusedInputIds = {
                mask:     'mask',
                tracking: 'tracking',
                type:     'type'
            };

            var inputs = [
                {
                    // FIXME: Esc is bugged
                    id: 'summary',
                    inputType: EditorCreatorBase.INPUT_TYPES.text,
                    name: Strings('moveActionSummary'),
                    description: Strings('moveActionSummaryDescription'),
                    placeholderText: Strings('moveActionSummaryPlaceholder'), // only for type=text
                    fill: actionStepToSummaryText,
                    changeAction: changeActionSummary,
                    isSummary: true
                }, {
                    id: reusedInputIds.mask,
                    inputType: EditorCreatorBase.INPUT_TYPES.text,
                    name: Strings('moveActionMask'),
                    description: Strings('moveActionMaskDescription'),
                    placeholderText: 'e.g. mid P',
                    fill: actionStepToMaskText,
                    changeAction: changeActionMask,
                    optIncludedInSummaries: { 'summary': changeActionSummary }
                }, {
                    id: reusedInputIds.type,
                    inputType: EditorCreatorBase.INPUT_TYPES.text,
                    name: Strings('moveActionType'),
                    description: Strings('moveActionTypeDescription'),
                    placeholderText: 'e.g. strike',
                    fill: actionStepToTypeText,
                    changeAction: changeActionStepType,
                    optIncludedInSummaries: { 'summary': changeActionSummary }
                }, {
                    id: reusedInputIds.tracking,
                    inputType: EditorCreatorBase.INPUT_TYPES.checkbox,
                    name: Strings('moveActionTracking'),
                    description: Strings('moveActionTrackingDescription'),
                    fill: actionStepToTrackingChecked,
                    changeAction: changeActionStepTracking,
                    optIncludedInSummaries: { 'summary': changeActionSummary }
                }, {
                    id: 'damage',
                    inputType: EditorCreatorBase.INPUT_TYPES.text,
                    name: Strings('moveActionDamage'),
                    description: Strings('moveActionDamageDescription'),
                    placeholderText: 'e.g. 18',
                    fill: actionStepToDamageText,
                    changeAction: changeActionStepDamage
                }, {
                    id: 'tags',
                    inputType: EditorCreatorBase.INPUT_TYPES.text,
                    name: Strings('moveActionTags'),
                    description: Strings('moveActionTagsDescription'),
                    placeholderText: 'e.g. ground attack',
                    fill: actionStepToTagsText,
                    changeAction: changeActionStepTags
                }// , {
                //     id: 'condition',
                //     inputType: EditorCreatorBase.INPUT_TYPES.text,
                //     name: Strings('moveActionCondition'),
                //     description: Strings('moveActionConditionDescription'),
                //     placeholderText: 'e.g. neutral/open, stun/open',
                //     fill: actionStepToConditionText,
                //     changeAction: changeActionStepCondition
                // }
            ];

            var editorGroup = EditorCreatorBase.create({
                inputs: inputs,
                changer: changeActionStep,
                childrenStuff: {
                    focusReset: MoveActionStepResult.resetLastSelectedInput,
                    name: 'Action step results:',
                    addButtonValue: 'Add result for the action step',
                    addButtonDescription: 'Tell what active frames do, hitblock / stun / launcher etc',
                    childrenCreator: createResultInput,
                    childrenDataCreator: function() {
                        actionStep.results.push(NodeFactory.createMoveActionStepResult());
                        var changed = true;
                        return changed;
                    }
                }
            });

            return editorGroup;

            function createResultInput() {

                var result = MoveActionStepResult.create(
                    changeActionStepResult,
                    onRemove
                );
                results.push(result);
                resultsParent.appendChild(result.domRoot);

                return result;

                function changeActionStepResult(changer) {
                    changeActionStep(function(actionStep) {
                        var resultIndex = results.indexOf(result);
                        return changer(actionStep.results[resultIndex]);
                    });
                }

                function onRemove() {
                    var resultIndex = results.indexOf(result);
                    results.splice(resultIndex, 1);
                    resultsParent.removeChild(result.domRoot);
                    changeActionStep(function(actionStep) {
                        actionStep.results.splice(resultIndex, 1);
                        var changed = true;
                        return changed;
                    });
                }

            }


            function addResult() {
                createResultInput();
                changeActionStep(function(actionStep) {
                    actionStep.results.push(NodeFactory.createMoveActionStepResult());
                    var changed = true;
                    return changed;
                });
            }

            function updateActionStepSummaryInputValue(actionStep, optForceUpdate) {
                if (optForceUpdate || document.activeElement !== summary.input) {
                    summary.setValue(actionStepToSummaryText(actionStep));
                }
            }

            // ==== Something ====

                function actionStepToSummaryText(actionStep) {
                    return NodeFactory.getActionStepSummary(actionStep);
                }

                function changeActionSummary(newValue, actionStep) {

                    var lowCased = newValue.toLowerCase();

                    // mask

                    var maskValue = [];
                    // FIXME: order is important!
                    if (lowCased.search('h') >= 0) maskValue.push('high');
                    if (lowCased.search('m') >= 0) maskValue.push('mid');
                    if (lowCased.search('l') >= 0) maskValue.push('low');
                    if (lowCased.search('f') >= 0) maskValue.push('ground'); // for Floor
                    if (lowCased.search('p') >= 0) maskValue.push('P');
                    if (lowCased.search('k') >= 0) maskValue.push('K');

                    editorGroup.fillTextInput(reusedInputIds.mask, maskValue.join(' '));

                    // tracking

                    var trackingValue = undefined;
                    if (lowCased.search('d') >= 0) {
                        trackingValue = false;
                    } else
                    if (lowCased.search('t') >= 0) {
                        trackingValue = true;
                    }

                    if (trackingValue === undefined) {
                        editorGroup.fillTextInput(reusedInputIds.tracking, false, true);
                    } else {
                        editorGroup.fillTextInput(reusedInputIds.tracking, trackingValue, false);
                    }

                    // type

                    var typeValue = 'other';
                    if (lowCased.search('g') >= 0) {
                        typeValue = 'throw';
                    } else
                    if (lowCased.search('c') >= 0) {
                        typeValue = 'hold';
                    } else
                    if (lowCased.search(/[pk]/) >= 0) {
                        if (lowCased.search('j') >= 0) {
                            typeValue = 'jump attack';
                        } else {
                            typeValue = 'strike';
                        }
                    }

                    editorGroup.fillTextInput(reusedInputIds.type, typeValue);

                    return false;

                }


                function actionStepToMaskText(actionStep) { return actionStep.actionMask || ''; }
                function changeActionMask(newValue, actionStep) {
                    var oldValue = actionStep.actionMask;
                    actionStep.actionMask = newValue;
                    return oldValue !== newValue;
                }

                function actionStepToTypeText(actionStep) { return actionStep.actionType || ''; }
                function changeActionStepType(newValue, actionStep) {
                    var oldValue = actionStep.actionType;
                    actionStep.actionType = newValue;
                    return oldValue !== newValue;
                }

                function actionStepToTrackingChecked(actionStep) { return actionStep.isTracking; }
                function changeActionStepTracking(isChecked, isIndeterminate, actionStep) {
                    var newValue = isIndeterminate ? undefined : isChecked;
                    var oldValue = actionStep.isTracking;
                    actionStep.isTracking = newValue;
                    return oldValue !== newValue;
                }

                function actionStepToDamageText(actionStep) { return actionStep.damage || ''; }
                function changeActionStepDamage(newValue, actionStep) {
                    var newDamage = parseInt(newValue, 10);
                    var oldValue = actionStep.damage;
                    actionStep.damage = newDamage;
                    return oldValue !== newDamage;
                }

                function actionStepToTagsText(actionStep) { return actionStep.tags.join(', ') || ''; }
                function changeActionStepTags(newValue, actionStep) {
                    var newTags = newValue.split(/,\s*/);
                    var changed = _.arraysConsistOfSameStrings(actionStep.tags, newTags);
                    actionStep.tags = newTags;
                    return changed;
                }

                // function actionStepToConditionText(actionStep) { return actionStep.condition.join(', ') || ''; }
                // function changeActionStepCondition(newValue, actionStep) {
                //     var newConditions = newValue.split(/,\s*/);
                //     var changed = _.arraysConsistOfSameStrings(actionStep.condition, newConditions);
                //     actionStep.condition = newConditions;
                //     return changed;
                // }

            // ===================

        }

    }
);