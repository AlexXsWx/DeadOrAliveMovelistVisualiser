define(
    // TODO: find a better name
    'EditorGroups/EditorCreatorBase',

    [
        'UI/TableRowInput',
        'UI/TableRowTristateCheckbox',
        'UI/TableRowButton',
        'Tools'
    ],

    function EditorCreatorBase(TableRowInput, TableRowTristateCheckbox, TableRowButton, _) {

        var INPUT_TYPES = {
            text:     0,
            checkbox: 1,
            button:   2
        };

        var lastSelectedInputIdPerEditorGroupId = {};

        return {
            INPUT_TYPES:                 INPUT_TYPES,
            createEditorCreator:         createEditorCreator, // TODO: find a better name
            resetLastSelectedInputForId: resetLastSelectedInputForId
        };

        function createEditorCreator(options) {

            // Sort of an API for the argument
            var editorGroupId               = options.id;
            var editorInputsDescription     = options.inputs;
            var changeSelectedNodesByAction = options.selectedNodesModifier;
            var editorExtension             = options.optExtension;
            var canHaveChildrenEditors      = options.childrenStuff;
            if (canHaveChildrenEditors) {
                var resetChildEditorsFocus             = options.childrenStuff.focusReset;
                var getChildrenDataArray               = options.childrenStuff.getChildrenArray;
                var childrenDataCreator                = options.childrenStuff.childrenDataCreator;
                var childEditorCreator                 = options.childrenStuff.childEditorCreator;
                var childrenEditorName                 = options.childrenStuff.name;
                var childrenEditorAddButtonText        = options.childrenStuff.addButtonValue;
                var childrenEditorAddButtonDescription = options.childrenStuff.addButtonDescription;
            }

            var domRoot = _.createDomElement({ tag: 'table' });

            var childrenEditors = []; // or keep undefined for when without children?
            var editorInputs = {};
            var editorInputFillers = {};

            if (!lastSelectedInputIdPerEditorGroupId.hasOwnProperty(editorGroupId)) {
                lastSelectedInputIdPerEditorGroupId[editorGroupId] = '';
            }

            editorInputsDescription.forEach(function(editorInputDescription, index) {

                // Sort of an API for the argument
                var editorInputId            = editorInputDescription.id;
                var inputType                = editorInputDescription.inputType;
                var name                     = editorInputDescription.label;
                var description              = editorInputDescription.description;
                var placeholderText          = editorInputDescription.placeholderText; // text only
                var filler                   = editorInputDescription.fill;
                var nodeDataParameterChanger = editorInputDescription.parameterModifier;
                var onClick                  = editorInputDescription.onClick; // button only
                // var includedInSummaries = editorInputDescription.includedInSummaries;

                if (filler !== undefined) editorInputFillers[editorInputId] = filler;

                var tableRow = null;

                if (inputType === INPUT_TYPES.text) {
                    tableRow = TableRowInput.create({
                        name: name,
                        description: description,
                        placeholder: placeholderText,
                        onInput: textInputHandler,
                        onFocus: rememberFocusedElement
                    });
                } else
                if (inputType === INPUT_TYPES.checkbox) {
                    tableRow = TableRowTristateCheckbox.create({
                        name: name,
                        description: description,
                        isIndeterminate: true,
                        onChange: checkboxChangeHandler,
                        onFocus: rememberFocusedElement
                    });
                } else
                if (inputType === INPUT_TYPES.button) {
                    tableRow = TableRowButton.create({
                        name: name,
                        description: description,
                        onClick: onClick,
                        onFocus: rememberFocusedElement
                    });
                }

                if (tableRow) {
                    editorInputs[editorInputId] = tableRow;
                    domRoot.appendChild(tableRow.domRoot);
                }

                function textInputHandler(newValue) {
                    changeSelectedNodesByAction(function baseTextChanger(/* arguments */) {
                        var args = [newValue];
                        for (var i = 0; i < arguments.length; ++i) args.push(arguments[i]);
                        var changed = nodeDataParameterChanger.apply(null, args);
                        // includedInSummaries.forEach(function(id) {
                        //     editorInputs[id]
                        // });
                        return changed;
                    });
                }

                function checkboxChangeHandler(isChecked, isIndeterminate) {
                    changeSelectedNodesByAction(function baseCheckboxChanger(/* arguments */) {
                        var args = [isChecked, isIndeterminate];
                        for (var i = 0; i < arguments.length; ++i) args.push(arguments[i]);
                        var changed = nodeDataParameterChanger.apply(null, args);
                        // includedInSummaries.forEach(function(id) {
                        //     editorInputs[id]
                        // });
                        return changed;
                    });
                }

                function rememberFocusedElement(optEvent) {
                    resetChildEditorsFocus && resetChildEditorsFocus();
                    lastSelectedInputIdPerEditorGroupId[editorGroupId] = editorInputId;
                }

            });

            if (canHaveChildrenEditors) {

                var childrenEditorsParent = _.createDomElement({
                    tag: 'td',
                    attributes: { 'colspan': 2 }
                });

                var childrenEditorsParentWrapper = _.createDomElement({
                    tag: 'tr',
                    children: [ childrenEditorsParent ]
                });

                var childEditorTitle = _.createMergedRow(2, [
                    _.createDomElement({
                        tag: 'label',
                        children: [ _.createTextNode(childrenEditorName) ]
                    })
                ]);

                var btnAddChildEditor = TableRowButton.create({
                    name: childrenEditorAddButtonText,
                    description: childrenEditorAddButtonDescription,
                    onClick: addChildData
                });

                domRoot.appendChild(childEditorTitle);
                domRoot.appendChild(childrenEditorsParentWrapper);
                domRoot.appendChild(btnAddChildEditor.domRoot);

            }

            return {
                domRoot: domRoot,
                clear: clear,
                fill: fill,
                focus: focus,
                fillTextInput: fillTextInput,
                fillCheckbox:  fillCheckbox,
                extension: editorExtension,
                getFirstChildrenEditor: getFirstChildrenEditor
            };

            function getFirstChildrenEditor() {
                return childrenEditors[0];
            }

            function clear() {
                _.forEachOwnProperty(editorInputs, function(editorInputId, editorInput) {
                    // if (
                    //     (editorInput instanceof TableRowInput) ||
                    //     (editorInput instanceof TableRowTristateCheckbox)
                    // ) {
                        editorInput.clear && editorInput.clear();
                    // }
                });
                clearChildrenEditorGroups();
            }

            function fill(data) {

                if (!data) {
                    clear();
                    return;
                }

                // TODO: update summaries

                _.forEachOwnProperty(editorInputs, function(editorInputId, editorInput) {

                    if (
                        // summary || // ???
                        // (editorInput instanceof TableRowButton) ||
                        !editorInputFillers.hasOwnProperty(editorInputId)
                    ) {
                        return;
                    }

                    var value = editorInputFillers[editorInputId](data);

                    if (editorInput.setValue) {// editorInput instanceof TableRowInput) {
                        if (document.activeElement !== editorInput.input) {
                            editorInput.setValue(value);
                        }
                    } else
                    // if (editorInput instanceof TableRowTristateCheckbox) {
                    if (editorInput.setIsChecked && editorInput.setIsIndeterminate) {
                        if (value === undefined) {
                            editorInput.setIsIndeterminate(true);
                            editorInput.setIsChecked(false);
                        } else {
                            editorInput.setIsIndeterminate(false);
                            editorInput.setIsChecked(value);
                        }
                    }

                });

                if (canHaveChildrenEditors) {
                    clearChildrenEditorGroups();
                    getChildrenDataArray(data).forEach(function(childData) {
                        var editor = addChildEditorGroup();
                        editor.fill(childData);
                    });
                }
            }

            function addChildEditorGroup() {

                var editor = childEditorCreator(changeSelectedNodesSubDataByAction, remove);
                childrenEditorsParent.appendChild(editor.domRoot);
                childrenEditors.push(editor);

                return editor;

                function changeSelectedNodesSubDataByAction(nodeSubDataParameterChanger) {
                    changeSelectedNodesByAction(function(data) {
                        var index = childrenEditors.indexOf(editor);
                        return nodeSubDataParameterChanger(
                            getChildrenDataArray(data)[index]
                        );
                    });
                }

                function remove() {
                    var index = childrenEditors.indexOf(editor);
                    childrenEditors.splice(index, 1);
                    childrenEditorsParent.removeChild(editor.domRoot);
                    changeSelectedNodesByAction(function(data) {
                        getChildrenDataArray(data).splice(index, 1);
                        var changed = true;
                        return changed;
                    });
                }

            }

            function addChildData() {
                addChildEditorGroup();
                changeSelectedNodesByAction(function(data) {
                    getChildrenDataArray(data).push(childrenDataCreator());
                    var changed = true;
                    return changed;
                });
            }

            function clearChildrenEditorGroups() {
                _.removeAllChildren(childrenEditorsParent);
                childrenEditors = [];
            }

            function focus() {
                var childrenTookFocus = (
                    childrenEditors.length > 0 &&
                    childrenEditors[0].focus()
                );
                if (childrenTookFocus) return true;
                var editorInputId = lastSelectedInputIdPerEditorGroupId[editorGroupId];
                if (editorInputId) {
                    editorInputs[editorInputId].focus();
                    return true;
                }
                return false;
            }

            function fillTextInput(editorInputId, value) {
                editorInputs[editorInputId].setValue(value, true);
            }

            function fillCheckbox(editorInputId, isChecked, isIndeterminate) {
                var input = editorInputs[editorInputId];
                if (isIndeterminate) {
                    input.setIsChecked(isChecked, false);
                    input.setIsIndeterminate(true, true);
                } else {
                    input.setIsIndeterminate(false, false);
                    input.setIsChecked(isChecked, true);
                }
            }

        }

        function resetLastSelectedInputForId(editorGroupId) {
            if (lastSelectedInputIdPerEditorGroupId.hasOwnProperty(editorGroupId)) {
                lastSelectedInputIdPerEditorGroupId[editorGroupId] = '';
            }
        }

    }

);