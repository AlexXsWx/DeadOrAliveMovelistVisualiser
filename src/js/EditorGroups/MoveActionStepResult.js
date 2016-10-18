define(

    'EditorGroups/MoveActionStepResult',

    [ 'EditorGroups/EditorCreatorBase', 'Strings', 'Tools' ],

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
                    id: 'tags',
                    inputType: EditorCreatorBase.INPUT_TYPES.text,
                    label: Strings('moveActionResultTags'),
                    description: Strings('moveActionResultTagsDescription'),
                    placeholderText: 'e.g. sit-down stun',
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
                var oldValue = actionStepResult.hitBlock;
                actionStepResult.hitBlock = newValue;
                return newValue === oldValue;
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
                var oldValue = actionStepResult.stunDurationMin;
                actionStepResult.stunDurationMin = newValue;
                return newValue === oldValue;
            }


            function actionStepResultToStunDurationMax(actionStepResult) {
                return actionStepResult.stunDurationMax || '';
            }

            function changeStunDurationMax(newValue, actionStepResult) {
                var oldValue = actionStepResult.stunDurationMax;
                actionStepResult.stunDurationMax = newValue;
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