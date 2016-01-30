define('editorGroups/editorTools', ['keyCodes'], function(keyCodes) {

    return {
        initInputElement: initInputElement
    };

    function initInputElement(inputElement, onInputCallback) {
        inputElement.addEventListener('input', onInputCallback);
        inputElement.addEventListener('keydown', onInputBlurIfEsc);
    }

    function onInputBlurIfEsc(event) {
        if (event.keyCode === keyCodes.ENTER) this.blur();
    }

});