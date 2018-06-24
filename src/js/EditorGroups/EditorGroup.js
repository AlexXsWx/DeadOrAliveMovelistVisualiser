define(

    'EditorGroups/EditorGroup',

    [ 'Tools/Tools' ],

    function(_) {

        return EditorGroup;

        function EditorGroup(name, filter, focus, updateView) {
            this.name = name;
            this.filter = filter;
            this.matchingSelectedViews = [];
            this.focus = focus;
            this.updateView = updateView;
            this.domRoot = _.createDomElement({ tag: 'table' });
        }

    }

);
