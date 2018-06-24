requirejs.config({
    baseUrl: 'js',
    paths: {
        d3:           '../../lib/d3/3.5.6/d3.min',
        SmoothScroll: '../../lib/SmoothScroll/1.4.0/SmoothScroll'
    },
    onNodeCreated: createLoadingCounter()
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

//

function createLoadingCounter() {

    var domCache = {
        loaded: document.getElementById('loading-loaded'),
        amount: document.getElementById('loading-amount')
    };

    var loaded = 0;
    var amount = 0;

    return onNodeCreated;

    function onNodeCreated(node, config, moduleName, url) {
        onModuleAboutToBeLoaded(moduleName);
        node.addEventListener('load',  function(event) { onModuleLoaded(moduleName); });
        node.addEventListener('error', function(event) { onModuleFailedToLoad(moduleName); });
    }

    function onModuleAboutToBeLoaded(moduleName) {
        amount++;
        updateFeedback();
    }

    function onModuleLoaded(moduleName) {
        loaded++;
        updateFeedback();
    }

    function onModuleFailedToLoad(moduleName) {
        console.error('module ' + moduleName + ' could not be loaded');
    }

    function updateFeedback() {
        setTextContent(domCache.loaded, loaded);
        setTextContent(domCache.amount, amount);
    }

    function setTextContent(element, text) {
        element.innerHTML = '';
        element.appendChild(document.createTextNode(text));
    }
}
