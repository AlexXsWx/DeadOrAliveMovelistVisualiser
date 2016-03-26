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
                onInput: function onActionStepConditionInput(newValue) {
                    changeActionStepResult(function(actionStepResult) {
                        return changeActionStepResultCondition(newValue, actionStepResult);
                    });
                },
                description: Strings('moveActionResultConditionDescription'),
                placeholder: 'e.g. neutral/open, stun/open'
            });

            var tags = TableRowInput.create({
                name: Strings('moveActionResultTags'),
                onInput: function onActionStepTagsInput(newValue) {
                    changeActionStepResult(function(actionStepResult) {
                        return changeActionStepResultTags(newValue, actionStepResult);
                    });
                },
                description: Strings('moveActionResultTagsDescription'),
                placeholder: 'e.g. sit-down stun'
            });

            domRoot.appendChild(btnRemove);
            domRoot.appendChild(condition.domRoot);
            domRoot.appendChild(tags.domRoot);

            return {
                domRoot: domRoot,
                clear: clear,
                fillFromActionStepResult: fillFromActionStepResult
            };

            function clear() {
                condition.setValue('');
                tags.setValue('');
            }

            function fillFromActionStepResult(actionStepResult) {

                if (!actionStepResult) {
                    clear();
                    return;
                }

                condition.setValue(actionStepResult.condition.join(', ') || '');
                tags.setValue(actionStepResult.tags.join(', ') || '');

            }

            function changeActionStepResultCondition(newValue, actionStepResult) {
                var newConditions = newValue.split(/\s*,\s*/);
                var changed = _.arraysConsistOfSameStrings(actionStepResult.condition, newConditions);
                actionStepResult.condition = newConditions;
                return changed;
            }

            function changeActionStepResultTags(newValue, actionStepResult) {
                var newTags = newValue.split(/,\s*/);
                var changed = _.arraysConsistOfSameStrings(actionStepResult.tags, newTags);
                actionStepResult.tags = newTags;
                return changed;
            }
        }

    }
)