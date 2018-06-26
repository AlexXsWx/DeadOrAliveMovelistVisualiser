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

            getEmptyText:    getEmptyText,
            getTextEnding:   getTextEnding,
            getTextDuration: getTextDuration,
            getCooldown:     getCooldown,
            getSafety:       getSafety,
            getReach:        getReach,
            getForcetechAdvantage: getForcetechAdvantage,
            getHardKnockdownAdvantage: getHardKnockdownAdvantage,
            getFollowupDelay: getFollowupDelay

        };

        function getTextToggle(nodeView) {

            if (!_.isNonEmptyArray(NodeView.getAllChildren(nodeView))) return '';

            var hasVisible = NodeView.hasVisibleChildren(nodeView);
            var hasHidden  = NodeView.hasHiddenChildren(nodeView);
            if (hasVisible && !hasHidden)  return CHARS.HIDE;
            if (hasHidden  && !hasVisible) return CHARS.EXPAND;

            return CHARS.MIXED;

        }

        function getTextMain(nodeView) {
            return NodeView.getName(nodeView) || '<unnamed>';
        }

        function getTextEnding(nodeView) {
            var ending = NodeView.getEnding(nodeView);
            return ending ? '{' + ending + '}' : '';
        }

        function getTextDuration(nodeView) {
            var nodeData = NodeView.getNodeData(nodeView);
            if (!nodeData) return '';
            var frameData = nodeData.frameData;
            if (!frameData || frameData.length === 0) return '';
            var frames = frameData[0] + 1;
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

        function getSafety(nodeView) {
            var nodeData = NodeView.getNodeData(nodeView);
            if (!nodeData) return '';
            var advantageRange = NodeFactory.getAdvantageRange(
                nodeData,
                NodeFactory.doesActionStepResultDescribeGuard,
                NodeFactory.getActionStepResultHitBlock
            );
            if (!advantageRange) return '';

            // FIXME: don't reference document here
            var result = document.createDocumentFragment();
            result.appendChild(advantageInteger(advantageRange.min));
            if (advantageRange.min !== advantageRange.max) {
                result.appendChild(_.createTextNode(CHARS.ELLIPSIS));
                result.appendChild(advantageInteger(advantageRange.max));
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
            if (!nodeData) return '';

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
                    t.filter,
                    getGroundHitDuration
                );
                if (advantage) {
                    parts.push([
                        _.createTextNode(t.prefix),
                        advantageInteger(advantage.min)
                    ]);
                }
            });

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
                NodeFactory.doesActionStepResultTagHasHardKnockDown,
                function(actionStepResult) { return HARD_KNOCKDOWN_DURATION_TECHROLL; }
            );
            if (advantageRangeHardKnockdownTechroll) {
                result.appendChild(advantageInteger(advantageRangeHardKnockdownTechroll.min));
            }

            var advantageRangeHardKnockdown = NodeFactory.getAdvantageRange(
                nodeData,
                NodeFactory.doesActionStepResultTagHasHardKnockDown,
                function(actionStepResult) { return HARD_KNOCKDOWN_DURATION_MIN; }
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
            return _.createSvgElement({
                tag: 'tspan',
                classes: [ className ],
                children: [ _.createTextNode(signedInteger(value)) ]
            });
        }

    }

);
