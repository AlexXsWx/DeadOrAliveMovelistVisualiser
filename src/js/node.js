define('node', ['treeTools', 'tools'], function(treeTools, _) {

    var RGX_PUNCH = /^\d*p(?:\+k)?$/i;
    var RGX_KICK  = /(?:h\+)?k$/i;
    var RGX_HOLD  = /^\d+h$/i;
    var RGX_THROW = /^\d*t$/i;

    return {

        createGenerator: createGenerator,

        toJson: toJson,

        log: log,

        // fillScrollRange: fillScrollRange,
        guessMoveTypeByInput: guessMoveTypeByInput,

        getAllChildren: getAllChildren,
        getVisibleChildren: getVisibleChildren,
        getId: getId,
        getInput: getInput,

        forgetChild: forgetChild,

        toggleVisibleChildren: toggleVisibleChildren,
        backupPosition: backupPosition,
        swapXY: swapXY
        // resetScrollRangeForDatum: resetScrollRangeForDatum

        // setRelation: setRelation

    };


    function createNode(id, input, parent) {

        return {

            id: id,
            parent: parent || null,
            children: {
                all:     [],
                visible: [],
                hidden:  []
            },

            // domNode: null,

            isEditorPlaceholder: false,
            // isGroupElement: false,

            totalChildren: 0,
            deepness: 0,
            branchesAfter: 0,

            input: input,
            context: [],

            moveInfo: {
                heightClass: undefined, // high / mid / low
                actionType: undefined, // strike / throw / hold / ground attack / other
                strikeType: undefined, // 'punch' or 'kick'
                // isJumpStrike: undefined, // bool
                // isOffensiveHold: undefined // bool
                endsWith: undefined // stance
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


    function createGenerator() {

        var counter = 1;

        return {
            fromJson: fromJson,
            generate: generate,
        };


        function generate(input, parent) {

            return {

                // hide info in the fuck-d3-data so it has its very own place and is not affected by d3
                fd3Data: createNode(counter++, input, parent),

                // data filled by d3
                x: undefined,
                y: undefined,
                depth: undefined,
                parent: undefined,
                children: undefined
            };

        }


        function fromJson(root, input, parent) {

            var result = generate(input, parent);

            // todo - move up?
            if (!_.isObject(root)) {
                console.error('Error: not an object:', root);
                return result;
            }

            guessMoveTypeByInput(result);

            var propNames = Object.getOwnPropertyNames(root);

            propNames.forEach(function(propName) {
                var moveInfo = result.fd3Data.moveInfo;
                if (!propName) {
                    moveInfo.endsWith = root[propName];
                } else
                if (propName === 'meta') {
                    _.copyKeysInto(moveInfo, root[propName]);
                    if (moveInfo.actionType !== 'strike') {
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


    function toJson(dataRoot) {

        var result = {
            meta: {
                created: Date.now(),
                character: dataRoot.fd3Data.input
            },
            data: {}
        };

        // var stances = getAllChildren(dataRoot);
        // stances.forEach(function(stance) {
        //     // result.data[stance] = 
        // });

        return result;

    }


    function guessMoveTypeByInput(datum) {
        var input = datum.fd3Data.input;
        var moveInfo = datum.fd3Data.moveInfo;
        if (RGX_PUNCH.test(input)) {
            moveInfo.actionType = 'strike';
            moveInfo.strikeType = 'punch';
        } else
        if (RGX_KICK.test(input))  {
            moveInfo.actionType = 'strike';
            moveInfo.strikeType = 'kick';
        } else
        if (RGX_HOLD.test(input))  {
            moveInfo.actionType = 'hold';
            moveInfo.strikeType = undefined;
         } else
        if (RGX_THROW.test(input)) {
            moveInfo.actionType = 'throw';
            moveInfo.strikeType = undefined;
        } else {
            moveInfo.actionType = 'other';
            moveInfo.strikeType = undefined;
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

    function getInput(datum) {
        return datum.fd3Data.input;
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

    // function removeAllChildren(parent) {

    // }

    // function removeChild(parent, child) {

    // }

    // function setRelation(node, newParent) {

    // }

    function forgetChild(parentDatum, child) {
        var parentChildren = parentDatum.fd3Data.children;
        [
            parentChildren.all,
            parentChildren.visible,
            parentChildren.hidden
        ].forEach(function(children) {
            var index = children.indexOf(child);
            if (index >= 0) children.splice(index, 1);
        });
    }


    function log(datum) {

        console.group(datum);

        var output = [];

        var nodesAtIteratedDepth = [datum];

        do {

            var nodesAtNextDepth = [];

            nodesAtIteratedDepth.forEach(function(node) {

                var children = node.fd3Data.children;

                output.push({
                    parent: node.fd3Data.parent && getReadableId(node.fd3Data.parent),
                    id:    getId(node),
                    input: getInput(node),
                    allChildren:     childReadabledIds(children.all),
                    visibleChildren: childReadabledIds(children.visible),
                    hiddenChildren:  childReadabledIds(children.hidden),
                    x: node.x,
                    y: node.y,
                    depth: node.depth,
                    lastX: node.fd3Data.lastPosition.x,
                    lastY: node.fd3Data.lastPosition.y
                });

                Array.prototype.push.apply(
                    nodesAtNextDepth,
                    getAllChildren(node)
                );

            });

            nodesAtIteratedDepth = nodesAtNextDepth;

        } while (nodesAtIteratedDepth.length > 0);

        console.table(output);
        console.groupEnd();

    }

    function getReadableId(node) {
        return node.fd3Data.id + '#' + node.fd3Data.input;
    }

    function childReadabledIds(children) {
        return children.map(getReadableId).join(',');
    }

});