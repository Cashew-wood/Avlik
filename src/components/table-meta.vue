<template>
    <div class="new-table" ref="newTable" v-if="item.subtabs">
        <div class="new-table-tool">
            <div class="item" @click="save">
                <Finished class="save icon" />
                <span class="label">{{ global.locale.save }}</span>
            </div>
            <div class="item" :class="{ 'disable': item.subtabs[subtabIndex] == null }"
                @click="item.subtabs[subtabIndex] != null && addNewTableRow(item.subtabs[subtabIndex].columns, item.subtabs[subtabIndex].data)">
                <CirclePlus class="add icon" />
                <span class="label">{{ global.locale.add_field }}</span>
            </div>
            <div class="item" :class="{ 'disable': item.subtabs[subtabIndex] == null }"
                @click="item.subtabs[subtabIndex] != null && insertRow()">
                <TopLeft class="insert icon" />
                <span class="label">{{ global.locale.insert_field }}</span>
            </div>
            <div class="item"
                :class="{ 'disable': item.subtabs[subtabIndex] == null || item.subtabs[subtabIndex].selectRow == null }"
                @click="item.subtabs[subtabIndex] != null && item.subtabs[subtabIndex].selectRow != null && removeRow()">
                <Remove class="remove icon" />
                <span class="label">{{ global.locale.del_field }}</span>
            </div>
            <div class="item" :class="{ 'disable': item.subtabs[subtabIndex] == null }"
                @click="item.subtabs[subtabIndex] != null && rowMove(true)">
                <Top class="up icon" />
                <span class="label">{{ global.locale.up_move }}</span>
            </div>
            <div class="item" :class="{ 'disable': item.subtabs[subtabIndex] == null }"
                @click="item.subtabs[subtabIndex] != null && rowMove(false)">
                <Bottom class="down icon" />
                <span class="label">{{ global.locale.down_move }}</span>
            </div>
        </div>
        <el-tabs type="border-card" @tab-change="tabChange" class="new-table-main" v-model="subtabIndex">
            <el-tab-pane v-for="(subtab, i) in item.subtabs" :label="global.locale[subtab.name]" :key="i" :name="i">
                <div class="scroll-parent">
                    <div class="scroll">
                        <el-table :data="subtab.data" class="table" border
                            @cell-click="(a, b) => { cellClick(subtab, a, b) }" :ref="'table_' + i"
                            highlight-current-row @keydown="stopTab"
                            @current-change="handleCurrentChange(subtab, $event)">
                            <el-table-column align="center" v-for="(column, i) in subtab.columns" :key="i"
                                :width="column.width" :prop="column.name" :label="global.locale[column.name]">
                                <template #default="scope">
                                    <TableEdit
                                        v-if="scope.row[hiddenFieldHasEdit] == column.name || column.type == 'checkbox'"
                                        :type="column.type" v-model="scope.row[column.name]" :data="column.$items"
                                        :row="scope.row" @next="editBoxNextFocus(subtab)"
                                        :style="{ 'width': column.width || '' }"
                                        @hide="tableEditBoxHide(subtab, scope.row, column)"
                                        :focus="scope.row[hiddenFieldHasEdit] == column.name">
                                    </TableEdit>
                                    <span class="defaultText" :class="{ 'null': scope.row[column.name] == null }"
                                        v-else>{{
                                                scope.row[column.name]
                                        }}</span>
                                </template>
                            </el-table-column>
                        </el-table>
                    </div>
                </div>
                <Fixed class="setting" v-if="subtab.panel && subtab.selectRow">
                    <el-scrollbar :class="{ 'full': subtab.panel.full }">
                        <el-form :label-position="subtab.panel.direction || 'right'">
                            <template v-for="(column, i) in subtab.panel.form">
                                <el-form-item :label="global.locale[column.name]" :label-width="150">
                                    <Codemirror v-if="column.type == 'code'" ref="editor"
                                        v-model:value="subtab.selectRow[column.name]" class="form-value"
                                        :options="cmOptions"></Codemirror>
                                    <TableEdit v-else :autoFocus="false" :type="column.type"
                                        :style="{ 'width': column.width || '' }" v-model="subtab.selectRow[column.name]"
                                        :data="column.$items"
                                        @change="column.onChange && column.onChange(item, subtab, column, $event)"
                                        class="form-value" />
                                    <el-button class="link" v-if="column.multiple" link type="primary"
                                        @click="openDefineNewDialog(subtab, column)">...</el-button>
                                </el-form-item>
                            </template>
                        </el-form>
                    </el-scrollbar>
                </Fixed>
            </el-tab-pane>
            <el-tab-pane v-if="item.subtabs.length" :label="global.locale.comment">
                <el-input class="comment" v-model="item.comment" type="textarea" resize="none"
                    :input-style="{ 'height': '100%' }" style="height:100%" />
            </el-tab-pane>
            <el-tab-pane v-if="item.subtabs.length" :label="global.locale.sql_preview">
                <div class="scroll">
                    <Codemirror ref="editor" v-model:value="sql" :options="readOnlyOptions" height="100%"></Codemirror>
                </div>
            </el-tab-pane>
        </el-tabs>
        <el-dialog v-model="defineNewDialog" :title="global.locale.define_new" width="50%">
            <el-scrollbar height="200px">
                <div v-for="(item, i) in defineNewValue" class="define-new-row">
                    <el-input class="define-new-input" v-model="defineNewValue[i]" />
                    <el-button class="define-new-link" link type="primary" @click="addNewRow(i)">
                        <Plus class="icon" />
                    </el-button>
                    <el-button class="define-new-link" link type="primary" @click="delRow(i)">
                        <Minus class="icon" />
                    </el-button>
                </div>
            </el-scrollbar>
            <template #footer>
                <span class="dialog-footer">
                    <el-button @click="defineNewDialog = false">{{ global.locale.cancel }}</el-button>
                    <el-button type="primary" @click="defineNew">{{ global.locale.ok }}</el-button>
                </span>
            </template>
        </el-dialog>
        <el-dialog v-model="tableNameVisible" :title="global.locale.table_name" width="50%">
            <el-form>
                <el-form-item :label="global.locale.name">
                    <el-input v-model="item.table" />
                </el-form-item>
            </el-form>
            <template #footer>
                <span class="dialog-footer">
                    <el-button @click="tableNameVisible = false">{{ global.locale.cancel }}</el-button>
                    <el-button type="primary" @click="saveTable">{{ global.locale.ok }}</el-button>
                </span>
            </template>
        </el-dialog>
    </div>
