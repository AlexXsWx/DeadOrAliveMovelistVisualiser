define(

    'EditorGroups/EditorGroupStanceCreator',

    ['EditorGroups/EditorGroup', 'UI/TableRowInput', 'NodeFactory', 'Strings', 'Tools'],

    function EditorGroupStanceCreator(EditorGroup, TableRowInput, NodeFactory, Strings, _) {

        var inputEnum = {
            abbreviation: 0,
            description:  1,
            ending:       2
        };
        var lastSelectedInput = inputEnum.abbreviation;

        return { create: create };

        function create(changeNodes) {

            var editorGroupStance = new EditorGroup('stance', filter, focus, updateView);

            var abbreviation = TableRowInput.create({
                name: Strings('stanceAbbreviation'),
                description: Strings('stanceAbbreviationDescription'),
                placeholder: Strings('stanceAbbreviationPlaceholder'),
                onInput: function onAbbreviationInput(newValue) {
                    changeNodes(editorGroupStance, function(nodeData) {
                        return changeStanceAbbreviation(newValue, nodeData)
                    });
                },
                onFocus: function onAbbreviationFocus(event) {
                    lastSelectedInput = inputEnum.abbreviation;
                }
            });

            var description = TableRowInput.create({
                name: Strings('stanceDescription'),
                description: Strings('stanceDescriptionDescription'),
                placeholder: Strings('stanceDescriptionPlaceholder'),
                onInput: function onDescriptionInput(newValue) {
                    changeNodes(editorGroupStance, function(nodeData) {
                        return changeStanceDescription(newValue, nodeData)
                    });
                },
                onFocus: function onDescriptionFocus(event) {
                    lastSelectedInput = inputEnum.description;
                }
            });

            var ending = TableRowInput.create({
                name: Strings('stanceEnding'),
                description: Strings('stanceEndingDescription'),
                placeholder: Strings('stanceEndingPlaceholder'),
                onInput: function onEndingInput(newValue) {
                    changeNodes(editorGroupStance, function(nodeData) {
                        return changeStanceEnding(newValue, nodeData)
                    });
                },
                onFocus: function onEndingFocus(event) {
                    lastSelectedInput = inputEnum.ending;
                }
            });

            editorGroupStance.domRoot.appendChild(abbreviation.domRoot);
            editorGroupStance.domRoot.appendChild(description.domRoot);
            editorGroupStance.domRoot.appendChild(ending.domRoot);

            return editorGroupStance;

            function filter(data) { return data && NodeFactory.isStanceNode(data); }

            function clear() {
                abbreviation.setValue('');
                description.setValue('');
                ending.setValue('');
            }

            function updateView() {

                var editorGroup = this;

                // FIXME: consider differences between matching nodes

                var nodeView = editorGroup.matchingSelectedViews[0];
                var nodeData = nodeView.binding.targetDataNode;

                if (!nodeData) {
                    clear();
                    return;
                }

                abbreviation.setValue(nodeData.abbreviation || '');
                description.setValue(nodeData.description || '');
                ending.setValue(nodeData.endsWith || '');

            }

            function focus() {

                if (lastSelectedInput < 0) return false;

                switch (lastSelectedInput) {
                    case inputEnum.abbreviation: abbreviation.focus(); break;
                    case inputEnum.description:  description.focus();  break;
                    case inputEnum.ending:       ending.focus();       break;
                }

                return true;

            }

            // readers

            function changeStanceAbbreviation(newValue, nodeData) {
                var oldValue = nodeData.abbreviation;
                nodeData.abbreviation = newValue;
                return oldValue !== newValue;
            }


            function changeStanceDescription(newValue, nodeData) {
                var oldValue = nodeData.description;
                nodeData.description = newValue;
                return oldValue !== newValue;
            }


            function changeStanceEnding(newValue, nodeData) {
                var oldValue = nodeData.endsWith;
                nodeData.endsWith = newValue;
                return oldValue !== newValue;
            }

        }

    }

);