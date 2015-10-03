// http://techslides.com/save-svg-as-an-image

var WIDTH  = 768;
var HEIGHT = 8192;

var PADDING = 50;

var RGX_PUNCH = /^\d*p(?:\+k)?$/i;
var RGX_KICK  = /(?:h\+)?k$/i;
var RGX_HOLD  = /^\d+h$/i;
var RGX_THROW = /^\d*t$/i;

// var data = {
//     a: {
//         b: {
//             c: 4,
//             d: 8
//         }
//     }
// };



main(data.rig, 'rig');



function main(data, rootName) {

    var modifiedData = d3fyJson(data, rootName);


    var tree = d3.layout.tree();
    tree.size([
        HEIGHT - 2 * PADDING,
        WIDTH  - 2 * PADDING
    ]);
    tree.separation(function(a, b) {
        return 1;
    });

    var nodes = tree.nodes(modifiedData);
    var links = tree.links(nodes);

    // fixed distance between columns (since tree is turned 90deg CCW)
    nodes.forEach(function(datum) { datum.y = datum.depth * 75; });


    var svg = d3.select('body div#content')
        .append('svg:svg')
            .attr("version", 1.1)
            .attr("xmlns", "http://www.w3.org/2000/svg")
            .attr('width', WIDTH)
            .attr('height', HEIGHT);

    var canvas = svg.append('svg:g')
        .attr('transform', 'translate(' + PADDING + ',' + PADDING + ')');

    var lineGenerator = d3.svg.diagonal()
        .projection(function(d) {
            return [ d.y, d.x ];
        });
        // .line()
        // .x(function(datum) { return datum.x; })
        // .y(function(datum) { return datum.y; })
        // .interpolate('linear');


    addStyle('path.link', {
        fill: 'none',
        stroke: 'black'
    });

    var linksSelection = canvas.selectAll('path.link').data(links);
    linksSelection.enter().append('svg:path')
        .attr('class', 'link')
        .attr('d', lineGenerator);
    // linksSelection.exit().remove();


    addStyle('g.node circle', {
        fill: 'white'
        // stroke: 'black'
    });
    addStyle('g.node.punch circle', { fill: '#ffffaa' });
    addStyle('g.node.kick circle',  { fill: '#ffaaaa' });
    addStyle('g.node.hold circle',  { fill: '#aaffaa' });
    addStyle('g.node.throw circle', { fill: '#aaaaff' });

    addStyle('g.node text', {
        'text-anchor': 'middle',
        'dominant-baseline': 'central',
        'text-shadow': '0 0 5px white'
    });

    var nodesSelection = canvas.selectAll('g.node').data(nodes);

    var nodeGroup = nodesSelection.enter().append('svg:g')
        .attr('class', getNodeClass)
        .attr('transform', function(datum) {
            return 'translate(' + datum.y + ',' + datum.x + ')';
        });

    // nodesSelection.exit().remove();

    nodeGroup.append('svg:circle')
        .attr('r', 15)
        .on('click', function(datum) { console.log(datum); toggleChildren(datum); });

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



function d3fyJson(json, name) {

    var result = {
        name: name,
        hiddenChildren: null
        // children: undefined
        // value: undefined
    };

    if (!isObject(arguments[0])) {
        result.value = arguments[0];
        return result;
    }

    var propNames = Object.getOwnPropertyNames(json);

    if (propNames.length > 0) {

        result.children = [];

        propNames.forEach(function(propName) {
            if (propName == 'meta') {
                result.value = json[propName];
            } else {
                result.children.push(
                    d3fyJson(json[propName], propName)
                );
            }
        });

    }

    return result;
}



function isObject(obj) {
    var type = typeof obj;
    return type === 'function' || type === 'object' && !!obj;
}