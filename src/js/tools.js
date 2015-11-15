define('tools', function() {

    return {
        isObject:                   isObject,
        defined:                    defined,
        defaults:                   defaults,
        withoutFalsyProperties:     withoutFalsyProperties,
        arraysAreEqual:             arraysAreEqual,
        removeElement:              removeElement,
        copyKeysInto:               copyKeysInto,
        isNonEmptyArray:            isNonEmptyArray,
        moveArrayElement:           moveArrayElement,
        arraysConsistOfSameStrings: arraysConsistOfSameStrings,
        hideDomElement:             hideDomElement,
        showDomElement:             showDomElement
    };

    function hideDomElement(element) {
        element.setAttribute('hidden', true);
    }
    
    function showDomElement(element) {
        element.removeAttribute('hidden');
    }

    function arraysAreEqual(arrayA, arrayB) {
        if (arrayA.length != arrayB.length) return false;
        for (var i = 0; i < arrayA.length; ++i) {
            if (arrayA[i] !== arrayB[i]) return false;
        }
        return true;
    }

    function removeElement(array, element) {
        var index = array.indexOf(element);
        if (index < 0) return false;
        array.splice(index, 1);
        return true;
    }

    function withoutFalsyProperties(obj) {
        var result;
        if (isArray(obj)) {
            result = [];
            for (var i = 0; i < obj.length; ++i) {
                var value = obj[i];
                if (isArray(value) || isObject(value)) {
                    value = withoutFalsyProperties(value);
                }
                if (isTruthyValue(value)) {
                    result.push(value)
                }
            }
        } else {
            result = {};
            Object.getOwnPropertyNames(obj).forEach(function(key) {
                var value = obj[key];
                if (isArray(value) || isObject(value)) {
                    value = withoutFalsyProperties(value);
                }
                if (isTruthyValue(value)) {
                    result[key] = value;
                }
            });
        }
        return isTruthyValue(result) ? result : undefined;
    }

    function isTruthyValue(obj) {
        if (obj === 0)     return true;
        if (obj === false) return true;
        if (isArray(obj))  return obj.length > 0;
        if (isObject(obj)) return Object.getOwnPropertyNames(obj).length > 0;
        return !!obj;
    }

    /** overwrites values of `target`'s keys with corresponding values `source`, if provided */
    function defaults(source, target) {
        if (!source || !isObject(source)) return target;
        Object.getOwnPropertyNames(target).forEach(function(propName) {
            target[propName] = defined(source[propName], target[propName]);
        });
        return target;
    }

    function isArray(obj) {
        return Array.isArray(obj);
    }

    function isObject(obj) {
        var type = typeof obj;
        return type === 'function' || type === 'object' && !!obj;
    }

    function isNonEmptyArray(obj) {
        return isArray(obj) && obj.length > 0;
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
            if (!isNaN(insertIndex) && insertIndex !== index) {
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