define('Input/InputHelper', ['Input/KeyCodes'], function(KeyCodes) {

    // not needed anymore?..

    return {
        initInputElement:      initInputElement,
        onInputBlurIfEsc:      onInputBlurIfEsc,
        createKeyCodeListener: createKeyCodeListener
    };

    function initInputElement(inputElement, onInputCallback) {
        inputElement.addEventListener('input', onInputCallback);
        inputElement.addEventListener('keydown', onInputBlurIfEsc);
    }

    function onInputBlurIfEsc(event) {
        if (event.keyCode === KeyCodes.ENTER) this.blur();
    }

    function createKeyCodeListener(keyCode, handleEvent) {
        return listener;
        function listener(event) {
            if (event.keyCode === keyCode) handleEvent(event);
        }
    }

});