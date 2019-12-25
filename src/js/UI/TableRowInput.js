define(

    'UI/TableRowInput',

    [ 'Input/KeyCodes', 'Hotkeys', 'Tools/Tools' ],

    function TableRowInput(KeyCodes, Hotkeys, _) {

        return { create: create };

        function create(parameters) {

            // Sort of an API for the argument
            var name            = parameters.name;
            var valueConfirmed  = parameters.value || '';
            var description     = parameters.description;
            var placeholder     = parameters.placeholder;
            var datalist        = parameters.datalist;
            var onInput         = parameters.onInput;
            var onFocus         = parameters.onFocus;
            var classes         = parameters.classes;
            var multiline       = parameters.multiline || false;
            // var onBlurOrConfirm = parameters.onBlurOrConfirm;
            // var onEsc           = parameters.onEsc;

            var input = _.createDomElement({
                tag: multiline ? 'textarea' : 'input',
                attributes: {
                    'placeholder': placeholder,
                    'list':        datalist
                },
                listeners: {
                    'input': inputListener,
                    'focus': focusListener,
                    'blur':  blurListener
                }
            });
            _.setCustomProperty(input, 'inputHistory', createHistoryManager());
            setValue(valueConfirmed);

            Hotkeys.addInputEscListener(input, function(event) {
                // reset to last confirmed value
                setValue(valueConfirmed);
                callOnInput(valueConfirmed);
                blurInput();
                // onEsc && onEsc();
            });

            Hotkeys.addInputEnterListener(input, function(event) {
                if (multiline && event.shiftKey) return;
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

            function createHistoryManager() {

                var values = [''];
                var pointer = 0;
                var warned = false;

                return {
                    reset: reset,
                    undoRedo: undoRedo,
                    push: push
                };

                function reset(initialValue) {
                    values = [initialValue];
                    pointer = 0;
                    warned = false;
                }

                function undoRedo(redo) {
                    var newPointer = pointer + (redo ? 1 : -1);
                    if (newPointer >= 0 && newPointer <= values.length - 1) {
                        warned = false;
                        pointer = newPointer;
                        var value = values[pointer];
                        setValue(value);
                        callOnInput(value);
                        return true;
                    } else {
                        if (values.length > 1 && !warned) {
                            warned = true;
                            return true;
                        }
                        return false;
                    }
                }

                function push(value) {
                    values.length = pointer + 1;
                    values.push(value);
                    pointer += 1;
                    warned = false;
                }
            }

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

            function getHistoryManager() {
                return _.getCustomProperty(input, 'inputHistory');
            }

            function focusInput() {
                getHistoryManager().reset(getValue());
                input.focus();
                // Select entire value to keep easy arrow keys navigation between nodes
                input.setSelectionRange(0, input.value.length);
            }

            function blurInput() { input.blur(); }

            function inputListener(event) {
                var value = getValue();

                getHistoryManager().push(value);
                callOnInput(value);
            }
            function blurListener(event) {
                handleBlurOrConfirm();
            }

            function focusListener(event) {
                getHistoryManager().reset(getValue());
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
