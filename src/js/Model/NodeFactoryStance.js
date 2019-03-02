define(

    'Model/NodeFactoryStance',

    [ 'Model/NodeFactoryMove', 'Model/NodeFactoryHelpers', 'Tools/Tools' ],

    function NodeFactoryStance(NodeFactoryMove, NodeFactoryHelpers, _) {

        return {
            isStanceNode:     isStanceNode,
            createStanceNode: createStanceNode,
            serialize:        serialize
        };

        function isStanceNode(nodeData) {
            return nodeData.hasOwnProperty('description');
        }

        function getDefaultData() {
            return {
                abbreviation:      undefined, // string
                description:       undefined, // string
                appliesExtraFrame: undefined, // bool
                moves: []
            };
        }

        function createStanceNode(optSource, optCreator) {

            var creator = optCreator || NodeFactoryHelpers.defaultCreator;

            return creator(createSelf, createChildren, optSource);

            function createSelf(source) {
                return _.defaults(source, getDefaultData());
            }
            function createChildren(self) {
                for (var i = 0; i < self.moves.length; ++i) {
                    self.moves[i] = NodeFactoryMove.createMoveNode(self.moves[i], optCreator);
                }
            }
        }

        function serialize(nodeData, shared, createLink) {
            if (shared.has(nodeData)) return shared.get(nodeData).bump();
            var result;
            shared.set(nodeData, createLink(function() { return result; }));
            result = _.withoutFalsyProperties(
                nodeData,
                {
                    moves: function(moveNodeDatas) {
                        return _.withoutFalsyElements(
                            moveNodeDatas.map(function(moveNodeData) {
                                return NodeFactoryMove.serialize(moveNodeData, shared, createLink);
                            })
                        );
                    }
                }
            );
            return result;
        }
    }
);
