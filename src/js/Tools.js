define('Tools', function() {

    return {
        isObject:                   isObject,
        defined:                    defined,
        defaults:                   defaults,
        withoutFalsyProperties:     withoutFalsyProperties,
        arraysAreEqual:             arraysAreEqual,
        removeElement:              removeElement,
        copyKeysInto:               copyKeysInto,
        isNonEmptyArray:            isNonEmptyArray,
        isBool:                     isBool,
        moveArrayElement:           moveArrayElement,
        arraysConsistOfSameStrings: arraysConsistOfSameStrings,
        getDomElement:              getDomElement,
        hideDomElement:             hideDomElement,
        showDomElement:             showDomElement,
        createDomElement:           createDomElement,
        createTextNode:             createTextNode,
        createSvgElement:           createSvgElement,
        setTextContent:             setTextContent,
        removeAllChildren:          removeAllChildren,
        lerp:                       lerp
    };

    function getDomElement(id) {
        return document.getElementById(id);
    }

    function hideDomElement(element) {
        element.classList.add('hidden');
    }
    
    function showDomElement(element) {
        element.classList.remove('hidden');
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
        // TODO: rename
        // TODO: show warning if source has a key that target doesn't
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

    function isBool(obj) {
        return obj === true || obj === false;
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

    function createDomElement(options) {
        return createClassedElementWithAttributesChildrenAndListeners(
            options, documentElementCreator
        );
    }

    function createTextNode(textContent) {
        return document.createTextNode(textContent);
    }

    function createSvgElement(options) {
        return createClassedElementWithAttributesChildrenAndListeners(options, svgElementCreator);
    }

    function documentElementCreator(tag) {
        return document.createElement(tag);
    }

    function svgElementCreator(tag) {
        return document.createElementNS("http://www.w3.org/2000/svg", tag);
    }

    function createClassedElementWithAttributesChildrenAndListeners(options, elementCreator) {

        var tag        = options.tag;
        var attributes = options.attributes;
        var children   = options.children;
        var listeners  = options.listeners;
        var classes    = options.classes;

        console.assert(!!tag, 'invalid tag');

        var element = elementCreator(tag);

        if (isObject(attributes)) {
            for (attrName in attributes) {
                if (attributes.hasOwnProperty(attrName) && attributes[attrName] !== undefined) {
                    element.setAttribute(attrName, attributes[attrName]);
                }
            }
        }

        if (isArray(children)) {
            for (var i = 0; i < children.length; ++i) {
                element.appendChild(children[i]);
            }
        }

        if (isObject(listeners)) {
            for (key in listeners) {
                if (listeners.hasOwnProperty(key) && listeners[key] !== undefined) {
                    element.addEventListener(key, listeners[key]);
                }
            }
        }

        if (isArray(classes)) {
            for (var i = 0; i < classes.length; ++i) {
                element.classList.add(classes[i]);
            }
        }

        return element;

    }

    function removeAllChildren(domElement) {
        domElement.innerHTML = '';
    }

    function setTextContent(domElement, text) {
        removeAllChildren(domElement);
        domElement.appendChild(createTextNode(text));
    }

    function lerp(start, target, weight) {
        return start * (1 - weight) + target * weight;
    }

});