</template>
<script>
import TableEdit from './table-edit.vue'
import databaseTemplate from '../assets/js/database-template';
import databaseConnecton from '../assets/js/database-connecton';
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
import 'codemirror/addon/scroll/simplescrollbars.js'
import 'codemirror/addon/scroll/simplescrollbars.css'
import Fixed from './fixed.vue';
let dbTemplate = null;
export default {
    data() {
        return {
            readOnlyOptions: {
                mode: "text/x-mysql",
                theme: "dracula",
                lineNumbers: true,
                smartIndent: true,
                indentUnit: 2,
                foldGutter: true,
                styleActiveLine: true,
                readOnly: true,
                scrollbarStyle: 'overlay'
            },
            cmOptions: {
                mode: "text/x-mysql",
                theme: "dracula",
                lineNumbers: true,
                smartIndent: true,
                indentUnit: 2,
                foldGutter: true,
                styleActiveLine: true,
                scrollbarStyle: 'overlay'
            },
            hiddenFieldHasEdit: "__$$edit$",
            hiddenFieldPrefix: "__$",
            hiddenFieldState: "__$$state$",
            editFieldPosition: null,
            databaseTemplate: databaseTemplate,
            defineNewDialog: false,
            defineNewValue: [],
            dialogVisible: false,
            sql: '',
            subtabIndex: 0,
            tableNameVisible: false
        };
    },
    props: {
        item: Object
    },
    mounted() {
        dbTemplate = databaseTemplate[this.item.dbc.dbType];
        this.item.subtabs = new dbTemplate.table.Metatable()

        dbTemplate.table.onCreate(this.item);
        for (let subtab of this.item.subtabs) {
            if (!subtab.data.length)
                this.addNewTableRow(subtab.columns, subtab.data);
        }
    },
    emits: ['add', 'design'],
    methods: {
        addNewTableRow(columns, data, insert) {
            let emptyRow = {};
            for (let column of columns) {
                if (column.type == 'checkbox') {
                    emptyRow[column.name] = column.default || false;
                } else
                    emptyRow[column.name] = null;
            }
            if (insert != null) {
                data.splice(insert, 0, emptyRow);
            } else {
                data.push(emptyRow)
            }
        },
        cellClick(subtab, row, column) {
            if (subtab.editFieldPosition) {
                if (subtab.editFieldPosition.row[this.hiddenFieldHasEdit]) {
                    subtab.editFieldPosition.row[this.hiddenFieldHasEdit] = null;
                    let column = subtab.columns[subtab.columns.findIndex(e => e.name == subtab.editFieldPosition.column)]
                    column.onChange && column.onChange(this.item, subtab, row, row[subtab.editFieldPosition.column]);
                }
            }
            row[this.hiddenFieldHasEdit] = column.property;
            subtab.editFieldPosition = { row, column: column.property }
            console.log(row.fields)
        },
        tableEditBoxHide(subtab, row, column) {
            let columnName = column.name;
            if (row[this.hiddenFieldHasEdit] == columnName)
                row[this.hiddenFieldHasEdit] = null;
            let diff = row[this.hiddenFieldPrefix + columnName] != row[columnName];
            if (diff) {
                if (!row[this.hiddenFieldState]) row[this.hiddenFieldState] = "update";
                let column = subtab.columns[subtab.columns.findIndex(e => e.name == columnName)]
                column.onChange && column.onChange(this.item, subtab, row, row[columnName]);
                subtab.onChange && subtab.onChange(this.item, subtab, row, column)
            }
            return diff;
        },
        editBoxNextFocus(subtab) {
            if (!subtab.editFieldPosition) return;
            if (subtab.editFieldPosition.row[this.hiddenFieldHasEdit] == subtab.editFieldPosition.column)
                subtab.editFieldPosition.row[this.hiddenFieldHasEdit] = null;
            let row = subtab.data.findIndex(e => e == subtab.editFieldPosition.row);
            let find = -1;
            for (let column of subtab.columns) {
                if (find == 1) {
                    find = column.name;
                    break
                } else if (subtab.editFieldPosition.column == column.name) {
                    find = 1;
                }
            }
            if (find == 1) {
                row++;
                find = subtab.columns[0].name;
            }
            if (row == subtab.data.length) {
                this.addNewTableRow(subtab.columns, subtab.data);
            }
            subtab.data[row][this.hiddenFieldHasEdit] = find;
            subtab.editFieldPosition = { row: subtab.data[row], column: find }
            this.$refs['table_' + this.subtabIndex][0].setCurrentRow(subtab.data[row]);
        },
        stopTab(e) {
            if (e.code == 'Tab') {
                e.stopPropagation();
                e.preventDefault();
            }
        },
        handleCurrentChange(subtab, row) {
            subtab.selectRow = subtab.data[subtab.data.findIndex(e => e == row)];
            row && subtab.onChange && subtab.onChange(this.item, subtab, row, null);
        },
        openDefineNewDialog(subtab, column) {
            this.defineNewDialog = true;
            subtab.selectColumn = column;
            if (subtab.selectRow[column.name]) {
                this.defineNewValue = column.deserialization('multiple', subtab.selectRow[column.name]);
            } else {
                this.defineNewValue = [null];
            }
        },
        defineNew() {
            let subtab = this.item.subtabs[this.subtabIndex];
            this.defineNewDialog = false;
            if (this.defineNewValue) {
                subtab.selectRow[subtab.selectColumn.name] = subtab.selectColumn.serialize('multiple', this.defineNewValue);
            }
        },
        addNewRow(i) {
            this.defineNewValue.splice(i + 1, 0, "");
        },
        delRow(i) {
            this.defineNewValue.splice(i, 1);
        },
        tabChange(index) {
            index = parseInt(index);
            try {
                if (index == 5) {
                    if (this.item.design) {
                        this.sql = dbTemplate.table.update(this.item);
                    } else {
                        this.sql = dbTemplate.table.create(this.item);
                    }
                }
                if (this.item.subtabs[index])
                    for (let column of this.item.subtabs[index].columns) {
                        column.onChangeTab && column.onChangeTab(this.item, this.item.subtabs[index], column);
                    }
            } catch (e) {
                console.error(e);
            }
        },
        save() {
            if (this.item.design) {
                this.saveTable();
                return;
            }
            this.tableNameVisible = true;
        },
        saveTable() {
            this.tableNameVisible = false;
            if (this.item.design) {
                this.sql = dbTemplate.table.update(this.item);
            } else {
                this.sql = dbTemplate.table.create(this.item);
            }
            let instance = this.$loading({ target: this.$refs.newTable, fullscreen: false })
            try {
                databaseConnecton.use(this.item.dbc, this.item.db.label, async (dc) => {
                    try {
                        await dc.execute(this.sql);
                        this.$emit(this.item.design ? 'design' : 'add', this.item.table);
                        this.item.subtabs = new dbTemplate.table.Metatable()
                        this.item.design = true;
                        dbTemplate.table.onCreate(this.item);
                        instance.close();
                    } catch (e) {
                        console.error(e)
                        instance.close();
                        this.$alert(e, this.global.locale.prompt);
                    }
                })
            } catch (e) {
                console.error(e)
                this.$alert(e, this.global.locale.prompt);
            }
        },
        insertRow() {
            if (this.item.subtabs[this.subtabIndex].selectRow) {
                this.addNewTableRow(this.item.subtabs[this.subtabIndex].columns, this.item.subtabs[this.subtabIndex].data,
                    this.item.subtabs[this.subtabIndex].data.findIndex(e => e == this.item.subtabs[this.subtabIndex].selectRow));
            } else {
                this.addNewTableRow(this.item.subtabs[this.subtabIndex].columns, this.item.subtabs[this.subtabIndex].data);
            }
        },
        removeRow() {
            this.item.subtabs[this.subtabIndex].data.splice(this.item.subtabs[this.subtabIndex].data.findIndex(e => e == this.item.subtabs[this.subtabIndex].selectRow), 1);
        },
        rowMove(up) {
            let index = this.item.subtabs[this.subtabIndex].data.findIndex(e => e == this.item.subtabs[this.subtabIndex].selectRow);
            if (up) {
                if (index == 0) return;
                this.item.subtabs[this.subtabIndex].data[index] = this.item.subtabs[this.subtabIndex].data[index - 1];
                this.item.subtabs[this.subtabIndex].data[index - 1] = this.item.subtabs[this.subtabIndex].selectRow;
            } else {
                if (index == this.item.subtabs[this.subtabIndex].data.length - 1) return;
                this.item.subtabs[this.subtabIndex].data[index] = this.item.subtabs[this.subtabIndex].data[index + 1];
                this.item.subtabs[this.subtabIndex].data[index + 1] = this.item.subtabs[this.subtabIndex].selectRow;
            }
        }

    },
    components: { TableEdit, Codemirror, Fixed }
}
</script>
<style lang="scss">
.new-table {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;

}

