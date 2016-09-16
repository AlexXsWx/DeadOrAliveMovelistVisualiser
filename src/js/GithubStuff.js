define('GithubStuff', ['Request', 'Tools'], function GithubStuff(Request, _) {

    var githubSettings = {
        user: 'AlexXsWx',
        repo: 'DeadOrAliveMovelistVisualiser'
    };

    var exampleBaseUrl = 'https://' + [
        'raw.githubusercontent.com',
        githubSettings.user,
        githubSettings.repo
    ].join('/') + '/';

    var EXAMPLE_URLS = {
        rig:   exampleBaseUrl + 'master/data/rig.6.json',
        jacky: exampleBaseUrl + 'alpha/data/jacky.json',
        mai:   exampleBaseUrl + 'master/data/mai.json'
    };

    var versionRgx = /^[^\d]*((?:\d+)(?:\.\d+)*)[^\d]*$/i;

    return {
        EXAMPLE_URLS: EXAMPLE_URLS,
        checkIfHigherVersionIsAvailable: checkIfHigherVersionIsAvailable
    };


    function checkIfHigherVersionIsAvailable() {

        var currentVersion = getCurrentVersion();

        // TODO: uncomment after online version check is tested live
        // if (currentVersion == null) {
        //     // Unable to figure out current version - could be because runned locally
        //     return;
        // }

        getHighestVersionOnline().then(function(highestVersionOnline) {

            var showHigherVersionAvailablePopup = (
                isVersionAHigherThanB(highestVersionOnline, currentVersion)
            );

            console.log(
                'Version check: current = "%s", highest online = "%s" -> show popup = %s',
                currentVersion,
                highestVersionOnline,
                showHigherVersionAvailablePopup
            );

        });

    }


    function getCurrentVersion() {
        var pathname = window.location.pathname;
        var version = pathname.match(/\/([^/]+)\/src\/index\.html/i);
        return version ? version[1] : null;
    }


    function getHighestVersionOnline() {

        var url = (
            'https://' + [
                'api.github.com', 'repos', githubSettings.user, githubSettings.repo, 'tags'
            ].join('/')
        );

        return Request.getJSON(url).then(function(parsedJsonResponse) {

            var highestVersion = null;

            _.forEachOwnProperty(parsedJsonResponse, function(key, value) {
                var version = value.name;
                if (
                    highestVersion == null ||
                    isVersionAHigherThanB(version, highestVersion)
                ) {
                    highestVersion = version;
                }
            });

            return highestVersion;

        }).catch(function(error) {
            console.log(error);
        });

    }


    function isVersionAHigherThanB(versionStrA, versionStrB) {

        if (!isVersionValid(versionStrA) || !isVersionValid(versionStrB)) return false;

        var versionMatchResultA = versionStrA.match(versionRgx);
        var versionMatchResultB = versionStrB.match(versionRgx);

        if (!versionMatchResultA || !versionMatchResultB) return false;

        var versionArrA = versionMatchResultA[1].split('.');
        var versionArrB = versionMatchResultB[1].split('.');

        var minLength = Math.min(versionArrA.length, versionArrB.length);
        for (var i = 0; i < minLength; ++i) {
            var versionPartA = Number(versionArrA[i]);
            var versionPartB = Number(versionArrB[i]);
            if (versionPartA === versionPartB) continue;
            return versionPartA > versionPartB;
        }

        if (versionArrA.length === versionArrB.length) return 0;
        return versionArrA.length > versionArrB.length;

    }


    function isVersionValid(verstionStr) {
        return verstionStr != null && (
            verstionStr === 'master' ||
            verstionStr === 'alpha' ||
            Boolean(verstionStr.match(versionRgx))
        );
    }

});