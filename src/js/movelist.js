define(

    'movelist',

    [ 'd3', 'canvasManager', 'node', 'limitsFinder', 'lineGenerators', 'treeTools', 'tools' ],

    function() {

        // ==== Import ====

            var d3                  = requirejs('d3');
            var canvasManager       = requirejs('canvasManager');
            var createNodeGenerator = requirejs('node');
            var createLimitsFinder  = requirejs('limitsFinder');
            var lineGenerators      = requirejs('lineGenerators');
            var treeTools           = requirejs('treeTools');
            var _                   = requirejs('tools');

        // ================


        // ==== Constants ====

            var PADDING = 50;
            var NODE_WIDTH  = 150;
            var NODE_HEIGHT = 25;

            var RESIZE_TIMEOUT = 500;

            var CHAR_EXPAND = '+';
            var CHAR_HIDE   = String.fromCharCode(0x2212); // minus sign
            var CHAR_MIXED  = String.fromCharCode(0x00D7); // cross sign

            var KEY_CODES = {
                ENTER: 13,
                ESC:   27,
                RIGHT: 39,
                LEFT:  38,
                UP:    38,
                DOWN:  40
            };

        // ===================


        // ==== Variables ====

            var canvas;

            var tree;
            var lineGenerator;

            var limitsFinder;

            var nodeGenerator;

            var previousSelection = null;
            var selectedNode = null;
            var editMode = false;

            var data;

        // ===================


        return init;


        // ==== Init ====

            function init(parentElement, rawData) {

                canvas = initCanvas(parentElement);

                initEditor();
                initSelection(canvas.svg.node());

                limitsFinder = createLimitsFinder();

                nodeGenerator = createNodeGenerator();

                data = prepareData(
                    rawData.data,
                    rawData.meta.character
                );

                // data = createNewData(nodeGenerator);

                initGenerators();

                update();

                rawData.meta && showAbbreviations(rawData.meta.abbreviations);

            }


            function initCanvas(rootNode) {
                var canvas = canvasManager.create(rootNode);
                canvas.canvas.append('svg:g').attr('class', 'links');
                canvas.canvas.append('svg:g').attr('class', 'nodes');
                return canvas;
            }


            function initGenerators() {

                tree = d3.layout.tree();

                tree.nodeSize([ NODE_HEIGHT, NODE_WIDTH ]); // turn 90deg CCW

                tree.children(nodeGenerator.getVisibleChildren);

                // tree.separation(function(a, b) {
                //     return 1;
                // });

                lineGenerator = lineGenerators.createTurnedDiagonalLineGenerator();
                
            }

        // ==============


        // ==== Data operations ====

            function createNewData(nodeGenerator) {
                return nodeGenerator.generate('root', null);
            }


            function prepareData(characterRawData, characterName) {

                var preparedData = nodeGenerator.fromJson(characterRawData, characterName);

                preparedData.fd3Data.children.all.forEach(function(stance) {
                    groupByType(stance, nodeGenerator.generate);
                });

                var childrenByDepth = treeTools.getChildrenMergedByDepth(
                    preparedData,
                    nodeGenerator.getAllChildren
                );
                for (var i = childrenByDepth.length - 1; i > 0; --i) {
                    childrenByDepth[i].forEach(function(child) {
                        var childData = child.fd3Data;
                        var parentData = childData.parent.fd3Data;
                        var childrenAmount = childData.children.all.length;
                        parentData.branchesAfter += Math.max(1, childData.branchesAfter);
                        parentData.totalChildren += 1 + childrenAmount;
                        parentData.deepness = Math.max(
                            parentData.deepness,
                            childData.deepness + 1
                        );
                    });
                }

                return preparedData;
            }


            function groupByType(parent, generateNode) {

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

                parent.fd3Data.children.all.forEach(function(child) {

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

                parent.fd3Data.children.all     = [];
                parent.fd3Data.children.visible = [];
                parent.fd3Data.children.hidden  = [];

                for (type in byType) {

                    var childrenOfType = byType[type];
                    if (childrenOfType.length < 1) continue;

                    var groupingChild = generateNode('<' + type + '>', parent);
                    var groupingChildChildren = groupingChild.fd3Data.children;
                    groupingChildChildren.all = childrenOfType;
                    groupingChildChildren.hidden = groupingChildChildren.all.slice(0);

                    childrenOfType.forEach(function(child) {
                        child.fd3Data.parent = groupingChild;
                    });

                    parent.fd3Data.children.all.push(groupingChild);
                    parent.fd3Data.children.visible.push(groupingChild);

                }

            }

        // =========================


        // ==== Update ====

            function update(sourceNode) {
                
                var nodes = tree.nodes(data);
                var links = tree.links(nodes);

                limitsFinder.reset();

                nodes.forEach(function(datum) {
                    nodeGenerator.swapXY(datum); // turn 90deg CCW
                    limitsFinder.considerDatum(datum);
                    // nodeGenerator.resetScrollRangeForDatum(datum);
                });

                // nodeGenerator.fillScrollRange(data);

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

                updateLinks(links,       spawnPosition, despawnPosition, animationDuration);
                updateNodes(nodes, data, spawnPosition, despawnPosition, animationDuration);

                nodes.forEach(nodeGenerator.backupPosition);

            }

            // ==== Links ====

                function updateLinks(links, spawnPosition, despawnPosition, animationDuration) {

                    var linksSelection = canvas.canvas.select('g.links').selectAll('path.link')
                        .data(links, function(d) {
                            return nodeGenerator.getId(d.target);
                        });

                    updateLink(linksSelection, animationDuration);
                    enterLink(linksSelection.enter(), spawnPosition, animationDuration);
                    exitLink(linksSelection.exit(), despawnPosition, animationDuration);

                }


                function updateLink(selection, animationDuration) {
                    selection
                        .attr('opacity', 1)
                        .transition().duration(animationDuration)
                            .attr('d', lineGenerator);
                }


                function enterLink(selection, spawnPosition, animationDuration) {
                    var linksGroup = selection.append('svg:path')
                        .attr('class', 'link')
                        .attr('opacity', 0)
                        .attr('d', lineGenerator({
                            source: spawnPosition,
                            target: spawnPosition
                        }))
                        .attr('stroke-width', function(obj) {
                            // Simulating wires passing through node; using circle area formula
                            return 2 * Math.sqrt((obj.target.fd3Data.branchesAfter + 1) / Math.PI);
                        });

                    linksGroup.transition().duration(animationDuration)
                        .attr('d', lineGenerator)
                        .attr('opacity', 1);
                }


                function exitLink(selection, despawnPosition, animationDuration) {
                    selection
                        .transition().duration(animationDuration)
                            .attr('d', lineGenerator({
                                source: despawnPosition,
                                target: despawnPosition
                            }))
                            .attr('opacity', 0)
                            .remove();
                }

            // ===============



            // ==== Nodes ====

                function updateNodes(
                    nodes, data,
                    spawnPosition, despawnPosition,
                    animationDuration
                ) {

                    var nodesSelection = canvas.canvas.select('g.nodes').selectAll('g.node')
                        .data(nodes, nodeGenerator.getId);

                    updateNode(nodesSelection, animationDuration);
                    enterNode(nodesSelection.enter(), spawnPosition, animationDuration);
                    exitNode(nodesSelection.exit(), despawnPosition, animationDuration);

                }


                function updateNode(nodeSelection, animationDuration) {

                    nodeSelection
                        .classed('unclickable', false)
                        .transition().duration(animationDuration)
                            .attr({
                                'transform': translate,
                                'opacity': 1
                            });

                    nodeSelection.select('text.toggle').text(getToggleText);

                }


                function updateNode2(node) {

                    var datum = node.datum();

                    node.select('text.input').text(datum.fd3Data.input || '<unnamed>');
                    node.select('text.toggle').text(getToggleText);

                    var moveInfo = datum.fd3Data.moveInfo;
                    var classes = {
                        'node': true,
                        'unclickable': false,
                        'editor': datum.fd3Data.isEditorElement,
                        'container': datum.fd3Data.children.all.length > 0
                    };
                    // TODO: clear old move info specific classes
                    if (moveInfo.heightClass) classes[ moveInfo.heightClass ] = true;
                    if (moveInfo.actionType)  classes[ moveInfo.actionType  ] = true;
                    if (moveInfo.strikeType)  classes[ moveInfo.strikeType  ] = true;
                    node.classed(classes);

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
                            var node = d3.select(this);
                            updateNode2(node);
                            node
                                .on('click', selectNode)
                                .on('dblclick', function(datum) {
                                    if (datum.fd3Data.children.all.length > 0) {
                                        nodeGenerator.toggleVisibleChildren(datum);
                                        update(datum);
                                    }
                                    undoSelection();
                                });
                        });

                    nodeGroup.append('svg:circle').attr('r', NODE_HEIGHT / 3.0);
                        

                    nodeGroup.append('svg:text')
                        .attr('class', function(datum) {
                            if (
                                datum.fd3Data.children.all.length > 0 ||
                                datum.fd3Data.moveInfo.endsWith
                            ) {
                                return 'left';
                            } else {
                                return 'right';
                            }
                        })
                        .classed('input', true)
                        .text(nodeGenerator.getInput);

                    nodeGroup.append('svg:text')
                        .attr('class', 'toggle')
                        .text(getToggleText);

                    nodeGroup.filter(function(datum) {
                        return datum.fd3Data.moveInfo.endsWith;
                    }).append('svg:text')
                        .classed('ending right', true)
                        .text(function(datum) {
                            return datum.fd3Data.moveInfo.endsWith;
                        });
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
                    var children = datum.fd3Data.children;
                    if (children.all.length === 0) {
                        return null;
                    }
                    var hasVisible = children.visible.length > 0;
                    var hasHidden  = children.hidden.length  > 0;
                    if (hasVisible && !hasHidden)  return CHAR_HIDE;
                    if (hasHidden  && !hasVisible) return CHAR_EXPAND;
                    return CHAR_MIXED;
                }

            // ===============

        // ================


        // ==== Selection ====

            function initSelection(rootElement) {

                d3.select(rootElement).on('click', function() {
                    selectNode.call(null);
                });

                // d3.select(rootElement).on('mousedown', function() {
                //     d3.event.stopPropagation();
                //     d3.event.preventDefault();
                // });

                d3.select(document.body).on('keydown', function() {
                    switch (d3.event.keyCode) {
                        case KEY_CODES.ESC:   selectNothing();    break;
                        case KEY_CODES.RIGHT: selectFirstChild(); break;
                        case KEY_CODES.LEFT:  selectParent();     break;
                        case KEY_CODES.UP:    selectSibling(-1);  break;
                        case KEY_CODES.DOWN:  selectSibling(1);   break;
                        // default:
                        //     console.log('unused keycode', d3.event.keyCode);
                    }
                });

            }

            /** Uses `this` */
            function selectNode(dontFocus) {
                'use strict';

                if (selectedNode !== null) {
                    var selection = d3.select(selectedNode);
                    selection.classed('selection', false);
                    d3.select('#nodeInput').node().value = '';
                    // todo: disable editor
                }

                previousSelection = selectedNode;
                if (this !== selectedNode) {
                    selectedNode = this;
                } else {
                    selectedNode = null;
                }

                if (selectedNode) {
                    var selection = d3.select(selectedNode);
                    selection.classed('selection', true);
                    d3.select('#nodeInput').node().value = selection.datum().fd3Data.input;
                    !dontFocus && d3.select('#nodeInput').node().select();
                    // todo: enable editor
                }

                d3.event.stopPropagation();

            }


            function undoSelection() {
                // selectNode.call(previousSelection);
            }


            function selectNothing() {
                selectNode.call(null);
            }


            function selectFirstChild() {
                // if (!selectedNode) return;
                // var datum = d3.select(selectedNode).datum();
            }


            function selectParent() {
                // if (!selectedNode) return;
                // var datum = d3.select(selectedNode).datum();
            }


            function selectSibling(delta) {
                // if (!selectedNode) return;
                // var datum = d3.select(selectedNode).datum();
            }

        // ===================


        // ==== Editor ====

            function initEditor() {

                editMode = d3.select('#editMode').node().checked;
                d3.select('#editMode')
                    .on('change', function() {
                        editMode = this.checked;
                        editMode ? enterEditMode() : leaveEditMode();
                    });

                if (editMode) enterEditMode();

                d3.select('#nodeInput')

                    .on('input', function() {

                        if (selectedNode !== null) {

                            var selection = d3.select(selectedNode);
                            var data = selection.datum();
                            data.fd3Data.input = this.value;
                            // todo: update editor elements according to this change
                            nodeGenerator.fillMoveInfoFromInput(data);
                            updateNode2(selection);

                            if (data.fd3Data.isEditorElement) {

                                // TODO: optimize update call

                                addPlaceholderNode(data.fd3Data.parent);
                                update(data.fd3Data.parent);

                                // turn node from placeholder to actual node
                                data.fd3Data.isEditorElement = false;
                                addPlaceholderNode(data);
                                update(data);

                            }
                        }

                    })

                    .on('keydown', function() {
                        switch (d3.event.keyCode) {
                            case KEY_CODES.ENTER: this.blur();           break;
                            case KEY_CODES.ESC:   selectNode.call(null); break;
                        }
                    });

                d3.select('#deleteNode').on('click', function() {

                    if (!selectedNode) return;

                    var datum = d3.select(selectedNode).datum();
                    var parent = datum.fd3Data.parent;
                    if (!datum.fd3Data.isEditorElement && parent) {
                        nodeGenerator.forgetChild(parent, datum);
                        update(parent);
                    }

                });

                d3.select( '#moveUp'   ).on('click', function() { moveNodeBy.call(this, -1); });
                d3.select( '#moveDown' ).on('click', function() { moveNodeBy.call(this,  1); });

                function moveNodeBy(delta) {

                    if (!selectedNode) return;

                    var datum = d3.select(selectedNode).datum();
                    var parent = datum.fd3Data.parent;

                    if (!parent) return;

                    var pChildren = parent.fd3Data.children;
                    var changed = false;
                    if (_.moveArrayElement(pChildren.all,     datum, delta)) changed = true;
                    if (_.moveArrayElement(pChildren.visible, datum, delta)) changed = true;
                    changed && update(parent);

                }

            }


            function enterEditMode() {

                editMode = true;

                // add new node placeholder to every node

                // start from root
                var nodesAtIteratedDepth = [data];
                do {
                    var nodesAtNextDepth = [];
                    nodesAtIteratedDepth.forEach(function(node) {
                        Array.prototype.push.apply(
                            nodesAtNextDepth,
                            nodeGenerator.getAllChildren(node)
                        );
                        addPlaceholderNode(node);
                    });
                    nodesAtIteratedDepth = nodesAtNextDepth;
                } while (nodesAtIteratedDepth.length > 0);

                update(data);

            }


            function leaveEditMode() {

                editMode = false;

                // remove new node placeholder from every node

                // start from root
                var nodesAtIteratedDepth = [data];
                do {
                    var nodesAtNextDepth = [];
                    nodesAtIteratedDepth.forEach(function(node) {
                        Array.prototype.push.apply(
                            nodesAtNextDepth,
                            nodeGenerator.getAllChildren(node)
                        );
                        if (node.fd3Data.isEditorElement) {
                            nodeGenerator.forgetChild(node.fd3Data.parent, node)
                        }
                    });
                    nodesAtIteratedDepth = nodesAtNextDepth;
                } while (nodesAtIteratedDepth.length > 0);

                update(data);

            }


            function addPlaceholderNode(parent) {

                var placeholderNode = nodeGenerator.generate('new', parent);
                placeholderNode.fd3Data.isEditorElement = true;

                var children = parent.fd3Data.children;
                children.all.push(placeholderNode);
                if (children.visible.length > 0 || children.hidden.length === 0) {
                    children.visible.push(placeholderNode);
                } else {
                    children.hidden.push(placeholderNode);
                }

                return placeholderNode;
            }


            function showAbbreviations(abbreviations) {

                if (!abbreviations) return;

                var table = d3.select('#abbreviations table');

                for (name in abbreviations) {
                    var row = table.append('tr');
                    row.append('td').text(name);
                    row.append('td').append('input').node().value = abbreviations[name];
                }
            }

        // ================

    }

);