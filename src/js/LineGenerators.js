define('LineGenerators', ['d3'], function(d3) {

    return {
        createTurnedDiagonalLineGenerator: createTurnedDiagonalLineGenerator,
        createStraightLineGenerator:       createStraightLineGenerator
    };

    function createTurnedDiagonalLineGenerator() {

        return d3.svg.diagonal()

            .source(function(obj) {
                return {
                    x: obj.source.y,
                    y: obj.source.x
                };
            })

            .target(function(obj) {
                return {
                    x: obj.target.y,
                    y: obj.target.x
                };
            })

            .projection(function(d) {
                return [ d.y, d.x ];
            });

    }

    function createStraightLineGenerator() {
        var line = d3.svg.line()
            .x(function(datum) { return datum.x; })
            .y(function(datum) { return datum.y; })
            .interpolate('linear');

        return function(datum, index) { 
            return line([datum.source, datum.target]);
        };
    }

});