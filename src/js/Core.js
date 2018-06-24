define(

    'Core',

    [
        'CanvasManager',
        'NodeFactory', 'NodeSerializer',
        'NodeView', 'NodeSvgView', 'LimitsFinder',
        'SelectionManager', 'Editor', 'UI', 'Analyser', 'Filter',
        'TreeTools', 'GithubStuff', 'Tools', 'Executor', 'Hotkeys', 'Strings', 'ActionType'
    ],

    function Core(
        CanvasManager,
        NodeFactory, NodeSerializer,
        NodeView, NodeSvgView, createLimitsFinder,
        SelectionManager, Editor, UI, Analyser, Filter,
        TreeTools, GithubStuff, _, Executor, Hotkeys, Strings, ActionType
    ) {

        // ==== Constants ====

            var PADDING = 50;

        // ===================


        // ==== Variables ====

            var canvas;
            var visibleNodesSvgViews = {};

            var nodeViewGenerator = null;

            var domCache = {
                download:                null,
                popupWelcome:            null,
                showWelcomePopupOnStart: null,
                showPlaceholders:        null
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

                ActionType.fillDatalist(_.getDomElement('actionStepSupportedTypes'));

                Editor.init(nodeViewGenerator, toggleChildren, selectNodeView);
                Editor.onDataChanged.addListener(onDataChange);

                SelectionManager.onSelectionChanged.addListener(selectionChangedListener);
                limitsFinder = createLimitsFinder();
                loadData(NodeFactory.createEmptyData());
                bindUIActions();
                Hotkeys.init(Executor, SelectionManager, Editor);
                initUI();
                selectNodeView(rootNodeView);

                parseParameters();

                if (!_.isDevBuild()) {
                    GithubStuff.checkIfHigherVersionIsAvailable();
                }

                return;

                function cacheDomElements() {
                    domCache.download                = _.getDomElement('download');
                    domCache.popupWelcome            = _.getDomElement('popupWelcomeOverlay');
                    domCache.showWelcomePopupOnStart = _.getDomElement('showWelcomePopupOnStart');
                    domCache.showPlaceholders        = _.getDomElement('showPlaceholders');
                }

                function selectionChangedListener(nodeSvgViews, focus) {
                    Editor.updateBySelection(nodeSvgViews, focus);
                    if (nodeSvgViews && nodeSvgViews.length > 0) {
                        canvas.scrollToSvgNodeViewIfNeeded(
                            nodeSvgViews[0], limitsFinder.y.min, PADDING
                        );
                    }
                }

                function parseParameters() {

                    var params = _.getParameters(['show', 'example']);

                    if (params.has('show')) {
                        var value = params.get('show').toLowerCase();
                        switch(value) {

                            case 'safety':
                                NodeSvgView.setRightTextToSafety();
                            break;

                            case 'hardknockdowns':
                                NodeSvgView.setRightTextToHardKnockdowns();
                            break;

                            default: _.report('Invalid "show" param value: "' + value + '"');
                        }
                    }

                    var url = null;
                    if (params.has('data-url')) {
                        url = decodeURI(params.get('data-url'));
                    }
                    if (!url && params.has('example')) {
                        url = GithubStuff.getExampleUrl(params.get('example', 'rig').toLowerCase());
                    }
                    
                    url && NodeSerializer.deserializeFromUrl(url, onDataDeserialized);

                }

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

                _.addClickListenerToElementWithId('about', showWelcomePopup);
                _.addClickListenerToElement(domCache.popupWelcome, hideWelcomePopup);
                _.addClickListenerToElementWithId('closeWelcomePopup', hideWelcomePopup);
                _.addClickListenerToElementWithId('popupWelcome', onClickStopPropagation);
                _.addClickListenerToElementWithId('loadExample', onLoadExampleClicked);

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
                    _.addClickListenerToElement(legend, function onClickToggleCollapsed(event) {
                        fieldset.classList.toggle('collapsed');
                    });
                });
            }

            // ==== Save/load ====

                function initLoadSaveUIActions() {
                    _.addClickListenerToElementWithId('save', onButtonSave);
                    _.getDomElement('load').addEventListener('change', onFilesLoaded);
                    // _.addClickListenerToElement(domCache.download, onDownload);
                    _.addClickListenerToElementWithId('openUrl', onButtonOpenUrl);
                }

                function onButtonSave(optEvent) {
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

                // function onDownload(optEvent) {
                //     _.hideDomElement(domCache.download);
                // }

                function onButtonOpenUrl(optEvent) {
                    var url = prompt(
                        Strings('enterUrl'),
                        GithubStuff.getExampleUrl('rig')
                    );
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

                function onChangeShowPlaceholders(event) {

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
                var nodeHeight = NodeSvgView.getNodeHeight();
                // var height = nodeHeight;
                // if (textGetters.top !== NodeSvgViewTextGetters.getEmptyText) {
                //     height += 0.5 * nodeHeight;
                // }
                // if (textGetters.bottom !== NodeSvgViewTextGetters.getEmptyText) {
                //     height += 0.5 * nodeHeight;
                // }
                return {
                    width:  NodeSvgView.getNodeWidth(),
                    height: nodeHeight
                };
            }

            function updateNodeViewAndSetCoordinates(
                nodeView, x, y, parentX, parentY, idsSvgVisibleBeforeUpdate
            ) {

                var id = NodeView.getId(nodeView);
                var nodeSvgView = visibleNodesSvgViews[id];

                if (!nodeSvgView) {

                    nodeSvgView = NodeSvgView.create(nodeView);
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

        // ==== Filter ====

            function initFilter() {

                Analyser.init();

                _.forEachOwnProperty(
                    getClickListenersByElementId(),
                    _.addClickListenerToElementWithId
                );

            }

            function getClickListenersByElementId() {

                return {

                    'filter': function onButtonFilter(event) {
                        Analyser.findForceTechMoves(rootNodeData);
                    },

                    'filterTime': function onButtonFilterTime(event) {
                        Analyser.findMovesToSpendTime(rootNodeData);
                    },

                    'filterFrame': function onButtonFilterFrame(event) {
                        Analyser.findMoves(rootNodeData);
                    },

                    'filterShowTracking': function showTrackingMoves(event) {
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
                    },

                    'filterShowTrackingMidKicks': function showTrackingMidKicks(event) {
                        showOnlyNodesThatMatch(function(nodeView) {
                            return Filter.isTrackingMidKickNode(NodeView.getNodeData(nodeView));
                        });
                    },

                    'filterShowHardKnockDowns': function showTrackingMidKicks(event) {
                        showOnlyNodesThatMatch(function(nodeView) {
                            return Filter.doesNodeCauseHardKnockDown(
                                NodeView.getNodeData(nodeView)
                            );
                        });
                    },

                    'filterShowGroundAttacks': function showGroundAttacks(event) {
                        showOnlyNodesThatMatch(function(nodeView) {
                            return Filter.isGroundAttackNode(NodeView.getNodeData(nodeView));
                        });
                    },

                    'filterShowStance': function showStance(event) {
                        var stance = prompt(
                            Strings('enterStanceToShow', { EXAMPLE_STANCE: 'BT' }),
                            'BT'
                        );
                        if (!stance) return;
                        showOnlyNodesThatMatch(function(nodeView) {
                            var ending = NodeView.getEnding(nodeView);
                            return ending && ending.toLowerCase() === stance.toLowerCase();
                        });
                    },

                    'filterShowAll': function showAll(event) {
                        TreeTools.forAllCurrentChildren(
                            rootNodeView, NodeView.getAllChildren, NodeView.showAllChildren
                        );
                        update();
                    },

                    'filterShowDefault': function showAll(event) {
                        TreeTools.forAllCurrentChildren(
                            rootNodeView, NodeView.getAllChildren, NodeView.showAllChildren
                        );
                        NodeView.hideHiddenByDefault(rootNodeView);
                        update();
                    }
                };

            }

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

        // ================

    }

);
