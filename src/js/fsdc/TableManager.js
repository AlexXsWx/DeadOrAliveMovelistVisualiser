define(

    'fsdc/TableManager',

    [ 'Tools/Tools' ],

    function TableManagerModule(_) {

        return createTableDomControl;

        function createTableDomControl(tableElement, bodyRowsCount, initCellFunc) {

            var domCache = {
                table: tableElement,
                head: tableElement.querySelector('thead'),
                body: tableElement.querySelector('tbody')
            };

            addInitialBodyRows(bodyRowsCount);
            
            return {
                getHeader1Cells: getHeader1Cells,
                addTableBodyRow: addTableBodyRow,
                addTableColumn:  addTableColumn,
                getCoords:       getCoords,
                accomodate:      accomodate,
                getCustomData:   getCustomData
            };

            function getHeader1Cells() {
                return Array.from(domCache.head.querySelector('tr').querySelectorAll('th')).slice(1);
            }

            function addInitialBodyRows(bodyRowsCount) {
                for (var i = 0; i < bodyRowsCount; ++i) {
                    addTableBodyRow();
                }
            }

            function accomodate(minColumnsCount) {
                while (getColumnsCount() < minColumnsCount + 1) {
                    addTableColumn();
                }
            }

            function addTableBodyRow() {
                var row = createBodyRow(getTableBodyRowsCount());
                domCache.body.appendChild(row);
                return row;
            }

            function addTableColumn() {
                var x = getColumnsCount();

                Array.from(domCache.head.querySelectorAll('tr')).forEach(
                    function(row, i, a) {
                        var cell = createCell(x, -(a.length - 1 - i));
                        row.appendChild(cell);
                    }
                );

                Array.from(domCache.body.querySelectorAll('tr')).forEach(
                    function(row, i, a) {
                        var cell = createCell(x, i + 1);
                        row.appendChild(cell);
                    }
                );
            }

            function getCoords(element) {
                var temp = element;
                while (temp) {
                    if (
                        temp instanceof HTMLTableCellElement &&
                        temp.parentElement instanceof HTMLTableRowElement && (
                            temp.parentElement.parentElement === domCache.head ||
                            temp.parentElement.parentElement === domCache.body
                        )
                    ) {
                        var cell = temp;
                        var row = temp.parentElement;
                        var posY = getIndexOfAInB(row, domCache.body);
                        return {
                            x: getIndexOfAInB(cell, row),
                            y: (row.parentElement === domCache.head) ? null : posY
                        };
                    }
                    temp = temp.parentElement;
                }
                return null;

                function getIndexOfAInB(child, parent) {
                    return Array.from(parent.querySelectorAll(child.tagName)).indexOf(child);
                }
            }

            //

            function createBodyRow(y) {
                return _.createDomElement({
                    tag: 'tr',
                    children: _.createArray(
                        getColumnsCount(),
                        function(element, index) {
                            return createCell(index, y + 1);
                        }
                    )
                });
            }

            function getColumnsCount() {
                return domCache.head.querySelector('tr').querySelectorAll('th').length;
            }

            function getTableBodyRowsCount() {
                return domCache.body.querySelectorAll('tr').length;
            }

            function createCell(x, y) {
                var customData = {};
                var header = (x <= 0) || (y <= 0);
                var cell = _.createDomElement({ tag: header ? 'th' : 'td' });
                var content = initCellFunc(cell, customData, x - 1, y - 1);
                setCustomData(cell, customData);
                return cell;
            }

            function setCustomData(cell, customData) { cell.customData = customData; }
            function getCustomData(cell)             { return cell.customData; }

            // Tools

            function arrify(obj) {
                return Array.isArray(obj) ? obj : [obj];
            }
        }
        
    }

);
