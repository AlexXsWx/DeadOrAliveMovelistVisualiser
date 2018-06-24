(function() {

    requirejs.config({
        baseUrl: 'js',
        paths: {
            d3:           '../../lib/d3/3.5.6/d3.min',
            SmoothScroll: '../../lib/SmoothScroll/1.4.0/SmoothScroll'
        },
        onNodeCreated: createLoadingProgressUpdater(
            getDomElement('loading-loaded'),
            getDomElement('loading-amount')
        )
    });

    // TODO: localize html
    // TODO: localize editors (button labels and placeholders "e.g.")
    // TODO: logger with log levels
    // FIXME: datalist multiple options

    requirejs(

        ['Core', 'SmoothScrollManager'],

        function Main(Core, SmoothScrollManager) {

            SmoothScrollManager.init(getDomElement('smoothScroll'));

            Core.init(getDomElement('content'));

        }

    );

    return;

    // Loading progress updater

    function createLoadingProgressUpdater(elementLoaded, elementAmount) {

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
            console.error('Failed to load module ' + moduleName);
        }

        function updateFeedback() {
            setTextContent(elementLoaded, loaded);
            setTextContent(elementAmount, amount);
        }

        function setTextContent(element, text) {
            element.innerHTML = '';
            element.appendChild(document.createTextNode(text));
        }
    }

    // Tools

    function getDomElement(id) {
        var result = document.getElementById(id);
        console.assert(Boolean(result), 'element #"' + id + '" not found');
        return result;
    }

}());
