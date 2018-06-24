define(

    'EditorGroups/EditorGroupCommonCreator',

    [ 'EditorGroups/EditorGroup', 'Tools/Tools' ],

    function EditorGroupCommonCreator(EditorGroup,  _) {

        return { create: create };

        function create(onAdd, onDelete, moveNodeBy, toggleChildren) {

            var editorGroupCommon = new EditorGroup('common', filter, focus, updateView);

            var row0 = _.createMergedRow(2, [
                _.createDomElement({
                    tag: 'input',
                    attributes: {
                        'type': 'button',
                        'value': 'Add child (+)'
                    },
                    listeners: { 'click': onAdd }
                }),
                _.createDomElement({
                    tag: 'input',
                    attributes: {
                        'type': 'button',
                        'value': 'Delete selected node'
                    },
                    listeners: { 'click': onDelete }
                }),
            ]);

            var row1 = _.createMergedRow(2, [
                _.createDomElement({
                    tag: 'input',
                    attributes: {
                        'type': 'button',
                        'value': 'Toggle Children' // TODO: spacebar
                    },
                    listeners: {
                        'click': function(event) {
                            toggleChildren();
                        }
                    }
                })
            ]);

            var row2 = _.createMergedRow(2, [
                _.createDomElement({
                    tag: 'label',
                    children: [ _.createTextNode('Move: ') ]
                }),
                _.createDomElement({
                    tag: 'input',
                    attributes: {
                        'type': 'button',
                        'value': 'Up'
                    },
                    listeners: {
                        'click': function(event) {
                            moveNodeBy(-1);
                        }
                    }
                }),
                _.createDomElement({
                    tag: 'input',
                    attributes: {
                        'type': 'button',
                        'value': 'Down'
                    },
                    listeners: {
                        'click': function(event) {
                            moveNodeBy(1);
                        }
                    }
                })
            ]);

            row0.classList.add('columnRight');
            row1.classList.add('columnRight');
            row2.classList.add('columnRight');

            editorGroupCommon.domRoot.appendChild(row0);
            editorGroupCommon.domRoot.appendChild(row1);
            editorGroupCommon.domRoot.appendChild(row2);

            return editorGroupCommon;

            function filter(data) { return true; }

            function focus() { return false; }

            function updateView() {}

        }

    }

);
