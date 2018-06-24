define(

    'Lib/SmoothScrollManager',

    [ /*'SmoothScroll'*/ ],

    function SmoothScrollManager(/*SmoothScroll*/) {

        var initializeWasRequested = false;

        return { init: init };

        function init(checkbox) {

            if (typeof SmoothScroll === 'undefined') {
                checkbox.checked = false;
                disableCheckbox(checkbox);
                return;
            }

            if (checkbox.checked) {
                enableSmoothScroll();
            }

            checkbox.addEventListener('change', function(event) {
                updateSmoothScroll(checkbox);
            });

        }

        function updateSmoothScroll(checkbox) {
            if (checkbox.checked) {
                enableSmoothScroll();
            } else {
                var canReEnable = disableSmoothScroll();
                if (!canReEnable) {
                    disableCheckbox(checkbox);
                }
            }
        }

        function enableSmoothScroll() {
            if (!initializeWasRequested) {
                initializeWasRequested = true;
                SmoothScroll({
                    animationTime: 500, // 800
                    stepSize: 100, // 80
                    pulseScale: 8,
                    accelerationDelta: 10, // 20
                    accelerationMax: 1,
                });
            } else {
                // TODO: uncomment once SmoothScroll is updated
                // SmoothScroll.start();
            }
        }

        function disableSmoothScroll() {
            SmoothScroll.destroy();
            return false;
        }

        function disableCheckbox(checkbox) {
            checkbox.setAttribute('disabled', true);
        }

    }

);
