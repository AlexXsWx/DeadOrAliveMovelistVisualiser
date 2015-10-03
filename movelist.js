// http://techslides.com/save-svg-as-an-image

var WIDTH  = 768;
var HEIGHT = 8192;

var PADDING = 50;


var RGX_PUNCH = /^\d*p(?:\+k)?$/i;
var RGX_KICK  = /(?:h\+)?k$/i;
var RGX_HOLD  = /^\d+h$/i;
var RGX_THROW = /^\d*t$/i;


var canvas;

var tree;
var lineGenerator;


(function() {

    var preparedData = d3fyJson(data.rig, 'rig');

    main(
        document.getElementById('content'),
        preparedData
    );

}());



// ==== Styles ====

    function initStyles() {
        initLinkStyles();
        initNodeStyles();
    }

    function initLinkStyles() {
        addStyle('path.link', {
            fill: 'none',
            stroke: '#777'
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
            'font-weight': 'bold',
            // 'font-style': 'italic',
            'text-anchor': 'middle',
            'dominant-baseline': 'central',
            'fill': 'white',
            'text-shadow': '0 0 2px black',
            'pointer-events': 'none'
        });
    }

// ================



function d3fyJson(json, name, counter) {

    if (!counter) counter = { value: 0 };

    var result = {
        name: name,
        hiddenChildren: null,
        children: null,
        id: counter.value++
        // value: undefined
    };

    if (!isObject(arguments[0])) {
        result.value = arguments[0];
        return result;
    }

    var propNames = Object.getOwnPropertyNames(json);

    if (propNames.length > 0) { // FIXME: edgecase - 'meta' is the only property
        result.children = [];

        propNames.forEach(function(propName) {
            if (propName === 'meta') {
                result.value = json[propName];
            } else {
                result.children.push(
                    d3fyJson(json[propName], propName, counter)
                );
            }
        });

    }

    return result;
}



function main(rootNode, data) {

    canvas = createCanvas(rootNode, WIDTH, HEIGHT, PADDING);

    initGenerators();
    initStyles();

    update(data);

}


function idByDatum(datum) {
    return datum.id;
}



function initGenerators() {

    tree = d3.layout.tree();
    tree.size([
        HEIGHT - 2 * PADDING,
        WIDTH  - 2 * PADDING
    ]);
    tree.separation(function(a, b) {
        return 1;
    });


    lineGenerator = d3.svg.diagonal()
        .projection(function(d) {
            return [ d.y, d.x ];
        });
        // .line()
        // .x(function(datum) { return datum.x; })
        // .y(function(datum) { return datum.y; })
        // .interpolate('linear');

}



function update(data) {
    
    var nodes = tree.nodes(data);
    var links = tree.links(nodes);

    // fixed distance between columns (since tree is turned 90deg CCW)
    nodes.forEach(function(datum) { datum.y = datum.depth * 75; });


    // links

    var linksSelection = canvas.select('g.links').selectAll('path.link')
        .data(links, function(d) { return idByDatum(d.target); });

    linksSelection.attr('d', lineGenerator);

    linksSelection.enter().append('svg:path')
        .attr('class', 'link')
        .attr('d', lineGenerator);

    linksSelection.exit().remove();


    // nodes

    var nodesSelection = canvas.select('g.nodes').selectAll('g.node').data(nodes, idByDatum);

    nodesSelection.attr('transform', function(datum) {
        return 'translate(' + datum.y + ',' + datum.x + ')';
    });

    var nodeGroup = nodesSelection.enter().append('svg:g')
        .attr('class', getNodeClass)
        .attr('transform', function(datum) {
            return 'translate(' + datum.y + ',' + datum.x + ')';
        });
    nodesSelection.exit().remove();

    nodeGroup.append('svg:circle')
        .attr('r', 20)
        .on('click', function(datum) {
            toggleChildren(datum);
            console.log(datum);
            // console.log(data);
            update(data);
        });

    nodeGroup.append('svg:text')
        .text(function(datum) {
            return datum.name || datum.value;
        });

}



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



function createCanvas(rootNode, width, height, padding) {

    var svg = d3.select(rootNode).append('svg:svg')
        .attr("version", 1.1)
        .attr("xmlns", "http://www.w3.org/2000/svg")
        .attr('width',  width)
        .attr('height', height);

    var canvas = svg.append('svg:g')
        .attr('transform', 'translate(' + padding + ',' + padding + ')');

    canvas.append('svg:g').attr('class', 'links');
    canvas.append('svg:g').attr('class', 'nodes');
        
    return canvas;

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