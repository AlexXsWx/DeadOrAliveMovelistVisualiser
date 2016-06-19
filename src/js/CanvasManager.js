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
            normalize: normalize
        };

        function normalize(offsetX, offsetY, totalWidth, totalHeight) {

            canvas.setAttribute(
                'style',
                'transform: translate(' +
                    (padding + offsetX) + 'px,' +
                    (padding + offsetY) + 'px' +
                ')'
            );

            // FIXME
            var body = document.body;

            var width  = totalWidth  + 2 * padding;
            var height = totalHeight + 2 * padding;

            // I hate CSS...
            var menuTheoreticMaxWidth = 375;
            width += menuTheoreticMaxWidth;

            // Keep it screen size to avoid culling when svg animates shrinking
            var scrollBarSize = 20;
            width  = Math.max(body.clientWidth  - scrollBarSize, width);
            height = Math.max(body.clientHeight - scrollBarSize, height);

            svg.setAttribute('width',  width);
            svg.setAttribute('height', height);

        }

    }

});