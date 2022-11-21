<template>
    <div class="data-table">
        <Fixed class="content">
            <el-table :data="item.data" class="table" @cell-click="cellClick" border highlight-current-row
                :row-class-name="tableRowClassName" @current-change="handleCurrentChange(item, $event)"
                @keydown="tableDownKey" tabindex="0" @cell-contextmenu="cellContenxtMenu"
                @header-contextmenu="headerContextMenu">
                <el-table-column align="center" type="index" fixed width="50" />
                <el-table-column v-for="(column, k) in item.columns" :kye="k" :prop="column.name" :label="column.name"
                    :width="130" align="center">
                    <template #default="scope">
                        <template v-if="selectCell && selectCell.row == scope.row && selectCell.column == column.name">
                            <TableEdit
                                v-if="selectCell.hasEdit && dbTemplate.dataType[column.type] && dbTemplate.dataType[column.type].jsType"
                                v-model="scope.row[column.name]" :type="dbTemplate.dataType[column.type].jsType"
                                :data="getColumnData(column)" @hide="tableEditBoxHide(item, scope.row, column.name)"
                                @next="editBoxNextFocus">
                            </TableEdit>
                            <span class="defaultText select" tabindex="0"
                                @keydown="textDownKey($event, scope.row, column.name)"
                                :class="{ 'null': scope.row[column.name] == null }" v-else>{{
                                        dataFormat(dbTemplate.dataType[column.type] &&
                                            dbTemplate.dataType[column.type].jsType,
                                            scope.row[column.name])
                                }}</span>
                        </template>
                        <template v-else>
                            <span class="defaultText" tabindex="0"
                                @keydown="textDownKey($event, scope.row, column.name)"
                                :class="{ 'null': scope.row[column.name] == null }">{{
                                        dataFormat(dbTemplate.dataType[column.type] &&
                                            dbTemplate.dataType[column.type].jsType,
                                            scope.row[column.name])
                                }}</span>
                        </template>
                    </template>
                </el-table-column>
            </el-table>
        </Fixed>
        <div class="table-opt-tool">
            <div class="to-left">
                <span class="icon iconfont icon-zengjia" :class="{ 'disable': item.table == null }"
                    @click="item.table != null && addRow(item)"></span>
                <span :class="{ 'disable': item.selected == null || item.table == null }"
                    class="icon iconfont icon-jian"
                    @click="item.selected != null && item.table != null && removeRow()"></span>
                <span :class="{ 'disable': !item.$change }" class="icon iconfont icon-duihao"
                    @click="item.$change && saveResult(item)"></span>
                <span :class="{ 'disable': !item.$change }" class="icon iconfont icon-cha"
                    @click="item.$change && resetResult(item)"></span>
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
        <ContextMenu ref="contextmenu"></ContextMenu>
    </div>
