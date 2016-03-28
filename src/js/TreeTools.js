define('TreeTools', function TreeTools() {

    return {
        layoutTree:               layoutTree,
        getChildrenMergedByDepth: getChildrenMergedByDepth,
        forAllCurrentChildren:    forAllCurrentChildren
    };

    function layoutTree(root, getChildren, getChildSize, setCoordinates, setLink) {

        layoutChildren(root, 0, 0, null, null);

        // var childrenMergedByDepth = getChildrenMergedByDepth(root, getChildren);

        // for (var i = childrenMergedByDepth.length - 2; i >= 0; --i) {
        //     var childrenAtCurrentDepth = childrenMergedByDepth[i];
        //     for (var j = 0; j < childrenAtCurrentDepth.length; ++j) {
        //         var child = childrenAtCurrentDepth[j]
        //         var children = getChildren(child);
        //         if (children.length > 1) {
        //             var pos = child.getPosition();
        //             setCoordinates(
        //                 child,
        //                 pos.x,
        //                 0.5 * (children[0].getPosition().y + children[children.length - 1].getPosition().y)
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
                nodesAtNextDepth = nodesAtNextDepth.concat(childrenAccessor(node));
            });

        } while (nodesAtNextDepth.length > 0);

        return result;

    }

    // TODO: rename; misleading 'current'
    function forAllCurrentChildren(dataRoot, childrenAccessor, action) {

        var nodesAtIteratedDepth = [dataRoot];

        do {

            var nodesAtNextDepth = [];

            nodesAtIteratedDepth.forEach(function(node) {
                Array.prototype.push.apply(
                    nodesAtNextDepth,
                    childrenAccessor(node)
                );
                action(node);
            });

            nodesAtIteratedDepth = nodesAtNextDepth;

        } while (nodesAtIteratedDepth.length > 0);

    }

});