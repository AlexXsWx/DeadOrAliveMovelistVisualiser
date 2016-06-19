define(

    'SelectionManager',

    ['NodeView', 'Input/KeyCodes', 'Observer'],

    function SelectionManager(NodeView, KeyCodes, createObserver) {

        var selectionPrevious = null;
        var selectionCurrent  = null;

        var onSelectionChanged = createObserver();

        var getVisibleNodesSvgViews;
        var toggleChildren;

        var selectParentCallback;

        return {
            init:                init,
            selectNode:          selectNode,
            undoSelection:       undoSelection,
            getCurrentSelection: getCurrentSelection,
            onSelectionChanged:  onSelectionChanged
        };


        function init(rootElement, getVisibleNodesSvgViewsRef, toggleChildrenRef) {

            getVisibleNodesSvgViews = getVisibleNodesSvgViewsRef;
            toggleChildren = toggleChildrenRef;

            rootElement.addEventListener('click', function(event) {
                selectNode(null);
            });

            // rootElement.addEventListener('mousedown', function(event) {
            //     event.stopPropagation();
            //     event.preventDefault();
            // });

            // FIXME: don't reference window in this class
            window.addEventListener('keydown', function(event) {
                // TODO: cleanup a bit
                var keyCode = event.keyCode;
                if (!event.ctrlKey && document.activeElement instanceof HTMLInputElement) {
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
                    case KeyCodes.ESC:   selectNothing(); break;
                    case KeyCodes.RIGHT: selectFirstChild(selectionCurrent);   break;
                    case KeyCodes.LEFT:  selectParent(selectionCurrent);       break;
                    case KeyCodes.UP:    selectSibling(selectionCurrent, -1);  break;
                    case KeyCodes.DOWN:  selectSibling(selectionCurrent, 1);   break;
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


        function getCurrentSelection() {
            return selectionCurrent;
        }


        function selectNothing() {
            selectNode.call(null);
        }


        // TODO: select mid child?
        function selectFirstChild(nodeSvgView) {

            if (!nodeSvgView) return; // FIXME: select root

            var visibleNodesSvgViews = getVisibleNodesSvgViews();

            var nodeView = nodeSvgView.nodeView;
            var children = NodeView.getVisibleChildren(nodeView);
            if (children && children.length > 0) {
                var firstChild = children[0];
                var childId = NodeView.getId(firstChild);
                if (visibleNodesSvgViews.hasOwnProperty(childId)) {
                    selectNode(visibleNodesSvgViews[childId]);
                }
            } else {
                // FIXME: this doesn't belong here
                children = NodeView.getHiddenChildren(nodeView);
                if (children && children.length > 0) {
                    toggleChildren(nodeSvgView);
                }
            }

        }


        // TODO: Don't go level up, change parent but keep depth instead?
        function selectSibling(nodeSvgView, delta) {

            if (!nodeSvgView) return; // FIXME: select root

            var visibleNodesSvgViews = getVisibleNodesSvgViews();

            var nodeView = nodeSvgView.nodeView;
            var parent = NodeView.getParentView(nodeView);
            if (!parent) return;
            var children = NodeView.getVisibleChildren(parent);
            var selfIndex = children.indexOf(nodeView);
            console.assert(selfIndex >= 0, 'parent/children structure is broken');
            if (selfIndex + delta < 0) {
                var parentId = NodeView.getId(parent);
                if (visibleNodesSvgViews.hasOwnProperty(parentId)) {
                    var parentNodeSvgView = visibleNodesSvgViews[parentId];
                    selectSibling(parentNodeSvgView, selfIndex + delta);
                }
            } else
            if (selfIndex + delta > children.length - 1) {
                var parentId = NodeView.getId(parent);
                if (visibleNodesSvgViews.hasOwnProperty(parentId)) {
                    var parentNodeSvgView = visibleNodesSvgViews[parentId];
                    selectSibling(parentNodeSvgView, selfIndex + delta - (children.length - 1));
                }
            } else {
                var child = children[selfIndex + delta];
                var childId = NodeView.getId(child);
                if (visibleNodesSvgViews.hasOwnProperty(childId)) {
                    selectNode(visibleNodesSvgViews[childId]);
                }
                // TODO: else - create placeholder?
            }

        }


        // TODO: Select nearest node at left instead of parent?
        function selectParent(nodeSvgView) {

            if (!nodeSvgView) return; // FIXME: select root

            var visibleNodesSvgViews = getVisibleNodesSvgViews();

            var nodeView = nodeSvgView.nodeView;
            var parent = NodeView.getParentView(nodeView);
            if (!parent) return;
            var parentId = NodeView.getId(parent);
            if (visibleNodesSvgViews.hasOwnProperty(parentId)) {
                selectNode(visibleNodesSvgViews[parentId]);
            }

        }

    }

);