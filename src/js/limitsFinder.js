define('limitsFinder', function() {

    return createLimitsFinder;

    function createLimitsFinder() {

        return {

            x: {
                min: 0,
                max: 0
            },

            y: {
                min: 0,
                max: 0
            },

            reset: function reset() {
                this.x.min = 0;
                this.x.max = 0;
                this.y.min = 0;
                this.y.max = 0;
            },

            considerDatum: function considerDatum(datum) {
                this.x.max = Math.max(this.x.max, datum.x);
                this.x.min = Math.min(this.x.min, datum.x);
                this.y.max = Math.max(this.y.max, datum.y);
                this.y.min = Math.min(this.y.min, datum.y);
            }

        };

    }

});