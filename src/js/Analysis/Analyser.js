define(

    'Analysis/Analyser',

    [
        'Analysis/Filter',
        'Model/NodeFactory', 'Model/NodeFactoryMove', 'Model/CommonStances',
        'Localization/Strings', 'Tools/TreeTools', 'Tools/Tools'
    ],

    function Analyser(Filter, NodeFactory, NodeFactoryMove, CommonStances, Strings, TreeTools, _) {

        var domCache = {
            popupFilterResult: null,
            filterOutput: null
        };

        return {
            init: init,
            findForceTechMoves: findForceTechMoves,
            findMovesToSpendTime: findMovesToSpendTime,
            findMoves: findMoves,
            listAllUsedTags: listAllUsedTags
        };

        function init() {
            domCache.popupFilterResult = _.getDomElement('popupFilterResult');
            domCache.filterOutput      = _.getDomElement('filterOutput');
            _.addClickListenerToElementWithId(
                'closeFilterResult',
                function(event) { _.hideDomElement(domCache.popupFilterResult); }
            );
        }

        function findForceTechMoves(rootNodeData) {
            var input = prompt(Strings('enterFramesToForceTech'));
            if (input) {
                var parts = input.match(/\d+/g);
                if (parts) {
                    var vulnerabilityStarts = Number(parts[0]);
                    var vulnerabilityEnds   = (parts.length > 1) ? Number(parts[1]) : vulnerabilityStarts;
                    doFindMoves(
                        rootNodeData,
                        vulnerabilityStarts,
                        vulnerabilityEnds,
                        NodeFactoryMove.canMoveHitGround
                    );
                }
            }
        }

        function findMovesToSpendTime(rootNodeData) {

            var input = promptArguments();
            if (input.succeed) {
                act(
                    input.data.framesCountToSpend,
                    input.data.stanceToEndIn || CommonStances.DEFAULT
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
                    Strings(
                        'enterFramesToSpend',
                        { 'DEFAULT_STANCE': CommonStances.DEFAULT }
                    )
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
            var input = prompt(Strings('enterFramesToLandOn'));
            if (input) {
                var parts = input.match(/\d+/g);
                if (parts) {
                    var startFrame = Number(parts[0]);
                    var endFrame = (parts.length > 1) ? Number(parts[1]) : startFrame;
                    doFindMoves(
                        rootNodeData, startFrame, endFrame,
                        function(nodeData) { return !NodeFactoryMove.isMoveHoldOnly(nodeData); }
                    );
                }
            }
        }

        function doFindMoves(rootNodeData, frameStart, frameEnd, filterFunc) {
            var warnings = {};
            var result = Filter.filterResultsToString(
                Filter.findNodes(
                    rootNodeData,
                    frameStart, frameEnd,
                    filterFunc,
                    warnings
                )
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

                output += Strings('warnings');
                if (warningMessages.length > 1) {
                    output += ' (' + amountStr(warningMessages.length) + ')';
                }
                output += ':\n';

                output += warningMessages.map(function(msg) {
                    if (warnings[msg] === 1) return msg;
                    return msg + ' (' + amountStr(warnings[msg]) + ')';
                }).join('\n');

                output += '\n\n';
            }

            output += prefix;

            _.setTextContent(domCache.filterOutput, output);

            if (
                result instanceof DocumentFragment ||
                result instanceof HTMLElement
            ) {
                domCache.filterOutput.appendChild(_.createTextNode('\n'));
                domCache.filterOutput.appendChild(result);
            } else {
                domCache.filterOutput.appendChild(_.createTextNode(result));
            }

            _.showDomElement(domCache.popupFilterResult);

            function amountStr(amount) {
                return 'x' + amount;
            }
        }

        function listAllUsedTags(rootNodeData, suggestTagFilter) {
            var counter = createCounter();
            TreeTools.forAllCurrentChildren(
                rootNodeData,
                NodeFactory.getChildren,
                function(nodeData) {
                    if (!NodeFactoryMove.isMoveNode(nodeData)) return;
                    if (!nodeData.actionSteps) return;
                    nodeData.actionSteps.forEach(function(actionStep) {
                        if (!actionStep) return;
                        if (actionStep.tags) {
                            actionStep.tags.forEach(function(actionStepTag) {
                                counter.count(actionStepTag);
                            });
                        }
                        if (actionStep.results) {
                            actionStep.results.forEach(function(actionStepResult) {
                                if (!actionStepResult) return;
                                actionStepResult.tags.forEach(function(actionStepResultTag) {
                                    counter.count(actionStepResultTag);
                                });
                            });
                        }
                    });
                }
            );
            console.log(counter.getResult());

            // FIXME: localize
            showFilterResults(
                {},
                'Tags:',
                counter.getResult().reduce(
                    function(fragment, result, index, array) {
                        var link = _.createDomElement({
                            tag: 'a',
                            attributes: { 'href': 'javascript:void 0;' },
                            listeners: {
                                'click': function(event) {
                                    suggestTagFilter(result.name);
                                }
                            }
                        });
                        link.appendChild(_.createTextNode(result.name));
                        fragment.appendChild(link);
                        fragment.appendChild(
                            _.createTextNode(' (x' + result.count + ')')
                        );
                        if (index !== array.length - 1) {
                            fragment.appendChild(_.createTextNode('\n'));
                        }
                        return fragment;
                    },
                    document.createDocumentFragment()
                )
            );

            return;

            function createCounter() {
                var map = {};
                return {
                    count: count,
                    getResult: getResult
                };
                function count(name) {
                    map[name] = (map[name] || 0) + 1;
                }
                function getResult() {
                    return Object.keys(map).map(function(name) {
                        return {
                            name: name,
                            count: map[name]
                        };
                    }).sort(function(a, b) {
                        var diff = b.count - a.count;
                        if (diff !== 0) return diff;
                        return compareStrings(a.name, b.name);
                    });
                }
                function compareStrings(a, b) {
                    if (a === b) return 0;
                    return [a, b].sort()[0] === a ? -1 : 1;
                }
            }
        }

    }

);
