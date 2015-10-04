// http://techslides.com/save-svg-as-an-image

var PADDING = 50;
var NODE_WIDTH  = 100;
var NODE_HEIGHT = 25;

var RESIZE_TIMEOUT = 500;


var RGX_PUNCH = /^\d*p(?:\+k)?$/i;
var RGX_KICK  = /(?:h\+)?k$/i;
var RGX_HOLD  = /^\d+h$/i;
var RGX_THROW = /^\d*t$/i;


var svg;
var canvas;

var tree;
var lineGenerator;

var limitsFinder;



(function main(parentElement, rawData) {

    limitsFinder = createLimitsFinder();

    var preparedData = prepareData(
        rawData.data,
        rawData.meta.character
    );

    createCanvas(parentElement);

    initGenerators();
    initStyles();

    update(preparedData);

    rawData.meta && showAbbreviations(rawData.meta.abbreviations);

}(document.getElementById('content'), data));



// ==== Styles ====

    function initStyles() {
        initLinkStyles();
        initNodeStyles();
    }


    function initLinkStyles() {

        addStyle('path.link', {
            fill: 'none',
            stroke: '#ddd'
        });

    }


    function initNodeStyles() {

        addStyle('.unclickable', { 'pointer-events': 'none' });

        addStyle('g.canvas', { 'transition': 'transform 1s' });

        addStyle('g.node circle', {
            'fill': 'white',
            'stroke': '#777',
            'stroke-width': '2px'
        });

        addStyle('g.node.punch circle', { fill: '#ffff77', stroke: 'white' });
        addStyle('g.node.kick circle',  { fill: '#ff7777', stroke: 'white' });
        addStyle('g.node.hold circle',  { fill: '#77ff77', stroke: 'white' });
        addStyle('g.node.throw circle', { fill: '#7777ff', stroke: 'white' });

        addStyle('g.node text', {
            'font-family': 'arial',
            // 'font-weight': 'bold',
            // 'font-style': 'italic',
            'text-anchor': 'end', // 'middle',
            'dominant-baseline': 'central',
            'fill': 'black',
            'text-shadow': '0 0 2px white'
            // 'pointer-events': 'none'
        });

    }

// ================



function createNodeGenerator() {

    var counter = 1;
    return generateNode;

    function generateNode(name) {
        return {
            // hide info in the fuck-d3-data so it has its very own place and is not affected by d3
            fd3Data: {
                name: name, // todo: rename to input?
                children: {
                    all:     [],
                    visible: [],
                    hidden:  []
                },
                // scrollRange: {
                //     from: undefined,
                //     to:   undefined
                // },
                id: counter++,
                value: null, // TODO: rename to meta / moveInfo
                lastPosition: {
                    x: undefined,
                    y: undefined
                }
            },
            // data filled by d3
            x: undefined,
            y: undefined,
            depth: undefined,
            parent: undefined
        };
    }
    
}



function getVisibleChildren(datum) {
    return datum.fd3Data.children.visible;
}



function getId(datum) {
    return datum.fd3Data.id;
}



function prepareData(characterRawData, characterName) {
    var generateNode = createNodeGenerator();
    var preparedData = d3fyJson(characterRawData, characterName, generateNode);
    preparedData.fd3Data.children.all.forEach(function(stance) {
        groupByType(stance, generateNode);
    });
    return preparedData;
}



function d3fyJson(obj, name, generateNode) {

    var result = generateNode(name);

    if (!isObject(obj)) {
        result.fd3Data.value = obj;
        return result;
    }

    var propNames = Object.getOwnPropertyNames(obj);

    propNames.forEach(function(propName) {
        // if (!propName) return;
        if (propName === 'meta') {
            result.fd3Data.value = obj[propName];
        } else {
            var child = d3fyJson(obj[propName], propName, generateNode);
            result.fd3Data.children.all.push(child);
            result.fd3Data.children.visible.push(child);
        }
    });

    return result;
}



