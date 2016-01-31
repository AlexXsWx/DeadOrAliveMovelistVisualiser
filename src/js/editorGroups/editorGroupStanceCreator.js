define(

    'editorGroups/editorGroupStanceCreator',

    ['editorGroups/EditorGroup', 'editorGroups/editorTools', 'node', 'tools'],

    function(EditorGroup, editorTools, node, _) {

        return { create: create };

        function create(changeNodes) {

            var editorGroupStance = new EditorGroup(
                'stance', _.getDomElement('editorStance'), filter, focus, bindListeners, updateView
            );

            var abbreviation = _.getDomElement('editorStanceAbbreviation');
            var description  = _.getDomElement('editorStanceDescription');
            var ending       = _.getDomElement('editorStanceEnding');

            return editorGroupStance;

            function filter(data) { return data && node.isStanceNode(data); }
            
            function focus() {
                abbreviation.select();
                return true;
            }

            function bindListeners() {
                editorTools.initInputElement(abbreviation, onAbbreviationInput);
                editorTools.initInputElement(description,  onDescriptionInput);
                editorTools.initInputElement(ending,       onEndingInput);
            }

            function updateView() {

                var editorGroup = this;

                // FIXME: consider differences between matching nodes

                var nodeView = editorGroup.matchingSelectedViews[0];
                var nodeData = nodeView.fd3Data.binding.targetDataNode;

                abbreviation.value = nodeData && nodeData.abbreviation || '';
                description.value  = nodeData && nodeData.description  || '';
                ending.value       = nodeData && nodeData.endsWith     || '';

            }

            // FIXME

            function onAbbreviationInput(event) {
                var inputElement = this;
                changeNodes(inputElement, editorGroupStance, setStanceAbbreviationFromInput);
            }

            function onDescriptionInput(event) {
                var inputElement = this;
                changeNodes(inputElement, editorGroupStance, setStanceDescriptionFromInput);
            }

            function onEndingInput(event) {
                var inputElement = this;
                changeNodes(inputElement, editorGroupStance, setStanceEndingFromInput);
            }

            // readers

            function setStanceAbbreviationFromInput(inputElement, nodeData) {
                var changed = nodeData.abbreviation !== inputElement.value;
                nodeData.abbreviation = inputElement.value;
                return changed;
            }


            function setStanceDescriptionFromInput(inputElement, nodeData) {
                var changed = nodeData.description !== inputElement.value;
                nodeData.description = inputElement.value;
                return changed;
            }


            function setStanceEndingFromInput(inputElement, nodeData) {
                var changed = nodeData.endsWith !== inputElement.value;
                nodeData.endsWith = inputElement.value;
                return changed;
            }

        }

    }

);