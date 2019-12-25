define(

    'Tools/TypeTools',

    [],

    function() {

        // TODO: split into sub packages like DOM, object, array etc
        return {
            isArray:         isArray,
            isObject:        isObject,
            isNonEmptyArray: isNonEmptyArray,
            isBool:          isBool,
            isNumber:        isNumber,
            isString:        isString,
        };

        function isArray(obj) {
            return Array.isArray(obj);
        }

        function isObject(obj) {
            var type = typeof obj;
            return (
                type === 'function' ||
                type === 'object' && Boolean(obj)
            );
        }

        function isNonEmptyArray(obj) {
            return isArray(obj) && obj.length > 0;
        }

        function isBool(obj) {
            return obj === true || obj === false;
        }

        function isNumber(obj) {
            return typeof obj === 'number';
        }

        function isString(obj) {
            return typeof obj === 'string';
        }

    }

);
