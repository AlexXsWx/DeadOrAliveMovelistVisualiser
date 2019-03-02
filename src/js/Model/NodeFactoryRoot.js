define(

    'Model/NodeFactoryRoot',

    [ 'Model/NodeFactoryStance', 'Model/NodeFactoryHelpers', 'Tools/Tools' ],

    function NodeFactoryRoot(NodeFactoryStance, NodeFactoryHelpers, _) {

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

        function createRootNode(optSource, optCreator) {

            var creator = optCreator || NodeFactoryHelpers.defaultCreator;

            return creator(createSelf, createChildren, optSource);

            function createSelf(source) {
                return _.defaults(source, getDefaultData());
            }
            function createChildren(self) {
                for (var i = 0; i < self.stances.length; ++i) {
                    self.stances[i] = NodeFactoryStance.createStanceNode(self.stances[i], optCreator);
                }
            }
        }

        function isRootNode(nodeData) {
            return nodeData.hasOwnProperty('character');
        }

        function serialize(nodeData, shared, createLink) {
            if (shared.has(nodeData)) return shared.get(nodeData).bump();
            var result;
            shared.set(nodeData, createLink(function() { return result; }));
            result = _.withoutFalsyProperties(
                nodeData,
                {
                    stances: function(stanceNodeDatas) {
                        return _.withoutFalsyElements(
                            stanceNodeDatas.map(function(stanceNodeData) {
                                return NodeFactoryStance.serialize(stanceNodeData, shared, createLink);
                            })
                        );
                    }
                }
            );
            return result;
        }
    }
);
