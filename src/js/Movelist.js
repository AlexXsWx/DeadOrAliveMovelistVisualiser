define(

    'Movelist', // TODO: rename to Core

    [
        'CanvasManager',
        'NodeFactory', 'NodeSerializer',
        'NodeView', 'NodeView2', 'LimitsFinder',
        'SelectionManager', 'Editor', 'UI',
        'TreeTools', 'Tools'
    ],

    function Movelist(
        CanvasManager,
        NodeFactory, NodeSerializer,
        NodeView, NodeView2, createLimitsFinder,
        SelectionManager, Editor, UI,
        TreeTools, _, JsonFileReader
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
            var nodeViews2 = {};

            var nodeViewGenerator = null;

            var domCache = { download: null };

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
                NodeView2.onNodeClick.addListener(onClickNodeView);
                NodeView2.onNodeToggleChildren.addListener(onDoubleClickNodeView);

                Editor.init(nodeViewGenerator);
                Editor.onDataChanged.addListener(onEditorChange);

                SelectionManager.onSelectionChanged.addListener(Editor.updateBySelection);

                limitsFinder = createLimitsFinder();

                updateTreeNodeSize();
                bindUIActions();

                loadData(NodeFactory.createRootNode());

            }


            function cacheDomElements() {
                domCache.download = _.getDomElement('download');
            }


            function loadData(data) {
                rootNodeData = data;
                rootNodeView = NodeView.createViewFromData(rootNodeData, nodeViewGenerator);
                // TODO: reset everything
                // FIXME: update editor (selected element changed)
                // UI.showAbbreviations(rawData.meta && rawData.meta.abbreviations);
                update();
            }


            function updateTreeNodeSize() {
                // var height = NODE_HEIGHT;
                // if (textGetters.top    != getEmptyText) height += 0.5 * NODE_HEIGHT;
                // if (textGetters.bottom != getEmptyText) height += 0.5 * NODE_HEIGHT;
            }

        // ==============


        // ==== UI ====

            function bindUIActions() {
                initLoadSaveUIActions();
                initEditorUIActions();
                initTextUIActions();
            }

            // ==== Save/load ====

                function initLoadSaveUIActions() {
                    _.getDomElement('save').addEventListener('click',  onButtonSave);
                    _.getDomElement('load').addEventListener('change', onFilesLoaded);
                    // domCache.download.addEventListener('click', onDownload);
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

            // ===================

            // ==== Editor ====

                function initEditorUIActions() {
                    _.getDomElement('showPlaceholders').addEventListener(
                        'change', onChangeShowPlaceholders
                    );
                }

                function onChangeShowPlaceholders(event) {
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
                    NodeView2.setTopTextOption(selectedOptionValue || 0);
                    updateTreeNodeSize();
                    update();
                });
                _.getDomElement('rightTextOption').addEventListener('change', function(event) {
                    var select = this;
                    var selectedOptionValue = +select.selectedOptions[0].value;
                    NodeView2.setRightTextOption(selectedOptionValue || 0);
                    update();
                });
                _.getDomElement('bottomTextOption').addEventListener('change', function(event) {
                    var select = this;
                    var selectedOptionValue = +select.selectedOptions[0].value;
                    NodeView2.setBottomTextOption(selectedOptionValue || 0);
                    updateTreeNodeSize();
                    update();
                });

                _.getDomElement('flipTextToRight').addEventListener('change', function(event) {
                    var checkbox = this;
                    NodeView2.setFlipTextToRight(checkbox.checked);
                    update();
                });

            }

        // ============


        // ==== Data operations ====

            // function restructureByType(data) {
            //     NodeView.getAllChildren(data).forEach(function(stance) {
            //         groupByType(stance);
            //     });
            // }


            // function groupByType(parent) {

            //     // fill groups

            //     var byType = {
            //         'punches': [],
            //         'kicks':   [],
            //         'throws':  [],
            //         'holds':   [],
            //         'other':   []
            //     };

            //     var categoryToType = {
            //         'punch': 'punches',
            //         'kick':  'kicks',
            //         'throw': 'throws',
            //         'hold':  'holds',
            //         'other': 'other'
            //     };

            //     NodeView.getAllChildren(parent).forEach(function(child) {

            //         var moveInfo = child.fd3Data.moveInfo;

            //         var category = moveInfo.actionType;
            //         if (category === 'strike') {
            //             category = moveInfo.strikeType;
            //         }

            //         if (category) {
            //             var type = categoryToType[category];
            //             if (type) {
            //                 byType[type].push(child);
            //             } else {
            //                 console.error('Could not find category for %O', child);
            //             }
            //         }

            //     });

            //     // assign new children

            //     NodeView.removeAllChildren(parent);

            //     for (type in byType) {

            //         var childrenOfType = byType[type];
            //         if (childrenOfType.length < 1) continue;

            //         var groupingChild = nodeViewGenerator.generateGroup('<' + type + '>');
            //         NodeView.setChildren(groupingChild, childrenOfType);
            //         NodeView.toggleVisibleChildren(groupingChild);

            //         NodeView.addVisibleChild(parent, groupingChild);

            //     }

            // }

        // =========================


        // ==== Update ====

            function onEditorChange(changes) {

                changes.changed && changes.changed.forEach(function(nodeView2) {
                    NodeView.updateAppearanceByBoundNode(nodeView2.nodeView);
                });

                update();
                // _.hideDomElement(domCache.download);

            }


            function update() {

                limitsFinder.invalidate();

                // restructureByType(rootNodeData);

                TreeTools.forAllCurrentChildren(
                    rootNodeView,
                    NodeView.getVisibleChildren,
                    updateNodeViewStep1
                );

                var childrenByDepth = TreeTools.getChildrenMergedByDepth(
                    rootNodeView, NodeView.getAllChildren
                );
                for (var i = childrenByDepth.length - 1; i > 0; --i) {
                    childrenByDepth[i].forEach(function(child) {
                        var childData = child.fd3Data;
                        var parentAppearance = childData.treeInfo.parent.fd3Data.appearance;
                        parentAppearance.branchesAfter += Math.max(1, childData.appearance.branchesAfter);
                        parentAppearance.totalChildren += 1 + NodeView.getAllChildren(child).length;
                        parentAppearance.deepness = Math.max(
                            parentAppearance.deepness,
                            childData.appearance.deepness + 1
                        );
                    });
                }

                TreeTools.layoutTree(
                    rootNodeView,
                    NodeView.getVisibleChildren,
                    getNodeViewSize,
                    updateNodeViewPosition,
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


            function updateNodeViewStep1(nodeView) {

                var nodeView2 = nodeViews2[nodeView.fd3Data.treeInfo.id];

                if (!nodeView2) {
                    nodeView2 = NodeView2.create(nodeView, NODE_HEIGHT / 3.0);
                    canvas.linksParent.appendChild(nodeView2.link);
                    canvas.nodesParent.appendChild(nodeView2.wrapper);
                    nodeViews2[nodeView.fd3Data.treeInfo.id] = nodeView2;
                }

                nodeView2.updateByData();

                var appearance = nodeView.fd3Data.appearance
                appearance.totalChildren = 0;
                appearance.deepness      = 0;
                appearance.branchesAfter = 0;

            }

            function getNodeViewSize(nodeView) {
                return {
                    width:  NODE_WIDTH,
                    height: NODE_HEIGHT
                };
            }

            function updateNodeViewPosition(nodeView, x, y) {
                nodeViews2[nodeView.fd3Data.treeInfo.id].setPosition(x, y);
                limitsFinder.expandToContain(x, y);
                // NodeView.resetScrollRangeForDatum(datum);
            }

            function positionNodeViewLink(nodeView, x, y, parentX, parentY) {
                nodeViews2[nodeView.fd3Data.treeInfo.id].updateLink(
                    x, y, parentX, parentY
                );
            }

            function linkThickness(link) {
                var targetNodeView = link.target;
                // Mimic wires passing through the node; using circle area formula
                var branchesAfter = targetNodeView.fd3Data.appearance.branchesAfter;
                return 2 * Math.sqrt((branchesAfter + 1) / Math.PI);
            }

            function onClickNodeView(nodeView2) {
                SelectionManager.selectNode(nodeView2);
            }

            function onDoubleClickNodeView(nodeView2) {
                toggleChildren(nodeView2);
                SelectionManager.undoSelection();
            }

            function toggleChildren(nodeView) {
                if (_.isNonEmptyArray(NodeView.getAllChildren(nodeView))) {
                    NodeView.toggleVisibleChildren(nodeView);
                    update();
                }
            }

        // ================


        // ==== Spawn/despawn ====

            // function getDespawnParent(nodeView) {
            //     var current = nodeView;
            //     var parent = nodeView.fd3Data.treeInfo.parent;
            //     while (
            //         parent &&
            //         parent.fd3Data.treeInfo.children.visible.indexOf(current) >= 0
            //     ) {
            //         current = parent;
            //         parent = current.fd3Data.treeInfo.parent;
            //     }
            //     return parent || current;
            // }


            // function getSpawnPosition(nodeView) {
            //     return getLastPosition(nodeView.fd3Data.treeInfo.parent || nodeView);
            // }


            // function getDespawnPosition(nodeView) {
            //     return getPosition(getDespawnParent(nodeView));
            // }


            // function getLastPosition(nodeView) {
            //     return {
            //         x: _.defined(nodeView.fd3Data.appearance.lastPosition.x, nodeView.x),
            //         y: _.defined(nodeView.fd3Data.appearance.lastPosition.y, nodeView.y)
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