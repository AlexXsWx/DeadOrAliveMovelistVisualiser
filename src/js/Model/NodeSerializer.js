define(

    'Model/NodeSerializer',

    [
        'Model/NodeFactoryRoot',
        'Localization/Strings',
        'Tools/JsonFileReader', 'Tools/Request', 'Tools/Tools'
    ],

    function NodeSerializer(NodeFactoryRoot, Strings, JsonFileReader, Request, _) {

        // ==== Link ====

            function Link(getter) {
                this.getter = getter;
                this.objectId = Link.objectIdCounter++;
                Object.defineProperty(this, 'usage', {
                    value: 0,
                    writable: true
                });
            }

            Link.objectIdCounter = 0;

            Link.serialize2 = function(link) {
                return {
                    objectId: link.objectId,
                    value: link.getter()
                };
            };

            Link.isSerializedLink2 = function(obj) {
                return obj && Object.prototype.hasOwnProperty.call(obj, 'objectId');
            };

            Link.prototype.bump = function bump() {
                this.usage += 1;
                return this;
            };

            function createLink(getter) {
                return new Link(getter);
            }

        // ==============

        var CURRENT_FORMAT_VERSION = 4;

        return {
            serializeToBase64Url: serializeToBase64Url,
            deserializeFromLocalFile: deserializeFromLocalFile,
            deserializeFromUrl: deserializeFromUrl
        };

        function serializeToBase64Url(rootNodeData) {

            Link.objectIdCounter = 0;

            var shared = _.createObjectStorage();

            var temp1 = NodeFactoryRoot.serialize(rootNodeData, shared, createLink);
            var usedLinks = shared.getValues().filter(function(link) { return link.usage > 0; });

            replaceDuplicates(
                temp1,
                function(obj) {
                    return usedLinks.some(function(link) { return link.getter() === obj; });
                },
                function(obj) {
                    return _.find(usedLinks, function(link) { return link.getter() === obj; });
                }
            );

            var exportedJsonObj = exportJson(
                temp1,
                _.withoutFalsyElements(usedLinks.map(Link.serialize2))
            );

            var url = (
                "data:application/json;charset=utf8;base64," +
                window.btoa(JSON.stringify(exportedJsonObj, null, '  '))
            );

            return url;

            function replaceDuplicates(obj, isDuplicate, replace) {
                if (typeof obj !== "object" || !obj) return;
                for (key in obj) {
                    if (obj.hasOwnProperty(key)) {
                        if (isDuplicate(obj[key])) {
                            obj[key] = replace(obj[key]);
                        } else {
                            replaceDuplicates(obj[key], isDuplicate, replace);
                        }
                    }
                }
            }
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

            var sharedStorage = _.createObjectStorage(/*function(key) { return _.isObject(key); }*/);

            var rootNodeData;
            try {
                rootNodeData = NodeFactoryRoot.createRootNode(importResult.body, creator);
            } catch(error) {
                reportLoadError(error);
                return;
            }
            onSuccess(rootNodeData);

            return;

            function creator(createSelf, createChildren, optSource) {
                var linkId = null;
                var source = optSource;

                if (source) {
                    var obj = getObj(source);
                    if (obj.link) {
                        linkId = obj.linkId;
                        if (sharedStorage.has(linkId)) {
                            return sharedStorage.get(linkId);
                        }
                        source = obj.value;
                    }
                }

                var self = createSelf(source);

                if (linkId !== null) sharedStorage.set(linkId, self);

                createChildren(self);

                return self;
            }

            function getObj(obj) {
                var result = {
                    link: false,
                    linkId: null,
                    value: null
                };
                if (Link.isSerializedLink2(obj)) {
                    result.link = true;
                    if (importResult.shared) {
                        var tmp = _.find(importResult.shared, function(ehm) {
                            return ehm.objectId === obj.objectId;
                        });
                        if (tmp) {
                            result.value = tmp.value;
                            result.linkId = tmp.objectId;
                        }
                    }
                }
                return result;
            }
        }

        function reportLoadError(error) {
            // FIXME: no alerts
            alert(Strings('failedToImportJson', { ERROR_DATA: importResult.error }));
        }

        function exportJson(optRoot, shared) {
            return {
                header: {
                    format: shared ? CURRENT_FORMAT_VERSION : 3,
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
                jsonData.shared !== undefined && !_.isArray(jsonData.shared)
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
