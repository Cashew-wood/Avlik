
<template>
  <div class="window">
    <TitleBar />
    <div class="menu">
      <el-dropdown v-for="(item, index) in menu" trigger="click" class="item" :tabindex="-1">
        <span class="el-dropdown-link">{{ item.name }}</span>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item v-for="(sub, index) in item.items" :divided="sub.divided" @click="menuItem(item, sub)"
              :icon="sub.icon">{{
                  sub.name
              }}
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
    <div class="tool" v-show="show_tool">
      <el-dropdown trigger="click" :tabindex="-1">
        <div class="item">
          <img class="icon" src="../assets/img/connection.png" />
          <span class="name">{{ global.locale.connection }}</span>
        </div>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item v-for="(item, i) in dbTemplates" :key="i" @click="openConnectionDialog(i)">{{ item.name }}
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
      <div class="item" @click="newSQLQuery">
        <img class="icon" src="../assets/img/query.png" />
        <span class="name">{{ global.locale.query }}</span>
      </div>
    </div>
    <div class="main">
      <div class="left" v-show="show_navigation" ref="main_left">
        <Fixed class="dbc">
          <template #default="{ height }">
            <el-tree-v2 ref="tree" :data="dbc" :props="{ value: 'id', label: 'label', children: 'items' }"
              highlight-current :height="height" @node-click="nodeClick" @node-contextmenu="nodeMenu"
              @keydown="treeShortcutKey">
              <template #default="{ node }">
                <span v-if="node.level == 1" class="prefix iconfont cn"
                  :class="[dbTemplates[node.data.dbType].icon, node.data.items.length ? 'open' : '']"></span>
                <span v-if="node.level == 2" class="prefix iconfont db icon-jurassic_data"></span>
                <template v-if="node.level > 2">
                  <img v-if="node.data.type == 'tables'" class="prefix icon" src="../assets/img/tree-table.png" />
                  <img v-if="node.data.type == 'views'" class="prefix icon" src="../assets/img/tree-view.png" />
                </template>
                <el-input ref="rename" v-if="node.data.$rename" v-model="node.data.$name" autofocus size="small"
                  @blur="renameClose(node)" @keydown="renameKeyDown($event, node)" style="width: calc(100% - 60px)" />
                <span v-else>{{ node.label }}</span>
                <div v-if="node.level == 4 && !node.data.$rename"
                  style="position: absolute;left:0;right: 0;top: 0;bottom: 0;" @dblclick="doubleItem(node)"></div>
              </template>
            </el-tree-v2>
          </template>
        </Fixed>
        <div class="floor">
        </div>
      </div>
      <div class="main_panel">
        <el-tabs closable type="card" class="tabs" @tab-remove="tabClose" v-model="tabIndex">
          <el-tab-pane v-for="(item, i) in tabs" :key="i" :label="item.name" class="tab-panel" :name="i">
            <div class="table_panel" v-if="item.type == 0">
              <div class="scroll">
                <DataTable :item="item" :loadTableData="loadTableData"></DataTable>
              </div>
            </div>
            <div v-if="item.type == 1" class="code">
              <div class="code_tool">
                <el-select v-model="item.dcIndex" class="m-2" placeholder="Select">
                  <el-option v-for="(item, i) in dbc" :key="item.id" :label="item.label" :value="i" />
                </el-select>
                <el-select v-model="item.dbIndex" class="m-2" placeholder="Select" @change="selectDB(item)">
                  <el-option v-if="item.dcIndex != null" v-for="(item, i) in dbc[item.dcIndex].items" :key="item.id"
                    :label="item.label" :value="i" />
                </el-select>
                <div class="item" :class="item.run ? 'disable' : ''" @click="!item.run && runSQL(item)">
                  <span class="iconfont primary icon-zhihang"></span>
                  <span>{{ global.locale.run }}</span>
                </div>
                <div class="item" :class="item.run ? '' : 'disable'" @click="item.run && stopSQL(item)">
                  <span class="iconfont error icon-tingzhi"></span>
                  <span>{{ global.locale.stop }}</span>
                </div>
              </div>
              <Codemirror :ref="'editor' + i" v-model:value="item.content" :options="item.editorOptions" border
                height="100%" />
              <div class="result" v-if="item.data">
                <div class="scroll">
                  <div v-if="item.dataType == 0" class="string">{{ item.data }}</div>
                  <DataTable v-if="item.dataType == 1" :item="item"></DataTable>
                </div>
              </div>
            </div>
            <TableMeta v-if="item.type == 2" :item="item" @add="addNewTable(item)">
            </TableMeta>
            <div class="floor">
              <div class="floor-left">
                {{ item.explain }}
              </div>
              <div class="floor-right">
                {{ item.time ? format(global.locale.elapsed_time, item.time) + 's' : '' }}
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </div>
    <el-dialog v-model="connectionDialog.visible" :title="global.locale.new_connection" width="50%"
      ref="connectionDialog" custom-class="connection-dialog">
      <el-form ref="NCF" :model="connection" :rules="dbTemplates[connectionDialog.dbType].dataValidate" border>
        <el-form-item v-for="(item, key) in dbTemplates[connectionDialog.dbType].data" :label="item.name" :prop="key"
          :label-width="connectionDialog.labelWidth">
          <template v-if="item.type == 'file'">
            <el-input type="text" v-model="connection[key]" autocomplete="off" maxlength="30" />
            <el-button class="link" link type="primary" @click="openFileDialog(connection, key)">...</el-button>
          </template>
          <el-input v-else :type="item.type || 'text'" v-model="connection[key]" autocomplete="off" maxlength="30" />

        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="connectionDialog.visible = false">{{ global.locale.cancel }}</el-button>
          <el-button type="primary" @click="addConnection">{{ global.locale.ok }}</el-button>
        </span>
      </template>
    </el-dialog>
    <el-dropdown ref="contextmenu" v-show="contextmenu.visible" trigger="contextmenu"
      @visible-change="contextmenuVisible">
      <div class="contextmenu" :style="contextmenu.rect"></div>
      <template #dropdown>
        <div v-if="contextmenu.type == 0">
          <el-dropdown-menu v-if="contextmenu.data.level == 1">
            <el-dropdown-item @click="switchCNStatus(contextmenu.data)">{{ contextmenu.data.data.items.length ?
                global.locale.close_connection :
                global.locale.open_connection
            }}
            </el-dropdown-item>
            <el-dropdown-item @click="editCN(contextmenu.data)">{{ global.locale.edit_connection }}</el-dropdown-item>
            <el-dropdown-item @click="refreshCN(contextmenu.data)">{{ global.locale.refresh }}</el-dropdown-item>
            <el-dropdown-item divided @click="removeCN(contextmenu.data)">{{ global.locale.delete }}
            </el-dropdown-item>
          </el-dropdown-menu>
          <el-dropdown-menu v-if="contextmenu.data.level == 2">
            <el-dropdown-item @click="switchDBStatus(contextmenu.data)">{{ contextmenu.data.data.items.length ?
                global.locale.close_database :
                global.locale.open_database
            }}
            </el-dropdown-item>
            <el-dropdown-item v-if="dbTemplates[contextmenu.data.parent.data.dbType].dropDB"
              @click="deleteDB(contextmenu.data)">{{ global.locale.delete }}</el-dropdown-item>
          </el-dropdown-menu>
          <el-dropdown-menu v-if="contextmenu.data.level == 3">
            <el-dropdown-item @click="addTable(contextmenu.data)">{{ global.locale.new_table }}</el-dropdown-item>
            <el-dropdown-item @click="refreshTable(contextmenu.data)">{{ global.locale.refresh }}</el-dropdown-item>
          </el-dropdown-menu>
          <el-dropdown-menu v-if="contextmenu.data.level == 4">
            <el-dropdown-item @click="designTable(contextmenu.data)">{{ global.locale.design_table }}</el-dropdown-item>
            <el-dropdown-item @click="addTable(contextmenu.data)">{{ global.locale.new_table }}</el-dropdown-item>
            <el-dropdown-item divided @click="copyCreateSQL(contextmenu.data)">{{ global.locale.copy }}-{{
                global.locale.copy_insert_sql
            }}
            </el-dropdown-item>
            <el-dropdown-item @click="duplicateCreateSQL(contextmenu.data)">{{ global.locale.duplicate }}
            </el-dropdown-item>
            <el-dropdown-item divided @click="renameTable(contextmenu.data.data)">{{ global.locale.rename }}
            </el-dropdown-item>
            <el-dropdown-item divided @click="deleteTable(contextmenu.data)">{{ global.locale.delete }}
            </el-dropdown-item>
          </el-dropdown-menu>
        </div>
      </template>
    </el-dropdown>
  </div>
