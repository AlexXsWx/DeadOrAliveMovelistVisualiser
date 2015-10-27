define('node', ['treeTools', 'tools'], function(treeTools, _) {

    var RGX = {
        PUNCH: /^\d*p(?:\+k)?$/i,
        KICK:  /(?:h\+)?k$/i,
        HOLD:  /^\d+h$/i,
        THROW: /^\d*t$/i
    };


    var SPECIFIC_INFO_TYPE = {
        ROOT:   'root',
        STANCE: 'stance',
        MOVE:   'move',
        GROUP:  'group'
    };


    return {

        SPECIFIC_INFO_TYPE: SPECIFIC_INFO_TYPE,

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


    function createGenericNode(id, parent) {

        return {
            id: id,
            parent: parent || null,
            children: []
        };

    }


    function createD3TreeNode() {

        return {
            // data to be filled by d3 tree generator
            x: undefined,
            y: undefined,
            depth: undefined,
            parent: undefined,
            children: undefined
        };

    }


    function createVisualisationInfo() {

        return {

            visibleChildren: [],

            totalChildren: 0,
            deepness: 0,
            branchesAfter: 0,

            lastPosition: {
                x: undefined,
                y: undefined
            }

            // svgNode: null,
            // svgIncomingLink: null,

            // scrollRange: {
            //     from: undefined,
            //     to:   undefined
            // }

        };

    }


    function createRootSpecificInfo(characterName) {
        return {
            character: characterName,
            version:   undefined,
            timeSaved: undefined
        };
    }


    function createStanceSpecificInfo() {
        return {
            abbreviation: undefined,
            description: undefined,
            endsWith: undefined
        };
    }


    function createMoveSpecificInfo(input) {
        return {
            input: input,
            context: undefined,
            heightClass: undefined, // high / mid / low
            actionType: undefined, // strike / throw / hold / ground attack / other
            strikeType: undefined, // 'punch' or 'kick'
            // isJumpStrike: undefined, // bool
            // isOffensiveHold: undefined // bool
            endsWith: undefined // stance
        };
    }


    function createGroupSpecificInfo(name) {
        return {
            name: name
        };
    }


    function createRootNode(characterName) {
        return {

        };
    }


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
            fromJson2: fromJson2,
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


        function fromJson2(root) {

            var result = generate(root.character, null);
            var children = root.children.map(function(stance) {
                var stanceNode = generate(stance.name, result);
                var stanceChildren = stance.children.map(function(child) {
                    return parseChild(child, stanceNode);
                });
                stanceNode.fd3Data.children.all = stanceChildren;
                stanceNode.fd3Data.children.visible = stanceNode.fd3Data.children.all.slice(0);
                return stanceNode;
            });

            result.fd3Data.children.all = children;
            result.fd3Data.children.visible = result.fd3Data.children.all.slice(0);

            return result;

            function parseChild(child, parent) {

                var result = generate(child.input, parent);

                guessMoveTypeByInput(result);
                if (child.actionType && child.actionType !== 'strike') {
                    result.fd3Data.moveInfo.strikeType = undefined;
                }

                if (child.context)  result.fd3Data.context = child.context;
                if (child.endsWith) result.fd3Data.moveInfo.endsWith = child.endsWith;

                if (child.children) {
                    var children = child.children.map(function(child) {
                        return parseChild(child, result);
                    });
                    result.fd3Data.children.all = children;
                    result.fd3Data.children.visible = result.fd3Data.children.all.slice(0);
                }
                
                return result;
            }

        }
        
    }


    function toJson(dataRoot) {

        return {
            created: Date.now(),
            character: dataRoot.fd3Data.input,
            children: getAllChildren(dataRoot).map(function(stance) {
                return {
                    name: stance.fd3Data.input,
                    children: getAllChildren(stance).map(processChild)
                };
            })
        };

        function processChild(dataNode) {
            var childData = {};
            childData.input = dataNode.fd3Data.input;
            if (dataNode.fd3Data.moveInfo.endsWith) {
                childData.endsWith = dataNode.fd3Data.moveInfo.endsWith;
            }
            var children = getAllChildren(dataNode);
            if (children.length > 0) {
                childData.children = children.map(function(dataNode) {
                    return processChild(dataNode);
                });
            }
            return childData;
        }

    }


    function guessMoveTypeByInput(datum) {
        var input = datum.fd3Data.input;
        var moveInfo = datum.fd3Data.moveInfo;
        if (RGX.PUNCH.test(input)) {
            moveInfo.actionType = 'strike';
            moveInfo.strikeType = 'punch';
        } else
        if (RGX.KICK.test(input))  {
            moveInfo.actionType = 'strike';
            moveInfo.strikeType = 'kick';
        } else
        if (RGX.HOLD.test(input))  {
            moveInfo.actionType = 'hold';
            moveInfo.strikeType = undefined;
         } else
        if (RGX.THROW.test(input)) {
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