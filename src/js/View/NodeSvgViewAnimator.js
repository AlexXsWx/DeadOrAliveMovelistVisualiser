define(

    'View/NodeSvgViewAnimator',

    [ 'Tools/Vector2', 'Tools/Tools' ],

    function NodeSvgViewAnimator(Vector2, _) {

        var TRANSITION_DURATION = 500; // ms

        return {
            create: create
        };

        function create(setNodePositionAndOpacity) {

            var positionTarget = Vector2.create();
            var positionStart  = Vector2.create();
            var positionParentTarget = Vector2.create();
            var positionParentStart  = Vector2.create();
            var opacityStart  = 1.0;
            var opacityTarget = 1.0;

            var transitionStart = undefined;
            var animationFrameRequest = null;

            var onDestroyComplete = null;

            var nodeSvgViewAnimator = {
                animate:              animate,
                getPositionStart:     getPositionStart,
                getPositionTarget:    getPositionTarget,
                destroy: destroy
            };

            return nodeSvgViewAnimator;

            function destroy(onAnimCompleteCallback, optX, optY) {
                onDestroyComplete = onAnimCompleteCallback;
                if (optX !== undefined && optY !== undefined) {
                    destroyAnimated(optX, optY);
                } else {
                    destroyNotAnimated();
                }
            }

            function destroyAnimated(x, y) {
                if (animationFrameRequest !== null) {
                    window.cancelAnimationFrame(animationFrameRequest);
                    animationFrameRequest = null;
                }
                animate(x, y, x, y, 0.0);
                setTimeout(destroyNotAnimated, TRANSITION_DURATION);
            }

            function destroyNotAnimated() {

                if (animationFrameRequest !== null) {
                    window.cancelAnimationFrame(animationFrameRequest);
                    animationFrameRequest = null;
                }

                onDestroyComplete();

            }

            function animate(x, y, linkStartX, linkStartY, opacity) {

                if (
                    positionTarget.x === undefined ||
                    positionTarget.y === undefined ||
                    positionParentTarget.x === undefined ||
                    positionParentTarget.y === undefined
                ) {
                    positionTarget.x = x;
                    positionTarget.y = y;
                    positionParentTarget.x = linkStartX;
                    positionParentTarget.y = linkStartY;
                    setNodePositionAndOpacity(x, y, linkStartX, linkStartY, opacity);
                    return;
                }

                var oldEasedProgress = easeTransition(getTransitionRawProgress());

                if (positionStart.x === undefined || positionStart.y === undefined) {
                    positionStart.x = positionTarget.x;
                    positionStart.y = positionTarget.y;
                } else {
                    positionStart.x = _.lerp(positionStart.x, positionTarget.x, oldEasedProgress);
                    positionStart.y = _.lerp(positionStart.y, positionTarget.y, oldEasedProgress);
                }
                positionTarget.x = x;
                positionTarget.y = y;

                var posParSt = positionParentStart;
                if (posParSt.x === undefined || posParSt.y === undefined) {
                    posParSt.x = positionParentTarget.x;
                    posParSt.y = positionParentTarget.y;
                } else {
                    posParSt.x = _.lerp(posParSt.x, positionParentTarget.x, oldEasedProgress);
                    posParSt.y = _.lerp(posParSt.y, positionParentTarget.y, oldEasedProgress);
                }
                positionParentTarget.x = linkStartX;
                positionParentTarget.y = linkStartY;

                opacityStart = _.lerp(opacityStart, opacityTarget, oldEasedProgress);
                opacityTarget = opacity;

                transitionStart = Date.now();

                if (animationFrameRequest !== null) {
                    window.cancelAnimationFrame(animationFrameRequest);
                }
                animationFrameRequest = window.requestAnimationFrame(moveToTargetPosition);

            }

            function moveToTargetPosition() {
                var easedProgress = easeTransition(getTransitionRawProgress());
                setNodePositionAndOpacity(
                    _.lerp(positionStart.x, positionTarget.x, easedProgress),
                    _.lerp(positionStart.y, positionTarget.y, easedProgress),
                    _.lerp(positionParentStart.x, positionParentTarget.x, easedProgress),
                    _.lerp(positionParentStart.y, positionParentTarget.y, easedProgress),
                    _.lerp(opacityStart, opacityTarget, easedProgress)
                );
                if (transitionStart + TRANSITION_DURATION > Date.now()) {
                    animationFrameRequest = window.requestAnimationFrame(moveToTargetPosition);
                }
            }

            function getTransitionRawProgress() {
                if (!transitionStart) return 1.0;
                return Math.min(1, (Date.now() - transitionStart) / TRANSITION_DURATION);
            }

            function easeTransition(progress) {
                return Math.sin(Math.PI / 2.0 * progress);
            }

            function getPositionStart() {
                console.assert(
                    positionStart.x !== undefined && positionStart.y !== undefined,
                    'position start is not initialized'
                );
                return positionStart;
            }

            function getPositionTarget() {
                return positionTarget;
            }

        }

    }

);
