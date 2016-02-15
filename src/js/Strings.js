define('Strings', function() {

    var strings = {

        'moveActionMask': 'Mask',
        'moveActionMaskDescription': (
            'Action step mask. When available, specifies height classes of the action step, and ' +
            'optionally strike or hold types - punch or kick. Examples - high; low K; mid P mid K'
        ),

        'moveActionType': 'Type',
        'moveActionTypeDescription': (
            'Action step type. Possible values are: strike; jump attack; grab for throw; ' +
            'OH grab; grab for hold; ground attack; other'
        ),

        'moveActionTracking': 'Tracking',
        'moveActionTrackingDescription': (
            'Whether the action step is tracking or not. Only tracking moves can hit opponent ' +
            'when they perform sidestep'
        ),

        'indeterminateHint': (
            'Reset checkbox back to default indeterminate / unspecified / unset state'
        ),

        'moveActionDamage': 'Damage',
        'moveActionDamageDescription': (
            'Action step damage'
        ),

        'moveActionCondition': 'Condition',
        'moveActionConditionDescription': (
            'Action step condition. Specifies what conditions are resulting the rest action step ' +
            'data'
        ),

        'moveActionTags': 'Tags',
        'moveActionTagsDescription': (
            'Action step tags. Everything else that didn\'t fit in this form'
        )

    };

    return getString;

    function getString(id) {
        if (!strings.hasOwnProperty(id)) {
            console.error('Strings has no id %s', id);
            return '%' + id + '%';
        }
        return strings[id];
    }

});