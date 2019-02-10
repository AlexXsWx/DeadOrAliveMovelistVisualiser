define(

    'Tools/ArraySet',

    [ 'Tools/Tools' ],

    function ArraySetModule(_) {

        function ArraySet(values) {

            var arrays = values;

            return {
                _getArrays: _getArrays,
                satisfiesIs:       satisfiesIs,
                satisfiesContains: satisfiesContains
            };

            function _getArrays() {
                return arrays;
            }

            function satisfiesIs(testSet) {
                return testSet._getArrays().some(function(testArray) {
                    return _getArrays().some(function(array) {
                        return (
                            testArray.length === 0 && array.length === 0 ||
                            arrayContains(testArray, array) &&
                            arrayContains(array, testArray)
                        );
                    });
                });
            }

            function satisfiesContains(testSet) {
                return testSet._getArrays().some(function(testArray) {
                    return _getArrays().some(function(array) {
                        return arrayContains(testArray, array);
                    });
                });
            }

            function arrayContains(array, values) {
                return values.every(function(element) {
                    return _.contains(array, element);
                });
            }
        }

        ArraySet.createFromValue = function(value) {
            return new ArraySet([[value]]);
        };

        ArraySet.createFromArray = function(values) {
            return new ArraySet([values]);
        };

        ArraySet.createAnd = function(leftSet, rightSet) {
            var leftArrays  = leftSet._getArrays();
            var rightArrays = rightSet._getArrays();
            var values = [];
            leftArrays.forEach(function(leftArray) {
                rightArrays.forEach(function(rightArray) {
                    values.push(leftArray.concat(rightArray));
                });
            });
            return new ArraySet(values);
        };

        ArraySet.createOr = function(leftSet, rightSet) {
            var values = leftSet._getArrays().concat(rightSet._getArrays());
            return new ArraySet(values);
        };

        ArraySet.createEmpty = function() {
            return new ArraySet([[]]);
        };

        return ArraySet;
    }

);
