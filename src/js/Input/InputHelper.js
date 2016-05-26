define('Input/InputHelper', ['Input/KeyCodes'], function(KeyCodes) {

    // not needed anymore?..

    return {
        initInputElement:      initInputElement,
        handleEnterAndEsc:     handleEnterAndEsc,
        createKeyCodeListener: createKeyCodeListener
    };

    function initInputElement(inputElement, onInputCallback) {
        inputElement.addEventListener('input', onInputCallback);
        inputElement.addEventListener('keydown', handleEnterAndEsc);
    }

    function handleEnterAndEsc(event) {
        if (event.keyCode === KeyCodes.ENTER) {
            this.blur();
        } else
        if (event.keyCode === KeyCodes.ESC) {
            this.blur();
            // FIXME: one place to set up all esc handling flow
            event.stopPropagation();
        }
    }

    function createKeyCodeListener(keyCode, handleEvent) {
        return listener;
        function listener(event) {
            if (event.keyCode === keyCode) handleEvent(event);
        }
    }

});