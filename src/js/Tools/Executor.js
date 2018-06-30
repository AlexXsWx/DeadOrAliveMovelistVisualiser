define(

    'Tools/Executor',

    [ 'Tools/Tools' ],

    function Executor(_) {

        // TODO: Consider limiting storage size

        /** Array<Array<Command>> */
        var commandsHistory = [];
        var lastAppliedCommandIndex = -1;

        return {
            rememberAndExecute: rememberAndExecute,
            undo: undo,
            redo: redo,
            clearHistory: clearHistory
        };

        function createCommand(commandName, doFunc, undoFunc) {
            return {
                doFunc: doFunc,
                undoFunc: undoFunc,
                commandName: commandName
            };
        }

        function clearHistory() {
            console.debug('Clearing commands history');
            commandsHistory = [];
            lastAppliedCommandIndex = -1;
        }

        function rememberAndExecute(commandName, doFunc, undoFunc, optAppendToPrevious) {

            // Reset redo list
            if (lastAppliedCommandIndex < commandsHistory.length - 1) {
                commandsHistory.length = lastAppliedCommandIndex + 1;
                // TODO: Consider saving this branch of command history to offer redo option
            }

            var command = createCommand(commandName, doFunc, undoFunc);

            if (optAppendToPrevious) {
                if (commandsHistory.length === 0) {
                    console.error('Trying to append a command to empty history');
                    commandsHistory.push([]);
                }
                commandsHistory[commandsHistory.length - 1].push(command);
            } else {
                commandsHistory.push([command]);
            }

            lastAppliedCommandIndex = commandsHistory.length - 1;

            console.debug('do "%s"', commandName);

            doFunc();

        }

        function undo(optCount) {
            var count = _.defined(optCount, 1);
            if (count <= 0) {
                console.debug('Nothing to undo');
                return false;
            }
            while (lastAppliedCommandIndex >= 0 && count > 0) {
                var commandsGroup = commandsHistory[lastAppliedCommandIndex];
                for (var i = commandsGroup.length - 1; i >= 0; --i) {
                    console.debug('Undo "%s"', commandsGroup[i].commandName);
                    commandsGroup[i].undoFunc();
                }
                lastAppliedCommandIndex -= 1;
                count -= 1;
            }
            return true;
        }

        function redo(optCount) {
            var count = _.defined(optCount, 1);
            if (count <= 0) {
                console.debug('Nothing to redo');
                return false;
            }
            while (lastAppliedCommandIndex < commandsHistory.length - 1 && count > 0) {
                lastAppliedCommandIndex += 1;
                var commandsGroup = commandsHistory[lastAppliedCommandIndex];
                for (var i = 0; i < commandsGroup.length; ++i) {
                    console.debug('Redo "%s"', commandsGroup[i].commandName);
                    commandsGroup[i].doFunc();
                }
                count -= 1;
            }
            return true;
        }

    }

);
