define(

    'NodeSerializer',

    [ 'NodeFactory', 'JsonFileReader', 'Tools' ],

    function NodeSerializer(NodeFactory, JsonFileReader, _) {

        // FIXME: no alerts

        var CURRENT_FORMAT_VERSION = 3;

        return {
            serializeToBase64Url: serializeToBase64Url,
            deserializeFromLocalFile: deserializeFromLocalFile,
            deserializeFromUrl: deserializeFromUrl
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

        // TODO: clean up
        function deserializeFromUrl(url, onDataReady) {
            var request = new XMLHttpRequest();
            request.onreadystatechange = function() {
                if (request.readyState == 4 && request.status == 200) {
                    var parsedJson = {}
                    try {
                        parsedJson = JSON.parse(request.responseText);
                    } catch (e) {
                        console.error('Failed to parse JSON from "%s": %O', url, e);
                        alert('Failed to load JSON: ', e);
                    }
                    var sparseData = importJson(parsedJson);
                    if (!sparseData) {
                        alert('Failed to import json');
                        return;
                    }

                    var extendedData = NodeFactory.createRootNode(sparseData, true);
                    onDataReady(extendedData);
                }
            };
            request.open('GET', url, true);
            request.send();
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