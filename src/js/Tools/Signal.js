define(

    'Tools/Signal',

    [],

    function SignalModule() {

        return createSignal;

        function createSignal() {

            var listeners = [];

            return {
                dispatch: dispatch,
                listenersManager: {
                    addListener:        addListener,
                    hasListener:        hasListener,
                    removeListener:     removeListener,
                    removeAllListeners: removeAllListeners
                }
            };


            function dispatch(/* arguments */) {
                for (var i = 0; i < listeners.length; ++i) {
                    listeners[i].apply(null, arguments);
                }
            }


            function addListener(listener, dontDuplicate) {
                if (dontDuplicate && hasListener(listener)) return false;
                listeners.push(listener);
                return true;
            }


            function hasListener(listener) {
                return listeners.indexOf(listener) >= 0;
            }


            function removeListener(targetListener, allOccurences) {

                if (allOccurences) {   

                    var newListeners = listeners.filter(
                        function isNotTargetListener(listener) {
                            return listener !== targetListener;
                        }
                    );

                    var changed = listeners.length !== newListeners.length;

                    listeners = newListeners;

                    return changed;

                } else {

                    var index = listeners.indexOf(targetListener);
                    if (index >= 0) {
                        listeners.splice(index, 1);
                        return true;
                    }

                    return false;

                }

            }


            function removeAllListeners() {
                listeners = [];
            }

        }

    }

);
