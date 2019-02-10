define(

    'fsdc/Buttons',

    [],

    function ButtonsModule() {

        var Button = {
            Up:        '8',
            Left:      '4',
            Right:     '6',
            Down:      '2',

            Guard:     'H',
            Punch:     'P',
            Kick:      'K',
            Throw:     'T',

            PunchKick: 'P+K',
            GuardKick: 'H+K',
            Special:   'H+P+K',

            Taunt:     'Ap'
        };
        var ButtonNames = Object.keys(Button);

        return {
            Button:      Button,
            ButtonNames: ButtonNames
        };
    }

);
