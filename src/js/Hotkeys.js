define(

    'Hotkeys',

    ['Input/KeyCodes', 'Strings'],

    function Hotkeys(KeyCodes, Strings) {

        var windowKeyDownListeners = [];

        return {
            init: init,
            addInputEscListener:   addInputEscListener,
            addInputEnterListener: addInputEnterListener
        };


        function init(executor, selectionManager, editor) {
            addUndoListeners(executor);
            addNavigationListeners(selectionManager);
            addAddChildListener(editor);

            window.addEventListener('keydown', handleWindowKeydown);
        }


        function handleWindowKeydown(event) {
            var result = undefined;
            for (var i = 0; i < windowKeyDownListeners.length; ++i) {
                result = windowKeyDownListeners[i](event);
                if (result !== undefined) {
                    return result;
                }
            }
        }


        function addUndoListeners(executor) {
            // FIXME: this doesn't replace other ways to perform undo (context menu, main menu)
            windowKeyDownListeners.push(function(event) {
                if ((event.ctrlKey || event.metaKey) && event.keyCode === KeyCodes.Z) {
                    if (event.shiftKey) {
                        executor.redo();
                    } else {
                        executor.undo();
                    }
                    event.preventDefault();
                    event.stopPropagation();
                    // alert(Strings('undoIsBorked'));
                    return false;
                }
            });
        }


        function addNavigationListeners(selectionManager) {

            windowKeyDownListeners.push(function(event) {

                var keyCode = event.keyCode;

                // Do not react to left/right if it's in an input without CTRL and not over bounds
                if (!event.ctrlKey && document.activeElement instanceof HTMLInputElement) {
                    var input = document.activeElement;
                    if (input.type === 'text' && (
                        keyCode === KeyCodes.LEFT  && input.selectionEnd > 0 ||
                        keyCode === KeyCodes.RIGHT && input.selectionStart < input.value.length
                    )) {
                        return;
                    }
                }

                var processed = true;
                switch (keyCode) {
                    case KeyCodes.ESC:   selectionManager.deselectAll();           break;
                    case KeyCodes.RIGHT: selectionManager.selectFirstChild();      break;
                    case KeyCodes.LEFT:  selectionManager.selectParent();          break;
                    case KeyCodes.UP:    selectionManager.selectPreviousSibling(); break;
                    case KeyCodes.DOWN:  selectionManager.selectNextSibling();     break;
                    default:
                        processed = false;
                        // console.log('unused keycode', event.keyCode);
                }

                if (processed) event.preventDefault();

            });

        }


        function addAddChildListener(editor) {
            // FIXME: this doesn't belong here
            windowKeyDownListeners.push(function(event) {
                if (
                    (event.keyCode === KeyCodes.PLUS || event.keyCode === KeyCodes.NUM_PLUS) &&
                    !(document.activeElement instanceof HTMLInputElement)
                ) {
                    editor.onClickAddChild();
                    event.preventDefault();
                }
            });
        }


        function addInputEscListener(element, onEsc) {
            element.addEventListener('keydown', function(event) {
                if (event.keyCode === KeyCodes.ESC) {
                    onEsc();
                    event.stopPropagation();
                }
            });
        }


        function addInputEnterListener(element, onEnter) {
            element.addEventListener('keydown', function(event) {
                if (event.keyCode === KeyCodes.ENTER) {
                    onEnter();
                }
            });
        }

    }

);