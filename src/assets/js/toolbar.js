import databaseTemplate from './database-template'
let treeItemId = 0;
export default {
    data() {
        return {}
    },
    methods: {
        openConnectionDialog(i) {
            let current = databaseTemplate[i];
            for (let key in current.data) {
                this.connection[key] = current.data[key].value;
            }
            this.connectionDialog.dbType = i;
            this.connectionDialog.visible = true;
            this.connectionDialog.edit = false;
        },
        addConnection() {
            this.$refs.NCF.validate(async (vaild) => {
                if (vaild) {
                    if (!this.connectionDialog.edit) {
                        this.connectionDialog.visible = false;
                        this.addConnectionByInfo(this.connection, this.connectionDialog.dbType);
                        this.$refs.tree.setData(this.dbc);
                    } else {
                        this.connectionDialog.visible = false;
                        this.dbc[this.dbc.findIndex(e => e.id == this.connectionDialog.id)].info = this.connection;
                    }
                    this.storage();
                }
            })
        },
        addConnectionByInfo(info, type) {
            this.dbc.push({
                id: 'dbc_' + (treeItemId++),
                label: info.name,
                items: [],
                dbType: type,
                info
            })
        },
        async openFileDialog(connection, key) {
          let files = await native.io.chooseFile(this.global.locale.open, false, null, 'SQLite|*.db')
          if (files) {
            connection[key] = files[0];
          }
        }
    }
}