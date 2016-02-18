define(

    'SelectionManager',

    ['KeyCodes', 'Observer'],

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

            d3.select(rootElement).on('click', function() { selectNode.call(null); });

            // d3.select(rootElement).on('mousedown', function() {
            //     d3.event.stopPropagation();
            //     d3.event.preventDefault();
            // });

            d3.select(document.body).on('keydown', function() {
                switch (d3.event.keyCode) {
                    case KeyCodes.ESC:   selectNothing();    break;
                    case KeyCodes.RIGHT: selectFirstChild(); break;
                    case KeyCodes.LEFT:  selectParent();     break;
                    case KeyCodes.UP:    selectSibling(-1);  break;
                    case KeyCodes.DOWN:  selectSibling(1);   break;
                    // default:
                    //     console.log('unused keycode', d3.event.keyCode);
                }
            });

        }


        function selectNode(nodeViewDomElement, optDontFocus) {
            'use strict';

            console.log('now selected: %O', nodeViewDomElement);

            if (selectionCurrent !== null) {
                var selection = d3.select(selectionCurrent);
                selection.classed('selection', false);
            }

            selectionPrevious = selectionCurrent;
            if (nodeViewDomElement !== selectionCurrent) {
                selectionCurrent = nodeViewDomElement;
            } else {
                selectionCurrent = null;
            }

            if (selectionCurrent) {
                d3.select(selectionCurrent).classed('selection', true);
                onSelectionChanged.dispatch([ selectionCurrent ], !optDontFocus);
            } else {
                onSelectionChanged.dispatch([], !optDontFocus);
            }

            d3.event.stopPropagation();

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
            // var datum = d3.select(selectionCurrent).datum();
        }


        function selectParent() {
            console.warn('Select parent not yet implemented');
            // if (!selectionCurrent) return;
            // var datum = d3.select(selectionCurrent).datum();
        }


        function selectSibling(delta) {
            console.warn('Select sibling not yet implemented');
            // if (!selectionCurrent) return;
            // var datum = d3.select(selectionCurrent).datum();
        }

    }

);