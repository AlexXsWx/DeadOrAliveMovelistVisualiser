define(

    'Movelist', // TODO: rename to Core

    [
        'CanvasManager',
        'NodeFactory', 'NodeSerializer',
        'NodeView', 'NodeSvgView', 'LimitsFinder',
        'SelectionManager', 'Editor', 'UI', 'Analyser', 'Filter',
        'TreeTools', 'GithubStuff', 'Tools', 'Executor', 'Hotkeys'
    ],

    function Movelist(
        CanvasManager,
        NodeFactory, NodeSerializer,
        NodeView, NodeSvgView, createLimitsFinder,
        SelectionManager, Editor, UI, Analyser, Filter,
        TreeTools, GithubStuff, _, Executor, Hotkeys
    ) {

        // ==== Constants ====

            var PADDING = 50;
            var NODE_WIDTH  = 150;
            var NODE_HEIGHT = 25;

        // ===================


        // ==== Variables ====

            var canvas;
            var visibleNodesSvgViews = {};

            var nodeViewGenerator = null;

            var domCache = {
                download: null,
                popupWelcome: null,
                showWelcomePopupOnStart: null,
                showPlaceholders: null
            };

            var limitsFinder;

            var rootNodeData;
            var rootNodeView;

        // ===================


        return { init: init };


        // ==== Init ====

            function init(parentElement) {

                cacheDomElements();

                canvas = CanvasManager.create(parentElement, PADDING);
                SelectionManager.init(canvas.svg, function getVisibleNodesSvgView() {
                    return visibleNodesSvgViews;
                }, toggleChildren);

                nodeViewGenerator = NodeView.createNodeViewGenerator();
                NodeSvgView.onNodeClick.addListener(onClickNodeView);
                NodeSvgView.onNodeToggleChildren.addListener(onDoubleClickNodeView);

                Editor.init(nodeViewGenerator, toggleChildren, selectNodeView);
                Editor.onDataChanged.addListener(onDataChange);

                SelectionManager.onSelectionChanged.addListener(selectionChangedListener);
                limitsFinder = createLimitsFinder();
                loadData(NodeFactory.createEmptyData());
                bindUIActions();
                Hotkeys.init(Executor, SelectionManager, Editor);
                initUI();
                selectNodeView(rootNodeView);

                parseHashParameters();

                GithubStuff.checkIfHigherVersionIsAvailable();
            }


            function parseHashParameters() {

                // FIXME: referencing `window` here isn't a good idea
                var hashParameters = window.location.hash.toLowerCase().substr(1).split(',');

                var exampleUrlByHashParameter = {
                    'example-momiji': GithubStuff.EXAMPLE_URLS.momiji,
                    'example-hitomi': GithubStuff.EXAMPLE_URLS.hitomi,
                    'example-jacky':  GithubStuff.EXAMPLE_URLS.jacky,
                    'example-mai':    GithubStuff.EXAMPLE_URLS.mai,
                    'example-rig':    GithubStuff.EXAMPLE_URLS.rig,
                    'example-honoka': GithubStuff.EXAMPLE_URLS.honoka,
                    'example':        GithubStuff.EXAMPLE_URLS.rig
                };

                var url = null;
                for (var i = 0; i < hashParameters.length; ++i) {
                    var temp = hashParameters[i].toLowerCase().split('=');
                    var paramName  = temp[0];
                    var paramValue = temp[1];
                    if (!url && exampleUrlByHashParameter.hasOwnProperty(paramName)) {
                        url = exampleUrlByHashParameter[paramName];
                    }
                    if (paramName === 'show-safety') {
                        NodeSvgView.setRightTextToSafety();
                    }
                    if (paramName === 'data-url') {
                        url = decodeURI(paramValue);
                    }
                }

                url && NodeSerializer.deserializeFromUrl(url, onDataDeserialized);

            }


            function selectionChangedListener(nodeSvgViews, focus) {
                Editor.updateBySelection(nodeSvgViews, focus);
                if (nodeSvgViews && nodeSvgViews.length > 0) {
                    canvas.scrollToSvgNodeViewIfNeeded(nodeSvgViews[0], limitsFinder.y.min, PADDING);
                }
            }


            function cacheDomElements() {
                domCache.download = _.getDomElement('download');
                domCache.popupWelcome = _.getDomElement('popupWelcomeOverlay');
                domCache.showWelcomePopupOnStart = _.getDomElement('showWelcomePopupOnStart');
                domCache.showPlaceholders = _.getDomElement('showPlaceholders');
            }


            function reset() {
                // don't dispatch
                domCache.showPlaceholders.checked = false;
                Editor.reset();
            }


            function loadData(data) {

                destroyExistingNodes();

                rootNodeData = data;
                rootNodeView = NodeView.createViewFromData(rootNodeData, nodeViewGenerator);

                // TODO: reset everything
                // FIXME: update editor (selected element changed)
                // UI.showAbbreviations(rawData.meta && rawData.meta.abbreviations);

                restructureByType(rootNodeView);
                NodeView.hideHiddenByDefault(rootNodeView);

                Executor.clearHistory();

                update();

            }


            function restructureByType(rootNodeView) {
                NodeView.getAllChildren(rootNodeView).forEach(function(stanceNodeView) {
                    NodeView.groupByType(stanceNodeView, nodeViewGenerator);
                });
            }


            function destroyExistingNodes() {
                _.forEachOwnProperty(visibleNodesSvgViews, function(key, value) {
                    value.destroy();
                });
                visibleNodesSvgViews = {};
            }


        // ==============


        // ==== UI ====

            function initUI() {

                _.hideDomElement(_.getDomElement('loading'));

                _.getDomElement('about').addEventListener('click', showWelcomePopup);
                domCache.popupWelcome.addEventListener('click', hideWelcomePopup);
                _.getDomElement('closeWelcomePopup').addEventListener('click', hideWelcomePopup);
                _.getDomElement('popupWelcome').addEventListener('click', onClickStopPropagation);
                _.getDomElement('loadExample').addEventListener('click', onLoadExampleClicked);

                if (localStorage && localStorage.hasOwnProperty('showWelcomePopupOnStart')) {
                    domCache.showWelcomePopupOnStart.checked = +localStorage.showWelcomePopupOnStart;
                }

                if (!domCache.showWelcomePopupOnStart.checked) hideWelcomePopup();

            }

            function onClickStopPropagation(event) {
                event.stopPropagation();
            }

            function onLoadExampleClicked(optEvent) {
                hideWelcomePopup();
                onButtonOpenUrl();
            }

            function showWelcomePopup(optEvent) {
                _.showDomElement(domCache.popupWelcome);
            }
            function hideWelcomePopup(optEvent) {
                localStorage.showWelcomePopupOnStart = +domCache.showWelcomePopupOnStart.checked;
                _.hideDomElement(domCache.popupWelcome);
                Editor.focus();
            }

            function bindUIActions() {
                initFieldSetToggleCollapse();
                initLoadSaveUIActions();
                initEditorUIActions();
                NodeSvgView.init(update);
                initFilter();
            }

            function initFieldSetToggleCollapse() {
                var fieldsets = document.querySelectorAll('#menu > fieldset');
                Array.prototype.forEach.call(fieldsets, function bindLegendClickAction(fieldset) {
                    var legend = fieldset.querySelector('legend');
                    legend.addEventListener('click', function onClickToggleCollapsed(event) {
                        fieldset.classList.toggle('collapsed');
                    });
                });
            }

            // ==== Save/load ====

                function initLoadSaveUIActions() {
                    _.getDomElement('save').addEventListener('click',  onButtonSave);
                    _.getDomElement('load').addEventListener('change', onFilesLoaded);
                    // domCache.download.addEventListener('click', onDownload);
                    _.getDomElement('openUrl').addEventListener('click', onButtonOpenUrl);
                }

                function onButtonSave(event) {
                    domCache.download.download = (
                        rootNodeData.character.toLowerCase() || 'someCharacter'
                    ) + '.json';
                    domCache.download.href = NodeSerializer.serializeToBase64Url(rootNodeData);
                    // FIXME: may not be compatible with browsers other than chrome
                    // A solution could be to use http://github.com/eligrey/FileSaver.js
                    domCache.download.dispatchEvent(new MouseEvent('click'));
                    // _.showDomElement(domCache.download);
                }

                function onFilesLoaded(event) {
                    var fileElement = this;
                    var file = fileElement.files[0];
                    NodeSerializer.deserializeFromLocalFile(file, onDataDeserialized);
                }

                // function onDownload(event) {
                //     _.hideDomElement(domCache.download);
                // }

                function onButtonOpenUrl(optEvent) {
                    var url = prompt('Enter URL:', GithubStuff.EXAMPLE_URLS.rig);
                    if (url) NodeSerializer.deserializeFromUrl(url, onDataDeserialized);
                }

                function onDataDeserialized(data) {
                    reset();
                    loadData(data);
                }

            // ===================

            // ==== Editor ====

                function initEditorUIActions() {
                    domCache.showPlaceholders.addEventListener('change', onChangeShowPlaceholders);
                    onChangeShowPlaceholders.call(domCache.showPlaceholders, null);
                }

                function onChangeShowPlaceholders(optEvent) {

                    // FIXME: this is used to make sure no invisible nodes are remaining selected
                    SelectionManager.deselectAll();

                    var checkbox = this;
                    if (checkbox.checked) {
                        Editor.addPlaceholders(rootNodeView);
                    } else {
                        Editor.removePlaceholders(rootNodeView);
                    }
                }

            // ================

            function initFilter() {

                Analyser.init();

                _.getDomElement('filter').addEventListener('click', onButtonFilter);
                _.getDomElement('filterFrame').addEventListener('click', onButtonFilterFrame);

                _.getDomElement('filterShowTracking').addEventListener('click',
                    function showTrackingMoves(optEvent) {
                        showOnlyNodesThatMatch(function(nodeView) {
                            var nodeData = NodeView.getNodeData(nodeView);
                            if (nodeData && NodeFactory.isMoveNode(nodeData)) {
                                var someTracking = nodeData.actionSteps.some(
                                    function(actionStep) { return actionStep.isTracking; }
                                );
                                if (someTracking) return true;
                            }
                            return false;
                        });
                    }
                );

                _.getDomElement('filterShowTrackingMidKicks').addEventListener('click',
                    function showTrackingMidKicks(optEvent) {
                        showOnlyNodesThatMatch(function(nodeView) {
                            return Filter.isTrackingMidKickNode(NodeView.getNodeData(nodeView));
                        });
                    }
                );

                _.getDomElement('filterShowHardKnockDowns').addEventListener('click',
                    function showTrackingMidKicks(optEvent) {
                        showOnlyNodesThatMatch(function(nodeView) {
                            return Filter.doesNodeCauseHardKnockDown(NodeView.getNodeData(nodeView));
                        });
                    }
                );

                _.getDomElement('filterShowGroundAttacks').addEventListener('click',
                    function showGroundAttacks(optEvent) {
                        showOnlyNodesThatMatch(function(nodeView) {
                            return Filter.isGroundAttackNode(NodeView.getNodeData(nodeView));
                        });
                    }
                );

                _.getDomElement('filterShowStance').addEventListener('click',
                    function showStance(optEvent) {
                        var stance = prompt('Enter stance name: (e.g. "BT")', 'BT');
                        if (!stance) return;
                        showOnlyNodesThatMatch(function(nodeView) {
                            var ending = NodeView.getEnding(nodeView);
                            return ending && ending.toLowerCase() === stance.toLowerCase();
                        });
                    }
                );

                _.getDomElement('filterShowAll').addEventListener('click',
                    function showAll(optEvent) {
                        TreeTools.forAllCurrentChildren(
                            rootNodeView, NodeView.getAllChildren, NodeView.showAllChildren
                        );
                        update();
                    }
                );

                _.getDomElement('filterShowDefault').addEventListener('click',
                    function showAll(optEvent) {
                        TreeTools.forAllCurrentChildren(
                            rootNodeView, NodeView.getAllChildren, NodeView.showAllChildren
                        );
                        NodeView.hideHiddenByDefault(rootNodeView);
                        update();
                    }
                );

            }

            function onButtonFilter(optEvent) {
                Analyser.findForceTechMoves(rootNodeData);
            }

            function onButtonFilterFrame(optEvent) {
                Analyser.findMoves(rootNodeData);
            }

        // ============


        // ==== Update ====

            function onDataChange(changes) {
                update();
                // _.hideDomElement(domCache.download);
            }


            function update() {

                console.trace('update');

                limitsFinder.invalidate();

                var idsVisibleBeforeUpdate = {};
                var idsSvgVisibleBeforeUpdate = {};

                TreeTools.forAllCurrentChildren(
                    rootNodeView,
                    NodeView.getAllChildren,
                    resetNodeViewAppearance
                );

                TreeTools.forAllCurrentChildren(
                    rootNodeView,
                    NodeView.getVisibleChildren,
                    function rememberCurrentlyVisibleNodes(nodeView) {
                        var id = NodeView.getId(nodeView);
                        idsVisibleBeforeUpdate[id] = true;
                        if (visibleNodesSvgViews.hasOwnProperty(id)) {
                            idsSvgVisibleBeforeUpdate[id] = true;
                        }
                    }
                );

                var childrenByDepth = TreeTools.getChildrenMergedByDepth(
                    rootNodeView, NodeView.getAllChildren
                );
                for (var i = childrenByDepth.length - 1; i > 0; --i) {
                    childrenByDepth[i].forEach(reversedDepthUpdateNodeViewIteration);
                }

                TreeTools.layoutTreeWithD3(
                    rootNodeView,
                    NodeView.getId,
                    NodeView.getVisibleChildren,
                    getNodeViewSize,
                    function(nodeView, x, y, parentX, parentY) {
                        updateNodeViewAndSetCoordinates(
                            nodeView, x, y, parentX, parentY, idsSvgVisibleBeforeUpdate
                        );
                    }
                );

                var nodeSvgViewsToHide = [];
                Object.keys(visibleNodesSvgViews).forEach(
                    function removeHidedSvgNodeViews(id) {
                        if (!idsVisibleBeforeUpdate.hasOwnProperty(id)) {
                            nodeSvgViewsToHide.push(visibleNodesSvgViews[id]);
                            delete visibleNodesSvgViews[id];
                        }
                    }
                );

                nodeSvgViewsToHide.forEach(function(nodeSvgView) {
                    var parentView = NodeView.getParentNodeView(nodeSvgView.nodeView);
                    while (parentView) {
                        var parentId = NodeView.getId(parentView);
                        if (visibleNodesSvgViews.hasOwnProperty(parentId)) {
                            var parentSvgView = visibleNodesSvgViews[parentId];
                            var position = parentSvgView.getPositionTarget();
                            nodeSvgView.destroy(position.x, position.y);
                            return;
                        }
                        parentView = NodeView.getParentNodeView(parentView);
                    }
                });

                // NodeView.fillScrollRange(rootNodeView);

                canvas.normalize(
                    0, -limitsFinder.y.min,
                    limitsFinder.x.max - limitsFinder.x.min,
                    limitsFinder.y.max - limitsFinder.y.min
                );

                var currentlySelectedNode = SelectionManager.getCurrentSelection();
                if (currentlySelectedNode) {
                    canvas.scrollToSvgNodeViewIfNeeded(
                        currentlySelectedNode,
                        limitsFinder.y.min,
                        PADDING
                    );
                }

            }


            function resetNodeViewAppearance(nodeView) {
                var appearance = nodeView.appearance
                appearance.totalChildren = 0;
                appearance.deepness      = 0;
                appearance.branchesAfter = 0;
            }

            function reversedDepthUpdateNodeViewIteration(nodeView, index, array) {
                var parentAppearance = NodeView.getParentNodeView(nodeView).appearance;
                parentAppearance.branchesAfter += Math.max(1, nodeView.appearance.branchesAfter);
                parentAppearance.totalChildren += 1 + NodeView.getAllChildren(nodeView).length;
                parentAppearance.deepness = Math.max(
                    parentAppearance.deepness,
                    nodeView.appearance.deepness + 1
                );
            }

            function getNodeViewSize(nodeView) {
                // var height = NODE_HEIGHT;
                // if (textGetters.top    != getEmptyText) height += 0.5 * NODE_HEIGHT;
                // if (textGetters.bottom != getEmptyText) height += 0.5 * NODE_HEIGHT;
                return {
                    width:  NODE_WIDTH,
                    height: NODE_HEIGHT
                };
            }

            function updateNodeViewAndSetCoordinates(
                nodeView, x, y, parentX, parentY, idsSvgVisibleBeforeUpdate
            ) {

                var id = NodeView.getId(nodeView);
                var nodeSvgView = visibleNodesSvgViews[id];

                if (!nodeSvgView) {

                    nodeSvgView = NodeSvgView.create(nodeView, NODE_HEIGHT / 3.0);
                    canvas.linksParent.appendChild(nodeSvgView.link);
                    canvas.nodesParent.appendChild(nodeSvgView.wrapper);
                    visibleNodesSvgViews[id] = nodeSvgView;

                    var parentView = NodeView.getParentNodeView(nodeSvgView.nodeView);
                    while (parentView) {
                        var parentId = NodeView.getId(parentView);
                        if (idsSvgVisibleBeforeUpdate.hasOwnProperty(parentId)) {
                            var parentSvgView = visibleNodesSvgViews[parentId];
                            var position = parentSvgView.getPositionStart();
                            nodeSvgView.animate(position.x, position.y, position.x, position.y, 0);
                            break;
                        }
                        parentView = NodeView.getParentNodeView(parentView);
                    }
                }

                nodeSvgView.updateByData();
                nodeSvgView.animate(x, y, parentX, parentY, 1);

                limitsFinder.expandToContain(x, y);
                // NodeView.resetScrollRange(nodeView);

            }

            function selectNodeView(nodeView) {
                SelectionManager.selectNode(visibleNodesSvgViews[NodeView.getId(nodeView)]);
            }

            function onClickNodeView(nodeSvgView) {
                SelectionManager.selectNode(nodeSvgView);
            }

            function onDoubleClickNodeView(nodeSvgView) {
                // Undo selection changes caused by two clicks
                Executor.undo(2);
                toggleChildren(nodeSvgView);
                SelectionManager.deselectHiddenNodes();
            }

            function toggleChildren(nodeSvgView) {
                if (_.isNonEmptyArray(NodeView.getAllChildren(nodeSvgView.nodeView))) {
                    Executor.rememberAndExecute('toggle children', act, act);
                    function act() {
                        // FIXME: this operation is not always symmetric due to filters
                        NodeView.toggleVisibleChildren(nodeSvgView.nodeView);
                        update();
                    }
                }
            }

        // ================


        function showOnlyNodesThatMatch(nodeViewMatchFunc) {

            var matchingNodeViews = [];
            TreeTools.forAllCurrentChildren(
                rootNodeView, NodeView.getAllChildren, function(nodeView) {
                    if (nodeViewMatchFunc(nodeView)) {
                        matchingNodeViews.push(nodeView);
                    }
                }
            );
            if (matchingNodeViews.length > 0) showOnlyNodes(matchingNodeViews);

        }


        function showOnlyNodes(nodeViewsToShow) {

            TreeTools.forAllCurrentChildren(
                rootNodeView, NodeView.getAllChildren, NodeView.hideAllChildren
            );

            var childrenByDepth = TreeTools.getChildrenMergedByDepth(
                rootNodeView, NodeView.getAllChildren
            );

            for (var i = childrenByDepth.length - 1; i > 0; --i) {
                var childrenAtDepth = childrenByDepth[i];
                for (var j = 0; j < childrenAtDepth.length; ++j) {
                    var nodeView = childrenAtDepth[j];
                    if (
                        NodeView.getVisibleChildren(nodeView).length > 0 ||
                        nodeViewsToShow.indexOf(nodeView) >= 0
                    ) {
                        NodeView.showChild(NodeView.getParentNodeView(nodeView), nodeView);
                    }
                }
            }

            update();

        }

    }

);