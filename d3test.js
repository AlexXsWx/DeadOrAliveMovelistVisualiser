// http://techslides.com/save-svg-as-an-image

var WIDTH = 768;
var HEIGHT = 4096;
var PADDING = 50;

// var data = {
//     a: {
//         b: {
//             c: 4,
//             d: 8
//         }
//     }
// };



main(data.rig.std, 'std');



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


    var svg = d3.select('body div#content')
        .append('svg:svg')
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


    var linksParent = canvas.append('svg:g')
        .attr('fill', 'none')
        .attr('stroke', 'black');

    var linksSelection = linksParent.selectAll('path').data(links);
    linksSelection.enter().append('svg:path').attr('d', lineGenerator);
    // linksSelection.exit().remove();


    var nodesParent = canvas.append('svg:g');

    var nodesSelection = nodesParent.selectAll('circle').data(nodes);

    var nodeGroup = nodesSelection.enter().append('svg:g')
        .attr('transform', function(datum) {
            return 'translate(' + datum.y + ',' + datum.x + ')';
        });

    // nodesSelection.exit().remove();

    nodeGroup.append('svg:circle')
        .attr('fill', '#aaffaa') // TODO: style
        .attr('r', 25)
        .on('click', function(datum) { console.log(datum); toggleChildren(datum); });

    nodeGroup.append('svg:text')
        .attr('fill', 'black') // TODO: style
        .attr('text-anchor', 'middle') // style?
        .attr('style', 'dominant-baseline: middle') // central? // TODO: style
        .text(function(datum) {
            return datum.name;
        });

}


function toggleChildren(datum) {
    var temp = datum.hiddenChildren;
    datum.hiddenChildren = datum.children;
    datum.children = temp;
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
            result.children.push(
                d3fyJson(json[propName], propName)
            );
        });

    }

    return result;
}



function isObject(obj) {
    var type = typeof obj;
    return type === 'function' || type === 'object' && !!obj;
}