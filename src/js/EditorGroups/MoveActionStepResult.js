define(
    'EditorGroups/MoveActionStepResult',

    [
        'UI/TableRowInput',
        'Strings',
        'Tools'
    ],

    function(TableRowInput, Strings, _) {

        return { create: create };

        function create(changeActionStepResult, onRemove) {

            var domRoot = _.createDomElement({ tag: 'table' });

            var btnRemove = _.createDomElement({
                tag: 'tr',
                children: [
                    _.createDomElement({
                        tag: 'td',
                        attributes: { 'colspan': 2 },
                        children: [
                            _.createDomElement({
                                tag: 'input',
                                attributes: {
                                    'type': 'button',
                                    'value': 'Remove result'
                                },
                                listeners: {
                                    'click': function(event) {
                                        onRemove();
                                    }
                                }
                            })
                        ]
                    })
                ]
            });

            var condition = TableRowInput.create({
                name: Strings('moveActionResultCondition'),
                onInput: function onConditionInput(newValue) {
                    changeActionStepResult(function(actionStepResult) {
                        return changeCondition(newValue, actionStepResult);
                    });
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
                description: Strings('moveActionResultTagsDescription'),
                placeholder: 'e.g. sit-down stun'
            });

            domRoot.appendChild(btnRemove);
            domRoot.appendChild(condition.domRoot);
            domRoot.appendChild(hitBlock.domRoot);
            domRoot.appendChild(criticalHoldDelay.domRoot);
            domRoot.appendChild(stunDurationMin.domRoot);
            domRoot.appendChild(stunDurationMax.domRoot);
            domRoot.appendChild(tags.domRoot);

            return {
                domRoot: domRoot,
                clear: clear,
                fillFromActionStepResult: fillFromActionStepResult
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

    }
)