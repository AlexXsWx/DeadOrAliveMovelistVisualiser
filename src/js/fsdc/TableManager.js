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
                addTableBodyRow: addTableBodyRow,
                addTableColumn:  addTableColumn,
                getCoords:       getCoords,
                accomodate:      accomodate,
                getCustomData:   getCustomData
            };

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
                var result = {
                    head: [],
                    body: []
                };
                var x = getColumnsCount();

                var cell = createCell(x, 0);
                domCache.head.querySelector('tr').appendChild(cell);
                result.head.push(cell);

                Array.from(domCache.body.querySelectorAll('tr')).forEach(
                    function(row, i, a) {
                        var cell = createCell(x, i + 1);
                        row.appendChild(cell);
                        result.body.push(cell);
                    }
                );
                return result;
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
                var header = (x === 0) || (y === 0);
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
