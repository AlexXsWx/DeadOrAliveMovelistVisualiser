define(

    'NodeSerializer',

    [ 'NodeFactory', 'JsonFileReader', 'Tools', 'Request', 'Strings' ],

    function NodeSerializer(NodeFactory, JsonFileReader, _, Request, Strings) {

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
                        alert(Strings('failedToImportJson'));
                        return;
                    }

                    var extendedData = NodeFactory.createRootNode(sparseData, true);
                    onDataReady(extendedData);

                },

                function onFail(error) {
                    alert(Strings('invalidJson', { ERROR_DATA: error }));
                }

            );

        }

        function deserializeFromUrl(url, onDataReady) {
            Request.getJSON(url).then(
                function(parsedJson) {
                    var sparseData = importJson(parsedJson);
                    if (!sparseData) {
                        alert(Strings('failedToImportJson'));
                        return;
                    }
                    var extendedData = NodeFactory.createRootNode(sparseData, true);
                    onDataReady(extendedData);
                },
                function(error) { console.error(error); }
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