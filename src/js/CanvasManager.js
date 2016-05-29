define('CanvasManager', ['Tools'], function(_) {

    return { create: create };

    function create(rootNode, padding) {

        var canvas = _.createSvgElement({
            tag: 'g',
            classes: [ 'canvas' ]
        });

        var svg = _.createSvgElement({
            tag: 'svg',
            attributes: {
                'version': 1.1,
                'xmlns': 'http://www.w3.org/2000/svg'
            },
            children: [ canvas ]
        });

        var linksParent = _.createSvgElement({
            tag: 'g',
            classes: [ 'links' ]
        });

        var nodesParent = _.createSvgElement({
            tag: 'g',
            classes: [ 'nodes' ]
        });

        canvas.appendChild(linksParent);
        canvas.appendChild(nodesParent);

        rootNode.appendChild(svg);

        return {
            svg: svg,
            canvas: canvas,
            linksParent: linksParent,
            nodesParent: nodesParent,
            normalize: normalizeCanvas.bind(null, svg, canvas)
        };

        function normalizeCanvas(svg, canvas, offsetX, offsetY, totalWidth, totalHeight) {
            canvas.setAttribute(
                'style',
                'transform: translate(' +
                    (padding + offsetX) + 'px,' +
                    (padding + offsetY) + 'px' +
                ')'
            );
            // FIXME
            var body = document.body;
            svg.setAttribute('width',  Math.max(totalWidth  + 2 * padding, body.clientWidth  - 20));
            svg.setAttribute('height', Math.max(totalHeight + 2 * padding, body.clientHeight - 20));
        }

    }

});