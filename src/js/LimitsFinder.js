define('LimitsFinder', ['Tools'], function(_) {

    return createLimitsFinder;

    function createLimitsFinder(x, y) {

        return {

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

    }

    function invalidate() {
        this.x.min = null;
        this.x.max = null;
        this.y.min = null;
        this.y.max = null;
    }

    function collapseTo(x, y) {
        this.x.min = x;
        this.x.max = x;
        this.y.min = y;
        this.y.max = y;
    }

    function expandToContain(x, y) {
        if (this.x.max === null || this.x.max < x) this.x.max = x;
        if (this.x.min === null || this.x.min > x) this.x.min = x;
        if (this.y.max === null || this.y.max < y) this.y.max = y;
        if (this.y.min === null || this.y.min > y) this.y.min = y;
    }

});