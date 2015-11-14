define(

    'movelist',

    [
        'd3', 'lineGenerators', // TODO: capitals
        'canvasManager',
        'node', 'nodeSerializer',
        'visualNode', 'limitsFinder',
        'selection', 'editor', 'ui',
        'treeTools', 'tools',
        'keyCodes'
    ],

    function(
        d3, lineGenerators,
        canvasManager,
        node, nodeSerializer,
        visualNode, createLimitsFinder,
        selectionManager, editor, ui,
        treeTools, _,
        keyCodes
    ) {

        // ==== Constants ====

            var PADDING = 50;
            var NODE_WIDTH  = 150;
            var NODE_HEIGHT = 25;

            var RESIZE_TIMEOUT = 500;

            var CHAR_EXPAND = '+';
            var CHAR_HIDE   = String.fromCharCode(0x2212); // minus sign
            var CHAR_MIXED  = String.fromCharCode(0x00D7); // cross sign

        // ===================


        // ==== Variables ====

            var canvas;

            var dataRoot;
            var wrappedDataRoot;

            var generators = {
                d3: {
                    tree: null,
                    line: null
                },
                visualNodes: null
            };

            var limitsFinder;

        // ===================


        return { init: init };


        // ==== Init ====

            function init(parentElement) {

                canvas = initCanvas(parentElement);
                selectionManager.init(canvas.svg.node());

                generators.visualNodes = visualNode.createGenerators();

                editor.init(generators.visualNodes);
                editor.onDataChanged.addListener(onEditorChange);

                selectionManager.onSelectionChanged.addListener(editor.updateBySelection);

                limitsFinder = createLimitsFinder();

                initGenerators();

                loadData(node.createRootNode({ character: 'character name' }));

                bindUIActions();

            }


            function loadData(data) {

                dataRoot = data;
                wrappedDataRoot = createWrappedData(dataRoot);

                // todo: reset everything

                // ui.showAbbreviations(rawData.meta && rawData.meta.abbreviations);
                update();

            }


            function initCanvas(rootNode) {
                var canvas = canvasManager.create(rootNode);
                canvas.canvas.append('svg:g').attr('class', 'links');
                canvas.canvas.append('svg:g').attr('class', 'nodes');
                return canvas;
            }


            function initGenerators() {

                var tree = d3.layout.tree();

                tree.nodeSize([ NODE_HEIGHT, NODE_WIDTH ]); // turn 90deg CCW

                tree.children(visualNode.getVisibleChildren);

                // tree.separation(function(a, b) {
                //     return 1;
                // });

                generators.d3.tree = tree;

                generators.d3.line = lineGenerators.createTurnedDiagonalLineGenerator();
                
            }

        // ==============


        // ==== UI ====

            function bindUIActions() {

                d3.select('#save').on('click',  onButtonSave);
                d3.select('#load').on('change', onButtonLoad);
                d3.select('#download').on('click', onDownload);

                d3.select('#showPlaceholders').on('change', onChangeShowPlaceholders);

            }


            function onChangeShowPlaceholders() {
                if (this.checked) {
                    editor.addPlaceholders(wrappedDataRoot);
                } else {
                    editor.removePlaceholders(wrappedDataRoot);
                }
            }


            function onButtonSave() {

                var exportedJsonObj = nodeSerializer.exportJson(
                    _.withoutFalsyProperties(dataRoot)
                );

                var url = (
                    "data:application/json;charset=utf8;base64," +
                    window.btoa(JSON.stringify(exportedJsonObj, null, '  '))
                );

                d3.select('#download')
                    .attr('download', (dataRoot.character || 'someCharacter') + '.json')
                    .attr('href', url)
                    .attr('hidden', null);
                    
            }


            function onButtonLoad() {

                var fileElement = this;
                var file = fileElement.files[0];

                var reader = new FileReader();
                reader.addEventListener('load', onFileLoaded);
                reader.readAsText(file);

                function onFileLoaded() {
                    var parsedJson;
                    try {
                        parsedJson = JSON.parse(this.result);
                    } catch (error) {
                        alert('Error: Invalid JSON\n%O', error);
                        return;
                    }
                    var importedDataRoot = nodeSerializer.importJson(parsedJson);
                    if (!importedDataRoot) {
                        alert('Failed to import json');
                        return;
                    }
                    var dataRoot = node.createRootNode(importedDataRoot, true);
                    loadData(dataRoot);
                }

            }

            function onDownload() {
                d3.select('#download').attr('hidden', true);
            }

        // ============


        // ==== Data operations ====

            function createWrappedData(dataRoot) {

                // restructureByType(dataRoot);

                var wrappedDataRoot = visualNode.createWrappedData(
                    dataRoot, generators.visualNodes
                );

                prepareTreeVisualisationData(wrappedDataRoot);
                return wrappedDataRoot;
            }


            function prepareTreeVisualisationData(wrappedDataRoot) {

                var childrenByDepth = treeTools.getChildrenMergedByDepth(
                    wrappedDataRoot,
                    visualNode.getAllChildren
                );

                for (var i = childrenByDepth.length - 1; i > 0; --i) {
                    childrenByDepth[i].forEach(function(child) {
                        var childData = child.fd3Data;
                        var parentAppearance = childData.treeInfo.parent.fd3Data.appearance;
                        var childrenAmount = visualNode.getAllChildren(child).length;
                        parentAppearance.branchesAfter += Math.max(1, childData.appearance.branchesAfter);
                        parentAppearance.totalChildren += 1 + childrenAmount;
                        parentAppearance.deepness = Math.max(
                            parentAppearance.deepness,
                            childData.appearance.deepness + 1
                        );
                    });
                }

            }


            /*

            function restructureByType(data) {
                visualNode.getAllChildren(data).forEach(function(stance) {
                    groupByType(stance);
                });
            }


            function groupByType(parent) {

                // fill groups

                var byType = {
                    'punches': [],
                    'kicks':   [],
                    'throws':  [],
                    'holds':   [],
                    'other':   []
                };

                var categoryToType = {
                    'punch': 'punches',
                    'kick':  'kicks',
                    'throw': 'throws',
                    'hold':  'holds',
                    'other': 'other'
                };

                visualNode.getAllChildren(parent).forEach(function(child) {

                    var moveInfo = child.fd3Data.moveInfo;

                    var category = moveInfo.actionType;
                    if (category === 'strike') {
                        category = moveInfo.strikeType;
                    }

                    if (category) {
                        var type = categoryToType[category];
                        if (type) {
                            byType[type].push(child);
                        } else {
                            console.error('Could not find category for %O', child);
                        }
                    }

                });

                // assign new children

                visualNode.removeAllChildren(parent);

                for (type in byType) {

                    var childrenOfType = byType[type];
                    if (childrenOfType.length < 1) continue;

                    var groupingChild = generators.visualNodes.generateGroup('<' + type + '>');
                    visualNode.setChildren(groupingChild, childrenOfType);
                    visualNode.toggleVisibleChildren(groupingChild);

                    visualNode.addVisibleChild(parent, groupingChild);

                }

            }

            */

        // =========================


        // ==== Update ====

            function onEditorChange(changes) {
                changes.changed && changes.changed.forEach(function(d3SvgNode) {
                    updateChangedNode(d3SvgNode);
                });
                if (
                    changes.deleted && changes.deleted.length > 0 ||
                    changes.moved   && changes.moved.length   > 0 ||
                    changes.added   && changes.added.length   > 0
                ) {
                    update(wrappedDataRoot);
                }

                d3.select('#download').attr('hidden', true);
            }


            function update(sourceNode) {
                
                var nodes = generators.d3.tree.nodes(wrappedDataRoot);
                var links = generators.d3.tree.links(nodes);

                limitsFinder.invalidate();
                
                nodes.forEach(function preprocessTreeNodes(datum) {
                    visualNode.swapXY(datum); // turn 90deg CCW
                    limitsFinder.expandToContain(datum.x, datum.y);
                    // visualNode.resetScrollRangeForDatum(datum);
                });

                // visualNode.fillScrollRange(wrappedDataRoot);

                canvas.normalize(
                    PADDING,
                    PADDING - limitsFinder.y.min,
                    PADDING + (limitsFinder.x.max - limitsFinder.x.min) + PADDING,
                    PADDING + (limitsFinder.y.max - limitsFinder.y.min) + PADDING
                );

                var animationDuration = sourceNode ? 1000 : 0;

                var despawnPosition = sourceNode || nodes[0];
                var spawnPosition = {
                    x: _.defined(despawnPosition.fd3Data.appearance.lastPosition.x, despawnPosition.x),
                    y: _.defined(despawnPosition.fd3Data.appearance.lastPosition.y, despawnPosition.y)
                };

                updateLinks(links, spawnPosition, despawnPosition, animationDuration);
                updateNodes(nodes, spawnPosition, despawnPosition, animationDuration);

                nodes.forEach(visualNode.backupPosition);

            }

            // ==== Links ====

                function updateLinks(links, spawnPosition, despawnPosition, animationDuration) {

                    var linksSelection = canvas.canvas.select('g.links').selectAll('path.link')
                        .data(links, function(datum) {
                            return visualNode.getId(datum.target);
                        });

                    updateLink(linksSelection, animationDuration);
                    enterLink(linksSelection.enter(), spawnPosition, animationDuration);
                    exitLink(linksSelection.exit(), despawnPosition, animationDuration);

                }


                function updateLink(selection, animationDuration) {
                    selection
                        .attr('opacity', 1) // reset animation if any
                        .transition().duration(animationDuration)
                            .attr('d', generators.d3.line);
                }


                function enterLink(selection, spawnPosition, animationDuration) {
                    var linksGroup = selection.append('svg:path')
                        .attr('class', 'link')
                        .attr('opacity', 0)
                        .attr('d', generators.d3.line({
                            source: spawnPosition,
                            target: spawnPosition
                        }))
                        .attr('stroke-width', function(obj) {
                            // Mimic wires passing through node; using circle area formula
                            return 2 * Math.sqrt(
                                (obj.target.fd3Data.appearance.branchesAfter + 1) / Math.PI
                            );
                        });

                    linksGroup.transition().duration(animationDuration)
                        .attr('d', generators.d3.line)
                        .attr('opacity', 1);
                }


                function exitLink(selection, despawnPosition, animationDuration) {
                    selection
                        .transition().duration(animationDuration)
                            .attr('d', generators.d3.line({
                                source: despawnPosition,
                                target: despawnPosition
                            }))
                            .attr('opacity', 0)
                            .remove();
                }

            // ===============


            // ==== Nodes ====

                function updateNodes(
                    nodes,
                    spawnPosition, despawnPosition,
                    animationDuration
                ) {

                    var nodesSelection = canvas.canvas.select('g.nodes').selectAll('g.node')
                        .data(nodes, visualNode.getId);

                    updateNotChangedNode(nodesSelection, animationDuration);
                    enterNode(nodesSelection.enter(), spawnPosition, animationDuration);
                    exitNode(nodesSelection.exit(), despawnPosition, animationDuration);

                }


                function updateNotChangedNode(nodeSelection, animationDuration) {

                    nodeSelection
                        .classed('unclickable', false)
                        .transition().duration(animationDuration)
                            .attr({
                                'transform': translate,
                                'opacity': 1
                            });

                    nodeSelection.select('text.toggle').text(getToggleText);

                }


                function updateChangedNode(d3SvgNode) {

                    var datum = d3SvgNode.datum();

                    d3SvgNode.select('text.input')
                        .attr('x', -0.5 * NODE_HEIGHT)
                        .attr('text-anchor', 'end')
                        .text(visualNode.getName(datum) || '<unnamed>');
                    d3SvgNode.select('text.toggle').text(getToggleText);
                    d3SvgNode.select('text.ending').text(visualNode.getEnding);

                    // var moveInfo = datum.fd3Data.moveInfo;
                    d3SvgNode.classed({

                        'node': true,
                        'unclickable': false,
                        'container': visualNode.getAllChildren(datum).length > 0

                        // 'high': moveInfo.heightClass === 'high',
                        // 'mid':  moveInfo.heightClass === 'mid',
                        // 'low':  moveInfo.heightClass === 'low',

                        // 'strike':       moveInfo.actionType === 'strike',
                        // 'throw':        moveInfo.actionType === 'throw',
                        // 'hold':         moveInfo.actionType === 'hold',
                        // 'groundAttack': moveInfo.actionType === 'ground attack',
                        // 'other':        moveInfo.actionType === 'other',

                        // 'punch': moveInfo.strikeType === 'punch',
                        // 'kick':  moveInfo.strikeType === 'kick'

                    });

                }


                function enterNode(selEnter, spawnPosition, animationDuration) {

                    var nodeGroup = selEnter.append('svg:g');

                    nodeGroup.transition().duration(animationDuration)
                        .attr({
                            'transform': translate,
                            'opacity': 1
                        });

                    nodeGroup

                        .attr({
                            'transform': translate(spawnPosition),
                            'opacity': 0
                        })

                        .each(function(datum) {
                            var treeNode = d3.select(this);
                            updateChangedNode(treeNode);
                            treeNode
                                .on('click', onClickNodeView)
                                .on('dblclick', onDoubleClickNodeView);
                        });

                    nodeGroup.append('svg:circle').attr('r', NODE_HEIGHT / 3.0);


                    nodeGroup.append('svg:text')
                        .classed('input', true)
                        .attr('x', -0.5 * NODE_HEIGHT)
                        .attr('text-anchor', 'end')
                        .text(function(nodeView) { return nodeView.fd3Data.appearance.textLeft; });

                    nodeGroup.append('svg:text')
                        .classed('toggle', true)
                        .attr('text-anchor', 'middle')
                        .text(getToggleText);

                    nodeGroup.append('svg:text')
                        .classed('ending', true)
                        .attr('text-anchor', 'start')
                        .attr('x', 0.5 * NODE_HEIGHT)
                        .text(function(nodeView) { return nodeView.fd3Data.appearance.textRight; });
                }


                function exitNode(selExit, despawnPosition, animationDuration) {
                    selExit
                        .classed('unclickable', true)
                        .transition().duration(animationDuration)
                            .attr('transform', translate(despawnPosition))
                            .attr('opacity', 0)
                            .remove();
                }


                function translate(position) {
                    return 'translate(' + position.x + ',' + position.y + ')';
                }


                function getToggleText(datum) {

                    if (visualNode.getAllChildren(datum).length === 0) return null;

                    var hasVisible = visualNode.hasVisibleChildren(datum);
                    var hasHidden  = visualNode.hasHiddenChildren(datum);
                    if (hasVisible && !hasHidden)  return CHAR_HIDE;
                    if (hasHidden  && !hasVisible) return CHAR_EXPAND;

                    return CHAR_MIXED;

                }

                function onClickNodeView() {
                    var nodeViewDomElement = this;
                    selectionManager.selectNode(nodeViewDomElement);
                }

                function onDoubleClickNodeView(datum) {
                    if (visualNode.getAllChildren(datum).length > 0) {
                        visualNode.toggleVisibleChildren(datum);
                        update(datum);
                    }
                    selectionManager.undoSelection();
                }

            // ===============

        // ================

    }

);