define('LimitsFinder', ['Tools'], function(_) {

    return createLimitsFinder;

    function createLimitsFinder(x, y) {

        return {

            x: {
                min: _.defined(x, NaN),
                max: _.defined(x, NaN)
            },

            y: {
                min: _.defined(y, NaN),
                max: _.defined(y, NaN)
            },

            invalidate:      invalidate,
            collapseTo:      collapseTo,
            expandToContain: expandToContain

        };

    }

    function invalidate() {
        this.x.min = NaN;
        this.x.max = NaN;
        this.y.min = NaN;
        this.y.max = NaN;
    }

    function collapseTo(x, y) {
        this.x.min = x;
        this.x.max = x;
        this.y.min = y;
        this.y.max = y;
    }

    function expandToContain(x, y) {
        if (isNaN(this.x.max) || this.x.max < x) this.x.max = x;
        if (isNaN(this.x.min) || this.x.min > x) this.x.min = x;
        if (isNaN(this.y.max) || this.y.max < y) this.y.max = y;
        if (isNaN(this.y.min) || this.y.min > y) this.y.min = y;
    }

});