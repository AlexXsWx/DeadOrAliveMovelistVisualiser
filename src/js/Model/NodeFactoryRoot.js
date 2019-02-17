define(

    'Model/NodeFactoryRoot',

    [ 'Model/NodeFactoryStance', 'Tools/Tools' ],

    function NodeFactoryRoot(NodeFactoryStance, _) {

        return {
            createRootNode: createRootNode,
            isRootNode:     isRootNode,
            serialize:      serialize
        };

        function getDefaultData() {
            return {
                character: undefined,
                version:   undefined,
                stances: []
            };
        }

        function createRootNode(optSource, optShared, optSharedStorage) {
            var result = _.defaults(optSource, getDefaultData());
            for (var i = 0; i < result.stances.length; ++i) {
                result.stances[i] = NodeFactoryStance.createStanceNode(result.stances[i]);
            }
            return result;
        }

        function isRootNode(nodeData) {
            return nodeData.hasOwnProperty('character');
        }

        function serialize(nodeData, shared) {
            return _.withoutFalsyProperties(
                nodeData,
                {
                    stances: function(stanceNodeDatas) {
                        return _.withoutFalsyElements(
                            stanceNodeDatas.map(function(stanceNodeData) {
                                return NodeFactoryStance.serialize(stanceNodeData, shared);
                            })
                        );
                    }
                }
            );
        }
    }
);
