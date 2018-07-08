define(

    'Hotkeys',

    [ 'Input/KeyCodes', 'Tools/Signal', 'Localization/Strings' ],

    function Hotkeys(KeyCodes, createSignal, Strings) {

        return {
            isInputSelected: isInputSelected,
            addInputEscListener:   addInputEscListener,
            addInputEnterListener: addInputEnterListener,

            create: create
        };

        function isInputSelected(optType) {
            if (document.activeElement instanceof HTMLInputElement) {
                if (!optType) {
                    return true;
                } else {
                    return document.activeElement.type === optType;
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
                    }
                }

                keyDownSignal.dispatch(event);
            }

        }

    }

);
