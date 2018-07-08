define(

    'fsdc/AHKGenerator',

    [ 'fsdc/Buttons' ],

    function AHKGeneratorModule(Buttons) {

        // var defaultAHKBindings = unindent(`
        //     ; Please customize these keyboard configs to match your in-game mapping.
        //     ; Default mapping is for a QWERTY keyboard - in-game TYPE-A.
            
        //     btn_left  = left
        //     btn_right = right
        //     btn_up    = up
        //     btn_down  = down

        //     btn_hold  = j ; X
        //     btn_punch = k ; Y
        //     btn_kick  = l ; B
        //     btn_throw = m ; A
        //     btn_pk    = u ; LB
        //     btn_hk    = o ; RT
        //     btn_hpk   = i ; RB
        //     btn_taunt = n ; LT
        // `);

        var defaultAHKBindings = unindent(`
            btn_left  = left
            btn_right = right
            btn_up    = up
            btn_down  = down
            
            btn_hold  = l ; B
            btn_punch = m ; A
            btn_kick  = j ; X
            btn_throw = k ; Y
            btn_pk    = u ; LB
            btn_hk    = i ; RB
            btn_hpk   = o ; RT
            btn_taunt = n ; LT
        `);

        var AHK_input_map = {};
        AHK_input_map['Up']        = 'btn_up';
        AHK_input_map['Left']      = 'btn_left';
        AHK_input_map['Right']     = 'btn_right';
        AHK_input_map['Down']      = 'btn_down';
        AHK_input_map['Guard']     = 'btn_hold';
        AHK_input_map['Punch']     = 'btn_punch';
        AHK_input_map['Kick']      = 'btn_kick';
        AHK_input_map['Throw']     = 'btn_throw';
        AHK_input_map['PunchKick'] = 'btn_pk';
        AHK_input_map['GuardKick'] = 'btn_hk';
        AHK_input_map['Special']   = 'btn_hpk';
        AHK_input_map['Taunt']     = 'btn_taunt';

        return { generate: generate };

        function generate(steps) {

            var leftover = 0;
            var str = steps.map(function(step) {
                if (step.hasOwnProperty('wait')) {
                    var amount = step['wait'];

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

                    return `DllCall("Sleep","UInt",${ms}) ; ${amount} frames`;
                }
                if (step.hasOwnProperty('release')) {
                    return `send,{%${getKey(step['release'])}% up}`;
                }
                if (step.hasOwnProperty('press')) {
                    return `send,{%${getKey(step['press'])}% down}`;
                }
            });
            function getKey(key) { return AHK_input_map[key]; }

            var body = str.join('\n');

            return unindent(`
                ; save this file as anything.ahk, install AutoHotkey to run it, press Right Ctrl to start

                ; optimizations for better input accuracy
                #SingleInstance Force
                #NoEnv
                #MaxHotkeysPerInterval 99000000
                #HotkeyInterval 99000000
                #KeyHistory 0
                ListLines Off
                Process, Priority, , A
                SetBatchLines, -1
                SetKeyDelay, -1, -1
                SetMouseDelay, -1
                SetDefaultMouseSpeed, 0
                SetWinDelay, -1
                SetControlDelay, -1
                SendMode Input
                SetTitleMatchMode, 2

                ; This macro/script needs the game to have a keyboard as the main input device,
                ; so unplug your controllers if necessary.
                ___BINDING___


                ; the button that starts executing inputs
                $*rctrl::
                {
                    ___BODY___
                }
                return

                ; press Ins after editing this script to reload it and test your changes quickly
                $*ins::reload
            `)
            .replace('___BINDING___', defaultAHKBindings.trim())
            .replace('___BODY___',    indent(body, 4).trim());
        }

        function unindent(str) {
            const lines = str.split('\n').filter(function(line) { return /[^\s]/.test(line); });
            const minIndent = Math.min.apply(Math,
                lines.map(function(line) { return line.match(/^\s*/)[0].length; })
            );
            console.log(minIndent);
            const rgx = new RegExp(`(^|\\n) {${minIndent}}`, 'g');
            console.log(rgx);
            return str.replace(rgx, function(a, b) { return b; }).trim();
        }

        function indent(str, amount) {
            const prefix = new Array(amount + 1).join(' ');
            return str.split('\n').map(function(line) { return prefix + line; }).join('\n');
        }

    }

);
