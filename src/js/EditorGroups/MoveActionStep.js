define(
    'EditorGroups/MoveActionStep',

    [
        'NodeFactory',
        'EditorGroups/MoveActionStepResult',
        'UI/TableRowInput',
        'UI/TableRowTristateCheckbox',
        'Strings',
        'Tools'
    ],

    function(
        NodeFactory,
        MoveActionStepResult,
        TableRowInput,
        TableRowTristateCheckbox,
        Strings,
        _
    ) {

        return { create: create };

        function create(changeActionStep) {

            var domRoot = _.createDomElement({ tag: 'table' });

            var mask = TableRowInput.create({
                name: Strings('moveActionMask'),
                description: Strings('moveActionMaskDescription'),
                placeholder: 'e.g. mid P',
                onInput: function onActionStepMaskInput(newValue) {
                    changeActionStep(function(actionStep) {
                        return changeActionMask(newValue, actionStep);
                    });
                }
            });

            var type = TableRowInput.create({
                name: Strings('moveActionType'),
                onInput: function onActionStepTypeInput(newValue) {
                    changeActionStep(function(actionStep) {
                        return changeActionStepType(newValue, actionStep);
                    });
                },
                description: Strings('moveActionTypeDescription'),
                placeholder: 'e.g. strike'
            });

            var tracking = TableRowTristateCheckbox.create({
                name: Strings('moveActionTracking'),
                isIndeterminate: true,
                onChange: function onActionStepTrackingChange(isChecked, isIndeterminate) {
                    changeActionStep(function(actionStep) {
                        return changeActionStepTracking(isChecked, isIndeterminate, actionStep);
                    });
                },
                description: Strings('moveActionTrackingDescription')
            });

            var damage = TableRowInput.create({
                name: Strings('moveActionDamage'),
                onInput: function onActionStepDamageInput(newValue) {
                    changeActionStep(function(actionStep) {
                        return changeActionStepDamage(newValue, actionStep);
                    });
                },
                description: Strings('moveActionDamageDescription'),
                placeholder: 'e.g. 18'
            });

            // var condition = TableRowInput.create({
            //     name: Strings('moveActionCondition'),
            //     onInput: function onActionStepConditionInput(newValue) {
            //         changeActionStep(function(actionStep) {
            //             return changeActionStepCondition(newValue, actionStep);
            //         });
            //     },
            //     description: Strings('moveActionConditionDescription'),
            //     placeholder: 'e.g. neutral/open, stun/open'
            // });

            // var tags = TableRowInput.create({
            //     name: Strings('moveActionTags'),
            //     onInput: function onActionStepTagsInput(newValue) {
            //         changeActionStep(function(actionStep) {
            //             return changeActionStepTags(newValue, actionStep);
            //         });
            //     },
            //     description: Strings('moveActionTagsDescription'),
            //     placeholder: 'e.g. sit-down stun'
            // });

            var resultsParent = _.createDomElement({
                tag: 'td',
                attributes: { 'colspan': 2 }
            });
            var resultsParentWrapper = _.createDomElement({
                tag: 'tr',
                children: [ resultsParent ]
            });
            var results = [];

            var btnAddResult = _.createDomElement({
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
                                    'value': 'Add result'
                                },
                                listeners: {
                                    'click': function(event) {
                                        addResult();
                                    }
                                }
                            })
                        ]
                    })
                ]
            });

            domRoot.appendChild(mask.domRoot);
            domRoot.appendChild(type.domRoot);
            domRoot.appendChild(tracking.domRoot);
            domRoot.appendChild(damage.domRoot);
            // domRoot.appendChild(condition.domRoot);
            // domRoot.appendChild(tags.domRoot);
            domRoot.appendChild(resultsParent);
            domRoot.appendChild(btnAddResult);

            return {
                domRoot: domRoot,
                clear: clear,
                fillFromActionStep: fillFromActionStep
            };

            function clear() {
                mask.setValue('');
                type.setValue('');
                tracking.setIsChecked(false);
                tracking.setIsIndeterminate(true);
                damage.setValue('');
                // condition.setValue('');
                // tags.setValue('');
                resultsParent.innerHTML = '';
                results = [];
            }

            function fillFromActionStep(actionStep) {
                if (!actionStep) {
                    clear();
                    return;
                }

                mask.setValue(actionStep.actionMask || '');
                type.setValue(actionStep.actionType || '');

                if (actionStep.isTracking === undefined) {
                    tracking.setIsIndeterminate(true);
                    tracking.setIsChecked(false);
                } else {
                    tracking.setIsIndeterminate(false);
                    tracking.setIsChecked(actionStep.isTracking);
                }

                damage.setValue(actionStep.damage || '');
                // condition.setValue(actionStep.condition.join(', ') || '');
                // tags.setValue(actionStep.tags.join(', ') || '');

                resultsParent.innerHTML = '';
                results = [];
                for (var i = 0; i < actionStep.results.length; ++i) {
                    var result = createResultInput();
                    result.fillFromActionStepResult(actionStep.results[i]);
                }
            }

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

            function changeActionMask(newValue, actionStep) {
                var oldValue = actionStep.actionMask;
                actionStep.actionMask = newValue;
                return oldValue !== newValue;
            }


            function changeActionStepType(newValue, actionStep) {
                var oldValue = actionStep.actionType;
                actionStep.actionType = newValue;
                return oldValue !== newValue;
            }


            function changeActionStepTracking(isChecked, isIndeterminate, actionStep) {
                var newValue = isIndeterminate ? undefined : isChecked;
                var oldValue = actionStep.isTracking;
                actionStep.isTracking = newValue;
                return oldValue !== newValue;
            }

            function changeActionStepDamage(newValue, actionStep) {
                var newDamage = parseInt(newValue, 10);
                var oldValue = actionStep.damage;
                actionStep.damage = newDamage;
                return oldValue !== newDamage;
            }

            // function changeActionStepCondition(newValue, actionStep) {
            //     var newConditions = newValue.split(/,\s*/);
            //     var changed = _.arraysConsistOfSameStrings(actionStep.condition, newConditions);
            //     actionStep.condition = newConditions;
            //     return changed;
            // }

            // function changeActionStepTags(newValue, actionStep) {
            //     var newTags = newValue.split(/,\s*/);
            //     var changed = _.arraysConsistOfSameStrings(actionStep.tags, newTags);
            //     actionStep.tags = newTags;
            //     return changed;
            // }
        }

    }
)