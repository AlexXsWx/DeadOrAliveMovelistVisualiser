define(

    'NodeSvgViewTextGetters',

    ['NodeView', 'NodeFactory', 'Tools',],

    function NodeSvgViewTextGetters(NodeView, NodeFactory, _) {

        var CHAR_EXPAND   = '+';
        var CHAR_HIDE     = String.fromCharCode(0x2212); // minus sign
        var CHAR_MIXED    = String.fromCharCode(0x00D7); // cross sign
        var CHAR_ELLIPSIS = '..'; // String.fromCharCode(0x2026); // triple dot

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
            if (hasVisible && !hasHidden)  return CHAR_HIDE;
            if (hasHidden  && !hasVisible) return CHAR_EXPAND;

            return CHAR_MIXED;

        }

        function getTextMain(nodeView) {
            return NodeView.getName(nodeView) || '<unnamed>';
        }

        function getTextEnding(nodeView) {
            return NodeView.getEnding(nodeView) || '';
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
                result.appendChild(_.createTextNode(CHAR_ELLIPSIS));
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

            // FIXME: don't reference document here
            var result = document.createDocumentFragment();

            var advantageRangeForcetech = NodeFactory.getAdvantageRange(
                nodeData,
                NodeFactory.doesActionStepResultDescribeForcetech,
                NodeFactory.getActionStepResultHitBlock
            );
            if (advantageRangeForcetech) {
                result.appendChild(advantageInteger(advantageRangeForcetech.min));
            }

            var advantageRangeGroundHit = NodeFactory.getAdvantageRange(
                nodeData,
                NodeFactory.doesActionStepResultDescribeGroundHit,
                NodeFactory.getActionStepResultHitBlock
            );
            if (advantageRangeGroundHit) {
                result.appendChild(_.createTextNode('/'));
                result.appendChild(advantageInteger(advantageRangeGroundHit.min));
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