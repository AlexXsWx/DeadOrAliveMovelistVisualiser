define(

    'EditorGroups/MoveActionStep',

    [
        'Model/NodeFactoryActionStep',
        'Model/NodeFactoryActionStepResult',
        'EditorGroups/EditorCreatorBase',
        'EditorGroups/MoveActionStepResult',
        'Localization/Strings',
        'Tools/Tools'
    ],

    function MoveActionStep(
        NodeFactoryActionStep,
        NodeFactoryActionStepResult,
        EditorCreatorBase,
        MoveActionStepResult,
        Strings,
        _
    ) {

        var editorGroupId = 'moveActionStep';

        return {
            id: editorGroupId,
            create: create,
            // FIXME: remove
            resetLastSelectedInput: function resetLastSelectedInput() {
                EditorCreatorBase.resetLastSelectedInputForId(editorGroupId);
            }
        };

        function create(selectedNodesActionStepModifier, removeFunc) {

            var reusedInputIds = {
                mask:     'mask',
                tracking: 'tracking',
                type:     'type'
            };

            var inputs = [
                {
                    // FIXME: mid P mid K
                    id: 'remove',
                    inputType: EditorCreatorBase.INPUT_TYPES.button,
                    label: 'Remove action step',
                    description: 'Remove this action step',
                    onClick: removeFunc
                }, {
                    // FIXME: Esc is bugged
                    id: 'summary',
                    inputType: EditorCreatorBase.INPUT_TYPES.text,
                    label: Strings('moveActionSummary'),
                    description: Strings('moveActionSummaryDescription'),
                    placeholderText: Strings('moveActionSummaryPlaceholder'), // only for type=text
                    isSummary: true,
                    fill: actionStepToSummaryText,
                    parameterModifier: changeActionSummary
                }, {
                    id: reusedInputIds.mask,
                    inputType: EditorCreatorBase.INPUT_TYPES.text,
                    label: Strings('moveActionMask'),
                    description: Strings('moveActionMaskDescription'),
                    placeholderText: 'e.g. mid P',
                    fill: actionStepToMaskText,
                    parameterModifier: changeActionMask
                }, {
                    id: reusedInputIds.type,
                    inputType: EditorCreatorBase.INPUT_TYPES.text,
                    label: Strings('moveActionType'),
                    description: Strings('moveActionTypeDescription'),
                    placeholderText: 'e.g. strike',
                    datalist: 'actionStepSupportedTypes',
                    fill: actionStepToTypeText,
                    parameterModifier: changeActionStepType
                }, {
                    id: reusedInputIds.tracking,
                    inputType: EditorCreatorBase.INPUT_TYPES.checkbox,
                    label: Strings('moveActionTracking'),
                    description: Strings('moveActionTrackingDescription'),
                    fill: actionStepToTrackingChecked,
                    parameterModifier: changeActionStepTracking
                }, {
                    id: 'damage',
                    inputType: EditorCreatorBase.INPUT_TYPES.text,
                    label: Strings('moveActionDamage'),
                    description: Strings('moveActionDamageDescription'),
                    placeholderText: 'e.g. 18',
                    fill: actionStepToDamageText,
                    parameterModifier: changeActionStepDamage
                }, {
                    id: 'reach',
                    inputType: EditorCreatorBase.INPUT_TYPES.text,
                    label: Strings('moveActionReach'),
                    description: Strings('moveActionReachDescription'),
                    placeholderText: 'e.g. 1.34',
                    fill: actionStepToReachText,
                    parameterModifier: changeActionStepReach
                }, {
                    id: 'togglesStance',
                    inputType: EditorCreatorBase.INPUT_TYPES.checkbox,
                    // FIXME: localize
                    label: 'Toggles stance',
                    description: 'Whether or not changes leading leg',
                    fill: actionStepToTogglesStanceChecked,
                    parameterModifier: changeActionStepTogglesStance
                }, {
                    id: 'tags',
                    inputType: EditorCreatorBase.INPUT_TYPES.text,
                    label: Strings('moveActionTags'),
                    description: Strings('moveActionTagsDescription'),
                    placeholderText: 'e.g. guard break',
                    datalist: 'actionSupportedTags',
                    fill: actionStepToTagsText,
                    parameterModifier: changeActionStepTags
                }// , {
                //     id: 'condition',
                //     inputType: EditorCreatorBase.INPUT_TYPES.text,
                //     label: Strings('moveActionCondition'),
                //     description: Strings('moveActionConditionDescription'),
                //     placeholderText: 'e.g. neutral/open, stun/open',
                //     fill: actionStepToConditionText,
                //     parameterModifier: changeActionStepCondition
                // }
            ];

            var editorGroup = EditorCreatorBase.createEditorCreator({
                id: editorGroupId,
                inputs: inputs,
                selectedNodesModifier: selectedNodesActionStepModifier,
                childrenStuff: {

                    name: 'Action step results:',
                    addButtonValue: 'Add result for the action step',
                    addButtonDescription: 'Tell what active frames do, hitblock / stun / launcher etc',

                    focusReset: function() {
                        EditorCreatorBase.resetLastSelectedInputForId(MoveActionStepResult.id);
                        // FIXME: reset all rest editors in the branch
                    },

                    getChildrenArray: function(actionStep) { return actionStep.results; },
                    childrenDataCreator: function() { return NodeFactoryActionStepResult.createMoveActionStepResult(); },
                    childEditorCreator: function(changeSelectedNodesSubDataByAction, removeFunc) {
                        return MoveActionStepResult.create(
                            changeSelectedNodesSubDataByAction,
                            removeFunc
                        );
                    }

                },
                optExtension: {
                    changeActionSummary: changeActionSummary,
                    changeTrackingFromSummary: changeTrackingFromSummary
                }
            });

            return editorGroup;


            function actionStepToSummaryText(actionStep) {
                return NodeFactoryActionStep.getActionStepSummary(actionStep);
            }

            function changeActionSummary(newValue, actionStep) {

                var changed = false;

                var lowCased = newValue.toLowerCase();

                // mask

                var maskValue = [];
                // FIXME: order is important!
                if (lowCased.search('h') >= 0) maskValue.push('high');
                if (lowCased.search('m') >= 0) maskValue.push('mid');
                if (lowCased.search('l') >= 0) maskValue.push('low');
                if (lowCased.search('p') >= 0) maskValue.push('P');
                if (lowCased.search('k') >= 0) maskValue.push('K');
                if (lowCased.search('f') >= 0) maskValue.push('ground'); // 'f' for Floor

                changed = changeActionMask(maskValue.join(' '), actionStep) || changed;

                // tracking

                changed = changeTrackingFromSummary(lowCased, actionStep) || changed;

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

                changed = changeActionStepType(typeValue, actionStep) || changed;

                return changed;

            }


            function changeTrackingFromSummary(summaryString, actionStep) {

                var changed = false;

                var lowCased = summaryString.toLowerCase();

                var trackingValue = undefined;
                if (lowCased.search('d') >= 0) {
                    trackingValue = false;
                } else
                if (lowCased.search('t') >= 0) {
                    trackingValue = true;
                }

                if (trackingValue === undefined) {
                    changed = changeActionStepTracking(false, true, actionStep) || changed;
                } else {
                    changed = changeActionStepTracking(trackingValue, false, actionStep) || changed;
                }

                return changed;

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


            // undefined, true or false
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


            // undefined, true or false
            function actionStepToTogglesStanceChecked(actionStep) { return actionStep.togglesStance; }
            function changeActionStepTogglesStance(isChecked, isIndeterminate, actionStep) {
                var newValue = isIndeterminate ? undefined : isChecked;
                var oldValue = actionStep.togglesStance;
                actionStep.togglesStance = newValue;
                return oldValue !== newValue;
            }


            function actionStepToReachText(actionStep) { return actionStep.reach || ''; }
            function changeActionStepReach(newValue, actionStep) {
                var newReach = parseFloat(newValue.replace(',', '.'));
                var oldValue = actionStep.reach;
                actionStep.reach = newReach;
                return oldValue !== newReach;
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

        }

    }

);
