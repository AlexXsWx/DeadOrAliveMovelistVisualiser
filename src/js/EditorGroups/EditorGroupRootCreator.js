define(

    'EditorGroups/EditorGroupRootCreator',

    [
        'EditorGroups/EditorGroup',
        'EditorGroups/EditorCreatorBase',
        'NodeFactory',
        'Strings',
        'Tools'
    ],

    function EditorGroupRootCreator(EditorGroup, EditorCreatorBase, NodeFactory, Strings, _) {

        return { create: create };

        function create(selectedNodesModifier) {

            var inputs = [
                {
                    id: 'characterName',
                    inputType: EditorCreatorBase.INPUT_TYPES.text,
                    label: Strings('characterName'),
                    description: Strings('characterNameDescription'),
                    placeholderText: Strings('characterNamePlaceholder'),
                    fill: characterNameToText,
                    parameterModifier: changeCharacterName,
                    focused: true
                }, {
                    id: 'gameVersion',
                    inputType: EditorCreatorBase.INPUT_TYPES.text,
                    label: Strings('gameVersion'),
                    description: Strings('gameVersionDescription'),
                    placeholderText: Strings('gameVersionPlaceholder'),
                    fill: gameVersionToText,
                    parameterModifier: changeGameVersion
                }
            ];

            // TODO: context abbreviations
            // <tr title="Context abbreviations and descriptions">
            //     <td colspan="2">
            //         <input type="button" value="remove unused" />
            //     </td>
            // </tr>

            var editorGroup2 = EditorCreatorBase.createEditorCreator({
                id: 'root',
                inputs: inputs,
                selectedNodesModifier: selectedNodesModifier
            });

            var editorGroupRoot = new EditorGroup('root', filter, editorGroup2.focus, updateView);

            editorGroupRoot.domRoot.appendChild(editorGroup2.domRoot);

            return editorGroupRoot;

            function filter(data) { return data && NodeFactory.isRootNode(data); }

            function updateView() {

                var editorGroup = this;

                // FIXME: consider differences between matching nodes

                var nodeView = editorGroup.matchingSelectedViews[0];
                var nodeData = nodeView.binding.targetDataNode;

                editorGroup2.fill(nodeData);

            }

            function characterNameToText(nodeData) { return nodeData.character || ''; }
            function changeCharacterName(newValue, nodeData) {
                var oldValue = nodeData.character;
                nodeData.character = newValue;
                return oldValue !== newValue;
            }

            function gameVersionToText(nodeData) { return nodeData.version || ''; }
            function changeGameVersion(newValue, nodeData) {
                var oldValue = nodeData.version;
                nodeData.version = newValue;
                return oldValue !== newValue;
            }

        }

    }

);