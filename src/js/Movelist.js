define(

    'Movelist', // TODO: rename to Core

    [
        'CanvasManager',
        'NodeFactory', 'NodeSerializer',
        'NodeView', 'NodeSvgView', 'LimitsFinder',
        'SelectionManager', 'Editor', 'UI', 'Analyser',
        'Input/KeyCodes', 'TreeTools', 'Tools'
    ],

    function Movelist(
        CanvasManager,
        NodeFactory, NodeSerializer,
        NodeView, NodeSvgView, createLimitsFinder,
        SelectionManager, Editor, UI, Analyser,
        KeyCodes, TreeTools, _
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

                nodeViewGenerator = NodeView.createGenerators();
                NodeSvgView.onNodeClick.addListener(onClickNodeView);
                NodeSvgView.onNodeToggleChildren.addListener(onDoubleClickNodeView);

                Editor.init(nodeViewGenerator, toggleChildren, selectNodeView);
                Editor.onDataChanged.addListener(onDataChange);

                SelectionManager.onSelectionChanged.addListener(onSelectionChanged);
                limitsFinder = createLimitsFinder();
                loadData(createEmptyData(), false);
                bindUIActions();
                initUI();
                selectNodeView(rootNodeView);

            }


            function onSelectionChanged(nodeSvgViews, focus) {
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


            function createEmptyData() {
                return NodeFactory.createRootNode({
                    stances: [
                        NodeFactory.createStanceNode({
                            abbreviation: 'STD',
                            description: 'Standing'
                        })
                    ]
                }, true);
            }


            function loadData(data, resetShowPlaceholders) {

                if (resetShowPlaceholders) {
                    // don't dispatch
                    domCache.showPlaceholders.checked = false;
                }

                destroyExistingNodes();

                rootNodeData = data;
                rootNodeView = NodeView.createViewFromData(rootNodeData, nodeViewGenerator);

                // TODO: reset everything
                // FIXME: update editor (selected element changed)
                // UI.showAbbreviations(rawData.meta && rawData.meta.abbreviations);

                restructureByType(rootNodeView);

                update();

            }


            function restructureByType(rootNodeView) {
                NodeView.getAllChildren(rootNodeView).forEach(function(stanceNodeView) {
                    NodeView.groupByType(stanceNodeView, nodeViewGenerator);
                });
            }


            function destroyExistingNodes() {
                for (id in visibleNodesSvgViews) {
                    if (visibleNodesSvgViews.hasOwnProperty(id)) {
                        visibleNodesSvgViews[id].destroy();
                    }
                }
                visibleNodesSvgViews = {};
            }


        // ==============


        // ==== UI ====

            function initUI() {

                // Disable Ctrl+Z since it can modify hidden inputs and so break logic
                disableUndo();

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

            function disableUndo() {
                // FIXME: this doesn't disable RMB - undo
                window.addEventListener('keydown', function(event) {
                    if ((event.ctrlKey || event.metaKey) && event.keyCode === KeyCodes.Z) {
                        event.preventDefault();
                        alert('[Ctrl]+[Z] is disabled since it can break the program');
                    }
                });
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
                    domCache.download.download = (rootNodeData.character || 'someCharacter') + '.json';
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
                    var url = prompt(
                        'Enter URL:', (
                            'https://raw.githubusercontent.com/AlexXsWx/' +
                            'DeadOrAliveMovelistVisualiser/master/data/rig.6.json'
                        )
                    );
                    NodeSerializer.deserializeFromUrl(url, onDataDeserialized);
                }

                function onDataDeserialized(data) {
                    loadData(data, true);
                }

            // ===================

            // ==== Editor ====

                function initEditorUIActions() {
                    domCache.showPlaceholders.addEventListener('change', onChangeShowPlaceholders);
                    onChangeShowPlaceholders.call(domCache.showPlaceholders, null);
                }

                function onChangeShowPlaceholders(optEvent) {

                    SelectionManager.selectNode(null);

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
            }

            function onButtonFilter(optEvent) {
                Analyser.findForceTechMoves(rootNodeData);
            }

        // ============


        // ==== Update ====

            function onDataChange(changes) {
                update();
                // _.hideDomElement(domCache.download);
            }


            function update() {

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
                    var parentView = NodeView.getParentView(nodeSvgView.nodeView);
                    while (parentView) {
                        var parentId = NodeView.getId(parentView);
                        if (visibleNodesSvgViews.hasOwnProperty(parentId)) {
                            var parentSvgView = visibleNodesSvgViews[parentId];
                            var position = parentSvgView.getPositionTarget();
                            nodeSvgView.destroy(position.x, position.y);
                            return;
                        }
                        parentView = NodeView.getParentView(parentView);
                    }
                });

                // NodeView.fillScrollRange(rootNodeView);

                canvas.normalize(
                    0, -limitsFinder.y.min,
                    limitsFinder.x.max - limitsFinder.x.min,
                    limitsFinder.y.max - limitsFinder.y.min
                );

            }


            function resetNodeViewAppearance(nodeView) {
                var appearance = nodeView.appearance
                appearance.totalChildren = 0;
                appearance.deepness      = 0;
                appearance.branchesAfter = 0;
            }

            function reversedDepthUpdateNodeViewIteration(nodeView, index, array) {
                var parentAppearance = NodeView.getParentView(nodeView).appearance;
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

                    var parentView = NodeView.getParentView(nodeSvgView.nodeView);
                    while (parentView) {
                        var parentId = NodeView.getId(parentView);
                        if (idsSvgVisibleBeforeUpdate.hasOwnProperty(parentId)) {
                            var parentSvgView = visibleNodesSvgViews[parentId];
                            var position = parentSvgView.getPositionStart();
                            nodeSvgView.animate(position.x, position.y, position.x, position.y, 0);
                            break;
                        }
                        parentView = NodeView.getParentView(parentView);
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
                toggleChildren(nodeSvgView);
                SelectionManager.undoSelection();
            }

            function toggleChildren(nodeSvgView) {
                if (_.isNonEmptyArray(NodeView.getAllChildren(nodeSvgView.nodeView))) {
                    NodeView.toggleVisibleChildren(nodeSvgView.nodeView);
                    update();
                }
            }

        // ================

    }

);