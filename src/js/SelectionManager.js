define(

    'SelectionManager',

    [
        'View/NodeView', 'View/NodeSvgViewTextGetters',
        'Tools/Signal', 'Tools/Executor', 'Tools/Tools'
    ],

    function SelectionManager(NodeView, NodeSvgViewTextGetters, createSignal, Executor, _) {

        var selectionCurrent = null;

        var onSelectionChanged = createSignal();

        var refs = {
            getVisibleNodesSvgViews: undefined,
            toggleChildren:          undefined
        };

        return {
            init:                init,
            selectNode:          selectNode,
            getCurrentSelection: getCurrentSelection,
            onSelectionChanged:  onSelectionChanged.listenersManager,

            deselectAll:           deselectAll,
            deselectHiddenNodes:   deselectHiddenNodes,
            selectFirstChild:      selectFirstChild,
            selectParent:          selectParent,
            selectPreviousSibling: selectPreviousSibling,
            selectNextSibling:     selectNextSibling
        };


        function init(rootElement, getVisibleNodesSvgViewsFunc, toggleChildrenFunc) {

            refs.getVisibleNodesSvgViews = getVisibleNodesSvgViewsFunc;
            refs.toggleChildren          = toggleChildrenFunc;

            _.addClickListenerToElement(rootElement, deselectAll);

        }


        function selectNode(svgNodeView, optDontFocus) {

            if (!selectionCurrent && !svgNodeView) return;
            console.assert(!svgNodeView || isVisible(svgNodeView), 'Node to select is not visible');

            var selectionCurrentWas = selectionCurrent;

            Executor.rememberAndExecute(
                (
                    'Change selection: ' +
                    svgNodeViewToString(selectionCurrent) + ' -> ' +
                    svgNodeViewToString(svgNodeView)
                ),
                function changeSelection()     { privateSelectNode(svgNodeView, optDontFocus); },
                function undoChangeSelection() { privateSelectNode(selectionCurrentWas);       }
            );

        }


        function svgNodeViewToString(svgNodeView) {
            return svgNodeView ? NodeSvgViewTextGetters.getTextMain(svgNodeView.nodeView) : 'null';
        }


        function privateSelectNode(svgNodeView, optDontFocus) {

            if (selectionCurrent) {
                selectionCurrent.wrapper.classList.remove('selection');
            }

            if (svgNodeView && !isVisible(svgNodeView)) {
                // Should never happen after Undo is fully implemented
                _.report('Trying to select node that is not visible');
                selectionCurrent = null;
            }
            else
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


        function isVisible(svgNodeView) {
            return refs.getVisibleNodesSvgViews().hasOwnProperty(
                NodeView.getId(svgNodeView.nodeView)
            );
        }


        function getCurrentSelection() {
            var result = [];
            if (selectionCurrent) {
                result.push(selectionCurrent);
            }
            return result;
        }


        function deselectAll(optEvent) {
            if (!selectionCurrent) return;
            selectNode(null);
        }

        function deselectHiddenNodes() {
            if (selectionCurrent && !isVisible(selectionCurrent)) {
                selectNode(null);
            }
        }

        function selectFirstChild() {
            if (selectionCurrent) {
                selectFirstChildOfNode(selectionCurrent);
            }
            // TODO: select root otherwise?
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

            var visibleNodesSvgViews = refs.getVisibleNodesSvgViews();

            var nodeView = nodeSvgView.nodeView;
            var children = NodeView.getVisibleChildren(nodeView);
            if (children.length > 0) {
                var firstChild = children[0];
                var childId = NodeView.getId(firstChild);
                if (visibleNodesSvgViews.hasOwnProperty(childId)) {
                    selectNode(visibleNodesSvgViews[childId]);
                }
            } else {
                // FIXME: this doesn't belong here (changed something; does it still?)
                if (NodeView.hasHiddenChildren(nodeView)) {
                    refs.toggleChildren(nodeSvgView);
                }
            }

        }


        // TODO: Don't go level up, change parent but keep depth instead?
        function selectSiblingOfNode(nodeSvgView, delta) {

            if (!nodeSvgView) return; // FIXME: select root

            var visibleNodesSvgViews = refs.getVisibleNodesSvgViews();

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
                    selectSiblingOfNode(
                        parentNodeSvgView,
                        selfIndex + delta - (children.length - 1)
                    );
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

            var visibleNodesSvgViews = refs.getVisibleNodesSvgViews();

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
