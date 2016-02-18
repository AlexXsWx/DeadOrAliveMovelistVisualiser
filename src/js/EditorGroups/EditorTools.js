define('EditorGroups/EditorTools', ['KeyCodes'], function(KeyCodes) {

    return {
        initInputElement: initInputElement
    };

    function initInputElement(inputElement, onInputCallback) {
        inputElement.addEventListener('input', onInputCallback);
        inputElement.addEventListener('keydown', onInputBlurIfEsc);
    }

    function onInputBlurIfEsc(event) {
        if (event.keyCode === KeyCodes.ENTER) this.blur();
    }

});