define(

    'Executor',

    ['Tools'],

    function Executor(_) {

        // TODO: Consider limiting storage size

        var commandsHistory = [];
        var lastAppliedCommandIndex = -1;

        return {
            executeAndRememberCommand: executeAndRememberCommand,
            undo: undo,
            redo: redo,
            clearHistory: clearHistory
        };

        function clearHistory() {
            commandsHistory = [];
            lastAppliedCommandIndex = -1;
        }

        function executeAndRememberCommand(commandName, doFunc, undoFunc) {

            // Reset redo list
            if (lastAppliedCommandIndex < commandsHistory.length - 1) {
                commandsHistory.length = lastAppliedCommandIndex + 1;
                // TODO: Consider saving this branch of command history to offer redo option
            }

            commandsHistory.push({
                doFunc: doFunc,
                undoFunc: undoFunc,
                commandName: commandName
            });
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
                console.debug('Undo "%s"', commandsHistory[lastAppliedCommandIndex].commandName);
                commandsHistory[lastAppliedCommandIndex].undoFunc();
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
                console.debug('Redo "%s"', commandsHistory[lastAppliedCommandIndex].commandName);
                commandsHistory[lastAppliedCommandIndex].doFunc();
                count -= 1;
            }
            return true;
        }

    }

);