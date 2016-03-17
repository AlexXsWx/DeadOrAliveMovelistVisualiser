define(

    'UI/TableRowInput',
    ['Tools', 'Input/KeyCodes'],

    function(_, KeyCodes) {

        return { create: create };

        function create(parameters) {

            var name            = parameters.name;
            var valueConfirmed  = parameters.value || '';
            var description     = parameters.description;
            var placeholder     = parameters.placeholder;
            var onInput         = parameters.onInput         || nop;
            var onBlurOrConfirm = parameters.onBlurOrConfirm || nop;
            var onEsc           = parameters.onEsc           || nop;

            var input = _.createDomElement({
                tag: 'input',
                attributes: { 'placeholder': placeholder },
                listeners: {
                    'input':   inputListener,
                    'keydown': keyDownListener,
                    'blur':    blurListener // FIXME: does it happen twice on enter/escape?
                }
            });
            setValue(valueConfirmed);

            var label = _.createDomElement({
                tag: 'label',
                children: [ _.createTextNode(name) ],
                listeners: {
                    'click': function clickListener(event) { focusInput(); }
                }
            });

            var tr = _.createDomElement({
                tag: 'tr',
                attributes: { 'title': description },
                children: [
                    _.createDomElement({ tag: 'td', children: [label] }),
                    _.createDomElement({ tag: 'td', children: [input] })
                ]
            });

            return {
                domRoot:  tr,
                getValue: getValue,
                setValue: setValue,
                focus:    focusInput,
                blur:     blurInput
            };

            function getValue()         { return input.value;     }
            function setValue(newValue) { input.value = newValue; }

            function focusInput() { input.focus(); }
            function blurInput()  { input.blur();  }

            function keyDownListener(event) {
                if (event.keyCode === KeyCodes.ESC) {
                    // reset to last confirmed value
                    setValue(valueConfirmed);
                    blurInput();
                    onEsc();
                } else
                if (event.keyCode === KeyCodes.ENTER) {
                    blurInput();
                    handleBlurOrConfirm();
                }
            }

            function inputListener(event) { onInput(getValue());   }
            function blurListener(event)  { handleBlurOrConfirm(); }

            function handleBlurOrConfirm() {
                valueConfirmed = getValue();
                onBlurOrConfirm();
            }

        }

        function nop() {}

    }

);