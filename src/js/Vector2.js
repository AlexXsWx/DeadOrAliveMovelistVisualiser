define('Vector2', [], function Vector2() {

    return {
        create: create
    };

    function create(x, y) {
        return {
            x: x,
            y: y
        };
    }

});