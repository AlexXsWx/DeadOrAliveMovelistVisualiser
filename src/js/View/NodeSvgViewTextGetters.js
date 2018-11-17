define(

    'View/NodeSvgViewTextGetters',

    [ 'View/NodeView', 'Model/NodeFactory', 'Tools/Tools' ],

    function NodeSvgViewTextGetters(NodeView, NodeFactory, _) {

        var CHARS = {
            EXPAND:   '+',
            HIDE:     String.fromCharCode(0x2212), // minus sign
            MIXED:    String.fromCharCode(0x00D7), // cross sign
            ELLIPSIS: '..', // String.fromCharCode(0x2026); // triple dot
        };

        return {

            getTextToggle: getTextToggle,

            getTextMain: getTextMain,

            getEmptyText:        getEmptyText,
            getTextEnding:       getTextEnding,
            getTextActiveFrames: getTextActiveFrames,
            getCooldown:         getCooldown,
            getAdvantageOnBlock: getAdvantageOnBlock,
            getAdvantageOnHit:   getAdvantageOnHit,
            getReach:            getReach,
            getForcetechAdvantage: getForcetechAdvantage,
            getHardKnockdownAdvantage: getHardKnockdownAdvantage,
            getFollowupDelay: getFollowupDelay,
            getComment: getComment,
            getMainTags: getMainTags

        };

        function getTextToggle(nodeView) {

            var hasVisible = NodeView.hasVisibleChildren(nodeView);
            var hasHidden  = NodeView.hasHiddenChildren(nodeView);

            if (!hasVisible && !hasHidden) return '';

            var str;
            if (hasVisible === hasHidden) {
                str = CHARS.MIXED;
            } else {
                str = hasVisible ? CHARS.HIDE : CHARS.EXPAND;
            }

            return str;

        }

        function getTextMain(nodeView) {
            var result = document.createDocumentFragment();
            var name = NodeView.getName(nodeView).rich;
            if (name.length === 0) {
                name = [
                    { text: '<',       className: 'lightgray' },
                    { text: 'unnamed', className: 'gray'      },
                    { text: '>',       className: 'lightgray' }
                ];
            }
            name.forEach(function(entry) {
                if (!entry.text || entry.text === '*') return;
                var forceDim = entry.text === '...';
                var className = entry.className || (forceDim ? 'gray' : undefined);
                result.appendChild(classedTSpan(entry.text, className));
            });
            return result;
        }

        function getTextEnding(nodeView) {
            var ending = NodeView.getEnding(nodeView);
            if (!ending) return '';
            var result = document.createDocumentFragment();
            result.appendChild(classedTSpan('{', 'lightgray'));
            result.appendChild(classedTSpan(ending, 'gray'));
            result.appendChild(classedTSpan('}', 'lightgray'));
            return result;
        }

        function getTextActiveFrames(nodeView) {
            var nodeData = NodeView.getNodeData(nodeView);
            if (!nodeData) return '';
            var frameData = nodeData.frameData;
            if (!frameData || frameData.length === 0) return '';
            var frames = 0;
            if (doesParentStanceApplyExtraFrame()) frames += 1;
            frames += frameData[0];
            var activeFrames = [];
            for (var i = 1; i < frameData.length; i += 2) {
                var localFrames = frameData[i];
                for (var j = 0; j < localFrames; ++j) {
                    activeFrames.push(':' + (frames + j + 1));
                }
                frames += localFrames + frameData[i + 1];
            }
            console.assert(!isNaN(frames), 'Frames are NaN');
            return activeFrames.join('') + ':/' + frames;

            function doesParentStanceApplyExtraFrame() {
                var parentNodeData = NodeView.findAncestorNodeData(nodeView);
                return (
                    parentNodeData &&
                    NodeFactory.isStanceNode(parentNodeData) &&
                    parentNodeData.appliesExtraFrame
                );
            }
        }

        function getCooldown(nodeView) {
            var nodeData = NodeView.getNodeData(nodeView);
            if (!nodeData) return '';
            var frameData = nodeData.frameData;
            if (!frameData || frameData.length === 0) return '';
            var cooldown = frameData[frameData.length - 1];
            var cooldownRange = frameData[frameData.length - 2] - 1;
            return cooldown + '-' + (cooldown + cooldownRange);
        }

        function getAdvantageOnBlock(nodeView) {
            var nodeData = NodeView.getNodeData(nodeView);
            if (!nodeData) return '';
            var advantageRange = NodeFactory.getAdvantageRange(
                nodeData,
                NodeFactory.getActionStepResultHitBlock,
                NodeFactory.doesActionStepResultDescribeGuard,
                NodeFactory.isMoveNode(nodeData) ? NodeView.findAncestorNodeData(nodeView) : null
            );
            if (!advantageRange) return '';

            var styleFunction = (
                NodeFactory.getNoInputFollowup(nodeData)
                    ? function(text) { return classedTSpan(signedInteger(text), 'gray'); }
                    : advantageInteger
            );

            // FIXME: don't reference document here
            var result = document.createDocumentFragment();
            result.appendChild(styleFunction(advantageRange.min));
            if (advantageRange.min !== advantageRange.max) {
                result.appendChild(_.createTextNode(CHARS.ELLIPSIS));
                result.appendChild(styleFunction(advantageRange.max));
            }

            return result;
        }

        function getAdvantageOnHit(nodeView) {
            var nodeData = NodeView.getNodeData(nodeView);
            if (!nodeData) return '';
            var advantageRange = NodeFactory.getAdvantageRange(
                nodeData,
                NodeFactory.getActionStepResultHitBlock,
                NodeFactory.doesActionStepResultDescribeNeutralHit
            );
            if (!advantageRange) return '';

            var styleFunction = (
                NodeFactory.getNoInputFollowup(nodeData)
                    ? function(text) { return classedTSpan(signedInteger(text), 'gray'); }
                    : advantageInteger
            );

            // FIXME: don't reference document here
            var result = document.createDocumentFragment();
            result.appendChild(styleFunction(advantageRange.min));
            if (advantageRange.min !== advantageRange.max) {
                result.appendChild(_.createTextNode(CHARS.ELLIPSIS));
                result.appendChild(styleFunction(advantageRange.max));
            }
            return result;
        }

        function getReach(nodeView) {
            var nodeData = NodeView.getNodeData(nodeView);
            if (!nodeData || !nodeData.actionSteps) return '';
            var max = -Infinity;
            for (var i = 0; i < nodeData.actionSteps.length; ++i) {
                if (nodeData.actionSteps[i].reach > max) {
                    max = nodeData.actionSteps[i].reach;
                }
            }
            return isFinite(max) ? max : '';
        }

        function getForcetechAdvantage(nodeView) {
            var nodeData = NodeView.getNodeData(nodeView);
            if (
                !nodeData ||
                !NodeFactory.isMoveNode(nodeData)
            ) {
                return '';
            }

            var parts = [];

            var types = [
                {
                    prefix: 'f',
                    filter: NodeFactory.doesActionStepResultDescribeForcetech
                }, {
                    prefix: 'g',
                    filter: NodeFactory.doesActionStepResultDescribeGroundHit
                }, {
                    prefix: 'gc',
                    filter: NodeFactory.doesActionStepResultDescribeGroundHitCombo
                }
            ];

            // Ground hit duration is expected to be written in to "hit block" field
            var getGroundHitDuration = NodeFactory.getActionStepResultHitBlock;

            types.forEach(function(t) {
                var advantage = NodeFactory.getAdvantageRange(
                    nodeData,
                    getGroundHitDuration,
                    t.filter
                );
                if (advantage) {
                    parts.push([
                        _.createTextNode(t.prefix),
                        advantageInteger(advantage.min)
                    ]);
                }
            });

            if (
                parts.length === 0 &&
                NodeFactory.canMoveHitGround(nodeData)
            ) {
                var DEFAULT_GROUND_HIT_DURATION = 50;
                var DEFAULT_FORCETECH_DURATION = 45;
                [
                    ['f/gc?', DEFAULT_FORCETECH_DURATION],
                    ['g?', DEFAULT_GROUND_HIT_DURATION]
                ].forEach(function(data) {
                    var prefix = data[0];
                    var groundHitDuration = data[1];
                    var advantage = NodeFactory.getAdvantageRange(
                        nodeData,
                        function() { return groundHitDuration; }
                    );
                    if (advantage) {
                        parts.push([
                            _.createTextNode(prefix),
                            advantageInteger(advantage.min)
                        ]);
                    }
                });
            }

            var result = '';

            if (parts.length > 0) {

                // FIXME: don't reference document here
                result = document.createDocumentFragment();

                parts[0].forEach(function(p) { result.appendChild(p); });
                for (var i = 1; i < parts.length; ++i) {
                    result.appendChild(_.createTextNode('/'));
                    parts[i].forEach(function(p) { result.appendChild(p); });
                }
            }

            return result;
        }

        function getHardKnockdownAdvantage(nodeView) {

            var HARD_KNOCKDOWN_DURATION_MIN = 70;
            var HARD_KNOCKDOWN_DURATION_TECHROLL = 51;

            var nodeData = NodeView.getNodeData(nodeView);
            if (!nodeData) return '';

            // FIXME: don't reference document here
            var result = document.createDocumentFragment();

            var advantageRangeHardKnockdownTechroll = NodeFactory.getAdvantageRange(
                nodeData,
                function(actionStepResult) { return HARD_KNOCKDOWN_DURATION_TECHROLL; },
                NodeFactory.doesActionStepResultTagHasHardKnockDown
            );
            if (advantageRangeHardKnockdownTechroll) {
                result.appendChild(advantageInteger(advantageRangeHardKnockdownTechroll.min));
            }

            var advantageRangeHardKnockdown = NodeFactory.getAdvantageRange(
                nodeData,
                function(actionStepResult) { return HARD_KNOCKDOWN_DURATION_MIN; },
                NodeFactory.doesActionStepResultTagHasHardKnockDown
            );
            if (advantageRangeHardKnockdown) {
                result.appendChild(_.createTextNode('/'));
                result.appendChild(advantageInteger(advantageRangeHardKnockdown.min));
            }

            return result;
        }

        function getFollowupDelay(nodeView) {

            var nodeData = NodeView.getNodeData(nodeView);
            if (!nodeData || !NodeFactory.isMoveNode(nodeData)) return '';

            if (nodeData.followUpInterval.length === 0) return '';

            if (nodeData.followUpInterval.length === 1) return '0';

            var followUpIntervalStart = nodeData.followUpInterval[0];
            var followUpIntervalEnd   = nodeData.followUpInterval[1] - 1;

            return Math.max(0, followUpIntervalEnd - followUpIntervalStart);

        }

        function getComment(nodeView) {
            var nodeData = NodeView.getNodeData(nodeView);
            if (!nodeData || !NodeFactory.isMoveNode(nodeData)) return '';

            return nodeData.comment || '';
        }

        function getMainTags(nodeView) {
            var nodeData = NodeView.getNodeData(nodeView);
            if (!nodeData || !NodeFactory.isMoveNode(nodeData)) return '';

            if (nodeData.actionSteps.length === 0) return '';

            return (
                nodeData.actionSteps.map(
                    function(actionStep) { return actionStep.tags; }
                ).join(', ') ||
                ''
            );
        }

        function getEmptyText(nodeView) {
            return '';
        }

        function signedInteger(value) {
            return (value < 0) ? value : '+' + value;
        }

        function advantageInteger(value) {
            var className;
            switch(true) {
                case value >= 0:  className = 'positive'; break;
                case value >= -5: className = 'safe';     break;
                case value >= -7: className = 'semisafe'; break;
                default: className = 'unsafe';
            }
            return classedTSpan(signedInteger(value), className);
        }

        function classedTSpan(text, optClassName) {
            var classes = [];
            if (optClassName) classes.push(optClassName);
            return _.createSvgElement({
                tag: 'tspan',
                classes: classes,
                children: [ _.createTextNode(text) ]
            });
        }

        function splitBy(text, rgx) {
            var result = [];
            var rest = text;
            while (true) {
                var start = rgx.lastIndex;
                var match = rgx.exec(text);
                if (!match) break;
                result.push(text.substring(start, match.index));
                result.push(text.substr(match.index, match[0].length));
                rest = text.substr(match.index + match[0].length, match.lastIndex);
            }
            result.push(rest);
            return result;
        }

    }

);
