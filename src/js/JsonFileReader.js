define('JsonFileReader', [], function() {

    return { readJson: readJson };

    function readJson(file) {
        return new Promise(function(resolve, reject) {
            var reader = new FileReader();
            reader.addEventListener('load', onFileLoaded);
            reader.readAsText(file);

            function onFileLoaded() {
                var parsedJson;
                try {
                    parsedJson = JSON.parse(this.result);
                } catch (error) {
                    reject(error);
                    return;
                }
                resolve(parsedJson);
            }
        });
    }

});