define('node', ['treeTools', 'tools'], function(treeTools, _) {

    var RGX_PUNCH = /^\d*p(?:\+k)?$/i;
    var RGX_KICK  = /(?:h\+)?k$/i;
    var RGX_HOLD  = /^\d+h$/i;
    var RGX_THROW = /^\d*t$/i;

    return createNodeGenerator;


    function createNode(id, name, parent) {

        return {

            id: id,
            parent: parent || null,
            children: {
                all:     [],
                visible: [],
                hidden:  []
            },

            totalChildren: 0,
            deepness: 0,
            branchesAfter: 0,

            name: name, // todo: rename to input?

            moveInfo: {
                heightClass: undefined, // high / mid / low
                actionType: undefined, // strike / throw / hold / special
                strikeType: undefined // 'punch' or 'kick'
                // isJumpStrike: undefined, // bool
                // isOffensiveHold: undefined // bool
            },

            lastPosition: {
                x: undefined,
                y: undefined
            }

            // scrollRange: {
            //     from: undefined,
            //     to:   undefined
            // }

        };

    }


    function createNodeGenerator() {

        var counter = 1;

        return {

            fromJson: fromJson,

            generate: generateNode,
            // fillScrollRange: fillScrollRange,

            getAllChildren: getAllChildren,
            getVisibleChildren: getVisibleChildren,
            getId: getId,

            toggleVisibleChildren: toggleVisibleChildren,
            backupPosition: backupPosition,
            swapXY: swapXY
            // resetScrollRangeForDatum: resetScrollRangeForDatum

        };


        function generateNode(name, parent) {

            return {

                // hide info in the fuck-d3-data so it has its very own place and is not affected by d3
                fd3Data: createNode(counter++, name, parent),

                // data filled by d3
                x: undefined,
                y: undefined,
                depth: undefined,
                parent: undefined,
                children: undefined
            };

        }


        function fromJson(root, name, parent) {

            var result = generateNode(name, parent);

            // todo - move up?
            if (!_.isObject(root)) {
                console.error('Error: not an object:', root);
                return result;
            }

            fillMoveInfoFromInput(result);

            var propNames = Object.getOwnPropertyNames(root);

            propNames.forEach(function(propName) {
                var moveInfo = result.fd3Data.moveInfo;
                if (!propName) {
                    moveInfo.endsWith = root[propName];
                } else
                if (propName === 'meta') {
                    _.copyKeysInto(moveInfo, root[propName]);
                    if (moveInfo.actionType == 'special') {
                        moveInfo.strikeType = undefined;
                    }
                } else {
                    var child = fromJson(root[propName], propName, result);
                    result.fd3Data.children.all.push(child);
                    result.fd3Data.children.visible.push(child);
                }
            });

            return result;

        }
        
    }



    function fillMoveInfoFromInput(datum) {
        var name = datum.fd3Data.name;
        var moveInfo = datum.fd3Data.moveInfo;
        if (RGX_PUNCH.test(name)) { moveInfo.actionType = 'strike'; moveInfo.strikeType = 'punch'; } else
        if (RGX_KICK.test(name))  { moveInfo.actionType = 'strike'; moveInfo.strikeType = 'kick';  } else
        if (RGX_HOLD.test(name))  { moveInfo.actionType = 'hold';  } else
        if (RGX_THROW.test(name)) { moveInfo.actionType = 'throw'; } else {
            // moveInfo.actionType = 'special';
        }
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

    function toggleVisibleChildren(datum) {
        var temp = datum.fd3Data.children.hidden;
        datum.fd3Data.children.hidden = datum.fd3Data.children.visible; // FIXME: unique arrays?
        datum.fd3Data.children.visible = temp;
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

});