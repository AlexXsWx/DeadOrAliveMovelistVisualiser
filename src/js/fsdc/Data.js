define(

    'fsdc/Data',

    [ 'fsdc/Buttons', 'fsdc/Range' ],

    function DataModule(Buttons, createRange) {

        return createData;

        function createData(optSource) {

            var ranges = optSource ? createRangesCopy(optSource) : createNewRanges();

            var data = {
                clone: clone,
                toggle: toggle,
                setFrom: setFrom,
                forEachInterval: forEachInterval,
                _getRanges: _getRanges
            };

            return data;

            function forEachInterval(action) {
                Buttons.ButtonNames.forEach(function(buttonName) {
                    ranges[buttonName].forEachInterval(function(start, end) {
                        action(buttonName, start, end);
                    });
                });
            }

            //

            function setFrom(otherData) {
                ranges = createRangesCopy(otherData);
            }

            function _getRanges() { return ranges; }

            function clone() { return createData(data); }

            //

            function createRangesCopy(otherData) {
                var ranges = {};
                var sourceRanges = otherData._getRanges();
                Buttons.ButtonNames.forEach(function(buttonName) {
                    ranges[buttonName] = sourceRanges[buttonName].clone();
                });
                return ranges;
            }

            function createNewRanges() {
                var ranges = {};
                Buttons.ButtonNames.forEach(function(buttonName) {
                    ranges[buttonName] = createRange();
                });
                return ranges;
            }

            //

            function toggle(buttonName, frame) {
                var range = ranges[buttonName];

                range.toggle(frame);

                return true;
            }

        }
    }

);
