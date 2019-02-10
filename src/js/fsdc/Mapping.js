define(

    'fsdc/Mapping',

    [ 'fsdc/Buttons', 'Input/KeyCodes', 'Tools/Tools' ],

    function MappingModule(Buttons, KeyCodes, _) {

        var mapping;
        var inputs;

        return {
            init: init,
            getMapping: getMapping,
            reset: reset
        };

        function createDefaultMapping() {
            return {
                'Macro_Play':   'RCtrl',
                'Macro_Reload': 'Insert',

                'Up':        'Up',
                'Left':      'Left',
                'Right':     'Right',
                'Down':      'Down',

                // Default mapping is for a QWERTY keyboard - in-game TYPE-A.
                'Guard':     'J',
                'Punch':     'K',
                'Kick':      'L',
                'Throw':     'M',
                'PunchKick': 'U',
                'GuardKick': 'O',
                'Special':   'I',
                'Taunt':     'N'

                // 'Guard':     'L',
                // 'Punch':     'M',
                // 'Kick':      'J',
                // 'Throw':     'K',
                // 'PunchKick': 'U',
                // 'GuardKick': 'I',
                // 'Special':   'O',
                // 'Taunt':     'N',
            };
        }

        function init(table) {

            load();

            var dataListId = 'keys';

            document.head.appendChild(createDatalist(dataListId));

            inputs = {};
            [
                createSeparator('Macro control'),
                createInput('Play', 'Macro_Play'),
                createInput('Reload', 'Macro_Reload'),
                createSeparator('Game input')
            ].concat(
                Buttons.ButtonNames.map(function(buttonName) {
                    return createInput(buttonName, buttonName);
                })
            ).forEach(
                function(child) { table.appendChild(child); }
            );

            return;

            function createSeparator(text) {
                return _.createDomElement({
                    tag: 'tr',
                    children: [
                        _.createDomElement({
                            tag: 'td',
                            attributes: {
                                colspan: 2,
                                style: 'text-align: center',
                            },
                            children: [ _.createTextNode(text) ]
                        })
                    ]
                });
            }

            function createInput(title, id) {
                var input;
                var result = _.createDomElement({
                    tag: 'tr',
                    children: [
                        _.createDomElement({
                            tag: 'td',
                            children: [ _.createTextNode(title + ':') ]
                        }),
                        _.createDomElement({
                            tag: 'td',
                            children: [
                                input = _.createDomElement({
                                    tag: 'input',
                                    attributes: {
                                        list: dataListId,
                                        type: 'text',
                                        value: mapping[id]
                                    },
                                    listeners: {
                                        change: function(event) {
                                            mapping[id] = input.value;
                                            save();
                                        },
                                        keydown: function(event) {
                                            if (event.keyCode === KeyCodes.ENTER) {
                                                var input = this;
                                                input.blur();
                                            }
                                        }
                                    }
                                })
                            ]
                        })
                    ]
                });
                inputs[id] = input;
                return result;
            }
        }

        function getMapping() {
            return mapping;
        }

        function reset() {
            mapping = createDefaultMapping();
            save();
            Object.keys(inputs).forEach(function(buttonName) {
                inputs[buttonName].value = mapping[buttonName] || '';
            });
        }

        //

        function save() {
            try {
                localStorage.setItem('mapping', JSON.stringify(mapping));
            } catch(e) {
                console.error('failed to save mapping:', e);
            }
        }

        function load() {
            try {
                mapping = JSON.parse(localStorage.getItem('mapping') || '{}');
            } catch(e) {
                console.error('failed to read mapping:', e);
                mapping = {};
            }
            var defaultMapping = createDefaultMapping();
            Object.keys(defaultMapping).forEach(function(buttonName) {
                if (!mapping[buttonName]) {
                    console.warn('Key ' + buttonName + ' was not set - using default');
                    mapping[buttonName] = defaultMapping[buttonName];
                }
            });
            save();
        }

        //

        function createDatalist(id) {
            var inputs = [
                'A', 'B', 'C', 'D', 'E', 'F', 'G',
                'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P',
                'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
                '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
                '/', '*', '+', '-',
                'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12',
                'Up', 'Down', 'Left', 'Right',
                'CapsLock', 'NumLock', 'ScrollLock',
                'Space', 'Tab', 'Enter', 'Return', 'Escape', 'Backspace',
                'Delete', 'Insert', 'Home', 'End', 'PageUp', 'PageDown',
                'Numpad0', 'NumpadIns',
                'Numpad1', 'NumpadEnd',
                'Numpad2', 'NumpadDown',
                'Numpad3', 'NumpadPgDn',
                'Numpad4', 'NumpadLeft',
                'Numpad5', 'NumpadClear',
                'Numpad6', 'NumpadRight',
                'Numpad7', 'NumpadHome',
                'Numpad8', 'NumpadUp',
                'Numpad9', 'NumpadPgUp',
                'NumpadDot', 'NumpadDel',
                'NumpadDiv',
                'NumpadMult',
                'NumpadAdd',
                'NumpadSub',
                'NumpadEnter',
                'LWin', 'RWin',
                'Ctrl', 'LCtrl', 'RCtrl',
                'Alt', 'LAlt', 'RAlt',
                'Shift', 'LShift', 'RShift'
            ];

            var datalist = _.createDomElement({
                tag: 'datalist',
                attributes: { id: id },
                children: inputs.map(function(input) {
                    return _.createDomElement({
                        tag: 'option',
                        attributes: { value: input }
                    });
                })
            });

            return datalist;
        }

    }

);
