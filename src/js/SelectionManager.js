define(

    'SelectionManager',

    ['Input/KeyCodes', 'Observer'],

    function(KeyCodes, createObserver) {

        var selectionPrevious = null;
        var selectionCurrent  = null;

        var onSelectionChanged = createObserver();

        return {
            init:               init,
            selectNode:         selectNode,
            undoSelection:      undoSelection,
            onSelectionChanged: onSelectionChanged
        };


        function init(rootElement) {

            rootElement.addEventListener('click', function(event) {
                selectNode.call(null);
            });

            // rootElement.addEventListener('mousedown', function(event) {
            //     event.stopPropagation();
            //     event.preventDefault();
            // });

            document.body.addEventListener('keydown', function(event) {
                switch (event.keyCode) {
                    case KeyCodes.ESC:   selectNothing();    break;
                    case KeyCodes.RIGHT: selectFirstChild(); break;
                    case KeyCodes.LEFT:  selectParent();     break;
                    case KeyCodes.UP:    selectSibling(-1);  break;
                    case KeyCodes.DOWN:  selectSibling(1);   break;
                    // default:
                    //     console.log('unused keycode', event.keyCode);
                }
            });

        }


        function selectNode(nodeViewDomElement, optDontFocus) {
            'use strict';

            if (selectionCurrent) {
                selectionCurrent.wrapper.classList.remove('selection');
            }

            selectionPrevious = selectionCurrent;
            if (nodeViewDomElement !== selectionCurrent) {
                selectionCurrent = nodeViewDomElement;
            } else {
                selectionCurrent = null;
            }

            if (selectionCurrent) {
                selectionCurrent.wrapper.classList.add('selection');
                onSelectionChanged.dispatch([ selectionCurrent ], !optDontFocus);
            } else {
                onSelectionChanged.dispatch([], !optDontFocus);
            }

        }


        function undoSelection() {
            console.warn('Undo selection not yet implemented');
            // selectNode.call(selectionPrevious);
        }


        function selectNothing() {
            selectNode.call(null);
        }


        function selectFirstChild() {
            console.warn('Select first child not yet implemented');
            // if (!selectionCurrent) return;
        }


        function selectParent() {
            console.warn('Select parent not yet implemented');
            // if (!selectionCurrent) return;
        }


        function selectSibling(delta) {
            console.warn('Select sibling not yet implemented');
            // if (!selectionCurrent) return;
        }

    }

);