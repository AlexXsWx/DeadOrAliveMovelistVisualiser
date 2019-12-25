define(

    'Tools/Tools',

    [],

    function() {

        var mixinStorage = createMixinStorage('doa5lrMovelistMixinStorage');

        // TODO: split into sub packages like DOM, object, array etc
        return {

            // Other

            debugTraceCollapsed:     debugTraceCollapsed,
            report:                  report,
            getStack:                getStack,
            defined:                 defined,
            optimizedSliceArguments: optimizedSliceArguments,

            // Window

            getParameters: getParameters,
            isDevBuild:    isDevBuild,

            // FP

            flattenRecursionDirty: flattenRecursionDirty,

            // Types

            isArray:         isArray,
            isObject:        isObject,
            isNonEmptyArray: isNonEmptyArray,
            isBool:          isBool,
            isNumber:        isNumber,
            isString:        isString,

            // Number

            signed: signed,

            // Object

            withoutFalsyProperties: withoutFalsyProperties,

            defaults:           defaults,
            copyKeysInto:       copyKeysInto,
            mapValues:          mapValues,
            forEachOwnProperty: forEachOwnProperty,

            getCustomProperty: mixinStorage.getProperty,
            setCustomProperty: mixinStorage.setProperty,

            // Array

            withoutFalsyElements: withoutFalsyElements,

            arraysAreEqual:             arraysAreEqual,
            arraysConsistOfSameStrings: arraysConsistOfSameStrings,
            contains:                   contains,
            find:                       find,

            createArray: createArray,

            last:          last,
            getOrThrow:    getOrThrow,

            moveArrayElement:     moveArrayElement,
            addBetween:           addBetween,
            addUnique:            addUnique,
            take:                 take,
            takeSomeArrayElement: takeSomeArrayElement,
            removeElement:        removeElement,
            removeElementAtIndex: removeElementAtIndex,

            sortFuncAscending:    sortFuncAscending,
            arrayGroupedByFactor: arrayGroupedByFactor,

            searchInStringArray: searchInStringArray,

            flatForEach: flatForEach,

            createObjectStorage: createObjectStorage,

            // DOM

            getDomElement: getDomElement,

            createDomElement: createDomElement,
            createTextNode:   createTextNode,
            createMergedRow:  createMergedRow,
            createSvgElement: createSvgElement,

            removeAllChildren:       removeAllChildren,
            removeElementFromParent: removeElementFromParent,

            hideDomElement: hideDomElement,
            showDomElement: showDomElement,

            setTextContent: setTextContent,

            addClickListenerToElement:       addClickListenerToElement,
            addClickListenerToElementWithId: addClickListenerToElementWithId,
            dispatchInputEvent:              dispatchInputEvent,

            // Math

            lerp: lerp
        };

        function report(/*arguments*/) {
            console.error.apply(console, arguments);
            if (isDevBuild()) {
                debugger;
            }
            // TODO: send the message somewhere
        }

        function getParameters(optAdaptList) {
            var hashParameters = window.location.hash.substr(1).split(',');

            var result = Object.create({
                adapt: adapt,
                has: has,
                get: get
            });

            var adapted = {};

            for (var i = 0; i < hashParameters.length; ++i) {
                var parts = hashParameters[i].split('=');
                var paramName  = parts[0].toLowerCase();
                var paramValue = decodeURI(parts.slice(1).join('='));

                result[paramName] = paramValue;
            }

            optAdaptList && optAdaptList.forEach(function(paramNamePrefix) {
                adapt(paramNamePrefix);
            });

            return result;

            // turn values like "show-safety" into "show=safety" by adapting prefix "show"
            function adapt(prefix) {
                forEachOwnProperty(result, function(key, value) {
                    if (key.startsWith(prefix)) {
                        var postfix = key.substr(prefix.length);
                        var match = postfix.match(/\s*[-:=]?\s*(.+)$/);
                        if (match) {
                            var value = match[1];
                            adapted[prefix] = (adapted[prefix] || []).concat(value);
                        }
                    }
                });
            }

            function has(paramName) {
                return (
                    result.hasOwnProperty(paramName) ||
                    adapted.hasOwnProperty(paramName)
                );
            }

            function get(paramName, optDefaultValue) {
                if (result.hasOwnProperty(paramName)) {
                    return result[paramName] || optDefaultValue;
                }
                if (adapted.hasOwnProperty(paramName)) {
                    return adapted[paramName][0] || optDefaultValue;
                }
                return optDefaultValue;
            }
        }

        function isDevBuild() {
            try {
                return (
                    window.location.protocol === 'file:' ||
                    window.location.hostname === 'localhost' ||
                    window.location.hostname === '127.0.0.1' ||
                    /^192\.168\.\d+.\d+$/.test(window.location.hostname)
                );
            } catch(error) {
                return false;
            }
        }

        function getDomElement(id) {
            var result = document.getElementById(id);
            console.assert(Boolean(result), 'element #"' + id + '" not found');
            return result;
        }

        function addClickListenerToElementWithId(id, listener) {
            addClickListenerToElement(getDomElement(id), listener);
        }

        function addClickListenerToElement(element, listener) {
            element.addEventListener('click', listener);
        }

        function hideDomElement(element) {
            element.classList.add('hidden');
        }

        function showDomElement(element) {
            element.classList.remove('hidden');
        }

        function arraysAreEqual(arrayA, arrayB) {
            if (arrayA.length !== arrayB.length) return false;
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

        function removeElementAtIndex(array, index) {
            array.splice(index, 1);
            return true;
        }

        function addBetween(array, element, a, b, optFallbackIsStart) {

            var indexA = array.indexOf(a);
            var indexB = array.indexOf(b);

            var aExists = indexA !== -1;
            var bExists = indexB !== -1;

            if (!aExists && !bExists) {
                if (optFallbackIsStart) {
                    array.unshift(element);
                } else {
                    array.push(element);
                }
            } else
            if (aExists && bExists) {
                var minIndex = Math.min(indexA, indexB);
                insertAfter(array, minIndex, element);
            } else {
                if (aExists) {
                    insertAfter(array, indexA, element);
                } else {
                    insertBefore(array, indexB, element);
                }
            }
            return array;

            function insertAfter(array, index, element)  { array.splice(index + 1, 0, element); }
            function insertBefore(array, index, element) { array.splice(index, 0, element);     }
        }

        function addUnique(outArray, elements) {
            var changed = false;
            elements.forEach(function(element) {
                if (!contains(outArray, element)) {
                    changed = true;
                    outArray.push(element);
                }
            });
            return changed;
        }

        function last(array) {
            if (array.length === 0) return undefined;
            return array[array.length - 1];
        }

        function find(array, predicate) {
            for (var i = 0; i < array.length; i++) {
                var element = array[i];
                if (predicate(element)) return element;
            }
        }

        function contains(array, val) {
            return array.indexOf(val) >= 0;
        }

        function searchInStringArray(array, regexOrString) {
            if (!array || !array.length) return -1;
            for (var i = 0; i < array.length; ++i) {
                if (array[i].search(regexOrString) >= 0) return i;
            }
            return -1;
        }

        function flatForEach(array, func, optStopCondition) {
            var path = [0];
            var result = undefined;
            while (path.length > 0) {
                var a = getArray();
                var i = getPointer();
                if (i < a.length) {
                    if (isArray(a[i])) {
                        goDeeper();
                        continue;
                    }
                    result = func(a[i], i, a);
                    if (optStopCondition && optStopCondition(result)) break;
                } else {
                    goUp();
                }
                incrementPointer();
            }
            return result;
            function goDeeper() { path.push(0); }
            function goUp() { path.pop(); }
            function getPointer() { return path[path.length - 1]; }
            function incrementPointer() {
                if (path.length > 0) {
                    path[path.length - 1] += 1;
                }
            }
            function getArray() {
                if (path.length === 1) return array;
                return path.reduce(
                    function(acc, curr) { return acc[curr]; },
                    array
                );
            }
        }

        function getOrThrow(array, index) {
            if (index < 0 || index >= array.length) throw new Error('Index out of bounds');
            return array[index];
        }

        function withoutFalsyProperties(obj, optCustomHandlers) {
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
                    if (optCustomHandlers && optCustomHandlers[key]) {
                        value = optCustomHandlers[key](value);
                    } else {
                        if (isArray(value) || isObject(value)) {
                            value = withoutFalsyProperties(value);
                        }
                    }
                    if (isTruthyValue(value)) {
                        result[key] = value;
                    }
                });
            }
            return isTruthyValue(result) ? result : undefined;
        }

        function withoutFalsyElements(array, optSaveOrder) {
            var filtered;
            if (optSaveOrder) {
                filtered = [];
                for (var i = array.length - 1; i >= 0; --i) {
                    if (isTruthyValue(array[i])) filtered[i] = array[i];
                }
            } else {
                filtered = array.filter(isTruthyValue);
            }
            return filtered.length > 0 ? filtered : undefined;
        }

        function isTruthyValue(obj) {
            if (obj === 0)     return true;
            if (obj === false) return true;
            if (isArray(obj))  return obj.length > 0;
            if (isObject(obj)) return Object.getOwnPropertyNames(obj).length > 0;
            return Boolean(obj);
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

        function signed(number) {
            return String(number)[0] === '-' ? number : '+' + number;
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
            return target;
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

        /**
         * `groupElementsFunc` is given two elements.
         * If it returns true, this elements will be grouped together
         */
        function arrayGroupedByFactor(array, groupElementsFunc) {

            if (array.length === 0) return [];

            var result = [ [array[0]] ];

            for (var i = 1; i < array.length; ++i) {
                var element = array[i];
                var index = findIndexFor(element);
                if (index === -1) {
                    result.push([element]);
                } else {
                    result[index].push(element);
                }
            }

            return result;

            function findIndexFor(element) {
                for (var i = 0; i < result.length; ++i) {
                    for (var j = 0; j < result[i].length; ++j) {
                        if (groupElementsFunc(element, result[i][j])) {
                            return i;
                        }
                    }
                }
                return -1;
            }
        }

        function arraysConsistOfSameStrings(arrayA, arrayB) {
            return (
                arrayA.every(function(element) { return contains(arrayB, element); }) &&
                arrayB.every(function(element) { return contains(arrayA, element); })
            );
        }

        function take(array, predicate) {
            var i = 0;
            var result = [];
            while (i < array.length) {
                if (predicate(array[i])) {
                    result = result.concat(array.splice(i, 1));
                } else {
                    i++;
                }
            }
            return result;
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

            console.assert(Boolean(tag), 'invalid tag');

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
                if (value !== undefined) {
                    if (key === 'click') {
                        addClickListenerToElement(element, value);
                    } else {
                        element.addEventListener(key, value);
                    }
                }
            });

            if (isArray(classes)) {
                for (var i = 0; i < classes.length; ++i) {
                    element.classList.add(classes[i]);
                }
            }

        }

        function createMergedRow(colspan, children, classes) {
            return createDomElement({
                tag: 'tr',
                children: [
                    createDomElement({
                        tag: 'td',
                        attributes: { 'colspan': colspan },
                        children: children
                    })
                ],
                classes: classes
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

        function mapValues(obj) {
            return Object.keys(obj).map(function(key) { return obj[key]; });
        }

        function forEachOwnProperty(object, action) {
            for (key in object) {
                if (object.hasOwnProperty(key)) {
                    action(key, object[key]);
                }
            }
        }

        /** WARNING: order of execution is not preserved */
        function flattenRecursionDirty(func) {

            var executing = false;
            var args = [];
            
            return goRecursive;

            function goRecursive(/* arguments */) {
                args.push(optimizedSliceArguments.apply(null, arguments));
                run();
            }

            function run() {
                if (executing) return;

                executing = true;
                while (args.length > 0) {

                    // slow but preserves order
                    // var nextArgs = args.shift();

                    // fast but messes up order of elements in the array
                    var nextArgs = takeSomeArrayElement(args);

                    func.apply(null, nextArgs);
                }
                executing = false;
            }
        }

        /** Removes an element from the array and returns it */
        function takeSomeArrayElement(array) {
            var result = array[0];
            array[0] = array[array.length - 1];
            array.pop();

            return result;
        }

        /** Only use via apply */
        function optimizedSliceArguments(/* arguments */) {
            var args = [];
            for (var i = 0; i < arguments.length; ++i) {
                args.push(arguments[i]);
            }
            return args;
        }

        function removeElementFromParent(element) {
            element.parentNode.removeChild(element);
        }

        function createArray(size, elementCreator) {
            var result = [];
            for (var i = 0; i < size; ++i) {
                result.push(elementCreator(i));
            }
            return result;
        }

        function sortFuncAscending(a, b) {
            if (a > b) return 1;
            if (a < b) return -1;
            return 0;
        }

        function createMixinStorage(key) {
            return {
                getProperty: getProperty,
                setProperty: setProperty
            };

            function getProperty(obj, propName, optDefaultValue) {
                if (
                    obj[key] &&
                    obj[key].hasOwnProperty(propName)
                ) {
                    return obj[key][propName];
                } else {
                    return optDefaultValue;
                }
            }

            function setProperty(obj, propName, value, optLazy) {
                if (optLazy && getProperty(obj, propName, value) === value) return;
                if (!obj[key]) obj[key] = {};
                obj[key][propName] = value;
            }
        }

        function getStack(optLevelOffset) {
            var offset = 2 + (optLevelOffset || 0);
            return (new Error()).stack.toString().split('\n').slice(offset).join('\n');
        }

        function debugTraceCollapsed(msg) {
            console.groupCollapsed(msg);
            console.trace(msg);
            console.groupEnd();
        }

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
                return contains(keys, object);
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
