// http://techslides.com/save-svg-as-an-image

var PADDING = 50;
var NODE_WIDTH  = 100;
var NODE_HEIGHT = 25;


var RGX_PUNCH = /^\d*p(?:\+k)?$/i;
var RGX_KICK  = /(?:h\+)?k$/i;
var RGX_HOLD  = /^\d+h$/i;
var RGX_THROW = /^\d*t$/i;


var svg;
var canvas;

var tree;
var lineGenerator;


(function() {

    var preparedData = prepareJson(data.rig, 'rig');

    main(
        document.getElementById('content'),
        preparedData
    );

    var table = d3.select('#abbreviations');

    for (name in data.meta.abbreviations) {
        var row = table.append('tr');
        row.append('td').text(name);
        row.append('td').text(data.meta.abbreviations[name]);
    }

}());



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



function prepareJson(json, name, generateNode, categorize) {

    if (categorize === undefined) categorize = 1;
    if (!generateNode) generateNode = createNodeGenerator();

    var result = generateNode(name);

    if (!isObject(arguments[0])) {
        result.value = arguments[0];
        return result;
    }

    var propNames = Object.getOwnPropertyNames(json);

    if (propNames.length > 0) { // FIXME: edgecase - 'meta' is the only property

        result.children = [];

        if (categorize === 0) {

            var categorized = {
                'punches': [],
                'kicks':   [],
                'throws':  [],
                'holds':   [],
                'other':   []
            }

            propNames.forEach(function(propName) {

                var wrapped = { name: propName, value: json[propName] };
                var meta = wrapped.value.meta;

                if (isObject(meta) && meta.type != undefined) {
                    if (meta.type === 'special') {
                        categorized['other'].push(wrapped);
                    } else {
                        console.error('Unsupported meta type: %s', meta.type);
                    }
                } else {
                    if (RGX_PUNCH.test(propName)) { categorized[ 'punches' ].push(wrapped); } else
                    if (RGX_KICK.test(propName))  { categorized[ 'kicks'   ].push(wrapped); } else
                    if (RGX_HOLD.test(propName))  { categorized[ 'holds'   ].push(wrapped); } else
                    if (RGX_THROW.test(propName)) { categorized[ 'throws'  ].push(wrapped); } else {
                        categorized['other'].push(wrapped);
                    }
                }

            });

            for (key in categorized) {
                if (categorized[key].length < 1) continue;
                var child = generateNode('<' + key + '>');
                child.hiddenChildren = categorized[key].map(function(raw) {
                    return prepareJson(raw.value, raw.name, generateNode, -1);
                });
                result.children.push(child);
            }

        } else {

            propNames.forEach(function(propName) {
                // if (!propName) return;
                if (propName === 'meta') {
                    result.value = json[propName];
                } else {
                    result.children.push(
                        prepareJson(json[propName], propName, generateNode, categorize - 1)
                    );
                }
            });

        }

    }

    return result;
}



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
    };
}



function main(rootNode, data) {

    createCanvas(rootNode);

    initGenerators();
    initStyles();

    update(data);

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

    function update(data) {
        
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

        canvas.attr('transform', 'translate(' + PADDING + ',' + (PADDING - minY) + ')');

        svg
            .attr('width',  maxX - minX + 2 * (NODE_WIDTH  + PADDING))
            .attr('height', maxY - minY + 2 * (NODE_HEIGHT + PADDING));

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
                update(data);
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

    canvas = svg.append('svg:g');

    canvas.append('svg:g').attr('class', 'links');
    canvas.append('svg:g').attr('class', 'nodes');

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