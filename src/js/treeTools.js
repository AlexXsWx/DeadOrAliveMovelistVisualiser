define('treeTools', function() {

    return {
        getChildrenMergedByDepth: getChildrenMergedByDepth        
    };

    function getChildrenMergedByDepth(root, childrenAccessor) {

        var result = [];

        var newColumn = [ root ];

        do {

            result.push(newColumn);

            var currentColumn = newColumn;
            newColumn = [];

            currentColumn.forEach(function(node) {
                newColumn = newColumn.concat(childrenAccessor(node));
            });

        } while (newColumn.length > 0);

        return result;

    }

});