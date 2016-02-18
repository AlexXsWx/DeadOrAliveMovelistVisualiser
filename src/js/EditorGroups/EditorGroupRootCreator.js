define(

    'EditorGroups/EditorGroupRootCreator',

    ['EditorGroups/EditorGroup', 'EditorGroups/EditorTools', 'NodeFactory', 'Tools'],

    function(EditorGroup, EditorTools, NodeFactory, _) {

        return { create: create };

        function create(changeNodes) {

            var editorGroupRoot = new EditorGroup(
                'root', _.getDomElement('editorRoot'), filter, focus, bindListeners, updateView
            );

            var characterName = _.getDomElement('editorRootCharacterName');
            var gameVersion   = _.getDomElement('editorRootGameVersion');

            return editorGroupRoot;

            function filter(data) { return data && NodeFactory.isRootNode(data); }
            
            function focus() {
                characterName.select();
                return true;
            }

            function bindListeners() {
                EditorTools.initInputElement(characterName, onCharacterNameInput);
                EditorTools.initInputElement(gameVersion,   onGameVersionInput);
            }

            function updateView() {

                var editorGroup = this;

                // FIXME: consider differences between matching nodes

                var nodeView = editorGroup.matchingSelectedViews[0];
                var nodeData = nodeView.fd3Data.binding.targetDataNode;

                characterName.value = nodeData && nodeData.character || '';
                gameVersion.value   = nodeData && nodeData.version   || '';

            }

            // FIXME

            function onCharacterNameInput(event) {
                var inputElement = this;
                changeNodes(inputElement, editorGroupRoot, setCharacterNameFromInput);
            }

            function onGameVersionInput(event) {
                var inputElement = this;
                changeNodes(inputElement, editorGroupRoot, setGameVersionFromInput);
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