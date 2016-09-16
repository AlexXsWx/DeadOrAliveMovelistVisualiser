define('Analyser', ['Filter', 'Tools'], function Analyser(Filter, _) {

    var domCache = {
        popupFilterResult: null,
        filterOutput: null
    };

    return {
        init: init,
        findForceTechMoves: findForceTechMoves
    };

    function init() {
        domCache.popupFilterResult = _.getDomElement('popupFilterResult');
        domCache.filterOutput      = _.getDomElement('filterOutput');
        _.getDomElement('closeFilterResult').addEventListener('click', onButtonCloseFilterResult);
    }

    function findForceTechMoves(rootNodeData) {
        var advantage = +prompt('Your advantage (frames): e.g. "51"');
        if (advantage) {
            var result = Filter.findNodes(rootNodeData, advantage + 1, canMoveForceTech);
            _.setTextContent(domCache.filterOutput, advantage + 'f:\n' + result);
            _.showDomElement(domCache.popupFilterResult);
        }
    }

    function canMoveForceTech(nodeData) {

        var input = nodeData.input;

        // Exclude holds and throws
        // FIXME: some throws can grab grounded opponent
        if (input.match(/(46|7|4|6|1)h/i) || input.match(/t/i)) {
            return false;
        }

        for (var i = 0; i < nodeData.actionSteps.length; ++i) {
            var actionMask = nodeData.actionSteps[i].actionMask;
            if (
                !actionMask ||
                actionMask.search('high') >= 0
            ) {
                return false;
            }
        }

        return true;

    }

    function onButtonCloseFilterResult(optEvent) {
        _.hideDomElement(domCache.popupFilterResult);
    }

});