define('Tools', function() {

    return {
        isObject:                              isObject,
        defined:                               defined,
        defaults:                              defaults,
        withoutFalsyProperties:                withoutFalsyProperties,
        arraysAreEqual:                        arraysAreEqual,
        removeElement:                         removeElement,
        copyKeysInto:                          copyKeysInto,
        isNonEmptyArray:                       isNonEmptyArray,
        isBool:                                isBool,
        isNumber:                              isNumber,
        moveArrayElement:                      moveArrayElement,
        arraysConsistOfSameStrings:            arraysConsistOfSameStrings,
        getDomElement:                         getDomElement,
        hideDomElement:                        hideDomElement,
        showDomElement:                        showDomElement,
        createDomElement:                      createDomElement,
        createTextNode:                        createTextNode,
        createSvgElement:                      createSvgElement,
        applyAttributesClassesAndAddListeners: applyAttributesClassesAndAddListeners,
        createMergedRow:                       createMergedRow,
        setTextContent:                        setTextContent,
        removeAllChildren:                     removeAllChildren,
        lerp:                                  lerp,
        dispatchInputEvent:                    dispatchInputEvent,
        forEachOwnProperty:                    forEachOwnProperty,
        flattenRecursion:                      flattenRecursion,
        sliceArguments:                        sliceArguments
    };

    function getDomElement(id) {
        var result = document.getElementById(id);
        console.assert(!!result, 'element #"' + id + '" not found');
        return result;
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

    // TODO: revisit names
    /** overwrites values of `target`'s keys with corresponding values `source`, if provided */
    function defaults(source, target) {
        if (!source || !isObject(source)) return target;
        Object.getOwnPropertyNames(target).forEach(function(propName) {
            target[propName] = defined(source[propName], target[propName]);
        });
        for (key in source) {
            if (!(key in target)) {
                console.warn('Target doesn\'t have key that source has: "%s"', key);
            }
        }
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

    function isNumber(obj) {
        return typeof obj === 'number';
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

        if (isArray(children)) {
            for (var i = 0; i < children.length; ++i) {
                element.appendChild(children[i]);
            }
        }

        applyAttributesClassesAndAddListeners(element, {
           attributes: attributes,
           listeners:  listeners,
           classes:    classes
        });

        return element;

    }

    function applyAttributesClassesAndAddListeners(element, options) {

        var attributes = options.attributes;
        var listeners  = options.listeners;
        var classes    = options.classes;

        isObject(attributes) && forEachOwnProperty(attributes, function(attribute, value) {
            if (value !== undefined) element.setAttribute(attribute, value);
        });

        isObject(listeners) && forEachOwnProperty(listeners, function(key, value) {
            if (value !== undefined) element.addEventListener(key, value);
        });

        if (isArray(classes)) {
            for (var i = 0; i < classes.length; ++i) {
                element.classList.add(classes[i]);
            }
        }

    }

    function createMergedRow(colspan, children) {
        return createDomElement({
            tag: 'tr',
            children: [
                createDomElement({
                    tag: 'td',
                    attributes: { 'colspan': colspan },
                    children: children
                })
            ]
        });
    }

    function removeAllChildren(domElement) {
        domElement.innerHTML = '';
    }

    function setTextContent(domElement, text) {
        removeAllChildren(domElement);
        if (text instanceof DocumentFragment) {
            domElement.appendChild(text);
        } else {
            domElement.appendChild(createTextNode(text));
        }
    }

    function lerp(start, target, weight) {
        return start * (1.0 - weight) + target * weight;
    }

    // FIXME: may not be compatible with browsers other than chrome
    function dispatchInputEvent(inputElement, eventName) {
        inputElement.dispatchEvent(new Event(eventName, { bubbles: false, cancelable: true }));
    }

    function forEachOwnProperty(object, action) {
        for (key in object) {
            if (object.hasOwnProperty(key)) {
                action(key, object[key]);
            }
        }
    }

    /** WARNING: order of execution is not preserved */
    function flattenRecursion(func) {

        var isRunning = false;
        var args = [];
        
        return goRecursive;

        function goRecursive(/* arguments */) {
            args.push(sliceArguments.apply(null, arguments));
            run();
        }

        function run() {
            if (!isRunning) {
                isRunning = true;
                while (args.length > 0) {

                    // slow but preserves order
                    // var arg = args.shift();

                    // fast but does not preserve order
                    var arg = args[0];
                    args[0] = args[args.length - 1];
                    args.pop();

                    func.apply(null, arg);
                }
                isRunning = false;
            }
        }
    }

    /** Only use via apply */
    function sliceArguments(/* arguments */) {
        var args = [];
        for (var i = 0; i < arguments.length; ++i) {
            args.push(arguments[i]);
        }
        return args;
    }

});