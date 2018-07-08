define(

    'fsdc/FSDCMain',

    [
        'fsdc/Buttons', 'fsdc/Range', 'fsdc/Data', 'fsdc/TableManager',
        'Tools/Executor', 'Tools/Tools'
    ],

    function FSDCMain(Buttons, createRange, createData, createTableDomControl, Executor, _) {

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
                Buttons.ButtonNames.length,
                function initCell(cell, customData, x, y) {
                    var buttonName = Buttons.ButtonNames[y];
                    customData.x = x;
                    customData.y = y;
                    customData.buttonName = buttonName;

                    if (x === 0 && y === 0)  { divsParent.body = cell; }
                    if (x === 0 && y === -1) { divsParent.head = cell; }

                    if (x === -1 && y >= 0) { _.setTextContent(cell, Buttons.Button[buttonName]); }
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
                        datas.preview.toggle(Buttons.ButtonNames[startPosition.y], customData.x);
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
                    var y = Buttons.ButtonNames.indexOf(buttonName);
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

    }

);
