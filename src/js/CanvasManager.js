define('CanvasManager', ['d3'], function() {

    return { create: create };

    function create(rootNode) {

        svg = d3.select(rootNode).append('svg:svg')
            .attr('version', 1.1)
            .attr('xmlns', 'http://www.w3.org/2000/svg');

        canvas = svg.append('svg:g').attr('class', 'canvas');

        return {
            svg: svg,
            canvas: canvas,
            normalize: normalizeCanvas.bind(null, svg, canvas)
        };

    }

    function normalizeCanvas(svg, canvas, offsetX, offsetY, totalWidth, totalHeight) {
        canvas.attr('style', 'transform: translate(' + offsetX + 'px,' + offsetY + 'px)');
        svg
            // FIXME
            .attr('width',  Math.max(totalWidth,  document.body.clientWidth  - 5))
            .attr('height', Math.max(totalHeight, document.body.clientHeight - 5));
    }

})