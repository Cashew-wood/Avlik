import global_constant from "./global_constant";
export default function (template) {
    return {
        onDataChange(tab) {
            let columnInfos = {};
            let sql = '';
            let primaryColumns = []
            for (let column of tab.columns) {
                if (column.key) {
                    primaryColumns.push(column.name);
                }
                columnInfos[column.name] = { jsType: template.dataType[column.type].jsType, ...column };
            }
            for (let row of tab.data) {
                let change = false;
                let set = '';
                if (row[global_constant.hiddenFieldState] == 'update') {
                    for (let column in row) {
                        if (column.startsWith(global_constant.hiddenFieldPrefix)) continue;
                        if (row[column] != row[global_constant.hiddenFieldPrefix + column]) {
                            let info = columnInfos[column];
                            if (row[column] == null)
                                set += `${column}=null,`;
                            else if (info.jsType == 'number')
                                set += `${column}=${row[column]},`;
                            else set += `${column}='${row[column]}',`;
                            change = true;
                        }
                    }
                    if (change) {
                        let primaryColumnData = '';
                        for (let column of primaryColumns) {
                            let info = columnInfos[column];
                            primaryColumnData += `${column}=`;
                            if (row[column] == null)
                                primaryColumnData += 'null and ';
                            else if (info.jsType == 'number')
                                primaryColumnData += `${row[column]} and `
                            else primaryColumnData += `'${row[column]}' and `
                            change = true;
                        }
                        primaryColumnData = primaryColumnData.substring(0, primaryColumnData.length - 5);
                        sql += `update ${tab.table} set ${set.substring(0, set.length - 1)} where ${primaryColumnData};`
                    }
                } else if (row[global_constant.hiddenFieldState] == 'insert') {
                    let columns = '('
                    let values = 'values(';
                    for (let column in row) {
                        if (column.startsWith(global_constant.hiddenFieldPrefix)) continue;
                        columns += column + ','
                        let info = columnInfos[column];
                        if (row[column] == null)
                            values += 'null,';
                        else if (info.jsType == 'number')
                            values += row[column] + ',';
                        else values += "'" + row[column] + "',";
                    }
                    columns = columns.substring(0, columns.length - 1) + ')';
                    values = values.substring(0, values.length - 1) + ')';
                    sql += `insert into ${tab.table}${columns} ${values};`;
                } else if (row[global_constant.hiddenFieldState] == 'delete') {
                    let primaryColumnData = '';
                    for (let column of primaryColumns) {
                        let info = columnInfos[column];
                        primaryColumnData += `${column}=`;
                        if (row[column] == null)
                            primaryColumnData += 'null and ';
                        else if (info.jsType == 'number')
                            primaryColumnData += `${row[column]} and `
                        else primaryColumnData += `'${row[column]}' and `
                        change = true;
                    }
                    primaryColumnData = primaryColumnData.substring(0, primaryColumnData.length - 5);
                    sql += `delete from ${tab.table} where ${primaryColumnData};`
                }
            }
            return sql;
        },
        onCopyRowInsert(tab, row) {
            let columns = '('
            let values = 'values(';
            let columnInfos = {};
            for (let column of tab.columns) {
                columnInfos[column.name] = { jsType: template.dataType[column.type].jsType, ...column };
            }
            for (let column in row) {
                if (column.startsWith(global_constant.hiddenFieldPrefix)) continue;
                columns += column + ','
                let info = columnInfos[column];
                if (row[column] == null)
                    values += 'null,';
                else if (info.jsType == 'number')
                    values += row[column] + ',';
                else values += "'" + row[column] + "',";
            }
            columns = columns.substring(0, columns.length - 1) + ')';
            values = values.substring(0, values.length - 1) + ')';
            return `insert into ${tab.table}${columns} ${values};`;
        },
        onCopyRowUpdate(tab, row) {
            let set = '';
            let columnInfos = {};
            let primaryColumns = []
            for (let column of tab.columns) {
                if (column.key) {
                    primaryColumns.push(column.name);
                }
                columnInfos[column.name] = { jsType: template.dataType[column.type].jsType, ...column };
            }
            for (let column in row) {
                if (column.startsWith(global_constant.hiddenFieldPrefix)) continue;
                let info = columnInfos[column];
                if (row[column] == null)
                    values += `${column}=null,`;
                else if (info.jsType == 'number')
                    set += `${column}=${row[column]},`;
                else set += `${column}='${row[column]}',`;
            }
            let primaryColumnData = '';
            for (let column of primaryColumns) {
                let info = columnInfos[column];
                primaryColumnData += `${column}=`;
                if (row[column] == null)
                    primaryColumnData += 'null and ';
                else if (info.jsType == 'number')
                    primaryColumnData += `${row[column]} and `
                else primaryColumnData += `'${row[column]}' and `
            }
            primaryColumnData = primaryColumnData.substring(0, primaryColumnData.length - 5);
            return `update ${tab.table} set ${set.substring(0, set.length - 1)} where ${primaryColumnData};`
        }
    }

}