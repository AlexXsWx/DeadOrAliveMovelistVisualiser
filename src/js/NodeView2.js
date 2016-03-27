define('NodeView2', ['Tools'], function(_) {
    
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
            setPosition:   setPosition,
            setCenterText: setCenterText,
            setTopText:    setTopText,
            setBottomText: setBottomText,
            setLeftText:   setLeftText,
            setRightText:  setRightText,
        };

        function createDomNodes() {

            // link = _.createSvgElement({ tag: 'path' });
            
            wrapper = _.createSvgElement({ tag: 'g' });
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

        }

        function resize(nodeSize) {
            var textPadding = 4;
            circle.setAttribute('r', nodeSize/* / 3.0*/);
            texts.right.setAttribute('x',  (nodeSize + textPadding));
            texts.left.setAttribute('x', -(nodeSize + textPadding));
            texts.top.setAttribute('y', -(nodeSize + textPadding));
            texts.bottom.setAttribute('y',  (nodeSize + textPadding));
        }

        function setPosition(x, y) {
            wrapper.setAttribute('transform', 'translate(' + x +',' + y + ')');
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