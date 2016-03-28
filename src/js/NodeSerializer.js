define(

    'NodeSerializer',

    [ 'NodeFactory', 'JsonFileReader', 'Tools' ],

    function NodeSerializer(NodeFactory, JsonFileReader, _) {

        var CURRENT_FORMAT_VERSION = 3;
        
        return {
            serializeToBase64Url: serializeToBase64Url,
            deserializeFromLocalFile: deserializeFromLocalFile
        };

        function serializeToBase64Url(rootNodeData) {
            var exportedJsonObj = exportJson(
                // FIXME: this will move action step if previous is not filled
                _.withoutFalsyProperties(rootNodeData)
            );

            var url = (
                "data:application/json;charset=utf8;base64," +
                window.btoa(JSON.stringify(exportedJsonObj, null, '  '))
            );

            return url;
        }

        function deserializeFromLocalFile(file, onDataReady) {

            file && JsonFileReader.readJson(file).then(

                function onSuccess2(parsedJson) {

                    var sparseData = importJson(parsedJson);
                    if (!sparseData) {
                        alert('Failed to import json');
                        return;
                    }

                    var extendedData = NodeFactory.createRootNode(sparseData, true);
                    onDataReady(extendedData);

                },

                function onFail(error) {
                    alert('Error: Invalid JSON file\n%O', error);
                }

            );

        }

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

    }

);