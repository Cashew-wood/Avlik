import databaseConnecton from "./database-connecton";
export default function (template) {
    return {
        Metatable: function () {
            return [{
                name: 'fields',
                columns: [{ name: 'name', width: 150, type: 'text' },
                { name: 'data_type', width: 100, type: 'select', $items: Object.keys(template.dataType) },
                { name: 'length', width: 80, type: 'number' },
                { name: 'decimals', width: 80, type: 'number' },
                { name: 'not_null', width: 80, type: 'checkbox' },
                { name: 'key', width: 80, type: 'checkbox' },
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
                    if (!row.data_type) return;
                    if (row.$form && row.$data_type == row.data_type) {
                        sub.panel.form = row.$form;
                        return;
                    }
                    let form = []
                    let types = template.dataType[row.data_type];
                 
                    for (let key in types) {
                        if (key == 'jsType') continue;
                        let w = '60%';
                        if (types[key] == 'number')
                            w = '120px';
                        form.push({ name: key, type: types[key], width: w });
                    }
                    row.$form = form;
                    row.$data_type = row.data_type;
                    sub.panel.form = row.$form;
                }
            }, {
                name: 'indexs',
                columns: [{ name: 'name', width: 150, type: 'text', },
                {
                    name: 'fields', width: 250, type: 'select-multiple', $items: [], onChangeTab: (tab, sub, column) => {
                        column.$items = tab.subtabs[0].data.filter(e => e.name != null).map(e => e.name);
                    }
                },
                { name: 'unique', width: 80, type: 'checkbox'},
               ],
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
                        subtab.columns[subtab.columns.findIndex(e => e.name == 'referenced_table')].$items = await databaseConnecton.getTableList(tab.dbc, tab.db.label)
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
            }]
        },
        onCreate: async (tab) => {
            tab.characterList = await databaseConnecton.loadCharacter(tab.dbc, tab.db.label)
            if (tab.design) {
                let table = await databaseConnecton.getTableInfo(tab.dbc, tab.db.label, tab.table);
                let tableSQL = (await databaseConnecton.getTableSQL(tab.dbc, tab.db.label, tab.table)).split('\n');
                tab.comment = table.comment;
                tab.subtabs[0].data = [];
                for (let column of table.columns) {
                    let pri = table.indexs[table.indexs.findIndex(e => e.Column_name == column.name && e.Key_name == 'PRIMARY')];
                    let columnSQL = tableSQL[tableSQL.findIndex(e => e.trim().startsWith('`' + column.name + '`'))]
                    let defaultValueIndex = columnSQL.indexOf(' DEFAULT ');
                    let defaultValue = null;
                    if (defaultValueIndex > -1) {
                        let end;
                        for (let i = defaultValueIndex + 9; i < columnSQL.length; i++) {
                            if (columnSQL[i] == ' ' || columnSQL[i] == ',') {
                                end = i;
                                break;
                            }
                        }
                        defaultValue = columnSQL.substring(defaultValueIndex + 9, end);
                    }
                    tab.subtabs[0].data.push({
                        name: column.name, data_type: column.type, length: column.length, decimals: column.decimals, not_null: !column.isNullable,
                        key: column.key, comment: column.comment,
                        default_value: defaultValue, unsigned: column.unsigned, value: column.value,
                        auto_increment: column.EXTRA.indexOf('auto_increment') > -1, update_current_timestamp: column.EXTRA.indexOf('CURRENT_TIMESTAMP') > -1,
                        key_length: pri && pri.Sub_part, character: column.characterSet, collation: column.collation
                    })
                }
                let indexGroup = {};
                for (let index of table.indexs) {
                    if (index.Key_name == 'PRIMARY') continue;
                    let ig = indexGroup[index.Key_name];
                    if (!ig) {
                        ig = { fields: [], type: index.Index_type, comment: index.Index_comment, Non_unique: index.Non_unique };
                        indexGroup[index.Key_name] = ig;
                    }
                    ig.fields.push(index.Column_name)
                }
                let method = ['BTREE', 'HASH']
                tab.subtabs[1].data = [];
                for (let name in indexGroup) {
                    let index = indexGroup[name];
                    let index_method = null;
                    let index_type = null;
                    if (method.indexOf(index.type) > -1) {
                        index_method = index.type;
                        index_type = index.Non_unique == 0 ? 'UNIQUE' : 'NORMAL';
                    } else {
                        index_method = null;
                        index_type = index.type;
                    }
                    tab.subtabs[1].data.push({
                        name: name,
                        fields: index.fields,
                        index_method,
                        comment: index.comment,
                        index_type
                    })
                }
                tab.subtabs[2].data = [];
                for (let fk of table.foreign_keys) {
                    let columns = table.foreign_key_columns.filter(e => e.CONSTRAINT_NAME == fk.CONSTRAINT_NAME);
                    tab.subtabs[2].data.push({
                        name: fk.CONSTRAINT_NAME,
                        fields: columns.map(e => e.COLUMN_NAME),
                        referenced_schema: fk.UNIQUE_CONSTRAINT_SCHEMA,
                        referenced_table: fk.REFERENCED_TABLE_NAME,
                        referenced_fields: columns.map(e => e.REFERENCED_COLUMN_NAME),
                        on_update: fk.UPDATE_RULE,
                        on_delete: fk.DELETE_RULE
                    })
                }
                tab.subtabs[3].data = [];
                for (let trigger of table.triggers) {
                    tab.subtabs[3].data.push({
                        name: trigger.TRIGGER_NAME,
                        type: trigger.ACTION_TIMING,
                        action: trigger.EVENT_MANIPULATION,
                        define: trigger.ACTION_STATEMENT
                    })
                }
                tab.$tableInfo = { comment: tab.comment, datas: JSON.parse(JSON.stringify([tab.subtabs[0].data, tab.subtabs[1].data, tab.subtabs[2].data, tab.subtabs[3].data])) };
            }
        },
        $columnSQL(row) {
            let sql = '`' + row.name + '` ' + row.data_type;
            if (template.dataType[row.data_type].jsType == 'text' && row.length) {
                sql += '(' + row.length + ')';
            } else if (row.length && template.dataType[row.data_type].jsType == 'number') {
                sql += '(' + row.length;
                if (row.decimals) {
                    sql += ',' + row.decimals;
                }
                sql += ')'
            }
            if (row.value) {
                sql += '(' + row.value + ')';
            }
            sql += ' ';
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
            if (row.default_value) {
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
            return sql;
        },
        $indexSQL(row) {
            let sql = '';
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
            if (row.index_method && row.index_type != 'FULLTEXT') {
                sql += ' USING ' + row.index_method;
            }
            if (row.comment) {
                sql += ` COMMENT '${row.comment}'`;
            }
            return sql;
        },
        $foreignKeySQL(row) {
            let sql = `CONSTRAINT ${row.name} FOREIGN KEY (`
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
            return sql;
        },
        $triggerSQL(table, data) {
            let sql = '';
            for (let row of data) {
                if (row.name == null) continue;
                sql += `CREATE TRIGGER ${row.name} BEFORE ${row.action} ON \`${table}\` FOR EACH ROW ${row.define || ''};\n`
            }
            return sql;
        },
        create(item) {
            let sql = 'create table `' + item.table + '`(';
            let priKeys = [];
            for (let row of item.subtabs[0].data) {
                if (row.name == null || row.data_type == null) continue;
                sql += '\n'
                sql += this.$columnSQL(row);
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
                    sql += this.$indexSQL(row);
                    sql += ',';
                }
            }
            if (item.subtabs[2] && item.subtabs[2].data && item.subtabs[2].data.length) {
                for (let row of item.subtabs[2].data) {
                    if (row.name == null) continue;
                    sql += '\n'
                    sql += this.$foreignKeySQL(row);
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
            sql += '\n' + this.$triggerSQL(item.table, item.subtabs[3].data);
            return sql;
        },
        $objectEquls(source, target) {
            let t = typeof source;
            if (source == target) return true;
            else if (t == typeof target) {
                if (t == 'function') return false;
                else if (t == 'object') {
                    for (let f in source) {
                        if (source[f] != target[f] && !this.$objectEquls(source[f], target[f])) return false;
                    }
                    return true;
                } else {
                    return false;
                }
            } else return false;
        },
        update(tab) {
            let sql = 'ALTER TABLE `' + tab.table + '` \n';
            let len = sql.length;
            let foreign_keys = [];
            for (let row of tab.subtabs[2].data) {
                let old = tab.$tableInfo.datas[2][tab.$tableInfo.datas[2].findIndex(e => e.name == row.name)];
                if (!old) {
                    foreign_keys.push(row);
                } else if (!this.$objectEquls(row, old)) {
                    sql += 'DROP FOREIGN KEY `' + row.name + '`,\n';
                    foreign_keys.push(row);
                }
            }
            for (let row of tab.$tableInfo.datas[2]) {
                let isDrop = tab.subtabs[2].data.findIndex(e => e.name == row.name) == -1;
                if (isDrop) {
                    sql += 'DROP FOREIGN KEY `' + row.name + '`,\n';
                }
            }
            if (len != sql.length) {
                sql = sql.substring(0, sql.length - 2) + ';';
            } else {
                sql = ''
            }
            sql += 'ALTER TABLE `' + tab.table + '` \n';
            len = sql.length;
            let last = null;
            let priKeys = []
            for (let row of tab.subtabs[0].data) {
                let old = tab.$tableInfo.datas[0][tab.$tableInfo.datas[0].findIndex(e => e.name == row.name)];
                if (old) {
                    let diff = false
                    for (let field in old) {
                        if (old[field] != row[field]) {
                            diff = true;
                            break
                        }
                    }
                    if (diff) {
                        sql += `MODIFY COLUMN ${this.$columnSQL(row)} ${last ? 'AFTER ' + last.name : 'FIRST'},\n`
                    }
                    if (!old.key && row.key) {
                        priKeys.push(row);
                    }
                } else {
                    sql += `ADD COLUMN ${this.$columnSQL(row)} ${last ? 'AFTER ' + last.name : 'FIRST'},\n`
                    if (row.key) {
                        priKeys.push(row);
                    }
                }
                last = row;
            }
            for (let row of tab.$tableInfo.datas[0]) {
                let isDrop = tab.subtabs[0].data.findIndex(e => e.name == row.name) == -1;
                if (isDrop) {
                    sql += `DROP COLUMN \`${row.name}\`,\n`
                    if (row.key) {
                        sql += `DROP PRIMARY KEY,\n`
                    }
                }
            }
            if (priKeys.length > 0) {
                sql += 'ADD PRIMARY KEY ('
                for (let row of priKeys) {
                    sql += '`' + row.name;
                    if (row.key_length) {
                        sql += '`(' + row.key_length + '),';
                    } else {
                        sql += '`,';
                    }
                }
                sql = sql.substring(0, sql.length - 1) + ') USING BTREE,\n';
            }
            let indexs = [];
            for (let row of tab.subtabs[1].data) {
                let old = tab.$tableInfo.datas[1][tab.$tableInfo.datas[1].findIndex(e => e.name == row.name)];
                if (!old) {
                    indexs.push(row);
                } else if (!this.$objectEquls(row, old)) {
                    sql += 'DROP INDEX `' + row.name + '`,\n';
                    indexs.push(row);
                }
            }
            for (let row of tab.$tableInfo.datas[1]) {
                let isDrop = tab.subtabs[1].data.findIndex(e => e.name == row.name) == -1;
                if (isDrop) {
                    sql += 'DROP INDEX `' + row.name + '`,\n';
                }
            }
            for (let row of indexs) {
                sql += 'ADD ' + this.$indexSQL(row) + ',\n';
            }
            for (let row of foreign_keys) {
                sql += 'ADD ' + this.$foreignKeySQL(row) + ',\n';
            }
            if (tab.comment != tab.$tableInfo.comment) {
                sql += `COMMENT = '${tab.comment}',\n`
            }
            if (len != sql.length) {
                sql = sql.substring(0, sql.length - 2) + ';\n';
            } else {
                sql = ''
            }
            let triggers = [];
            for (let row of tab.subtabs[3].data) {
                let old = tab.$tableInfo.datas[3][tab.$tableInfo.datas[3].findIndex(e => e.name == row.name)];
                if (!old) {
                    triggers.push(row);
                } else if (!this.$objectEquls(row, old)) {
                    sql += 'DROP TRIGGER `' + row.name + '`;\n';
                    triggers.push(row);
                }
            }
            for (let row of tab.$tableInfo.datas[3]) {
                let isDrop = tab.subtabs[3].data.findIndex(e => e.name == row.name) == -1;
                if (isDrop) {
                    sql += 'DROP TRIGGER `' + row.name + '`;\n';
                }
            }
            sql += this.$triggerSQL(tab.table, triggers);
            return sql;
        }
    }
}