define(

    'EditorGroups/EditorGroupStanceCreator',

    ['EditorGroups/EditorGroup', 'Input/InputHelper', 'NodeFactory', 'Tools'],

    function(EditorGroup, InputHelper, NodeFactory, _) {

        return { create: create };

        function create(changeNodes) {

            var editorGroupStance = new EditorGroup(
                'stance', _.getDomElement('editorStance'), filter, focus, bindListeners, updateView
            );

            var abbreviation = _.getDomElement('editorStanceAbbreviation');
            var description  = _.getDomElement('editorStanceDescription');
            var ending       = _.getDomElement('editorStanceEnding');

            return editorGroupStance;

            function filter(data) { return data && NodeFactory.isStanceNode(data); }
            
            function focus() {
                abbreviation.select();
                return true;
            }

            function bindListeners() {
                InputHelper.initInputElement(abbreviation, onAbbreviationInput);
                InputHelper.initInputElement(description,  onDescriptionInput);
                InputHelper.initInputElement(ending,       onEndingInput);
            }

            function updateView() {

                var editorGroup = this;

                // FIXME: consider differences between matching nodes

                var nodeView = editorGroup.matchingSelectedViews[0];
                var nodeData = nodeView.binding.targetDataNode;

                abbreviation.value = nodeData && nodeData.abbreviation || '';
                description.value  = nodeData && nodeData.description  || '';
                ending.value       = nodeData && nodeData.endsWith     || '';

            }

            // FIXME

            function onAbbreviationInput(event) {
                var inputElement = this;
                var newValue = inputElement.value;
                changeNodes(editorGroupStance, function(nodeData) {
                    changeStanceAbbreviation(newValue, nodeData)
                });
            }

            function onDescriptionInput(event) {
                var inputElement = this;
                var newValue = inputElement.value;
                changeNodes(editorGroupStance, function(nodeData) {
                    changeStanceDescription(newValue, nodeData)
                });
            }

            function onEndingInput(event) {
                var inputElement = this;
                var newValue = inputElement.value;
                changeNodes(editorGroupStance, function(nodeData) {
                    changeStanceEnding(newValue, nodeData)
                });
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