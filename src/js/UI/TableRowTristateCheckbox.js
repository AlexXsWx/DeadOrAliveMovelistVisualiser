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

            var input = _.createDomElement({
                tag: 'input',
                attributes: { 'type': 'checkbox' },
                listeners: {
                    'change': function changeListener(event) { callOnChange(); }
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
                blur:               blurInput
            };

            function getIsChecked()               { return input.checked;           }
            function getIsIndeterminate()         { return input.indeterminate;     }
            function setIsChecked(newValue)       { input.checked       = newValue; }
            function setIsIndeterminate(newValue) { input.indeterminate = newValue; }

            function focusInput() { input.focus(); }
            function blurInput()  { input.blur();  }

            function callOnChange() {
                onChange && onChange(getIsChecked(), getIsIndeterminate());
            }

        }

    }

);