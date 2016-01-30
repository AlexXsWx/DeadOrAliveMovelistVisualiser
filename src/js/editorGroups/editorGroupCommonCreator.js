define(

    'editorGroups/editorGroupCommonCreator',

    ['editorGroups/EditorGroup', 'editorGroups/editorTools', 'tools'],

    function(EditorGroup, editorTools, _) {

        return { create: create };

        function create(onAdd, onDelete, moveNodeBy) {

            var editorGroup = new EditorGroup(
                'common', _.getDomElement('editorOther'), filter, focus, bindListeners, updateView
            );

            return editorGroup;

            function filter(data) { return true; }

            function focus() { return false; }

            function bindListeners() {

                addClickListener(_.getDomElement('addChild'),   onAdd);
                addClickListener(_.getDomElement('deleteNode'), onDelete);

                addClickListener(_.getDomElement('moveNodeUp'),   moveNodeBy.bind(null, -1));
                addClickListener(_.getDomElement('moveNodeDown'), moveNodeBy.bind(null,  1));

            }

            function updateView() {}

            //

            function addClickListener(buttonElement, action) {
                buttonElement.addEventListener('click', action);
            }

        }

    }

);