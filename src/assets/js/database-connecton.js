import databaseTemplate from "./database-template";
const DBWarp = function (db, id) {
    return new Proxy({}, {
        get: (target, field) => {
            if (!native[db][field]) return null;
            return function () {
                let args = [id]
                for (let v of arguments) {
                    args.push(v)
                }
                return native[db][field].apply(null, args);
            }
        }
    })
}
export default {
    async getConnection(type, info, dbName) {
        return new DBWarp(databaseTemplate[type].alias, await native[databaseTemplate[type].alias].connection(this.getConnectionString({ ...info, database: dbName })));
    },
    async use(dbc, dbName, body) {
        if (!body) {
            body = dbName;
            dbName = null;
        }
        let dc = await this.getConnection(dbc.dbType, dbc.info, dbName);
        let r = body(dc)
        if (r && r.then) {
            let result = await r;
            dc.close();
            return result;
        }
    },
    getConnectionString(connectionInfo) {
        return `Server=${connectionInfo.host};Port=${connectionInfo.port}${connectionInfo.database ? ';Database=' + connectionInfo.database : ''};Uid=${connectionInfo.user};Pwd=${connectionInfo.pwd};`
    },
    databaseList(dbc) {
       return this.use(dbc, async (db) => {
            let dbs = await db.select('show databases');
            let list = []
            for (let obj of dbs) {
                list.push({
                    name: obj.Database
                })
            }
            return list;
        })
    },
    dropTable(dbc, dbName, table) {
        return this.use(dbc, dbName, async (db) => {
            await db.execute('drop table ' + table);
        });
    },
    getTableList(dbc, dbName) {
        return this.use(dbc, dbName, async (dc) => {
            let tables = await dc.select('show tables');
            let array = [];
            for (let obj of tables) {
                for (let name in obj) {
                    array.push(obj[name]);
                    break;
                }
            }
            return array;
        })
    },
    async getTableInfo(dbc, dbName, tableName) {
        let table = await this.use(dbc, dbName, async (dc) => {
            let info = (await dc.select(`select * from information_schema.TABLES where TABLE_SCHEMA='${dbName}' and TABLE_NAME='${tableName}'`))[0];
            let indexs = await dc.select(`SHOW INDEX FROM \`${dbName}\`.\`${tableName}\``)
            let foreign_keys = await dc.select(`select * from information_schema.REFERENTIAL_CONSTRAINTS where CONSTRAINT_SCHEMA='${dbName}' and TABLE_NAME='${tableName}'`);
            let foreign_key_columns = await dc.select(`select * from information_schema.KEY_COLUMN_USAGE where CONSTRAINT_SCHEMA='${dbName}' and TABLE_NAME='${tableName}'`)
            let triggers = await dc.select(`select * from information_schema.TRIGGERS where TRIGGER_SCHEMA='${dbName}' and EVENT_OBJECT_TABLE='${tableName}'`)
            return { name: info.TABLE_NAME, comment: info.TABLE_COMMENT, ENGINE: info.ENGINE, TABLE_COLLATION: info.TABLE_COLLATION, indexs, foreign_keys, foreign_key_columns, triggers }
        })
        table.columns = await this.getTableColumns(dbc, dbName, tableName);
        return table;
    },
    getTableSQL(dbc, dbName, tableName) {
        return this.use(dbc, dbName, async (dc) => {
            return (await dc.select('show create table `' + tableName + '`'))[0]['Create Table'];
        })
    },
    renameTable(dbc, dbName, tableName, targetName) {
        return this.use(dbc, dbName, async (dc) => {
            await dc.execute('RENAME TABLE `' + tableName + '` TO `' + targetName + '`');
        })
    },
    async duplicateTable(dbc, dbName, tableName, targetName) {
        let tableSQL = await this.getTableSQL(dbc, dbName, tableName);
        return await this.use(dbc, dbName, (dc) => {
            return dc.execute(tableSQL.replace('`' + tableName + '`', '`' + targetName + '`'));
        });
    },
    getTableColumns(dbc, dbName, tableName) {
        return this.use(dbc, async (dc) => {
            let tableCoumns = await dc.select(`select * from information_schema.COLUMNS where TABLE_SCHEMA = '${dbName}' and TABLE_NAME = '${tableName}'`);
            let columns = []
            for (let row of tableCoumns) {
                let k = row.COLUMN_TYPE.indexOf('(');
                let value = k > -1 ? row.COLUMN_TYPE.substring(k + 1, row.COLUMN_TYPE.lastIndexOf(')')) : null;
                let length = null;
                let decimals = null;
                let unsigned = false;
                let jsType = databaseTemplate[dbc.dbType].dataType[row.DATA_TYPE].jsType;
                if (value) {
                    if (jsType == 'number') {
                        if (row.COLUMN_TYPE.endsWith('unsigned')) {
                            unsigned = true;
                        } else {
                            let values = value.split(',');
                            if (values.length > 1) {
                                length = values[1];
                                decimals = values[1];
                            } else {
                                length = value;
                            }
                        }
                        value = null;
                    } else if (jsType == 'text') {
                        length = value;
                        value = null;
                    }
                }
                columns.push({
                    name: row.COLUMN_NAME,
                    type: row.DATA_TYPE,
                    length,
                    decimals,
                    characterSet: row.CHARACTER_SET_NAME,
                    collation: row.COLLATION_NAME,
                    comment: row.COLUMN_COMMENT,
                    defaultValue: row.COLUMN_DEFAULT,
                    isNullable: row.IS_NULLABLE == 'YES',
                    key: row.COLUMN_KEY == 'PRI',
                    unsigned,
                    value,
                    EXTRA: row.EXTRA
                })
            }
            return columns
        });
    },
    loadCharacter(dbc, dbName) {
        return this.use(dbc, dbName, async (dc) => {
            let data = await dc.select('select * from information_schema.COLLATION_CHARACTER_SET_APPLICABILITY')
            let characterList = {};
            for (let row of data) {
                if (characterList[row.CHARACTER_SET_NAME]) {
                    characterList[row.CHARACTER_SET_NAME].push(row.COLLATION_NAME)
                } else {
                    characterList[row.CHARACTER_SET_NAME] = [];
                }
            }
            return characterList;
        })
    },
    getTableDataPage(dbc, dbName, table, page, size, sqlCallback) {
        let sql = `select * from ${table} limit ${(page - 1) * size}, ${size}`;
        sqlCallback && sqlCallback(sql);
        return this.use(dbc, dbName, async (dc) => {
            return {
                data: await dc.select(sql),
                total: (await dc.select(`select count(*) count from ${table}`))[0].count
            }
        })
    }

}