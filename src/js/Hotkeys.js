define(

    'Hotkeys',

    [ 'Input/KeyCodes', 'Tools/Signal', 'Localization/Strings', 'Tools/Tools' ],

    function Hotkeys(KeyCodes, createSignal, Strings, _) {

        var undoRedoElement = null;

        return {
            isInputSelected: isInputSelected,
            addInputEscListener:   addInputEscListener,
            addInputEnterListener: addInputEnterListener,

            undoRedoInput: undoRedoInput,

            create: create
        };

        function undoRedoInput(redo) {
            return _.getCustomProperty(document.activeElement, 'inputHistory').undoRedo(redo);
        }

        function isInputSelected(optType) {
            if (
                document.activeElement instanceof HTMLInputElement ||
                document.activeElement instanceof HTMLTextAreaElement
            ) {
                if (!optType) {
                    return true;
                } else {
                    return (
                        document.activeElement.type === optType ||
                        optType === 'text' && document.activeElement instanceof HTMLTextAreaElement
                    );
                }
            } else {
                return false;
            }
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

        function create(keyDownListener, optFilterTextInput) {

            var keyDownSignal = createSignal();
            keyDownSignal.listenersManager.addListener(keyDownListener);
            window.addEventListener('keydown', handleWindowKeydown);

            return {
                onKeyDown: keyDownSignal.listenersManager
            };

            function handleWindowKeydown(event) {

                // console.log(event.keyCode);

                // Check if current key down is for navigating within a text input
                if (optFilterTextInput) {
                    if (!event.ctrlKey && isInputSelected('text')) {
                        var input = document.activeElement;
                        if (
                            input.selectionEnd > 0 && (
                                event.keyCode === KeyCodes.LEFT
                                // TODO: key HOME
                            ) ||
                            input.selectionStart < input.value.length && (
                                event.keyCode === KeyCodes.RIGHT
                                // TODO: key END
                            )
                        ) {
                            return;
                        }
                        if (
                            (
                                event.keyCode === KeyCodes.UP ||
                                event.keyCode === KeyCodes.DOWN
                            ) &&
                            document.activeElement instanceof HTMLTextAreaElement
                        ) {
                            return;
                        }
                    }
                }

                keyDownSignal.dispatch(event);
            }

        }

    }

);
