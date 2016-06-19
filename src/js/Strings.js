define('Strings', function Strings() {

    var strings = {

        'characterName': 'Character',
        'characterNameDescription': 'Character name - e.g. "Kasumi" or "Hayabusa"',
        'characterNamePlaceholder': 'e.g. "Kasumi"',

        'gameVersion': 'Game version',
        'gameVersionDescription': 'Game version - e.g. "1.04 steam"',
        'gameVersionPlaceholder': 'e.g. "1.04 steam"',

        'stanceAbbreviation': 'Abbreviation',
        'stanceAbbreviationDescription': 'Stance abbreviation - e.g. "BKH" for Helena\'s Bokuho',
        'stanceAbbreviationPlaceholder': 'e.g. "BKH"',

        'stanceDescription': 'Description',
        'stanceDescriptionDescription': 'Abbreviation description - e.g. "Bokuho"',
        'stanceDescriptionPlaceholder': 'e.g. "Bokuho"',

        'stanceEnding': 'Ending',
        'stanceEndingDescription': 'Abbreviation of another stance if transits automatically',
        'stanceEndingPlaceholder': 'e.g. "BND"',

        'moveSummary': 'Summary',
        'moveSummaryDescription': (
            'Move summary - one place to fill following:\n' +
            '  context (optional)\n' +
            '  input\n' +
            '  1st action step summary (optional)\n' +
            'Examples: "p hp", "33K dmk", "OBT,OCr: 2T tlg"'
        ),
        'moveSummaryPlaceholder': '(<Ctx>:) <Input> (<AS sum.>)',

        'moveInput': 'Input',
        'moveInputDescription': 'Keys to perform the move - e.g. "236P"',
        'moveInputPlaceholder': 'e.g. "236P"',

        'moveFrameData': 'Frame data',
        'moveFrameDataDescription': 'Frame data of the move - e.g. "11 (2) 15"',
        'moveFrameDataPlaceholder': 'e.g. "11 (2) 15"',

        'moveActionSteps': 'Action steps',
        'moveActionStepsDescription': 'Move action steps - for most moves just one',

        'moveEnding': 'Ending',
        'moveEndingDescription': (
            'Abbreviation of a stance the move ends with - e.g. "BND" for Rig\'s Bending stance'
        ),
        'moveEndingPlaceholder': 'e.g. "BND"',

        'moveContext': 'Context',
        'moveContextDescription': 'Requirements to perform the move - e.g. "BT" for back-turned',
        'moveContextPlaceholder': 'e.g. "BT" for back-turned"',

        'moveActionMask': 'Mask',
        'moveActionMaskDescription': (
            'Action step mask. When available, specifies height classes of the action step, and\n' +
            'optionally strike or hold types - punch or kick. Examples - high; low K; mid P mid K'
        ),

        'moveActionType': 'Type',
        'moveActionTypeDescription': (
            'Action step type. Possible values are: strike; jump attack; grab for throw; ' +
            'OH grab; grab for hold; ground attack; other'
        ),

        'moveActionTracking': 'Tracking',
        'moveActionTrackingDescription': (
            'Whether the action step is tracking or not. Only tracking moves can hit opponent\n' +
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
            'Action step condition.\n' +
            'Specifies what conditions are resulting the rest action step data\n' +
            'e.g. airborne; with wall behind'
        ),

        'moveActionTags': 'Tags',
        'moveActionTagsDescription': (
            'Action step tags. Everything else that didn\'t fit in this form, e.g. Guard Break'
        ),

        'moveActionResultCondition': 'Condition',
        'moveActionResultConditionDescription': (
            'Action step result condition. Specifies what conditions are giving this result,\n' +
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