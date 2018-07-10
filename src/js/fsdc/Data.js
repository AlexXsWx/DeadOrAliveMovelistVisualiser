define(

    'fsdc/Data',

    [ 'fsdc/Buttons', 'fsdc/Range', 'Tools/Tools' ],

    function DataModule(Buttons, createRange, _) {

        return createData;

        function createData(optSource) {

            var headerRange = optSource ? optSource.headerRange.clone() : createRange();
            var ranges = optSource ? createRangesCopy(optSource) : createNewRanges();

            var data = {
                headerRange: headerRange,
                clone: clone,
                toggle: toggle,
                setFrom: setFrom,
                forEachInterval: forEachInterval,
                forEachChange: forEachChange,
                getButtonState: getButtonState,
                getButtonInterval: getButtonInterval,
                _getRanges: _getRanges
            };

            return data;

            function getButtonState(buttonName, frame) {
                return ranges[buttonName].isHeld(frame);
            }

            function getButtonInterval(buttonName, frame) {
                return ranges[buttonName].getInterval(frame);
            }

            function forEachInterval(action) {
                Buttons.ButtonNames.forEach(function(buttonName) {
                    ranges[buttonName].forEachInterval(function(start, end) {
                        action(buttonName, start, end);
                    });
                });
            }

            function forEachChange(action) {
                var stateBecome = createButtonsState();
                var stateWas = createButtonsState(stateBecome);

                var changes = {};
                Buttons.ButtonNames.forEach(function(buttonName) {
                    ranges[buttonName].forEachInterval(function(start, end) {
                        if (!changes[start]) changes[start] = [];
                        if (!changes[end])   changes[end]   = [];
                        changes[start].push(buttonName);
                        changes[end].push(buttonName);
                    });
                });

                Object.keys(changes).map(
                    function(key) { return Number(key); }
                ).sort(_.sortFuncAscending).forEach(function(frame) {
                    var buttonNames = changes[frame];
                    buttonNames.forEach(function(buttonName) {
                        stateBecome[buttonName] = ranges[buttonName].isHeld(frame);
                    });
                    action(frame, stateWas, stateBecome);
                    stateWas = createButtonsState(stateBecome);
                });

                return;

                function createButtonsState(optSource) {
                    var state = {};
                    Buttons.ButtonNames.forEach(function(buttonName) {
                        state[buttonName] = optSource ? optSource[buttonName] : false;
                    });
                    return state;
                }

            }

            //

            function setFrom(otherData) {
                headerRange = otherData.headerRange.clone();
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
