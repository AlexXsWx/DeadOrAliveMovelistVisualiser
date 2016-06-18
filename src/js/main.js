requirejs.config({
    baseUrl: 'js',
    paths: {
        d3:           '../../lib/d3/3.5.6/d3.min',
        SmoothScroll: '../../lib/SmoothScroll/1.4.0/SmoothScroll'
    }
});

requirejs(

    ['Movelist', 'SmoothScroll', 'Tools'],

    function Main(Movelist, SmoothScroll, _) {

        init();

        function init() {
            initSmoothScroll();
            Movelist.init(document.getElementById('content'));
        }

        function initSmoothScroll() {

            SmoothScroll({
                animationTime: 500, // 800
                stepSize: 100, // 80
                pulseScale: 8,
                accelerationDelta: 10, // 20
                accelerationMax: 1,
            });

            _.getDomElement('smoothScroll').addEventListener('change', function(event) {
                var checkbox = this;
                if (checkbox.checked) {
                    // TODO: uncomment once SmoothScroll is updated
                    // SmoothScroll.start();
                } else {
                    SmoothScroll.destroy();
                    checkbox.setAttribute('disabled', true);
                }
            });

        }

    }

);