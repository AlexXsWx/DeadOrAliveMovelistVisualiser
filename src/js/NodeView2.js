define(

    'NodeView2',

    ['NodeView', 'NodeFactory', 'Observer', 'Tools'],

    function NodeView2(NodeView, NodeFactory, createObserver, _) {

        var CHAR_EXPAND = '+';
        var CHAR_HIDE   = String.fromCharCode(0x2212); // minus sign
        var CHAR_MIXED  = String.fromCharCode(0x00D7); // cross sign

        var TEXT_GETTER_OPTIONS = [
            getEmptyText,
            getTextRight,
            getTextDuration,
            getEmptyText, // cooldown
            getEmptyText, // advantage
            getEmptyText, // stun depth
            getEmptyText  // unhold duration
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
            create:               create,
            onNodeClick:          onNodeClick,
            onNodeToggleChildren: onNodeToggleChildren,
            setFlipTextToRight:   setFlipTextToRight,
            setRightTextOption:   setRightTextOption,
            setTopTextOption:     setTopTextOption,
            setBottomTextOption:  setBottomTextOption
        };

        function create(nodeView, NODE_HEIGHT) {

            var link;
            var wrapper;
            var circle;
            var texts = {
                center: null,
                top:    null,
                bottom: null,
                left:   null,
                right:  null
            };

            var position = {
                x: undefined,
                y: undefined
            };

            createDomNodes();

            var nodeView2 = {
                nodeView:     nodeView,
                wrapper:      wrapper,
                link:         link,
                setPosition:  setPosition,
                getPosition:  getPosition,
                updateLink:   updateLink,
                updateByData: updateByData
            };

            return nodeView2;

            function updateByData() {
                updateTextsByData();
                updateClassesByData();
            }

            function updateTextsByData() {
                setLeftText   ( getActualLeftText(nodeView)  );
                setCenterText ( getTextToggle(nodeView)      );
                setTopText    ( textGetters.top(nodeView)    );
                setRightText  ( getActualRightText(nodeView) );
                setBottomText ( textGetters.bottom(nodeView) );
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

                var nodeData = nodeView.fd3Data.binding.targetDataNode;

                if (nodeData && NodeFactory.isMoveNode(nodeData)) {
                    nodeData.actionSteps.forEach(function(actionStep) {

                        if (/\bp\b/i.test(actionStep.actionMask)) classes['punch'] = true;
                        if (/\bk\b/i.test(actionStep.actionMask)) classes['kick']  = true;

                        var type = actionStep.actionType;
                        if (type === 'strike')       classes['strike']       = true;
                        if (type === 'throw')        classes['throw']        = true;
                        if (type === 'hold')         classes['hold']         = true;
                        if (type === 'groundAttack') classes['groundAttack'] = true;
                        if (type === 'other')        classes['other']        = true;

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

                link = _.createSvgElement({
                    tag: 'path',
                    classes: [ 'node_link' ]
                });
                
                wrapper = _.createSvgElement({
                    tag: 'g',
                    classes: [ 'node' ],
                    listeners: {
                        // 'touchend': eventHandler,
                        'click': onClick,
                        'dblclick': onDoubleClick
                    }
                });

                circle = _.createSvgElement({
                    tag: 'circle',
                    classes: [ 'node_circle' ]
                });

                texts.center = _.createSvgElement({
                    tag: 'text',
                    classes: [ 'node_text', 'node_text_center' ]
                });

                texts.right = _.createSvgElement({
                    tag: 'text',
                    classes: [ 'node_text', 'node_text_right' ]
                });

                texts.left = _.createSvgElement({
                    tag: 'text',
                    classes: [ 'node_text', 'node_text_left' ]
                });

                texts.top = _.createSvgElement({
                    tag: 'text',
                    classes: [ 'node_text', 'node_text_top' ]
                });

                texts.bottom = _.createSvgElement({
                    tag: 'text',
                    classes: [ 'node_text', 'node_text_bottom' ]
                });

                resize(NODE_HEIGHT);

                wrapper.appendChild(circle);
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
                onNodeClick.dispatch(nodeView2);
                event.stopPropagation();
            }

            function onDoubleClick(event) {
                onNodeToggleChildren.dispatch(nodeView2);
                event.stopPropagation();
            }

            function resize(nodeSize) {
                var textPadding = 4;
                circle.setAttribute('r', nodeSize);
                texts.right.setAttribute('x',  (nodeSize + textPadding));
                texts.left.setAttribute('x', -(nodeSize + textPadding));
                texts.top.setAttribute('y', -(nodeSize + textPadding));
                texts.bottom.setAttribute('y',  (nodeSize + textPadding));
            }

            function setPosition(x, y) {
                position.x = x;
                position.y = y;
                wrapper.setAttribute('transform', 'translate(' + x + ',' + y + ')');
            }

            function getPosition() {
                return position;
            }

            function updateLink(sx, sy, tx, ty) {
                link.setAttribute('stroke-width', '1');
                link.setAttribute('d', 'M' + sx + ' ' + sy + ' L' + tx + ' ' + ty);
            }

            function setCenterText(value) {
                texts.center.innerHTML = value;
            }

            function setTopText(value) {
                texts.top.innerHTML = value;
            }

            function setBottomText(value) {
                texts.bottom.innerHTML = value;
            }

            function setLeftText(value) {
                texts.left.innerHTML = value;
            }

            function setRightText(value) {
                texts.right.innerHTML = value;
            }

        }

        function setFlipTextToRight(value) {
            flipTextToRight = value;
        }

        function setRightTextOption(optionIndex) {
            textGetters.right = TEXT_GETTER_OPTIONS[optionIndex];
        }

        function setTopTextOption(optionIndex) {
            textGetters.top = TEXT_GETTER_OPTIONS[optionIndex];
        }

        function setBottomTextOption(optionIndex) {
            textGetters.bottom = TEXT_GETTER_OPTIONS[optionIndex];
        }

        // ==== Texts ====

            function getActualLeftText(nodeView) {
                var leftText = getTextLeft(nodeView);
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
                return rightText || getTextLeft(nodeView);
            }

            function getEmptyText(nodeView) {
                return '';
            }

            function getTextLeft(nodeView) {
                return nodeView.fd3Data.appearance.textLeft;
            }

            function getTextRight(nodeView) {
                return nodeView.fd3Data.appearance.textEnding;
            }

            function getTextToggle(nodeView) {

                if (!_.isNonEmptyArray(NodeView.getAllChildren(nodeView))) return null;

                var hasVisible = NodeView.hasVisibleChildren(nodeView);
                var hasHidden  = NodeView.hasHiddenChildren(nodeView);
                if (hasVisible && !hasHidden)  return CHAR_HIDE;
                if (hasHidden  && !hasVisible) return CHAR_EXPAND;

                return CHAR_MIXED;

            }

            function getTextDuration(nodeView) {
                var frameData = nodeView.fd3Data.binding.targetDataNode.frameData;
                if (!frameData) return '';
                return 's=' + frameData[0] + ' d=' + frameData.reduce(function(acc, curr) {
                    return acc + curr;
                }, 0); // + ' // ' + frameData;
            }

        // ===============

    }

);