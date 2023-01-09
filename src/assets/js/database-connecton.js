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
        return new DBWarp(databaseTemplate[type].alias, await native[databaseTemplate[type].alias].connection(this.getConnectionString({ ...info, database: dbName, type })));
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
        if (databaseTemplate[connectionInfo.type].alias == 'mysql') {
            return `Server=${connectionInfo.host};Port=${connectionInfo.port}${connectionInfo.database ? ';Database=' + connectionInfo.database : ''};Uid=${connectionInfo.user};Pwd=${connectionInfo.pwd};`
        } else if (databaseTemplate[connectionInfo.type].alias == 'sqlite') {
            return `Data Source=${connectionInfo.databaseFile};Version=3;`
        }
    },
    databaseList(dbc) {
        let dbType = databaseTemplate[dbc.dbType].alias;
        return this.use(dbc, async (db) => {
            let list = []
            if (dbType == 'mysql') {
                let dbs = await db.select('show databases');
                for (let obj of dbs) {
                    list.push({
                        name: obj.Database
                    })
                }
            } else if (dbType == 'sqlite') {
                let dbs = await db.select('PRAGMA database_list');
                for (let obj of dbs) {
                    list.push({
                        name: obj.name
                    })
                }
            }
            return list;
        })
    },
    dropDatabase(dbc, dbName) {
        return databaseConnecton.use(dbc, async (db) => {
            await db.execute('drop database `' + dbName + '`');
        });
    },
    dropTable(dbc, dbName, table) {
        return this.use(dbc, dbName, async (db) => {
            await db.execute('drop table ' + table);
        });
    },
    getTableList(dbc, dbName) {
        let dbType = databaseTemplate[dbc.dbType].alias;
        return this.use(dbc, dbName, async (dc) => {
            let array = [];
            if (dbType == 'mysql') {
                let tables = await dc.select('show tables');
                for (let obj of tables) {
                    for (let name in obj) {
                        array.push(obj[name]);
                        break;
                    }
                }
            } else if (dbType == 'sqlite') {
                let tables = await dc.select(`SELECT name FROM sqlite_master WHERE type='table'`);
                for (let obj of tables) {
                    array.push(obj.name);
                }
            }
            return array;
        })
    },
    async getTableInfo(dbc, dbName, tableName) {
        let dbType = databaseTemplate[dbc.dbType].alias;

        let table = await this.use(dbc, dbName, async (dc) => {
            if (dbType == 'mysql') {
                let info = (await dc.select(`select * from information_schema.TABLES where TABLE_SCHEMA='${dbName}' and TABLE_NAME='${tableName}'`))[0];
                let indexs = await dc.select(`SHOW INDEX FROM \`${dbName}\`.\`${tableName}\``)
                let foreign_keys = await dc.select(`select * from information_schema.REFERENTIAL_CONSTRAINTS where CONSTRAINT_SCHEMA='${dbName}' and TABLE_NAME='${tableName}'`);
                let foreign_key_columns = await dc.select(`select * from information_schema.KEY_COLUMN_USAGE where CONSTRAINT_SCHEMA='${dbName}' and TABLE_NAME='${tableName}'`)
                let triggers = await dc.select(`select * from information_schema.TRIGGERS where TRIGGER_SCHEMA='${dbName}' and EVENT_OBJECT_TABLE='${tableName}'`)
                return { name: info.TABLE_NAME, comment: info.TABLE_COMMENT, ENGINE: info.ENGINE, TABLE_COLLATION: info.TABLE_COLLATION, indexs, foreign_keys, foreign_key_columns, triggers }
            } else if (dbType == 'sqlite') {
                let indexs = await dc.select(`PRAGMA index_list(${tableName});`)
                for (let index of indexs) {
                    index.fields = (await dc.select(`PRAGMA index_info(${index.name});`)).map(e => e.name);
                }
                indexs.splice(indexs.findIndex(e => e.origin == 'pk'), 1);
                let triggers = await dc.select(`SELECT * FROM sqlite_master WHERE type='trigger' and tbl_name = '${tableName}'`)
                return { name: tableName, indexs, triggers }
            }
        })
        table.columns = await this.getTableColumns(dbc, dbName, tableName);
        return table;
    },
    getTableSQL(dbc, dbName, tableName) {
        let dbType = databaseTemplate[dbc.dbType].alias;
        return this.use(dbc, dbName, async (dc) => {
            if (dbType == 'mysql') {
                return (await dc.select('show create table ' + databaseTemplate[dbc.dbType].symbolLeft + tableName + databaseTemplate[dbc.dbType].symbolRight))[0]['Create Table'];
            } else if (dbType == 'sqlite') {
                return (await dc.select(`SELECT * FROM sqlite_master WHERE type='table' and name = "${tableName}"`))[0].sql;
            }
        })
    },
    renameTable(dbc, dbName, tableName, targetName) {
        let dbType = databaseTemplate[dbc.dbType].alias;
        return this.use(dbc, dbName, async (dc) => {
            if (dbType == 'mysql') {
                await dc.execute('RENAME TABLE `' + tableName + '` TO `' + targetName + '`');
            } else if (dbType == 'sqlite') {
                await dc.execute('ALTER TABLE `' + tableName + '`RENAME TO `' + targetName + '`');
            }
        })
    },
    async duplicateTable(dbc, dbName, tableName, targetName) {
        let dbType = databaseTemplate[dbc.dbType].alias;
        let tableSQL = await this.getTableSQL(dbc, dbName, tableName);
        return await this.use(dbc, dbName, (dc) => {
            if (dbType == 'mysql') {
                return dc.execute(tableSQL.replace('`' + tableName + '`', '`' + targetName + '`'));
            } else if (dbType == 'sqlite') {
                return dc.execute(tableSQL.replace('"' + tableName + '"', '"' + targetName + '"'));
            }
        });
    },
    getTableColumns(dbc, dbName, tableName) {
        let p = tableName.lastIndexOf('.');
        tableName = tableName.substring(0, p == -1 ? tableName.length : p);
        let dbType = databaseTemplate[dbc.dbType].alias;
        return this.use(dbc, async (dc) => {
            let columns = []
            if (dbType == 'mysql') {
                let tableCoumns = await dc.select(`select * from information_schema.COLUMNS where TABLE_SCHEMA = '${dbName}' and LOWER(TABLE_NAME) = LOWER('${tableName}')`);
                console.log(tableCoumns)
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
                                    length = values[0];
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
            } else if (dbType == 'sqlite') {
                let tableCoumns = await dc.select(`PRAGMA table_info('${tableName}');`);
                for (let row of tableCoumns) {
                    columns.push({
                        name: row.name,
                        type: row.type,
                        defaultValue: row.dflt_value,
                        isNullable: row.notnull == 0,
                        key: row.pk == 1
                    })
                }
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
        const tableAlias = databaseTemplate[dbc.dbType].symbolLeft + table + databaseTemplate[dbc.dbType].symbolRight;
        let sql = `select * from ${tableAlias} limit ${(page - 1) * size}, ${size}`;
        sqlCallback && sqlCallback(sql);
        return this.use(dbc, dbName, async (dc) => {
            return {
                data: await dc.select(sql),
                total: (await dc.select(`select count(*) count from ${tableAlias}`))[0].count
            }
        })
    },
    getTableData(dbc, dbName, table, sqlCallback) {
        const tableAlias = databaseTemplate[dbc.dbType].symbolLeft + table + databaseTemplate[dbc.dbType].symbolRight;
        let sql = `select * from ${tableAlias}`;
        sqlCallback && sqlCallback(sql);
        return this.use(dbc, dbName, async (dc) => {
            return await dc.selectAndColumns(sql)
        })
    }

}