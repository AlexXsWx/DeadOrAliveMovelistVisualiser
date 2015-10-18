requirejs.config({
    baseUrl: 'js',
    paths: {
        d3:           '../../lib/d3/3.5.6/d3.min',
        SmoothScroll: '../../lib/SmoothScroll/1.4.0/SmoothScroll'
    }
});

requirejs(

    // '../../data/rig',
    ['movelist', 'SmoothScroll'],

    function(movelist, SmoothScroll) {

        // debugger;

        SmoothScroll({
            animationTime: 500, // 800
            stepSize: 100, // 80
            pulseScale: 8,
            accelerationDelta: 10, // 20
            accelerationMax: 1,
        });

        movelist.init(document.getElementById('content'), data);

    }

);