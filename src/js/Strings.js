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
        )

    };

    return getString;

    function getString(id) {
        return strings[id];
    }

});