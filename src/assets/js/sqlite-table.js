import databaseConnecton from "./database-connecton";
import Utils from "./utils";
const utils = new Utils();
export default function (template) {
    return {
        Metatable: function () {
            return [{
                name: 'fields',
                columns: [{ name: 'name', width: 150, type: 'text' },
                { name: 'data_type', width: 100, type: 'select', $items: Object.keys(template.dataType) },
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
                { name: 'unique', width: 80, type: 'checkbox' },
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
                    name: 'referenced_table', width: 130, type: 'select', onChangeTab: (tab, sub, column) => {
                        column.$items = tab.db.items[0].items.map(e => e.label)
                    }, onChange: async (tab, subtab, row, value) => {
                        subtab.columns[subtab.columns.findIndex(e => e.name == 'referenced_fields')].$items = (await databaseConnecton.getTableColumns(tab.dbc, tab.db.label, value)).map(e => e.name)
                    }
                },
                { name: 'referenced_fields', width: 250, type: 'select-multiple' },
                { name: 'on_update', width: 100, type: 'select', $items: ['CASCADE', 'NO ACTION', 'RESTRICT', 'SET NULL', 'SET DEFAULT'] },
                { name: 'on_delete', width: 100, type: 'select', $items: ['CASCADE', 'NO ACTION', 'RESTRICT', 'SET NULL', 'SET DEFAULT'] },
                { name: 'deferred', width: 80, type: 'checkbox' }],
                data: [],
            }, {
                name: 'triggers',
                columns: [{ name: 'name', width: 100, type: 'text', },
                {
                    name: 'type', width: 100, type: 'select', $items: ['AFTER', 'BEFORE']
                },
                {
                    name: 'action', width: 100, type: 'select', $items: ['INSERT', 'UPDATE', 'DELETE']
                },
                {
                    name: 'update_of_fields', width: 250, type: 'select-multiple', onChangeTab: (tab, sub, column) => {
                        column.$items = tab.subtabs[0].data.filter(e => e.name != null).map(e => e.name);
                    }
                },
                {
                    name: 'for_each', width: 80, type: 'checkbox'
                }],
                data: [],
                panel: {
                    direction: 'top',
                    full: 'true',
                    form: [{
                        name: 'define', type: 'code',
                    }]
                },
                onChange: (tab, sub, row, column) => {
                    if (!row.define) {
                        row.define = 'BEGIN\n\nEND'
                    }
                }
            }]
        },
        onCreate: async (tab) => {
            if (tab.design) {
                let table = await databaseConnecton.getTableInfo(tab.dbc, tab.db.label, tab.table);
                tab.subtabs[0].data = [];
                for (let column of table.columns) {
                    tab.subtabs[0].data.push({
                        name: column.name, data_type: column.type, not_null: !column.isNullable,
                        key: column.key, default_value: column.defaultValue
                    })
                }
                tab.subtabs[1].data = [];
                for (let index of table.indexs) {
                    tab.subtabs[1].data.push({
                        name: index.name,
                        fields: index.fields,
                        unique: index.unique == 1
                    })
                }
                let tableSQL = (await databaseConnecton.getTableSQL(tab.dbc, tab.db.label, tab.table)).replaceAll('\n', ' ').replaceAll('\r', '');
                tab.subtabs[2].data = [];
                let odItems = tab.subtabs[2].columns[tab.subtabs[2].columns.findIndex(e => e.name == 'on_delete')].$items;
                let ouItems = tab.subtabs[2].columns[tab.subtabs[2].columns.findIndex(e => e.name == 'on_update')].$items;
                let regex = new RegExp(`CONSTRAINT\\s+["'\`]?(\\w+)["'\`]?\\s+FOREIGN\\s+KEY\\s*\\((.+?)\\)\\s+REFERENCES\\s+["'\`]?(\\w+)["'\`]?\\s*\\((.+?)\\)(\\s+ON\\s+DELETE\\s+(${odItems.join('|')}))?(\\s+ON\\s+UPDATE\\s+(${ouItems.join('|')}))?(\\s+DEFERRABLE\\s+INITIALLY\\s+DEFERRED)?(\\s+)?[,)]`, 'ig');
                let match = null;
                while ((match = regex.exec(tableSQL)) != null) {
                    tab.subtabs[2].data.push({
                        name: match[1],
                        fields: match[2].split(',').map(e => { e = e.trim(); return e.substring(1, e.length - 1) }),
                        referenced_table: match[3],
                        referenced_fields: match[4].split(',').map(e => { e = e.trim(); return e.substring(1, e.length - 1) }),
                        on_update: match[6].toUpperCase(),
                        on_delete: match[8].toUpperCase(),
                        deferred: match[9] ? true : false
                    })
                }
                tab.subtabs[3].data = [];
                for (let trigger of table.triggers) {
                    let sql = trigger.sql.replaceAll('\n', ' ').replaceAll('\r', '');
                    let match = /CREATE\s+TRIGGER\s+["'`]?\w+["'`]?\s+(BEFORE|AFTER)\s+(INSERT|UPDATE|DELETE)\s+(OF\s+.+?\s+)?ON\s+["'`]?\w+["'`]?\s+(FOR\s+EACH\s+ROW\s+)?(BEGIN.*?END)/ig
                        .exec(sql);
                    if (match == null) continue;
                    tab.subtabs[3].data.push({
                        name: trigger.name,
                        type: match[1].toUpperCase(),
                        action: match[2].toUpperCase(),
                        define: match[5].toUpperCase()
                    })
                }

            }
        },
        $columnSQL(row) {
            if(!row.data_type)return "";
            let sql = '`' + row.name + '` ' + row.data_type;
            sql += ' ';
            if (row.not_null) {
                sql += 'NOT ';
            }
            sql += 'NULL';
            if (row.default_value) {
                sql += ` DEFAULT ${row.default_value}`;
            }
            return sql;
        },
        $indexSQL(table, row) {
            let sql = `CREATE${row.unique ? ' UNIQUE' : ''} INDEX "main"."${row.name}" ON "${table}"(`
            for (let field of row.fields) {
                sql += '"' + field + '",'
            }
            if (row.fields.length > 0) {
                sql = sql.substring(0, sql.length - 1);
            }
            sql += ');';
            return sql;
        },
        $foreignKeySQL(row) {
            let sql = `CONSTRAINT ${row.name} FOREIGN KEY (`
            for (let field of row.fields) {
                sql += '"' + field + '",'
            }
            if (row.fields.length > 0) {
                sql = sql.substring(0, sql.length - 1);
            }
            sql += ') REFERENCES "' + row.referenced_table + '" (';
            for (let field of row.referenced_fields) {
                sql += '"' + field + '",'
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
            if (row.deferred) {
                sql += ' DEFERRABLE INITIALLY DEFERRED';
            }
            return sql;
        },
        $triggerSQL(table, data) {
            let sql = '';
            for (let row of data) {
                if (row.name == null) continue;
                let ofFileds = '';
                if (row.action == 'UPDATE' && row.update_of_fields && row.update_of_fields.length) {
                    ofFileds = ' OF' + row.update_of_fields.map(e => `"${e}"`).join(',');
                }
                sql += `CREATE TRIGGER "main"."${row.name}" ${row.type} ${row.action}${ofFileds}  ON \`${table}\`${row.for_each ? ' FOR EACH ROW' : ''} ${row.define || ''};\n`
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
            if (item.subtabs[1] && item.subtabs[1].data && item.subtabs[1].data.length) {
                for (let row of item.subtabs[1].data) {
                    if (row.name == null) continue;
                    sql += '\n' + this.$indexSQL(item.table, row);
                }
            }
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
        async update(tab) {
            let tempTable = `${tab.table}_${utils.randomString(8)}`;

            let sql = '';
            let indexs = await databaseConnecton.use(tab.dbc, tab.db.label, (dc) => {
                return dc.select(`PRAGMA index_list(${tab.table});`);
            })
            indexs.splice(indexs.findIndex(e => e.origin == 'pk'), 1);
            for (let row of indexs) {
                sql += 'DROP INDEX "main"."' + row.name + '";\n';
            }
            sql += `ALTER TABLE "${tab.table}" RENAME TO "${tempTable}";\n`;
            sql += this.create(tab)
            let columns = tab.subtabs[0].data.map(e => `"${e.name}"`).join(',');
            sql += `INSERT INTO "main"."${tab.table}" (${columns}) SELECT ${columns} FROM "main"."${tempTable}";\n`
            sql += 'drop table "' + tempTable + '";';
            return sql;
        }
    }
}