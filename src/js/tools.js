define('tools', function() {

    return {
        isObject: isObject,
        defined:  defined
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

});