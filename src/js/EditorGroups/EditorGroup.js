define(

    'EditorGroups/EditorGroup',

    [ 'View/NodeView', 'Tools/Tools' ],

    function(NodeView, _) {

        return EditorGroup;

        function EditorGroup(name, filter, focus, updateView) {
            this.name = name;
            this.matchingSelectedViews = [];
            this.focus = focus;
            this.updateView = updateView;
            this.domRoot = _.createDomElement({ tag: 'table' });

            this.updateBySelection = function(selectedNodeViews) {
                this.matchingSelectedViews = selectedNodeViews.filter(function(nodeView) {
                    var nodeData = NodeView.getNodeData(nodeView);
                    return filter(nodeData);
                });

            }
        }

    }

);
