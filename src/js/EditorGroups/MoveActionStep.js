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

    function MoveActionStep(
        NodeFactory,
        MoveActionStepResult,
        TableRowInput,
        TableRowTristateCheckbox,
        Strings,
        _
    ) {

        var inputEnum = {
            summary:  0,
            mask:     1,
            type:     2,
            tracking: 3,
            damage:   4,
            tags:     5
            // condition: 6,
        };
        var lastSelectedInput = -1;

        return {
            create: create,
            resetLastSelectedInput: resetLastSelectedInput
        };

        function create(changeActionStep) {

            var domRoot = _.createDomElement({ tag: 'table' });

            var summary = TableRowInput.create({
                name: Strings('moveActionSummary'),
                description: Strings('moveActionSummaryDescription'),
                placeholder: Strings('moveActionSummaryPlaceholder'),
                onInput: function onActionStepMaskInput(newValue) {
                    changeActionStep(function(actionStep) {
                        return changeActionSummary(newValue, actionStep);
                    });
                },
                onFocus: function(event) {
                    MoveActionStepResult.resetLastSelectedInput();
                    lastSelectedInput = inputEnum.summary;
                }
            });

            var mask = TableRowInput.create({
                name: Strings('moveActionMask'),
                description: Strings('moveActionMaskDescription'),
                placeholder: 'e.g. mid P',
                onInput: function onActionStepMaskInput(newValue) {
                    changeActionStep(function(actionStep) {
                        return changeActionMask(newValue, actionStep);
                    });
                },
                onFocus: function(event) {
                    MoveActionStepResult.resetLastSelectedInput();
                    lastSelectedInput = inputEnum.mask;
                }
            });

            var type = TableRowInput.create({
                name: Strings('moveActionType'),
                onInput: function onActionStepTypeInput(newValue) {
                    changeActionStep(function(actionStep) {
                        return changeActionStepType(newValue, actionStep);
                    });
                },
                onFocus: function(event) {
                    MoveActionStepResult.resetLastSelectedInput();
                    lastSelectedInput = inputEnum.type;
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
                onFocus: function(event) {
                    MoveActionStepResult.resetLastSelectedInput();
                    lastSelectedInput = inputEnum.tracking;
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
                onFocus: function(event) {
                    MoveActionStepResult.resetLastSelectedInput();
                    lastSelectedInput = inputEnum.damage;
                },
                description: Strings('moveActionDamageDescription'),
                placeholder: 'e.g. 18'
            });

            var tags = TableRowInput.create({
                name: Strings('moveActionTags'),
                onInput: function onActionStepTagsInput(newValue) {
                    changeActionStep(function(actionStep) {
                        return changeActionStepTags(newValue, actionStep);
                    });
                },
                onFocus: function(event) {
                    MoveActionStepResult.resetLastSelectedInput();
                    lastSelectedInput = inputEnum.tags;
                },
                description: Strings('moveActionTagsDescription'),
                placeholder: 'e.g. ground attack'
            });

            // var condition = TableRowInput.create({
            //     name: Strings('moveActionCondition'),
            //     onInput: function onActionStepConditionInput(newValue) {
            //         changeActionStep(function(actionStep) {
            //             return changeActionStepCondition(newValue, actionStep);
            //         });
            //     },
            //     onFocus: function(event) {
            //         MoveActionStepResult.resetLastSelectedInput();
            //         lastSelectedInput = inputEnum.condition;
            //     },
            //     description: Strings('moveActionConditionDescription'),
            //     placeholder: 'e.g. neutral/open, stun/open'
            // });

            var resultsTitle = _.createMergedRow(2, [
                _.createDomElement({
                    tag: 'label',
                    children: [ _.createTextNode('Action step results:') ]
                })
            ]);

            var resultsParent = _.createDomElement({
                tag: 'td',
                attributes: { 'colspan': 2 }
            });
            var resultsParentWrapper = _.createDomElement({
                tag: 'tr',
                children: [ resultsParent ]
            });
            var results = [];

            var btnAddResult = _.createMergedRow(2, [
                _.createDomElement({
                    tag: 'input',
                    attributes: {
                        'type': 'button',
                        'value': 'Add result for the action step',
                        'title': 'Tell what active frames do, hitblock / stun / launcher etc'
                    },
                    listeners: {
                        'click': function(event) {
                            addResult();
                        }
                    }
                })
            ]);

            domRoot.appendChild(summary.domRoot);
            domRoot.appendChild(mask.domRoot);
            domRoot.appendChild(type.domRoot);
            domRoot.appendChild(tracking.domRoot);
            domRoot.appendChild(damage.domRoot);
            domRoot.appendChild(tags.domRoot);
            // domRoot.appendChild(condition.domRoot);
            domRoot.appendChild(resultsTitle);
            domRoot.appendChild(resultsParentWrapper);
            domRoot.appendChild(btnAddResult);

            return {
                domRoot: domRoot,
                clear: clear,
                fillFromActionStep: fillFromActionStep,
                focus: focus
            };

            function clear() {
                summary.setValue('');
                mask.setValue('');
                type.setValue('');
                tracking.setIsChecked(false);
                tracking.setIsIndeterminate(true);
                damage.setValue('');
                tags.setValue('');
                // condition.setValue('');
                _.removeAllChildren(resultsParent);
                results = [];
            }

            function fillFromActionStep(actionStep) {

                if (!actionStep) {
                    clear();
                    return;
                }

                summary.setValue(NodeFactory.getActionStepSummary(actionStep));

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
                tags.setValue(actionStep.tags.join(', ') || '');
                // condition.setValue(actionStep.condition.join(', ') || '');

                _.removeAllChildren(resultsParent);
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

            function focus() {

                if (lastSelectedInput < 0) return false;

                if (!(results.length > 0 && results[0].focus())) {
                    switch (lastSelectedInput) {
                        case inputEnum.summary:   summary.focus();   break;
                        case inputEnum.mask:      mask.focus();      break;
                        case inputEnum.type:      type.focus();      break;
                        case inputEnum.tracking:  tracking.focus();  break;
                        case inputEnum.damage:    damage.focus();    break;
                        case inputEnum.tags:      tags.focus();      break;
                        // case inputEnum.condition: condition.focus(); break;
                    }
                }

                return true;

            }

            function addResult() {
                createResultInput();
                changeActionStep(function(actionStep) {
                    actionStep.results.push(NodeFactory.createMoveActionStepResult());
                    var changed = true;
                    return changed;
                });
            }
        }

        // ==== Readers ====

            function changeActionSummary(newValue, actionStep) {

                var changed = false;

                var lowCased = newValue.toLowerCase();

                // mask

                var mask = [];
                // FIXME: order is important!
                if (lowCased.search('h') >= 0) mask.push('high');
                if (lowCased.search('m') >= 0) mask.push('mid');
                if (lowCased.search('l') >= 0) mask.push('low');
                if (lowCased.search('f') >= 0) mask.push('ground'); // for Floor
                if (lowCased.search('p') >= 0) mask.push('P');
                if (lowCased.search('k') >= 0) mask.push('K');
                changed = changeActionMask(mask.join(' '), actionStep) || changed;

                // tracking

                var tracking = undefined;
                if (lowCased.search('d') >= 0) {
                    tracking = false;
                } else
                if (lowCased.search('t') >= 0) {
                    tracking = true;
                }

                changed = changeActionStepTracking(
                    tracking, tracking === undefined, actionStep
                ) || changed;

                // type

                var type = 'other';
                if (lowCased.search('g') >= 0) {
                    type = 'throw';
                } else
                if (lowCased.search('c') >= 0) {
                    type = 'hold';
                } else
                if (lowCased.search(/[pk]/) >= 0) {
                    if (lowCased.search('j') >= 0) {
                        type = 'jump attack';
                    } else {
                        type = 'strike';
                    }
                }

                changed = changeActionStepType(type, actionStep) || changed;

                return changed;

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

            function changeActionStepTags(newValue, actionStep) {
                var newTags = newValue.split(/,\s*/);
                var changed = _.arraysConsistOfSameStrings(actionStep.tags, newTags);
                actionStep.tags = newTags;
                return changed;
            }

            // function changeActionStepCondition(newValue, actionStep) {
            //     var newConditions = newValue.split(/,\s*/);
            //     var changed = _.arraysConsistOfSameStrings(actionStep.condition, newConditions);
            //     actionStep.condition = newConditions;
            //     return changed;
            // }

        // =================

        function resetLastSelectedInput() {
            lastSelectedInput = -1;
        }

    }
)