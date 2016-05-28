define(

    'SelectionManager',

    ['Input/KeyCodes', 'Observer'],

    function(KeyCodes, createObserver) {

        var selectionPrevious = null;
        var selectionCurrent  = null;

        var onSelectionChanged = createObserver();
        var onSelectFirstChild = createObserver();
        var onSelectSibling    = createObserver();
        var onSelectParent     = createObserver();

        var selectParentCallback;

        return {
            init:               init,
            selectNode:         selectNode,
            undoSelection:      undoSelection,
            onSelectionChanged: onSelectionChanged,
            onSelectFirstChild: onSelectFirstChild,
            onSelectSibling:    onSelectSibling,
            onSelectParent:     onSelectParent
        };


        function init(rootElement) {

            rootElement.addEventListener('click', function(event) {
                selectNode(null);
            });

            // rootElement.addEventListener('mousedown', function(event) {
            //     event.stopPropagation();
            //     event.preventDefault();
            // });

            document.body.addEventListener('keydown', function(event) {
                // TODO: cleanup a bit
                var keyCode = event.keyCode;
                if (document.activeElement instanceof HTMLInputElement) {
                    var input = document.activeElement;
                    if (input.type === 'text' && (
                        keyCode === KeyCodes.LEFT  && input.selectionEnd > 0 ||
                        keyCode === KeyCodes.RIGHT && input.selectionStart < input.value.length
                    )) {
                        return;
                    }
                }
                var processed = true;
                switch (keyCode) {
                    case KeyCodes.ESC:   selectNothing();    break;
                    case KeyCodes.RIGHT: selectFirstChild(); break;
                    case KeyCodes.LEFT:  selectParent();     break;
                    case KeyCodes.UP:    selectSibling(-1);  break;
                    case KeyCodes.DOWN:  selectSibling(1);   break;
                    default:
                        processed = false;
                        // console.log('unused keycode', event.keyCode);
                }
                if (processed) event.preventDefault();
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
            if (selectionCurrent) onSelectFirstChild.dispatch(selectionCurrent);
        }


        function selectParent() {
            if (selectionCurrent) onSelectParent.dispatch(selectionCurrent);
        }


        function selectSibling(delta) {
            if (selectionCurrent) onSelectSibling.dispatch(selectionCurrent, delta);
        }

    }

);