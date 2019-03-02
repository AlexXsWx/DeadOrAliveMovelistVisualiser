define(
    'Model/NodeFactoryHelpers',
    [],
    function NodeFactoryHelpers() {

        return { defaultCreator: defaultCreator };

        function defaultCreator(createSelf, createChildren, optSource) {
            var self = createSelf(optSource);
            createChildren(self);
            return self;
        }
    }
);
