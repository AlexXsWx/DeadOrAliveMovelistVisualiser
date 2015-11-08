define(

    'movelist',

    [
        'd3', 'lineGenerators',
        'canvasManager',
        'node', 'limitsFinder',
        'selection', 'editor', 'ui',
        'treeTools', 'tools',
        'keyCodes'
    ],

    function(
        d3, lineGenerators,
        canvasManager,
        node, createLimitsFinder,
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

            var generators = {
                d3: {
                    tree: null,
                    line: null
                },
                node: null
            };

            var limitsFinder;

        // ===================


        return { init: init };


        // ==== Init ====

            function init(parentElement) {

                canvas = initCanvas(parentElement);
                selectionManager.init(canvas.svg.node());

                generators.node = node.createGenerator();
                dataRoot = createNewData();

                editor.init(generators.node);
                editor.onDataChanged.addListener(onEditorChange);

                selectionManager.onSelectionChanged.addListener(editor.updateBySelection);

                limitsFinder = createLimitsFinder();

                initGenerators();

                update();

                bindUIActions();

            }


            function loadRawData(rawData) {

                dataRoot = prepareData(
                    rawData.data,
                    rawData.meta.character
                    // rawData
                );

                // todo: reset everything

                ui.showAbbreviations(rawData.meta && rawData.meta.abbreviations);
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

                tree.children(node.getVisibleChildren);

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

                d3.select('#editMode').on('change', onChangeEditMode);

            }


            function onChangeEditMode() {
                this.checked ? editor.enterEditMode(dataRoot) : editor.leaveEditMode(dataRoot);
            }


            function onButtonSave() {

                var url = (
                    "data:application/json;charset=utf8;base64," +
                    window.btoa(JSON.stringify(node.toJson(dataRoot), null, '  '))
                );

                d3.select('#download')
                    .attr('download', dataRoot.fd3Data.input + '.json')
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
                    loadRawData(JSON.parse(this.result));
                }

            }

            function onDownload() {
                d3.select('#download').attr('hidden', true);
            }

        // ============


        // ==== Data operations ====

            function createNewData() {
                return generators.node.generateRoot('new character');
            }


            function prepareData(characterRawData, characterName) {

                var preparedData = generators.node.fromJson(characterRawData, characterName);
                restructureByType(preparedData);

                // var preparedData = generators.node.fromJson2(characterRawData, characterName);

                prepareTreeVisualisationData(preparedData);
                return preparedData;

            }


            function prepareTreeVisualisationData(data) {

                var childrenByDepth = treeTools.getChildrenMergedByDepth(
                    data,
                    node.getAllChildren
                );

                for (var i = childrenByDepth.length - 1; i > 0; --i) {
                    childrenByDepth[i].forEach(function(child) {
                        var childData = child.fd3Data;
                        var parentData = childData.parent.fd3Data;
                        var childrenAmount = node.getAllChildren(child).length;
                        parentData.branchesAfter += Math.max(1, childData.branchesAfter);
                        parentData.totalChildren += 1 + childrenAmount;
                        parentData.deepness = Math.max(
                            parentData.deepness,
                            childData.deepness + 1
                        );
                    });
                }

            }


            function restructureByType(data) {
                node.getAllChildren(data).forEach(function(stance) {
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

                node.getAllChildren(parent).forEach(function(child) {

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

                node.removeAllChildren(parent);

                for (type in byType) {

                    var childrenOfType = byType[type];
                    if (childrenOfType.length < 1) continue;

                    var groupingChild = generators.node.generateGroup('<' + type + '>');
                    node.setChildren(groupingChild, childrenOfType);
                    node.toggleVisibleChildren(groupingChild);

                    node.addVisibleChild(parent, groupingChild);

                }

            }

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
                    update(dataRoot);
                }

                d3.select('#download').attr('hidden', true);
            }


            function update(sourceNode) {
                
                var nodes = generators.d3.tree.nodes(dataRoot);
                var links = generators.d3.tree.links(nodes);

                limitsFinder.invalidate();
                
                nodes.forEach(function(datum) {
                    node.swapXY(datum); // turn 90deg CCW
                    limitsFinder.expandToContain(datum.x, datum.y);
                    // node.resetScrollRangeForDatum(datum);
                });

                // node.fillScrollRange(dataRoot);

                canvas.normalize(
                    PADDING,
                    PADDING - limitsFinder.y.min,
                    PADDING + (limitsFinder.x.max - limitsFinder.x.min) + PADDING,
                    PADDING + (limitsFinder.y.max - limitsFinder.y.min) + PADDING
                );

                var animationDuration = sourceNode ? 1000 : 0;

                var despawnPosition = sourceNode || nodes[0];
                var spawnPosition = {
                    x: _.defined(despawnPosition.fd3Data.lastPosition.x, despawnPosition.x),
                    y: _.defined(despawnPosition.fd3Data.lastPosition.y, despawnPosition.y)
                };

                updateLinks(links,           spawnPosition, despawnPosition, animationDuration);
                updateNodes(nodes, dataRoot, spawnPosition, despawnPosition, animationDuration);

                nodes.forEach(node.backupPosition);

            }

            // ==== Links ====

                function updateLinks(links, spawnPosition, despawnPosition, animationDuration) {

                    var linksSelection = canvas.canvas.select('g.links').selectAll('path.link')
                        .data(links, function(d) {
                            return node.getId(d.target);
                        });

                    updateLink(linksSelection, animationDuration);
                    enterLink(linksSelection.enter(), spawnPosition, animationDuration);
                    exitLink(linksSelection.exit(), despawnPosition, animationDuration);

                }


                function updateLink(selection, animationDuration) {
                    selection
                        .attr('opacity', 1)
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
                            // Simulating wires passing through node; using circle area formula
                            return 2 * Math.sqrt((obj.target.fd3Data.branchesAfter + 1) / Math.PI);
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
                    nodes, dataRoot,
                    spawnPosition, despawnPosition,
                    animationDuration
                ) {

                    var nodesSelection = canvas.canvas.select('g.nodes').selectAll('g.node')
                        .data(nodes, node.getId);

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

                    nodeSelection.select('text.input')
                        .attr('x', function(datum) {
                            return (shouldDisplayInputAtLeft(datum) ? -1 : 1) * 0.5 * NODE_HEIGHT;
                        })
                        .attr('text-anchor', function(datum) {
                            return shouldDisplayInputAtLeft(datum) ? 'end' : 'start';
                        });

                    nodeSelection.select('text.toggle').text(getToggleText);

                }


                function updateChangedNode(d3SvgNode) {

                    var datum = d3SvgNode.datum();

                    d3SvgNode.select('text.input')
                        .attr('x', function(datum) {
                            return (shouldDisplayInputAtLeft(datum) ? -1 : 1) * 0.5 * NODE_HEIGHT;
                        })
                        .attr('text-anchor', function(datum) {
                            return shouldDisplayInputAtLeft(datum) ? 'end' : 'start';
                        })
                        .text(datum.fd3Data.input || '<unnamed>');
                    d3SvgNode.select('text.toggle').text(getToggleText);
                    d3SvgNode.select('text.ending').text(getEndStanceText);

                    var moveInfo = datum.fd3Data.moveInfo;
                    d3SvgNode.classed({

                        'node': true,
                        'unclickable': false,
                        'container': node.getAllChildren(datum).length > 0,

                        'high': moveInfo.heightClass === 'high',
                        'mid':  moveInfo.heightClass === 'mid',
                        'low':  moveInfo.heightClass === 'low',

                        'strike':       moveInfo.actionType === 'strike',
                        'throw':        moveInfo.actionType === 'throw',
                        'hold':         moveInfo.actionType === 'hold',
                        'groundAttack': moveInfo.actionType === 'ground attack',
                        'other':        moveInfo.actionType === 'other',

                        'punch': moveInfo.strikeType === 'punch',
                        'kick':  moveInfo.strikeType === 'kick'

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
                                .on('click', function() {
                                    selectionManager.selectNode.call(this);
                                })
                                .on('dblclick', function(datum) {
                                    if (node.getAllChildren(datum).length > 0) {
                                        node.toggleVisibleChildren(datum);
                                        update(datum);
                                    }
                                    selectionManager.undoSelection();
                                });
                        });

                    nodeGroup.append('svg:circle').attr('r', NODE_HEIGHT / 3.0);


                    nodeGroup.append('svg:text')
                        .classed({ 'input': true })
                        .text(node.getInput)
                        .attr('x', function(datum) {
                            return (shouldDisplayInputAtLeft(datum) ? -1 : 1) * 0.5 * NODE_HEIGHT;
                        })
                        .attr('text-anchor', function(datum) {
                            return shouldDisplayInputAtLeft(datum) ? 'end' : 'start';
                        });

                    nodeGroup.append('svg:text')
                        .attr('class', 'toggle')
                        .attr('text-anchor', 'middle')
                        .text(getToggleText);

                    nodeGroup.append('svg:text')
                        .classed('ending', true)
                        .attr('text-anchor', 'start')
                        .attr('x', 0.5 * NODE_HEIGHT)
                        .text(getEndStanceText);
                }


                function exitNode(selExit, despawnPosition, animationDuration) {
                    selExit
                        .classed('unclickable', true)
                        .transition().duration(animationDuration)
                            .attr('transform', translate(despawnPosition))
                            .attr('opacity', 0)
                            .remove();
                }


                function shouldDisplayInputAtLeft(datum) {
                    return (
                        node.getAllChildren(datum).length > 0 ||
                        datum.fd3Data.moveInfo.endsWith
                    );
                }


                function translate(position) {
                    return 'translate(' + position.x + ',' + position.y + ')';
                }


                function getToggleText(datum) {

                    if (node.getAllChildren(datum).length === 0) return null;

                    var hasVisible = node.getVisibleChildren (datum).length > 0;
                    var hasHidden  = node.getHiddenChildren  (datum).length > 0;
                    if (hasVisible && !hasHidden)  return CHAR_HIDE;
                    if (hasHidden  && !hasVisible) return CHAR_EXPAND;

                    return CHAR_MIXED;

                }


                function getEndStanceText(datum) {
                    var result = datum.fd3Data.moveInfo.endsWith;
                    if (result) result = '[' + result + ']';
                    return result || '';
                }

            // ===============

        // ================

    }

);