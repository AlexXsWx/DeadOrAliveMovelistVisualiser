define('tools', function() {

    return {
        isObject:                   isObject,
        defined:                    defined,
        copyKeysInto:               copyKeysInto,
        moveArrayElement:           moveArrayElement,
        arraysConsistOfSameStrings: arraysConsistOfSameStrings
    };

    function isObject(obj) {
        var type = typeof obj;
        return type === 'function' || type === 'object' && !!obj;
    }

    function defined(/* arguments */) {
        for (i = 0; i < arguments.length; i++) {
            if (arguments[i] !== undefined) return arguments[i];
        }
    }

    function copyKeysInto(target, source) {
        Object.getOwnPropertyNames(source).forEach(function(key) {
            target[key] = source[key];
        });
    }

    /**
     * Moves `element` in `array` by `relativeOffset`
     * Returns whether the moving happened or not
     */
    function moveArrayElement(array, element, relativeOffset) {
        var index = array.indexOf(element);
        if (index >= 0) {
            var insertIndex = Math.min(
                Math.max(index + relativeOffset, 0),
                array.length - 1
            );
            if (insertIndex !== index) {
                array.splice(index, 1);
                array.splice(insertIndex, 0, element);
                return true;
            }
        }
        return false;
    }

    function arraysConsistOfSameStrings(arrayA, arrayB) {
        var mapA = {};
        var mapB = {};
        arrayA.forEach(function(string) { mapA[string] = true; });
        arrayB.forEach(function(string) { mapB[string] = true; });
        return !(
            arrayA.some(function(element) { return !Object.hasOwnProperty(mapB, element); }) ||
            arrayB.some(function(element) { return !Object.hasOwnProperty(mapA, element); })
        );
    }

});