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
                columnInfos[column.name] = { jsType: template.dataType[column.type] && template.dataType[column.type].jsType, ...column };
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
                                set += `${template.symbolLeft}${column}${template.symbolRight}=null,`;
                            else if (info.jsType == 'number')
                                set += `${template.symbolLeft}${column}${template.symbolRight}=${row[column]},`;
                            else set += `${template.symbolLeft}${column}${template.symbolRight}='${row[column].replaceAll('\'','\\\'')}',`;
                            change = true;
                        }
                    }
                    if (change) {
                        let primaryColumnData = '';
                        for (let column of primaryColumns) {
                            let info = columnInfos[column];
                            primaryColumnData += `${template.symbolLeft}${column}${template.symbolRight}=`;
                            if (row[global_constant.hiddenFieldPrefix + column] == null)
                                primaryColumnData += 'null and ';
                            else if (info.jsType == 'number')
                                primaryColumnData += `${row[global_constant.hiddenFieldPrefix + column]} and `
                            else primaryColumnData += `'${row[global_constant.hiddenFieldPrefix + column].replaceAll('\'','\\\'')}' and `
                            change = true;
                        }
                        primaryColumnData = primaryColumnData.substring(0, primaryColumnData.length - 5);
                        sql += `update ${template.symbolLeft}${tab.table}${template.symbolRight} set ${set.substring(0, set.length - 1)} where ${primaryColumnData};`
                    }
                } else if (row[global_constant.hiddenFieldState] == 'insert') {
                    let columns = '('
                    let values = 'values(';
                    for (let column in row) {
                        if (column.startsWith(global_constant.hiddenFieldPrefix)) continue;
                        columns += template.symbolLeft + column + template.symbolRight + ','
                        let info = columnInfos[column];
                        if (row[column] == null)
                            values += 'null,';
                        else if (info.jsType == 'number')
                            values += row[column] + ',';
                        else values += "'" + row[column].replaceAll('\'','\\\'') + "',";
                    }
                    columns = columns.substring(0, columns.length - 1) + ')';
                    values = values.substring(0, values.length - 1) + ')';
                    sql += `insert into ${template.symbolLeft}${tab.table}${template.symbolRight}${columns} ${values};`;
                } else if (row[global_constant.hiddenFieldState] == 'delete') {
                    let primaryColumnData = '';
                    for (let column of primaryColumns) {
                        let info = columnInfos[column];
                        primaryColumnData += `${template.symbolLeft}${column}${template.symbolRight}=`;
                        if (row[global_constant.hiddenFieldPrefix + column] == null)
                            primaryColumnData += 'null and ';
                        else if (info.jsType == 'number')
                            primaryColumnData += `${row[global_constant.hiddenFieldPrefix + column]} and `
                        else primaryColumnData += `'${row[global_constant.hiddenFieldPrefix + column].replaceAll('\'','\\\'')}' and `
                        change = true;
                    }
                    primaryColumnData = primaryColumnData.substring(0, primaryColumnData.length - 5);
                    sql += `delete from ${template.symbolLeft}${tab.table}${template.symbolRight} where ${primaryColumnData};`
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
                columns += template.symbolLeft + column + template.symbolRight + ','
                let info = columnInfos[column];
                if (row[column] == null)
                    values += 'null,';
                else if (info.jsType == 'number')
                    values += row[column] + ',';
                else values += "'" + row[column].replaceAll('\'','\\\'') + "',";
            }
            columns = columns.substring(0, columns.length - 1) + ')';
            values = values.substring(0, values.length - 1) + ')';
            return `insert into ${template.symbolLeft}${tab.table}${template.symbolRight}${columns} ${values};`;
        },
        onCopyAllRowInsert(table,data) {
            data.splice(0, 1);
            let sql = ''
            for (let row of data) {
                let values = 'values(';
                for (let column in row) {
                    if (row[column] == null)
                        values += 'null,';
                    else if (typeof (row[column]) == 'number')
                        values += row[column] + ',';
                    else values += "'" + row[column].replaceAll('\'','\\\'') + "',";
                }
                values = values.substring(0, values.length - 1) + ')';
                sql += `insert into ${template.symbolLeft}${table}${template.symbolRight} ${values};\n`;
            }
            if (sql.length)
                sql = sql.substring(0, sql.length - 1);
            return sql;
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
                    set += `${template.symbolLeft}${column}${template.symbolRight}=null,`;
                else if (info.jsType == 'number')
                    set += `${column}=${row[column]},`;
                else set += `${column}='${row[column].replaceAll('\'','\\\'')}',`;
            }
            let primaryColumnData = '';
            for (let column of primaryColumns) {
                let info = columnInfos[column];
                primaryColumnData += `${template.symbolLeft}${column}${template.symbolRight}=`;
                if (row[column] == null)
                    primaryColumnData += 'null and ';
                else if (info.jsType == 'number')
                    primaryColumnData += `${row[column]} and `
                else primaryColumnData += `'${row[column].replaceAll('\'','\\\'')}' and `
            }
            primaryColumnData = primaryColumnData.substring(0, primaryColumnData.length - 5);
            return `update ${template.symbolLeft}${tab.table}${template.symbolRight} set ${set.substring(0, set.length - 1)} where ${primaryColumnData};`
        }
    }

}