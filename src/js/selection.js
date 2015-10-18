define(

    'selection',

    ['keyCodes'],

    function(keyCodes) {

        var previousSelection = null;
        var selectedNode = null;

        // var onSelectionChanged = {
        //     addListener: function(l) {

        //     }
        // }

        return {
            getSelectedNode: function() { return selectedNode; },
            init:            init,
            selectNode:      selectNode,
            undoSelection:   undoSelection
            // onSelectionChanged: onSelectionChanged
        };


        function init(rootElement) {

            d3.select(rootElement).on('click', function() { selectNode.call(null); });

            // d3.select(rootElement).on('mousedown', function() {
            //     d3.event.stopPropagation();
            //     d3.event.preventDefault();
            // });

            d3.select(document.body).on('keydown', function() {
                switch (d3.event.keyCode) {
                    case keyCodes.ESC:   selectNothing();    break;
                    case keyCodes.RIGHT: selectFirstChild(); break;
                    case keyCodes.LEFT:  selectParent();     break;
                    case keyCodes.UP:    selectSibling(-1);  break;
                    case keyCodes.DOWN:  selectSibling(1);   break;
                    // default:
                    //     console.log('unused keycode', d3.event.keyCode);
                }
            });

        }


        /** Uses `this` for easy use with d3 */
        function selectNode(dontFocus) {
            'use strict';

            if (selectedNode !== null) {
                var selection = d3.select(selectedNode);
                selection.classed('selection', false);
            }

            previousSelection = selectedNode;
            if (this !== selectedNode) {
                selectedNode = this;
            } else {
                selectedNode = null;
            }

            if (!selectedNode) {
                d3.select('#nodeInput').node().value = '';
                d3.select('#nodeContext').node().value = '';
                // todo: disable editor
            } else {
                var selection = d3.select(selectedNode);
                selection.classed('selection', true);
                var datum = selection.datum();
                d3.select('#nodeInput').node().value = datum.fd3Data.input;
                !dontFocus && d3.select('#nodeInput').node().select();
                d3.select('#nodeContext').node().value = datum.fd3Data.context.join(', ');
                // todo: enable editor
            }

            d3.event.stopPropagation();

        }


        function undoSelection() {
            // selectNode.call(previousSelection);
        }


        function selectNothing() {
            selectNode.call(null);
        }


        function selectFirstChild() {
            // if (!selectedNode) return;
            // var datum = d3.select(selectedNode).datum();
        }


        function selectParent() {
            // if (!selectedNode) return;
            // var datum = d3.select(selectedNode).datum();
        }


        function selectSibling(delta) {
            // if (!selectedNode) return;
            // var datum = d3.select(selectedNode).datum();
        }

    }

);