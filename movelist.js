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


main( document.getElementById('content'), data, 'rig' );



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
            name: name,
            hiddenChildren: null,
            children: null,
            id: counter++,
            value: null
        };
    }
    
}



function main(parentElement, dataRoot, dataRootName) {

    var data = prepareData(dataRoot[dataRootName], dataRootName);

    createCanvas(parentElement);

    bindDeferredResize();

    initGenerators();
    initStyles();

    update(data, false);

    data.meta && showAbbreviations(data.meta.abbreviations);

}



function prepareData(dataRoot, rootName) {
    var generateNode = createNodeGenerator();
    var preparedData = prepareJson(dataRoot, rootName, generateNode);
    preparedData.children.concat(preparedData.hiddenChildren || []).forEach(function(stance) {
        groupByType(stance, generateNode);
    });
    return preparedData;
}



function prepareJson(json, name, generateNode) {

    var result = generateNode(name);

    if (!isObject(arguments[0])) {
        result.value = arguments[0];
        return result;
    }

    var propNames = Object.getOwnPropertyNames(json);

    if (propNames.length > 0) { // FIXME: edgecase - 'meta' is the only property

        result.children = [];

        propNames.forEach(function(propName) {
            // if (!propName) return;
            if (propName === 'meta') {
                result.value = json[propName];
            } else {
                result.children.push(
                    prepareJson(json[propName], propName, generateNode)
                );
            }
        });

    }

    return result;
}



function groupByType(parent, generateNode) {

    var byType = {
        'punches': [],
        'kicks':   [],
        'throws':  [],
        'holds':   [],
        'other':   []
    }

    parent.children.concat(parent.hiddenChildren || []).forEach(function(child) {

       var meta = child.value;

        if (isObject(meta) && meta.type != undefined) {
            if (meta.type === 'special') {
                byType['other'].push(child);
            } else {
                console.error('Unsupported meta type: %s', meta.type);
            }
        } else {
            if (RGX_PUNCH.test(child.name)) { byType[ 'punches' ].push(child); } else
            if (RGX_KICK.test(child.name))  { byType[ 'kicks'   ].push(child); } else
            if (RGX_HOLD.test(child.name))  { byType[ 'holds'   ].push(child); } else
            if (RGX_THROW.test(child.name)) { byType[ 'throws'  ].push(child); } else {
                byType['other'].push(child);
            }
        }

    });

    parent.hiddenChildren = parent.children.concat(parent.hiddenChildren || []);
    parent.children = [];

    for (type in byType) {
        var children = byType[type];
        if (children.length < 1) continue;
        var child = generateNode('<' + type + '>');
        child.hiddenChildren = children;
        parent.children.push(child);
    }

}



function resize() {
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
    return datum.id;
}



function initGenerators() {

    tree = d3.layout.tree();

    tree.nodeSize([ NODE_HEIGHT, NODE_WIDTH ]); // turn 90deg CCW

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

        });

        // canvas size

        newRect = {
            x: PADDING,
            y: PADDING - minY,
            width:  maxX - minX + 2 * (NODE_WIDTH  + PADDING),
            height: maxY - minY + 2 * (NODE_HEIGHT + PADDING)
        };

        if (!deferResize || !mouseOver) {
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
            //     return datum.children && datum.children.length ? '' : 'final';
            // })

            // .attr('x', function(datum) {
            //     return 0.5 * NODE_HEIGHT * datum.children && datum.children.length ? -1 : 1;
            // })
            .attr('x', -0.5 * NODE_HEIGHT)

            .text(function(datum) {
                return datum.name || datum.value;
            });

    }

// ================



function getNodeClass(datum, index) {
    var classList = ['node'];
    if (isObject(datum.value) && datum.value.type != undefined) {

    } else {
        if (RGX_PUNCH.test(datum.name)) { classList.push('punch'); } else
        if (RGX_KICK.test(datum.name))  { classList.push('kick');  } else
        if (RGX_HOLD.test(datum.name))  { classList.push('hold');  } else
        if (RGX_THROW.test(datum.name)) { classList.push('throw'); }
    }
    return classList.join(' ');
}



function toggleChildren(datum) {
    var temp = datum.hiddenChildren;
    datum.hiddenChildren = datum.children;
    datum.children = temp;
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