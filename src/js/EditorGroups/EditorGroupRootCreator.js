define(

    'EditorGroups/EditorGroupRootCreator',

    ['EditorGroups/EditorGroup', 'Input/InputHelper', 'NodeFactory', 'Tools'],

    function(EditorGroup, InputHelper, NodeFactory, _) {

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
                InputHelper.initInputElement(characterName, onCharacterNameInput);
                InputHelper.initInputElement(gameVersion,   onGameVersionInput);
            }

            function updateView() {

                var editorGroup = this;

                // FIXME: consider differences between matching nodes

                var nodeView = editorGroup.matchingSelectedViews[0];
                var nodeData = nodeView.binding.targetDataNode;

                characterName.value = nodeData && nodeData.character || '';
                gameVersion.value   = nodeData && nodeData.version   || '';

            }

            // FIXME

            function onCharacterNameInput(event) {
                var inputElement = this;
                var newValue = inputElement.value;
                changeNodes(editorGroupRoot, function(nodeData) {
                    return changeCharacterName(newValue, nodeData);
                });
            }

            function onGameVersionInput(event) {
                var inputElement = this;
                var newValue = inputElement.value;
                changeNodes(editorGroupRoot, function(nodeData) {
                    return changeGameVersion(newValue, nodeData);
                });
            }

            // readers

            function changeCharacterName(newValue, nodeData) {
                var oldValue = nodeData.character;
                nodeData.character = newValue;
                return oldValue !== newValue;
            }

            function changeGameVersion(newValue, nodeData) {
                var oldValue = nodeData.version;
                nodeData.version = newValue;
                return oldValue !== newValue;
            }

        }

    }

);