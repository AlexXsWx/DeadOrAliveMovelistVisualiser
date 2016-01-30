define(

    'editorGroups/editorGroupRootCreator',

    ['editorGroups/EditorGroup', 'editorGroups/editorTools', 'node', 'tools'],

    function(EditorGroup, editorTools, node, _) {

        return { create: create };

        function create(changeNodes) {

            var editorGroup = new EditorGroup(
                'root', _.getDomElement('editorRoot'), filter, focus, bindListeners, updateView
            );

            var characterName = _.getDomElement('editorRootCharacterName');
            var gameVersion   = _.getDomElement('editorRootGameVersion');

            return editorGroup;

            function filter(data) { return data && node.isRootNode(data); }
            
            function focus() {
                characterName.select();
                return true;
            }

            function bindListeners() {
                editorTools.initInputElement(characterName, onCharacterNameInput);
                editorTools.initInputElement(gameVersion,   onGameVersionInput);
            }

            function updateView() {

                var nodeView = this.matchingSelectedViews[0];
                var nodeData = nodeView.fd3Data.binding.targetDataNode;

                characterName.value = nodeData && nodeData.character || '';
                gameVersion.value   = nodeData && nodeData.version   || '';

            }

            // FIXME

            function onCharacterNameInput(event) {
                var inputElement = this;
                changeNodes(inputElement, editorGroup, setCharacterNameFromInput);
            }

            function onGameVersionInput(event) {
                var inputElement = this;
                changeNodes(inputElement, editorGroup, setGameVersionFromInput);
            }

            // readers

            function setCharacterNameFromInput(inputElement, nodeData) {
                var changed = nodeData.character !== inputElement.value;
                nodeData.character = inputElement.value;
                return changed;
            }

            function setGameVersionFromInput(inputElement, nodeData) {
                var changed = nodeData.version !== inputElement.value;
                nodeData.version = inputElement.value;
                return changed;
            }

        }

    }

);