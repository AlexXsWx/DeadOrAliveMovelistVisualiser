define(

    'NodeSvgIndicatorsView',

    ['NodeFactory', 'Tools'],

    function NodeSvgIndicatorsView(NodeFactory, _) {

        var HEIGHT_MASK_SHAPE = '-2,3 2,0 -2,-3';
        var HEIGHT_MASK_GROUND_SHAPE = '-5,0 5,0';

        var HEIGHT_INDICATOR_TYPE = {
            none:       0,
            tracking:   1,
            direct:     2,
            notDefined: 3
        };

        return {
            create: create
        };

        function create(insertIndicatorsAfter) {

            var indicators = {
                high: null,
                middle: null,
                bottom: null,
                ground: null,
                knockback: null
            };

            /** Cached value since last `update` */
            var nodeSize = 0.0;

            return {
                update: update
            };

            function update(nodeData, newNodeSize) {

                nodeSize = newNodeSize;

                var highType   = HEIGHT_INDICATOR_TYPE.none;
                var midType    = HEIGHT_INDICATOR_TYPE.none;
                var lowType    = HEIGHT_INDICATOR_TYPE.none;
                var groundType = HEIGHT_INDICATOR_TYPE.none;

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

                indicators.high = updateHeightIndicator(indicators.high, -45, highType);
                indicators.mid  = updateHeightIndicator(indicators.mid,    0, midType);
                indicators.low  = updateHeightIndicator(indicators.low,   45, lowType);
                indicators.ground = updateGroundHitIndicator(indicators.ground, groundType);
                indicators.knockback = updateKnockbackIndicator(indicators.knockback, false);

            }

            function updateHeightIndicator(indicator, angle, type) {
                var result = indicator;
                if (type === HEIGHT_INDICATOR_TYPE.none) {
                    if (result) {
                        _.removeElementFromParent(result);
                        result = null;
                    }
                } else {
                    if (!result) {
                        result = createHeightIndicator();
                        addIndicatorElement(result);
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
                        _.removeElementFromParent(result);
                        result = null;
                    }
                } else {
                    if (!result) {
                        result = createGroundHitIndicator();
                        addIndicatorElement(result);
                    }
                }
                return result;
            }

            function updateKnockbackIndicator(indicator, knocksBack) {
                var result = indicator;
                if (!knocksBack) {
                    if (result) {
                        _.removeElementFromParent(result);
                        result = null;
                    }
                } else {
                    if (!result) {
                        result = createKnockbackIndicator();
                        addIndicatorElement(result);
                    }
                }
                return result;
            }

            function addIndicatorElement(element) {
                insertIndicatorsAfter.parentNode.insertBefore(
                    element,
                    insertIndicatorsAfter.nextSibling
                );
            }

            function createHeightIndicator() {
                var result = createSvgElementClassed('polyline', [ 'node_mask_height_indicator' ]);
                result.setAttribute('points', HEIGHT_MASK_SHAPE);
                return result;
            }

            function createKnockbackIndicator() {
                var result = createSvgElementClassed('path', [ 'node_knockback_indicator' ]);
                var r = 5;
                result.setAttribute('d', 'm0,' + r + ' a' + r + ',' + r + ' 90 0,0 0,' + -2 * r);
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