function validate() {
    return {
        trigger: 'blur', validator: (rule, value, callback) => {
            if (!value) {
                callback(new Error(this.db[this.connectionType].data[rule.field].name + ' ' + this.global.locale.required))
                return false;
            }
            return true;
        }
    }
}
export default [{
    name: 'MySQL',
    icon: 'icon-mysql',
    alias: 'mysql',
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
    dataValidate: {
        name: [validate()],
        host: [validate()],
        port: [validate()],
        user: [validate()],
        pwd: [validate()],
    },
    dataType: {
        binary: {
            default_value:'text',
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
            default_value:'text',
            auto_increment: 'checkbox',
            unsigned: 'checkbox'
        },
        bit: {
            jsType: 'number',
            default_value:'text',
        },
        char: {
            jsType: 'text',
            default_value:'text',
            character: 'select',
            collation: 'select',
            key_length: 'number'
        },
        date: {
            jsType: 'date',
            default_value:'text',
        },
        datetime: {
            jsType: 'datetime',
            default_value:'text',
            update_current_timestamp: 'checkbox'
        },
        decimal: {
            jsType: 'number',
            default_value:'text',
            unsigned: 'checkbox'
        },
        double: {
            jsType: 'number',
            default_value:'text',
            auto_increment: 'checkbox',
            unsigned: 'checkbox'
        },
        float: {
            jsType: 'number',
            default_value:'text',
            auto_increment: 'checkbox',
            unsigned: 'checkbox'
        },
        mediumint: {
            jsType: 'number',
            default_value:'text',
            auto_increment: 'checkbox',
            unsigned: 'checkbox'
        },
        smallint: {
            jsType: 'number',
            default_value:'text',
            auto_increment: 'checkbox',
            unsigned: 'checkbox'
        },
        tinyint: {
            jsType: 'number',
            default_value:'text',
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
            default_value:'text',
            auto_increment: 'checkbox',
            unsigned: 'checkbox'
        },
        integer: {
            jsType: 'number',
            default_value:'text',
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
            default_value:'text',
            character: 'select',
            collation: 'select',
        },
        set: {
            jsType: 'select',
            default_value:'text',
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
            default_value:'text',
            character: 'select',
            collation: 'select',
            key_length: 'number'
        },
        time: {
            jsType: 'time',
            default_value:'text'
        },
        timestamp: {
            jsType: 'timestamp',
            default_value:'text',
            update_current_timestamp: 'checkbox'
        },
        year: {
            jsType: 'number',
            default_value:'text'
        }
    },
}];