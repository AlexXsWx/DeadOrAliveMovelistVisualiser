define(

    'Filter',

    [ 'NodeFactory'  ],

    function Filter(NodeFactory) {

        return { findNodes: findNodes };

        function findNodes(rootNodeData, advantage, filter, optPath, optStance) {

            var path = optPath || [rootNodeData];
            var stance = optStance || 'STD';

            var result = [];

            NodeFactory.getChildren(path[path.length - 1]).forEach(function(child) {

                var freeCancelAdvantage = -1;
                var followUpAdvantage = advantage;
                var fullPath = path.concat(child);
                var keepLooking = true;
                var freeCancelStance = null;

                if (NodeFactory.isMoveNode(child)) {
                    var frameData = child.frameData;
                    if (frameData && frameData.length > 0) {
                        var frames = 1;
                        for (var i = 0; i < frameData.length - 1; i += 2) {
                            frames += frameData[i];
                            var activeFrames = frameData[i + 1];
                            if (frames < advantage && advantage <= frames + activeFrames) {
                                if (filter(child)) {
                                    result.push(fullPath);   
                                }
                                keepLooking = false;
                            }
                            frames += activeFrames;
                        }
                        followUpAdvantage = advantage - frames;
                        freeCancelAdvantage = followUpAdvantage - frameData[frameData.length - 1];
                        freeCancelStance = child.endsWith;
                    } else {
                        keepLooking = false;
                    }
                } else
                if (NodeFactory.isStanceNode(child)) {
                    // FIXME: consider stance's endsWith
                    if (child.abbreviation !== stance) {
                        keepLooking = false;
                    }
                }

                if (keepLooking) {
                    if (followUpAdvantage > 0) {
                        result = result.concat(
                            findNodes(rootNodeData, followUpAdvantage, filter, fullPath)
                        );
                    }
                    if (freeCancelAdvantage > 0) {
                        result = result.concat(
                            findNodes(
                                rootNodeData,
                                freeCancelAdvantage,
                                filter,
                                fullPath.concat(rootNodeData),
                                freeCancelStance
                            )
                        );
                    }
                }

            });

            return filterResultsToString(result);

        }

        function filterResultsToString(results) {
            return results.filter(function(path) {
                return path.length > 0;
            }).map(function(path) {
                if (typeof path === 'string') return path;
                return path.filter(function(nodeData) {
                    return NodeFactory.isMoveNode(nodeData);
                }).map(function(nodeData) {
                    // if (NodeFactory.isStanceNode(nodeData)) {
                    //     return '[' + nodeData.abbreviation + ']';
                    // }
                    // if (NodeFactory.isMoveNode(nodeData)) {
                        var input = nodeData.input;
                        var context = nodeData.context.join(',');
                        if (context) context + ':' + input;
                        return input;
                    // }
                }).join(' ');
            }).join('\n');
        }

    }

);