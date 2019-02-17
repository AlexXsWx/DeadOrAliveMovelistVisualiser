define(

    'Model/NodeFactory',

    [
        'Model/NodeFactoryRoot',
        'Model/NodeFactoryStance',
        'Model/NodeFactoryMove',
        'Model/NodeFactoryActionStep',
        'Model/CommonStances',
        'Model/ActionType',
        'Tools/Tools'
    ],

    function NodeFactory(
        NodeFactoryRoot,
        NodeFactoryStance,
        NodeFactoryMove,
        NodeFactoryActionStep,
        CommonStances,
        ActionType,
        _
    ) {

        return {
            createEmptyData:    createEmptyData,
            getChildren:        getChildren,
            toString:           toString,
            toRichString:       toRichString,
            getNoInputFollowup: getNoInputFollowup,
            canBeDirectParent:  canBeDirectParent
        };

        function createEmptyData() {

            return NodeFactoryRoot.createRootNode({
                stances: [
                    createStandingStance(),
                    createSidestepStance(),
                    createGroundedStance()
                ]
            });

            function createStandingStance() {
                return NodeFactoryStance.createStanceNode({
                    abbreviation: CommonStances.Standing,
                    description: 'Standing',
                    appliesExtraFrame: true
                });
            }

            function createSidestepStance() {
                // when a non-tracking on first active frame misses due to sidestep,
                // further active frames will miss too?
                return NodeFactoryStance.createStanceNode({
                    abbreviation: CommonStances.Sidestepping,
                    description: 'Side step',
                    appliesExtraFrame: false,
                    moves: [
                        NodeFactoryMove.createMoveNode({
                            input: 'P',
                            actionSteps: [ createSidestepPunchMoveActionStep() ]
                        }),
                        NodeFactoryMove.createMoveNode({
                            input: 'K',
                            actionSteps: [
                                NodeFactoryActionStep.createMoveActionStep({
                                    actionMask: 'K',
                                    actionType: ActionType.Strike
                                })
                            ]
                        }),
                        NodeFactoryMove.createMoveNode({
                            input: '*',
                            frameData: [ 0, 0, 25 ],
                            endsWith: CommonStances.Standing
                        })
                    ]
                });

                function createSidestepPunchMoveActionStep() {
                    return NodeFactoryActionStep.createMoveActionStep({
                        actionMask: 'P',
                        actionType: ActionType.Strike
                        // starting from 14th frame (without counting extra initial frame),
                        // sidestep untouchable is inactive
                        // followup: 13.
                        // when followed up, sidestep untouchable shortens from 20 frames to 13
                    })
                }
            }

            function createGroundedStance() {
                return NodeFactoryStance.createStanceNode({
                    abbreviation: CommonStances.Grounded,
                    description: 'From the ground',
                    appliesExtraFrame: true,
                    moves: [
                        NodeFactoryMove.createMoveNode({
                            input: 'K',
                            actionSteps: [
                                NodeFactoryActionStep.createMoveActionStep({
                                    actionMask: 'mid K',
                                    actionType: ActionType.Strike,
                                    isTracking: true
                                })
                            ]
                        }),
                        NodeFactoryMove.createMoveNode({
                            input: '2K',
                            actionSteps: [
                                NodeFactoryActionStep.createMoveActionStep({
                                    actionMask: 'low K ground',
                                    actionType: ActionType.Strike,
                                    isTracking: true
                                })
                            ]
                        })
                    ]
                });
            }
        }

        function getChildren(nodeData) {
            if (NodeFactoryRoot.isRootNode(nodeData))     return nodeData.stances;
            if (NodeFactoryStance.isStanceNode(nodeData)) return nodeData.moves;
            if (NodeFactoryMove.isMoveNode(nodeData))     return nodeData.followUps;
            return null;
        }

        function toString(nodeData) {
            return toRichString(nodeData).map(function(entry) { return entry.text; }).join('');
        }

        function toRichString(nodeData) {
            if (NodeFactoryRoot.isRootNode(nodeData)) {
                if (nodeData.character) {
                    return text(nodeData.character);
                } else {
                    return placeholder('character');
                }
            } else
            if (NodeFactoryStance.isStanceNode(nodeData)) {
                var abbreviation = nodeData.abbreviation;
                if (abbreviation) {
                    return [
                        { text: '{',          className: 'lightgray' },
                        { text: abbreviation, className: 'gray'      },
                        { text: '}',          className: 'lightgray' }
                    ];
                } else {
                    return placeholder('stance');
                }
            } else
            if (NodeFactoryMove.isMoveNode(nodeData)) {
                var input = nodeData.input;
                if (!input) return placeholder('move');
                var context = nodeData.context.join(',');
                if (context) {
                    return [
                        { text: '{',     className: 'lightgray' },
                        { text: context, className: 'gray'      },
                        { text: '}',     className: 'lightgray' },
                        { text: input }
                    ];
                }
                return text(input);
            }
            _.report('Can\'t represent node %O with a string', nodeData);
            return [];
            function text(textValue) {
                return [{ text: textValue }];
            }
            function placeholder(text) {
                return [{ text: text, className: 'gray' }];
            }
        }

        function getNoInputFollowup(nodeData) {
            if (
                NodeFactoryStance.isStanceNode(nodeData) ||
                NodeFactoryMove.isMoveNode(nodeData)
            ) {
                var children = getChildren(nodeData);
                if (children) {
                    return _.find(children, function(childNodeData) {
                        return childNodeData.input === '*';
                    });
                }
            }
        }

        function canBeDirectParent(parentNodeData, childNodeData) {
            return (
                (
                    NodeFactoryStance.isStanceNode(childNodeData) &&
                    NodeFactoryRoot.isRootNode(parentNodeData)
                ) || (
                    NodeFactoryMove.isMoveNode(childNodeData) && (
                        NodeFactoryStance.isStanceNode(parentNodeData) ||
                        NodeFactoryMove.isMoveNode(parentNodeData)
                    )
                )
            );
        }

    }

);
