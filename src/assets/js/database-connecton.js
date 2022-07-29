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
            await r;
            dc.close();
        }
    },
    getConnectionString(connectionInfo) {
        return `Server=${connectionInfo.host};Port=${connectionInfo.port}${connectionInfo.database ? ';Database=' + connectionInfo.database : ''};Uid=${connectionInfo.user};Pwd=${connectionInfo.pwd};`
    },
}