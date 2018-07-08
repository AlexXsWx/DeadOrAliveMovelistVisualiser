define(

    'fsdc/FSDCMain',

    ['Tools/Executor', 'Tools/Tools'],

    function FSDCMain(Executor, _) {

        var Button = {
            Up:        '8',
            Left:      '4',
            Right:     '6',
            Down:      '2',

            Guard:     'H',
            Punch:     'P',
            Kick:      'K',
            Throw:     'T',

            PunchKick: 'P+K',
            GuardKick: 'H+K',
            Special:   'H+P+K',

            Taunt:     'Ap'
        };
        var ButtonNames = Object.keys(Button);

        //

        var tableDomControl;

        var headerRange = createRange();
        var datas = {
            actual:  createData(),
            preview: createData()
        };
        var divsParent = {
            head: null,
            body: null
        }

        return { init: init };

        function init() {

            var listeners = initListeners();

            tableDomControl = createTableDomControl(
                _.getDomElement('data'),
                ButtonNames.length,
                function initCell(cell, customData, x, y) {
                    var buttonName = ButtonNames[y];
                    customData.x = x;
                    customData.y = y;
                    customData.buttonName = buttonName;

                    if (x === 0 && y === 0)  { divsParent.body = cell; }
                    if (x === 0 && y === -1) { divsParent.head = cell; }

                    if (x === -1 && y >= 0) { _.setTextContent(cell, Button[buttonName]); }
                    if (y === -1 && x >= 0) { _.setTextContent(cell, x); }

                    if (x >= 0 && y >= 0) {
                        cell.addEventListener('pointerdown',  listeners.down);
                        cell.addEventListener('pointerenter', listeners.enter);
                        cell.addEventListener('pointerleave', listeners.leave);
                        cell.addEventListener('pointerup',    listeners.up);
                    }

                    if (y === -1 && x >= 0) {
                        cell.addEventListener('click', listeners.headerClick);
                    }
                }
            );

            tableDomControl.accomodate(100);

            divsParent.body.style.position = 'relative';
            divsParent.head.style.position = 'relative';

        }

        function initListeners() {

            var startPosition = {
                x: null,
                y: null
            };

            var listeners = {
                down: createEventHandler(function listenerDown(cell, customData) {
                    // console.log('pointer down @ ' + customData.x + ':' + customData.y);
                    startPosition.x = customData.x;
                    startPosition.y = customData.y;
                }),
                up: createEventHandler(function listenerUp(cell, customData) {
                    // console.log('pointer up @ ' + customData.x + ':' + customData.y);
                    // datas.actual.setFrom(datas.preview);
                    if (startPosition.x === customData.x) {
                        datas.preview.toggle(ButtonNames[startPosition.y], customData.x);
                    }
                }),
                enter: createEventHandler(function listenerEnter(cell, customData) {
                    // console.log('pointer enter @ ' + customData.x + ':' + customData.y);
                }),
                leave: createEventHandler(function listenerLeave(cell, customData) {
                    // console.log('pointer leave @ ' + customData.x + ':' + customData.y);
                }),
                move: createEventHandler(function listenerMove(cell, customData) {
                    // console.log('pointer move @ ' + customData.x + ':' + customData.y);
                }),
                headerClick: createEventHandler(function listenerHeaderClick(cell, customData) {
                    var data = prompt('enter data:');
                    if (!data) return;
                    var matchResult = data.match(/(\d+)/g);
                    if (matchResult) {
                        var sum = matchResult.slice(1).reduce(
                            function(acc, element) { return acc + Number(element); },
                            0
                        );
                        headerRange.toggle(customData.x);
                        headerRange.toggle(customData.x + sum);
                        updateView();
                    }
                })
            };

            window.addEventListener('pointerup', function(event) {
                var current = datas.actual.clone();
                var updated = datas.preview.clone();
                Executor.rememberAndExecute(
                    'apply preview',
                    function() {
                        datas.actual.setFrom(updated);
                        updateView();
                    },
                    function() {
                        datas.actual.setFrom(current);
                        updateView();
                    }
                );
            });

            return listeners;

            function createEventHandler(listener) {
                return eventHandler;

                function eventHandler(event) {
                    // FIXME: `this` or something like `event.target`?
                    var cell = this;
                    var customData = tableDomControl.getCustomData(cell);
                    if (customData) { listener(cell, customData); }
                    event.preventDefault();
                }
            }
        }

        //

        function updateView() {
            _.removeAllChildren(divsParent.body);
            _.removeAllChildren(divsParent.head);
            operate(datas.actual);
            return;
            function operate(data) {
                data.forEachInterval(function(buttonName, start, end) {
                    var y = ButtonNames.indexOf(buttonName);
                    var div = createDiv(start, end, y, 10, 5);
                    divsParent.body.appendChild(div);
                });
                headerRange.forEachInterval(function(start, end) {
                    var div = createDiv(start, end, 0, 0, 0, 5);
                    divsParent.head.appendChild(div);
                });
            }
        }

        function createDiv(start, end, y, paddingX, paddingY, optPaddingRight) {
            var limitedStart = Math.max(0, start);
            var limitedEnd = Math.min(100, end + 1);
            var limitedLength = limitedEnd - limitedStart;
            var cellWidth = 25;
            var cellHeight = 25;
            var paddingRight = _.defined(optPaddingRight, paddingX);
            var div = _.createDomElement({
                tag: 'div',
                classes: ['click-through'],
                attributes: {
                    style: [
                        'background-color: rgba(255, 255, 128, 0.75)',
                        'height: ' + (cellHeight - 2 * paddingY) + 'px',
                        'width: ' + (limitedLength * cellWidth - paddingX - paddingRight) + 'px',
                        'position: absolute',
                        'left: ' + (limitedStart * cellWidth + paddingX) + 'px',
                        'top: ' + (cellHeight * y + paddingY) + 'px'
                    ].join('; ')
                }
            });
            return div;
        }

        //

        function createTableDomControl(tableElement, bodyRowsCount, initCellFunc) {

            var domCache = {
                table: tableElement,
                head: tableElement.querySelector('thead'),
                body: tableElement.querySelector('tbody')
            };

            addInitialBodyRows(bodyRowsCount);
            
            return {
                addTableBodyRow: addTableBodyRow,
                addTableColumn:  addTableColumn,
                getCoords:       getCoords,
                accomodate:      accomodate,
                getCustomData:   getCustomData
            };

            function addInitialBodyRows(bodyRowsCount) {
                for (var i = 0; i < bodyRowsCount; ++i) {
                    addTableBodyRow();
                }
            }

            function accomodate(minColumnsCount) {
                while (getColumnsCount() < minColumnsCount + 1) {
                    addTableColumn();
                }
            }

            function addTableBodyRow() {
                var row = createBodyRow(getTableBodyRowsCount());
                domCache.body.appendChild(row);
                return row;
            }

            function addTableColumn() {
                var result = {
                    head: [],
                    body: []
                };
                var x = getColumnsCount();

                var cell = createCell(x, 0);
                domCache.head.querySelector('tr').appendChild(cell);
                result.head.push(cell);

                Array.from(domCache.body.querySelectorAll('tr')).forEach(
                    function(row, i, a) {
                        var cell = createCell(x, i + 1);
                        row.appendChild(cell);
                        result.body.push(cell);
                    }
                );
                return result;
            }

            function getCoords(element) {
                var temp = element;
                while (temp) {
                    if (
                        temp instanceof HTMLTableCellElement &&
                        temp.parentElement instanceof HTMLTableRowElement && (
                            temp.parentElement.parentElement === domCache.head ||
                            temp.parentElement.parentElement === domCache.body
                        )
                    ) {
                        var cell = temp;
                        var row = temp.parentElement;
                        var posY = getIndexOfAInB(row, domCache.body);
                        return {
                            x: getIndexOfAInB(cell, row),
                            y: (row.parentElement === domCache.head) ? null : posY
                        };
                    }
                    temp = temp.parentElement;
                }
                return null;

                function getIndexOfAInB(child, parent) {
                    return Array.from(parent.querySelectorAll(child.tagName)).indexOf(child);
                }
            }

            //

            function createBodyRow(y) {
                return _.createDomElement({
                    tag: 'tr',
                    children: _.createArray(
                        getColumnsCount(),
                        function(element, index) {
                            return createCell(index, y + 1);
                        }
                    )
                });
            }

            function getColumnsCount() {
                return domCache.head.querySelector('tr').querySelectorAll('th').length;
            }

            function getTableBodyRowsCount() {
                return domCache.body.querySelectorAll('tr').length;
            }

            function createCell(x, y) {
                var customData = {};
                var header = (x === 0) || (y === 0);
                var cell = _.createDomElement({ tag: header ? 'th' : 'td' });
                var content = initCellFunc(cell, customData, x - 1, y - 1);
                setCustomData(cell, customData);
                return cell;
            }

            function setCustomData(cell, customData) { cell.customData = customData; }
            function getCustomData(cell)             { return cell.customData; }

            // Tools

            function arrify(obj) {
                return Array.isArray(obj) ? obj : [obj];
            }
        }

        //

        function createData(optSource) {

            var ranges = optSource ? createRangesCopy(optSource) : createNewRanges();

            var data = {
                clone: clone,
                toggle: toggle,
                setFrom: setFrom,
                forEachInterval: forEachInterval,
                _getRanges: _getRanges
            };

            return data;

            function forEachInterval(action) {
                ButtonNames.forEach(function(buttonName) {
                    ranges[buttonName].forEachInterval(function(start, end) {
                        action(buttonName, start, end);
                    });
                });
            }

            //

            function setFrom(otherData) {
                ranges = createRangesCopy(otherData);
            }

            function _getRanges() { return ranges; }

            function clone() { return createData(data); }

            //

            function createRangesCopy(otherData) {
                var ranges = {};
                var sourceRanges = otherData._getRanges();
                ButtonNames.forEach(function(buttonName) {
                    ranges[buttonName] = sourceRanges[buttonName].clone();
                });
                return ranges;
            }

            function createNewRanges() {
                var ranges = {};
                ButtonNames.forEach(function(buttonName) {
                    ranges[buttonName] = createRange();
                });
                return ranges;
            }

            //

            function toggle(buttonName, frame) {
                var range = ranges[buttonName];

                range.toggle(frame);

                return true;
            }

        }
        
        //

        function createRange(optSource) {

            var flips = optSource ? optSource.slice(0) : [];

            return {
                clone: clone,
                toggle: toggle,
                forEachInterval: forEachInterval
            };

            function clone() { return createRange(flips); }

            function toggle(frame) {
                var index = 0;
                for (index; index < flips.length; ++index) {
                    if (flips[index] === frame) {
                        flips.splice(index, 1);
                        return true;
                    }
                    if (flips[index] > frame) {
                        break;
                    }
                }
                flips.splice(index, 0, frame);
            }

            function forEachInterval(action) {
                if (flips.length > 0) {
                    var start = null;
                    for (var i = 0; i < flips.length; ++i) {
                        if (start === null) {
                            start = flips[i];
                        } else {
                            action(start, flips[i]);
                            start = null;
                        }
                    }
                    if (start !== null) {
                        action(start, Infinity);
                    }
                }
            }
        }

    }

);
