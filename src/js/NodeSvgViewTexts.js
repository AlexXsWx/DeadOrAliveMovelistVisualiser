define(

    'NodeSvgViewTexts',

    ['NodeView', 'NodeFactory', 'Tools',],

    function NodeSvgViewTexts(NodeView, NodeFactory, _) {

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
            getReach:        getReach

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
            var frames = Number(frameData[0]) + 1;
            var activeFrames = [];
            for (var i = 1; i < frameData.length; i += 2) {
                var localFrames = Number(frameData[i]);
                for (var j = 0; j < localFrames; ++j) {
                    activeFrames.push(':' + (frames + j + 1));
                }
                frames += localFrames + Number(frameData[i + 1]);
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
            var advantageRange = NodeFactory.getAdvantageRange(nodeData);
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