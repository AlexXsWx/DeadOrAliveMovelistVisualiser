define(

    'Model/NodeFactory',

    [
        'Model/NodeFactoryRoot',
        'Model/NodeFactoryStance',
        'Model/NodeFactoryMove',
        'Model/NodeFactoryActionStep',
        'Model/NodeFactoryActionStepResult',
        'Model/CommonStances',
        'Model/ActionType',
        'Tools/Tools'
    ],

    function NodeFactory(
        NodeFactoryRoot,
        NodeFactoryStance,
        NodeFactoryMove,
        NodeFactoryActionStep,
        NodeFactoryActionStepResult,
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

            createRootNode:             NodeFactoryRoot.createRootNode,
            createStanceNode:           NodeFactoryStance.createStanceNode,
            createMoveNode:             NodeFactoryMove.createMoveNode,
            createMoveActionStep:       NodeFactoryActionStep.createMoveActionStep,
            createMoveActionStepResult: NodeFactoryActionStepResult.createMoveActionStepResult,

            isRootNode:   NodeFactoryRoot.isRootNode,
            isStanceNode: NodeFactoryStance.isStanceNode,
            isMoveNode:   NodeFactoryMove.isMoveNode,

            isMoveHorizontal:                       NodeFactoryMove.isMoveHorizontal,
            isMoveVertical:                         NodeFactoryMove.isMoveVertical,
            isMovePunch:                            NodeFactoryMove.isMovePunch,
            isMoveKick:                             NodeFactoryMove.isMoveKick,
            isMoveThrow:                            NodeFactoryMove.isMoveThrow,
            isMoveOffensiveHold:                    NodeFactoryMove.isMoveOffensiveHold,
            isMoveHold:                             NodeFactoryMove.isMoveHold,
            isMoveHoldOnly:                         NodeFactoryMove.isMoveHoldOnly,
            canMoveHitGround:                       NodeFactoryMove.canMoveHitGround,
            getMoveSummary:                         NodeFactoryMove.getMoveSummary,
            getAdvantageRange:                      NodeFactoryMove.getAdvantageRange,
            getActiveFramesRangeThatIntersectsWith: NodeFactoryMove.getActiveFramesRangeThatIntersectsWith,
            getMoveDurationData:                    NodeFactoryMove.getMoveDurationData,
            // guessMoveTypeByInput:                   NodeFactoryMove.guessMoveTypeByInput

            isActionStepPunch:         NodeFactoryActionStep.isActionStepPunch,
            isActionStepKick:          NodeFactoryActionStep.isActionStepKick,
            isActionStepThrow:         NodeFactoryActionStep.isActionStepThrow,
            isActionStepOffensiveHold: NodeFactoryActionStep.isActionStepOffensiveHold,
            isActionStepHold:          NodeFactoryActionStep.isActionStepHold,
            isActionStepJumpAttack:    NodeFactoryActionStep.isActionStepJumpAttack,
            isActionStepGroundAttack:  NodeFactoryActionStep.isActionStepGroundAttack,
            isActionStepOther:         NodeFactoryActionStep.isActionStepOther,
            isActionStepHigh:          NodeFactoryActionStep.isActionStepHigh,
            isActionStepMid:           NodeFactoryActionStep.isActionStepMid,
            isActionStepLow:           NodeFactoryActionStep.isActionStepLow,
            isActionStepHorizontal:    NodeFactoryActionStep.isActionStepHorizontal,
            isActionStepVertical:      NodeFactoryActionStep.isActionStepVertical,
            canActionStepHitGround:    NodeFactoryActionStep.canActionStepHitGround,
            getActionStepSummary:      NodeFactoryActionStep.getActionStepSummary,

            removeGuardConditionFromActionStepResult: NodeFactoryActionStepResult.removeGuardConditionFromActionStepResult,

            doesActionStepResultDescribeNeutralHit:     NodeFactoryActionStepResult.doesActionStepResultDescribeNeutralHit,
            doesActionStepResultDescribeCounterHit:     NodeFactoryActionStepResult.doesActionStepResultDescribeCounterHit,
            doesActionStepResultDescribeGuard:          NodeFactoryActionStepResult.doesActionStepResultDescribeGuard,
            doesActionStepResultDescribeForcetech:      NodeFactoryActionStepResult.doesActionStepResultDescribeForcetech,
            doesActionStepResultDescribeGroundHit:      NodeFactoryActionStepResult.doesActionStepResultDescribeGroundHit,
            doesActionStepResultDescribeGroundHitCombo: NodeFactoryActionStepResult.doesActionStepResultDescribeGroundHitCombo,
            isActionStepResultEmpty:                    NodeFactoryActionStepResult.isActionStepResultEmpty,
            doesActionStepResultTagHasHardKnockDown:    NodeFactoryActionStepResult.doesActionStepResultTagHasHardKnockDown,
            getActionStepResultHitBlock:                NodeFactoryActionStepResult.getActionStepResultHitBlock

        };

        function createEmptyData() {

            return NodeFactoryRoot.createRootNode({

                stances: [

                    NodeFactoryStance.createStanceNode({
                        abbreviation: CommonStances.Standing,
                        description: 'Standing',
                        appliesExtraFrame: true
                    }),

                    // when a non-tracking on first active frame misses due to sidestep, further active frames will miss too?
                    NodeFactoryStance.createStanceNode({
                        abbreviation: CommonStances.Sidestepping,
                        description: 'Side step',
                        appliesExtraFrame: false,
                        moves: [
                            NodeFactoryMove.createMoveNode({
                                input: 'P',
                                actionSteps: [
                                    NodeFactoryActionStep.createMoveActionStep({
                                        actionMask: 'P',
                                        actionType: ActionType.Strike
                                        // starting from 14th (without counting extra initial frame) frame sidestep untouchable is inactive
                                        // followup: 13.
                                        // when followed up, sidestep untouchable shortens from 20 frames to 13
                                    })
                                ]
                            }, true),
                            NodeFactoryMove.createMoveNode({
                                input: 'K',
                                actionSteps: [
                                    NodeFactoryActionStep.createMoveActionStep({
                                        actionMask: 'K',
                                        actionType: ActionType.Strike
                                    })
                                ]
                            }, true),
                            NodeFactoryMove.createMoveNode({
                                input: '*',
                                frameData: [ 0, 0, 25 ],
                                endsWith: CommonStances.Standing
                            }, true)
                        ]
                    }, true),

                    NodeFactoryStance.createStanceNode({
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
                            }, true),
                            NodeFactoryMove.createMoveNode({
                                input: '2K',
                                actionSteps: [
                                    NodeFactoryActionStep.createMoveActionStep({
                                        actionMask: 'low K',
                                        actionType: ActionType.Strike,
                                        isTracking: true,
                                        tags: ['ground attack']
                                    })
                                ]
                            }, true)
                        ]
                    }, true)

                ]

            }, true);

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

    }

);
