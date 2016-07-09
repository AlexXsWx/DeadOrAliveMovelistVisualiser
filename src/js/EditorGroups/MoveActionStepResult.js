define(

    'EditorGroups/MoveActionStepResult',

    [ 'EditorGroups/EditorCreatorBase', 'Strings', 'Tools' ],

    function MoveActionStepResult(EditorCreatorBase, Strings, _) {

        return {
            create: create,
            // resetLastSelectedInput: resetLastSelectedInput
        };

        function create(changeActionStepResult, onRemove) {

            var inputs = [
                {
                    id: 'remove',
                    inputType: EditorCreatorBase.INPUT_TYPES.button,
                    name: 'Remove result',
                    description: 'Remove this action step result',
                    onClick: onRemove
                }, {
                    id: 'condition',
                    inputType: EditorCreatorBase.INPUT_TYPES.text,
                    name: Strings('moveActionResultCondition'),
                    description: Strings('moveActionResultConditionDescription'),
                    placeholderText: 'e.g. neutral/open, stun/open',
                    fill: actionStepResultToCondition,
                    changeAction: changeCondition
                }, {
                    id: 'hitBlock',
                    inputType: EditorCreatorBase.INPUT_TYPES.text,
                    name: 'Hit block',
                    description: 'cooldown + advantage + active frames after the one that hit',
                    placeholderText: 'e.g. 15',
                    fill: actionStepResultToHitBlock,
                    changeAction: changeHitBlock
                }, {
                    id: 'criticalHoldDelay',
                    inputType: EditorCreatorBase.INPUT_TYPES.text,
                    name: 'Critical hold delay',
                    description: 'First number in critical hold interval',
                    placeholderText: 'e.g. 6',
                    fill: actionStepResultToCriticalHoldDelay,
                    changeAction: changeCriticalHoldDelay
                }, {
                    id: 'stunDurationMin',
                    inputType: EditorCreatorBase.INPUT_TYPES.text,
                    name: 'Stun duration min',
                    description: 'Second number in critical hold interval with stagger escape off',
                    placeholderText: 'e.g. 60',
                    fill: actionStepResultToStunDurationMin,
                    changeAction: changeStunDurationMin
                }, {
                    id: 'stunDurationMax',
                    inputType: EditorCreatorBase.INPUT_TYPES.text,
                    name: 'Stun duration max',
                    description: 'Second number in critical hold interval with stagger escape on',
                    placeholderText: 'e.g. 50',
                    fill: actionStepResultToStunDurationMax,
                    changeAction: changeStunDurationMax
                }, {
                    id: 'tags',
                    inputType: EditorCreatorBase.INPUT_TYPES.text,
                    name: Strings('moveActionResultTags'),
                    description: Strings('moveActionResultTagsDescription'),
                    placeholderText: 'e.g. sit-down stun',
                    fill: actionStepResultToTags,
                    changeAction: changeTags
                }
            ];

            var editorGroup = EditorCreatorBase.createEditorCreator({
                inputs: inputs,
                changer: changeActionStepResult
            });

            return editorGroup;


            function actionStepResultToCondition(actionStepResult) {
                return actionStepResult.condition.join(', ') || '';
            }

            function changeCondition(newValue, actionStepResult) {
                var newConditions = newValue.split(/\s*,\s*/);
                var changed = _.arraysConsistOfSameStrings(actionStepResult.condition, newConditions);
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