define(

    'Model/ActionType',

    [ 'Tools/Tools' ],

    function ActionType(_) {

        var supportedTypes = {
            Strike:       'strike',
            JumpAttack:   'jump attack',
            GrabForThrow: 'grab for throw',
            OHGrab:       'OH grab',
            // (regular, specific (can't be critical) and expert)
            GrabForHold:  'grab for hold',
            GroundAttack: 'ground attack',
            Other:        'other'
        };

        var result = {

            getSupportedTypes: function() { return supportedTypes; },
            fillDatalist: fillDatalist,

            Strike: 'strike',

            Hold: 'hold',
            Throw: 'throw',
            Other: 'other',

            Ground: 'ground',
            Jump: 'jump',

            HelperAttack: 'attack',
            HelperOffensive: 'offensive',
            HelperOH: /\boh\b/i,
            HelperGrab: 'grab',
        };

        return result;

        function fillDatalist(datalist) {
            _.mapValues(supportedTypes).forEach(function(value) {
                var options = _.createDomElement({
                    tag: 'option',
                    attributes: {
                        value: value
                        // title: ___
                    }
                });
                datalist.appendChild(options);
            });
        }

    }

);
