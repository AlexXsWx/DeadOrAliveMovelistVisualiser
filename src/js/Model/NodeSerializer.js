define(

    'Model/NodeSerializer',

    [
        'Model/NodeFactoryRoot',
        'Localization/Strings',
        'Tools/JsonFileReader', 'Tools/Request', 'Tools/Tools'
    ],

    function NodeSerializer(NodeFactoryRoot, Strings, JsonFileReader, Request, _) {

        var CURRENT_FORMAT_VERSION = 4;

        return {
            serializeToBase64Url: serializeToBase64Url,
            deserializeFromLocalFile: deserializeFromLocalFile,
            deserializeFromUrl: deserializeFromUrl
        };

        function serializeToBase64Url(rootNodeData) {
            var shared; // = _.createObjectStorage();
            var exportedJsonObj = exportJson(
                NodeFactoryRoot.serialize(rootNodeData, shared),
                shared
            );

            var url = (
                "data:application/json;charset=utf8;base64," +
                window.btoa(JSON.stringify(exportedJsonObj, null, '  '))
            );

            return url;
        }

        function deserializeFromLocalFile(file, onDataReady) {
            file && JsonFileReader.readJson(file).then(
                function onSuccess(parsedJson) { deserialize(parsedJson, onDataReady); },
                function onFail(error)         { reportLoadError(error); }
            );
        }

        function deserializeFromUrl(url, onDataReady) {
            Request.getJSON(url).then(function(parsedJson) {
                deserialize(parsedJson, onDataReady);
            }).catch(function(error) {
                reportLoadError(error);
            });
        }

        function deserialize(parsedJson, onSuccess) {
            var importResult = importJson(parsedJson);
            if (!importResult.success) {
                reportLoadError(importResult.error);
                return;
            }

            var sharedStorage = _.createObjectStorage(function(key) { return _.isObject(key); });

            var rootNodeData;
            try {
                rootNodeData = NodeFactoryRoot.createRootNode(
                    importResult.body,
                    importResult.shared,
                    sharedStorage
                );
            } catch(error) {
                reportLoadError(error);
                return;
            }
            onSuccess(rootNodeData);
        }

        function reportLoadError(error) {
            // FIXME: no alerts
            alert(Strings('failedToImportJson', { ERROR_DATA: importResult.error }));
        }

        function exportJson(optRoot, shared) {
            return {
                header: {
                    format: CURRENT_FORMAT_VERSION,
                    timeSaved: Date.now()
                },
                body:  optRoot || undefined,
                shared: shared || undefined
            };
        }


        function importJson(jsonData) {

            var result = {
                success: false,
                error:   undefined,
                body:    undefined,
                shared:  undefined
            };

            if (!_.isObject(jsonData)) {
                result.error = 'Invalid data';
                return result;
            }

            if (
                !_.isObject(jsonData.header) ||
                !isFormatSupported(jsonData.header.format)
            ) {
                result.error = 'Not compatible JSON format';
                return result;
            }

            if (
                jsonData.body   !== undefined && !_.isObject(jsonData.body) ||
                jsonData.shared !== undefined && !_.isObject(jsonData.shared)
            ) {
                result.error = 'Invalid data';
                return result;
            }

            result.success = true;
            result.body    = jsonData.body;
            result.shared  = jsonData.shared;

            return result;

            function isFormatSupported(format) {
                if (format === CURRENT_FORMAT_VERSION) return true;
                if (
                    // Backwards compatible change - recursive structures via `shared`
                    format === 3 &&
                    CURRENT_FORMAT_VERSION === 4
                ) {
                    return true;
                }
                return false;
            }

        }

    }

);
