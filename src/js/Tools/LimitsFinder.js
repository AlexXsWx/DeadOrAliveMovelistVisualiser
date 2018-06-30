define(

    'Tools/LimitsFinder',

    [ 'Tools/Tools' ],

    function(_) {

        return createLimitsFinder;

        function createLimitsFinder(x, y) {

            var self = {

                x: {
                    min: _.defined(x, null),
                    max: _.defined(x, null)
                },

                y: {
                    min: _.defined(y, null),
                    max: _.defined(y, null)
                },

                invalidate:      invalidate,
                collapseTo:      collapseTo,
                expandToContain: expandToContain

            };

            return self;

            function invalidate() {
                self.x.min = null;
                self.x.max = null;
                self.y.min = null;
                self.y.max = null;
            }

            function collapseTo(x, y) {
                self.x.min = x;
                self.x.max = x;
                self.y.min = y;
                self.y.max = y;
            }

            function expandToContain(x, y) {
                if (self.x.max === null || self.x.max < x) self.x.max = x;
                if (self.x.min === null || self.x.min > x) self.x.min = x;
                if (self.y.max === null || self.y.max < y) self.y.max = y;
                if (self.y.min === null || self.y.min > y) self.y.min = y;
            }

        }

    }

);
