define(
    'EditorGroups/MoveActionStepResult',

    [
        'UI/TableRowInput',
        'Strings',
        'Tools'
    ],

    function MoveActionStepResult(TableRowInput, Strings, _) {

        var inputEnum = {
            condition:         0,
            hitBlock:          1,
            criticalHoldDelay: 2,
            stunDurationMin:   3,
            stunDurationMax:   4,
            tags:              5
        };
        var lastSelectedInput = -1;

        return {
            create: create,
            resetLastSelectedInput: resetLastSelectedInput
        };

        function create(changeActionStepResult, onRemove) {

            var domRoot = _.createDomElement({ tag: 'table' });

            var btnRemove = _.createMergedRow(2, [
                _.createDomElement({
                    tag: 'input',
                    attributes: {
                        'type': 'button',
                        'value': 'Remove result',
                        'title': 'Remove this action step result'
                    },
                    listeners: {
                        'click': function(event) {
                            onRemove();
                        }
                    }
                })
            ]);

            var condition = TableRowInput.create({
                name: Strings('moveActionResultCondition'),
                onInput: function onConditionInput(newValue) {
                    changeActionStepResult(function(actionStepResult) {
                        return changeCondition(newValue, actionStepResult);
                    });
                },
                onFocus: function(event) {
                    lastSelectedInput = inputEnum.condition;
                },
                description: Strings('moveActionResultConditionDescription'),
                placeholder: 'e.g. neutral/open, stun/open'
            });

            var hitBlock = TableRowInput.create({
                name: 'Hit block',
                onInput: function onHitBlockInput(newValue) {
                    changeActionStepResult(function(actionStepResult) {
                        return changeHitBlock(newValue, actionStepResult);
                    });
                },
                onFocus: function(event) {
                    lastSelectedInput = inputEnum.hitBlock;
                },
                description: 'cooldown + advantage + active frames after the one that hit',
                placeholder: 'e.g. 15'
            });

            var criticalHoldDelay = TableRowInput.create({
                name: 'Critical hold delay',
                onInput: function onCriticalHoldDelayInput(newValue) {
                    changeActionStepResult(function(actionStepResult) {
                        return changeCriticalHoldDelay(newValue, actionStepResult);
                    });
                },
                onFocus: function(event) {
                    lastSelectedInput = inputEnum.criticalHoldDelay;
                },
                description: 'First number in critical hold interval',
                placeholder: 'e.g. 6'
            });

            var stunDurationMin = TableRowInput.create({
                name: 'Stun duration min',
                onInput: function onStunDurationMinInput(newValue) {
                    changeActionStepResult(function(actionStepResult) {
                        return changeStunDurationMin(newValue, actionStepResult);
                    });
                },
                onFocus: function(event) {
                    lastSelectedInput = inputEnum.stunDurationMin;
                },
                description: 'Second number in critical hold interval with stagger escape off',
                placeholder: 'e.g. 60'
            });

            var stunDurationMax = TableRowInput.create({
                name: 'Stun duration max',
                onInput: function onStunDurationMaxInput(newValue) {
                    changeActionStepResult(function(actionStepResult) {
                        return changeStunDurationMax(newValue, actionStepResult);
                    });
                },
                onFocus: function(event) {
                    lastSelectedInput = inputEnum.stunDurationMax;
                },
                description: 'Second number in critical hold interval with stagger escape on',
                placeholder: 'e.g. 50'
            });

            var tags = TableRowInput.create({
                name: Strings('moveActionResultTags'),
                onInput: function onTagsInput(newValue) {
                    changeActionStepResult(function(actionStepResult) {
                        return changeTags(newValue, actionStepResult);
                    });
                },
                onFocus: function(event) {
                    lastSelectedInput = inputEnum.tags;
                },
                description: Strings('moveActionResultTagsDescription'),
                placeholder: 'e.g. sit-down stun'
            });

            domRoot.appendChild(condition.domRoot);
            domRoot.appendChild(hitBlock.domRoot);
            domRoot.appendChild(criticalHoldDelay.domRoot);
            domRoot.appendChild(stunDurationMin.domRoot);
            domRoot.appendChild(stunDurationMax.domRoot);
            domRoot.appendChild(tags.domRoot);
            domRoot.appendChild(btnRemove);

            return {
                domRoot: domRoot,
                clear: clear,
                fillFromActionStepResult: fillFromActionStepResult,
                focus: focus
            };

            function clear() {
                condition.setValue('');
                hitBlock.setValue('');
                criticalHoldDelay.setValue('');
                stunDurationMin.setValue('');
                stunDurationMax.setValue('');
                tags.setValue('');
            }

            function fillFromActionStepResult(actionStepResult) {

                if (!actionStepResult) {
                    clear();
                    return;
                }

                condition.setValue(actionStepResult.condition.join(', ') || '');
                hitBlock.setValue(actionStepResult.hitBlock || '');
                criticalHoldDelay.setValue(actionStepResult.criticalHoldDelay || '');
                stunDurationMin.setValue(actionStepResult.stunDurationMin || '');
                stunDurationMax.setValue(actionStepResult.stunDurationMax || '');
                tags.setValue(actionStepResult.tags.join(', ') || '');

            }

            function focus() {

                if (lastSelectedInput < 0) return false;

                switch (lastSelectedInput) {
                    case inputEnum.condition:         condition.focus();         break;
                    case inputEnum.hitBlock:          hitBlock.focus();          break;
                    case inputEnum.criticalHoldDelay: criticalHoldDelay.focus(); break;
                    case inputEnum.stunDurationMin:   stunDurationMin.focus();   break;
                    case inputEnum.stunDurationMax:   stunDurationMax.focus();   break;
                    case inputEnum.tags:              tags.focus();              break;
                }

                return true;

            }

            function changeCondition(newValue, actionStepResult) {
                var newConditions = newValue.split(/\s*,\s*/);
                var changed = _.arraysConsistOfSameStrings(actionStepResult.condition, newConditions);
                actionStepResult.condition = newConditions;
                return changed;
            }

            function changeHitBlock(newValue, actionStepResult) {
                var oldValue = actionStepResult.hitBlock;
                actionStepResult.hitBlock = newValue;
                return newValue === oldValue;
            }

            function changeCriticalHoldDelay(newValue, actionStepResult) {
                var oldValue = actionStepResult.criticalHoldDelay;
                actionStepResult.criticalHoldDelay = newValue;
                return newValue === oldValue;
            }

            function changeStunDurationMin(newValue, actionStepResult) {
                var oldValue = actionStepResult.stunDurationMin;
                actionStepResult.stunDurationMin = newValue;
                return newValue === oldValue;
            }

            function changeStunDurationMax(newValue, actionStepResult) {
                var oldValue = actionStepResult.stunDurationMax;
                actionStepResult.stunDurationMax = newValue;
                return newValue === oldValue;
            }

            function changeTags(newValue, actionStepResult) {
                var newTags = newValue.split(/,\s*/);
                var changed = _.arraysConsistOfSameStrings(actionStepResult.tags, newTags);
                actionStepResult.tags = newTags;
                return changed;
            }
        }

        function resetLastSelectedInput() {
            lastSelectedInput = -1;
        }

    }
)