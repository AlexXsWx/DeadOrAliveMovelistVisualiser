define('EditorGroups/EditorGroup', [], function() {

    return EditorGroup;

    function EditorGroup(name, domNode, filter, focus, bindListeners, updateView) {
        this.name = name;
        this.domNode = domNode;
        this.filter = filter;
        this.matchingSelectedViews = [];
        this.focus = focus;
        this.bindListeners = bindListeners;
        this.updateView = updateView;
    }

});