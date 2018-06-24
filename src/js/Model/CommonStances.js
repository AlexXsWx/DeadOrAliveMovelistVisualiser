define(

    'Model/CommonStances',

    [],

    function CommonStances() {

        var result = {
            DEFAULT: undefined,
            Standing:     'STD',
            Grounded:     'GND',
            Sidestepping: 'SS'
        };

        result.DEFAULT = result.Standing;

        return result;

    }

);
