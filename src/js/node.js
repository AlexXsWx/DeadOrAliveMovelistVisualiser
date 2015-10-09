define('node', ['treeTools'], function(treeTools) {

    return createNodeGenerator;

    function createNodeGenerator() {

        var counter = 1;

        return {
            
            generate: generateNode,
            // fillScrollRange: fillScrollRange,

            getAllChildren: getAllChildren,
            getVisibleChildren: getVisibleChildren,
            getId: getId,
            backupPosition: backupPosition,
            swapXY: swapXY,
            // resetScrollRangeForDatum: resetScrollRangeForDatum

        };


        function generateNode(name, parent) {

            return {

                // hide info in the fuck-d3-data so it has its very own place and is not affected by d3
                fd3Data: {
                    parent: parent || null,
                    name: name, // todo: rename to input?
                    totalChildren: 0,
                    deepness: 0,
                    branchesAfter: 0,
                    children: {
                        all:     [],
                        visible: [],
                        hidden:  []
                    },
                    // scrollRange: {
                    //     from: undefined,
                    //     to:   undefined
                    // },
                    id: counter++,
                    moveInfo: null,
                    lastPosition: {
                        x: undefined,
                        y: undefined
                    }
                },

                // data filled by d3
                x: undefined,
                y: undefined,
                depth: undefined,
                parent: undefined,
                children: undefined
            };

        }



        // function fillScrollRange(data) {
            
        //     var childrenByDepth = treeTools.getChildrenMergedByDepth(
        //         data,
        //         getVisibleChildren
        //     );

        //     for (var i = childrenByDepth.length - 1; i > 0; --i) {
        //         var children = childrenByDepth[i];
        //         children.forEach(function(child) {
        //             var sr = child.parent.fd3Data.scrollRange;
        //             sr.from = Math.min(sr.from, child.y); // child.fd3Data.scrollRange.from);
        //             sr.to   = Math.max(sr.to,   child.y); // child.fd3Data.scrollRange.to);
        //         });
        //     }

        // }



        function getAllChildren(datum) {
            return datum.fd3Data.children.all;
        }

        function getVisibleChildren(datum) {
            return datum.fd3Data.children.visible;
        }

        function getId(datum) {
            return datum.fd3Data.id;
        }

        function backupPosition(datum) {
            datum.fd3Data.lastPosition.x = datum.x;
            datum.fd3Data.lastPosition.y = datum.y;
        }

        function swapXY(datum) {
            var swap = datum.x;
            datum.x = datum.y;
            datum.y = swap;
        }

        // function resetScrollRangeForDatum(datum) {
        //     datum.fd3Data.scrollRange.from = datum.y;
        //     datum.fd3Data.scrollRange.to   = datum.y;
        // }
        
    }

});