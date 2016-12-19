define(

    'UI/TableRowInput',
    ['Tools', 'Input/KeyCodes', 'Hotkeys'],

    function TableRowInput(_, KeyCodes, Hotkeys) {

        return { create: create };

        function create(parameters) {

            // Sort of an API for the argument
            var name            = parameters.name;
            var valueConfirmed  = parameters.value || '';
            var description     = parameters.description;
            var placeholder     = parameters.placeholder;
            var onInput         = parameters.onInput;
            var onFocus         = parameters.onFocus;
            var classes         = parameters.classes;
            // var onBlurOrConfirm = parameters.onBlurOrConfirm;
            // var onEsc           = parameters.onEsc;

            var input = _.createDomElement({
                tag: 'input',
                attributes: { 'placeholder': placeholder },
                listeners: {
                    'input':   inputListener,
                    'focus':   focusListener,
                    'blur':    blurListener
                }
            });
            setValue(valueConfirmed);

            Hotkeys.addInputEscListener(input, function() {
                // reset to last confirmed value
                setValue(valueConfirmed);
                callOnInput(valueConfirmed);
                blurInput();
                // onEsc && onEsc();
            });

            Hotkeys.addInputEnterListener(input, function() {
                blurInput();
                handleBlurOrConfirm();
            });

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
                ],
                classes: classes
            });

            return {
                domRoot:  tr,
                input:    input,
                getValue: getValue,
                setValue: setValue,
                focus:    focusInput,
                blur:     blurInput,
                clear:    clear
            };

            function clear() {
                setValue('');
            }

            function getValue() {
                return input.value;
            }

            function setValue(newValue/*, optDispatchInputEvent*/) {
                input.value = newValue;
                // if (optDispatchInputEvent) {
                //     _.dispatchInputEvent(input, 'input');
                // }
            }

            function focusInput() {
                input.focus();
                // Select entire value to keep easy arrow keys navigation between nodes
                input.setSelectionRange(0, input.value.length);
            }

            function blurInput() { input.blur(); }

            function inputListener(event) { callOnInput(getValue()); }
            function blurListener(event)  { handleBlurOrConfirm(); }

            function focusListener(event) {
                valueConfirmed = getValue();
                onFocus && onFocus();
            }

            function handleBlurOrConfirm() {
                valueConfirmed = getValue();
                // onBlurOrConfirm && onBlurOrConfirm();
            }

            function callOnInput(value) {
                console.trace('on input "%s"', value, input);
                onInput && onInput(value);
            }

        }

    }

);