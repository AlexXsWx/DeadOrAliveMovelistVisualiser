define('movelist', ['d3', 'node', 'limitsFinder', 'lineGenerators', 'treeTools', 'tools'], function() {

    var d3                  = requirejs('d3');
    var createNodeGenerator = requirejs('node');
    var createLimitsFinder  = requirejs('limitsFinder');
    var lineGenerators      = requirejs('lineGenerators');
    var treeTools           = requirejs('treeTools');
    var _                   = requirejs('tools');



    var PADDING = 50;
    var NODE_WIDTH  = 150;
    var NODE_HEIGHT = 25;

    var RESIZE_TIMEOUT = 500;


    var svg;
    var canvas;

    var tree;
    var lineGenerator;

    var limitsFinder;

    var nodeGenerator;

    var selectedNode = null;

    var data;

    return movelist;



    function movelist(parentElement, rawData) {

        bindEditor();

        limitsFinder = createLimitsFinder();

        nodeGenerator = createNodeGenerator();

        data = prepareData(
            rawData.data,
            rawData.meta.character
        );

        // data = createNewData(nodeGenerator);

        createCanvas(parentElement);

        initGenerators();

        update();

        rawData.meta && showAbbreviations(rawData.meta.abbreviations);

    }



    function createCanvas(rootNode) {

        svg = d3.select(rootNode).append('svg:svg')
            .attr('version', 1.1)
            .attr('xmlns', 'http://www.w3.org/2000/svg');

        canvas = svg.append('svg:g').attr('class', 'canvas');

        canvas.append('svg:g').attr('class', 'links');
        canvas.append('svg:g').attr('class', 'nodes');

    }



    function normalizeCanvas(offsetX, offsetY, totalWidth, totalHeight) {
        canvas.attr('style', 'transform: translate(' + offsetX + 'px,' + offsetY + 'px)');
        svg
            // FIXME
            .attr('width',  Math.max(totalWidth,  document.body.clientWidth - 5))
            .attr('height', Math.max(totalHeight, document.body.clientHeight - 5));
    }



    function showAbbreviations(abbreviations) {

        if (!abbreviations) return;

        var table = d3.select('#abbreviations');

        for (name in abbreviations) {
            var row = table.append('tr');
            row.append('td').text(name);
            row.append('td').text(abbreviations[name]);
        }
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



    function createNewData(nodeGenerator) {
        var root = nodeGenerator.generate('root', null);
        createEditorPlaceholder(root, true);
        return root;
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
            groupingChild.fd3Data.children.all = childrenOfType;
            groupingChild.fd3Data.children.hidden = childrenOfType;

            childrenOfType.forEach(function(child) {
                child.fd3Data.parent = groupingChild;
            });

            parent.fd3Data.children.all.push(groupingChild);
            parent.fd3Data.children.visible.push(groupingChild);

        }

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

            normalizeCanvas(
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

                var linksSelection = canvas.select('g.links').selectAll('path.link')
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

            function updateNodes(nodes, data, spawnPosition, despawnPosition, animationDuration) {

                var nodesSelection = canvas.select('g.nodes').selectAll('g.node')
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

            }


            function updateNode2(node) {

                var datum = node.datum();

                node.select('text.input').text(datum.fd3Data.name || '<unnamed>');

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

                        node.on('click', function(datum) {

                            if (datum.fd3Data.isEditorElement) {

                                // TODO: optimize update call

                                createEditorPlaceholder(datum.fd3Data.parent);

                                // turn node from placeholder to actual node
                                datum.fd3Data.isEditorElement = false;
                                createEditorPlaceholder(datum);

                                if (selectedNode === this) {
                                    selectNode(null);
                                } else {
                                    selectNode(this);
                                }

                            } else

                            if (datum.fd3Data.children.all.length > 0) {
                                nodeGenerator.toggleVisibleChildren(datum);
                                update(datum);
                            }

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
                    .text(function(datum) {
                        return datum.fd3Data.name;
                    });

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

        // ===============

    // ================



    function createEditorPlaceholder(parent, dontUpdate) {
        var newElement = nodeGenerator.generate('new', parent);
        newElement.fd3Data.isEditorElement = true;
        parent.fd3Data.children.all.push(newElement);
        parent.fd3Data.children.visible.push(newElement);
        !dontUpdate && update(parent);
        return newElement;
    }



    function selectNode(node) {

        if (selectedNode !== null) {
            var selection = d3.select(selectedNode);
            selection.classed('selection', false);
            d3.select('#nodeName').node().value = '';
            // todo: disable editor
        }

        selectedNode = node;

        if (selectedNode !== null) {
            var selection = d3.select(selectedNode);
            selection.classed('selection', true);
            d3.select('#nodeName').node().value = selection.datum().fd3Data.name;
            d3.select('#nodeName').node().select();
            // todo: enable editor
        }

    }



    function bindEditor() {

        d3.select('#nodeName').on('input', function() {
            if (selectedNode !== null) {
                var selection = d3.select(selectedNode);
                var data = selection.datum();
                data.fd3Data.name = this.value;
                // todo: update editor elements according to this change
                nodeGenerator.fillMoveInfoFromInput(data);
                updateNode2(selection);
            }
        });

        d3.select('#deleteNode').on('click', function() {
            if (selectedNode !== null) {
                var selection = d3.select(selectedNode);
                var data = selection.datum();
                var parent = data.fd3Data.parent;
                nodeGenerator.forgetChild(parent, data);
                update(parent);
            }
        });

    }



    function translate(position) {
        return 'translate(' + position.x + ',' + position.y + ')';
    }

});