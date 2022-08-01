import databaseConnecton from "./database-connecton";
export default function (template) {
    return {
        metatable: [{
            name: 'fields',
            columns: [{ name: 'name', width: 150, type: 'text' },
            { name: 'data_type', width: 100, type: 'select', $items: Object.keys(template.dataType) },
            { name: 'length', width: 80, type: 'number' },
            { name: 'decimals', width: 80, type: 'number' },
            { name: 'not_null', width: 80, type: 'checkbox' },
            { name: 'key', width: 80, type: 'checkbox' },
            { name: 'comment', width: 200, type: 'text' },
            ],
            data: [],
            panel: {
                form: []
            },
            onChange: (tab, sub, row, column) => {
                if (row.$data_type && row.$data_type != row.data_type) {
                    row.value = null;
                    let old = Object.keys(template.dataType[row.$data_type]);
                    let types = Object.keys(template.dataType[row.data_type]);
                    for (let key of old) {
                        if (types.findIndex(e => e == key) == -1) {
                            delete row[key]
                        }
                    }
                }
                if (row.data_type) {
                    row.$data_type = row.data_type;
                    let form = []
                    let types = template.dataType[row.data_type];
                    if (types.jsType == 'select') {
                        form.push({
                            name: 'value', type: 'text', width: '60%', multiple: true, serialize: (action, value) => {
                                if (action == 'multiple') {
                                    let string = ''
                                    for (let s of value) {
                                        if (s != null)
                                            string += `'${s}',`
                                    }
                                    if (string.length) {
                                        string = string.substring(0, string.length - 1);
                                    }
                                    return string;
                                }
                            }, deserialization: (action, value) => {
                                let array = value.split(',');
                                for (let i in array) {
                                    array[i] = array[i].substring(1, array[i].length - 1);
                                }
                                return array;
                            }
                        });
                    }
                    for (let key in types) {
                        if (key == 'jsType') continue;
                        let w = '60%';
                        if (types[key] == 'number')
                            w = '120px';
                        let changeEvent = null;
                        let items = []
                        if (key == 'character') {
                            items = Object.keys(tab.characterList);
                            changeEvent = (tab, sub, column, value) => {
                                sub.panel.form[sub.panel.form.findIndex(e => e.name == 'collation')].$items = tab.characterList[value];
                            }
                        }
                        form.push({ name: key, type: types[key], width: w, $items: items, onChange: changeEvent });
                    }
                    sub.panel.form = form;
                }
            }
        }, {
            name: 'indexs',
            columns: [{ name: 'name', width: 150, type: 'text', },
            {
                name: 'fields', width: 250, type: 'select-multiple', $items: [], onChangeTab: (tab, sub, column) => {
                    column.$items = tab.subtabs[0].data.filter(e => e.name != null).map(e => e.name);
                }
            },
            { name: 'index_type', width: 120, type: 'select', $items: ['FULLTEXT', 'NORMAL', 'SPATIAL', 'UNIQUE'] },
            { name: 'index_method', width: 120, type: 'select', $items: ['BTREE', 'HASH'] },
            { name: 'key_block_size', width: 120, type: 'number' },
            { name: 'comment', width: 200, type: 'text' }],
            data: [],
        }, {
            name: 'foreign_keys',
            columns: [{ name: 'name', width: 100, type: 'text', },
            {
                name: 'fields', width: 250, type: 'select-multiple', $items: [], onChangeTab: (tab, sub, column) => {
                    column.$items = tab.subtabs[0].data.filter(e => e.name != null).map(e => e.name);
                }
            },
            {
                name: 'referenced_schema', width: 130, type: 'select', $items: [], onChangeTab: (tab, sub, column) => {
                    column.$items = tab.dbc.items.map(e => e.label)
                },
                onChange: async (tab, subtab, row, value) => {
                    subtab.columns[subtab.columns.findIndex(e => e.name == 'referenced_table')].$items = await databaseConnecton.getTableList(tab.dbc, tab.db)
                }
            },
            {
                name: 'referenced_table', width: 130, type: 'select', onChange: async (tab, subtab, row, value) => {
                    subtab.columns[subtab.columns.findIndex(e => e.name == 'referenced_fields')].$items = (await databaseConnecton.getTableColumns(tab.dbc,
                        row.referenced_schema, value)).map(e => e.name);
                }
            },
            { name: 'referenced_fields', width: 250, type: 'select-multiple' },
            { name: 'on_update', width: 100, type: 'select', $items: ['CASCADE', 'NO ACTION', 'RESTRICT', 'SET NULL'] },
            { name: 'on_delete', width: 100, type: 'select', $items: ['CASCADE', 'NO ACTION', 'RESTRICT', 'SET NULL'] }],
            data: [],
        }, {
            name: 'triggers',
            columns: [{ name: 'name', width: 100, type: 'text', },
            {
                name: 'type', width: 100, type: 'select', $items: ['AFTER', 'BEFORE']
            },
            {
                name: 'action', width: 100, type: 'select', $items: ['INSERT', 'UPDATE', 'DELETE']
            }],
            data: [],
            panel: {
                direction: 'top',
                full: 'true',
                form: [{
                    name: 'define', type: 'code',
                }]
            }
        }],
        onCreate: async (tab) => {
            tab.characterList = await databaseConnecton.loadCharacter(tab.dbc, tab.db.label)
            console.log(tab.characterList)
        },
        create(item) {
            let sql = 'create table `' + item.table + '`(';
            let priKeys = [];
            for (let row of item.subtabs[0].data) {
                if (row.name == null || row.data_type == null) continue;
                sql += '\n`' + row.name + '` ' + row.data_type;
                if (template.dataType[row.data_type].jsType == 'text' && row.length) {
                    sql += '(' + row.length + ')';
                } else if (row.length && template.dataType[row.data_type].jsType == 'number') {
                    sql += '(' + row.length;
                    if (row.decimals) {
                        sql += ',' + row.decimals;
                    }
                    sql += ')'
                }
                sql += ' ';
                if (row.value) {
                    sql += '(' + row.value + ') ';
                }
                if (row.character) {
                    sql += 'CHARACTER SET ' + row.character + ' ';
                }
                if (row.collation) {
                    sql += 'COLLATE ' + row.collation + ' ';
                }
                if (row.unsigned) {
                    sql += 'UNSIGNED '
                }
                if (row.not_null) {
                    sql += 'NOT ';
                }
                sql += 'NULL';
                if (row.default_value != null) {
                    sql += ` DEFAULT ${row.default_value}`;
                }
                if (row.auto_increment) {
                    sql += ' AUTO_INCREMENT'
                }
                if (row.update_current_timestamp) {
                    sql += ` ON UPDATE CURRENT_TIMESTAMP`
                }
                if (row.comment) {
                    sql += ` COMMENT '${row.comment}'`
                }
                sql += ','
                if (row.key) {
                    priKeys.push(row);
                }
            }
            if (priKeys.length) {
                sql += '\nPRIMARY KEY (';
                for (let row of priKeys) {
                    sql += '`' + row.name;
                    if (row.key_length) {
                        sql += '`(' + row.key_length + '),';
                    } else {
                        sql += '`,';
                    }
                }
                sql = sql.substring(0, sql.length - 1) + '),';
            }
            if (item.subtabs[1] && item.subtabs[1].data && item.subtabs[1].data.length) {
                for (let row of item.subtabs[1].data) {
                    if (row.name == null) continue;
                    sql += '\n';
                    if (row.index_type != 'NORMAL') {
                        sql += row.index_type + ' ';
                    }
                    sql += `INDEX \`${row.name}\`(`
                    for (let field of row.fields) {
                        sql += '`' + field + '`,'
                    }
                    if (row.fields.length > 0) {
                        sql = sql.substring(0, sql.length - 1);
                    }
                    sql += ')';
                    if (row.index_method) {
                        sql += ' USING ' + row.index_method;
                    }
                    if (row.comment) {
                        sql += ` COMMENT '${row.comment}'`;
                    }
                    sql += ',';
                }
            }
            if (item.subtabs[2] && item.subtabs[2].data && item.subtabs[2].data.length) {
                for (let row of item.subtabs[2].data) {
                    if (row.name == null) continue;
                    sql += `\nCONSTRAINT ${row.name} FOREIGN KEY (`
                    for (let field of row.fields) {
                        sql += '`' + field + '`,'
                    }
                    if (row.fields.length > 0) {
                        sql = sql.substring(0, sql.length - 1);
                    }
                    sql += ') REFERENCES `' + row.referenced_schema + '`.`' + row.referenced_table + '` (';
                    for (let field of row.referenced_fields) {
                        sql += '`' + field + '`,'
                    }
                    if (row.fields.length > 0) {
                        sql = sql.substring(0, sql.length - 1);
                    }
                    sql += ')';
                    if (row.on_update) {
                        sql += ` ON DELETE ${row.on_update}`;
                    }
                    if (row.on_delete) {
                        sql += ` ON UPDATE ${row.on_delete}`;
                    }
                    sql += ',';
                }
            }
            if (!sql.endsWith(')'))
                sql = sql.substring(0, sql.length - 1);
            sql += '\n)'
            if (item.comment) {
                sql += ` COMMENT = '${item.comment}'`;
            }
            sql += ';';
            for (let row of item.subtabs[3].data) {
                if (row.name == null) continue;
                sql += `\nCREATE TRIGGER ${row.name} BEFORE ${row.action} ON \`${item.table}\` FOR EACH ROW ${row.define || ''};`
            }
            return sql;
        }
    }
}