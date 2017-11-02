define(

    'NodeSvgViewTexts',

    [
        'NodeView', 'NodeFactory',
        'NodeSvgViewTextGetters', 'Tools'
    ],

    function NodeSvgViewTexts(
        NodeView, NodeFactory,
        NodeSvgViewTextGetters, _
    ) {

        var TEXT_GETTER_OPTIONS = [
            NodeSvgViewTextGetters.getEmptyText,
            NodeSvgViewTextGetters.getTextEnding,
            NodeSvgViewTextGetters.getTextDuration,
            NodeSvgViewTextGetters.getCooldown,
            NodeSvgViewTextGetters.getSafety,
            NodeSvgViewTextGetters.getReach,
            NodeSvgViewTextGetters.getForcetechAdvantage,
            NodeSvgViewTextGetters.getHardKnockdownAdvantage,
            NodeSvgViewTextGetters.getFollowupDelay,
            NodeSvgViewTextGetters.getEmptyText, // TODO: stun depth
            NodeSvgViewTextGetters.getEmptyText  // TODO: unhold duration
        ];

        var textGetters = {
            top:    TEXT_GETTER_OPTIONS[0],
            right:  TEXT_GETTER_OPTIONS[1],
            bottom: TEXT_GETTER_OPTIONS[0]
        };

        var flipTextToRight = true;

        return {
            init:                         init,
            setRightTextToSafety:         setRightTextToSafety,
            setRightTextToHardKnockdowns: setRightTextToHardKnockdowns,
            hasTextAtTop:                 hasTextAtTop,
            hasTextAtBottom:              hasTextAtBottom,
            create:                       create
        };


        function init(updateRef) {

            _.getDomElement('topTextOption').addEventListener('change', function(event) {
                var select = this;
                var selectedOptionValue = +select.selectedOptions[0].value;
                textGetters.top = TEXT_GETTER_OPTIONS[selectedOptionValue || 0];
                updateRef();
            });
            _.getDomElement('rightTextOption').addEventListener('change', function(event) {
                var select = this;
                var selectedOptionValue = +select.selectedOptions[0].value;
                textGetters.right = TEXT_GETTER_OPTIONS[selectedOptionValue || 0];
                updateRef();
            });
            _.getDomElement('bottomTextOption').addEventListener('change', function(event) {
                var select = this;
                var selectedOptionValue = +select.selectedOptions[0].value;
                textGetters.bottom = TEXT_GETTER_OPTIONS[selectedOptionValue || 0];
                updateRef();
            });

            _.getDomElement('flipTextToRight').addEventListener('change', function(event) {
                var checkbox = this;
                flipTextToRight = checkbox.checked;
                updateRef();
            });

        }

        function setRightTextToSafety() {
            textGetters.right = NodeSvgViewTextGetters.getSafety;
            _.getDomElement('rightTextOption').selectedIndex = (
                TEXT_GETTER_OPTIONS.indexOf(NodeSvgViewTextGetters.getSafety)
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
                _.setTextContent(texts.center, NodeSvgViewTextGetters.getTextToggle(nodeView));
                _.setTextContent(texts.right,  getActualRightText(nodeView));
                _.setTextContent(texts.top,    textGetters.top(nodeView));
                _.setTextContent(texts.bottom, textGetters.bottom(nodeView));
            }

            function getActualLeftText(nodeView) {
                var leftText = NodeSvgViewTextGetters.getTextMain(nodeView);
                if (!flipTextToRight) {
                    return leftText;
                }
                var rightText = textGetters.right(nodeView);
                return rightText ? leftText : '';
            }

            function getActualRightText(nodeView) {
                var rightText = textGetters.right(nodeView);
                if (!flipTextToRight) {
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