define('nodeSerializer', ['tools'], function(_) {

    var CURRENT_FORMAT_VERSION = 3;
    
    return {
        exportJson: exportJson,
        importJson: importJson
    };


    function exportJson(root) {
        return {
            header: {
                format: CURRENT_FORMAT_VERSION,
                timeSaved: Date.now()
            },
            body: root
        };
    }


    function importJson(jsonData) {

        if (!_.isObject(jsonData)) {
            console.log('Invalid data');
            return null;
        }

        if (!_.isObject(jsonData.header) || jsonData.header.format !== CURRENT_FORMAT_VERSION) {
            console.log('Not compatible JSON format');
            return null;
        }

        if (!_.isObject(jsonData.body)) {
            console.log('Invalid data');
            return null;   
        }

        return jsonData.body;

    }

})