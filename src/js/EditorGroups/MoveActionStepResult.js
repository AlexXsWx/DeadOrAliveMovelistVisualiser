define(

    'EditorGroups/MoveActionStepResult',

    [ 'EditorGroups/EditorCreatorBase', 'Localization/Strings', 'Tools/Tools' ],

    function MoveActionStepResult(EditorCreatorBase, Strings, _) {

        var editorGroupId = 'moveActionStepResult';

        return {
            id: editorGroupId,
            create: create
        };

        function create(selectedNodesActionStepResultModifier, removeFunc) {

            var inputs = [
                {
                    id: 'remove',
                    inputType: EditorCreatorBase.INPUT_TYPES.button,
                    label: 'Remove result',
                    description: 'Remove this action step result',
                    onClick: removeFunc
                }, {
                    id: 'condition',
                    inputType: EditorCreatorBase.INPUT_TYPES.text,
                    label: Strings('moveActionResultCondition'),
                    description: Strings('moveActionResultConditionDescription'),
                    placeholderText: 'e.g. neutral/open, stun/open',
                    datalist: 'actionStepSupportedConditions',
                    fill: actionStepResultToCondition,
                    parameterModifier: changeCondition
                }, {
                    id: 'hitBlock',
                    inputType: EditorCreatorBase.INPUT_TYPES.text,
                    label: 'Hit block',
                    description: 'recovery + advantage + active frames after the one that hit',
                    placeholderText: 'e.g. 15',
                    fill: actionStepResultToHitBlock,
                    parameterModifier: changeHitBlock
                }, {
                    id: 'criticalHoldDelay',
                    inputType: EditorCreatorBase.INPUT_TYPES.text,
                    label: 'Critical hold delay',
                    description: 'First number in critical hold interval',
                    placeholderText: 'e.g. 6',
                    fill: actionStepResultToCriticalHoldDelay,
                    parameterModifier: changeCriticalHoldDelay
                }, {
                    id: 'stunDurationMin',
                    inputType: EditorCreatorBase.INPUT_TYPES.text,
                    label: 'Stun dur. min',
                    description: 'Second number in critical hold interval with stagger escape off',
                    placeholderText: 'e.g. 60',
                    fill: actionStepResultToStunDurationMin,
                    parameterModifier: changeStunDurationMin
                }, {
                    id: 'stunDurationMax',
                    inputType: EditorCreatorBase.INPUT_TYPES.text,
                    label: 'Stun dur. max',
                    description: 'Second number in critical hold interval with stagger escape on',
                    placeholderText: 'e.g. 50',
                    fill: actionStepResultToStunDurationMax,
                    parameterModifier: changeStunDurationMax
                }, {
                    id: 'launchHeight',
                    inputType: EditorCreatorBase.INPUT_TYPES.text,
                    label: 'Launch height',
                    description: 'Height reported by 2nd page in Skill info (left side) vs Welter weight (e.g. Zack)',
                    placeholderText: 'e.g. 1.76',
                    fill: actionStepResultToLaunchHeight,
                    parameterModifier: changeLaunchHeight
                }, {
                    id: 'tags',
                    inputType: EditorCreatorBase.INPUT_TYPES.text,
                    label: Strings('moveActionResultTags'),
                    description: Strings('moveActionResultTagsDescription'),
                    placeholderText: 'e.g. sit-down stun',
                    datalist: 'actionStepSupportedTags',
                    fill: actionStepResultToTags,
                    parameterModifier: changeTags
                }
            ];

            var editorGroup = EditorCreatorBase.createEditorCreator({
                id: editorGroupId,
                inputs: inputs,
                selectedNodesModifier: selectedNodesActionStepResultModifier
            });

            return editorGroup;


            function actionStepResultToCondition(actionStepResult) {
                return actionStepResult.condition.join(', ') || '';
            }

            function changeCondition(newValue, actionStepResult) {
                var newConditions = newValue.split(/\s*,\s*/);
                var changed = _.arraysConsistOfSameStrings(
                    actionStepResult.condition, newConditions
                );
                actionStepResult.condition = newConditions;
                return changed;
            }


            function actionStepResultToHitBlock(actionStepResult) {
                return actionStepResult.hitBlock || '';
            }

            function changeHitBlock(newValue, actionStepResult) {
                var changed = (
                    actionStepResult.stunDurationMin !== undefined ||
                    actionStepResult.stunDurationMax !== undefined
                );
                actionStepResult.stunDurationMin = undefined;
                actionStepResult.stunDurationMax = undefined;

                var oldValue = actionStepResult.hitBlock;
                var newValueAsNumber = newValue ? Number(newValue) : undefined;
                actionStepResult.hitBlock = newValueAsNumber;
                return changed || newValueAsNumber === oldValue;
            }


            function actionStepResultToCriticalHoldDelay(actionStepResult) {
                return actionStepResult.criticalHoldDelay || '';
            }

            function changeCriticalHoldDelay(newValue, actionStepResult) {
                var oldValue = actionStepResult.criticalHoldDelay;
                actionStepResult.criticalHoldDelay = newValue;
                return newValue === oldValue;
            }


            function actionStepResultToStunDurationMin(actionStepResult) {
                return actionStepResult.stunDurationMin || '';
            }

            function changeStunDurationMin(newValue, actionStepResult) {
                var changed = actionStepResult.hitBlock !== undefined;
                actionStepResult.hitBlock = undefined;
                var oldValue = actionStepResult.stunDurationMin;
                var newValueAsNumber = newValue ? Number(newValue) : undefined;
                actionStepResult.stunDurationMin = newValueAsNumber;
                return changed || newValue === oldValue;
            }


            function actionStepResultToStunDurationMax(actionStepResult) {
                return actionStepResult.stunDurationMax || '';
            }

            function changeStunDurationMax(newValue, actionStepResult) {
                var changed = actionStepResult.hitBlock !== undefined;
                actionStepResult.hitBlock = undefined;
                var oldValue = actionStepResult.stunDurationMax;
                var newValueAsNumber = newValue ? Number(newValue) : undefined;
                actionStepResult.stunDurationMax = newValueAsNumber;
                return changed || newValue === oldValue;
            }


            function actionStepResultToLaunchHeight(actionStepResult) {
                return actionStepResult.launchHeight || '';
            }

            function changeLaunchHeight(newValue, actionStepResult) {
                var oldValue = actionStepResult.launchHeight;
                var newValueAsNumber = newValue ? Number(newValue) : undefined;
                actionStepResult.launchHeight = newValueAsNumber;
                return newValue === oldValue;
            }


            function actionStepResultToTags(actionStepResult) {
                return actionStepResult.tags.join(', ') || '';
            }

            function changeTags(newValue, actionStepResult) {
                var newTags = newValue.split(/,\s*/);
                var changed = _.arraysConsistOfSameStrings(actionStepResult.tags, newTags);
                actionStepResult.tags = newTags;
                return changed;
            }

        }

    }

);
