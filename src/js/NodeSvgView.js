define(

    'NodeSvgView',

    [
        'NodeView', 'NodeFactory',
        'NodeSvgIndicatorsView', 'NodeSvgViewTexts', 'NodeSvgViewAnimator',
        'Observer', 'Tools', 'SvgTools'
    ],

    function NodeSvgView(
        NodeView, NodeFactory,
        NodeSvgIndicatorsView, NodeSvgViewTexts, NodeSvgViewAnimator,
        createObserver, _, SvgTools
    ) {

        var NODE_WIDTH  = 150;
        var NODE_HEIGHT = 25;

        var TEXT_GETTER_OPTIONS = [
            NodeSvgViewTexts.getEmptyText,
            NodeSvgViewTexts.getTextEnding,
            NodeSvgViewTexts.getTextDuration,
            NodeSvgViewTexts.getCooldown,
            NodeSvgViewTexts.getSafety,
            NodeSvgViewTexts.getReach,
            NodeSvgViewTexts.getForcetechAdvantage,
            NodeSvgViewTexts.getHardKnockdownAdvantage,
            NodeSvgViewTexts.getFollowupDelay,
            NodeSvgViewTexts.getEmptyText, // TODO: stun depth
            NodeSvgViewTexts.getEmptyText  // TODO: unhold duration
        ];

        var textGetters = {
            top:    TEXT_GETTER_OPTIONS[0],
            right:  TEXT_GETTER_OPTIONS[1],
            bottom: TEXT_GETTER_OPTIONS[0]
        };

        var flipTextToRight = true;

        var onNodeClick          = createObserver();
        var onNodeToggleChildren = createObserver();

        return {
            init:                 init,
            create:               create,
            onNodeClick:          onNodeClick,
            onNodeToggleChildren: onNodeToggleChildren,
            setRightTextToSafety: setRightTextToSafety,
            getNodeWidth:  function() { return NODE_WIDTH; },
            getNodeHeight: function() {
                var height = 1;
                if (textGetters.top !== NodeSvgViewTexts.getEmptyText) {
                    height += 0.75;
                }
                if (textGetters.bottom !== NodeSvgViewTexts.getEmptyText) {
                    height += 0.75;
                }
                return height * NODE_HEIGHT;
            }
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
            textGetters.right = NodeSvgViewTexts.getSafety;
            _.getDomElement('rightTextOption').selectedIndex = (
                TEXT_GETTER_OPTIONS.indexOf(NodeSvgViewTexts.getSafety)
            );
        }

        function create(nodeView) {

            var link;
            var wrapper;
            var additionalHitbox;
            var circle;
            var indicatorsView = null;
            var texts = {
                center: null,
                top:    null,
                bottom: null,
                left:   null,
                right:  null
            };

            var animator = NodeSvgViewAnimator.create(setNodePositionAndOpacity);

            var nodeSize = 0;

            createSvgElements();
            indicatorsView = NodeSvgIndicatorsView.create(circle);

            resizeAndUpdateIndicators(NODE_HEIGHT / 3.0);

            var nodeSvgView = {

                nodeView: nodeView,

                wrapper: wrapper,
                link:    link,

                animate:              animator.animate,
                getPositionStart:     animator.getPositionStart,
                getPositionTarget:    animator.getPositionTarget,
                updateLinkThickness:  updateLinkThickness,
                updateByData:         updateByData,

                destroy: destroy
            };

            return nodeSvgView;

            function updateByData() {
                if (!NodeView.isPlaceholder(nodeView)) {
                    circle.removeAttribute('stroke-dasharray');
                }
                updateTextsByData();
                updateClassesByData();
                indicatorsView.update(NodeView.getNodeData(nodeView), nodeSize);
                updateLinkThickness();
            }

            function destroy(optX, optY) {
                wrapper.classList.add('unclickable');
                link.classList.add('unclickable');
                animator.destroy(onDestroyAnimationComplete, optX, optY);
            }

            function onDestroyAnimationComplete() {

                _.removeElementFromParent(link);
                _.removeElementFromParent(wrapper);
                link = null;
                wrapper = null;

                circle = null;
                texts.center = null;
                texts.top = null;
                texts.bottom = null;
                texts.left = null;
                texts.right = null;

            }

            function updateTextsByData() {
                _.setTextContent(texts.left,   getActualLeftText(nodeView));
                _.setTextContent(texts.center, NodeSvgViewTexts.getTextToggle(nodeView));
                _.setTextContent(texts.right,  getActualRightText(nodeView));
                _.setTextContent(texts.top,    textGetters.top(nodeView));
                _.setTextContent(texts.bottom, textGetters.bottom(nodeView));
            }

            function getActualLeftText(nodeView) {
                var leftText = NodeSvgViewTexts.getTextMain(nodeView);
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
                return rightText || NodeSvgViewTexts.getTextMain(nodeView);
            }

            function updateClassesByData() {

                var classes = {
                    'container': NodeView.hasAnyChildren(nodeView),

                    'high': false,
                    'mid':  false,
                    'low':  false,

                    'strike':       false,
                    'throw':        false,
                    'hold':         false,
                    'groundAttack': false,
                    'other':        false,

                    'punch': false,
                    'kick':  false
                };

                function mark(name) { classes[name] = true; }

                var nodeData = NodeView.getNodeData(nodeView);

                if (nodeData && NodeFactory.isMoveNode(nodeData)) {

                    var isPunch = NodeFactory.isMovePunch(nodeData);
                    var isKick  = NodeFactory.isMoveKick(nodeData);

                    // FIXME: mid P mid K
                    if (isPunch) mark('punch');
                    if (isKick)  mark('kick');
                    if (isPunch || isKick) mark('strike');

                    if (NodeFactory.isMoveThrow(nodeData)) mark('throw');
                    // FIXME: sabaki - parry & attack
                    if (NodeFactory.isMoveHold(nodeData)) mark('hold');

                    nodeData.actionSteps.forEach(function(actionStep) {
                        if (NodeFactory.isActionStepJumpAttack(actionStep))   mark('jumpAttack');
                        if (NodeFactory.isActionStepGroundAttack(actionStep)) mark('groundAttack');
                        if (NodeFactory.isActionStepOther(actionStep))        mark('other');
                        if (NodeFactory.isActionStepHigh(actionStep))         mark('high');
                        if (NodeFactory.isActionStepMid(actionStep))          mark('mid');
                        if (NodeFactory.isActionStepLow(actionStep))          mark('low');
                    });

                }

                _.forEachOwnProperty(classes, function(key, value) {
                    if (value) {
                        wrapper.classList.add(key);
                    } else {
                        wrapper.classList.remove(key);
                    }
                });

            }


            function createSvgElements() {

                link = createSvgElementClassed('path', ['node_link']);

                wrapper = _.createSvgElement({
                    tag: 'g',
                    classes: [ 'node' ],
                    listeners: {
                        // 'touchend': eventHandler,
                        'click': onClick,
                        'dblclick': onDoubleClick
                    }
                });

                additionalHitbox = _.createSvgElement({
                    tag: 'rect',
                    classes: [ 'hitbox' ]
                });

                circle = _.createSvgElement({
                    tag: 'circle',
                    // FIXME: CSS "stroke-dasharray: 2 2;"
                    attributes: { 'stroke-dasharray': '2,2' },
                    classes: [ 'node_circle' ]
                });

                texts.center = createSvgElementClassed('text', [ 'node_text', 'node_text_center' ]);
                texts.right  = createSvgElementClassed('text', [ 'node_text', 'node_text_right'  ]);
                texts.left   = createSvgElementClassed('text', [ 'node_text', 'node_text_left'   ]);
                texts.top    = createSvgElementClassed('text', [ 'node_text', 'node_text_top'    ]);
                texts.bottom = createSvgElementClassed('text', [ 'node_text', 'node_text_bottom' ]);

                wrapper.appendChild(additionalHitbox);
                wrapper.appendChild(circle);
                // ... Place for indicators ...
                wrapper.appendChild(texts.bottom);
                wrapper.appendChild(texts.center);
                wrapper.appendChild(texts.top);
                wrapper.appendChild(texts.right);
                wrapper.appendChild(texts.left);

                // wrapper.addEventListener('touchend', toggleChildren);
                // wrapper.addEventListener('click', onClickNodeView);
                // wrapper.addEventListener('dblclick', onDoubleClickNodeView);

            }

            function onClick(event) {
                onNodeClick.dispatch(nodeSvgView);
                event.stopPropagation();
            }

            function onDoubleClick(event) {
                onNodeToggleChildren.dispatch(nodeSvgView);
                event.stopPropagation();
            }

            function resizeAndUpdateIndicators(newNodeSize) {

                nodeSize = newNodeSize;

                var textPadding = 5;
                circle.setAttribute('r', nodeSize);

                // FIXME: calculate size out of padding, and try to include text
                additionalHitbox.setAttribute('x',     -nodeSize * 3);
                additionalHitbox.setAttribute('width',  nodeSize * 6);
                additionalHitbox.setAttribute('y',     -nodeSize * 1.5);
                additionalHitbox.setAttribute('height', nodeSize * 3);

                var offset = nodeSize + textPadding;
                texts.right.setAttribute('x', offset);
                texts.left.setAttribute('x', -offset);
                texts.top.setAttribute('y', -1.5 * offset);
                texts.bottom.setAttribute('y', 1.5 * offset);

                indicatorsView.update(NodeView.getNodeData(nodeView), nodeSize);

            }

            function setNodePositionAndOpacity(x, y, linkStartX, linkStartY, opacity) {
                wrapper.setAttribute('transform', 'translate(' + x + ',' + y + ')');
                wrapper.setAttribute('opacity', opacity);
                link.setAttribute('d', SvgTools.pathSmoothedHorizontal(x, y, linkStartX, linkStartY));
                link.setAttribute('opacity', opacity);
            }

            // TODO: optimize
            function updateLinkThickness() {
                var branchesAfter = nodeView.appearance.branchesAfter;
                // Mimic wires passing through the node; using circle area formula
                var width = 2 * Math.sqrt((branchesAfter + 1) / Math.PI);
                var minWidth = 2 * Math.sqrt(1 / Math.PI);
                var result = width / minWidth;
                var scale = 1.5;
                result = 1 + (result - 1) * scale;
                link.setAttribute('stroke-width', result);
            }

        }

        // Helpers

        function createSvgElementClassed(tag, classes) {
            return _.createSvgElement({
                tag: tag,
                classes: classes
            });
        }

    }

);