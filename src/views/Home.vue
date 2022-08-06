
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
            <el-dropdown-item v-for="(item, i) in db" :key="i" @click="openConnectionDialog(i)">{{ item.name }}
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
      <div class="left" v-show="show_navigation">
        <div class="dbc">
          <div class="fixed" ref="main_left" :data-type="dbcHeight">
            <el-tree-v2 ref="tree" :data="dbc" v-if="dbcHeight"
              :props="{ value: 'id', label: 'label', children: 'items' }" highlight-current :height="dbcHeight"
              @node-click="nodeClick" @node-contextmenu="nodeMenu">
              <template #default="{ node }">

                <span v-if="node.level == 1" class="prefix iconfont cn"
                  :class="[db[node.data.dbType].icon, node.data.items.length ? 'open' : '']"></span>
                <span v-if="node.level == 2" class="prefix iconfont db icon-jurassic_data"></span>
                <img v-if="node.level == 3" class="prefix icon" src="../assets/img/table_x16.png" />
                <span>{{ node.label }}</span>
                <div v-if="node.level == 3" style="position: absolute;left:0;right: 0;top: 0;bottom: 0;"
                  @dblclick="openTable(node.data, node.parent.data)"></div>
              </template>
            </el-tree-v2>
          </div>
        </div>
        <div class="floor">
        </div>
      </div>
      <div class="main_panel">
        <el-tabs closable type="card" class="tabs" @tab-remove="tabClose" v-model="tabIndex">
          <el-tab-pane v-for="(item, i) in tabs" :key="i" :label="item.name" class="tab-panel" :name="i">
            <div class="table_panel" v-if="item.type == 0">
              <div class="scroll">
                <DataTable :item="item" :generateSQL="generateSQL" :dbTemplate="db[item.dcIndex]" :addRow="addRow">
                </DataTable>
              </div>
            </div>
            <div v-if="item.type == 1" class="code">
              <div class="code_tool">
                <el-select v-model="item.dcIndex" class="m-2" placeholder="Select">
                  <el-option v-for="(item, i) in dbc" :key="item.id" :label="item.label" :value="i" />
                </el-select>
                <el-select v-model="item.dbIndex" class="m-2" placeholder="Select">
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
              <Codemirror :ref="'editor' + i" v-model:value="item.content" :options="cmOptions" border height="100%" />
              <div class="result" v-if="item.data">
                <div class="scroll">
                  <div v-if="item.dataType == 0" class="string">{{ item.data }}</div>
                  <DataTable v-if="item.dataType == 1" :item="item" :generateSQL="generateSQL"
                    :dbTemplate="db[item.dcIndex]" :addRow="addRow"></DataTable>
                </div>
              </div>
            </div>
            <div v-if="item.type == 2" class="new_table">
              <NewTable :item="item" :addRow="addNewTableRow" :generateSQL="generateTableSQL" :dbc="dbc[item.dcIndex]">
              </NewTable>
            </div>
            <div class="table-opt-tool" v-if="(item.dataType == 1 && item.data) || item.type == 0">
              <div class="to-left">
                <span class="icon iconfont icon-zengjia" @click="addRow(item)"></span>
                <span :class="{ 'disable': item.selected == null }" class="icon iconfont icon-jian"
                  @click="item.selected != null && removeRow(item)"></span>
                <span :class="{ 'disable': !item.dataChange }" class="icon iconfont icon-duihao"
                  @click="item.dataChange && saveResult(item)"></span>
                <span :class="{ 'disable': !item.dataChange }" class="icon iconfont icon-cha"
                  @click="item.dataChange && resetResult(item)"></span>
                <span class="icon iconfont icon-recover" @click="refreshResult(item)"></span>
                <span :class="{ 'disable': !item.wait }" class="icon iconfont icon-stop"
                  @click="item.wait && stopSQL(item)"></span>
              </div>
              <div class="to-right" v-if="item.type == 0">
                <el-pagination layout="total, prev, jumper, next" :page-size="item.data_size"
                  :current-page="item.data_index" :total="item.data_total" small
                  @current-change="pagingChange(item, $event)" />
              </div>
            </div>
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
      <el-form ref="NCF" :model="connection" :rules="db[connectionType].dataValidate" border>
        <el-form-item v-for="(item, key) in db[connectionType].data" :label="item.name" :prop="key"
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
      <div class="contextmenu"></div>
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
            <el-dropdown-item @click="removeCN(contextmenu.data)">{{ global.locale.delete }}
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
            <!-- <el-dropdown-item @click="switchTBStatus(contextmenu.data)">{{ contextmenu.data.data.open ?
                global.locale.close_table :
                global.locale.open_table
            }}
            </el-dropdown-item> -->
            <el-dropdown-item @click="addTable(contextmenu.data)">{{ global.locale.new_table }}</el-dropdown-item>
            <el-dropdown-item @click="deleteTable(contextmenu.data)">{{ global.locale.delete }}</el-dropdown-item>
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
import NewTable from '../components/new-table.vue';
import databaseTemplate from '../assets/js/database-template';
import databaseConnecton from '../assets/js/database-connecton';
import TableMeta from '../components/table-meta.vue';
import Fixed from '../components/fixed.vue';
import ContextMenu from '../components/context-menu.vue';
export default {
  data() {
    return {
      hiddenFieldPrefix: '__$',
      hiddenFieldState: '__$$state$',
      hiddenFieldHasEdit: '__$i',
      cmOptions: {
        mode: "text/x-sql", // Language mode
        theme: "dracula", // Theme
        lineNumbers: true, // Show line number
        smartIndent: true, // Smart indent
        indentUnit: 2, // The smart indent unit is 2 spaces in length
        foldGutter: true, // Code folding
        styleActiveLine: true, // Display the style of the selected row
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
          invoke: () => { this.$alert('Vserion:.0.0.0.1', 'Prompt') }
        }]
      }],
      dbc: [],
      db: [],
      dbcHeight: 0,
      connectionDialog: {
        id: null,
        visible: false,
        labelWidth: '100px',
        edit: false
      },
      connection: {
        name: '',
        host: '',
        port: '',
        user: '',
        pwd: ''
      },
      connectionType: 0,
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
      }
    }
  },
  components: { TitleBar, Codemirror, DataTable, TableEdit, TableMeta, Fixed, ContextMenu },
  mounted() {
    if (native && native.isInit) {
      this.init();
    } else {
      window.addEventListener('native', this.init)
    }
    this.db = databaseTemplate;
    this.setDisplayLocale('en');
    this.loadStorage();
    Object.assign(this, databaseConnecton);
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
      native.window.width = parseInt(actualSize.width * 0.625);
      native.window.height = parseInt(actualSize.height * 0.75);
      native.window.showCenter();
      native.window.addDragMoveArea(0, 0, 20000, 40);
      setTimeout(() => {
        this.dbcHeight = this.$refs.main_left.offsetHeight;
        console.log(this.dbcHeight)
        let observable = new ResizeObserver((e) => {
          this.dbcHeight = this.$refs.main_left.offsetHeight;
          console.log(this.dbcHeight)
        })
        observable.observe(this.$refs.main_left);
      }, 100);
    },
    nodeClick(data, node, e) {
      if (data.items && data.items.length > 0) return;
      if (node.level == 1) {
        this.refreshCN(node)
      } else if (node.level == 2) {
        this.refreshTable(node);
      } else if (node.level == 3) {
        //console.log(arguments)
      }

    },
    openConnectionDialog(i) {
      let current = this.db[i];
      for (let key in current.data) {
        this.connection[key] = current.data[key].value;
      }
      this.connectionType = i;
      this.connectionDialog.visible = true;
      this.connectionDialog.edit = false;
    },
    addConnection() {
      this.$refs.NCF.validate(async (vaild) => {
        if (vaild) {
          if (!this.connectionDialog.edit) {
            this.connectionDialog.visible = false;
            this.addConnectionByInfo(this.connection, this.connectionType);
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
      if (!connection) return;
      connection = JSON.parse(connection);
      for (let dc of connection) {
        this.addConnectionByInfo(dc.info, dc.type);
      }
    },
    getDBCByNode(node) {
      while (node.level != 1) {
        node = node.parent;
      }
      return node.data;
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
      console.log(node)
      this.contextmenu.visible = true;
      let contextmenu = document.querySelector('.contextmenu')
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
      contextmenu.style.top = rect.top + 'px';
      contextmenu.style.left = rect.left + 'px';
      contextmenu.style.width = rect.width + 'px';
      contextmenu.style.height = rect.height + 'px';
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
      this.connectionType = node.data.dbType;
      this.connectionDialog.visible = true;
      this.connectionDialog.edit = true;
      this.connectionDialog.id = node.data.id;
    },
    async refreshCN(node) {
      this.use(this.getDBCByNode(node), async (db) => {
        let dbs = await db.select('show databases');
        for (let obj of dbs) {
          if (node.data.items.findIndex(e => e.label == obj.Database) == -1) {
            node.data.items.push({
              id: treeId++,
              label: obj.Database,
              items: [],
              db: node.data.db,
              open: false
            })
          }
        }
        this.$refs.tree.setData(this.dbc);
      })
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
      this.global.locale = this.global.locales[lang][0];
      this.global.el_locale = this.global.locales[lang][1];
      this.setLocale(this.db)
      this.setLocale(this.menu)
    },
    async switchDBStatus(node) {
      if (node.data.items.length) {
        node.data.items = []
        this.$refs.tree.setData(this.dbc);
      } else {
        this.refreshTable(node);
      }
    },
    refreshTable(node) {
      this.getTable(this.getDBCByNode(node), node.data);
    },
    async getTable(dbc, dbData) {
      await this.use(dbc, dbData.label, async (db) => {
        let tables = await db.select('show tables');
        for (let obj of tables) {
          for (let name in obj) {
            if (dbData.items.findIndex(e => e.label == obj[name]) == -1) {
              dbData.items.push({
                id: treeId++,
                label: obj[name],
                items: []
              })
            }
            break;
          }
        }
        this.$refs.tree.setData(this.dbc);
      });
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
      this.use(this.getDBCByNode(node), node.parent.data.label, async (db) => {
        await db.execute('drop table ' + node.data.label);
        node.parent.data.items.splice(node.parent.data.items.findIndex(e => e.id == node.data.id), 1);
        this.$refs.tree.setData(this.dbc);
      });
    },
    async openTable(data, parent) {
      let path = this.treeNodeFindById(data.id);
      console.log(path);
      this.tabs.push({
        id: Date.now(),
        name: data.label,
        type: 0,
        data: [],
        columns: [],
        data_index: 1,
        data_size: 50,
        data_total: null,
        dcIndex: path[0],
        dbIndex: path[1],
        table: data.label
      })
      let tab = this.tabs[this.tabs.length - 1];
      this.loadTableColumn(tab, data, parent);
      this.loadTableData(tab, data.label, parent.label);
      this.tabIndex = this.tabs.length - 1
    },
    async loadTableColumn(tab, data, parent) {
      tab.columns = await this.getTableColumns(parent, data);
    },
    getTableColumns(db, table) {
      let dbc = this.dbc[this.treeNodeFindById(db.id)[0]];
      return new Promise((resolve, reject) => {
        this.use(dbc, async (dc) => {
          try {
            let tableCoumns = await dc.select(`select * from information_schema.COLUMNS where TABLE_SCHEMA='${db.label}' and TABLE_NAME='${table.label}'`);
            let columns = []
            for (let row of tableCoumns) {
              let k = row.COLUMN_TYPE.indexOf('(');
              let value = k > -1 ? parseInt(row.COLUMN_TYPE.substring(k + 1, row.COLUMN_TYPE.length - 1)) : null;
              let len = null;
              if (this.db[dbc.dbType].dataType[row.DATA_TYPE].jsType == 'number') {
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
            resolve(columns);
          } catch (e) {
            reject(e);
          }
        });
      })
    },
    async loadTableData(tab, table, dbName) {
      tab.dataChange = false;
      tab.wait = true;
      tab.sql = `select * from ${table} limit ${(tab.data_index - 1) * tab.data_size},${tab.data_size}`
      tab.explain = tab.sql;
      tab.data_index = tab.data_index || 1;
      tab.data_size = tab.data_size || 500;
      this.use(this.dbc[tab.dcIndex], dbName, async (db) => {
        try {
          if (tab.data_index == 1)
            tab.data_total = (await db.select(`select count(*) count from ${table}`))[0].count;
          let tableData = await db.select(tab.sql);
          tab.data = this.setDuplicateData(tableData);
          tab.wait = false;
        } catch (e) {
          tab.wait = false;
          this.$message({
            duration: 3000,
            message: e,
            type: 'error'
          })
        }
      });
    },
    treeNodeFindById(id) {
      let root = [{ path: [], items: this.dbc }];
      let find = null;
      do {
        let list = []
        for (let obj of root) {
          let k = 0;
          for (let node of obj.items) {
            if (node.id == id) {
              find = obj.path.concat([k]);
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
      let dcIndex, dbIndex;
      let find = this.treeNodeFindById(id);
      let level = 1;
      for (let k of find) {
        if (level == 1) {
          dcIndex = k;
        } else if (level == 2) {
          dbIndex = k;
          break;
        }
        level++;
      }
      this.openSQLPanel(null, '', dcIndex, dbIndex);
    },
    openSQLPanel(name, content, dcIndex, dbIndex) {
      let c = 0
      for (let tab of this.tabs) {
        if (tab.type == 1) c++;
      }
      this.tabs.push({
        name: name || 'Query - ' + c,
        id: Date.now(),
        type: 1,
        content: ' ',
        dcIndex,
        dbIndex,
        data: null,
        columns: null,
        dataType: null,
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
        if (editor.tab.dcIndex != null) {
          for (let s of this.dbc[editor.tab.dcIndex].items) {
            if (s.label.startsWith(word)) {
              list.push(s.label);
            }
          }
          for (let s of this.dbc[editor.tab.dcIndex].items[editor.tab.dbIndex].items) {
            if (s.label.startsWith(word)) {
              list.push(s.label);
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
      if (tab.dcIndex == null) {
        this.$message({
          duration: 3000,
          message: this.global.locale.not_selected_db,
          type: 'warning'
        })
        return;
      }
      let dc = this.dbc[tab.dcIndex];
      let db = dc.items[tab.dbIndex];
      tab.start = Date.now();
      tab.timeId = setInterval(() => {
        tab.time = ((Date.now() - tab.start) / 1000).toFixed(3);
      }, 50);
      try {
        let sql = tab.content.trim();
        let p = sql.indexOf(' ');
        let execute = false;
        if (p > -1) {
          let one = sql.substring(0, p);
          if (one.toLowerCase() != 'select' && one.toLowerCase() != 'show') {
            execute = true;
          }
        }
        tab.run = true;
        tab.sql = sql;
        tab.explain = sql;
        if (execute) {
          tab.dataType = 0;
          let cn = await this.getConnection(dc.dbType, dc.info, db.label);
          tab.db = cn;
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
            tab.columns = await this.getTableColumns(db, { label: tab.table });
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
          row[this.hiddenFieldPrefix + column] = row[column];
        }
      }
      return data;
    },
    sqlRunEnd(tab, e) {
      tab.db.close();
      tab.run = false;
      tab.time = ((Date.now() - tab.start) / 1000).toFixed(3);
      clearInterval(tab.timeId);
      if (e) {
        this.setSqlErrorResult(tab, e);
      }
    },
    setSqlErrorResult(tab, e) {
      this.$message({
        duration: 3000,
        message: e,
        type: 'error'
      })
      tab.data = e;
      tab.dataType = 0;
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
        await tab.db.cancel(tab.runId);
      } catch { }
      clearInterval(tab.timeId);
      tab.wait = false;
      tab.run = false;
    },
    tabClose(e) {
      this.tabs.splice(e, 1);
    },
    addRow(tab) {
      let row = {};
      row[this.hiddenFieldState] = 'insert';
      for (let column of tab.columns) {
        row[column.name] = null;
      }
      tab.data.push(row);
      tab.dataChange = true;
      tab.explain = this.generateSQL(tab);
    },
    removeRow(tab) {
      let data = tab.data[tab.selected];
      if (data[this.hiddenFieldState] == 'insert') {
        tab.data.splice(tab.selected, 1)
      } else {
        tab.dataChange = true;
        data[this.hiddenFieldState] = 'delete';
      }
      tab.explain = this.generateSQL(tab);
    },
    generateSQL(tab) {
      let columnInfos = {};
      let sql = '';
      let primaryColumns = []
      for (let column of tab.columns) {
        if (column.key == 'PRI') {
          primaryColumns.push(column.name);
        }
        columnInfos[column.name] = { jsType: this.db[this.dbc[tab.dcIndex].dbType].dataType[column.type].jsType, ...column };
      }
      for (let row of tab.data) {
        let change = false;
        let set = '';
        if (row[this.hiddenFieldState] == 'update') {
          for (let column in row) {
            if (row[column] != row[this.hiddenFieldPrefix + column] && !column.startsWith(this.hiddenFieldPrefix)) {
              let info = columnInfos[column];
              if (row[column] == null)
                values += `${column}=null,`;
              else if (info.jsType == 'number')
                set += `${column}=${row[column]},`;
              else set += `${column}='${row[column]}',`;
              change = true;
            }
          }
          if (change) {
            let primaryColumnData = '';
            for (let column of primaryColumns) {
              let info = columnInfos[column];
              primaryColumnData += `${column}=`;
              if (row[column] == null)
                primaryColumnData += 'null and ';
              else if (info.jsType == 'number')
                primaryColumnData += `${row[column]} and `
              else primaryColumnData += `'${row[column]}' and `
              change = true;
            }
            primaryColumnData = primaryColumnData.substring(0, primaryColumnData.length - 5);
            sql += `update ${tab.table} set ${set.substring(0, set.length - 1)} where ${primaryColumnData};`
          }
        } else if (row[this.hiddenFieldState] == 'insert') {
          let columns = '('
          let values = 'values(';
          for (let column in row) {
            if (column.startsWith(this.hiddenFieldPrefix)) continue;
            columns += column + ','
            let info = columnInfos[column];
            if (row[column] == null)
              values += 'null,';
            else if (info.jsType == 'number')
              values += row[column] + ',';
            else values += "'" + row[column] + "',";
          }
          columns = columns.substring(0, columns.length - 1) + ')';
          values = values.substring(0, values.length - 1) + ')';
          sql += `insert into ${tab.table}${columns} ${values};`;
        } else if (row[this.hiddenFieldState] == 'delete') {
          let primaryColumnData = '';
          for (let column of primaryColumns) {
            let info = columnInfos[column];
            primaryColumnData += `${column}=`;
            if (row[column] == null)
              primaryColumnData += 'null and ';
            else if (info.jsType == 'number')
              primaryColumnData += `${row[column]} and `
            else primaryColumnData += `'${row[column]}' and `
            change = true;
          }
          primaryColumnData = primaryColumnData.substring(0, primaryColumnData.length - 5);
          sql += `delete from ${tab.table} where ${primaryColumnData};`
        }
      }
      return sql;
    },
    async saveResult(tab) {
      let dc = this.dbc[tab.dcIndex];
      tab.wait = true;
      let cn = await this.getConnection(dc.dbType, dc.info, dc.items[tab.dbIndex].label);
      tab.db = cn;
      tab.runId = await cn.executeAsync(tab.explain, null, () => {
        cn.close();
        tab.dataChange = false;
        tab.wait = false;
        this.refreshResult(tab);
      }, (e) => {
        tab.wait = false;
        cn.close();
        this.$message({
          duration: 3000,
          message: e,
          type: 'error'
        })
      })
    },
    resetResult(tab) {
      for (let i = 0; i < tab.data.length; i++) {
        let row = tab.data[i];
        if (row[this.hiddenFieldState] == 'insert') {
          tab.data.splice(i, 1);
          i--;
        } else if (row[this.hiddenFieldState] == 'update') {
          for (let column in row) {
            row[column] = row[this.hiddenFieldPrefix + column];
          }
        }
        row[this.hiddenFieldState] = null;
      }
      tab.dataChange = false;
    },
    async refreshResult(tab) {
      let dc = this.dbc[tab.dcIndex];
      tab.wait = true;
      let cn = await this.getConnection(dc.dbType, dc.info, dc.items[tab.dbIndex].label);
      tab.explain = tab.sql;
      tab.runId = cn.selectAsync(tab.sql, null, (rs) => {
        cn.close();
        tab.dataChange = false;
        tab.wait = false;
        rs.splice(0, 1);
        tab.data = this.setDuplicateData(rs);
      }, (e) => {
        cn.close();
        tab.wait = false;
        this.$message({
          duration: 3000,
          message: e,
          type: 'error'
        })
      })
    },
    pagingChange(tab, e) {
      tab.data_index = e;
      this.loadTableData(tab, tab.table, this.dbc[tab.dcIndex].items[tab.dbIndex].label);
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
      let path = this.treeNodeFindById(node.data.id);
      this.tabs.push({
        id: Date.now(),
        type: 2,
        name: this.global.locale.new_table,
        columns: [{ display: 'column_name', name: 'name', width: 150, type: 'text' },
        { display: 'data_type', name: 'type', width: 100, type: 'select', value: Object.keys(this.db[this.getDBCByNode(node).dbType].dataType) },
        { display: 'length', name: 'length', width: 80, type: 'number' },
        { display: 'decimals', name: 'decimals', width: 80, type: 'number' },
        { display: 'not_null', name: 'notNull', width: 80, type: 'checkbox' },
        { display: 'key', name: 'key', width: 80, type: 'checkbox' },
        { display: 'comment', name: 'comment', width: 200, type: 'text' },
        ],
        data: [],
        dcIndex: path[0],
        dbIndex: path[1]
      })
      let tab = this.tabs[this.tabs.length - 1];
      this.addNewTableRow(tab);
      console.log(tab)
    },
    openFileDialog(connection, key) {
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
body,
#app,
.window {
  height: 100%;
  --floor-height: 20px;
}

#app {
  background-color: var(--el-bg-color-page);
  font-size: 14px;
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

.fixed {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  top: 0;
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
        width: 100%;
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

      .new_table {
        width: 100%;
        height: 100%;
      }
    }
  }
}

.table-opt-tool {
  display: flex;
  flex-direction: row;

  .to-left {
    display: flex;
    flex-direction: row;
    flex: 1;
    align-items: center;
  }

  .to-right {
    margin-right: 10px;
    display: flex;
    align-items: center;

    .el-pagination__jump {
      padding-right: 16px;
    }
  }

  .icon {
    margin-right: 6px;
    font-size: 14px;
    padding: 8px;

    &.disable {
      color: var(--el-disabled-text-color);

      &:hover {
        background-color: transparent;
      }
    }

    &:hover {
      background-color: var(--el-fill-color-darker);
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

input::-webkit-inner-spin-button {
  -webkit-appearance: none;
}

input[type='number'] {
  -moz-appearance: textfield;
}
</style>
