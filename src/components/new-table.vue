<template>
    <div class="new-table" ref="newTable">
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
                            @cell-click="(a, b) => { cellClick(subtab, a, b) }" highlight-current-row @keydown="stopTab"
                            @current-change="handleCurrentChange(subtab, $event)">
                            <el-table-column align="center" v-for="(column, i) in subtab.columns" :key="i"
                                :width="column.width" :prop="column.name" :label="global.locale[column.name]">
                                <template #default="scope">
                                    <TableEdit
                                        v-if="scope.row[hiddenFieldHasEdit + column.name] || column.type == 'checkbox'"
                                        :type="column.type" v-model="scope.row[column.name]" :data="column.value"
                                        :row="scope.row" @next="editBoxNextFocus(subtab)"
                                        @hide="tableEditBoxHide(subtab, scope.row, column.name)"
                                        :focus="scope.row[hiddenFieldHasEdit + column.name]">
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
                <el-form class="setting" v-if="subtab.selectRow && subtab.selectRow.data_type">
                    <el-form-item
                        v-if="databaseTemplate[dbc.dbType].dataType[subtab.selectRow.data_type].jsType == 'select'"
                        :label="global.locale.value" :label-width="140" key="_">
                        <TableEdit :autoFocus="false" type="text" v-model="subtab.selectRow.selectData">
                        </TableEdit>
                        <el-button class="link" link type="primary" @click="openDefineNewDialog(subtab)">...</el-button>
                    </el-form-item>
                    <template v-for="(value, key) in databaseTemplate[dbc.dbType].dataType[subtab.selectRow.data_type]">
                        <el-form-item v-if="key != 'jsType'" :label="global.locale[key]" :label-width="140" :key="key">
                            <TableEdit :autoFocus="false" :type="value" v-model="subtab.selectRow[key]"
                                :data="key == 'character' ? Object.keys(characterList) : (key == 'collation' ? characterList[subtab.selectRow['character']] : [])">
                            </TableEdit>
                        </el-form-item>
                    </template>
                </el-form>
                <div class="scroll-setting setting" v-if="subtab.panel && subtab.selectRow">
                    <div class="scroll">
                        <el-scrollbar :class="{ 'full': subtab.panel.full }">
                            <el-form :label-position="subtab.panel.direction || 'right'">
                                <template v-for="(column, i) in subtab.panel.form">
                                    <el-form-item v-if="column.visible(this.item, subtab, subtab.selectRow)"
                                        :label="global.locale[column.name]" :label-width="100">
                                        <Codemirror v-if="column.type == 'code'" ref="editor"
                                            v-model:value="subtab.selectRow[column.name]" class="form-value"
                                            :options="cmOptions"></Codemirror>
                                        <TableEdit v-else :autoFocus="false" :type="column.type"
                                            v-model="subtab.selectRow[column.name]" :data="column.value"
                                            class="form-value" />
                                    </el-form-item>
                                </template>
                            </el-form>
                        </el-scrollbar>
                    </div>
                </div>
            </el-tab-pane>
            <el-tab-pane :label="global.locale.comment">
                <el-input class="comment" v-model="item.comment" type="textarea" />
            </el-tab-pane>
            <el-tab-pane :label="global.locale.sql_preview">
                <Codemirror ref="editor" v-model:value="sql" :options="readOnlyOptions" height="100%"></Codemirror>
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
                    <el-button @click="closeDialog('defineNewDialog')">{{ global.locale.cancel }}</el-button>
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
export default {
    data() {
        return {
            readOnlyOptions: {
                mode: "text/x-sql",
                theme: "dracula",
                lineNumbers: true,
                smartIndent: true,
                indentUnit: 2,
                foldGutter: true,
                styleActiveLine: true,
                readOnly: true
            },
            cmOptions: {
                mode: "text/x-sql",
                theme: "dracula",
                lineNumbers: true,
                smartIndent: true,
                indentUnit: 2,
                foldGutter: true,
                styleActiveLine: true,
                scrollbarStyle: 'overlay'
            },
            hiddenFieldHasEdit: "__$i",
            hiddenFieldPrefix: "__$",
            hiddenFieldState: "__$$state$",
            editFieldPosition: null,
            databaseTemplate: databaseTemplate,
            characterList: {},
            defineNewDialog: false,
            defineNewValue: [],
            dialogVisible: false,
            sql: '',
            subtabIndex: 0,
            tableNameVisible: false
        };
    },
    props: {
        item: Object,
        generateSQL: Function,
        dbc: Object
    },
    mounted() {
        this.loadCharacter();
        for (let subtab of this.item.subtabs) {
            if (!subtab.data.length)
                this.addNewTableRow(subtab.columns, subtab.data);
        }
    },
    methods: {
        async loadCharacter() {
            databaseConnecton.use(this.dbc, this.dbc.items[this.item.dbIndex].label, async (dc) => {
                let data = await dc.select('select * from information_schema.COLLATION_CHARACTER_SET_APPLICABILITY')
                for (let row of data) {
                    if (this.characterList[row.CHARACTER_SET_NAME]) {
                        this.characterList[row.CHARACTER_SET_NAME].push(row.COLLATION_NAME)
                    } else {
                        this.characterList[row.CHARACTER_SET_NAME] = [];
                    }
                }
            })
        },
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
                if (subtab.editFieldPosition.row[this.hiddenFieldHasEdit + subtab.editFieldPosition.column]) {
                    subtab.editFieldPosition.row[this.hiddenFieldHasEdit + subtab.editFieldPosition.column] = false;
                    let column = subtab.columns[subtab.columns.findIndex(e => e.name == subtab.editFieldPosition.column)]
                    column.onChange && column.onChange(this.item, subtab, row, row[subtab.editFieldPosition.column]);
                }
            }
            row[this.hiddenFieldHasEdit + column.property] = true;
            subtab.editFieldPosition = { row, column: column.property }
            console.log(row.fields)
        },
        tableEditBoxHide(subtab, row, columnName) {
            row[this.hiddenFieldHasEdit + columnName] = false;
            let diff = row[this.hiddenFieldPrefix + columnName] != row[columnName];
            subtab.dataChange = subtab.dataChange || diff;
            if (diff) {
                if (!row[this.hiddenFieldState]) row[this.hiddenFieldState] = "update";
                let column = subtab.columns[subtab.columns.findIndex(e => e.name == columnName)]
                column.onChange && column.onChange(this.item, subtab, row, row[columnName]);
            }
            console.log(row)
            return diff;
        },
        editBoxNextFocus(subtab) {
            if (!subtab.editFieldPosition) return;
            subtab.editFieldPosition.row[this.hiddenFieldHasEdit + subtab.editFieldPosition.column] = false;
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
            subtab.data[row][this.hiddenFieldHasEdit + find] = true;
            subtab.editFieldPosition = { row: subtab.data[row], column: find }
        },
        stopTab(e) {
            if (e.code == 'Tab') {
                e.stopPropagation();
                e.preventDefault();
            }
        },
        handleCurrentChange(subtab, row) {
            subtab.selectRow = subtab.data[subtab.data.findIndex(e => e == row)];
            console.log(subtab)
        },
        openDefineNewDialog(subtab) {
            this.defineNewDialog = true;
            if (subtab.selectRow.selectData) {
                let array = subtab.selectRow.selectData.split(',');
                for (let i in array) {
                    array[i] = array[i].substring(1, array[i].length - 1);
                }
                this.defineNewValue = array;
            } else {
                this.defineNewValue = [null];
            }
        },
        closeDialog(name) {
            this[name] = false;
        },
        defineNew() {
            console.log(this.subtabIndex)
            let subtab = this.item.subtabs[this.subtabIndex];
            this.defineNewDialog = false;
            if (this.defineNewValue) {
                let value = ''
                for (let s of this.defineNewValue) {
                    if (s != null)
                        value += `'${s}',`
                }
                if (value.length) {
                    value = value.substring(0, value.length - 1);
                }
                subtab.selectRow.selectData = value;
            }
        },
        addNewRow(i) {
            this.defineNewValue.splice(i + 1, 0, "");
        },
        delRow(i) {
            this.defineNewValue.splice(i, 1);
        },
        tabChange(index) {
            try {
                index = parseInt(index);
                if (index == 5) {
                    this.sql = this.generateSQL(this.item);
                    console.log(this.sql);
                }
                if (this.item.subtabs[index])
                    for (let column of this.item.subtabs[index].columns) {
                        if (column.valueInvoke) {
                            column.value = column.valueInvoke(this.item, this.item.subtabs[index]);
                        }
                    }
            } catch (e) {
                console.error(e)
            }
        },
        save() {
            console.log(this.tableNameVisible, 'show dialog')
            this.tableNameVisible = true;
        },
        saveTable() {
            this.tableNameVisible = false;
            this.sql = this.generateSQL(this.item);
            let instance = this.$loading({ target: this.$refs.newTable, fullscreen: false })
            try {
                databaseConnecton.use(this.dbc, this.dbc.items[this.item.dbIndex].label, async (dc) => {
                    try {
                        await dc.execute(this.sql);
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
    components: { TableEdit, Codemirror }
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

.scroll-setting {
    position: relative;
}

.setting {
    height: 30% !important;
    min-height: 130px;
    margin-top: 6px;

    .el-form-item {
        margin-bottom: 0;

        .el-input {
            width: 60%;
        }
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