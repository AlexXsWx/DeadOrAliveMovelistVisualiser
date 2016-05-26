define(

    'Movelist', // TODO: rename to Core

    [
        'CanvasManager',
        'NodeFactory', 'NodeSerializer',
        'NodeView', 'NodeSvgView', 'LimitsFinder',
        'SelectionManager', 'Editor', 'UI',
        'TreeTools', 'Tools'
    ],

    function Movelist(
        CanvasManager,
        NodeFactory, NodeSerializer,
        NodeView, NodeSvgView, createLimitsFinder,
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
            var visibleNodesSvgViews = {};

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

                loadData(NodeFactory.createRootNode());

                window.findNodes = findNodes;

            }


            // FIXME: move somewhere
            function findNodes(advantage, optPath) {
                var path = optPath || [rootNodeData];
                var result = [];
                NodeFactory.getChildren(path[path.length - 1]).forEach(function(child) {
                    var freeCancelAdvantage = -1;
                    var followUpAdvantage = advantage;
                    var fullPath = path.concat(child);
                    var keepLooking = true;
                    if (NodeFactory.isMoveNode(child)) {
                        var frameData = child.frameData;
                        if (frameData && frameData.length > 0) {
                            var frames = 1;
                            for (var i = 0; i < frameData.length - 1; i += 2) {
                                frames += frameData[i];
                                var activeFrames = frameData[i + 1];
                                if (frames < advantage && advantage <= frames + activeFrames) {
                                    if (!child.input.match(/(46|7|4|6|1)h/i)) {
                                        result.push(fullPath);
                                    }
                                    keepLooking = false;
                                }
                                frames += activeFrames;
                            }
                            followUpAdvantage = advantage - frames;
                            freeCancelAdvantage = followUpAdvantage - frameData[frameData.length - 1];
                        } else {
                            keepLooking = false;
                        }
                    }
                    if (keepLooking) {
                        if (followUpAdvantage > 0) {
                            result = result.concat(findNodes(followUpAdvantage, fullPath));
                        }
                        if (freeCancelAdvantage > 0) {
                            result = result.concat(findNodes(freeCancelAdvantage, fullPath.concat(rootNodeData)));
                        }
                    }
                });
                return result.map(function(path) {
                    if (typeof path === 'string') return path;
                    return path.reduce(function(acc, e) {
                        if (NodeFactory.isRootNode(e)) {
                            return acc;
                        }
                        if (NodeFactory.isStanceNode(e)) {
                            return acc + ' [' + e.abbreviation + ']';
                        }
                        if (NodeFactory.isMoveNode(e)) {
                            var input = e.input;
                            var context = e.context.join(',');
                            if (context) return acc + ' ' + context + ':' + input;
                            return acc + ' ' + input;
                        }
                    }, '');
                });
            }


            function cacheDomElements() {
                domCache.download = _.getDomElement('download');
            }


            function loadData(data) {

                destroyExistingNodes();

                rootNodeData = data;
                rootNodeView = NodeView.createViewFromData(rootNodeData, nodeViewGenerator);
                // TODO: reset everything
                // FIXME: update editor (selected element changed)
                // UI.showAbbreviations(rawData.meta && rawData.meta.abbreviations);
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

                function onButtonOpenUrl(event) {
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

            //         var moveInfo = child.moveInfo;

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

            function onDataChange(changes) {

                changes.changed && changes.changed.forEach(function(nodeSvgView) {
                    NodeView.updateAppearanceByBoundNode(nodeSvgView.nodeView);
                });

                update();
                // _.hideDomElement(domCache.download);

            }


            function update() {

                limitsFinder.invalidate();

                // restructureByType(rootNodeData);

                var currentlyVisibleIds = {};

                TreeTools.forAllCurrentChildren(
                    rootNodeView,
                    NodeView.getVisibleChildren,
                    function(nodeView) {
                        updateNodeViewStep1(nodeView);
                        currentlyVisibleIds[NodeView.getId(nodeView)] = true;
                    }
                );

                Object.keys(visibleNodesSvgViews).forEach(function(id) {
                    if (!currentlyVisibleIds.hasOwnProperty(id)) {
                        visibleNodesSvgViews[id].destroy();
                        delete visibleNodesSvgViews[id];
                    }
                });

                var childrenByDepth = TreeTools.getChildrenMergedByDepth(
                    rootNodeView, NodeView.getAllChildren
                );
                for (var i = childrenByDepth.length - 1; i > 0; --i) {
                    childrenByDepth[i].forEach(function(child) {
                        var parentAppearance = child.treeInfo.parent.appearance;
                        parentAppearance.branchesAfter += Math.max(1, child.appearance.branchesAfter);
                        parentAppearance.totalChildren += 1 + NodeView.getAllChildren(child).length;
                        parentAppearance.deepness = Math.max(
                            parentAppearance.deepness,
                            child.appearance.deepness + 1
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

                var id = NodeView.getId(nodeView);

                var nodeSvgView = visibleNodesSvgViews[id];

                if (!nodeSvgView) {
                    nodeSvgView = NodeSvgView.create(nodeView, NODE_HEIGHT / 3.0);
                    canvas.linksParent.appendChild(nodeSvgView.link);
                    canvas.nodesParent.appendChild(nodeSvgView.wrapper);
                    visibleNodesSvgViews[id] = nodeSvgView;
                }

                nodeSvgView.updateByData();

                var appearance = nodeView.appearance
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
                visibleNodesSvgViews[NodeView.getId(nodeView)].setPosition(x, y);
                limitsFinder.expandToContain(x, y);
                // NodeView.resetScrollRange(nodeView);
            }

            function positionNodeViewLink(nodeView, x, y, parentX, parentY) {
                visibleNodesSvgViews[NodeView.getId(nodeView)].updateLink(
                    x, y, parentX, parentY
                );
            }

            function linkThickness(link) {
                var targetNodeView = link.target;
                // Mimic wires passing through the node; using circle area formula
                var branchesAfter = targetNodeView.appearance.branchesAfter;
                return 2 * Math.sqrt((branchesAfter + 1) / Math.PI);
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
                var parent = nodeView.treeInfo.parent;
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
                var parent = nodeView.treeInfo.parent;
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
            //     var parent = nodeView.treeInfo.parent;
            //     while (
            //         parent &&
            //         NodeView.getVisibleChildren(parent).indexOf(current) >= 0
            //     ) {
            //         current = parent;
            //         parent = current.treeInfo.parent;
            //     }
            //     return parent || current;
            // }


            // function getSpawnPosition(nodeView) {
            //     return getLastPosition(nodeView.treeInfo.parent || nodeView);
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