define(

    'UI/TableRowTristateCheckbox',
    ['Tools', 'Input/KeyCodes', 'Strings'],

    function(_, KeyCodes, Strings) {

        return { create: create };

        function create(parameters) {

            var name            = parameters.name;
            var isChecked       = !!parameters.isChecked;
            var isIndeterminate = !!parameters.isIndeterminate;
            var description     = parameters.description;
            var onChange        = parameters.onChange;
            var onFocus         = parameters.onFocus;

            var input = _.createDomElement({
                tag: 'input',
                attributes: { 'type': 'checkbox' },
                listeners: {
                    'change': function changeListener(event) { callOnChange(); },
                    'focus': onFocus
                }
            });
            input.indeterminate = isIndeterminate;
            input.checked       = isIndeterminate ? false : isChecked;

            var label = _.createDomElement({
                tag: 'label',
                children: [ _.createTextNode(name) ],
                listeners: {
                    'click': function(event) {
                        input.indeterminate = false;
                        input.checked = !input.checked;
                        callOnChange();
                    }
                }
            });

            var buttonIndeterminate = _.createDomElement({
                tag: 'input',
                attributes: {
                    'type': 'button',
                    'value': 'indeterminate',
                    'title': Strings('indeterminateHint')
                },
                listeners: {
                    'click': function(event) {
                        input.checked = false;
                        input.indeterminate = true;
                        callOnChange();
                    }
                }
            });

            var tr = _.createDomElement({
                tag: 'tr',
                children: [
                    _.createDomElement({ tag: 'td', children: [label] }),
                    _.createDomElement({ tag: 'td', children: [input, buttonIndeterminate] })
                ],
                attributes: { 'title': description }
            });

            return {
                domRoot:            tr,
                getIsChecked:       getIsChecked,
                getIsIndeterminate: getIsIndeterminate,
                setIsChecked:       setIsChecked,
                setIsIndeterminate: setIsIndeterminate,
                focus:              focusInput,
                blur:               blurInput,
                clear:              clear
            };

            function clear() {
                setIsChecked(false);
                setIsIndeterminate(true);
            }

            function getIsChecked()       { return input.checked;       }
            function getIsIndeterminate() { return input.indeterminate; }

            function setIsIndeterminate(newValue, optDispatchChangeEvent) {
                input.indeterminate = newValue;
                if (optDispatchChangeEvent) {
                    _.dispatchInputEvent(input, 'change');
                }
            }

            function setIsChecked(newValue, optDispatchChangeEvent) {
                input.checked = newValue;
                if (optDispatchChangeEvent) {
                    _.dispatchInputEvent(input, 'change');
                }
            }

            function focusInput() { input.focus(); }
            function blurInput()  { input.blur();  }

            function callOnChange() {
                console.trace('on checkbox change', input);
                onChange && onChange(getIsChecked(), getIsIndeterminate());
            }

        }

    }

);