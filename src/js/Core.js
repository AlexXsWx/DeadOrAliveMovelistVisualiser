define(

    'Core',

    [
        'CanvasManager', 'SelectionManager', 'Editor', 'Hotkeys', 'Input/KeyCodes',
        'Model/NodeFactory', 'Model/NodeSerializer', 'Model/ActionType',
        'View/NodeView', 'View/NodeSvgView',
        'Analysis/Analyser', 'Analysis/Filter',
        'Localization/Strings',
        'Tools/TreeTools', 'Tools/GithubStuff', 'Tools/Executor', 'Tools/LimitsFinder',
        'Tools/Tools'
    ],

    function Core(
        CanvasManager, SelectionManager, Editor, Hotkeys, KeyCodes,
        NodeFactory, NodeSerializer, ActionType,
        NodeView, NodeSvgView,
        Analyser, Filter,
        Strings,
        TreeTools, GithubStuff, Executor, createLimitsFinder,
        _
    ) {

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

        return { init: init };


        // ==== Init ====

            function init(parentElement) {

                cacheDomElements();

                canvas = CanvasManager.create(parentElement);
                SelectionManager.init(
                    parentElement,
                    function getVisibleNodesSvgView() { return visibleNodesSvgViews; },
                    toggleChildren
                );

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

                Hotkeys.create(handleFilteredKeyDown, true);

                initUI();

                selectNodeView(rootNodeView);

                parseParameters();

                if (!_.isDevBuild()) {
                    checkHigherVersion();
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
                        canvas.scrollToSvgNodeViewIfNeeded(nodeSvgViews[0], limitsFinder.y.min);
                    }
                }

                function parseParameters() {

                    var params = _.getParameters(['show', 'example']);

                    if (params.has('show')) {
                        var value = params.get('show').toLowerCase();
                        switch(value) {

                            case 'safety':
                                NodeSvgView.setRightTextToAdvantageOnBlock();
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

                function checkHigherVersion() {
                    GithubStuff.checkIfHigherVersionIsAvailable().then(function(higherVersionUrl) {
                        if (higherVersionUrl) {
                            var currentParams = window.location.search + window.location.hash;
                            _.getDomElement('newerVersionAvailableLink').setAttribute(
                                'href',
                                higherVersionUrl + currentParams
                            );
                            _.showDomElement(_.getDomElement('newerVersionAvailable'));
                        }
                    });
                }

            }


            function reset() {
                // don't dispatch
                domCache.showPlaceholders.checked = false;
                Editor.reset();
            }


            function loadData(data) {

                SelectionManager.deselectAll();
                Executor.clearHistory();
                destroyExistingNodes();

                rootNodeData = data;
                rootNodeView = NodeView.createViewFromData(rootNodeData, nodeViewGenerator);

                // TODO: reset everything
                // FIXME: update editor (selected element changed)

                // FIXME: get this value somehow
                var sc6 = true;
                if (sc6) {
                    NodeView.groupByTypeSC6(rootNodeView, nodeViewGenerator);
                } else {
                    NodeView.groupByType(rootNodeView, nodeViewGenerator);
                    NodeView.hideHiddenByDefault(rootNodeView);
                }

                update();

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

                if (localStorage.hasOwnProperty('showWelcomePopupOnStart')) {
                    domCache.showWelcomePopupOnStart.checked = JSON.parse(
                        localStorage.showWelcomePopupOnStart
                    );
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
                localStorage.showWelcomePopupOnStart = Boolean(domCache.showWelcomePopupOnStart.checked);
                _.hideDomElement(domCache.popupWelcome);
                Editor.focus();
            }

            function bindUIActions() {
                initFieldSetToggleCollapse();
                initLoadSaveUIActions();
                initEditorUIActions();

                NodeSvgView.init();
                NodeSvgView.onUpdate.addListener(update);

                initFilter();
            }

            function initFieldSetToggleCollapse() {
                var fieldsets = document.querySelectorAll('#menu > fieldset');
                Array.prototype.forEach.call(fieldsets, function bindLegendClickAction(fieldset) {
                    var legend = fieldset.querySelector('legend');
                    if (legend) {
                        _.addClickListenerToElement(legend, function onClickToggleCollapsed(event) {
                            fieldset.classList.toggle('collapsed');
                        });
                    }
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
                        rootNodeData.character
                            ? rootNodeData.character.toLowerCase()
                            : 'someCharacter'
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

                console.groupCollapsed('update');
                console.trace('update');
                console.groupEnd();

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
                    var parentNodeView = NodeView.getParentNodeView(nodeSvgView.nodeView);
                    while (parentNodeView) {
                        var parentId = NodeView.getId(parentNodeView);
                        if (visibleNodesSvgViews.hasOwnProperty(parentId)) {
                            var parentSvgView = visibleNodesSvgViews[parentId];
                            var position = parentSvgView.getPositionTarget();
                            nodeSvgView.destroy(position.x, position.y);
                            return;
                        }
                        parentNodeView = NodeView.getParentNodeView(parentNodeView);
                    }
                });

                // NodeView.fillScrollRange(rootNodeView);

                canvas.normalize(
                    0, -limitsFinder.y.min,
                    limitsFinder.x.max - limitsFinder.x.min,
                    limitsFinder.y.max - limitsFinder.y.min
                );

                var selectedNodes = SelectionManager.getCurrentSelection();
                if (selectedNodes.length > 0) {
                    canvas.scrollToSvgNodeViewIfNeeded(selectedNodes[0], limitsFinder.y.min);
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
                    canvas.addNode(nodeSvgView.link, nodeSvgView.wrapper);
                    visibleNodesSvgViews[id] = nodeSvgView;

                    var parentNodeView = NodeView.getParentNodeView(nodeSvgView.nodeView);
                    while (parentNodeView) {
                        var parentId = NodeView.getId(parentNodeView);
                        if (idsSvgVisibleBeforeUpdate.hasOwnProperty(parentId)) {
                            var parentSvgView = visibleNodesSvgViews[parentId];
                            var position = parentSvgView.getPositionStart();
                            nodeSvgView.animate(position.x, position.y, position.x, position.y, 0);
                            break;
                        }
                        parentNodeView = NodeView.getParentNodeView(parentNodeView);
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
                if (NodeView.hasAnyChildren(nodeSvgView.nodeView)) {
                    Executor.rememberAndExecute(
                        'toggle children',
                        function act() {
                            var ids = NodeView.toggleVisibleChildren(nodeSvgView.nodeView, true);
                            if (ids.length > 0) {
                                update();
                            }
                            return ids;
                        },
                        function unact(ids) {
                            var acted = NodeView.toggleChildrenWithIds(nodeSvgView.nodeView, ids);
                            if (acted) {
                                update();
                            }
                        }
                    );
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

                    'filterShowSC6SoulChargeMoves': function showSC6SoulChargeMoves(event) {
                        showOnlyNodesThatMatch(function(nodeView) {
                            return Filter.isSC6SoulChargeMove(NodeView.getNodeData(nodeView));
                        });
                    },

                    'filterShowSC6BreakAttacks': function showSC6BreakAttacks(event) {
                        showOnlyNodesThatMatch(function(nodeView) {
                            return Filter.isSC6BreakAttack(NodeView.getNodeData(nodeView));
                        });
                    },

                    'filterShowSC6UnblockableAttacks': function showSC6UnblockableAttacks(event) {
                        showOnlyNodesThatMatch(function(nodeView) {
                            return Filter.isSC6UnblockableAttack(NodeView.getNodeData(nodeView));
                        });
                    },

                    'filterShowSC6LethalHits': function showSC6LethalHits(event) {
                        showOnlyNodesThatMatch(function(nodeView) {
                            return Filter.isSC6LethalHit(NodeView.getNodeData(nodeView));
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
                    },

                    'sortByDefault': function sortByDefault(event) {
                        changeSorting(NodeView.SORTING_ORDER.DEFAULT);
                    },

                    'sortBySpeed': function sortBySpeed(event) {
                        changeSorting(NodeView.SORTING_ORDER.SPEED);
                    },

                    'sortByAdvantageOnBlock': function sortByAdvantageOnBlock(event) {
                        changeSorting(NodeView.SORTING_ORDER.ADVANTAGE_ON_BLOCK);
                    },

                    'sortByAdvantageOnNeutralHit': function sortByAdvantageOnNeutralHit(event) {
                        changeSorting(NodeView.SORTING_ORDER.ADVANTAGE_ON_NEUTRAL_HIT);
                    },

                    'sortByAdvantageOnCounterHit': function sortByAdvantageOnCounterHit(event) {
                        changeSorting(NodeView.SORTING_ORDER.ADVANTAGE_ON_COUNTER_HIT);
                    },

                    'groupByNone': function groupByNone(event) {
                        // FIXME: support undo
                        Executor.clearHistory();
                        NodeView.getAllChildren(rootNodeView).forEach(function(stanceNodeView) {
                            NodeView.ungroup(stanceNodeView);
                        });
                        update();
                    },

                    'groupByDOA': function groupByDOA(event) {
                        // FIXME: support undo
                        Executor.clearHistory();
                        NodeView.groupByType(rootNodeView, nodeViewGenerator);
                        update();
                    },

                    'groupBySC6': function groupBySC6(event) {
                        // FIXME: support undo
                        Executor.clearHistory();
                        NodeView.groupByTypeSC6(rootNodeView, nodeViewGenerator);
                        update();
                    }
                };

                return;

                function changeSorting(newSortingOrder) {
                    Executor.rememberAndExecute(
                        'Change sorting',
                        function() {
                            var undo = NodeView.setSortingOrder(newSortingOrder);
                            var acted = Boolean(undo);
                            if (acted) {
                                resortAll();
                                return undo;
                            }
                        },
                        function(undo) {
                            if (undo) {
                                undo();
                                // FIXME: this is not accurate
                                resortAll();
                            }
                        }
                    );
                    return;
                    function resortAll() {
                        TreeTools.forAllCurrentChildren(
                            rootNodeView,
                            NodeView.getAllChildren,
                            NodeView.sortVisibleChildren
                        );
                        update();
                    }
                }

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


        // ==== Hotkeys ====

            function handleFilteredKeyDown(event) {

                var inputtingText = Hotkeys.isInputSelected('text');

                var keyCode = event.keyCode;

                var selectedNodes = SelectionManager.getCurrentSelection();

                var dontPreventDefault = false;

                // Ctrl + Z
                if ((event.ctrlKey || event.metaKey) && keyCode === KeyCodes.Z) {
                    if (event.shiftKey) {
                        Executor.redo();
                    } else {
                        Executor.undo()
                    };
                    event.stopPropagation();
                } else

                // Esc
                if (keyCode === KeyCodes.ESC) {
                    SelectionManager.deselectAll();
                } else

                // Ctrl + Shift + Up / Down
                if (event.ctrlKey && event.shiftKey && keyCode === KeyCodes.UP) {
                    Editor.moveNodeBy(-1);
                } else
                if (event.ctrlKey && event.shiftKey && keyCode === KeyCodes.DOWN) {
                    Editor.moveNodeBy(1);
                } else

                // [Ctrl +] Left / Right / Up / Down
                if (keyCode === KeyCodes.RIGHT) {
                    SelectionManager.selectFirstChild();
                } else
                if (keyCode === KeyCodes.LEFT) {
                    SelectionManager.selectParent();
                } else
                if (keyCode === KeyCodes.UP) {
                    SelectionManager.selectPreviousSibling();
                } else
                if (keyCode === KeyCodes.DOWN) {
                    SelectionManager.selectNextSibling();
                } else

                // Spacebar
                if (
                    (!Hotkeys.isInputSelected() || event.ctrlKey) &&
                    keyCode === KeyCodes.SPACEBAR &&
                    selectedNodes.length > 0
                ) {
                    // FIXME: treat as 1 executor action
                    // FIXME: case when one selected node is child of another selected node
                    selectedNodes.forEach(function(nodeSvgView) {
                        toggleChildren(nodeSvgView);
                    });
                } else

                // Plus / Numplus
                if (
                    (!inputtingText || event.ctrlKey) && (
                        keyCode === KeyCodes.PLUS ||
                        keyCode === KeyCodes.NUM_PLUS
                    )
                ) {
                    Editor.onClickAddChild();
                } else

                if (event.ctrlKey && event.shiftKey && keyCode === KeyCodes.BACKSPACE) {
                    Editor.deleteNode();
                }

                // Default - do nothing
                else {
                    dontPreventDefault = true;
                }

                if (!dontPreventDefault) {
                    event.preventDefault();
                }
            }

        // =================

    }

);
