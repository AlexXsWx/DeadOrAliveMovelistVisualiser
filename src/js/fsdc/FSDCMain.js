define(

    'fsdc/FSDCMain',

    [
        'fsdc/Buttons', 'fsdc/Data', 'fsdc/TableManager',
        'fsdc/AHKGenerator',
        'Hotkeys', 'Input/KeyCodes',
        'Tools/Executor', 'Tools/Tools'
    ],

    function FSDCMain(
        Buttons, createData, createTableDomControl,
        AHKGenerator,
        Hotkeys, KeyCodes,
        Executor, _
    ) {

        var MIN_FRAMES = 50;

        //

        var tableDomControl;

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

                    if (x === 0 && y === 0)  { divsParent.body = initDivsParent(cell); }
                    if (x === 0 && y === -1) { divsParent.head = initDivsParent(cell); }
                }
            );

            updateView();

            Hotkeys.create(handleFilteredKeyDown);

            return;

            function initDivsParent(parent) {
                parent.style.position = 'relative';
                var divsParent = _.createDomElement({
                    tag: 'div',
                    attributes: {
                        style: [
                            'position: absolute',
                            'left: 0',
                            'top: 0'
                        ].join('; ')
                    }
                });
                parent.appendChild(divsParent);
                return divsParent;
            }

            function handleFilteredKeyDown(event) {

                var keyCode = event.keyCode;

                var dontPreventDefault = false;

                var modifiers = {
                    ctrl: event.ctrlKey || event.metaKey,
                    shift: event.shiftKey
                }

                // Ctrl + Z
                if (modifiers.ctrl && keyCode === KeyCodes.Z) {
                    if (modifiers.shift) {
                        Executor.redo();
                    } else {
                        Executor.undo()
                    };
                    event.stopPropagation();
                } else

                // Esc
                if (keyCode === KeyCodes.ESC) {
                    listeners.esc(event);
                } else

                if (modifiers.ctrl && modifiers.shift && keyCode === KeyCodes.E) {
                    doExport();
                }

                // Default - do nothing
                else {
                    dontPreventDefault = true;
                }

                if (!dontPreventDefault) {
                    event.preventDefault();
                }
            }

        }

        function doExport() {
            var steps = createSteps(datas.actual);
            // console.log(JSON.stringify(steps));
            var ahkCode = AHKGenerator.generate(steps);
            console.log(ahkCode);
            saveText(ahkCode, 'fsdc_generated.ahk');
        }

        function createSteps(data) {

            var createWaitStep = createWaitStepCreator();

            var frameOld = 0;
            var steps = [];
            var lastState = null;
            data.forEachChange(function(frame, buttonsStateOld, buttonsStateNew) {
                console.assert(frameOld <= frame, '-Infinity is not supported yet');
                if (!isFinite(frame)) return;
                var wait = frame - frameOld;
                if (wait > 0) {
                    steps.push(createWaitStep(wait));
                }
                Buttons.ButtonNames.forEach(function(buttonName) {
                    if (buttonsStateOld[buttonName] !== buttonsStateNew[buttonName]) {
                        if (buttonsStateOld[buttonName]) {
                            steps.push(createReleaseStep(buttonName));
                        } else {
                            steps.push(createPressStep(buttonName));
                        }
                    }
                });
                lastState = buttonsStateNew;
                frameOld = frame;
            });

            var unreleasedKeys = [];
            if (lastState) {
                unreleasedKeys = Buttons.ButtonNames.filter(
                    function(buttonName) { return lastState[buttonName]; }
                );
                if (unreleasedKeys.length > 0) {
                    steps.push(createWaitStep(30));
                    unreleasedKeys.forEach(function(buttonName) {
                        steps.push(createReleaseStep(buttonName));
                    });
                }
            }

            return steps;

            function createWaitStepCreator() {

                var leftover = 0;

                return createWaitStep;

                function createWaitStep(amount) {

                    var ms = handleLeftover(amount);

                    var obj = {};
                    obj['wait'] = amount;
                    obj['ms'] = ms;
                    return obj;

                }

                function handleLeftover(amount) {
                    var leftoverThirds;
                    switch (amount % 3) {
                        case 0: leftoverThirds = 0; break;
                        case 1: leftoverThirds = 2; break;
                        case 2: leftoverThirds = 1; break;
                    }

                    var ms = Math.floor(amount * 1000 / 60);

                    leftover += leftoverThirds;
                    if (leftover >= 3) {
                        ms += Math.floor(leftover / 3);
                        leftover = leftover % 3;
                    }

                    return ms;
                }
            }

            function createPressStep(buttonName) {
                var obj = {};
                obj['press'] = buttonName;
                return obj;
            }

            function createReleaseStep(buttonName) {
                var obj = {};
                obj['release'] = buttonName;
                return obj;
            }
        }

        function initListeners() {

            var previewIsDirty = false;

            var startPosition = {
                x: null,
                y: null
            };

            var endPosition = {
                x: null,
                y: null
            };

            var InputMode = {
                DragBeginning: 'dragBeginning',
                DragEnding:    'dragEnding',
                DragWhole:     'dragWhole',
                CreateNew:     'createNew'
            };

            var inputMode = null;
            var inputModeLocked = false;

            var listeners = {
                down: createEventHandler(function listenerDown(cell, customData) {

                    inputMode = null;
                    inputModeLocked = false;

                    startPosition.x = customData.x;
                    startPosition.y = customData.y;

                    var frame = customData.x;
                    if (getState(frame)) {
                        if (!getState(frame - 1)) {
                            inputMode = InputMode.DragBeginning;
                        } else {
                            inputMode = InputMode.DragWhole;
                        }
                    } else {
                        if (getState(frame - 1)) {
                            inputMode = InputMode.DragEnding;
                        } else {
                            inputMode = InputMode.CreateNew;
                        }
                    }

                    update(customData);

                    return;

                    function getState(frame) {
                        return datas.actual.getButtonState(customData.buttonName, frame);
                    }
                }),
                up: createEventHandler(function listenerUp(cell, customData) { }),
                enter: createEventHandler(function listenerEnter(cell, customData) {
                    update(customData);
                }),
                leave: createEventHandler(function listenerLeave(cell, customData) { }),
                move: createEventHandler(function listenerMove(cell, customData) { }),
                headerClick: createEventHandler(function listenerHeaderClick(cell, customData) {
                    var frame = customData.x;
                    // FIXME: why this doesn't work?
                    // if (datas.actual.headerRange.isHeld(frame)) {
                    //     var interval = datas.actual.headerRange.getInterval(frame);
                    //     datas.preview.setFrom(datas.actual);
                    //     datas.preview.toggle(interval[0]);
                    //     datas.preview.toggle(interval[1]);
                    //     previewIsDirty = true;
                    //     updateView();
                    //     return;
                    // }
                    var data = prompt('Enter frame data: (e.g. "0 (18) 12")');
                    if (!data) return;
                    var matchResult = data.match(/(\d+)/g);
                    if (matchResult) {
                        var sum = matchResult.reduce(
                            function(acc, element) { return acc + Number(element); },
                            0
                        );
                        Executor.rememberAndExecute('add header', act, act);
                        return;
                        function act() {
                            datas.preview.headerRange.toggle(frame);
                            datas.preview.headerRange.toggle(frame + sum - 1);
                            previewIsDirty = true;
                            updateView();
                        }
                    }
                }),
                esc: function listenerEsc(keyDownEvent) {
                    inputMode = null;
                    previewIsDirty = false;
                    datas.preview.setFrom(datas.actual);
                    updateView();
                }
            };

            window.addEventListener('pointerup', function(event) {
                inputMode = null;
                applyPreviewIfDirty();
            });

            return listeners;

            function update(customData) {

                endPosition.x = customData.x;
                endPosition.y = customData.y;

                var buttonName = Buttons.ButtonNames[startPosition.y];
                var newButtonName = Buttons.ButtonNames[endPosition.y];

                var deltaX = endPosition.x - startPosition.x;
                var deltaY = endPosition.y - startPosition.y;

                if (
                    !inputModeLocked &&
                    deltaY !== 0 && (
                        inputMode === InputMode.CreateNew ||
                        inputMode === InputMode.DragEnding ||
                        inputMode === InputMode.DragBeginning
                    )
                ) {
                    inputMode = InputMode.DragWhole;
                }

                if (
                    inputMode === InputMode.CreateNew ||
                    inputMode === InputMode.DragEnding ||
                    inputMode === InputMode.DragBeginning
                ) {
                    if (deltaX !== 0) {
                        inputModeLocked = true;
                    }

                    var start = startPosition.x;
                    var end   = endPosition.x;

                    var min = Math.min(start, end);
                    var max = Math.max(end, start);
                    var length = max - min;
                    if (inputMode === InputMode.CreateNew) {
                        length = Math.max(length, 1);
                    }

                    datas.preview.setFrom(datas.actual);

                    // TODO: don't allow to press action button while a macro containing it is held
                    datas.preview.toggle(buttonName, min);
                    datas.preview.toggle(buttonName, min + length);
                    previewIsDirty = true;

                    updateView();
                } else
                if (inputMode === InputMode.DragWhole) {

                    if (deltaX !== 0 || deltaY !== 0) {
                        inputModeLocked = true;
                    }

                    datas.preview.setFrom(datas.actual);
                    if (deltaX !== 0 || deltaY !== 0) {
                        var interval = datas.actual.getButtonInterval(buttonName, startPosition.x);

                        // Prevent dragging beyond frame 0
                        deltaX = Math.max(deltaX, -interval[0]);

                        datas.preview.toggle(buttonName, interval[0]);
                        datas.preview.toggle(buttonName, interval[1]);
                        datas.preview.toggle(newButtonName, interval[0] + deltaX);
                        datas.preview.toggle(newButtonName, interval[1] + deltaX);
                    }
                    previewIsDirty = true;
                    updateView();
                }
            }

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

            function applyPreviewIfDirty() {
                if (!previewIsDirty) return;
                previewIsDirty = false;

                var current = datas.actual.clone();
                var next = datas.preview.clone();
                Executor.rememberAndExecute(
                    'apply preview',
                    function() {
                        datas.actual.setFrom(next);
                        datas.preview.setFrom(datas.actual);
                        updateView();
                    },
                    function() {
                        datas.actual.setFrom(current);
                        datas.preview.setFrom(datas.actual);
                        updateView();
                    }
                );
            }
        }

        //

        function updateView() {

            accomodate(datas.preview);

            _.removeAllChildren(divsParent.body);
            _.removeAllChildren(divsParent.head);
            operate(datas.preview);
            return;
            function operate(data) {
                data.forEachInterval(function(buttonName, start, end) {
                    var y = Buttons.ButtonNames.indexOf(buttonName);
                    var div = createDiv(start, end, y, 10, 5);
                    divsParent.body.appendChild(div);
                });
                data.headerRange.forEachInterval(function(start, end) {
                    var div = createDiv(start, end, 0, 0, 0, 5);
                    divsParent.head.appendChild(div);
                });

                var header1Cells = tableDomControl.getHeader1Cells();
                header1Cells.forEach(function(cell, index) { _.removeAllChildren(cell); });

                data.forEachChange(function(frame, buttonsStateOld, buttonsStateNew) {
                    if (frame + 1 < header1Cells.length) {
                        var cell = header1Cells[frame + 1];
                        var textContent = {};
                        var movementWas    = getMovement(buttonsStateOld);
                        var movementBecome = getMovement(buttonsStateNew);
                        if (movementBecome !== movementWas) {
                            textContent[movementBecome] = true;
                        }
                        var attackWas    = getAttack(buttonsStateOld);
                        var attackBecome = getAttack(buttonsStateNew);
                        Object.keys(attackWas).forEach(function(key) {
                            if (key === 'taunt') return;
                            if (attackBecome[key] && !attackWas[key]) {
                                switch (key) {
                                    case 'h': setKey('h'); break;
                                    case 'p': setKey('p'); break;
                                    case 'k': setKey('k'); break;
                                    case 't': setKey('t'); break;
                                    case 'pk': setKey('p', 'k'); break;
                                    case 'hk': setKey('h', 'k'); break;
                                    case 'hpk': setKey('h', 'p', 'k'); break;
                                    case 'taunt': break;
                                    default: console.warn('unexpected key', key);
                                }
                                function setKey(/*arguments*/) {
                                    for (var i = 0; i < arguments.length; ++i) {
                                        var key = arguments[i];
                                        textContent[key] = true;
                                    }
                                }
                            }
                        });

                        if (textContent['h'] && textContent['p']) {
                            textContent['t'] = true;
                        }

                        if (textContent['t']) {
                            delete textContent['h'];
                            delete textContent['p'];
                            if (textContent['k']) {
                                delete textContent['t'];
                                textContent['p'] = true;
                                textContent['h'] = true;
                            }
                        }


                        var inputs = Object.keys(textContent).sort(function(a, b) {
                            var order = [
                                '1', '2', '3', '4', '6', '7', '8', '9',
                                'k', 'p', 'h', 't'
                            ];
                            return _.sortFuncAscending(order.indexOf(b), order.indexOf(a));
                        });

                        if (inputs.length > 0) {
                            var fragment = document.createDocumentFragment();
                            inputs.forEach(function(input, index, array) {
                                var last = index === array.length - 1;
                                fragment.appendChild(_.createTextNode(input.toUpperCase()));
                                if (!last) fragment.appendChild(_.createDomElement({ tag: 'br' }));
                            })
                            cell.appendChild(fragment);
                        }
                    }
                });

                function getMovement(buttonsState) {
                    var up    = buttonsState['Up'];
                    var down  = buttonsState['Down'];
                    var left  = buttonsState['Left'];
                    var right = buttonsState['Right'];
                    if (up && down || left && right) return '';
                    if (left  && up)   return '7';
                    if (right && up)   return '9';
                    if (left  && down) return '1';
                    if (right && down) return '3';
                    if (up)    return '8';
                    if (down)  return '2';
                    if (left)  return '4';
                    if (right) return '6';
                    return '';
                }

                function getAttack(buttonState) {
                    return {
                        h:     buttonState['Guard'],
                        p:     buttonState['Punch'],
                        k:     buttonState['Kick'],
                        t:     buttonState['Throw'],
                        pk:    buttonState['PunchKick'],
                        hk:    buttonState['GuardKick'],
                        hpk:   buttonState['Special'],
                        taunt: buttonState['Taunt']
                    };
                }
            }

            function accomodate(data) {

                tableDomControl.accomodate(
                    Math.max(MIN_FRAMES, getLastFiniteFrame(data) + 2)
                );

                function getLastFiniteFrame(data) {

                    var latestFrame = 0;

                    data.headerRange.forEachInterval(function(start, end) {
                        consider(start);
                        consider(end);
                    });

                    data.forEachInterval(function(buttonName, start, end) {
                        consider(start);
                        consider(end);
                    });

                    return latestFrame;

                    function consider(value) {
                        if (isFinite(value)) {
                            latestFrame = Math.max(latestFrame, value);
                        }
                    }
                }
            }
        }

        function createDiv(start, end, y, paddingX, paddingY, optPaddingRight) {
            var limitedStart = Math.max(0, start);
            var limitedEnd = end + 1;
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

        function saveText(text, fileName) {
            var link = _.createDomElement({
                tag: 'a',
                attributes: {
                    download: fileName,
                    href: textToBase64(text)
                }
            });
            // FIXME: may not be compatible with browsers other than chrome
            // A solution could be to use http://github.com/eligrey/FileSaver.js
            link.dispatchEvent(new MouseEvent('click'));
        }

        function textToBase64(text) {
            return `data:text/plain;charset=utf8;base64,${window.btoa(text)}`;
        }

    }

);
