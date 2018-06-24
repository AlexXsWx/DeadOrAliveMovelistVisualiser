define(

    'Tools/SvgTools',

    [],

    function SvgTools() {

        return {
            pathLinear: pathLinear,
            pathSmoothedHorizontal: pathSmoothedHorizontal
        };

        function pathLinear(startX, startY, targetX, targetY) {
            return (
                'M' + startX  + ' ' + startY + ' ' +
                'L' + targetX + ' ' + targetY
            );
        }

        function pathSmoothedHorizontal(startX, startY, targetX, targetY) {
            var middleX = 0.5 * (startX + targetX);
            return (
                'M' + startX  + ' ' + startY + ' ' +
                'C' + (
                    middleX + ' ' + startY + ', ' +
                    middleX + ' ' + targetY + ', ' +
                    targetX + ' ' + targetY
                )
            );
        }

    }

);
