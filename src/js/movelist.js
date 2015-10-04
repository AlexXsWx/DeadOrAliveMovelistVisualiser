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


var newRect = null;
var mouseOver = false;
var resizeTimeout = null;



(function main(parentElement, rawData, characterName) {

    if (!rawData.hasOwnProperty(characterName)) {
        var msg = 'Error: property "' + characterName + '" not found';
        console.error(msg);
        alert(msg);
        return;
    }

    var preparedData = prepareData(rawData[characterName], characterName);

    createCanvas(parentElement);

    bindDeferredResize();

    initGenerators();
    initStyles();

    update(preparedData, false);

    rawData.meta && showAbbreviations(rawData.meta.abbreviations);

}(document.getElementById('content'), data, 'rig'));



// ==== Styles ====

    function initStyles() {

        initLinkStyles();
        initNodeStyles();

        addStyle('g.canvas', {
            'transition': 'transform 0.5s'
        });

    }

    function initLinkStyles() {
        addStyle('path.link', {
            fill: 'none',
            stroke: '#ddd'
        });
    }

    function initNodeStyles() {
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

        // addStyle('g.node text.final', { 'text-anchor': 'start' });
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
                scrollRange: {
                    from: undefined,
                    to:   undefined
                },
                id: counter++,
                value: null // TODO: rename to meta / moveInfo
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
            if (meta.type === 'special') {
                byType['other'].push(child);
            } else {
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



function resize() {
    // TODO: use parent's size
    canvas.attr('style', 'transform: translate(' + newRect.x + 'px,' + newRect.y + 'px)');
    svg
        .attr('width',  Math.max(document.body.clientWidth,  newRect.width))
        // FIXME: hack -5 to remove vertical scroll bar
        .attr('height', Math.max(document.body.clientHeight - 5, newRect.height));
    newRect = null;

    setTimeout(resizeSvgWidth, 0);
}


function resizeSvgWidth() {
    svg.attr('width', document.body.clientWidth);
}


function bindDeferredResize() {

    window.addEventListener('resize', resizeSvgWidth);

    canvas.node().addEventListener('mouseover', function() {
        mouseOver = true;
        if (resizeTimeout != null) {
            clearTimeout(resizeTimeout);
            resizeTimeout = null;
        }
    });

    canvas.node().addEventListener('mouseleave', function() {
        mouseOver = false;
        if (newRect == null) return;
        resizeTimeout = setTimeout(resize, RESIZE_TIMEOUT);
    });

}



function idByDatum(datum) {
    return datum.fd3Data.id;
}



function initGenerators() {

    tree = d3.layout.tree();

    tree.nodeSize([ NODE_HEIGHT, NODE_WIDTH ]); // turn 90deg CCW

    tree.children(getVisibleChildren);

    // tree.size([
    //     HEIGHT - 2 * PADDING,
    //     WIDTH  - 2 * PADDING
    // ]);

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
    }
}



function fillScrollRange(data) {
    
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
            sr.from = Math.min(sr.from, child.y);
            sr.to   = Math.max(sr.to,   child.y);
        });
    }

}



// ==== Update ====

    function update(data, deferResize) {
        
        var nodes = tree.nodes(data);
        var links = tree.links(nodes);

        var minY = 0;
        var maxY = 0;
        var minX = 0;
        var maxX = 0;

        nodes.forEach(function(datum) {

            // fixed distance between columns (since tree is turned 90deg CCW)
            // datum.y = datum.depth * 75;

            // turn 90deg CCW
            var swap = datum.x;
            datum.x = datum.y;
            datum.y = swap;

            // find range
            maxY = Math.max(maxY, datum.y);
            minY = Math.min(minY, datum.y);
            maxX = Math.max(maxX, datum.x);
            minX = Math.min(minX, datum.x);

            // reset scrollRange
            datum.fd3Data.scrollRange.from = datum.y;
            datum.fd3Data.scrollRange.to   = datum.y;

        });

        fillScrollRange(data);

        // canvas size

        newRect = {
            x: PADDING,
            y: PADDING - minY,
            width:  maxX - minX + 2 * (NODE_WIDTH  + PADDING),
            height: maxY - minY + 2 * (NODE_HEIGHT + PADDING)
        };

        if (!deferResize || !mouseOver) { // TODO: refactor
            resize();
        }

        updateLinks(links);
        updateNodes(nodes, data);

    }


    function updateLinks(links) {

        var linksSelection = canvas.select('g.links').selectAll('path.link')
            .data(links, function(d) { return idByDatum(d.target); });

        linksSelection.attr('d', lineGenerator);

        linksSelection.enter().append('svg:path')
            .attr('class', 'link')
            .attr('d', lineGenerator);

        linksSelection.exit().remove();

    }


    function updateNodes(nodes, data) {

        var nodesSelection = canvas.select('g.nodes').selectAll('g.node').data(nodes, idByDatum);

        nodesSelection.attr('transform', function(datum) {
            return 'translate(' + datum.x + ',' + datum.y + ')';
        });

        var nodeGroup = nodesSelection.enter().append('svg:g')
            .attr('class', getNodeClass)
            .attr('transform', function(datum) {
                return 'translate(' + datum.x + ',' + datum.y + ')';
            });
        nodesSelection.exit().remove();

        nodeGroup.append('svg:circle')
            .attr('r', NODE_HEIGHT / 3.0)
            .on('click', function(datum) {
                toggleChildren(datum);
                update(data, true);
            });

        nodeGroup.append('svg:text')

            // .attr('class', function(datum) {
            //     return (datum.fd3Data.children.visible.length > 0) ? '' : 'final';
            // })

            // .attr('x', function(datum) {
            //     return 0.5 * NODE_HEIGHT * (datum.fd3Data.children.visible.length > 0) ? -1 : 1;
            // })
            .attr('x', -0.5 * NODE_HEIGHT)

            .text(function(datum) {
                return datum.fd3Data.name || datum.fd3Data.value;
            });

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
        .attr("version", 1.1)
        .attr("xmlns", "http://www.w3.org/2000/svg");
    resizeSvgWidth();

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
                return propName + ":" + properties[propName];
            }).join(";") +
        '}';
        document.getElementsByTagName('head')[0].appendChild(style);
    }

    function isObject(obj) {
        var type = typeof obj;
        return type === 'function' || type === 'object' && !!obj;
    }

// =================