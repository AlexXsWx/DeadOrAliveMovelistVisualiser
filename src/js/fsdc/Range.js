define(

    'fsdc/Range',

    [],

    function RangeModule() {

        return createRange;        

        function createRange(optSource) {

            var flips = optSource ? optSource.slice(0) : [];

            return {
                clone: clone,
                toggle: toggle,
                forEachInterval: forEachInterval
            };

            function clone() { return createRange(flips); }

            function toggle(frame) {
                var index = 0;
                for (index; index < flips.length; ++index) {
                    if (flips[index] === frame) {
                        flips.splice(index, 1);
                        return true;
                    }
                    if (flips[index] > frame) {
                        break;
                    }
                }
                flips.splice(index, 0, frame);
            }

            function forEachInterval(action) {
                if (flips.length > 0) {
                    var start = null;
                    for (var i = 0; i < flips.length; ++i) {
                        if (start === null) {
                            start = flips[i];
                        } else {
                            action(start, flips[i]);
                            start = null;
                        }
                    }
                    if (start !== null) {
                        action(start, Infinity);
                    }
                }
            }
        }
    }

);
