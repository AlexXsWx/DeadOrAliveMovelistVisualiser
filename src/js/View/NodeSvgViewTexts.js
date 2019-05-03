define(

    'View/NodeSvgViewTexts',

    [
        'Model/NodeFactoryMove',
        'Model/NodeFactoryActionStepResult',
        'View/NodeView', 'View/NodeSvgViewTextGetters', 'Tools/Signal', 'Tools/Tools',
    ],

    function NodeSvgViewTexts(
        NodeFactoryMove,
        NodeFactoryActionStepResult,
        NodeView, NodeSvgViewTextGetters, createSignal, _
    ) {

        var TEXT_GETTER_OPTIONS = [
            NodeSvgViewTextGetters.getEmptyText,
            NodeSvgViewTextGetters.getTextEnding,
            NodeSvgViewTextGetters.getTextActiveFrames,
            NodeSvgViewTextGetters.getCooldown,
            NodeSvgViewTextGetters.getAdvantageOnBlock,
            NodeSvgViewTextGetters.getAdvantageOnNeutralHit,
            NodeSvgViewTextGetters.getAdvantageOnCounterHit,
            NodeSvgViewTextGetters.getAdvantageOnHiCounterHit,
            NodeSvgViewTextGetters.getGuaranteedAdvantageOnBackHit,
            NodeSvgViewTextGetters.getReach,
            NodeSvgViewTextGetters.getForcetechAdvantage,
            NodeSvgViewTextGetters.getHardKnockdownAdvantage,
            NodeSvgViewTextGetters.getFollowupDelay,
            NodeSvgViewTextGetters.getComment,
            NodeSvgViewTextGetters.getMainTags,
            NodeSvgViewTextGetters.getEmptyText, // TODO: stun depth
            NodeSvgViewTextGetters.getEmptyText  // TODO: unhold duration
        ];

        var GET_ADVANTAGE_FUNC = [];

        GET_ADVANTAGE_FUNC[
            TEXT_GETTER_OPTIONS.indexOf(NodeSvgViewTextGetters.getAdvantageOnBlock)
        ] = createGetAdvantage(NodeFactoryActionStepResult.doesDescribeGuard);
        GET_ADVANTAGE_FUNC[
            TEXT_GETTER_OPTIONS.indexOf(NodeSvgViewTextGetters.getAdvantageOnNeutralHit)
        ] = createGetAdvantage(NodeFactoryActionStepResult.doesDescribeNeutralHit);
        GET_ADVANTAGE_FUNC[
            TEXT_GETTER_OPTIONS.indexOf(NodeSvgViewTextGetters.getAdvantageOnCounterHit)
        ] = createGetAdvantage(NodeFactoryActionStepResult.doesDescribeCounterHit);
        GET_ADVANTAGE_FUNC[
            TEXT_GETTER_OPTIONS.indexOf(NodeSvgViewTextGetters.getAdvantageOnHiCounterHit)
        ] = createGetAdvantage(NodeFactoryActionStepResult.doesDescribeHiCounterHit);
        GET_ADVANTAGE_FUNC[
            TEXT_GETTER_OPTIONS.indexOf(NodeSvgViewTextGetters.getGuaranteedAdvantageOnBackHit)
        ] = createGetAdvantage(NodeFactoryActionStepResult.doesDescribeBackHit, true);

        function createGetAdvantage(actionStepResultPredicate, optGuaranteed) {
            return getAdvantage;
            function getAdvantage(nodeView) {
                var nodeData = NodeView.getNodeData(nodeView);
                if (!nodeData) return;
                return NodeFactoryMove.getAdvantageRange(
                    nodeData,
                    optGuaranteed
                        ? function(actionStepResult) {
                            return (
                                actionStepResult.criticalHoldDelay ||
                                NodeFactoryActionStepResult.getHitBlockOrStun(actionStepResult)
                            );
                        }
                        : NodeFactoryActionStepResult.getHitBlockOrStun,
                    actionStepResultPredicate,
                    NodeFactoryMove.isMoveNode(nodeData) ? NodeView.findAncestorNodeData(nodeView) : null
                );
            }
        }

        var textGetters = {
            top:    TEXT_GETTER_OPTIONS[0],
            right:  TEXT_GETTER_OPTIONS[1],
            bottom: TEXT_GETTER_OPTIONS[0]
        };

        var flipTextToRight = false;

        var updateSignal = createSignal();

        return {
            init:                           init,
            onUpdate:                       updateSignal.listenersManager,
            setRightTextToAdvantageOnBlock: setRightTextToAdvantageOnBlock,
            setRightTextToHardKnockdowns:   setRightTextToHardKnockdowns,
            hasTextAtTop:                   hasTextAtTop,
            hasTextAtBottom:                hasTextAtBottom,
            create:                         create
        };


        function init() {

            _.getDomElement('topTextOption').addEventListener('change', function(event) {
                var select = this;
                var selectedOptionValue = +select.selectedOptions[0].value;
                var index = selectedOptionValue || 0;
                textGetters.top = TEXT_GETTER_OPTIONS[index];
                updateSignal.dispatch();
            });
            _.getDomElement('rightTextOption').addEventListener('change', function(event) {
                var select = this;
                var selectedOptionValue = +select.selectedOptions[0].value;
                var index = selectedOptionValue || 0;
                textGetters.right = TEXT_GETTER_OPTIONS[index];
                updateSignal.dispatch(GET_ADVANTAGE_FUNC[index] || null);
            });
            _.getDomElement('bottomTextOption').addEventListener('change', function(event) {
                var select = this;
                var selectedOptionValue = +select.selectedOptions[0].value;
                var index = selectedOptionValue || 0;
                textGetters.bottom = TEXT_GETTER_OPTIONS[index];
                updateSignal.dispatch();
            });

            _.getDomElement('flipTextToRight').addEventListener('change', function(event) {
                var checkbox = this;
                flipTextToRight = checkbox.checked;
                updateSignal.dispatch();
            });

        }

        function setRightTextToAdvantageOnBlock() {
            textGetters.right = NodeSvgViewTextGetters.getAdvantageOnBlock;
            _.getDomElement('rightTextOption').selectedIndex = (
                TEXT_GETTER_OPTIONS.indexOf(NodeSvgViewTextGetters.getAdvantageOnBlock)
            );
        }

        function setRightTextToHardKnockdowns() {
            textGetters.right = NodeSvgViewTextGetters.getHardKnockdownAdvantage;
            _.getDomElement('rightTextOption').selectedIndex = (
                TEXT_GETTER_OPTIONS.indexOf(NodeSvgViewTextGetters.getHardKnockdownAdvantage)
            );
        }

        function hasTextAtTop() {
            return textGetters.top !== NodeSvgViewTextGetters.getEmptyText;
        }

        function hasTextAtBottom() {
            return textGetters.bottom !== NodeSvgViewTextGetters.getEmptyText;
        }


        function create() {

            var texts = {
                center: null,
                top:    null,
                bottom: null,
                left:   null,
                right:  null
            };

            createSvgElements();

            return {
                addSelfToParent: addSelfToParent,
                updateByData:    updateByData,
                resize:          resize
            };;

            function updateByData(nodeView) {
                _.setTextContent(texts.left,   getActualLeftText(nodeView));
                _.setTextContent(texts.center, NodeView.text.getToggle(nodeView));
                _.setTextContent(texts.right,  getActualRightText(nodeView));
                _.setTextContent(texts.top,    textGetters.top(nodeView));
                _.setTextContent(texts.bottom, textGetters.bottom(nodeView));
            }

            function getActualLeftText(nodeView) {
                var flipToRight = flipTextToRight;
                if (NodeView.isRootNodeView(nodeView)) {
                    flipToRight = true;
                }
                var leftText = NodeSvgViewTextGetters.getTextMain(nodeView);
                if (!flipToRight) {
                    return leftText;
                }
                var rightText = textGetters.right(nodeView);
                return rightText ? leftText : '';
            }

            function getActualRightText(nodeView) {
                var flipToRight = flipTextToRight;
                if (NodeView.isRootNodeView(nodeView)) {
                    flipToRight = true;
                }
                var rightText = textGetters.right(nodeView);
                if (!flipToRight) {
                    return rightText;
                }
                return rightText || NodeSvgViewTextGetters.getTextMain(nodeView);
            }


            function createSvgElements() {
                texts.center = createNodeText('node_text_center');
                texts.right  = createNodeText('node_text_right');
                texts.left   = createNodeText('node_text_left');
                texts.top    = createNodeText('node_text_top');
                texts.bottom = createNodeText('node_text_bottom');
            }


            function addSelfToParent(parentElement) {
                parentElement.appendChild(texts.bottom);
                parentElement.appendChild(texts.center);
                parentElement.appendChild(texts.top);
                parentElement.appendChild(texts.right);
                parentElement.appendChild(texts.left);
            }


            function resize(nodeSize) {
                var textPadding = 5.0;
                var offset = nodeSize + textPadding;
                texts.right.setAttribute('x', offset);
                texts.left.setAttribute('x', -offset);
                texts.top.setAttribute('y', -1.5 * offset);
                texts.bottom.setAttribute('y', 1.5 * offset);
            }

            function createNodeText(extraClassName) {
                return _.createSvgElement({
                    tag: 'text',
                    classes: [ 'node_text', extraClassName ]
                });
            }

        }

    }

);
