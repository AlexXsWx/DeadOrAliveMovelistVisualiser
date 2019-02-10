define(

    'fsdc/Style',

    ['Tools/Tools'],

    function StyleModule(_) {

        var atlasInfo = {
            '1': [24, 111, 19, 19],
            '2': [46, 110, 18, 22],
            '3': [67, 111, 19, 19],
            '4': [ 1, 110, 21, 19],
            '6': [66,  89, 22, 19],
            '7': [ 2,  90, 19, 19],
            '8': [24,  88, 18, 22],
            '9': [46,  90, 18, 19],
            'h': [ 1,   0, 20, 21],
            'p': [40,   1, 20, 21],
            'k': [79,   1, 20, 21],
            't': [82, 346, 20, 21],
            'p+k': [40, 0, 59, 21],
            'h+k': [1, 45, 59, 21],
            'h+p+k': [1, 0, 101, 21]
        };

        return { getDomElement: getDomElement };

        function getDomElement(input) {
            var imgStyle = getStyle(input);
            if (imgStyle) {
                return _.createDomElement({
                    tag: 'img',
                    attributes: {
                        src: '../media/clear.png',
                        style: imgStyle
                    }
                });
            }
            return _.createTextNode(input);
        }

        function getStyle(input) {
            var spriteRect = atlasInfo[input.toLowerCase()];
            if (spriteRect) {
                return [
                    'width: ' + spriteRect[2] + 'px',
                    'height: ' + spriteRect[3] + 'px',
                    'background: ' + [
                        'url(../media/spritesheet.png)',
                        'no-repeat',
                        -spriteRect[0] + 'px',
                        -spriteRect[1] + 'px'
                    ].join(' ')
                ].join('; ')
            }
            return null;
        }
    }

);
