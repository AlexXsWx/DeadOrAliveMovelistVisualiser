define(

    'View/NodeSvgView',

    [
        'View/NodeView',
        'Model/NodeFactoryMove', 'Model/NodeFactoryActionStep',
        'View/NodeSvgIndicatorsView', 'View/NodeSvgViewTexts', 'View/NodeSvgViewAnimator',
        'Tools/Signal', 'Tools/SvgTools', 'Tools/Tools'
    ],

    function NodeSvgView(
        NodeView,
        NodeFactoryMove, NodeFactoryActionStep,
        NodeSvgIndicatorsView, NodeSvgViewTexts, NodeSvgViewAnimator,
        createSignal, SvgTools, _
    ) {

        var NODE_WIDTH  = 150;
        var NODE_HEIGHT = 25;

        var onNodeClick          = createSignal();
        var onNodeToggleChildren = createSignal();
        var updateSignal         = createSignal();

        var getAdvantageFunc = null;

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
            NodeSvgViewTexts.onUpdate.addListener(function(optGetAdvantageFunc) {
                if (optGetAdvantageFunc !== undefined) {
                    getAdvantageFunc = optGetAdvantageFunc;
                }
                updateSignal.dispatch();
            });
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
                    circle.classList.remove('placeholder');
                }
                updateLinkColor();
                texts2.updateByData(nodeView);
                updateClassesByData();
                indicatorsView.update(NodeView.getNodeData(nodeView), nodeSize);
                updateLinkThickness();
            }

            function updateLinkColor() {
                link.classList.remove("guaranteed");
                if (getAdvantageFunc) {
                    var parentNodeView = NodeView.getParentNodeView(nodeView);
                    if (!parentNodeView) return;
                    var advantageRange = getAdvantageFunc(parentNodeView);
                    if (!advantageRange) return;
                    var ownNodeData = NodeView.getNodeData(nodeView);
                    var parentNodeData = NodeView.getNodeData(parentNodeView);
                    if (!NodeFactoryMove.isMoveNode(ownNodeData)) return;
                    if (!NodeFactoryMove.isMoveNode(parentNodeData)) return;
                    // TODO: some followup nodes might not have active frames, such as strike-throws
                    if (
                        advantageRange.min +
                        NodeFactoryMove.getActiveFramesCount(parentNodeData) - 1 +
                        NodeFactoryMove.getRecoveryFramesCount(parentNodeData) >
                        NodeFactoryMove.getActiveFrames(ownNodeData)[0]
                    ) {
                        link.classList.add("guaranteed");
                    }
                }
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

                if (nodeData && NodeFactoryMove.isMoveNode(nodeData)) {

                    var isPunch = NodeFactoryMove.isMovePunch(nodeData);
                    var isKick  = NodeFactoryMove.isMoveKick(nodeData);

                    // FIXME: mid P mid K
                    if (isPunch) mark('punch');
                    if (isKick)  mark('kick');
                    if (isPunch || isKick) mark('strike');

                    if (NodeFactoryMove.isMoveOffensiveHold(nodeData)) {
                        mark('OHGrab');
                    }
                    else
                    if (NodeFactoryMove.isMoveThrow(nodeData)) {
                        mark('throw');
                    }

                    // FIXME: sabaki - parry & attack
                    if (NodeFactoryMove.isMoveHold(nodeData)) mark('hold');

                    nodeData.actionSteps.forEach(function(actionStep) {
                        if (NodeFactoryActionStep.isActionStepJumpAttack(actionStep))   mark('jumpAttack');
                        if (NodeFactoryActionStep.isActionStepGroundAttack(actionStep)) mark('groundAttack');
                        if (NodeFactoryActionStep.isActionStepOther(actionStep))        mark('other');
                        if (NodeFactoryActionStep.isActionStepHigh(actionStep))         mark('high');
                        if (NodeFactoryActionStep.isActionStepMid(actionStep))          mark('mid');
                        if (NodeFactoryActionStep.isActionStepLow(actionStep))          mark('low');
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
                    classes: [ 'node_circle', 'placeholder' ]
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
                // Mimic wires passing through the node; using circle area formula
                var width = 2 * Math.sqrt((NodeView.getBranchesAfter(nodeView) + 1) / Math.PI);
                var minWidth = 2 * Math.sqrt(1 / Math.PI);
                var result = width / minWidth;
                var scale = 1.5;
                result = 1 + (result - 1) * scale;
                link.setAttribute('stroke-width', result);
            }

        }

    }

);