function groupByType(parent, generateNode) {

    // fill groups

    var byType = {
        'punches': [],
        'kicks':   [],
        'throws':  [],
        'holds':   [],
        'other':   []
    }

    parent.fd3Data.children.all.forEach(function(child) {

       var meta = child.fd3Data.value;

        if (isObject(meta) && meta.type != undefined) {
            switch(meta.type) {
                case 'punch':   byType[ 'punches' ].push(child); break;
                case 'kick':    byType[ 'kicks'   ].push(child); break;
                case 'throw':   byType[ 'throws'  ].push(child); break;
                case 'hold':    byType[ 'holds'   ].push(child); break;
                case 'special': byType[ 'other'   ].push(child); break;
                default:
                    console.error('Unsupported meta type: %s', meta.type);
            }
        } else {
            if (RGX_PUNCH.test(child.fd3Data.name)) { byType[ 'punches' ].push(child); } else
            if (RGX_KICK.test(child.fd3Data.name))  { byType[ 'kicks'   ].push(child); } else
            if (RGX_HOLD.test(child.fd3Data.name))  { byType[ 'holds'   ].push(child); } else
            if (RGX_THROW.test(child.fd3Data.name)) { byType[ 'throws'  ].push(child); } else {
                byType['other'].push(child);
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

        var groupingChild = generateNode('<' + type + '>');
        groupingChild.fd3Data.children.all = childrenOfType;
        groupingChild.fd3Data.children.hidden = childrenOfType;

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

    tree.children(getVisibleChildren);

    // tree.separation(function(a, b) {
    //     return 1;
    // });

    // lineGenerator = d3.svg.diagonal()
    //     .projection(function(d) {
    //         return [ d.y, d.x ];
    //     });

    var line = d3.svg.line()
        .x(function(datum) { return datum.x; })
        .y(function(datum) { return datum.y; })
        .interpolate('linear');

    lineGenerator = function(datum, index) { 
        return line([datum.source, datum.target]);
    };
}



/*function fillScrollRange(data) {
    
    var childrenByDepth = [];

    var newColumn = [ data ];

    do {

        childrenByDepth.push(newColumn);

        var currentColumn = newColumn;
        newColumn = [];

        currentColumn.forEach(function(node) {
            newColumn = newColumn.concat(getVisibleChildren(node));
        });

    } while (newColumn.length > 0);

    for (var i = childrenByDepth.length - 1; i > 0; --i) {
        var children = childrenByDepth[i];
        children.forEach(function(child) {
            var sr = child.parent.fd3Data.scrollRange;
            sr.from = Math.min(sr.from, child.fd3Data.scrollRange.from);
            sr.to   = Math.max(sr.to,   child.fd3Data.scrollRange.to);
        });
    }

}*/



function backupPosition(datum) {
    datum.fd3Data.lastPosition.x = datum.x;
    datum.fd3Data.lastPosition.y = datum.y;
}



function swapXY(datum) {
    var swap = datum.x;
    datum.x = datum.y;
    datum.y = swap;
}



function createLimitsFinder() {

    return {

        x: {
            min: 0,
            max: 0
        },

        y: {
            min: 0,
            max: 0
        },

        reset: function reset() {
            this.x.min = 0;
            this.x.max = 0;
            this.y.min = 0;
            this.y.max = 0;
        },

        considerDatum: function considerDatum(datum) {
            this.x.max = Math.max(this.x.max, datum.x);
            this.x.min = Math.min(this.x.min, datum.x);
            this.y.max = Math.max(this.y.max, datum.y);
            this.y.min = Math.min(this.y.min, datum.y);
        }

    };

}



// ==== Update ====

    function update(data, sourceNode) {
        
        var nodes = tree.nodes(data);
        var links = tree.links(nodes);

        limitsFinder.reset();

        nodes.forEach(function(datum) {

            swapXY(datum); // turn 90deg CCW

            limitsFinder.considerDatum(datum);

            // reset scrollRange
            // datum.fd3Data.scrollRange.from = datum.y;
            // datum.fd3Data.scrollRange.to   = datum.y;

        });

        // fillScrollRange(data);

        normalizeCanvas(
            PADDING,
            PADDING - limitsFinder.y.min,
            PADDING + (limitsFinder.x.max - limitsFinder.x.min) + PADDING,
            PADDING + (limitsFinder.y.max - limitsFinder.y.min) + PADDING
        );

        var animationDuration = sourceNode ? 1000 : 0;

        var despawnPosition = sourceNode || nodes[0];
        var spawnPosition = {
            x: defined(despawnPosition.fd3Data.lastPosition.x, despawnPosition.x),
            y: defined(despawnPosition.fd3Data.lastPosition.y, despawnPosition.y)
        };

        updateLinks(links,       spawnPosition, despawnPosition, animationDuration);
        updateNodes(nodes, data, spawnPosition, despawnPosition, animationDuration);

        nodes.forEach(backupPosition);

    }


    function updateLinks(links, spawnPosition, despawnPosition, animationDuration) {

        var linksSelection = canvas.select('g.links').selectAll('path.link')
            .data(links, function(d) { return getId(d.target); });

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
                }));

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

        var nodesSelection = canvas.select('g.nodes').selectAll('g.node').data(nodes, getId);

        // update existing nodes

        nodesSelection
            .classed('unclickable', false)
            .transition().duration(animationDuration)
                .attr('transform', function(datum) {
                    return 'translate(' +
                        datum.x + ',' +
                        datum.y +
                    ')';
                })
                .attr('opacity', 1);
                

        // create new

        var nodeGroup = nodesSelection.enter().append('svg:g')
            .attr('class', getNodeClass)
            .attr('transform', 'translate(' +
                spawnPosition.x + ',' +
                spawnPosition.y +
            ')')
            .attr('opacity', 0)
            .classed('unclickable', false);

        nodeGroup.transition().duration(animationDuration)
            .attr('transform', function(datum) {
                return 'translate(' +
                    datum.x + ',' +
                    datum.y +
                ')'; 
            })
            .attr('opacity', 1);

        nodeGroup.append('svg:circle')
            .attr('r', NODE_HEIGHT / 3.0)
            .on('click', function(datum) {
                toggleChildren(datum);
                update(data, datum);
            });

        nodeGroup.append('svg:text')
            .attr('x', -0.5 * NODE_HEIGHT)
            .text(function(datum) {
                return datum.fd3Data.name || datum.fd3Data.value;
            });

        // remove old
        
        nodesSelection.exit()
            .classed('unclickable', true)
            .transition().duration(animationDuration)
                .attr('transform', 'translate(' + despawnPosition.x + ',' + despawnPosition.y + ')')
                .attr('opacity', 0)
                .remove();

    }

// ================



function getNodeClass(datum, index) {
    var classList = ['node'];
    if (isObject(datum.fd3Data.value) && datum.fd3Data.value.type != undefined) {

    } else {
        var name = datum.fd3Data.name;
        if (RGX_PUNCH.test(name)) { classList.push('punch'); } else
        if (RGX_KICK.test(name))  { classList.push('kick');  } else
        if (RGX_HOLD.test(name))  { classList.push('hold');  } else
        if (RGX_THROW.test(name)) { classList.push('throw'); }
    }
    return classList.join(' ');
}



function toggleChildren(datum) {
    var temp = datum.fd3Data.children.hidden;
    datum.fd3Data.children.hidden = datum.fd3Data.children.visible; // FIXME: unique arrays?
    datum.fd3Data.children.visible = temp;
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



// ==== Helpers ====

    function addStyle(selector, properties) {
        var style = document.createElement('style');
        style.type = 'text/css';
        style.innerHTML = selector + '{' + 
            Object.getOwnPropertyNames(properties).map(function(propName) {
                return propName + ':' + properties[propName];
            }).join(';') +
        '}';
        document.getElementsByTagName('head')[0].appendChild(style);
    }

    function isObject(obj) {
        var type = typeof obj;
        return type === 'function' || type === 'object' && !!obj;
    }

    function defined(/* arguments */) {
        for (i = 0; i < arguments.length; i++) {
            if (arguments[i] !== undefined) return arguments[i];
        }
    }

// =================