requirejs.config({
    baseUrl: 'js',
    paths: {
        d3:           '../../lib/d3/3.5.6/d3.min',
        SmoothScroll: '../../lib/SmoothScroll/1.4.0/SmoothScroll'
    }
});

// TODO: localize html
// TODO: localize editors (button labels and placeholders "e.g.")
// TODO: logger with log levels
// FIXME: datalist multiple options

requirejs(

    ['Movelist', 'SmoothScrollManager', 'Tools'],

    function Main(Movelist, SmoothScrollManager, _) {

        SmoothScrollManager.init(_.getDomElement('smoothScroll'));

        Movelist.init(_.getDomElement('content'));

    }

);
