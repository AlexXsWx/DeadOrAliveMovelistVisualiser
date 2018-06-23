define('Analyser', ['Filter', 'Tools', 'NodeFactory'], function Analyser(Filter, _, NodeFactory) {

    var domCache = {
        popupFilterResult: null,
        filterOutput: null
    };

    return {
        init: init,
        findForceTechMoves: findForceTechMoves,
        findMovesToSpendTime: findMovesToSpendTime,
        findMoves: findMoves
    };

    function init() {
        domCache.popupFilterResult = _.getDomElement('popupFilterResult');
        domCache.filterOutput      = _.getDomElement('filterOutput');
        _.addClickListenerToElementWithId(
            'closeFilterResult',
            function() { _.hideDomElement(domCache.popupFilterResult); }
        );
    }

    function findForceTechMoves(rootNodeData) {
        // FIXME: localize
        var input = prompt('Your frames to land on: e.g. "43" or "43-45"');
        if (input) {
            var parts = input.match(/\d+/g);
            if (parts) {
                var vulnerabilityStarts = Number(parts[0]);
                var vulnerabilityEnds   = (parts.length > 1) ? Number(parts[1]) : vulnerabilityStarts;
                doFindMoves(
                    rootNodeData,
                    vulnerabilityStarts,
                    vulnerabilityEnds,
                    NodeFactory.canMoveHitGround
                );
            }
        }
    }

    function findMovesToSpendTime(rootNodeData) {

        var input = promptArguments();
        if (input.succeed) {
            act(
                input.data.framesCountToSpend,
                input.data.stanceToEndIn || 'STD'
            );
        }

        return;

        function promptArguments() {
            var result = {
                succeed: false,
                data: {
                    framesCountToSpend: undefined,
                    stanceToEndIn:      undefined
                }
            };
            var textInput = prompt(
                'Amount of frames to spend and stance to end in (leave empty for STD):'
            );
            if (textInput) {
                var parts = textInput.trim().split(/\s+/);
                result.succeed = true;
                result.data.framesCountToSpend = Number(parts[0]);
                result.data.stanceToEndIn = parts[1];
            }
            return result;
        }

        function act(framesCountToSpend, stanceToEndIn) {
            var warnings = {};
            var result = Filter.findNodesToSpendTime(
                rootNodeData,
                framesCountToSpend, stanceToEndIn,
                undefined,
                warnings
            );

            showFilterResults(
                warnings,
                framesCountToSpend + 'f -> ' + stanceToEndIn + ':\n',
                result
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

        showFilterResults(
            warnings,
            frameStart + '-' + frameEnd + 'f:\n',
            result
        );
    }

    function showFilterResults(warnings, prefix, result) {

        var output = '';

        var warningMessages = Object.keys(warnings);

        // TODO: sort by frequency of occurrence
        if (warningMessages.length > 0) {
            output += 'warnings (x' + warningMessages.length + '):\n';
            output += warningMessages.map(function(msg) {
                return (warnings[msg] == 1) ? msg : msg + ' (x' + warnings[msg] + ')';
            }).join('\n') + '\n\n';
        }

        output += prefix;
        output += result;

        _.setTextContent(domCache.filterOutput, output);
        _.showDomElement(domCache.popupFilterResult);
    }

});