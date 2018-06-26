define(

    'CanvasManager',

    [ 'Tools/Tools' ],

    function CanvasManager(_) {

        var SCROLLBAR_SIZE = 20;

        return { create: create };

        function create(rootNode, padding) {

            var svg;
            var canvas;
            var linksParent;
            var nodesParent;

            var renderHack = createRenderHackManager();

            rootNode.appendChild(
                svg = _.createSvgElement({
                    tag: 'svg',
                    attributes: {
                        'version': 1.1,
                        'xmlns': 'http://www.w3.org/2000/svg'
                    },
                    children: [
                        renderHack.element,
                        canvas = _.createSvgElement({
                            tag: 'g',
                            classes: [ 'canvas' ],
                            children: [
                                linksParent = _.createSvgElement({ tag: 'g', classes: [ 'links' ] }),
                                nodesParent = _.createSvgElement({ tag: 'g', classes: [ 'nodes' ] })
                            ]
                        })
                    ]
                })
            );

            renderHack.installHook(canvas);

            return {
                addNode:                     addNode,
                normalize:                   normalize,
                scrollToSvgNodeViewIfNeeded: scrollToSvgNodeViewIfNeeded
            };

            function addNode(link, node) {
                linksParent.appendChild(link);
                nodesParent.appendChild(node);
            }

            function normalize(offsetX, offsetY, totalWidth, totalHeight) {

                canvas.setAttribute(
                    'style',
                    'transform: translate(' +
                        (padding + offsetX) + 'px,' +
                        (padding + offsetY) + 'px' +
                    ')'
                );

                var body = document.body;

                var width  = totalWidth  + 2 * padding;
                var height = totalHeight + 2 * padding;

                // I hate CSS...
                var menuTheoreticMaxWidth = 375;
                width += menuTheoreticMaxWidth;

                // Keep it screen size to avoid culling when svg animates shrinking
                width  = Math.max(body.clientWidth  - SCROLLBAR_SIZE, width);
                height = Math.max(body.clientHeight - SCROLLBAR_SIZE, height);

                svg.setAttribute('width',  width);
                svg.setAttribute('height', height);

                renderHack.resize(height);

            }

            function scrollToSvgNodeViewIfNeeded(nodeSvgView, offsetY) {
                // TODO: animate
                var nodeRootRelativeY = nodeSvgView.getPositionTarget().y;
                var nodeCenterDocumentY = nodeRootRelativeY - offsetY + padding;
                var body = document.body;
                if (body.scrollTop + padding > nodeCenterDocumentY) {
                    body.scrollTop = nodeCenterDocumentY - padding;
                } else
                if (body.scrollTop + body.clientHeight - padding - SCROLLBAR_SIZE < nodeCenterDocumentY) {
                    body.scrollTop = nodeCenterDocumentY - (body.clientHeight - padding - SCROLLBAR_SIZE);
                }
            }

        }

        // Chrome 67.0.3396.87 (Win-x64) does not render parts of svg that were offscreen
        // and went in screen because of CSS animation of transform property
        function createRenderHackManager() {

            var t1 = 'translate(0px, 0px)';
            var t2 = 'translate(1px, 0px)';

            var element = _.createSvgElement({
                tag: 'rect',
                attributes: {
                    'width': 10,
                    'height': 10,
                    'style': 'fill: white; opacity: 0.1'
                }
            });

            return {
                element: element,
                resize: resize,
                installHook: installHook
            };

            function installHook(targetElement) {
                targetElement.addEventListener(
                    'transitionend',
                    function(event) {
                        element.style.transform = (element.style.transform === t1) ? t2 : t1;
                    }
                );
            }

            function resize(newHeight) {
                element.setAttribute('height', newHeight);
            }

        }

    }

);
