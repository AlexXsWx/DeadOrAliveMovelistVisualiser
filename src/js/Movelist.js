define(

    'Movelist', // TODO: rename to Core

    [
        'CanvasManager',
        'NodeFactory', 'NodeSerializer', 'Filter',
        'NodeView', 'NodeSvgView', 'LimitsFinder',
        'SelectionManager', 'Editor', 'UI',
        'TreeTools', 'Tools'
    ],

    function Movelist(
        CanvasManager,
        NodeFactory, NodeSerializer, Filter,
        NodeView, NodeSvgView, createLimitsFinder,
        SelectionManager, Editor, UI,
        TreeTools, _
    ) {

        // ==== Constants ====

            var PADDING = 50;
            var NODE_WIDTH  = 150;
            var NODE_HEIGHT = 25;

            // var RESIZE_TIMEOUT = 500;
            // var ANIMATION_DURATION = 1000

        // ===================


        // ==== Variables ====

            var canvas;
            var visibleNodesSvgViews = {};

            var nodeViewGenerator = null;

            var domCache = {
                download: null,
                popupWelcome: null,
                showWelcomePopupOnStart: null
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
                SelectionManager.init(canvas.svg);

                nodeViewGenerator = NodeView.createGenerators();
                NodeSvgView.onNodeClick.addListener(onClickNodeView);
                NodeSvgView.onNodeToggleChildren.addListener(onDoubleClickNodeView);

                Editor.init(nodeViewGenerator);
                Editor.onDataChanged.addListener(onDataChange);

                SelectionManager.onSelectionChanged.addListener(Editor.updateBySelection);
                SelectionManager.onSelectFirstChild.addListener(selectFirstChild);
                SelectionManager.onSelectSibling.addListener(selectSibling);
                SelectionManager.onSelectParent.addListener(selectParent);

                limitsFinder = createLimitsFinder();

                updateTreeNodeSize();
                bindUIActions();

                loadData(createEmptyData());

                initUI();

                SelectionManager.selectNode(visibleNodesSvgViews[NodeView.getId(rootNodeView)]);

            }


            function cacheDomElements() {
                domCache.download = _.getDomElement('download');
                domCache.popupWelcome = _.getDomElement('popupWelcomeOverlay');
                domCache.showWelcomePopupOnStart = _.getDomElement('showWelcomePopupOnStart');
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


            function loadData(data) {

                destroyExistingNodes();

                rootNodeData = data;
                rootNodeView = NodeView.createViewFromData(rootNodeData, nodeViewGenerator);

                // TODO: reset everything
                // FIXME: update editor (selected element changed)
                // UI.showAbbreviations(rawData.meta && rawData.meta.abbreviations);

                restructureByType(rootNodeView);

                update();

            }


            function destroyExistingNodes() {
                for (id in visibleNodesSvgViews) {
                    if (visibleNodesSvgViews.hasOwnProperty(id)) {
                        visibleNodesSvgViews[id].destroy();
                    }
                }
                visibleNodesSvgViews = {};
            }


            function updateTreeNodeSize() {
                // var height = NODE_HEIGHT;
                // if (textGetters.top    != getEmptyText) height += 0.5 * NODE_HEIGHT;
                // if (textGetters.bottom != getEmptyText) height += 0.5 * NODE_HEIGHT;
            }

        // ==============


        // ==== UI ====

            function initUI() {

                _.hideDomElement(_.getDomElement('loading'));

                _.getDomElement('about').addEventListener('click', showWelcomePopup);
                domCache.popupWelcome.addEventListener('click', hideWelcomePopup);
                _.getDomElement('closeWelcomePopup').addEventListener('click', hideWelcomePopup);
                _.getDomElement('popupWelcome').addEventListener('click', function(event) {
                    event.stopPropagation();
                });
                _.getDomElement('loadExample').addEventListener('click', function(event) {
                    hideWelcomePopup();
                    onButtonOpenUrl();
                });

                if (localStorage && localStorage.hasOwnProperty('showWelcomePopupOnStart')) {
                    domCache.showWelcomePopupOnStart.checked = +localStorage.showWelcomePopupOnStart;
                }

                if (!domCache.showWelcomePopupOnStart.checked) {
                    hideWelcomePopup();
                }

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
                initTextUIActions();
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
                    NodeSerializer.deserializeFromLocalFile(file, loadData);
                }

                // function onDownload(event) {
                //     _.hideDomElement(domCache.download);
                // }

                function onButtonOpenUrl(optEvent) {
                    var url = prompt(
                        'Enter URL:',
                        'https://raw.githubusercontent.com/AlexXsWx/DeadOrAliveMovelistVisualiser/splitting_data_and_view/data/rig.6.json'
                    );
                    NodeSerializer.deserializeFromUrl(url, loadData);
                }

            // ===================

            // ==== Editor ====

                function initEditorUIActions() {
                    _.getDomElement('showPlaceholders').addEventListener(
                        'change', onChangeShowPlaceholders
                    );
                }

                function onChangeShowPlaceholders(event) {

                    SelectionManager.selectNode(null);

                    var checkbox = this;
                    if (checkbox.checked) {
                        Editor.addPlaceholders(rootNodeView);
                    } else {
                        Editor.removePlaceholders(rootNodeView);
                    }
                }

            // ================

            function initTextUIActions() {

                _.getDomElement('topTextOption').addEventListener('change', function(event) {
                    var select = this;
                    var selectedOptionValue = +select.selectedOptions[0].value;
                    NodeSvgView.setTopTextOption(selectedOptionValue || 0);
                    updateTreeNodeSize();
                    update();
                });
                _.getDomElement('rightTextOption').addEventListener('change', function(event) {
                    var select = this;
                    var selectedOptionValue = +select.selectedOptions[0].value;
                    NodeSvgView.setRightTextOption(selectedOptionValue || 0);
                    update();
                });
                _.getDomElement('bottomTextOption').addEventListener('change', function(event) {
                    var select = this;
                    var selectedOptionValue = +select.selectedOptions[0].value;
                    NodeSvgView.setBottomTextOption(selectedOptionValue || 0);
                    updateTreeNodeSize();
                    update();
                });

                _.getDomElement('flipTextToRight').addEventListener('change', function(event) {
                    var checkbox = this;
                    NodeSvgView.setFlipTextToRight(checkbox.checked);
                    update();
                });

            }

            function initFilter() {
                _.getDomElement('filter').addEventListener('click', onButtonFilter);
                _.getDomElement('closeFilterResult').addEventListener('click', onButtonCloseFilterResult);
            }

            function onButtonFilter() {
                var advantage = +prompt('Your advantage (frames): e.g. "51"');
                if (advantage) {
                    var result = Filter.findNodes(rootNodeData, advantage, function(nodeData) {
                        var input = nodeData.input;
                        if (input.match(/(46|7|4|6|1)h/i) || input.match(/t/i)) {
                            return false;
                        }
                        for (var i = 0; i < nodeData.actionSteps.length; ++i) {
                            var actionMask = nodeData.actionSteps[i].actionMask;
                            if (
                                !actionMask ||
                                actionMask.search('high') >= 0
                            ) {
                                return false;
                            }
                        }
                        return true;
                    });
                    // alert(result);
                    _.setTextContent(_.getDomElement('filterOuptut'), advantage + 'f:\n' + result);
                    _.showDomElement(_.getDomElement('popupFilterResult'));
                }
            }

            function onButtonCloseFilterResult() {
                _.hideDomElement(_.getDomElement('popupFilterResult'));
            }

        // ============


        // ==== Data operations ====

            function restructureByType(rootNodeView) {
                NodeView.getAllChildren(rootNodeView).forEach(function(stanceNodeView) {
                    groupByType(stanceNodeView);
                });
            }


            function groupByType(parentNodeView) {

                var allChildrenNodeViews = NodeView.getAllChildren(parentNodeView);

                // fill groups

                var byType = {
                    'punches': [],
                    'kicks':   [],
                    'throws':  [],
                    'holds':   [],
                    'other':   []
                };

                for (var i = 0; i < allChildrenNodeViews.length; ++i) {

                    var childNodeView = allChildrenNodeViews[i];

                    // If it is a group already, kill it but keep its children
                    if (NodeView.isGroupingNodeView(childNodeView)) {
                        allChildrenNodeViews = allChildrenNodeViews.concat(
                            NodeView.getAllChildren(childNodeView)
                        );
                        NodeView.removeChild(parentNodeView, childNodeView);
                        continue;
                    }

                    var type;
                    var nodeData = childNodeView.binding.targetDataNode;
                    switch(true) {
                        case NodeFactory.isMovePunch(nodeData): type = 'punches'; break;
                        case NodeFactory.isMoveKick(nodeData):  type = 'kicks';   break;
                        case NodeFactory.isMoveThrow(nodeData): type = 'throws';  break;
                        case NodeFactory.isMoveHold(nodeData):  type = 'holds';   break;
                        default: type = 'other';
                    }

                    byType[type].push(childNodeView);
                    NodeView.removeChild(parentNodeView, childNodeView);

                }

                // assign new children

                // NodeView.removeAllChildren(parentNodeView);

                for (type in byType) {

                    var childrenOfType = byType[type];
                    if (childrenOfType.length < 1) continue;

                    var groupingChild = nodeViewGenerator.generateGroup();
                    groupingChild.binding.groupName = '<' + type + '>';
                    NodeView.setChildren(groupingChild, childrenOfType);
                    NodeView.toggleVisibleChildren(groupingChild);

                    NodeView.addVisibleChild(parentNodeView, groupingChild);

                }

            }

        // =========================


        // ==== Update ====

            function onDataChange(changes) {
                update();
                // _.hideDomElement(domCache.download);
            }


            function update() {

                limitsFinder.invalidate();

                var currentlyVisibleIds = {};

                TreeTools.forAllCurrentChildren(
                    rootNodeView,
                    NodeView.getAllChildren,
                    resetNodeViewAppearance
                );

                TreeTools.forAllCurrentChildren(
                    rootNodeView,
                    NodeView.getVisibleChildren,
                    function rememberCurrentlyVisibleNodes(nodeView) {
                        currentlyVisibleIds[NodeView.getId(nodeView)] = true;
                    }
                );

                Object.keys(visibleNodesSvgViews).forEach(function removeHidedSvgNodeViews(id) {
                    if (!currentlyVisibleIds.hasOwnProperty(id)) {
                        visibleNodesSvgViews[id].destroy();
                        delete visibleNodesSvgViews[id];
                    }
                });

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
                    updateNodeViewAndSetPosition,
                    positionNodeViewLink
                );

                // NodeView.fillScrollRange(rootNodeView);

                canvas.normalize(
                    0, -limitsFinder.y.min,
                    limitsFinder.x.max - limitsFinder.x.min,
                    limitsFinder.y.max - limitsFinder.y.min
                );

                // nodes.forEach(NodeView.backupPosition);

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
                return {
                    width:  NODE_WIDTH,
                    height: NODE_HEIGHT
                };
            }

            function updateNodeViewAndSetPosition(nodeView, x, y) {

                var id = NodeView.getId(nodeView);
                var nodeSvgView = visibleNodesSvgViews[id];

                if (!nodeSvgView) {
                    nodeSvgView = NodeSvgView.create(nodeView, NODE_HEIGHT / 3.0);
                    canvas.linksParent.appendChild(nodeSvgView.link);
                    canvas.nodesParent.appendChild(nodeSvgView.wrapper);
                    visibleNodesSvgViews[id] = nodeSvgView;
                }

                nodeSvgView.updateByData();
                nodeSvgView.setPosition(x, y);

                limitsFinder.expandToContain(x, y);
                // NodeView.resetScrollRange(nodeView);
                
            }

            function positionNodeViewLink(nodeView, x, y, parentX, parentY) {
                var id = NodeView.getId(nodeView);
                var nodeSvgView = visibleNodesSvgViews[id];
                nodeSvgView.updateLink(x, y, parentX, parentY);
            }

            function onClickNodeView(nodeSvgView) {
                SelectionManager.selectNode(nodeSvgView);
            }

            function onDoubleClickNodeView(nodeSvgView) {
                toggleChildren(nodeSvgView);
                // SelectionManager.undoSelection();
            }

            function toggleChildren(nodeSvgView) {
                if (_.isNonEmptyArray(NodeView.getAllChildren(nodeSvgView.nodeView))) {
                    NodeView.toggleVisibleChildren(nodeSvgView.nodeView);
                    update();
                }
            }

        // ================


        // ==== Selection ====

            function selectFirstChild(nodeSvgView) {
                var nodeView = nodeSvgView.nodeView;
                var children = NodeView.getVisibleChildren(nodeView);
                if (children && children.length > 0) {
                    var firstChild = children[0];
                    var childId = NodeView.getId(firstChild);
                    if (visibleNodesSvgViews.hasOwnProperty(childId)) {
                        SelectionManager.selectNode(visibleNodesSvgViews[childId]);
                    }
                }
            }

            function selectSibling(nodeSvgView, delta) {
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
                        SelectionManager.selectNode(visibleNodesSvgViews[childId]);
                    }
                }
            }
            
            function selectParent(nodeSvgView) {
                var nodeView = nodeSvgView.nodeView;
                var parent = NodeView.getParentView(nodeView);
                if (!parent) return;
                var parentId = NodeView.getId(parent);
                if (visibleNodesSvgViews.hasOwnProperty(parentId)) {
                    SelectionManager.selectNode(visibleNodesSvgViews[parentId]);
                }
            }

        // ===================


        // ==== Spawn/despawn ====

            // function getDespawnParent(nodeView) {
            //     var current = nodeView;
            //     var parent = NodeView.getParentView(nodeView);
            //     while (
            //         parent &&
            //         NodeView.getVisibleChildren(parent).indexOf(current) >= 0
            //     ) {
            //         current = parent;
            //         parent = NodeView.getParentView(current);
            //     }
            //     return parent || current;
            // }


            // function getSpawnPosition(nodeView) {
            //     return getLastPosition(NodeView.getParentView(nodeView) || nodeView);
            // }


            // function getDespawnPosition(nodeView) {
            //     return getPosition(getDespawnParent(nodeView));
            // }


            // function getLastPosition(nodeView) {
            //     return {
            //         x: _.defined(nodeView.appearance.lastPosition.x, nodeView.x),
            //         y: _.defined(nodeView.appearance.lastPosition.y, nodeView.y)
            //     };
            // }

            // function getPosition(nodeView) {
            //     return {
            //         x: nodeView.x,
            //         y: nodeView.y
            //     };
            // }

        // =======================

    }

);