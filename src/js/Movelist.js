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

            var RESIZE_TIMEOUT = 500;
            var ANIMATION_DURATION = 1000

            var CHAR_EXPAND = '+';
            var CHAR_HIDE   = String.fromCharCode(0x2212); // minus sign
            var CHAR_MIXED  = String.fromCharCode(0x00D7); // cross sign

            var TEXT_GETTER_OPTIONS = [
                getEmptyText,
                getTextRight,
                getTextDuration,
                getEmptyText, // cooldown
                getEmptyText, // advantage
                getEmptyText, // stun depth
                getEmptyText  // unhold duration
            ];

        // ===================


        // ==== Variables ====

            var canvas;
            var nodeViews2 = {};

            var nodeViewGenerator = null;

            var domCache = {
                download: null,
                flipTextToRight: null
            };

            var limitsFinder;

            var rootNodeData;
            var rootNodeView;

            var textGetters = {
                top:    TEXT_GETTER_OPTIONS[0],
                right:  TEXT_GETTER_OPTIONS[1],
                bottom: TEXT_GETTER_OPTIONS[0]
            };

        // ===================


        return { init: init };


        // ==== Init ====

            function init(parentElement) {

                cacheDomElements();

                canvas = CanvasManager.create(parentElement, PADDING);
                SelectionManager.init(canvas.svg);

                nodeViewGenerator = NodeView.createGenerators();

                Editor.init(nodeViewGenerator);
                Editor.onDataChanged.addListener(onEditorChange);

                SelectionManager.onSelectionChanged.addListener(Editor.updateBySelection);

                limitsFinder = createLimitsFinder();

                updateTreeNodeSize();
                bindUIActions();

                loadData(NodeFactory.createRootNode());

            }


            function cacheDomElements() {
                domCache.download        = _.getDomElement('download');
                domCache.flipTextToRight = _.getDomElement('flipTextToRight');
            }


            function loadData(data) {
                rootNodeData = data;
                rootNodeView = NodeView.createViewFromData(rootNodeData, nodeViewGenerator);
                // TODO: reset everything
                // FIXME: update editor (selected element changed)
                // UI.showAbbreviations(rawData.meta && rawData.meta.abbreviations);
                update(false);
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
                    domCache.download.addEventListener('click', onDownload);
                }

                function onButtonSave(event) {
                    domCache.download.download = (rootNodeData.character || 'someCharacter') + '.json';
                    domCache.download.href = NodeSerializer.serializeToBase64Url(rootNodeData);
                    _.showDomElement(domCache.download);
                }

                function onFilesLoaded(event) {
                    var fileElement = this;
                    var file = fileElement.files[0];
                    NodeSerializer.deserializeFromLocalFile(file, loadData);
                }

                function onDownload(event) {
                    _.hideDomElement(domCache.download);
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
                    textGetters.top = TEXT_GETTER_OPTIONS[selectedOptionValue || 0];
                    updateTreeNodeSize();
                    update(true);
                });
                _.getDomElement('rightTextOption').addEventListener('change', function(event) {
                    var select = this;
                    var selectedOptionValue = +select.selectedOptions[0].value;
                    textGetters.right = TEXT_GETTER_OPTIONS[selectedOptionValue || 0];
                    update(true);
                });
                _.getDomElement('bottomTextOption').addEventListener('change', function(event) {
                    var select = this;
                    var selectedOptionValue = +select.selectedOptions[0].value;
                    textGetters.bottom = TEXT_GETTER_OPTIONS[selectedOptionValue || 0];
                    updateTreeNodeSize();
                    update(true);
                });

                domCache.flipTextToRight.addEventListener('change', function(event) {
                    update(false);
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

                changes.changed && changes.changed.forEach(function(d3SvgNode) {
                    NodeView.updateAppearanceByBoundNode(d3SvgNode.datum());
                });

                update(true);
                _.hideDomElement(domCache.download);

            }


            function update(animate, optSourceNode) {

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
                    nodeView2 = NodeView2.create(NODE_HEIGHT / 3.0);
                    canvas.linksParent.appendChild(nodeView2.link);
                    canvas.nodesParent.appendChild(nodeView2.wrapper);
                    nodeViews2[nodeView.fd3Data.treeInfo.id] = nodeView2;
                }

                nodeView2.setLeftText   ( getActualLeftText(nodeView)  );
                nodeView2.setCenterText ( getTextToggle(nodeView)      );
                nodeView2.setTopText    ( textGetters.top(nodeView)    );
                nodeView2.setRightText  ( getActualRightText(nodeView) );
                nodeView2.setBottomText ( textGetters.bottom(nodeView) );

                nodeView2.updateClassesByData(nodeView);

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

            function onClickNodeView() {
                var nodeViewDomElement = this;
                SelectionManager.selectNode(nodeViewDomElement);
            }

            function onDoubleClickNodeView(nodeView) {
                toggleChildren(nodeView);
                SelectionManager.undoSelection();
            }

            function toggleChildren(nodeView) {
                if (_.isNonEmptyArray(NodeView.getAllChildren(nodeView))) {
                    NodeView.toggleVisibleChildren(nodeView);
                    update(true, nodeView);
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


        // ==== Texts ====

            function getActualLeftText(nodeView) {
                var leftText = getTextLeft(nodeView);
                if (!domCache.flipTextToRight.checked) {
                    return leftText;
                }
                var rightText = textGetters.right(nodeView);
                return rightText ? leftText : '';
            }

            function getActualRightText(nodeView) {
                var rightText = textGetters.right(nodeView);
                if (!domCache.flipTextToRight.checked)
                {
                    return rightText;
                }
                return rightText || getTextLeft(nodeView);
            }

            function getEmptyText(nodeView) {
                return '';
            }

            function getTextLeft(nodeView) {
                return nodeView.fd3Data.appearance.textLeft;
            }

            function getTextRight(nodeView) {
                return nodeView.fd3Data.appearance.textEnding;
            }

            function getTextToggle(nodeView) {

                if (!_.isNonEmptyArray(NodeView.getAllChildren(nodeView))) return null;

                var hasVisible = NodeView.hasVisibleChildren(nodeView);
                var hasHidden  = NodeView.hasHiddenChildren(nodeView);
                if (hasVisible && !hasHidden)  return CHAR_HIDE;
                if (hasHidden  && !hasVisible) return CHAR_EXPAND;

                return CHAR_MIXED;

            }

            function getTextDuration(nodeView) {
                var frameData = nodeView.fd3Data.binding.targetDataNode.frameData;
                if (!frameData) return '';
                return 's=' + frameData[0] + ' d=' + frameData.reduce(function(acc, curr) {
                    return acc + curr;
                }, 0); // + ' // ' + frameData;
            }

        // ===============

    }

);