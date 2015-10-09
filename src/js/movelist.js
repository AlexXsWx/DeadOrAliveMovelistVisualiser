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



    return movelist;



    function movelist(parentElement, rawData) {

        limitsFinder = createLimitsFinder();

        var preparedData = prepareData(
            rawData.data,
            rawData.meta.character
        );

        createCanvas(parentElement);

        initGenerators();

        update(preparedData);

        rawData.meta && showAbbreviations(rawData.meta.abbreviations);

    }



    function prepareData(characterRawData, characterName) {

        nodeGenerator = createNodeGenerator();

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
            'punch':   'punches',
            'kick':    'kicks',
            'throw':   'throws',
            'hold':    'holds',
            'special': 'other'
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



    function normalizeCanvas(offsetX, offsetY, totalWidth, totalHeight) {
        canvas.attr('style', 'transform: translate(' + offsetX + 'px,' + offsetY + 'px)');
        svg
            // FIXME
            .attr('width',  Math.max(totalWidth,  document.body.clientWidth - 5))
            .attr('height', Math.max(totalHeight, document.body.clientHeight - 5));
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

        function update(data, sourceNode) {
            
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


        function updateLinks(links, spawnPosition, despawnPosition, animationDuration) {

            var linksSelection = canvas.select('g.links').selectAll('path.link')
                .data(links, function(d) {
                    return nodeGenerator.getId(d.target);
                });

            // update existing nodes
            linksSelection
                .attr('opacity', 1)
                .transition().duration(animationDuration)
                    .attr('d', lineGenerator);

            // create new
            var linksGroup = linksSelection
                .enter().append('svg:path')
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

            // remove old
            linksSelection.exit()
                .transition().duration(animationDuration)
                    .attr('d', lineGenerator({
                        source: despawnPosition,
                        target: despawnPosition
                    }))
                    .attr('opacity', 0)
                    .remove();

        }


        function updateNodes(nodes, data, spawnPosition, despawnPosition, animationDuration) {

            var nodesSelection = canvas.select('g.nodes').selectAll('g.node')
                .data(nodes, nodeGenerator.getId);

            // update existing nodes

            nodesSelection
                .classed('unclickable', false)
                .transition().duration(animationDuration)
                    .attr('transform', translate)
                    .attr('opacity', 1);
                    

            // create new

            var nodeGroup = nodesSelection.enter().append('svg:g')
                .attr('class', function(datum) {
                    var moveInfo = datum.fd3Data.moveInfo;
                    return (
                        'node ' +
                        (moveInfo.heightClass || '') + ' ' +
                        (moveInfo.actionType  || '') + ' ' +
                        (moveInfo.strikeType  || '')
                    );
                })
                .attr('transform', translate(spawnPosition))
                .attr('opacity', 0)
                .classed('unclickable', false);

            nodeGroup.transition().duration(animationDuration)
                .attr('transform', translate)
                .attr('opacity', 1);

            var circleSelection = nodeGroup.append('svg:circle');
            circleSelection.attr('r', NODE_HEIGHT / 3.0);

            circleSelection
                .filter(function(datum) {
                    return datum.fd3Data.children.all.length > 0;
                })
                .classed('container', true)
                .on('click', function(datum) {
                    nodeGenerator.toggleVisibleChildren(datum);
                    update(data, datum);
                });

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


            // remove old
            
            nodesSelection.exit()
                .classed('unclickable', true)
                .transition().duration(animationDuration)
                    .attr('transform', translate(despawnPosition))
                    .attr('opacity', 0)
                    .remove();

        }

    // ================



    function translate(position) {
        return 'translate(' + position.x + ',' + position.y + ')';
    }



    function createCanvas(rootNode) {

        svg = d3.select(rootNode).append('svg:svg')
            .attr('version', 1.1)
            .attr('xmlns', 'http://www.w3.org/2000/svg');

        canvas = svg.append('svg:g').attr('class', 'canvas');

        canvas.append('svg:g').attr('class', 'links');
        canvas.append('svg:g').attr('class', 'nodes');

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

});