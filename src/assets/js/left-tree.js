import databaseTemplate from './database-template';
import databaseConnecton from './database-connecton'
let treeItemId = 0;
export default {
    data() {
        return {}
    },
    methods: {
        nodeMenu(e, data, node) {
            if (this.contextmenu.visible) {
                this.$refs.contextmenu.handleClose();
                setTimeout(() => {
                    this.contextmenu.visible = false;
                    this.nodeMenu(e, data, node)
                }, 50);
                return;
            }
            this.contextmenu.visible = true;
            let parent = e.target;
            do {
                let exists = false;
                for (let cl of parent.classList) {
                    if (cl == 'el-tree-node') {
                        exists = true;
                        break;
                    }
                }
                if (exists) break;
                parent = parent.parentElement;
            } while (true)
            this.contextmenu.type = 0;
            let rect = parent.getBoundingClientRect();
            this.contextmenu.data = node;
            this.contextmenu.rect.top = rect.top + 'px';
            this.contextmenu.rect.left = rect.left + 'px';
            this.contextmenu.rect.width = rect.width + 'px';
            this.contextmenu.rect.height = rect.height + 'px';
            this.$refs.contextmenu.handleOpen();
        },
        treeShortcutKey(e) {
            let selectId = this.$refs.tree.getCurrentKey();
            if (e.key == 'F2') {
                if (selectId == null) return;
                let info = this.getNodeDataPathById(selectId);
                if (info.path.length == 4)
                    this.renameTable(info.data);
            } else if (e.ctrlKey && e.key.toLowerCase() == 'c') {
                if (selectId == null) return;
                navigator.clipboard.writeText(this.getNodeDataPathById(selectId).data.label);
            }
        },
        async nodeClick(data, node, e) {
            if (data.items && data.items.length > 0) return;
            let loading = null;
            let loadingId = setTimeout(() => {
                loading = this.$loading({ target: this.$refs.main_left })
            }, 100);
            try {
                if (node.level == 1) {
                    await this.refreshCN(node);
                } else if (node.level == 2) {
                    node.data.items = databaseTemplate[this.getDBCByNode(node).dbType].dbItems.map(e => {
                        return {
                            id: treeItemId++,
                            label: this.global.locale[e],
                            items: [],
                            type: e
                        }
                    });
                    this.$refs.tree.setData(this.dbc);
                } else if (node.level == 3) {
                    if (node.data.type == 'tables') {
                        await this.refreshTable(node);
                    }
                }
            } catch (e) {
                this.error(e);
            } finally {
                clearTimeout(loadingId)
                loading && loading.close();
            }
        },
        async refreshCN(node) {
            try {
                let dbs = await databaseConnecton.databaseList(this.getDBCByNode(node));
                for (let obj of dbs) {
                    if (node.data.items.findIndex(e => e.label == obj.name) == -1) {
                        node.data.items.push({
                            id: treeItemId++,
                            label: obj.name,
                            items: [],
                            db: node.data.db
                        })
                    }
                }
                this.$refs.tree.setData(this.dbc);
            } catch (e) {
                this.error(e);
            }
        },
        refreshTable(node) {
            return this.refreshTableByDB(this.getDBCByNode(node), node.level == 1 ? node.data : (node.level == 4 ? node.parent.parent.data : node.parent.data));
        },
        async refreshTableByDB(dbcData, dbData) {
            let list = await databaseConnecton.getTableList(dbcData, dbData.label);
            let tableData = dbData.items[dbData.items.findIndex(e => e.type == 'tables')]
            for (let s of list) {
                if (tableData.items.findIndex(e => e.label == s) == -1) {
                    tableData.items.push({
                        id: treeItemId++,
                        label: s,
                        items: [],
                        type: 'tables'
                    })
                }
            }
            tableData.items.sort((a, b) => a.label.localeCompare(b.label));
            this.$refs.tree.setData(this.dbc);
        },
        addTable(node) {
            let path = this.getNodeDataPathById(node.data.id).path;
            let dbc = this.dbc[path[0]];
            let tableTemplate = databaseTemplate[dbc.dbType];
            this.tabs.push({
                id: Date.now(),
                type: 2,
                name: this.global.locale.unnamed,
                subtabs: tableTemplate.table.metatable,
                table: this.global.locale.unnamed,
                dbc,
                db: dbc.items[path[1]]
            })
            console.log(this.tabs[this.tabs.length - 1])
            this.tabIndex = this.tabs.length - 1;
        },
        designTable(node) {
            let path = this.getNodeDataPathById(node.data.id).path;
            let dbc = this.dbc[path[0]];
            this.tabs.push({
                id: Date.now(),
                type: 2,
                name: node.data.label,
                subtabs: [],
                table: node.data.label,
                dbc,
                db: dbc.items[path[1]],
                design: true
            })
            this.tabIndex = this.tabs.length - 1;
        },
        addNewTable(item) {
            item.name = item.table;
            this.refreshTableByDB(item.dbc, item.db)
        },
        renameTable(tableData) {
            tableData.$rename = true;
            tableData.$name = tableData.label;
            setTimeout(() => {
                this.$refs.rename.focus();
            }, 500);
        },
        async renameClose(node) {
            node.data.$rename = false;
            if (node.data.$name == node.data.label) return;
            let dbNode = this.getDBNodeByNode(node);
            await databaseConnecton.renameTable(dbNode.parent.data, dbNode.data.label, node.data.label, node.data.$name);
            node.data.label = node.data.$name;
            this.$refs.tree.setData(this.dbc);
        },
        renameKeyDown(e, node) {
            if (e.key == 'Enter') {
                this.renameClose(node);
            }
        },
        async copyCreateSQL(tableNode) {
            let dbNode = this.getDBNodeByNode(tableNode);
            navigator.clipboard.writeText(await databaseConnecton.getTableSQL(dbNode.parent.data, dbNode.data.label, tableNode.data.label));
        },
        async copyDataInertSQL(tableNode) {
            let dbNode = this.getDBNodeByNode(tableNode);
            navigator.clipboard.writeText(databaseTemplate[dbNode.parent.data.dbType].onCopyAllRowInsert(tableNode.data.label, await databaseConnecton.getTableData(dbNode.parent.data, dbNode.data.label, tableNode.data.label)));
        },
        async duplicateCreateSQL(tableNode) {
            let dbNode = this.getDBNodeByNode(tableNode);
            await databaseConnecton.duplicateTable(dbNode.parent.data, dbNode.data.label, tableNode.data.label, tableNode.data.label + '_' + this.randomString(6));
            this.refreshTable(tableNode)
        }
    }
}