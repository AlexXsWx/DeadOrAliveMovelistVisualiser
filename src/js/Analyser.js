define('Analyser', ['Filter', 'Tools', 'NodeFactory'], function Analyser(Filter, _, NodeFactory) {

    var domCache = {
        popupFilterResult: null,
        filterOutput: null
    };

    return {
        init: init,
        findForceTechMoves: findForceTechMoves,
        findMoves: findMoves
    };

    function init() {
        domCache.popupFilterResult = _.getDomElement('popupFilterResult');
        domCache.filterOutput      = _.getDomElement('filterOutput');
        _.getDomElement('closeFilterResult').addEventListener('click', onButtonCloseFilterResult);
    }

    function findForceTechMoves(rootNodeData) {
        var advantage = +prompt('Your advantage (frames): e.g. "51"');
        if (advantage) {
            var vulnerabilityStarts = advantage + 1;
            var vulnerabilityEnds   = vulnerabilityStarts;
            doFindMoves(
                rootNodeData,
                vulnerabilityStarts,
                vulnerabilityEnds,
                NodeFactory.canMoveHitGround
            );
        }
    }

    function findMoves(rootNodeData) {
        var input = prompt('Your frames to land on: e.g. "17-19"');
        if (input) {
            var parts = input.match(/\d+/g);
            if (parts) {
                var startFrame = Number(parts[0]);
                var endFrame = (parts.length > 1) ? Number(parts[1]) : startFrame;
                doFindMoves(
                    rootNodeData, startFrame, endFrame,
                    function(nodeData) { return !NodeFactory.isMoveHoldOnly(nodeData); }
                );
            }
        }
    }

    function doFindMoves(rootNodeData, frameStart, frameEnd, filterFunc) {
        var warnings = {};
        var result = Filter.findNodes(
            rootNodeData,
            frameStart, frameEnd,
            filterFunc,
            warnings
        );

        var output = '';

        var warningMessages = Object.keys(warnings);

        // TODO: sort by frequency of occurrence
        if (warningMessages.length > 0) {
            output += 'warnings (x' + warningMessages.length + '):\n';
            output += warningMessages.map(function(msg) {
                return (warnings[msg] == 1) ? msg : msg + ' (x' + warnings[msg] + ')';
            }).join('\n') + '\n\n';
        }

        output += frameStart + '-' + frameEnd + 'f:\n';
        output += result;

        _.setTextContent(domCache.filterOutput, output);
        _.showDomElement(domCache.popupFilterResult);
    }

    // function canMoveForceTech(nodeData) {

    //     var input = nodeData.input;

    //     // Exclude holds and throws
    //     // FIXME: some throws can grab grounded opponent
    //     if (input.match(/(46|7|4|6|1)h/i) || input.match(/t/i)) {
    //         return false;
    //     }

    //     for (var i = 0; i < nodeData.actionSteps.length; ++i) {

    //         if (NodeFactory.canActionStepHitGround(nodeData.actionSteps[i])) {
    //             return true;
    //         }

    //         var actionMask = nodeData.actionSteps[i].actionMask;
    //         if (
    //             !actionMask ||
    //             actionMask.search('high') >= 0
    //         ) {
    //             return false;
    //         }
    //     }

    //     return true;

    // }

    function onButtonCloseFilterResult(optEvent) {
        _.hideDomElement(domCache.popupFilterResult);
    }

});