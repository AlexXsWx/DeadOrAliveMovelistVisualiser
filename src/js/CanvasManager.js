define('CanvasManager', ['Tools'], function CanvasManager(_) {

    var SCROLLBAR_SIZE = 20;

    return { create: create };

    function create(rootNode, padding) {

        var svg;
        var canvas;
        var linksParent;
        var nodesParent;

        rootNode.appendChild(
            svg = _.createSvgElement({
                tag: 'svg',
                attributes: {
                    'version': 1.1,
                    'xmlns': 'http://www.w3.org/2000/svg'
                },
                children: [
                    canvas = _.createSvgElement({
                        tag: 'g',
                        classes: [ 'canvas' ],
                        children: [
                            linksParent = _.createSvgElement({ tag: 'g', classes: [ 'links' ] }),
                            nodesParent = _.createSvgElement({ tag: 'g', classes: [ 'nodes' ] })
                        ]
                    })
                ]
            })
        );

        return {
            svg:         svg,
            canvas:      canvas,
            linksParent: linksParent,
            nodesParent: nodesParent,

            normalize:                   normalize,
            scrollToSvgNodeViewIfNeeded: scrollToSvgNodeViewIfNeeded
        };

        function normalize(offsetX, offsetY, totalWidth, totalHeight) {

            canvas.setAttribute(
                'style',
                'transform: translate(' +
                    (padding + offsetX) + 'px,' +
                    (padding + offsetY) + 'px' +
                ')'
            );

            var body = document.body;

            var width  = totalWidth  + 2 * padding;
            var height = totalHeight + 2 * padding;

            // I hate CSS...
            var menuTheoreticMaxWidth = 375;
            width += menuTheoreticMaxWidth;

            // Keep it screen size to avoid culling when svg animates shrinking
            width  = Math.max(body.clientWidth  - SCROLLBAR_SIZE, width);
            height = Math.max(body.clientHeight - SCROLLBAR_SIZE, height);

            svg.setAttribute('width',  width);
            svg.setAttribute('height', height);

        }

        function scrollToSvgNodeViewIfNeeded(nodeSvgView, offsetY) {
            // TODO: animate
            var nodeRootRelativeY = nodeSvgView.getPositionTarget().y;
            var nodeCenterDocumentY = nodeRootRelativeY - offsetY + padding;
            var body = document.body;
            if (body.scrollTop + padding > nodeCenterDocumentY) {
                body.scrollTop = nodeCenterDocumentY - padding;
            } else
            if (body.scrollTop + body.clientHeight - padding - SCROLLBAR_SIZE < nodeCenterDocumentY) {
                body.scrollTop = nodeCenterDocumentY - (body.clientHeight - padding - SCROLLBAR_SIZE);
            }
        }

    }

});
