(function() {

    startRequireJS();
    return;

    function startRequireJS() {

        requirejs.config({
            baseUrl: 'js',
            onNodeCreated: createLoadingProgressUpdater(
                getDomElement('loading-loaded'),
                getDomElement('loading-amount')
            )
        });

        requirejs(['fsdc/FSDCMain'], function start(FSDCMain) {
            hideDomElement(getDomElement('loading'));
            FSDCMain.init();
        });

    }

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

    function hideDomElement(element) {
        element.classList.add('hidden');
    }

}());
