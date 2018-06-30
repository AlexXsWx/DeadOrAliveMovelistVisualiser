define(

    'CanvasManager',

    [ 'Tools/Tools' ],

    function CanvasManager(_) {

        var PADDING = 50;

        var SCROLLBAR_SIZE = 20;
        function getBodyScrollbarWidth()  { return SCROLLBAR_SIZE; }
        function getBodyScrollbarHeight() { return SCROLLBAR_SIZE; }

        return { create: create };

        function create(rootNode) {

            var domRefs = {
                svg:         null,
                canvas:      null,
                linksParent: null,
                nodesParent: null,
            };

            var renderHack = createRenderHackManager();

            rootNode.appendChild(
                domRefs.svg = _.createSvgElement({
                    tag: 'svg',
                    attributes: {
                        'version': 1.1,
                        'xmlns': 'http://www.w3.org/2000/svg'
                    },
                    children: [
                        renderHack.element,
                        domRefs.canvas = _.createSvgElement({
                            tag: 'g',
                            classes: [ 'canvas' ],
                            children: [
                                domRefs.linksParent = _.createSvgElement({
                                    tag: 'g',
                                    classes: [ 'links' ]
                                }),
                                domRefs.nodesParent = _.createSvgElement({
                                    tag: 'g',
                                    classes: [ 'nodes' ]
                                })
                            ]
                        })
                    ]
                })
            );

            renderHack.installHook(domRefs.canvas);

            return {
                addNode:                     addNode,
                normalize:                   normalize,
                scrollToSvgNodeViewIfNeeded: scrollToSvgNodeViewIfNeeded
            };

            function addNode(link, node) {
                domRefs.linksParent.appendChild(link);
                domRefs.nodesParent.appendChild(node);
            }

            /** Aligns SVG's children so that they are always below SVG's top edge */
            function normalize(offsetX, offsetY, totalWidth, totalHeight) {

                domRefs.canvas.setAttribute(
                    'style',
                    'transform: translate(' +
                        (PADDING + offsetX) + 'px,' +
                        (PADDING + offsetY) + 'px' +
                    ')'
                );

                var body = document.body;

                var width  = totalWidth  + 2 * PADDING;
                var height = totalHeight + 2 * PADDING;

                width += getMenuWidth();

                // Keep it screen size to avoid culling when svg animates shrinking
                width  = Math.max(body.clientWidth  - getBodyScrollbarWidth(),  width);
                height = Math.max(body.clientHeight - getBodyScrollbarHeight(), height);

                domRefs.svg.setAttribute('width',  width);
                domRefs.svg.setAttribute('height', height);

                renderHack.resize(height);

            }

        }

        function scrollToSvgNodeViewIfNeeded(nodeSvgView, minY) {
            var positionSvg = nodeSvgView.getPositionTarget();
            var positionDocumentX = positionSvg.x;
            var positionDocumentY = positionSvg.y - minY;

            var body = document.body;
            var activeAreaWidth  = body.clientWidth  - getBodyScrollbarWidth() - getMenuWidth();
            var activeAreaHeight = body.clientHeight - getBodyScrollbarHeight();

            limitScroll(
                positionDocumentX - PADDING,
                positionDocumentY - PADDING,
                positionDocumentX - activeAreaWidth  + 2 * PADDING,
                positionDocumentY - activeAreaHeight + 2 * PADDING
            );
        }

        function limitScroll(maxX, maxY, minX, minY) {
            // TODO: animate
            var scrollX = window.scrollX;
            var scrollY = window.scrollY;
            if (scrollX < minX) { setScrollX(minX); } else
            if (scrollX > maxX) { setScrollX(maxX); }
            if (scrollY < minY) { setScrollY(minY); } else
            if (scrollY > maxY) { setScrollY(maxY); }
        }

        function setScrollX(x) { window.scroll(x, window.scrollY); }
        function setScrollY(y) { window.scroll(window.scrollX, y); }

        function getMenuWidth() {
            // FIXME: get actual menu width
            // I hate CSS...
            return 375;
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
