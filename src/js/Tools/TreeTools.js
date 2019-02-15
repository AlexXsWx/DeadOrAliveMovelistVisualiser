define(

    'Tools/TreeTools',

    ['d3'],

    function TreeTools(d3) {

        return {
            layoutTree:               layoutTree,
            layoutTreeWithD3:         layoutTreeWithD3,
            getChildrenMergedByDepth: getChildrenMergedByDepth,
            forAllCurrentChildren:    forAllCurrentChildren,
            isDescendant:             isDescendant
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

        function layoutTree(root, getChildren, getChildSize, setCoordinates, setLink) {

            layoutChildren(root, 0, 0, null, null);

            // var childrenMergedByDepth = getChildrenMergedByDepth(root, getChildren);

            // for (var i = childrenMergedByDepth.length - 2; i >= 0; --i) {
            //     var childrenAtCurrentDepth = childrenMergedByDepth[i];
            //     for (var j = 0; j < childrenAtCurrentDepth.length; ++j) {
            //         var child = childrenAtCurrentDepth[j]
            //         var children = getChildren(child);
            //         if (children.length > 1) {
            //             var pos = child.getPositionTarget();
            //             setCoordinates(
            //                 child,
            //                 pos.x,
            //                 0.5 * (children[0].getPositionTarget().y + children[children.length - 1].getPositionTarget().y)
            //             );
            //         }
            //     }
            // }

            function layoutChildren(element, x, y, parentX, parentY) {

                setCoordinates(element, x, y);
                if (parentX !== null && parentY !== null) {
                    setLink(element, x, y, parentX, parentY);
                }

                var childX = x + getChildSize(element).width;
                var childY = y;
                var childYOffset = 0;

                var children = getChildren(element);
                if (children.length > 0) {
                    for (var i = 0; i < children.length; ++i) {
                        var child = children[i];
                        childYOffset += layoutChildren(child, childX, childY + childYOffset, x, y);
                    }
                    return childYOffset;
                } else {
                    return getChildSize(element).height;
                }

            }

        }

        function getChildrenMergedByDepth(dataRoot, childrenAccessor) {

            var result = [];

            var nodesAtNextDepth = [ dataRoot ];

            do {

                result.push(nodesAtNextDepth);

                var nodesAtIteratedDepth = nodesAtNextDepth;
                nodesAtNextDepth = [];

                nodesAtIteratedDepth.forEach(function(node) {
                    Array.prototype.push.apply(
                        nodesAtNextDepth,
                        childrenAccessor(node)
                    );
                });

            } while (nodesAtNextDepth.length > 0);

            return result;

        }

        /**
         * Does not include children that are added by `action`;
         * Still includes children removed by `action`
         * Iteration happens in order of depth, root first, leaves last
         */
        function forAllCurrentChildren(dataRoot, childrenAccessor, action) {
            getChildrenMergedByDepth(dataRoot, childrenAccessor).forEach(
                function(nodesAtIteratedDepth) {
                    nodesAtIteratedDepth.forEach(function(node) { action(node); });
                }
            );
        }

        function isDescendant(parent, child, childrenAccessor) {
            if (child === parent) return true;
            return getChildrenMergedByDepth(parent, childrenAccessor).some(
                function(nodesAtIteratedDepth) {
                    return nodesAtIteratedDepth.indexOf(child) >= 0;
                }
            );
        }

    }

);
