define(

    'Tools/ObjectStorage',

    [ 'Tools/Tools' ],

    function(_) {

        return createObjectStorage;

        function createObjectStorage(optKeyFilter) {

            var keys   = [];
            var values = [];

            return {
                set: set,
                has: has,
                get: get,
                getIndex: getIndex,
                getByIndex: getByIndex,
                clear:    clear,
                clearAll: clearAll,
                forEachValue: forEachValue,
                getKeys:      getKeys,
                getValues:    getValues
            };

            function set(object, optValue) {
                if (optKeyFilter && !optKeyFilter(object)) return false;
                var index;
                if (has(object)) {
                    index = getIndex(object);
                } else {
                    index = keys.length;
                    keys.push(object);
                }
                values[index] = optValue;
                return true;
            }

            function has(object) {
                if (optKeyFilter && !optKeyFilter(object)) return false;
                return _.contains(keys, object);
            }

            function get(object, optFallbackValue) {
                if (optKeyFilter && !optKeyFilter(object)) throw new Error("Invalid access");
                return getByIndex(getIndex(object), optFallbackValue);
            }

            function getByIndex(index, optFallbackValue) {
                if (index === -1 && optFallbackValue !== undefined) {
                    return optFallbackValue;
                }
                if (index < 0 || index >= values.length) throw new Error("Out of bounds");
                return values[index];
            }

            function clear(object) {
                if (optKeyFilter && !optKeyFilter(object)) return false;
                var index = getIndex(object);
                if (index < 0 || index >= values.length) throw new Error("Out of bounds");
                keys.splice(index, 1);
                values.splice(index, 1);
                return true;
            }

            function clearAll() {
                keys.length   = 0;
                values.length = 0;
            }

            function forEachValue(action) {
                values.forEach(function(value) { action(value); });
            }

            function getKeys() { return keys.slice(); }

            function getValues() { return values.slice(); }

            function getIndex(object) { return keys.indexOf(object); }
        }

    }

);
