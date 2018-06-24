define(

    'Tools/GithubStuff',

    [ 'Tools/Request', 'Tools/Tools' ],

    function GithubStuff(Request, _) {

        // TODO: move this data to main.js so that it's not hidden under src/Tools/
        var GITHUB_SETTINGS = {
            USER: 'AlexXsWx',
            REPO: 'DeadOrAliveMovelistVisualiser'
        };

        var BRANCHES = {
            MASTER: 'master',
            ALPHA:  'alpha'
        };

        var exampleBaseUrl = (
            'https://' +
            [
                'raw.githubusercontent.com',
                GITHUB_SETTINGS.USER,
                GITHUB_SETTINGS.REPO,
                !_.isDevBuild() && getCurrentVersion() || 'alpha',
                'data'
            ].join('/') +
            '/'
        );

        function getExampleUrl(characterName) {
            return exampleBaseUrl + characterName + '.json';
        }

        // TODO: recognize postfixes like alpha/beta/rc1/rc2
        var versionRgx = /^[^\d]*((?:\d+)(?:\.\d+)*)(?:([a-z])|[^\d]*)$/i;

        return {
            getExampleUrl: getExampleUrl,
            checkIfHigherVersionIsAvailable: checkIfHigherVersionIsAvailable
        };


        function checkIfHigherVersionIsAvailable() {

            var currentVersion = getCurrentVersion();

            if (currentVersion === null) {
                _.report("Unable to detect current version");
                return Promise.resolve(null);
            }

            return getHighestVersionOnline().then(function(highestVersionOnline) {

                var showHigherVersionAvailableNotification = (
                    isVersionAHigherThanB(highestVersionOnline, currentVersion)
                );

                console.log(
                    'Version check: current = %s, highest online = %s -> show notification = %s',
                    currentVersion,
                    highestVersionOnline,
                    showHigherVersionAvailableNotification
                );

                if (showHigherVersionAvailableNotification) {
                    var url = (
                        'https://' +
                        [
                            'rawgit.com',
                            GITHUB_SETTINGS.USER,
                            GITHUB_SETTINGS.REPO,
                            highestVersionOnline,
                            // FIXME: don't repeat yourself
                            'src',
                            'index.html'
                        ].join('/')
                    );
                    return url;
                }

            });

        }


        function getCurrentVersion() {
            if (window.location.hostname.toLowerCase() === 'rawgit.com') {
                var pathname = window.location.pathname;
                var version = pathname.match(/\/([^/]+)\/src\/index\.html/i);
                return version ? version[1] : null;
            } else {
                return BRANCHES.MASTER;
            }
        }


        function getHighestVersionOnline() {

            var url = (
                'https://' + [
                    'api.github.com',
                    'repos',
                    GITHUB_SETTINGS.USER,
                    GITHUB_SETTINGS.REPO,
                    'tags'
                ].join('/')
            );

            return Request.getJSON(url).then(function(parsedJsonResponse) {

                var highestVersion = null;

                _.forEachOwnProperty(parsedJsonResponse, function(key, value) {
                    var version = value.name;
                    if (
                        highestVersion === null ||
                        isVersionAHigherThanB(version, highestVersion)
                    ) {
                        highestVersion = version;
                    }
                });

                return highestVersion;

            }).catch(function(error) {
                _.report("Failed to get highest version available:", error);
            });

        }


        function isVersionAHigherThanB(versionStrA, versionStrB) {

            if (
                !isVersionValid(versionStrA) ||
                !isVersionValid(versionStrB)
            ) {
                return false;
            }

            var versionMatchResultA = versionStrA.match(versionRgx);
            var versionMatchResultB = versionStrB.match(versionRgx);

            if (
                !versionMatchResultA ||
                !versionMatchResultB
            ) {
                return false;
            }

            var versionArrA = versionMatchResultA[1].split('.');
            var versionArrB = versionMatchResultB[1].split('.');

            var minLength = Math.min(versionArrA.length, versionArrB.length);
            for (var i = 0; i < minLength; ++i) {
                var versionPartA = Number(versionArrA[i]);
                var versionPartB = Number(versionArrB[i]);
                if (versionPartA === versionPartB) continue;
                return versionPartA > versionPartB;
            }

            if (versionArrA.length === versionArrB.length) {
                var postfixA = versionMatchResultA[2];
                var postfixB = versionMatchResultB[2];
                var hasPostfixA = Boolean(postfixA);
                var hasPostfixB = Boolean(postfixB);
                if (hasPostfixA !== hasPostfixB) {
                    return !hasPostfixA;
                } else if (hasPostfixA) {
                    return postfixA.charCodeAt(0) > postfixB.charCodeAt(0);
                }
                return false;
            }
            return versionArrA.length > versionArrB.length;

        }


        function isVersionValid(verstionStr) {
            return Boolean(verstionStr) && (
                verstionStr === BRANCHES.MASTER ||
                verstionStr === BRANCHES.ALPHA ||
                Boolean(verstionStr.match(versionRgx))
            );
        }

    }

);
