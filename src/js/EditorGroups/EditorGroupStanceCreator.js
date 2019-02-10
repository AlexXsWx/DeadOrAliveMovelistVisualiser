define(

    'EditorGroups/EditorGroupStanceCreator',

    [
        'EditorGroups/EditorGroup',
        'EditorGroups/EditorCreatorBase',
        'Model/NodeFactoryStance',
        'View/NodeView',
        'Localization/Strings',
        'Tools/Tools'
    ],

    function EditorGroupStanceCreator(
        EditorGroup, EditorCreatorBase, NodeFactoryStance, NodeView, Strings, _
    ) {

        return { create: create };

        function create(selectedNodesModifier) {

            var inputs = [
                {
                    id: 'abbreviation',
                    inputType: EditorCreatorBase.INPUT_TYPES.text,
                    label: Strings('stanceAbbreviation'),
                    description: Strings('stanceAbbreviationDescription'),
                    placeholderText: Strings('stanceAbbreviationPlaceholder'),
                    fill: abbreviationToText,
                    parameterModifier: changeStanceAbbreviation,
                    focused: true
                }, {
                    id: 'description',
                    inputType: EditorCreatorBase.INPUT_TYPES.text,
                    label: Strings('stanceDescription'),
                    description: Strings('stanceDescriptionDescription'),
                    placeholderText: Strings('stanceDescriptionPlaceholder'),
                    fill: descriptionToText,
                    parameterModifier: changeStanceDescription
                }, {
                    id: 'extraFrame',
                    inputType: EditorCreatorBase.INPUT_TYPES.checkbox,
                    label: Strings('stanceExtraFrame'),
                    description: Strings('stanceExtraFrameDescription'),
                    fill: appliesExtraFrameToIsChecked,
                    parameterModifier: changeStanceExtraFrame,
                    classes: ['specific-to-doa']
                }
            ];

            var editorGroup2 = EditorCreatorBase.createEditorCreator({
                id: 'stance',
                inputs: inputs,
                selectedNodesModifier: selectedNodesModifier
            });

            var editorGroupStance = new EditorGroup('stance', filter, editorGroup2.focus, updateView);

            editorGroupStance.domRoot.appendChild(editorGroup2.domRoot);

            return editorGroupStance;

            function filter(data) { return data && NodeFactoryStance.isStanceNode(data); }

            function updateView(keepActiveSummaryContent) {

                var editorGroup = this;

                // FIXME: consider differences between matching nodes

                var nodeView = editorGroup.matchingSelectedViews[0];
                var nodeData = NodeView.getNodeData(nodeView);

                editorGroup2.fill(nodeData, keepActiveSummaryContent);

            }


            function abbreviationToText(nodeData) { return nodeData.abbreviation || ''; }
            function changeStanceAbbreviation(newValue, nodeData) {
                var oldValue = nodeData.abbreviation;
                nodeData.abbreviation = newValue;
                return oldValue !== newValue;
            }


            function descriptionToText(nodeData) { return nodeData.description || ''; }
            function changeStanceDescription(newValue, nodeData) {
                var oldValue = nodeData.description;
                nodeData.description = newValue;
                return oldValue !== newValue;
            }

            function appliesExtraFrameToIsChecked(nodeData) { return nodeData.appliesExtraFrame; }
            function changeStanceExtraFrame(isChecked, isIndeterminate, nodeData) {
                var newValue = isIndeterminate ? undefined : isChecked;
                var oldValue = nodeData.appliesExtraFrame;
                nodeData.appliesExtraFrame = newValue;
                return oldValue !== newValue;
            }

        }

    }

);