.new-table-main {
    flex: 1;
}

.scroll-parent {
    flex: 1;
    position: relative;
}
.setting {
    height: 30% !important;
    min-height: 130px;
    margin-top: 6px;

    .el-form-item {
        margin-bottom: 0;
    }

    .link {
        margin-left: 10px;
    }

    .full {

        .el-form,
        .el-form-item,
        .el-scrollbar__view {
            height: 100%;
        }

        .el-form-item {
            display: flex;
            flex-direction: column;
        }

        .el-form-item__content {
            height: calc(100% - 30px);
            line-height: normal;
        }
    }
}

.define-new-row {
    margin-bottom: 8px;
}

.define-new-input.el-input {
    width: calc(100% - 90px);
}

.define-new-link {
    margin-left: 10px;

    .icon {
        width: 16px;
        height: 16px;
    }
}

.new-table-tool {
    display: flex;
    flex-direction: row;
    align-items: center;
    margin-bottom: 4px;

    .icon {
        width: 16px;
        height: 16px;
        transform: translateY(2px);
        margin-right: 6px;
        color: var(--el-color-primary)
    }

    .item {
        padding: 6px 6px;

        &:hover {
            background-color: var(--el-fill-color-darker);
        }

        &.disable {

            .label,
            .icon {
                color: var(--el-disabled-text-color);
            }

            &:hover {
                background-color: transparent;
            }
        }
    }

}
</style>