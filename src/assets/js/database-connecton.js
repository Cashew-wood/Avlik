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
    getTableColumns(dbc, dbName, tableName) {
        return this.use(dbc, async (dc) => {
            let tableCoumns = await dc.select(`select * from information_schema.COLUMNS where TABLE_SCHEMA='${dbName}' and TABLE_NAME='${tableName}'`);
            let columns = []
            for (let row of tableCoumns) {
                let k = row.COLUMN_TYPE.indexOf('(');
                let value = k > -1 ? row.COLUMN_TYPE.substring(k + 1, row.COLUMN_TYPE.length - 1) : null;
                let len = null;
                if (databaseTemplate[dbc.dbType].dataType[row.DATA_TYPE].jsType == 'number') {
                    len = value;
                    value = null;
                }
                columns.push({
                    name: row.COLUMN_NAME,
                    type: row.DATA_TYPE,
                    len,
                    characterSet: row.CHARACTER_SET_NAME,
                    collation: row.CHARACTER_SET_NAME,
                    comment: row.COLUMN_COMMENT,
                    defaultValue: row.COLUMN_DEFAULT,
                    isNullable: row.IS_NULLABLE == 'YES',
                    key: row.COLUMN_KEY,
                    value
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
    getTableDataPage(dbc, dbName, table, page, size,sqlCallback) {
        let sql = `select * from ${table} limit ${(page - 1) * size},${size}`;
        sqlCallback && sqlCallback(sql);
        return this.use(dbc, dbName, async (dc) => {
            return {
                data: await dc.select(sql),
                total: (await dc.select(`select count(*) count from ${table}`))[0].count
            }
        })
    }

}