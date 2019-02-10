define(

    'fsdc/Range',

    [],

    function RangeModule() {

        return createRange;        

        function createRange(optSource) {

            var flips = optSource ? optSource.slice(0) : [];
            console.assert(flips.every(function(element) { return !isNaN(element); }));

            return {
                clone: clone,
                toggle: toggle,
                isHeld: isHeld,
                forEachInterval: forEachInterval,
                getInterval: getInterval
            };
            function clone() { return createRange(flips); }

            function toggle(frame) {
                console.assert(!isNaN(frame), 'frame is NaN');
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

            function isHeld(frame) {
                var held = false;
                for (var i = 0; i < flips.length; ++i) {
                    if (flips[i] > frame) break;
                    held = !held;
                }
                return held;
            }

            function getInterval(frame) {
                var result = [-Infinity, -Infinity];
                forEachInterval(function(start, end) {
                    if (start <= frame && end >= frame) {
                        result[0] = start;
                        result[1] = end;
                    }
                });
                return result;
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
