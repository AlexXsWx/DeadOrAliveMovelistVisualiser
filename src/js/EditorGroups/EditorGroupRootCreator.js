define(

    'EditorGroups/EditorGroupRootCreator',

    ['EditorGroups/EditorGroup', 'UI/TableRowInput', 'NodeFactory', 'Strings', 'Tools'],

    function EditorGroupRootCreator(EditorGroup, TableRowInput, NodeFactory, Strings, _) {

        var inputEnum = {
            characterName: 0,
            gameVersion:   1
        };
        var lastSelectedInput = inputEnum.characterName;

        return { create: create };

        function create(changeNodes) {

            var editorGroupRoot = new EditorGroup('root', filter, focus, updateView);

            var characterName = TableRowInput.create({
                name: Strings('characterName'),
                description: Strings('characterNameDescription'),
                placeholder: Strings('characterNamePlaceholder'),
                onInput: function onCharacterNameInput(newValue) {
                    changeNodes(editorGroupRoot, function(nodeData) {
                        return changeCharacterName(newValue, nodeData);
                    });
                },
                onFocus: function onCharacterNameFocus(event) {
                    lastSelectedInput = inputEnum.characterName;
                }
            });

            var gameVersion = TableRowInput.create({
                name: Strings('gameVersion'),
                description: Strings('gameVersionDescription'),
                placeholder: Strings('gameVersionPlaceholder'),
                onInput: function onGameVersionInput(newValue) {
                    changeNodes(editorGroupRoot, function(nodeData) {
                        return changeGameVersion(newValue, nodeData);
                    });
                },
                onFocus: function onGameVersionFocus(event) {
                    lastSelectedInput = inputEnum.gameVersion;
                }
            });

            // TODO: context abbreviations
            // <tr title="Context abbreviations and descriptions">
            //     <td colspan="2">
            //         <input type="button" value="remove unused" />
            //     </td>
            // </tr>

            editorGroupRoot.domRoot.appendChild(characterName.domRoot);
            editorGroupRoot.domRoot.appendChild(gameVersion.domRoot);

            return editorGroupRoot;

            function filter(data) { return data && NodeFactory.isRootNode(data); }

            function clear() {
                characterName.setValue('');
                gameVersion.setValue('');
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

                characterName.setValue(nodeData.character || '');
                gameVersion.setValue(nodeData.version || '');

            }

            function focus() {

                if (lastSelectedInput < 0) return false;

                switch (lastSelectedInput) {
                    case inputEnum.characterName: characterName.focus(); break;
                    case inputEnum.gameVersion:   gameVersion.focus();   break;
                }

                return true;

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