define(

    'Model/NodeFactoryRoot',

    [ 'Model/NodeFactoryStance', 'Tools/Tools' ],

    function NodeFactoryRoot(NodeFactoryStance, _) {

        return {
            createRootNode: createRootNode,
            isRootNode:     isRootNode
        };

        function createRootNode(optSource, optValidateChildren) {

            var result = _.defaults(optSource, {
                character: undefined,
                version:   undefined,
                abbreviations: {},
                stances: []
                // TODO: comment
            });

            if (optValidateChildren) {
                for (var i = 0; i < result.stances.length; ++i) {
                    result.stances[i] = NodeFactoryStance.createStanceNode(result.stances[i], true);
                }
            }

            return result;

        }

        function isRootNode(nodeData) {
            return nodeData.hasOwnProperty('character');
        }

    }

);
