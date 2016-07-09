define(
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

        return {
            INPUT_TYPES:         INPUT_TYPES,
            createEditorCreator: createEditorCreator
        };

        function createEditorCreator(options) {

            // Sort of an API for the argument
            var optionsInput           = options.inputs;
            var specificGenericChanger = options.changer;
            // var childrenFocusReset     = options.childrenStuff.focusReset;

            var domRoot = _.createDomElement({ tag: 'table' });

            // var resultsParent = _.createDomElement({
            //     tag: 'td',
            //     attributes: { 'colspan': 2 }
            // });
            // var resultsParentWrapper = _.createDomElement({
            //     tag: 'tr',
            //     children: [ resultsParent ]
            // });
            // var results = [];

            // var resultsTitle = _.createMergedRow(2, [
            //     _.createDomElement({
            //         tag: 'label',
            //         children: [ _.createTextNode('Action step results:') ]
            //     })
            // ]);

            // var btnAddResult = _.createMergedRow(2, [
            //     _.createDomElement({
            //         tag: 'input',
            //         attributes: {
            //             'type': 'button',
            //             'value': 'Add result for the action step',
            //             'title': 'Tell what active frames do, hitblock / stun / launcher etc'
            //         },
            //         listeners: {
            //             'click': function(optEvent) { addResult(); }
            //         }
            //     })
            // ]);

            var inputs = {};
            var fillers = {};
            var lastSelectedInput = -1;

            optionsInput.forEach(function(inputOption, index) {

                var id                      = inputOption.id;
                var inputType               = inputOption.inputType;
                var name                    = inputOption.name;
                var description             = inputOption.description;
                var placeholderText         = inputOption.placeholderText; // text only
                var filler                  = inputOption.fill;
                var specificSpecificChanger = inputOption.changeAction;
                var onClick                 = inputOption.onClick; // button only
                // var includedInSummaries     = inputOption.includedInSummaries;

                if (filler !== undefined) fillers[inputOption.id] = filler;

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
                    inputs[id] = tableRow;
                    domRoot.appendChild(tableRow.domRoot);
                }

                function textInputHandler(newValue) {
                    specificGenericChanger(function baseTextChanger(/* arguments */) {
                        var args = [newValue];
                        for (var i = 0; i < arguments.length; ++i) args.push(arguments[i]);
                        var changed = specificSpecificChanger.apply(null, args);
                        // inputOption.includedInSummaries.forEach(function(id) {
                        //     inputs[id]
                        // });
                        // if (optUpdateSummary) {
                        //     updateActionStepSummaryInputValue(actionStep);
                        // }
                        return changed;
                    });
                }

                function checkboxChangeHandler(isChecked, isIndeterminate) {
                    specificGenericChanger(function baseCheckboxChanger(/* arguments */) {
                        var args = [isChecked, isIndeterminate];
                        for (var i = 0; i < arguments.length; ++i) args.push(arguments[i]);
                        var changed = specificSpecificChanger.apply(null, args);
                        // if (optUpdateSummary) {
                        //     updateActionStepSummaryInputValue(actionStep);
                        // }
                        return changed;
                    });
                }

                function rememberFocusedElement(optEvent) {
                    // childrenFocusReset && childrenFocusReset();
                    lastSelectedInput = index;
                }

            });

            return {
                domRoot: domRoot,
                clear: clear,
                fill: fill,
                focus: focus// ,
                // fillTextInput: fillTextInput,
                // fillCheckbox:  fillCheckbox
            };

            function clear() {
                _.forEachOwnProperty(inputs, function(key, value) {
                    // if (
                    //     (value instanceof TableRowInput) ||
                    //     (value instanceof TableRowTristateCheckbox)
                    // ) {
                        value.clear && value.clear();
                    // }
                });
                // clearResults();
            }

            function fill(/* arguments */) {

                if (arguments.length === 0) {
                    clear();
                    return;
                }


                var args = [];
                for (var i = 0; i < arguments.length; ++i) args.push(arguments[i]);

                // TODO: update summaries

                _.forEachOwnProperty(inputs, function(key, value) {

                    if (
                        // summary || // ???
                        // (value instanceof TableRowButton) ||
                        !fillers.hasOwnProperty(key)
                    ) {
                        return;
                    }

                    var v = fillers[key].apply(null, args);

                    if (value.setValue) {// value instanceof TableRowInput) {
                        if (document.activeElement !== value.input) value.setValue(v);
                    } else
                    if (setIsIndeterminate) {// value instanceof TableRowTristateCheckbox) {
                        if (v === undefined) {
                            value.setIsIndeterminate(true);
                            value.setIsChecked(false);
                        } else {
                            value.setIsIndeterminate(false);
                            value.setIsChecked(v);
                        }
                    }

                });

                // clearResults();
                // for (var i = 0; i < actionStep.results.length; ++i) {
                //     var result = createResultInput();
                //     result.fillFromActionStepResult(actionStep.results[i]);
                // }
            }

            // function clearResults() {
            //     _.removeAllChildren(resultsParent);
            //     results = [];
            // }

            function focus() {
                if (lastSelectedInput < 0) return false;
                // var childrenTookFocus = results.length > 0 && results[0].focus();
                // if (!childrenTookFocus) {
                    inputs[lastSelectedInput].focus();
                // }
                return true;
            }

            // function fillTextInput(id, value) {
            //     inputs[id].setValue(value, true);
            // }

            // function fillCheckbox(id, isChecked, isIndeterminate) {
            //     if (isIndeterminate) {
            //         input.setIsChecked(isChecked, false);
            //         input.setIsIndeterminate(true, true);
            //     } else {
            //         input.setIsIndeterminate(false, false);
            //         input.setIsChecked(isChecked, true);
            //     }
            // }

            // function addResult() {
            //     createResultInput();
            //     changeActionStep(function(actionStep) {
            //         actionStep.results.push(NodeFactory.createMoveActionStepResult());
            //         var changed = true;
            //         return changed;
            //     });
            // }

        }

        // function addTextInput(
        //     name,
        //     description,
        //     placeholderText,
        //     changeAction,
        //     enumIndex,
        //     optUpdateSummary
        // ) {
        //     return TableRowInput.create({
        //         name: name,
        //         description: description,
        //         placeholder: placeholderText,
        //         onInput: function inputHandler(newValue) {
        //             changeActionStep(function actionStepChanger(actionStep) {
        //                 var changed = changeAction(newValue, actionStep);
        //                 if (optUpdateSummary) {
        //                     updateActionStepSummaryInputValue(actionStep);
        //                 }
        //                 return changed;
        //             });
        //         },
        //         onFocus: function rememberFocusedElement(event) {
        //             MoveActionStepResult.resetLastSelectedInput();
        //             lastSelectedInput = enumIndex;
        //         }
        //     });
        // }

    }

);