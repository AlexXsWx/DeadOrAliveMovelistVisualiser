define(

    'NodeSvgView',

    ['NodeView', 'NodeFactory', 'NodeSvgViewTexts', 'Observer', 'Tools', 'SvgTools'],

    function NodeSvgView(NodeView, NodeFactory, NodeSvgViewTexts, createObserver, _, SvgTools) {

        var HEIGHT_MASK_SHAPE = '-2,3 2,0 -2,-3';
        var HEIGHT_MASK_GROUND_SHAPE = '-5,0 5,0';

        var TRANSITION_DURATION = 500; // ms

        var HEIGHT_INDICATOR_TYPE = {
            none:       0,
            tracking:   1,
            direct:     2,
            notDefined: 3
        };

        var TEXT_GETTER_OPTIONS = [
            NodeSvgViewTexts.getEmptyText,
            NodeSvgViewTexts.getTextEnding,
            NodeSvgViewTexts.getTextDuration,
            NodeSvgViewTexts.getCooldown,
            NodeSvgViewTexts.getSafety,
            NodeSvgViewTexts.getReach,
            NodeSvgViewTexts.getForcetechAdvantage,
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
            setRightTextToSafety: setRightTextToSafety
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

        function create(nodeView, NODE_HEIGHT) {

            var link;
            var wrapper;
            var additionalHitbox;
            var circle;
            var heightIndicators = {
                high: null,
                middle: null,
                bottom: null,
                ground: null
            };
            var texts = {
                center: null,
                top:    null,
                bottom: null,
                left:   null,
                right:  null
            };

            // ==== Animation ====

                var positionTarget = createVectorXY();
                var positionStart  = createVectorXY();
                var positionParentTarget = createVectorXY();
                var positionParentStart  = createVectorXY();
                var opacityStart  = 1;
                var opacityTarget = 1;

                var transitionStart = undefined;
                var animationFrameRequest = null;

            // ===================

            var nodeSize = 0;

            createDomNodes();

            var nodeSvgView = {

                nodeView: nodeView,

                wrapper: wrapper,
                link:    link,

                animate:              animate,
                getPositionTarget:    getPositionTarget,
                getPositionStart:     getPositionStart,
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
                updateHeightIndicators();
                updateLinkThickness();
            }

            function destroy(optX, optY) {
                wrapper.classList.add('unclickable');
                link.classList.add('unclickable');
                if (optX !== undefined && optY !== undefined) {
                    destroyAnimated(optX, optY);
                } else {
                    destroyNotAnimated();
                }
            }

            function destroyAnimated(x, y) {
                if (animationFrameRequest !== null) {
                    window.cancelAnimationFrame(animationFrameRequest);
                    animationFrameRequest = null;
                }
                animate(x, y, x, y, 0);
                setTimeout(destroyNotAnimated, TRANSITION_DURATION);
            }

            function destroyNotAnimated() {

                if (animationFrameRequest !== null) {
                    window.cancelAnimationFrame(animationFrameRequest);
                    animationFrameRequest = null;
                }

                removeSvgNodeFromParent(link);
                removeSvgNodeFromParent(wrapper);
                link = null;
                wrapper = null;

                circle = null;
                texts.center = null;
                texts.top = null;
                texts.bottom = null;
                texts.left = null;
                texts.right = null;

            }

            function removeSvgNodeFromParent(svgNodeView) {
                svgNodeView.parentElement.removeChild(svgNodeView);
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


            function updateHeightIndicators() {

                var highType    = HEIGHT_INDICATOR_TYPE.none;
                var midType     = HEIGHT_INDICATOR_TYPE.none;
                var lowType     = HEIGHT_INDICATOR_TYPE.none;
                var groundType  = HEIGHT_INDICATOR_TYPE.none;

                var nodeData = NodeView.getNodeData(nodeView);
                if (nodeData && NodeFactory.isMoveNode(nodeData)) {

                    nodeData.actionSteps.forEach(function(actionStep) {

                        var type = HEIGHT_INDICATOR_TYPE.notDefined;
                        if (actionStep.isTracking !== undefined) {
                            if (actionStep.isTracking) {
                                type = HEIGHT_INDICATOR_TYPE.tracking;
                            } else {
                                type = HEIGHT_INDICATOR_TYPE.direct;
                            }
                        }

                        if (NodeFactory.isActionStepHigh(actionStep)) highType = type;
                        if (NodeFactory.isActionStepMid(actionStep))  midType  = type;
                        if (NodeFactory.isActionStepLow(actionStep))  lowType  = type;
                        if (NodeFactory.canActionStepHitGround(actionStep)) groundType = type;

                    });

                }

                heightIndicators.high = updateHeightIndicator(heightIndicators.high, -45, highType);
                heightIndicators.mid  = updateHeightIndicator(heightIndicators.mid,    0, midType);
                heightIndicators.low  = updateHeightIndicator(heightIndicators.low,   45, lowType);
                heightIndicators.ground = updateGroundHitIndicator(heightIndicators.ground, groundType);

            }

            function updateHeightIndicator(indicator, angle, type) {
                var result = indicator;
                if (type === HEIGHT_INDICATOR_TYPE.none) {
                    if (result) {
                        result.parentNode.removeChild(result);
                        result = null;
                    }
                } else {
                    if (!result) {
                        result = createHeightIndicator();
                        wrapper.insertBefore(result, circle.nextSibling);
                    }
                    updateHeightIndicatorTransform(
                        result, angle, type === HEIGHT_INDICATOR_TYPE.tracking
                    );
                }
                return result;
            }

            function updateGroundHitIndicator(indicator, type) {
                var result = indicator;
                if (type === HEIGHT_INDICATOR_TYPE.none) {
                    if (result) {
                        result.parentNode.removeChild(result);
                        result = null;
                    }
                } else {
                    if (!result) {
                        result = createGroundHitIndicator();
                        wrapper.insertBefore(result, circle.nextSibling);
                    }
                }
                return result;
            }


            function createDomNodes() {

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
                // ... Place for height indicators ...
                wrapper.appendChild(texts.bottom);
                wrapper.appendChild(texts.center);
                wrapper.appendChild(texts.top);
                wrapper.appendChild(texts.right);
                wrapper.appendChild(texts.left);

                resize(NODE_HEIGHT);

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

            function resize(newNodeSize) {

                nodeSize = newNodeSize;

                var textPadding = 4;
                circle.setAttribute('r', nodeSize);

                // FIXME: calculate size out of padding, and try to include text
                additionalHitbox.setAttribute('x',     -nodeSize * 3);
                additionalHitbox.setAttribute('width',  nodeSize * 6);
                additionalHitbox.setAttribute('y',     -nodeSize * 1.5);
                additionalHitbox.setAttribute('height', nodeSize * 3);

                var offset = nodeSize + textPadding;
                texts.right.setAttribute('x', offset);
                texts.left.setAttribute('x', -offset);
                texts.top.setAttribute('y', -offset);
                texts.bottom.setAttribute('y', offset);

                updateHeightIndicators();

            }

            function createHeightIndicator() {
                var result = createSvgElementClassed('polyline', [ 'node_mask_height_indicator' ]);
                result.setAttribute('points', HEIGHT_MASK_SHAPE);
                return result;
            }

            function createGroundHitIndicator() {
                var result = createSvgElementClassed('polyline', [ 'node_mask_height_indicator' ]);
                result.setAttribute('points', HEIGHT_MASK_GROUND_SHAPE);
                result.setAttribute('transform', 'translate(0,' + (nodeSize + 0.5) + ')');
                return result;
            }

            function updateHeightIndicatorTransform(indicator, angle, flip) {
                var transform = 'rotate(' + angle + ') translate(' + nodeSize + ',0)';
                if (flip) transform = transform + ' scale(-1,1)';
                indicator.setAttribute('transform', transform);
            }

            // ==== Animation ====

                function updateAnimationState(x, y, linkStartX, linkStartY, opacity) {
                    wrapper.setAttribute('transform', 'translate(' + x + ',' + y + ')');
                    updateLink(x, y, linkStartX, linkStartY);
                    wrapper.setAttribute('opacity', opacity);
                    link.setAttribute('opacity', opacity);
                }

                function animate(x, y, linkStartX, linkStartY, opacity) {

                    if (
                        positionTarget.x === undefined ||
                        positionTarget.y === undefined ||
                        positionParentTarget.x === undefined ||
                        positionParentTarget.y === undefined
                    ) {
                        positionTarget.x = x;
                        positionTarget.y = y;
                        positionParentTarget.x = linkStartX;
                        positionParentTarget.y = linkStartY;
                        updateAnimationState(x, y, linkStartX, linkStartY, opacity);
                        return;
                    }

                    var oldProgress = easeTransition(getTransitionProgress());

                    if (positionStart.x === undefined || positionStart.y === undefined) {
                        positionStart.x = positionTarget.x;
                        positionStart.y = positionTarget.y;
                    } else {
                        positionStart.x = _.lerp(positionStart.x, positionTarget.x, oldProgress);
                        positionStart.y = _.lerp(positionStart.y, positionTarget.y, oldProgress);
                    }
                    positionTarget.x = x;
                    positionTarget.y = y;

                    var posParSt = positionParentStart;
                    if (posParSt.x === undefined || posParSt.y === undefined) {
                        posParSt.x = positionParentTarget.x;
                        posParSt.y = positionParentTarget.y;
                    } else {
                        posParSt.x = _.lerp(posParSt.x, positionParentTarget.x, oldProgress);
                        posParSt.y = _.lerp(posParSt.y, positionParentTarget.y, oldProgress);
                    }
                    positionParentTarget.x = linkStartX;
                    positionParentTarget.y = linkStartY;

                    opacityStart = _.lerp(opacityStart, opacityTarget, oldProgress);
                    opacityTarget = opacity;

                    transitionStart = Date.now();

                    if (animationFrameRequest !== null) {
                        window.cancelAnimationFrame(animationFrameRequest);
                    }
                    animationFrameRequest = window.requestAnimationFrame(moveToTargetPosition);

                }

                function moveToTargetPosition() {
                    var progress = getTransitionProgress();
                    var eased = easeTransition(progress);
                    updateAnimationState(
                        _.lerp(positionStart.x, positionTarget.x, eased),
                        _.lerp(positionStart.y, positionTarget.y, eased),
                        _.lerp(positionParentStart.x, positionParentTarget.x, eased),
                        _.lerp(positionParentStart.y, positionParentTarget.y, eased),
                        _.lerp(opacityStart, opacityTarget, eased)
                    );
                    if (transitionStart + TRANSITION_DURATION > Date.now()) {
                        animationFrameRequest = window.requestAnimationFrame(moveToTargetPosition);
                    }
                }

                function getTransitionProgress() {
                    if (!transitionStart) return 1;
                    return Math.min(1, (Date.now() - transitionStart) / TRANSITION_DURATION);
                }

                function easeTransition(progress) {
                    return Math.sin(Math.PI / 2 * progress);
                }

            // ===================

            function getPositionStart() {
                console.assert(
                    positionStart.x !== undefined && positionStart.y !== undefined,
                    'position start is not initialized'
                );
                return positionStart;
            }

            function getPositionTarget() {
                return positionTarget;
            }

            function updateLink(sx, sy, tx, ty) {
                link.setAttribute('d', SvgTools.pathSmoothedHorizontal(sx, sy, tx, ty));
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

        function createVectorXY() {
            return {
                x: undefined,
                y: undefined
            };
        }

        function createSvgElementClassed(tag, classes) {
            return _.createSvgElement({
                tag: tag,
                classes: classes
            });
        }

    }

);