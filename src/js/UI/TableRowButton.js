define(

    'UI/TableRowButton',
    
    [ 'Tools/Tools' ],

    function TableRowButton(_) {

        return { create: create };

        function create(parameters) {

            // Sort of an API for argument
            var name        = parameters.name;
            var description = parameters.description;
            var onClick     = parameters.onClick;
            var classes     = parameters.classes;

            var input = _.createDomElement({
                tag: 'input',
                attributes: {
                    'type': 'button',
                    'value': name,
                    'title': description
                },
                listeners: {
                    'click': function(event) { onClick && onClick(); }
                }
            });

            var tr = _.createMergedRow(2, [ input ], classes);

            return {
                domRoot: tr,
                input:   input,
                focus:   function focusInput() { input.focus(); },
                blur:    function blurInput()  { input.blur();  }
            };

        }

    }

);
