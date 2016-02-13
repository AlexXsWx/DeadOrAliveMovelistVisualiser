define(

    'movelist',

    [
        'd3', 'lineGenerators', // TODO: capitals
        'canvasManager',
        'node', 'nodeSerializer',
        'NodeView', 'limitsFinder',
        'selection', 'editor', 'ui',
        'treeTools', 'tools', 'JsonFileReader'
    ],

    function(
        d3, lineGenerators,
        canvasManager,
        node, nodeSerializer,
        NodeView, createLimitsFinder,
        selectionManager, editor, ui,
        treeTools, _, JsonFileReader
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

        // ===================


        // ==== Variables ====

            var canvas;

            var rootNodeData;
            var rootNodeView;

            var generators = {
                d3: {
                    tree: null,
                    line: null
                },
                nodeViews: null
            };

            var domCache = {
                download: null
            };

            var limitsFinder;

        // ===================


        return { init: init };


        // ==== Init ====

            function init(parentElement) {

                cacheDomElements();

                canvas = initCanvas(parentElement);
                selectionManager.init(canvas.svg.node());

                generators.nodeViews = NodeView.createGenerators();

                editor.init(generators.nodeViews);
                editor.onDataChanged.addListener(onEditorChange);

                selectionManager.onSelectionChanged.addListener(editor.updateBySelection);

                limitsFinder = createLimitsFinder();

                initGenerators();

                loadData(node.createRootNode());

                bindUIActions();

            }


            function cacheDomElements() {
                domCache.download = document.getElementById('download');
            }


            function loadData(data) {

                rootNodeData = data;
                rootNodeView = createViewFromData(rootNodeData);

                // TODO: reset everything


                // FIXME: update editor (selected element changed)

                // ui.showAbbreviations(rawData.meta && rawData.meta.abbreviations);
                update(false);

            }


            function initCanvas(rootNode) {
                var canvas = canvasManager.create(rootNode);
                canvas.canvas.append('svg:g').classed('links', true);
                canvas.canvas.append('svg:g').classed('nodes', true);
                return canvas;
            }


            function initGenerators() {

                var tree = d3.layout.tree();
                tree.nodeSize([ NODE_HEIGHT, NODE_WIDTH ]); // turn 90deg CCW
                tree.children(NodeView.getVisibleChildren);
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
                d3.select('#load').on('change', onFileSelected);
                domCache.download.addEventListener('click', onDownload);

                d3.select('#showPlaceholders').on('change', onChangeShowPlaceholders);

            }


            function onChangeShowPlaceholders() {
                if (this.checked) {
                    editor.addPlaceholders(rootNodeView);
                } else {
                    editor.removePlaceholders(rootNodeView);
                }
            }


            function onButtonSave() {

                var exportedJsonObj = nodeSerializer.exportJson(
                    // FIXME: this will move action step if previous is not filled
                    _.withoutFalsyProperties(rootNodeData)
                );

                var url = (
                    "data:application/json;charset=utf8;base64," +
                    window.btoa(JSON.stringify(exportedJsonObj, null, '  '))
                );

                domCache.download.download = (rootNodeData.character || 'someCharacter') + '.json';
                domCache.download.href = url;
                _.showDomElement(domCache.download);
                    
            }


            function onFileSelected() {
                var fileElement = this;
                var file = fileElement.files[0];
                file && JsonFileReader.readJson(fileElement.files[0]).then(
                    function onSuccess(parsedJson) {
                        var importedDataRoot = nodeSerializer.importJson(parsedJson);
                        if (!importedDataRoot) {
                            alert('Failed to import json');
                            return;
                        }
                        var rootNodeData = node.createRootNode(importedDataRoot, true);
                        loadData(rootNodeData);
                    },
                    function onFail(error) {
                        alert('Error: Invalid JSON file\n%O', error);
                    }
                );
            }

            function onDownload() {
                _.hideDomElement(domCache.download);
            }

        // ============


        // ==== Data operations ====

            function createViewFromData(rootNodeData) {

                // restructureByType(rootNodeData);

                var rootNodeView = NodeView.createViewFromData(
                    rootNodeData, generators.nodeViews
                );

                setTreeInfoAppearanceData(rootNodeView);
                return rootNodeView;

            }


            function setTreeInfoAppearanceData(rootNodeView) {

                var childrenByDepth = treeTools.getChildrenMergedByDepth(
                    rootNodeView, NodeView.getAllChildren
                );

                // reset
                for (var i = childrenByDepth.length - 1; i >= 0; --i) {
                    childrenByDepth[i].forEach(function(child) {
                        var appearance = child.fd3Data.appearance;
                        appearance.totalChildren = 0;
                        appearance.deepness      = 0;
                        appearance.branchesAfter = 0;
                    });
                }

                // set new
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

            }


            /*

            function restructureByType(data) {
                NodeView.getAllChildren(data).forEach(function(stance) {
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

                NodeView.getAllChildren(parent).forEach(function(child) {

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

                NodeView.removeAllChildren(parent);

                for (type in byType) {

                    var childrenOfType = byType[type];
                    if (childrenOfType.length < 1) continue;

                    var groupingChild = generators.nodeViews.generateGroup('<' + type + '>');
                    NodeView.setChildren(groupingChild, childrenOfType);
                    NodeView.toggleVisibleChildren(groupingChild);

                    NodeView.addVisibleChild(parent, groupingChild);

                }

            }

            */

        // =========================


        // ==== Update ====

            function onEditorChange(changes) {

                changes.changed && changes.changed.forEach(function(d3SvgNode) {
                    NodeView.updateAppearanceByBoundNode(d3SvgNode.datum());
                    updateChangedNode(d3SvgNode);
                });

                var deleted = _.isNonEmptyArray(changes.deleted);
                var added   = _.isNonEmptyArray(changes.added);
                var moved   = _.isNonEmptyArray(changes.moved);

                if (deleted || added) setTreeInfoAppearanceData(rootNodeView);
                if (deleted || added || moved) update(true);

                _.hideDomElement(domCache.download);

            }


            function update(animate, optSourceNode) {
                
                var nodes = generators.d3.tree.nodes(rootNodeView);
                var links = generators.d3.tree.links(nodes);

                limitsFinder.invalidate();
                
                nodes.forEach(function preprocessTreeNodes(datum) {
                    NodeView.swapXY(datum); // turn 90deg CCW
                    limitsFinder.expandToContain(datum.x, datum.y);
                    // NodeView.resetScrollRangeForDatum(datum);
                });

                // NodeView.fillScrollRange(rootNodeView);

                canvas.normalize(
                    PADDING,
                    PADDING - limitsFinder.y.min,
                    PADDING + (limitsFinder.x.max - limitsFinder.x.min) + PADDING,
                    PADDING + (limitsFinder.y.max - limitsFinder.y.min) + PADDING
                );

                var animationDuration = animate ? ANIMATION_DURATION : 0;

                updateLinks(links, animationDuration, optSourceNode);
                updateNodes(nodes, animationDuration, optSourceNode);

                nodes.forEach(NodeView.backupPosition);

            }


            // ==== Links ====

                function updateLinks(links, animationDuration, optSourceNode) {

                    var linksSelection = canvas.canvas.select('g.links').selectAll('path.link')
                        .data(links, getLinkId);

                    updateLink(linksSelection, animationDuration);
                    enterLink(linksSelection.enter(), animationDuration, optSourceNode);
                    exitLink(linksSelection.exit(),   animationDuration);

                }


                function updateLink(selection, animationDuration) {
                    selection
                        .attr('stroke-width', linkThickness)
                        .transition().duration(animationDuration)
                            .attr('d', generators.d3.line);
                }


                function enterLink(selection, animationDuration, optSourceNode) {

                    var linksGroup = selection.append('svg:path')
                        .classed('link', true)
                        .attr('stroke-width', linkThickness)
                        .attr('opacity', 0)
                        .attr(
                            'd',
                            optSourceNode
                                ? collapsedLine(getLastPosition(optSourceNode))
                                : getSpawnCollapsedLine
                        );

                    linksGroup.transition().duration(animationDuration)
                        .attr('opacity', 1)
                        .attr('d', generators.d3.line);

                }


                function exitLink(selection, animationDuration) {
                    selection
                        .transition().duration(animationDuration)
                            .attr('opacity', 0)
                            .attr('d', getDespawnCollapsedLine)
                            .remove();
                }


                function getLinkId(link) {
                    return NodeView.getId(link.target);
                }


                function linkThickness(link) {
                    var targetNodeView = link.target;
                    // Mimic wires passing through node; using circle area formula
                    var branchesAfter = targetNodeView.fd3Data.appearance.branchesAfter;
                    return 2 * Math.sqrt((branchesAfter + 1) / Math.PI);
                }


                function getSpawnCollapsedLine(link) {
                    return collapsedLine(getSpawnPosition(link.target));
                }

                function getDespawnCollapsedLine(link) {
                    return collapsedLine(getDespawnPosition(link.target));
                }

                function collapsedLine(position) {
                    return generators.d3.line({ source: position, target: position });
                }

            // ===============


            // ==== Nodes ====

                function updateNodes(nodes, animationDuration, optSourceNode) {

                    var nodesSelection = canvas.canvas.select('g.nodes').selectAll('g.node')
                        .data(nodes, NodeView.getId);

                    updateNotChangedNode(nodesSelection, animationDuration);
                    enterNode(nodesSelection.enter(), animationDuration, optSourceNode);
                    exitNode(nodesSelection.exit(),   animationDuration);

                }


                function updateNotChangedNode(nodeSelection, animationDuration) {

                    nodeSelection
                        .classed('unclickable', false) // wtf?
                        .transition().duration(animationDuration)
                            .attr({
                                'transform': translate,
                                'opacity': 1
                            });

                    nodeSelection.select('text.toggle').text(getTextToggle);

                }


                function updateChangedNode(d3SvgNode) {

                    var datum = d3SvgNode.datum();

                    d3SvgNode.select( 'text.input'  ).text(getTextLeft);
                    d3SvgNode.select( 'text.toggle' ).text(getTextToggle);
                    d3SvgNode.select( 'text.ending' ).text(getTextRight);

                    var classes = {
                        'container': _.isNonEmptyArray(NodeView.getAllChildren(datum)),

                        'high': false,
                        'mid':  false,
                        'low':  false,

                        'strike':       false,
                        'throw':        false,
                        'hold':         false,
                        'groundAttack': false,
                        'other':        false,

                        'punch': false,
                        'kick':  false
                    };

                    var nodeData = datum.fd3Data.binding.targetDataNode;

                    if (nodeData && node.isMoveNode(nodeData)) {
                        nodeData.actionSteps.forEach(function(actionStep) {

                            if (/\bp\b/i.test(actionStep.actionMask)) classes['high'] = true;
                            if (/\bk\b/i.test(actionStep.actionMask)) classes['kick'] = true;

                            var type = actionStep.actionType;
                            if (type === 'strike')       classes['strike']       = true;
                            if (type === 'throw')        classes['throw']        = true;
                            if (type === 'hold')         classes['hold']         = true;
                            if (type === 'groundAttack') classes['groundAttack'] = true;
                            if (type === 'other')        classes['other']        = true;

                            if (/\bhigh\b/i.test(actionStep.actionMask)) classes['high'] = true;
                            if (/\bmid\b/i.test(actionStep.actionMask))  classes['mid']  = true;
                            if (/\blow\b/i.test(actionStep.actionMask))  classes['low']  = true;
                        });
                    }

                    d3SvgNode.classed(classes);

                }


                function enterNode(selEnter, animationDuration, optSourceNode) {

                    var nodeGroup = selEnter.append('svg:g');

                    nodeGroup.transition().duration(animationDuration)
                        .attr({
                            'transform': translate,
                            'opacity': 1
                        });

                    nodeGroup

                        .attr({
                            'transform': (
                                optSourceNode
                                    ? translate(getLastPosition(optSourceNode))
                                    : function(nodeView) {
                                        return translate(getSpawnPosition(nodeView));
                                    }
                            ),
                            'opacity': 0
                        })

                        .classed({
                            'node': true,
                            'unclickable': false
                        })

                        .on('touchend', toggleChildren)
                        .on('click', onClickNodeView)
                        .on('dblclick', onDoubleClickNodeView);
                        

                    nodeGroup.append('svg:circle').attr('r', NODE_HEIGHT / 3.0);


                    nodeGroup.append('svg:text')
                        .classed('input', true)
                        .attr('text-anchor', 'end')
                        .attr('x', -0.5 * NODE_HEIGHT);

                    nodeGroup.append('svg:text')
                        .classed('toggle', true)
                        .attr('text-anchor', 'middle');

                    nodeGroup.append('svg:text')
                        .classed('ending', true)
                        .attr('text-anchor', 'start')
                        .attr('x', 0.5 * NODE_HEIGHT);

                    nodeGroup.each(function(datum) {
                        updateChangedNode(d3.select(this));
                    });
                }


                function exitNode(selExit, animationDuration) {
                    selExit
                        .classed('unclickable', true)
                        .transition().duration(animationDuration)
                            .attr('transform', function(nodeView) {
                                return translate(getDespawnPosition(nodeView));
                            })
                            .attr('opacity', 0)
                            .remove();
                }


                function onClickNodeView() {
                    var nodeViewDomElement = this;
                    selectionManager.selectNode(nodeViewDomElement);
                }

                function onDoubleClickNodeView(nodeView) {
                    toggleChildren(nodeView);
                    selectionManager.undoSelection();
                }

                function toggleChildren(nodeView) {
                    if (_.isNonEmptyArray(NodeView.getAllChildren(nodeView))) {
                        NodeView.toggleVisibleChildren(nodeView);
                        update(true, nodeView);
                    }
                }


                function getTextLeft(nodeView) {
                    return nodeView.fd3Data.appearance.textLeft;
                }

                function getTextToggle(nodeView) {

                    if (!_.isNonEmptyArray(NodeView.getAllChildren(nodeView))) return null;

                    var hasVisible = NodeView.hasVisibleChildren(nodeView);
                    var hasHidden  = NodeView.hasHiddenChildren(nodeView);
                    if (hasVisible && !hasHidden)  return CHAR_HIDE;
                    if (hasHidden  && !hasVisible) return CHAR_EXPAND;

                    return CHAR_MIXED;

                }

                function getTextRight(nodeView) {
                    return nodeView.fd3Data.appearance.textRight;
                }


                function translate(position) {
                    return 'translate(' + position.x + ',' + position.y + ')';
                }

            // ===============


            function getDespawnParent(nodeView) {
                var current = nodeView;
                var parent = nodeView.fd3Data.treeInfo.parent;
                while (
                    parent &&
                    parent.fd3Data.treeInfo.children.visible.indexOf(current) >= 0
                ) {
                    current = parent;
                    parent = current.fd3Data.treeInfo.parent;
                }
                return parent || current;
            }


            function getSpawnPosition(nodeView) {
                return getLastPosition(nodeView.fd3Data.treeInfo.parent || nodeView);
            }


            function getDespawnPosition(nodeView) {
                return getPosition(getDespawnParent(nodeView));
            }


            function getLastPosition(nodeView) {
                return {
                    x: _.defined(nodeView.fd3Data.appearance.lastPosition.x, nodeView.x),
                    y: _.defined(nodeView.fd3Data.appearance.lastPosition.y, nodeView.y)
                };
            }

            function getPosition(nodeView) {
                return {
                    x: nodeView.x,
                    y: nodeView.y
                };
            }

        // ================

    }

);