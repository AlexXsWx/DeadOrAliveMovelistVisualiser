define('NodeView2', ['NodeView', 'NodeFactory', 'Tools'], function(NodeView, NodeFactory, _) {
    
    return { create: create };

    function create(NODE_HEIGHT) {

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

        createDomNodes();

        return {
            wrapper:       wrapper,
            link:          link,
            setPosition:   setPosition,
            updateLink:    updateLink,
            setCenterText: setCenterText,
            setTopText:    setTopText,
            setBottomText: setBottomText,
            setLeftText:   setLeftText,
            setRightText:  setRightText,
            updateClassesByData: updateClassesByData
        };

        function updateClassesByData(datum) {

            var classes = {
                'container': _.isNonEmptyArray(NodeView.getAllChildren(datum)),

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

            var nodeData = datum.fd3Data.binding.targetDataNode;

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
                classes: [ 'node' ]
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

        function resize(nodeSize) {
            var textPadding = 4;
            circle.setAttribute('r', nodeSize);
            texts.right.setAttribute('x',  (nodeSize + textPadding));
            texts.left.setAttribute('x', -(nodeSize + textPadding));
            texts.top.setAttribute('y', -(nodeSize + textPadding));
            texts.bottom.setAttribute('y',  (nodeSize + textPadding));
        }

        function setPosition(x, y) {
            wrapper.setAttribute('transform', 'translate(' + x + ',' + y + ')');
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

});