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
            let parent;
            for (let dom of e.path) {
                for (let cl of dom.classList) {
                    if (cl == 'el-tree-node') {
                        parent = dom;
                        break;
                    }
                }
                if (parent) break;
            }
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
        }
    }
}