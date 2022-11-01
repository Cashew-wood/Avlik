import MysqlTable from "./mysql-table";
import DBTemplateCommon from "./db-template-common";
import global_constant from "./global_constant";
import SqliteTable from "./sqlite-table";
const mysqlTemplate = {
    name: 'MySQL',
    icon: 'icon-mysql',
    alias: 'mysql',
    editor:'text/x-mysql',
    symbolLeft:'`',
    symbolRight:'`',
    data: {
        name: {
            _name: '${connection_name}',
        },
        host: {
            _name: '${host}',
            value: 'localhost'
        },
        port: {
            _name: '${port}',
            value: '3306',
            type: 'number'
        },
        user: {
            _name: '${user_name}',
            value: 'root'
        },
        pwd: {
            _name: '${password}',
            type: 'password'
        }
    },
    dropDB: true,
    dataValidate: {
        name: [],
        host: [],
        port: [],
        user: [],
        pwd: [],
    },
    dataType: {
        binary: {
            default_value: 'text',
        },
        blob: {
        },
        longblob: {
        },
        mediumblob: {
        },
        tinyblob: {
        },
        bigint: {
            jsType: 'number',
            default_value: 'text',
            auto_increment: 'checkbox',
            unsigned: 'checkbox'
        },
        bit: {
            jsType: 'number',
            default_value: 'text',
        },
        char: {
            jsType: 'text',
            default_value: 'text',
            character: 'select',
            collation: 'select',
            key_length: 'number'
        },
        date: {
            jsType: 'date',
            default_value: 'text',
        },
        datetime: {
            jsType: 'datetime',
            default_value: 'text',
            update_current_timestamp: 'checkbox'
        },
        decimal: {
            jsType: 'number',
            default_value: 'text',
            unsigned: 'checkbox'
        },
        double: {
            jsType: 'number',
            default_value: 'text',
            auto_increment: 'checkbox',
            unsigned: 'checkbox'
        },
        float: {
            jsType: 'number',
            default_value: 'text',
            auto_increment: 'checkbox',
            unsigned: 'checkbox'
        },
        mediumint: {
            jsType: 'number',
            default_value: 'text',
            auto_increment: 'checkbox',
            unsigned: 'checkbox'
        },
        smallint: {
            jsType: 'number',
            default_value: 'text',
            auto_increment: 'checkbox',
            unsigned: 'checkbox'
        },
        tinyint: {
            jsType: 'number',
            default_value: 'text',
            auto_increment: 'checkbox',
            unsigned: 'checkbox'
        },
        geometry: {
            jsType: 'text',
        },
        geometrycollection: {
            jsType: 'text',
        },
        int: {
            jsType: 'number',
            default_value: 'text',
            auto_increment: 'checkbox',
            unsigned: 'checkbox'
        },
        integer: {
            jsType: 'number',
            default_value: 'text',
            auto_increment: 'checkbox',
            unsigned: 'checkbox'
        },
        linestring: {
            jsType: 'text',
        },
        longtext: {
            jsType: 'text',
            character: 'select',
            collation: 'select',
        },
        mediumtext: {
            jsType: 'text',
            character: 'select',
            collation: 'select',
            key_length: 'number'
        },
        multilinestring: {
            jsType: 'text',
        },
        multipoint: {
            jsType: 'text',
        },
        multipolygon: {
            jsType: 'text',
        },
        point: {
            jsType: 'text',
        },
        polygon: {
            jsType: 'text',
        },
        enum: {
            jsType: 'select',
            default_value: 'text',
            character: 'select',
            collation: 'select',
        },
        set: {
            jsType: 'select',
            default_value: 'text',
            character: 'select',
            collation: 'select',
        },
        text: {
            jsType: 'text',
            character: 'select',
            collation: 'select',
            key_length: 'number'
        },
        tinytext: {
            jsType: 'text',
            character: 'select',
            collation: 'select',
            key_length: 'number'
        },
        varbinary: {
            jsType: 'text',
            key_length: 'number'
        },
        varchar: {
            jsType: 'text',
            default_value: 'text',
            character: 'select',
            collation: 'select',
            key_length: 'number'
        },
        time: {
            jsType: 'time',
            default_value: 'text'
        },
        timestamp: {
            jsType: 'timestamp',
            default_value: 'text',
            update_current_timestamp: 'checkbox'
        },
        year: {
            jsType: 'number',
            default_value: 'text'
        }
    },
    dbItems: ['tables'],
    isQuery(sql) {
        let p = sql.indexOf(' ');
        if (p > -1) {
            let one = sql.substring(0, p);
            if (one.toLowerCase() == 'select' || one.toLowerCase() == 'show') {
                return true;
            }
        }
        return false;
    },
    isQueryReadOnly(sql) {
        let match = /^select\s+\*\s+from\s+`?(\w+)`?.*$/i.exec(sql)
        if (match && match.length) {
            return match[1];
        }
        return null;
    }
}
mysqlTemplate.table = new MysqlTable(mysqlTemplate);
Object.assign(mysqlTemplate, new DBTemplateCommon(mysqlTemplate))
const sqliteTemplate = {
    name: 'SQLite',
    icon: 'icon-sqlite',
    alias: 'sqlite',
    editor:'text/x-sqlite',
    symbolLeft:'[',
    symbolRight:']',
    data: {
        name: {
            _name: '${connection_name}',
        },
        databaseFile: {
            _name: '${database_file}',
            value: '',
            type: 'file'
        }
    },
    dropDB: false,
    dataValidate: {
        name: [],
        databaseFile: []
    },
    dataType: {
        INTEGER: {
            jsType: 'number',
            default_value: 'text'
        },
        REAL: {
            jsType: 'number',
            default_value: 'text'
        },
        TEXT: {
            jsType: 'text',
            default_value: 'text'
        },
        BLOB: {
            jsType: 'text',
            default_value: 'text'
        }
    },
    dbItems: ['tables'],
    isQuery(sql) {
        let p = sql.indexOf(' ');
        if (p > -1) {
            let one = sql.substring(0, p);
            if (one.toLowerCase() == 'select' || one.toLowerCase() == 'pragma') {
                return true;
            }
        }
        return false;
    },
    isQueryReadOnly(sql) {
        let match = /^select\s+\*\s+from\s+["'`]?(\w+)["'`]?.*$/i.exec(sql)
        if (match && match.length) {
            return match[1];
        }
        return null;
    }
}
sqliteTemplate.table = new SqliteTable(sqliteTemplate);
Object.assign(sqliteTemplate, new DBTemplateCommon(sqliteTemplate))
const templates = [mysqlTemplate, sqliteTemplate]
for (let template of templates) {
    for (let key in template.dataValidate) {
        template.dataValidate[key] = [validate(template)];
    }
}
function validate(template) {
    return {
        trigger: 'blur', validator: (rule, value, callback) => {
            if (!value) {
                callback(new Error(template.data[rule.field].name + ' ' + global_constant.locale.required))
                return false;
            }
            return true;
        }
    }
}
export default templates;