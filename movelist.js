function renderMoveList(container, data) {

    var svg = createSVGElement("svg", {
        width:  "100%",
        height: "100%" // 4096
    });

    var tree = createTree(data.rig.std);
    positionTree(tree);
    svg.appendChild(tree);

    container.appendChild(svg);

}


function positionTree(rootNode) {
    var offsetY = 0;
    for (var i = 0; i < rootNode.children.length; ++i) {
        console.log(i);
        translate(rootNode.children[i], 0, offsetY);
        offsetY += 20;
        // if (child.children.length > 0) {
        //     positionTree(child);
        // }
    }
}


function createTree(data) {
    var group = createSVGElement("g");
    for (var key in data) {
        var node = nodeForDataKey(key, data[key]);
        group.appendChild(node);

    }
    return group;
}


function nodeForDataKey(key, value) {
    var group = createSVGElement("g");
    var node = nodeFromInput(key);
    group.appendChild(node);
    if (isObject(value)) {
        var branch = createTree(value);
        group.appendChild(branch);
    } /*else {
        createText(" - " + value, x + stepX, localOffsetY)
    }*/
    return group;
}


function nodeFromInput(input, data) {
    var group = createSVGElement("g");
    group.appendChild(createCircle(0, 0, 10));
    group.appendChild(createText(input || "_"));
    return group;
}


function createGroup(parent) {
    var group = createSVGElement("g");
    parent.appendChild(groupd);
}


function createText(label, x, y) {
    var text = createSVGElement("text", {
        x: x || 0,
        y: y || 0,
        fill: "black",
        style: (
            "dominant-baseline: middle; " + // central?
            "fill: red"
        ),
        // "text-anchor": "middle"
    });
    text.appendChild(document.createTextNode(label));
    return text;
}


function createCircle(x, y, radius, fillColor, strokeColor, strokeWidth) {
    return createSVGElement("circle", {
        "cx": x || 0,
        "cy": y || 0,
        "r": radius || 0,
        "fill": fillColor || "white",
        "stroke": "strokeColor",
        "stroke-width": defined(strokeWidth, 1)
    });
}


function createLine(parent, x1, y1, x2, y2) {
    return createSVGElement("line", {
        x1: x1,
        y1: y1,
        x2: x2,
        y2: y2,
        style: "stroke: rgba(0, 0, 0, 0.25); stroke-width: 1"
    });
}


function createSVGElement(name, properties)
{
    var element = document.createElementNS("http://www.w3.org/2000/svg", name);
    if (isObject(properties)) {
        for (propName in properties) {
            element.setAttribute(propName, properties[propName]);
        }
    }
    return element;
}


function position(element, x, y) {
    element.setAttribute("x", x);
    element.setAttribute("y", y);
}


function translate(element, x, y) {
    element.style.transform = "translate(" + x + ", " + y  + ")";
}


function isObject(obj) {
    return Object(obj) === obj;
}


function defined(/* arguments */) {
    for (argument in arguments) {
        if (argument !== undefined) {
            return argument;
        }
    }
}