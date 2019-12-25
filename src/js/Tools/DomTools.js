define(

    'Tools/DomTools',

    ['Tools/TypeTools'],

    function(_) {

        return {

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
        };

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

            if (_.isArray(children)) {
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

            _.isObject(attributes) && forEachOwnProperty(attributes, function(attribute, value) {
                if (value !== undefined) element.setAttribute(attribute, value);
            });

            _.isObject(listeners) && forEachOwnProperty(listeners, function(key, value) {
                if (value !== undefined) {
                    if (key === 'click') {
                        addClickListenerToElement(element, value);
                    } else {
                        element.addEventListener(key, value);
                    }
                }
            });

            if (_.isArray(classes)) {
                for (var i = 0; i < classes.length; ++i) {
                    element.classList.add(classes[i]);
                }
            }

            return;

            function forEachOwnProperty(object, action) {
                for (key in object) {
                    if (object.hasOwnProperty(key)) {
                        action(key, object[key]);
                    }
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

        // FIXME: may not be compatible with browsers other than chrome
        function dispatchInputEvent(inputElement, eventName) {
            inputElement.dispatchEvent(new Event(eventName, { bubbles: false, cancelable: true }));
        }

        function removeElementFromParent(element) {
            element.parentNode.removeChild(element);
        }

    }

);
