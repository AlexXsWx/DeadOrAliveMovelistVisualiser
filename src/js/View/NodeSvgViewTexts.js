define(

    'View/NodeSvgViewTexts',

    [
        'Model/NodeFactoryMove',
        'Model/NodeFactoryActionStepResult',
        'View/NodeView', 'View/NodeSvgViewTextGetters', 'Tools/Signal', 'Tools/Tools',
    ],

    function NodeSvgViewTexts(
        NodeFactoryMove,
        NodeFactoryActionStepResult,
        NodeView, NodeSvgViewTextGetters, createSignal, _
    ) {

        var textGetterOptions = [
            [ 'None',          NodeSvgViewTextGetters.getEmptyText        ],
            [ 'Ending',        NodeSvgViewTextGetters.getTextEnding       ],
            [ 'Active frames', NodeSvgViewTextGetters.getTextActiveFrames ],
            [ 'Cooldown',      NodeSvgViewTextGetters.getCooldown         ],
            [
                'Advantage on block',
                NodeSvgViewTextGetters.getAdvantageOnBlock,
                createGetAdvantage(NodeFactoryActionStepResult.doesDescribeGuard)
            ], [
                'Advantage on neutral hit',
                NodeSvgViewTextGetters.getAdvantageOnNeutralHit,
                createGetAdvantage(NodeFactoryActionStepResult.doesDescribeNeutralHit)
            ], [
                'Advantage on counter hit',
                NodeSvgViewTextGetters.getAdvantageOnCounterHit,
                createGetAdvantage(NodeFactoryActionStepResult.doesDescribeCounterHit)
            ], [
                'Advantage on hi counter hit',
                NodeSvgViewTextGetters.getAdvantageOnHiCounterHit,
                createGetAdvantage(NodeFactoryActionStepResult.doesDescribeHiCounterHit)
            ], [
                'Guaranteed adv. on back hit',
                NodeSvgViewTextGetters.getGuaranteedAdvantageOnBackHit,
                createGetAdvantage(NodeFactoryActionStepResult.doesDescribeBackHit, true)
            ],
            [ 'Reach',                    NodeSvgViewTextGetters.getReach                  ],
            [ 'Forcetech advantage',      NodeSvgViewTextGetters.getForcetechAdvantage     ],
            [ 'Hard knockdown advantage', NodeSvgViewTextGetters.getHardKnockdownAdvantage ],
            [ 'Followup delay',           NodeSvgViewTextGetters.getFollowupDelay          ],
            [ 'Comment',                  NodeSvgViewTextGetters.getComment                ],
            [ 'Tags',                     NodeSvgViewTextGetters.getMainTags               ]
            // TODO: implement
            // , [ 'Stun depth',    NodeSvgViewTextGetters.getEmptyText ],
            // [ 'Unhold duration', NodeSvgViewTextGetters.getEmptyText ]
        ].reduce(
            function(textGetterOptions, values) {
                var name               = values[0];
                var textGetter         = values[1];
                var optAdvantageGetter = values[2];
                console.assert(!textGetterOptions.has(textGetter), 'Getter already in use');
                textGetterOptions.set(
                    textGetter,
                    {
                        name: name,
                        advantageGetter: optAdvantageGetter
                    }
                );
                return textGetterOptions;
            },
            _.createObjectStorage()
        );

        function createGetAdvantage(actionStepResultPredicate, optGuaranteed) {
            return getAdvantage;
            function getAdvantage(nodeView) {
                var nodeData = NodeView.getNodeData(nodeView);
                if (!nodeData) return;
                return NodeFactoryMove.getAdvantageRange(
                    nodeData,
                    optGuaranteed
                        ? function(actionStepResult) {
                            return (
                                actionStepResult.criticalHoldDelay ||
                                NodeFactoryActionStepResult.getHitBlockOrStun(actionStepResult)
                            );
                        }
                        : NodeFactoryActionStepResult.getHitBlockOrStun,
                    actionStepResultPredicate,
                    NodeFactoryMove.isMoveNode(nodeData) ? NodeView.findAncestorNodeData(nodeView) : null
                );
            }
        }

        var textGetters = {
            top:    NodeSvgViewTextGetters.getEmptyText,
            right:  NodeSvgViewTextGetters.getTextEnding,
            bottom: NodeSvgViewTextGetters.getEmptyText
        };

        var flipTextToRight = false;

        var updateSignal = createSignal();

        var domCache = {
            root:        null,
            rightSelect: null
        };

        return {
            init:                           init,
            onUpdate:                       updateSignal.listenersManager,
            setRightTextToAdvantageOnBlock: setRightTextToAdvantageOnBlock,
            setRightTextToHardKnockdowns:   setRightTextToHardKnockdowns,
            hasTextAtTop:                   hasTextAtTop,
            hasTextAtBottom:                hasTextAtBottom,
            create:                         create
        };


        function init() {
            createDom(domCache, function(position, textGetter) {
                switch (position) {
                    case 'top':    textGetters.top    = textGetter; break;
                    case 'right':  textGetters.right  = textGetter; break;
                    case 'bottom': textGetters.bottom = textGetter; break;
                    default: console.error('Unexpected position: ', position);
                }
                updateSignal.dispatch(
                    position === 'right'
                        ? textGetterOptions.get(textGetter).advantageGetter || null
                        : undefined
                );

            });
            _.getDomElement('flipTextToRight').addEventListener('change', function(event) {
                var checkbox = this;
                flipTextToRight = checkbox.checked;
                updateSignal.dispatch();
            });
        }

        function createDom(outDomCache, changeListener) {
            outDomCache.root = _.getDomElement('additionalInfoSelector');
            outDomCache.root.appendChild(
                createLabeledRow(
                    'Top',
                    [
                        createSelect(
                            changeListener.bind(null, 'top'),
                            textGetters.top
                        )
                    ]
                )
            );

            outDomCache.rightSelect = createSelect(
                changeListener.bind(null, 'right'),
                textGetters.right
            );
            outDomCache.root.appendChild(
                createLabeledRow('Right', [ outDomCache.rightSelect ])
            );

            outDomCache.root.appendChild(
                createLabeledRow(
                    'Bottom',
                    [
                        createSelect(
                            changeListener.bind(null, 'bottom'),
                            textGetters.bottom
                        )
                    ]
                )
            );

            return;

            function createLabeledRow(label, children) {
                return _.createDomElement({
                    tag: 'tr',
                    children: [
                        _.createDomElement({
                            tag: 'td',
                            children: [
                                _.createDomElement({
                                    tag: 'label',
                                    children: [ _.createTextNode(label) ]
                                })
                            ]
                        }),
                        _.createDomElement({
                            tag: 'td',
                            children: children
                        })
                    ]
                });
            }

            function createSelect(changeListener, initiallySelectedTextGetter) {
                return _.createDomElement({
                    tag: 'select',
                    listeners: {
                        'change': function(event) {
                            var select = this;
                            var selectedOptionIndex = Number(select.selectedOptions[0]['value']);
                            console.assert(
                                selectedOptionIndex >= 0,
                                'Invalid selected option value'
                            );
                            return changeListener(
                                textGetterOptions.getKeys()[selectedOptionIndex]
                            );
                        }
                    },
                    children: textGetterOptions.getKeys().map(function(textGetter, index) {
                        var obj = textGetterOptions.get(textGetter);
                        var attributes = {
                            'value': index,
                        };
                        if (textGetter === initiallySelectedTextGetter) {
                            attributes['selected'] = true;
                        }
                        return _.createDomElement({
                            tag: 'option',
                            attributes: attributes,
                            children: [ _.createTextNode(obj.name) ]
                        });
                    })
                });
            }
        }

        function setRightTextToAdvantageOnBlock() {
            textGetters.right = NodeSvgViewTextGetters.getAdvantageOnBlock;
            domCache.rightSelect.selectedIndex = textGetterOptions.getIndex(textGetters.right);
        }

        function setRightTextToHardKnockdowns() {
            textGetters.right = NodeSvgViewTextGetters.getHardKnockdownAdvantage;
            domCache.rightSelect.selectedIndex = textGetterOptions.getIndex(textGetters.right);
        }

        function hasTextAtTop() {
            return textGetters.top !== NodeSvgViewTextGetters.getEmptyText;
        }

        function hasTextAtBottom() {
            return textGetters.bottom !== NodeSvgViewTextGetters.getEmptyText;
        }


        function create() {

            var texts = {
                center: null,
                top:    null,
                bottom: null,
                left:   null,
                right:  null
            };

            createSvgElements();

            return {
                addSelfToParent: addSelfToParent,
                updateByData:    updateByData,
                resize:          resize
            };;

            function updateByData(nodeView) {
                _.setTextContent(texts.left,   getActualLeftText(nodeView));
                _.setTextContent(texts.center, NodeView.text.getToggle(nodeView));
                _.setTextContent(texts.right,  getActualRightText(nodeView));
                _.setTextContent(texts.top,    textGetters.top(nodeView));
                _.setTextContent(texts.bottom, textGetters.bottom(nodeView));
            }

            function getActualLeftText(nodeView) {
                var flipToRight = flipTextToRight;
                if (NodeView.isRootNodeView(nodeView)) {
                    flipToRight = true;
                }
                var leftText = NodeSvgViewTextGetters.getTextMain(nodeView);
                if (!flipToRight) {
                    return leftText;
                }
                var rightText = textGetters.right(nodeView);
                return rightText ? leftText : '';
            }

            function getActualRightText(nodeView) {
                var flipToRight = flipTextToRight;
                if (NodeView.isRootNodeView(nodeView)) {
                    flipToRight = true;
                }
                var rightText = textGetters.right(nodeView);
                if (!flipToRight) {
                    return rightText;
                }
                return rightText || NodeSvgViewTextGetters.getTextMain(nodeView);
            }


            function createSvgElements() {
                texts.center = createNodeText('node_text_center');
                texts.right  = createNodeText('node_text_right');
                texts.left   = createNodeText('node_text_left');
                texts.top    = createNodeText('node_text_top');
                texts.bottom = createNodeText('node_text_bottom');
            }


            function addSelfToParent(parentElement) {
                parentElement.appendChild(texts.bottom);
                parentElement.appendChild(texts.center);
                parentElement.appendChild(texts.top);
                parentElement.appendChild(texts.right);
                parentElement.appendChild(texts.left);
            }


            function resize(nodeSize) {
                var textPadding = 5.0;
                var offset = nodeSize + textPadding;
                texts.right.setAttribute('x', offset);
                texts.left.setAttribute('x', -offset);
                texts.top.setAttribute('y', -1.5 * offset);
                texts.bottom.setAttribute('y', 1.5 * offset);
            }

            function createNodeText(extraClassName) {
                return _.createSvgElement({
                    tag: 'text',
                    classes: [ 'node_text', extraClassName ]
                });
            }

        }

    }

);
