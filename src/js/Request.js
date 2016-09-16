define('Request', function Request() {

    return {
        getJSON: getJSON
    };

    function getJSON(url) {
        return new Promise(function(succeed, failed) {
            var request = new XMLHttpRequest();
            request.onreadystatechange = function onreadystatechange() {
                if (request.readyState != XMLHttpRequest.DONE) return;
                if (request.status != 200) {
                    failed('Failed to get json from "' + url + '": HTTP ' + request.status);
                    return;
                }
                try {
                    var parsedJson = JSON.parse(request.responseText);
                    succeed(parsedJson);
                } catch (error) {
                    failed('Failed to parse JSON from "' + url + '": ' + error);
                }
            };
            request.open('GET', url, true);
            request.send();
        });
    }

});