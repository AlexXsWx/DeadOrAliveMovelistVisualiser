define(

    'Tools/TreeTools',

    ['d3'],

    function TreeTools(d3) {

        return {
            layoutTreeWithD3:         layoutTreeWithD3,
            getChildrenMergedByDepth: getChildrenMergedByDepth,
            forAllCurrentChildren:    forAllCurrentChildren,
            createVisitedTracker:     createVisitedTracker
        };

        // FIXME: get rid of d3...
        function layoutTreeWithD3(root, getId, getChildren, getChildSize, setCoordinates) {

            var treeGenerator = d3.layout.tree();
            var rootSize = getChildSize(root);
            treeGenerator.nodeSize([rootSize.height, rootSize.width]);

            var originalsById = {};
            var fakeRootDatum = fakeNode(root, getId, getChildren, originalsById);

            var nodes = treeGenerator.nodes(fakeRootDatum);

            forAllCurrentChildren(fakeRootDatum, function(e) { return e.children; }, function(datum) {

                var swap = datum.y;
                datum.y = datum.x;
                datum.x = swap;

                if (datum.parent) {
                    setCoordinates(originalsById[datum.id], datum.x, datum.y, datum.parent.x, datum.parent.y);
                } else {
                    setCoordinates(originalsById[datum.id], datum.x, datum.y, datum.x, datum.y);
                }

            });

            function fakeNode(datum, getId, getChildren, originalsById) {
                var result = {
                    id: getId(datum),
                    children: getChildren(datum).map(function(child) {
                        return fakeNode(child, getId, getChildren, originalsById);
                    })
                };
                originalsById[result.id] = datum;
                return result;
            }

        }

        // Warning: skips repeated entries
        function getChildrenMergedByDepth(dataRoot, childrenAccessor, optOnce) {

            var visitedTracker = createVisitedTracker();

            var result = [];

            var nodesAtNextDepth = [ dataRoot ];

            do {

                result.push(nodesAtNextDepth);
                nodesAtNextDepth.forEach(function(node) {
                    visitedTracker.markVisited(node);
                });

                var nodesAtIteratedDepth = nodesAtNextDepth;
                nodesAtNextDepth = [];

                nodesAtIteratedDepth.forEach(function(node) {
                    var children = childrenAccessor(node);
                    if (optOnce) children = children.filter(visitedTracker.isNotVisited)
                    Array.prototype.push.apply(nodesAtNextDepth, children);
                });

            } while (nodesAtNextDepth.length > 0);

            return result;

        }

        /**
         * Does not include children that are added by `action`;
         * Still includes children removed by `action`
         * Iteration happens in order of depth, root first, leaves last
         */
        function forAllCurrentChildren(dataRoot, childrenAccessor, action, optOnce) {
            getChildrenMergedByDepth(dataRoot, childrenAccessor, optOnce).forEach(
                function(nodesAtIteratedDepth) {
                    nodesAtIteratedDepth.forEach(function(node) { action(node); });
                }
            );
        }

        function createVisitedTracker() {
            var visited = [];
            return {
                isVisited:    isVisited,
                isNotVisited: isNotVisited,
                markVisited:  markVisited
            };
            function isVisited(object)    { return visited.indexOf(object) >= 0;   }
            function isNotVisited(object) { return visited.indexOf(object) === -1; }
            function markVisited(object) { visited.push(object); }
        }
    }
);
