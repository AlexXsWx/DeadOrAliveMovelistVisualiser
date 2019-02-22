define(

    'Model/NodeFactoryStance',

    [ 'Model/NodeFactoryMove', 'Tools/Tools' ],

    function NodeFactoryStance(NodeFactoryMove, _) {

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

        function createStanceNode(optSource) {
            var result = _.defaults(optSource, getDefaultData());
            for (var i = 0; i < result.moves.length; ++i) {
                result.moves[i] = NodeFactoryMove.createMoveNode(result.moves[i]);
            }
            return result;
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
