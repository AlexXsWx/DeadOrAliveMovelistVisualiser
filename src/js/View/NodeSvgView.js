define(

    'View/NodeSvgView',

    [
        'View/NodeView', 'Model/NodeFactory',
        'View/NodeSvgIndicatorsView', 'View/NodeSvgViewTexts', 'View/NodeSvgViewAnimator',
        'Tools/Signal', 'Tools/SvgTools', 'Tools/Tools'
    ],

    function NodeSvgView(
        NodeView, NodeFactory,
        NodeSvgIndicatorsView, NodeSvgViewTexts, NodeSvgViewAnimator,
        createSignal, SvgTools, _
    ) {

        var NODE_WIDTH  = 150;
        var NODE_HEIGHT = 25;

        var onNodeClick          = createSignal();
        var onNodeToggleChildren = createSignal();
        var updateSignal         = createSignal();

        return {
            init:                           init,
            create:                         create,
            onUpdate:                       updateSignal.listenersManager,
            onNodeClick:                    onNodeClick.listenersManager,
            onNodeToggleChildren:           onNodeToggleChildren.listenersManager,
            setRightTextToAdvantageOnBlock: NodeSvgViewTexts.setRightTextToAdvantageOnBlock,
            setRightTextToHardKnockdowns:   NodeSvgViewTexts.setRightTextToHardKnockdowns,
            getNodeWidth:  function() { return NODE_WIDTH; },
            getNodeHeight: function() {
                var height = 1;
                if (NodeSvgViewTexts.hasTextAtTop()) {
                    height += 0.75;
                }
                if (NodeSvgViewTexts.hasTextAtBottom()) {
                    height += 0.75;
                }
                return height * NODE_HEIGHT;
            }
        };

        function init() {
            NodeSvgViewTexts.init();
            NodeSvgViewTexts.onUpdate.addListener(updateSignal.dispatch);
        }

        function create(nodeView) {

            var link;
            var wrapper;
            var additionalHitbox;
            var circle;
            var indicatorsView = null;
            var texts2 = NodeSvgViewTexts.create();

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
                texts2.updateByData(nodeView);
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
            }

            function updateClassesByData() {

                var classes = {
                    'container': NodeView.hasAnyChildren(nodeView),

                    'high': false,
                    'mid':  false,
                    'low':  false,

                    'strike':       false,
                    'throw':        false,
                    'OHGrab':       false,
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

                    if (NodeFactory.isMoveOffensiveHold(nodeData)) {
                        mark('OHGrab');
                    }
                    else
                    if (NodeFactory.isMoveThrow(nodeData)) {
                        mark('throw');
                    }

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

                link = _.createSvgElement({
                    tag: 'path',
                    classes: ['node_link']
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

                wrapper.appendChild(additionalHitbox);
                wrapper.appendChild(circle);
                // ... Place for indicators ...
                texts2.addSelfToParent(wrapper);

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

                circle.setAttribute('r', nodeSize);

                // FIXME: calculate size out of padding, and try to include text
                additionalHitbox.setAttribute('x',     -nodeSize * 3);
                additionalHitbox.setAttribute('width',  nodeSize * 6);
                additionalHitbox.setAttribute('y',     -nodeSize * 1.5);
                additionalHitbox.setAttribute('height', nodeSize * 3);

                texts2.resize(nodeSize);

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

    }

);
