define(

    'Tools/CastingManager',

    [],

    function CastingManager() {

        return {
            createCastingManager: createCastingManager
        };

        function createCastingManager() {
            var castMap = {};
            var existingCasters = [];

            return {
                addCaster: addCaster,
                canCast:   canCast,
                castValue: castValue
            }

            function addCaster(from, to, castFunc, optIndirect) {

                var direct = !optIndirect;

                if (canAdd(from, to, direct)) {

                    castMap[from] = castMap[from] || {};
                    castMap[from][to] = {
                        castFunc: castFunc,
                        direct: direct
                    };

                    existingCasters.push({ from: from, to: to });
                }

                connectCasters(from, to, castMap[from][to].castFunc);
            }

            function canAdd(from, to, direct) {
                if (castMap.hasOwnProperty(from) && castMap[from].hasOwnProperty(to)) {
                    if (direct) {
                        if (castMap[from][to].direct) {
                            console.error(
                                'Replacing already existing caster: ' + from + ' -> ' + to
                            );
                        } else {
                            console.warn(
                                'Refining already existing caster: ' + from + ' -> ' + to
                            );
                        }
                        return true;
                    }
                    return false;
                }
                return true;
            }

            function connectCasters(from, to, castFunc) {
                existingCasters
                    .filter(function(t) {
                        return t.to === from;
                    })
                    .forEach(function(t) {
                        addCaster(
                            t.from, to,
                            function(value) { return castFunc(castValue(value, t.from, t.to)); },
                            true
                        );
                    });

                existingCasters
                    .filter(function(t) { return to === t.from; })
                    .forEach(function(t) {
                        addCaster(
                            from, t.to,
                            function(value) { return castValue(castFunc(value), t.from, t.to); },
                            true
                        );
                    });
            }

            function canCast(typeFrom, typeTo) {
                if (typeFrom === typeTo) return true;
                return (
                    castMap.hasOwnProperty(typeFrom) &&
                    castMap[typeFrom].hasOwnProperty(typeTo)
                );
            }

            function castValue(value, typeFrom, typeTo) {
                if (typeFrom === typeTo) return value;
                return castMap[typeFrom][typeTo].castFunc(value);
            }
        }
    }

);
