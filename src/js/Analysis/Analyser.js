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
                var optStartingStance = input.substr(0, input.indexOf(':'));
                var parts = input.match(/\d+/g);
                if (parts) {
                    var vulnerabilityStarts = Number(parts[0]);
                    var vulnerabilityEnds   = (parts.length > 1) ? Number(parts[1]) : vulnerabilityStarts;
                    doFindMoves(
                        rootNodeData,
                        vulnerabilityStarts,
                        vulnerabilityEnds,
                        NodeFactoryMove.canMoveHitGround,
                        optStartingStance
                    );
                }
            }
        }

        function findMovesToSpendTime(rootNodeData) {

            var input = promptArguments();
            if (input.succeed) {
                act(
                    input.data.framesCountToSpend,
                    input.data.framesCountToSpendMax,
                    input.data.stanceToEndIn || CommonStances.DEFAULT
                );
            }

            return;

            function promptArguments() {
                var result = {
                    succeed: false,
                    data: {
                        framesCountToSpend:    undefined,
                        framesCountToSpendMax: undefined,
                        stanceToEndIn:         undefined
                    }
                };
                var textInput = prompt(
                    Strings(
                        'enterFramesToSpend',
                        { 'DEFAULT_STANCE': CommonStances.DEFAULT }
                    )
                );
                if (textInput) {
                    var matchResult = /(\d+)[\s\-,:~\.]*(\d+)?\s*(.*)?$/.exec(textInput.trim());
                    result.succeed = Boolean(matchResult);
                    result.data.framesCountToSpend = Number(matchResult[1]);
                    result.data.framesCountToSpendMax = (
                        matchResult[2] ? Number(matchResult[2]) : result.data.framesCountToSpend
                    );
                    result.data.stanceToEndIn = matchResult[3];
                }
                return result;
            }

            function act(framesCountToSpend, framesCountToSpendMax, stanceToEndIn) {
                var warnings = {};
                var result = Filter.findNodesToSpendTime(
                    rootNodeData,
                    framesCountToSpend,
                    framesCountToSpendMax,
                    stanceToEndIn,
                    undefined,
                    warnings
                );

                showFilterResults(
                    warnings,
                    framesCountToSpend + '-' + framesCountToSpendMax + 'f -> ' + stanceToEndIn + ':\n',
                    result
                );
            }
        }

        function findMoves(rootNodeData) {
            var input = prompt(Strings('enterFramesToLandOn'));
            if (input) {
                var optStartingStance = input.substr(0, input.indexOf(':'));
                var parts = input.match(/\d+/g);
                if (parts) {
                    var startFrame = Number(parts[0]);
                    var endFrame = (parts.length > 1) ? Number(parts[1]) : startFrame;
                    doFindMoves(
                        rootNodeData, startFrame, endFrame,
                        function(nodeData) { return !NodeFactoryMove.isMoveHoldOnly(nodeData); },
                        optStartingStance
                    );
                }
            }
        }

        function doFindMoves(rootNodeData, frameStart, frameEnd, filterFunc, optStartingStance) {
            var warnings = {};
            var result = Filter.filterResultsToString(
                Filter.findNodes(
                    rootNodeData,
                    frameStart, frameEnd,
                    filterFunc,
                    warnings,
                    optStartingStance
                ),
                frameStart,
                frameEnd,
            );

            showFilterResults(
                warnings,
                frameStart + '-' + frameEnd + 'f:\n',
                result
            );
        }

        function showFilterResults(warnings, prefix, result) {

            var output = prefix;

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

            var target = getOutputView();
            // FIXME: use once dynamic functionality is working (e.g. clicking on a tag)
            // var target = getOutputWindow();

            _.setTextContent(target.root, output);

            if (result instanceof Function) {
                result = result();
            }
            if (
                result instanceof DocumentFragment ||
                result instanceof HTMLElement
            ) {
                target.root.appendChild(_.createTextNode('\n'));
                target.root.appendChild(result);
            } else {
                target.root.appendChild(_.createTextNode(result));
            }

            target.show();

            return;

            function amountStr(amount) {
                return 'x' + amount;
            }

            function getOutputView() {
                return {
                    root: domCache.filterOutput,
                    show: function() {
                        _.showDomElement(domCache.popupFilterResult);
                    }
                };
            }

            function getOutputWindow() {
                var newWindow = window.open(
                    "",
                    null,
                    "status=no,toolbar=no,menubar=no,location=no"
                );
                if (!newWindow) return getOutputView();
                var target = newWindow.document.body;
                target.innerHTML = "";
                var pre = newWindow.document.createElement("pre");
                target.appendChild(pre);
                target = pre;
                return {
                    root: target,
                    show: function() {},
                };
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
                },
                true
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
