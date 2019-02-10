define(

    'Model/NodeFactoryStance',

    [ 'Model/NodeFactoryMove', 'Tools/Tools' ],

    function NodeFactoryStance(NodeFactoryMove, _) {

        return {
            createStanceNode: createStanceNode,
            isStanceNode:     isStanceNode
        };

        function createStanceNode(optSource, optValidateChildren) {

            var result = _.defaults(optSource, {
                abbreviation:      undefined, // string
                description:       undefined, // string
                appliesExtraFrame: undefined, // bool
                moves: []
            });

            if (optValidateChildren) {
                for (var i = 0; i < result.moves.length; ++i) {
                    result.moves[i] = NodeFactoryMove.createMoveNode(result.moves[i], true);
                }
            }

            return result;

        }

        function isStanceNode(nodeData) {
            return nodeData.hasOwnProperty('description');
        }

    }

);