</template>
<script>

let treeId = 0;
import TitleBar from '../components/title-bar.vue';

import Codemirror from "codemirror-editor-vue3";
import "codemirror/mode/sql/sql.js";
import "codemirror/addon/hint/show-hint.js";
import "codemirror/addon/hint/show-hint.css";
import "codemirror/theme/dracula.css";
import 'codemirror/addon/search/searchcursor.js'
import 'codemirror/addon/search/search.js'
import 'codemirror/addon/search/matchesonscrollbar.js'
import 'codemirror/addon/search/match-highlighter.js'
import 'codemirror/addon/search/jump-to-line.js'
import 'codemirror/addon/dialog/dialog.js'
import 'codemirror/addon/dialog/dialog.css'
import 'codemirror/addon/fold/foldgutter.css'
import 'codemirror/addon/fold/foldcode'
import 'codemirror/addon/fold/foldgutter'
import 'codemirror/addon/fold/brace-fold'
import 'codemirror/addon/fold/comment-fold'
import DataTable from '../components/data-table.vue';
import TableEdit from '../components/table-edit.vue';
import databaseTemplate from '../assets/js/database-template';
import databaseConnecton from '../assets/js/database-connecton';
import TableMeta from '../components/table-meta.vue';
import Fixed from '../components/fixed.vue';
import ContextMenu from '../components/context-menu.vue';
export default {
  data() {
    return {
      cmOptions: {
        mode: "text/x-sql",
        theme: "dracula",
        lineNumbers: true,
        smartIndent: true,
        indentUnit: 2,
        foldGutter: true,
        styleActiveLine: true,
        autofocus: true,
        hintOptions: {
          hint: this.autocomplete,
          completeSingle: false
        }
      },
      show_navigation: true,
      show_tool: true,
      menu: [{
        _name: '${file}',
        items: [{
          _name: '${open_sql_file}',
          invoke: this.chooseFile
        }, {
          _name: '${exit}',
          divided: true,
          invoke: () => { native.window.close() }
        }]
      }, {
        _name: '${look}',
        items: [{
          _name: '${hide_navigation}',
          icon: '',
          invoke: (e) => { this.show_navigation = !this.show_navigation; e.icon = this.show_navigation ? '' : 'Check'; }
        }, {
          _name: '${hide_tool}',
          icon: '',
          invoke: (e) => { this.show_tool = !this.show_tool; e.icon = this.show_tool ? '' : 'Check'; }
        }]
      }, {
        _name: '${help}',
        items: [{
          _name: '${check_update}',
          invoke: () => { this.$alert(this.global.locale.no_update, 'Prompt') }
        }, {
          name: '中文（简体）',
          invoke: () => { this.setDisplayLocale('zh-cn') },
          divided: true
        }, {
          name: 'English',
          invoke: () => { this.setDisplayLocale('en') },
        }, {
          _name: '${about}',
          divided: true,
          invoke: async () => { this.$alert(`Name:${await native.window.title}<br/>Vserion:${await native.app.version}`, this.global.locale.prompt, { dangerouslyUseHTMLString: true }) }
        }]
      }],
      dbc: [],
      connectionDialog: {
        id: null,
        visible: false,
        labelWidth: '100px',
        edit: false,
        dbType: 0
      },
      connection: {},
      tabs: [],
      tabIndex: 0,
      contextmenu: {
        visible: false,
        type: -1,
        data: null,
        rect: {
          left: 0,
          top: 0,
          width: 0,
          height: 0,
        }
      },
      about: {
        visible: false
      },
      renameDialog: {
        type: null,
        value: null,
        visible: false
      },
      dbTemplates: []
    }
  },
  components: { TitleBar, Codemirror, DataTable, TableEdit, TableMeta, Fixed, ContextMenu },
  mounted() {
    if (native && native.isInit) {
      this.init();
    } else {
      window.addEventListener('native', this.init)
    }
    this.dbTemplates = databaseTemplate;

    this.loadStorage();
  },
  methods: {
    setLocale(obj) {
      for (let key in obj) {
        if (key.startsWith('$')) continue;
        let val = obj[key];
        let t = typeof (val);
        if (t == 'function' || t == 'number' || t == 'boolean' || t == 'bigint' || t == 'undefined') continue;
        else if (Array.isArray(val)) {
          for (let item of val) this.setLocale(item);
        } else if (t == 'object') {
          this.setLocale(val)
        } else if (t == 'string' && val.startsWith('${')) {
          obj[key.substring(1)] = this.global.locale[val.substring(2, val.length - 1)];
          if (this.global.locale[val.substring(2, val.length - 1)] == null) {
            console.log(val, this.global.locale, val.substring(2, val.length - 1))
          }
        }
      }
    },
    async init() {
      console.log(native)
      native.window.show();
      let actualSize = await this.global.device.screenActualSize;
      native.window.width = parseInt(actualSize.width * 0.75);
      native.window.height = parseInt(actualSize.height * 0.85);
      native.window.showCenter();
      native.window.addDragMoveArea(0, 0, 20000, 40);
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
              id: treeId++,
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
    doubleItem(node) {
      if (node.data.type == 'tables') {
        this.openTable(node.data, node.parent.data);
      } else if (node.data.type == 'views') {

      }
    },
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
        id: treeId++,
        label: info.name,
        items: [],
        dbType: type,
        info
      })
    },
    storage() {
      let connection = [];
      for (let dc of this.dbc) {
        connection.push({ info: dc.info, type: dc.dbType });
      }
      localStorage.setItem('dbc', JSON.stringify(connection));
    },
    loadStorage() {
      let connection = localStorage.getItem('dbc')
      if (connection) {
        connection = JSON.parse(connection);
        for (let dc of connection) {
          this.addConnectionByInfo(dc.info, dc.type);
        }
      }
      this.setDisplayLocale(localStorage.getItem('lang') || 'en');
    },
    getDBCByNode(node) {
      while (node != null && node.level != 1) {
        node = node.parent;
      }
      return node.data;
    },
    getDBNodeByNode(node) {
      while (node != null && node.level != 2) {
        node = node.parent;
      }
      return node;
    },
    switchCNStatus(node) {
      console.log('close', node.data.id, this.$refs.tree)
      if (node.data.items.length) {
        this.closeConnection(node.data);
      } else {
        this.refreshCN(node)
      }
    },
    closeConnection(data, remove) {
      let i = this.dbc.findIndex(e => e.id == data.id);
      let item = this.dbc.splice(i, 1)[0];
      this.$refs.tree.setData(this.dbc);
      if (!remove) {
        item.items = [];
        this.dbc.splice(i, 0, item);
        this.$refs.tree.setData(this.dbc);
      }
      this.storage();
    },
    contextmenuVisible(e) {
      setTimeout(() => {
        this.contextmenu.visible = e;
      }, 200)
    },
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
    async editCN(node) {
      if (node.data.items.length) {
        await this.$confirm(this.global.locale.close_connect_tip, this.global.locale.prompt, {
          confirmButtonText: this.global.locale.ok,
          cancelButtonText: this.global.locale.cancel,
          type: 'warning',
        })
        this.closeConnection(node.data);
      }
      this.connection = node.data.info;
      this.connectionDialog.dbType = node.data.dbType;
      this.connectionDialog.visible = true;
      this.connectionDialog.edit = true;
      this.connectionDialog.id = node.data.id;
    },
    async refreshCN(node) {
      try {
        let dbs = await databaseConnecton.databaseList(this.getDBCByNode(node));
        for (let obj of dbs) {
          if (node.data.items.findIndex(e => e.label == obj.name) == -1) {
            node.data.items.push({
              id: treeId++,
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
    async removeCN(node) {
      await this.$confirm(this.format(this.global.locale.delete_tip, node.data.label), this.global.locale.prompt, {
        confirmButtonText: this.global.locale.ok,
        cancelButtonText: this.global.locale.cancel,
        type: 'warning',
      })
      this.closeConnection(node.data, true);
    },
    menuItem(man, sub) {
      sub.invoke(sub);
      console.log(sub)
    },
    setDisplayLocale(lang) {
      this.setCurrentLocale(lang);
      this.setLocale(this.dbTemplates)
      this.setLocale(this.menu)
      localStorage.setItem('lang', lang);
    },
    async switchDBStatus(node) {
      if (node.data.items.length) {
        node.data.items = []
        this.$refs.tree.setData(this.dbc);
      } else {
        this.nodeClick(node.data, node)
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
            id: treeId++,
            label: s,
            items: [],
            type: 'tables'
          })
        }
      }
      tableData.items.sort((a, b) => a.label.localeCompare(b.label));
      this.$refs.tree.setData(this.dbc);
    },
    async deleteDB(node) {
      console.log(this.global.locale)
      await this.$confirm(this.format(this.global.locale.delete_tip, node.data.label), this.global.locale.prompt, {
        confirmButtonText: this.global.locale.ok,
        cancelButtonText: this.global.locale.cancel,
        type: 'warning',
      })
      try {
        await databaseConnecton.dropDatabase(this.getDBCByNode(node), node.data.label);
        node.parent.data.items.splice(node.parent.data.items.findIndex(e => e.id == node.data.id), 1);
        this.$refs.tree.setData(this.dbc);
      } catch (e) {
        this.error(e);
      }
    },
    async deleteTable(node) {
      await this.$confirm(this.format(this.global.locale.delete_tip, node.data.label), this.global.locale.prompt, {
        confirmButtonText: this.global.locale.ok,
        cancelButtonText: this.global.locale.cancel,
        type: 'warning',
      })
      let dbNode = this.getDBNodeByNode(node);
      try {
        await databaseConnecton.dropTable(dbNode.parent.data, dbNode.data.label, node.data.label);
      } catch (e) {
        this.error(e);
      }
      node.parent.data.items.splice(node.parent.data.items.findIndex(e => e.id == node.data.id), 1);
      this.$refs.tree.setData(this.dbc);
    },
    async openTable(data, parent) {
      let path = this.getNodeDataPathById(data.id).path;
      console.log(path);
      this.tabs.push({
        id: Date.now(),
        name: data.label,
        type: 0,
        data: [],
        columns: [],
        data_index: 1,
        data_size: 100,
        data_total: null,
        dbc: this.dbc[path[0]],
        db: this.dbc[path[0]].items[path[1]],
        table: data.label
      })
      let tab = this.tabs[this.tabs.length - 1];
      this.loadTableColumn(tab, data.label).then(e => {
        tab.columns = e;
      });
      this.loadTableData(tab, data.label);
      this.tabIndex = this.tabs.length - 1
    },
    loadTableColumn(tab, table) {
      return databaseConnecton.getTableColumns(tab.dbc, tab.db.label, table);
    },
    async loadTableData(tab, table) {
      tab.$change = false;
      tab.wait = true;
      tab.data_index = tab.data_index;
      tab.data_size = tab.data_size;
      try {
        let page = await databaseConnecton.getTableDataPage(tab.dbc, tab.db.label, table, tab.data_index, tab.data_size, (e) => {
          tab.sql = e;
          tab.explain = tab.sql;
        });
        tab.data_total = page.total;
        tab.data = this.setDuplicateData(page.data);
        tab.wait = false;
      } catch (e) {
        tab.wait = false;
        this.error(e);
      }
    },
    getNodeDataPathById(id) {
      let root = [{ path: [], items: this.dbc }];
      let find = null;
      do {
        let list = []
        for (let obj of root) {
          let k = 0;
          for (let node of obj.items) {
            if (node.id == id) {
              find = { path: obj.path.concat([k]), data: node };
              break
            } else {
              list.push({ path: obj.path.concat([k]), items: node.items })
            }
            k++;
          }
        }
        if (find) break
        root = list;
      } while (root.length);
      return find;
    },
    newSQLQuery() {
      let id = this.$refs.tree.getCurrentKey();
      if (!id) {
        this.$message({
          duration: 3000,
          message: this.global.locale.not_selected_db,
          type: 'warning'
        })
        return;
      }
      let find = this.getNodeDataPathById(id).path;
      this.openSQLPanel(null, '', find[0], find[1]);
    },
    openSQLPanel(name, content, dcIndex, dbIndex) {
      let c = 0
      for (let tab of this.tabs) {
        if (tab.type == 1) c++;
      }
      this.tabs.push({
        name: name || 'Query - ' + c, id: Date.now(),
        type: 1, content: ' ', dcIndex, dbIndex, dbc: this.dbc[dcIndex], db: this.dbc[dcIndex].items[dbIndex],
        data: null, columns: null, dataType: null,
        editorOptions: { ... this.cmOptions, mode: databaseTemplate[this.dbc[dcIndex].dbType].editor }
      })
      let tab = this.tabs[this.tabs.length - 1];
      this.tabIndex = this.tabs.length - 1
      this.$nextTick(() => {
        tab.content = content
        const instance = this.$refs['editor' + this.tabIndex][0].cminstance
        setTimeout(async () => {
          instance.focus();
          tab.keywords = CodeMirror.resolveMode(instance.doc.modeOption).keywords;
          instance.tab = tab;
          instance.on('cursorActivity', function () {
            instance.showHint()
          })
        }, 100);
      })
    },
    autocomplete(editor) {
      let cursor = editor.getCursor();
      let line = editor.getLine(cursor.line)
      let content=editor.getValue();
      let keyword = editor.tab.keywords;
      let j = line.lastIndexOf(' ');
      let word = line.substring(j == -1 ? 0 : j + 1);
      let list = []
      if (word.length) {
        for (let s in keyword) {
          if (s.startsWith(word)) {
            list.push(s);
          }
        }
        if (editor.tab.dbc != null) {
          for (let s of editor.tab.dbc.items) {
            if (s.label.startsWith(word)) {
              list.push(s.label);
            }
          }
          for (let item of editor.tab.db.items) {
            for (let s of item.items) {
              if (s.label.startsWith(word)) {
                list.push(s.label);
              }
            }
          }
        }
      }

      let token = editor.getTokenAt(cursor);
      return { list, from: { ch: token.start, line: cursor.line }, to: { ch: token.end, line: cursor.line } }
    },
    async runSQL(tab) {
      console.log(tab)
      tab.selected = null;
      let dc = tab.dbc;
      let db = tab.db;
      tab.start = Date.now();
      tab.data = null;
      tab.timeId = setInterval(() => {
        tab.time = ((Date.now() - tab.start) / 1000).toFixed(3);
      }, 50);
      try {
        let sql = tab.content.trim();
        let execute = !databaseTemplate[dc.dbType].isQuery(sql);
        tab.run = true;
        tab.sql = sql;
        tab.explain = sql;
        tab.table = null;
        if (execute) {
          tab.dataType = 0;
          let cn = await databaseConnecton.getConnection(dc.dbType, dc.info, db.label);
          tab.$cn = cn;
          tab.runId = await cn.executeAsync(sql, null, (count) => {
            this.sqlRunEnd(tab);
            tab.data = this.format(this.global.locale.affected_rows, count);
          }, (e) => {
            this.sqlRunEnd(tab, e);
            this.setSqlErrorResult(e);
          });
        } else {
          tab.dataType = 1;
          let cn = await databaseConnecton.getConnection(dc.dbType, dc.info, db.label);
          tab.$cn = cn;
          let table = databaseTemplate[dc.dbType].isQueryReadOnly(sql)
          if (table) {
            tab.table = table;
            tab.columns = await this.loadTableColumn(tab, tab.table);
            tab.runId = await cn.selectAsync(sql, null, (rs) => {
              this.sqlRunEnd(tab);
              rs.splice(0, 1);
              tab.data = this.setDuplicateData(rs);
            }, (e) => {
              this.sqlRunEnd(tab, e);
            });
          } else {
            tab.runId = await cn.selectAsync(sql, null, (rs) => {
              this.sqlRunEnd(tab);
              let columns = this.getRow0Columns(rs);
              rs.splice(0, 1);
              tab.data = this.setDuplicateData(rs);
              tab.columns = columns
            }, (e) => {
              this.sqlRunEnd(tab, e);
            });
          }
        }
      } catch (e) {
        this.setSqlErrorResult(tab, e);
      }
    },
    setDuplicateData(data) {
      for (let row of data) {
        for (let column in row) {
          row[this.constant.hiddenFieldPrefix + column] = row[column];
        }
      }
      return data;
    },
    sqlRunEnd(tab, e) {
      tab.$cn.close();
      tab.run = false;
      tab.time = ((Date.now() - tab.start) / 1000).toFixed(3);
      clearInterval(tab.timeId);
      if (e) {
        this.setSqlErrorResult(tab, e);
      }
    },
    setSqlErrorResult(tab, e) {
      this.error(e);
      tab.dataType = 0;
      tab.data = e;
    },
    getRow0Columns(rs) {
      let columns = []
      for (let key in rs[0]) {
        columns.push({ name: rs[0][key] })
      }
      return columns;
    },
    async stopSQL(tab) {
      try {
        await tab.$cn.cancel(tab.runId);
      } catch { }
      clearInterval(tab.timeId);
      tab.wait = false;
      tab.run = false;
    },
    tabClose(e) {
      this.tabs.splice(e, 1);
      if (e <= this.tabIndex) {
        this.tabIndex = this.tabIndex - 1;
      }
    },
    async chooseFile() {
      let files = await native.io.chooseFile(this.global.locale.open, false, null, 'SQL|*.sql')
      if (files) {
        let file = files[0];
        let content = await native.io.readToText(file, 'utf-8');
        this.openSQLPanel(file.substring(file.lastIndexOf('\\') + 1, file.lastIndexOf('.')), content);
      }
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
      console.log(this.tabs[this.tabs.length - 1])
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
    async copyCreateSQL(tableNode) {
      let dbNode = this.getDBNodeByNode(tableNode);
      navigator.clipboard.writeText(await databaseConnecton.getTableSQL(dbNode.parent.data, dbNode.data.label, tableNode.data.label));
    },
    async duplicateCreateSQL(tableNode) {
      let dbNode = this.getDBNodeByNode(tableNode);
      await databaseConnecton.duplicateTable(dbNode.parent.data, dbNode.data.label, tableNode.data.label, tableNode.data.label + '_' + this.randomString(6));
      this.refreshTable(tableNode)
    },
    selectDB(tab) {
      tab.dbc = this.dbc[tab.dcIndex];
      tab.db = tab.dbc.items[tab.dbIndex];
      console.log(tab)
    },
    async openFileDialog(connection, key) {
      let files = await native.io.chooseFile(this.global.locale.open, false, null, 'SQLite|*.db')
      if (files) {
        connection[key] = files[0];
      }
    }
  }
}
</script>
<style lang="scss">
html,
body {
  height: 100%;
  width: 100%;
  --floor-height: 20px;
  display: flex;
}

#app {
  margin: 6px;
  border-radius: 8px;
  box-shadow: 0 0 6px var(--el-fill-color-darker);
  overflow: hidden;
  flex: 1;
}

.window {
  background-color: var(--el-bg-color-page);
  font-size: 14px;
  height: 100%;
}

.window {
  display: flex;
  flex-direction: column;
}

.contextmenu {
  position: fixed;
}

.menu {
  display: flex;
  flex-direction: row;

  .el-dropdown-link {
    color: var(--el-text-color-primary);
    padding: 10px;

    &:hover {
      background-color: var(--el-fill-color-darker);
    }
  }
}

.tool {
  display: flex;

  .item {
    display: flex;
    align-items: center;
    flex-direction: column;
    padding: 4px 32px;

    &:hover {
      background-color: var(--el-fill-color-darker);
    }
  }

  .icon {
    width: 32px;
    height: 32px;
    margin-bottom: 6px;
  }
}

.main {
  flex: 1;
  display: flex;
  flex-direction: row;

  .left {
    width: 20%;
    min-width: 200px;
    max-width: 300px;
    display: flex;
    flex-direction: column;

    .dbc {
      position: relative;
      flex: 1;
    }

    .node {
      width: 100%;

      .el-tooltip__trigger {
        width: 100%;
      }
    }

    .el-tree {
      flex: 1;
    }

    .el-tree-node__content {
      display: flex;
      align-items: center;
    }

    .prefix {
      margin-right: 8px;
    }

    .icon {
      width: 16px;
      height: 16px;
    }

    .cn.open {
      color: var(--el-color-primary);
    }
  }

  .main_panel {
    flex: 1;
    margin-left: 6px;
    display: flex;

    .el-tabs {
      display: flex;
      flex-direction: column;
      width: 100%;
      height: 100%;
      --el-tabs-header-height: 30px;

      .el-tabs__content,
      .el-tab-pane {
        height: 100%;
        display: flex;
        flex-direction: column;

        .table_panel {
          width: 100%;
          height: 100%;
          position: relative;
        }

        .scroll {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          top: 0;
        }
      }

      .code {
        height: calc(100% - var(--floor-height));
        display: flex;
        flex-direction: column;

        .code_tool {
          display: flex;
          align-items: center;

          .item {
            margin-left: 18px;

            .primary {
              color: var(--el-color-primary);
            }

            .error {
              color: var(--el-color-error)
            }

            &.disable {
              color: var(--el-disabled-text-color);

              .iconfont {
                color: var(--el-disabled-text-color);
              }
            }

            &:hover {
              background-color: var(--el-fill-color-darker);
            }
          }
        }

        .codemirror-container {
          flex: 1;
        }

        .result {
          height: 40%;
          position: relative;

          .string {
            padding: 10px;
            user-select: text;
          }
        }
      }

      .code_tool {
        margin-bottom: 10px;
      }


    }
  }
}

.connection-dialog {
  .el-form-item__content {
    display: flex;
    flex-direction: row;

    .el-input {
      width: auto;
      flex: 1;
    }

    div {
      margin-right: 10px;

      &:last-child {
        margin-right: 0;
      }
    }

    .link {
      font-size: 20px;
    }
  }
}

.floor {
  height: var(--floor-height);
  display: flex;
  flex-direction: row;
  border-top: 1px solid var(--el-border-color);
  font-size: 12px;

  .floor-left {
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    width: 0;
  }

  .floor-right {
    width: 20%;
    min-width: 150px;
    border-left: 1px solid var(--el-border-color);
  }
}

.el-tabs__header {
  margin-bottom: 0 !important;
}

input::-webkit-inner-spin-button {
  -webkit-appearance: none;
}

input[type='number'] {
  -moz-appearance: textfield;
}
</style>
