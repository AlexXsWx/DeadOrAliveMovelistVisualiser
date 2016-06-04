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
            'Reset checkbox back to not specified value'
        ),

        'moveActionDamage': 'Damage',
        'moveActionDamageDescription': (
            'Action step damage'
        ),

        'moveActionCondition': 'Condition',
        'moveActionConditionDescription': (
            'Action step condition. Specifies what conditions are resulting the rest action step ' +
            'data, e.g. airborne; with wall behind'
        ),

        'moveActionTags': 'Tags',
        'moveActionTagsDescription': (
            'Action step tags. Everything else that didn\'t fit in this form, e.g. Guard Break'
        ),

        'moveActionResultCondition': 'Condition',
        'moveActionResultConditionDescription': (
            'Action step result condition. Specifies what conditions are giving this result, ' +
            'e.g. hi-counter'
        ),

        'moveActionResultTags': 'Tags',
        'moveActionResultTagsDescription': (
            'Action step result tags. Everything else that didn\'t fit in this form, ' +
            'e.g. sit-down stun'
        ),

        'moveActionSummary': 'Summary',
        'moveActionSummaryDescription': (
            'Mask, Type and Tracking\n' +
            'Available letters:\n' +
            '   T for tracking\n' +
            '   D for direct (opposite to tracking)\n' +
            '   J for jump attack\n' +
            '   H/M/L for high/mid/low\n' +
            '   F for ground attack (f for Floor)\n' +
            '   P for punch\n' +
            '   K for kick\n' +
            '   G for grab (throw)\n' +
            '   C for counter-hold\n' +
            'Examples: "dhp", "lg", "mhpc"'
        ),
        'moveActionSummaryPlaceholder': 'e.g. "tlk" for tracking low kick'

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