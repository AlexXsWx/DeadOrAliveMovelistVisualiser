define(

    'fsdc/AHKGenerator',

    [ 'fsdc/Mapping' ],

    function AHKGeneratorModule(Mapping) {

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

            var str = steps.map(function(step) {
                if (step.hasOwnProperty('wait')) {
                    var amount = step['wait'];
                    // var ms = Math.floor(amount * 1000 / 60);
                    var ms = step['ms'];
                    return `DllCall("Sleep","UInt",${ms}) ; ${amount} frames`;
                }
                if (step.hasOwnProperty('release')) {
                    return `send,{%${getAHKKey(step['release'])}% up}`;
                }
                if (step.hasOwnProperty('press')) {
                    return `send,{%${getAHKKey(step['press'])}% down}`;
                }
            });
            function getAHKKey(key) { return AHK_input_map[key]; }

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
                $*${getKBKey('Macro_Play')}::
                {
                    ___BODY___
                }
                return

                ; press Ins after editing this script to reload it and test your changes quickly
                $*${getKBKey('Macro_Reload')}::reload
            `)
            .replace('___BINDING___', getBinding())
            .replace('___BODY___',    indent(body, 4).trim());
        }

        function getBinding() {
            return unindent(`
                btn_up    = ${getKBKey('Up')}
                btn_left  = ${getKBKey('Left')}
                btn_right = ${getKBKey('Right')}
                btn_down  = ${getKBKey('Down')}
                btn_hold  = ${getKBKey('Guard')}
                btn_punch = ${getKBKey('Punch')}
                btn_kick  = ${getKBKey('Kick')}
                btn_throw = ${getKBKey('Throw')}
                btn_pk    = ${getKBKey('PunchKick')}
                btn_hk    = ${getKBKey('GuardKick')}
                btn_hpk   = ${getKBKey('Special')}
                btn_taunt = ${getKBKey('Taunt')}
            `);
        }

        function getKBKey(key) {
            var result = Mapping.getMapping()[key];
            if (!result) {
                throw 'Key "' + key + '"" is not mapped';
            }
            return result;
        }

        function unindent(str) {
            var lines = str.split('\n').filter(function(line) { return /[^\s]/.test(line); });
            var minIndent = Math.min.apply(Math,
                lines.map(function(line) { return line.match(/^\s*/)[0].length; })
            );
            var rgx = new RegExp(`(^|\\n) {${minIndent}}`, 'g');
            return str.replace(rgx, function(a, b) { return b; }).trim();
        }

        function indent(str, amount) {
            var prefix = new Array(amount + 1).join(' ');
            return str.split('\n').map(function(line) { return prefix + line; }).join('\n');
        }

    }

);
