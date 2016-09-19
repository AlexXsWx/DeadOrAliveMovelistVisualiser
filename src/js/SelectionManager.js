define(

    'SelectionManager',

    ['NodeView', 'Observer', 'Executor'],

    function SelectionManager(NodeView, createObserver, Executor) {

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
            onSelectionChanged:  onSelectionChanged,

            deselectAll:           deselectAll,
            selectFirstChild:      selectFirstChild,
            selectParent:          selectParent,
            selectPreviousSibling: selectPreviousSibling,
            selectNextSibling:     selectNextSibling
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

        }


        function selectNode(svgNodeView, optDontFocus) {

            if (selectionCurrent) {
                selectionCurrent.wrapper.classList.remove('selection');
            }

            selectionPrevious = selectionCurrent;
            if (svgNodeView !== selectionCurrent) {
                selectionCurrent = svgNodeView;
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
            // selectNode(selectionPrevious);
        }


        function getCurrentSelection() {
            return selectionCurrent;
        }


        function deselectAll() {
            var selectionCurrentWas = selectionCurrent;
            Executor.executeAndRememberCommand(
                'Deselect all',
                function() { selectNode(null); },
                function() { selectNode(selectionCurrentWas); }
            );
        }

        function selectFirstChild() {
            selectFirstChildOfNode(selectionCurrent);
        }

        function selectParent() {
            selectParentOfNode(selectionCurrent);
        }

        function selectPreviousSibling() {
            selectSiblingOfNode(selectionCurrent, -1);
        }

        function selectNextSibling() {
            selectSiblingOfNode(selectionCurrent, 1);
        }


        // TODO: select mid child?
        function selectFirstChildOfNode(nodeSvgView) {

            if (!nodeSvgView) return; // FIXME: select root

            var visibleNodesSvgViews = getVisibleNodesSvgViews();

            var nodeView = nodeSvgView.nodeView;
            var children = NodeView.getVisibleChildren(nodeView);
            if (children.length > 0) {
                var firstChild = children[0];
                var childId = NodeView.getId(firstChild);
                if (visibleNodesSvgViews.hasOwnProperty(childId)) {
                    selectNode(visibleNodesSvgViews[childId]);
                }
            } else {
                // FIXME: this doesn't belong here
                children = NodeView.getHiddenChildren(nodeView);
                if (children.length > 0) {
                    toggleChildren(nodeSvgView);
                }
            }

        }


        // TODO: Don't go level up, change parent but keep depth instead?
        function selectSiblingOfNode(nodeSvgView, delta) {

            if (!nodeSvgView) return; // FIXME: select root

            var visibleNodesSvgViews = getVisibleNodesSvgViews();

            var nodeView = nodeSvgView.nodeView;
            var parent = NodeView.getParentNodeView(nodeView);
            if (!parent) return;
            var children = NodeView.getVisibleChildren(parent);
            var selfIndex = children.indexOf(nodeView);
            console.assert(selfIndex >= 0, 'parent/children structure is broken');
            if (selfIndex + delta < 0) {
                var parentId = NodeView.getId(parent);
                if (visibleNodesSvgViews.hasOwnProperty(parentId)) {
                    var parentNodeSvgView = visibleNodesSvgViews[parentId];
                    selectSiblingOfNode(parentNodeSvgView, selfIndex + delta);
                }
            } else
            if (selfIndex + delta > children.length - 1) {
                var parentId = NodeView.getId(parent);
                if (visibleNodesSvgViews.hasOwnProperty(parentId)) {
                    var parentNodeSvgView = visibleNodesSvgViews[parentId];
                    selectSiblingOfNode(parentNodeSvgView, selfIndex + delta - (children.length - 1));
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
        function selectParentOfNode(nodeSvgView) {

            if (!nodeSvgView) return; // FIXME: select root

            var visibleNodesSvgViews = getVisibleNodesSvgViews();

            var nodeView = nodeSvgView.nodeView;
            var parent = NodeView.getParentNodeView(nodeView);
            if (!parent) return;
            var parentId = NodeView.getId(parent);
            if (visibleNodesSvgViews.hasOwnProperty(parentId)) {
                selectNode(visibleNodesSvgViews[parentId]);
            }

        }

    }

);