</template>
<script>
import TableEdit from './table-edit.vue';
import Fixed from './fixed.vue';
import databaseConnecton from '../assets/js/database-connecton';
import databaseTemplate from '../assets/js/database-template';
import ContextMenu from './context-menu.vue';
export default {
    data() {
        return {
            selectCell: null,
            dbTemplate: null,
            menuCell: [{
                name: 'set_null',
                onClick: this.setNull
            }, {
                name: 'delete_row',
                divided: true,
                onClick: this.removeRow
            }, {
                name: 'copy',
                divided: true,
                items: [{
                    name: 'copy_insert_sql',
                    onClick: this.copyInsertSQL
                }, {
                    name: 'copy_update_sql',
                    onClick: this.copyUpdateSQL
                }, {
                    name: 'copy_tap_separated',
                    onClick: this.copyTapSeparated
                }]
            }],
            menuHeader: [{
                name: 'copy',
                onClick: this.copyHeader
            }, {
                name: 'copy',
                items: [{
                    name: 'column',
                    onClick: this.copyHeaderColumn
                }]
            }]
        };
    },
    props: {
        item: Object,
        loadTableData: Function
    },
    mounted() {
        this.dbTemplate = databaseTemplate[this.item.dbc.dbType];
        console.log(this.item);
    },
    methods: {
        tableEditBoxHide(item, row, columnName) {
            if (this.selectCell && this.selectCell.row == row && this.selectCell.column == columnName)
                this.selectCell.hasEdit = false;
            let diff = row[this.constant.hiddenFieldPrefix + columnName] != row[columnName];
            if (!diff) return;
            item.$change = true;
            if (!row[this.constant.hiddenFieldState])
                row[this.constant.hiddenFieldState] = "update";
            item.explain = this.dbTemplate.onDataChange(item);

        },
        handleCurrentChange(tab, data) {
            tab.selected = tab.data.findIndex(e => e == data);
        },
        tableRowClassName({ row, index }) {
            return row[this.constant.hiddenFieldState] || "";
        },
        dataFormat(type, data) {
            if (data == null) {
                return "(Null)";
            }
            else if (type == "date") {
                return this.dateFormat(data);
            }
            else if (type == "datetime" || type == "timestamp") {
                return this.dateTimeFormat(data);
            }
            else {
                return data;
            }
        },
        cellClick(row, column, dom) {
            this.selectCell = { row, column: column.label, hasEdit: true }
        },
        editBoxNextFocus() {
            if (!this.selectCell) return;
            let row = this.item.data.findIndex(e => e == this.selectCell.row);
            let find = -1;
            for (let column of this.item.columns) {
                if (find == 1) {
                    find = column.name;
                    break
                } else if (this.selectCell.column == column.name) {
                    find = 1;
                }
            }
            if (find == 1) {
                row++;
                find = this.item.columns[0].name;
            }
            if (row == this.item.data.length) {
                this.addRow(this.item);
            }
            this.selectCell = { row: this.item.data[row], column: find, hasEdit: true }
        },
        tableDownKey(e) {
            if (e.code == 'Tab') {
                e.stopPropagation();
                e.preventDefault();
            } else if (e.ctrlKey && e.key.toLowerCase() == 'c') {
                this.copyTapSeparated();
            }
        },
        textDownKey(e, row, columnName) {
            if (e.ctrlKey && e.key.toLowerCase() == 'c') {
                navigator.clipboard.writeText(row[columnName]);
            }
        },
        getColumnData(column) {
            if (!column.value) return null;
            console.log(column.value)
            let values = column.value.split(',');
            let items = [];
            for (let value of values) {
                items.push(value.substring(1, value.length - 1))
            }
            return items;
        },
        addRow(tab) {
            let row = {};
            row[this.constant.hiddenFieldState] = 'insert';
            for (let column of tab.columns) {
                row[column.name] = null;
            }
            tab.data.push(row);
            tab.$change = true;
            tab.explain = this.dbTemplate.onDataChange(tab);
        },
        removeRow() {
            console.log('remove')
            let data = this.item.data[this.item.selected];
            if (data[this.constant.hiddenFieldState] == 'insert') {
                this.item.data.splice(this.item.selected, 1)
            } else {
                this.item.$change = true;
                data[this.constant.hiddenFieldState] = 'delete';
            }
            this.item.explain = this.dbTemplate.onDataChange(this.item);
        },
        async saveResult(tab) {
            tab.wait = true;
            let cn = await databaseConnecton.getConnection(tab.dbc.dbType, tab.dbc.info, tab.db.label);
            tab.$cn = cn;
            tab.runId = await cn.executeAsync(tab.explain, null, () => {
                cn.close();
                tab.$change = false;
                tab.wait = false;
                this.refreshResult(tab);
            }, (e) => {
                tab.wait = false;
                cn.close();
                this.error(e);
            })
        },
        async refreshResult(tab) {
            tab.wait = true;
            let cn = await databaseConnecton.getConnection(tab.dbc.dbType, tab.dbc.info, tab.db.label);
            tab.$cn = cn;
            tab.explain = tab.sql;
            tab.runId = cn.selectAsync(tab.sql, null, (rs) => {
                cn.close();
                tab.$change = false;
                tab.wait = false;
                rs.splice(0, 1);
                tab.data = this.setDuplicateData(rs);
            }, (e) => {
                cn.close();
                tab.wait = false;
                this.error(e);
            })
        },
        resetResult(tab) {
            for (let i = 0; i < tab.data.length; i++) {
                let row = tab.data[i];
                if (row[this.constant.hiddenFieldState] == 'insert') {
                    tab.data.splice(i, 1);
                    i--;
                } else if (row[this.constant.hiddenFieldState] == 'update') {
                    for (let column in row) {
                        if (column.startsWith(this.constant.hiddenFieldPrefix)) continue;
                        row[column] = row[this.constant.hiddenFieldPrefix + column];
                    }
                }
                row[this.constant.hiddenFieldState] = null;
            }
            tab.$change = false;
        },
        setDuplicateData(data) {
            for (let row of data) {
                for (let column in row) {
                    row[this.constant.hiddenFieldPrefix + column] = row[column];
                }
            }
            return data;
        },
        pagingChange(tab, e) {
            tab.data_index = e;
            this.loadTableData(tab, tab.table);
        },
        cellContenxtMenu(row, column, cell, event) {
            if (this.item.columns.findIndex(e => e.type ? true : false) == -1) return;
            this.item.selected = this.item.data.findIndex(e => e == row);
            this.selectCell = { row, column: column.label, hasEdit: false }
            this.$refs.contextmenu.show(event.path[1], this.menuCell);
        },
        setNull() {
            this.selectCell.row[this.selectCell.column] = null;
            this.selectCell.row[this.constant.hiddenFieldState] = "update";
            this.item.$change = true;
            this.item.explain = this.dbTemplate.onDataChange(this.item);
        },
        copyInsertSQL() {
            navigator.clipboard.writeText(this.dbTemplate.onCopyRowInsert(this.item, this.selectCell.row));
        },
        copyUpdateSQL() {
            navigator.clipboard.writeText(this.dbTemplate.onCopyRowUpdate(this.item, this.selectCell.row));
        },
        headerContextMenu(column, e) {
            console.log(column)
            this.$refs.contextmenu.show(e.path[1], this.menuHeader, column);
        },
        copyHeader(column) {
            navigator.clipboard.writeText(column.label);
        },
        copyHeaderColumn(column) {
            let s = '';
            for (let row of this.item.data) {
                s += row[column.label] + '\n';
            }
            if (s.length) {
                s = s.substring(0, s.length - 1);
            }
            navigator.clipboard.writeText(s);
        },
        copyTapSeparated() {
            let s = '';
            let row = this.item.data[this.item.selected];
            if (this.selectCell.column) return;
            for (let key in row) {
                if (key.startsWith(this.constant.hiddenFieldPrefix)) continue;
                s += (row[key] || null) + '\t';
            }
            if (s.length) {
                s = s.substring(0, s.length - 1);
            }
            navigator.clipboard.writeText(s);
        }
    },
    components: { TableEdit, Fixed, ContextMenu }
}
</script>
<style lang="scss">
.data-table {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;

    .content {
        flex: 1;
    }
}

.el-table.table {
    width: 100%;
    height: 100%;
    font-size: 10px;

    .input input {
        text-align: center;
    }

    .cell {
        padding: 0;
        white-space: nowrap;
    }

    .el-table__header-wrapper {
        .el-table__cell {
            padding: 6px 0;
        }
    }


    .el-table__body-wrapper {
        .el-table__cell {
            padding: 0;
        }

        .column {
            display: inline-block;
            padding: 8px 12px;
        }
    }

    .insert {
        .el-table__cell {
            background-color: var(--el-color-success-light-9) !important;
        }
    }

    .delete {
        .el-table__cell {
            background-color: var(--el-color-danger-light-9) !important;
        }
    }

    .update {
        .el-table__cell {
            background-color: var(--el-color-warning-light-9) !important;
        }
    }

    .defaultText {
        display: inline-block;
        padding: 4px 2px;
        white-space: nowrap;
        width: 100%;
        height: 100%;
        box-sizing: border-box;
        border: 1px solid transparent;

        &.null {
            color: var(--el-color-info-light-7)
        }

        &:focus {
            outline: none;
        }

        &.select {
            border: 1px solid var(--el-color-info-light-5);
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
</style>