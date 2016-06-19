define(

    'NodeSvgView',

    ['NodeView', 'NodeFactory', 'NodeSvgViewTexts', 'Observer', 'Tools', 'SvgTools'],

    function NodeSvgView(NodeView, NodeFactory, NodeSvgViewTexts, createObserver, _, SvgTools) {

        var TRANSITION_DURATION = 500; // ms

        var TEXT_GETTER_OPTIONS = [
            NodeSvgViewTexts.getEmptyText,
            NodeSvgViewTexts.getTextRight,
            NodeSvgViewTexts.getTextDuration,
            NodeSvgViewTexts.getCooldown,
            NodeSvgViewTexts.getSafety,
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
            onNodeToggleChildren: onNodeToggleChildren
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

        function create(nodeView, NODE_HEIGHT) {

            var link;
            var wrapper;
            var circle;
            var maskHigh;
            var maskMid;
            var maskLow;
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

            createDomNodes();

            var nodeSvgView = {
                nodeView:             nodeView,
                wrapper:              wrapper,
                link:                 link,
                animate:              animate,
                getPositionTarget:    getPositionTarget,
                getPositionStart:     getPositionStart,
                updateLinkThickness:  updateLinkThickness,
                updateByData:         updateByData,
                destroy:              destroy
            };

            return nodeSvgView;

            function updateByData() {
                if (!NodeView.isPlaceholder(nodeView)) {
                    circle.removeAttribute('stroke-dasharray');
                }
                updateTextsByData();
                updateClassesByData();
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
                var leftText = NodeSvgViewTexts.getTextLeft(nodeView);
                if (!flipTextToRight) {
                    return leftText;
                }
                var rightText = textGetters.right(nodeView);
                return rightText ? leftText : '';
            }

            function getActualRightText(nodeView) {
                var rightText = textGetters.right(nodeView);
                if (!flipTextToRight)
                {
                    return rightText;
                }
                return rightText || NodeSvgViewTexts.getTextLeft(nodeView);
            }

            function updateClassesByData() {

                var classes = {
                    'container': _.isNonEmptyArray(NodeView.getAllChildren(nodeView)),

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

                var nodeData = nodeView.binding.targetDataNode;

                if (nodeData && NodeFactory.isMoveNode(nodeData)) {
                    nodeData.actionSteps.forEach(function(actionStep) {

                        if (/\bp\b/i.test(actionStep.actionMask)) classes['punch'] = true;
                        if (/\bk\b/i.test(actionStep.actionMask)) classes['kick']  = true;

                        var type = actionStep.actionType;
                        if (type === 'strike')        classes['strike']       = true;
                        if (type === 'jump attack')   classes['jumpAttack']   = true;
                        if (type === 'throw')         classes['throw']        = true;
                        if (type === 'hold')          classes['hold']         = true;
                        if (type === 'ground attack') classes['groundAttack'] = true;
                        if (type === 'other')         classes['other']        = true;

                        if (/\bhigh\b/i.test(actionStep.actionMask)) classes['high'] = true;
                        if (/\bmid\b/i.test(actionStep.actionMask))  classes['mid']  = true;
                        if (/\blow\b/i.test(actionStep.actionMask))  classes['low']  = true;
                    });
                }

                for (attr in classes) {
                    if (classes.hasOwnProperty(attr)) {
                        if (classes[attr]) {
                            wrapper.classList.add(attr);
                        } else {
                            wrapper.classList.remove(attr);
                        }
                    }
                }

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

                maskHigh = createSvgElementClassed('polyline', [ 'node_mask_high' ]);
                maskMid  = createSvgElementClassed('polyline', [ 'node_mask_mid'  ]);
                maskLow  = createSvgElementClassed('polyline', [ 'node_mask_low'  ]);

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

                resize(NODE_HEIGHT);

                wrapper.appendChild(circle);
                wrapper.appendChild(maskHigh);
                wrapper.appendChild(maskMid);
                wrapper.appendChild(maskLow);
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

            function resize(nodeSize) {
                var textPadding = 4;
                circle.setAttribute('r', nodeSize);

                var offset = nodeSize + textPadding;
                texts.right.setAttribute('x', offset);
                texts.left.setAttribute('x', -offset);
                texts.top.setAttribute('y', -offset);
                texts.bottom.setAttribute('y', offset);

                var shape = '-2,3 2,0 -2,-3';
                var width = 1.5;
                maskHigh.setAttribute('points', shape);
                maskMid.setAttribute('points',  shape);
                maskLow.setAttribute('points',  shape);
                maskHigh.setAttribute('stroke-width', width);
                maskMid.setAttribute('stroke-width', width);
                maskLow.setAttribute('stroke-width', width);
                maskHigh.setAttribute('transform', 'rotate(-45) translate(' + nodeSize + ',0)');
                maskMid.setAttribute('transform', 'translate(' + nodeSize + ',0)');
                maskLow.setAttribute('transform', 'rotate(45) translate(' + nodeSize + ',0)');
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

                    if (positionParentStart.x === undefined || positionParentStart.y === undefined) {
                        positionParentStart.x = positionParentTarget.x;
                        positionParentStart.y = positionParentTarget.y;
                    } else {
                        positionParentStart.x = _.lerp(positionParentStart.x, positionParentTarget.x, oldProgress);
                        positionParentStart.y = _.lerp(positionParentStart.y, positionParentTarget.y, oldProgress);
                    }
                    positionParentTarget.x = linkStartX;
                    positionParentTarget.y = linkStartY;

                    opacityStart = _.lerp(opacityStart, opacityTarget, oldProgress);
                    opacityTarget = opacity;

                    transitionStart = Date.now();

                    if (animationFrameRequest !== null) window.cancelAnimationFrame(animationFrameRequest);
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