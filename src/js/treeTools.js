define('treeTools', function() {

    return {
        getChildrenMergedByDepth: getChildrenMergedByDepth,
        forAllCurrentChildren:    forAllCurrentChildren
    };

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