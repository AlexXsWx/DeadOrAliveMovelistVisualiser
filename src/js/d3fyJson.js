define('d3fyJson', ['tools'], function(_) {

    return function d3fyJson(obj, name, generateNode, parent) {

        var result = generateNode(name, parent);

        if (!_.isObject(obj)) {
            console.error('Error: not an object:', obj);
            return result;
        }

        var propNames = Object.getOwnPropertyNames(obj);

        propNames.forEach(function(propName) {
            if (!propName) {
                result.fd3Data.moveInfo = result.fd3Data.moveInfo || {};
                result.fd3Data.moveInfo.endsWith = obj[propName];
            } else
            if (propName === 'meta') {
                result.fd3Data.moveInfo = obj[propName];
            } else {
                var child = d3fyJson(obj[propName], propName, generateNode, result);
                result.fd3Data.children.all.push(child);
                result.fd3Data.children.visible.push(child);
            }
        });

        return result;
    }

});