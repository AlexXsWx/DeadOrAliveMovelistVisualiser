define('Strings', ['Tools'], function Strings(_) {

    var strings = {

        'enterUrl': 'Enter URL:',

        'enterFramesToForceTech': 'Your frames to land on: e.g. "43" or "43-45"',
        'enterFramesToSpend': (
            'Amount of frames to spend and stance to end in ' +
            '(leave empty for "${DEFAULT_STANCE}")' +
            ':'
        ),
        'enterFramesToLandOn': 'Your frames to land on: e.g. "17-19"',
        'enterStanceToShow': 'Enter stance name: (e.g. "${EXAMPLE_STANCE}")',

        'warnings': 'warnings',
        'hasNoFrameData': 'has no frameData, probabilities that use it are excluded',
        'stance': 'stance',
        'undefinedInitialFrame': 'did not define appliesExtraFrame, assuming it does',
        'skippingFreeCancel': 'has no-input followup and defines no ending stance',

        'undoIsBorked': '[Ctrl]+[Z] is disabled since it may corrupt the entered data',

        'failedToImportJson': 'Failed to import json',
        'invalidJson': 'Error: Invalid JSON file\n${ERROR_DATA}',

        'characterName': 'Character',
        'characterNameDescription': 'Character name - e.g. "Kasumi" or "Hayabusa"',
        'characterNamePlaceholder': 'e.g. "Kasumi"',

        'gameVersion': 'Game version',
        'gameVersionDescription': 'Game version - e.g. "1.04 steam"',
        'gameVersionPlaceholder': 'e.g. "1.04 steam"',

        'stanceAbbreviation': 'Alias',
        'stanceAbbreviationDescription': 'Alias for the stance - e.g. "BKH" for Helena\'s Bokuho',
        'stanceAbbreviationPlaceholder': 'e.g. "BKH"',

        'stanceDescription': 'Description',
        'stanceDescriptionDescription': 'Abbreviation description - e.g. "Bokuho"',
        'stanceDescriptionPlaceholder': 'e.g. "Bokuho"',

        'stanceExtraFrame': 'Extra frame',
        'stanceExtraFrameDescription': (
            'If moves from this stance have an idle frame.\n' +
            'For most stances, including default (standing), they are'
        ),

        'moveSummary': 'Summary',
        'moveSummaryDescription': (
            'Move summary - one place to fill following:\n' +
            '  context (optional)\n' +
            '  input\n' +
            '  1st action step summary (optional)\n' +
            'Examples: "p hp", "33K dmk", "OBT,OCr: 2T tlg"'
        ),
        'moveSummaryPlaceholder': '(<Ctx>:) <Input> (<AS sum.>)',

        'moveSummary2': 'Summary2',
        'moveSummary2Description': '// FIXME: TBD', // FIXME
        'moveSummary2Placeholder': '[t|d] <Frame data> \/<advantage on block>',

        'moveInput': 'Input',
        'moveInputDescription': 'Keys to perform the move - e.g. "236P"',
        'moveInputPlaceholder': 'e.g. "236P"',

        'moveFrameData': 'Frame data',
        'moveFrameDataDescription': 'Frame data of the move - e.g. "11 (2) 15"',
        'moveFrameDataPlaceholder': 'e.g. "11 (2) 15"',

        'summaryAdvantageOnBlock': 'Advantage on block',
        'summaryAdvantageOnBlockDescription': (
            'Helper field, uses entered number to calculate hit block duration.\n' +
            'It assumes that move landed on the first active frame.\n' +
            'Frame data for this move has to be already entered for it to work'
        ),

        'followUpInterval': 'Followup interval',
        'followUpIntervalDescription': 'When doing followup, how many frames total without initial',
        'followUpIntervalPlaceholder': 'e.g. "12~23"',

        'comment': 'Comment',
        'commentDescription': 'Anything to note about this move',
        'commentPlaceholder': 'e.g. "The game lies about framedata of this move"',

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
        'moveActionDamageDescription': 'Action step damage',

        'moveActionReach': 'Reach',
        'moveActionReachDescription': 'How far the action step reaches',

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

    // TODO: recusrive localization

    function getString(id, optReplaceMap) {
        if (!strings.hasOwnProperty(id)) {
            console.error('Strings has no id %s', id);
            return '@[' + id + ']@';
        }
        var result = strings[id];
        if (optReplaceMap) {
            _.forEachOwnProperty(optReplaceMap, function(key, replacement) {
                result = result.split('${' + key + '}').join(replacement);
            });
        }
        return result;
    }

});