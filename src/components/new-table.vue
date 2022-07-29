<template>
    <el-tabs type="border-card">
        <el-tab-pane :label="global.locale.fields">
            <div class="scroll-parent">
                <div class="scroll">
                    <el-table :data="item.data" class="table" border @cell-click="cellClick" highlight-current-row
                        @keydown="stopTab" @current-change="handleCurrentChange">
                        <el-table-column align="center" v-for="(column, i) in item.columns" :key="i"
                            :width="column.width" :prop="column.name" :label="global.locale[column.display]">
                            <template #default="scope">
                                <TableEdit
                                    v-if="scope.row[hiddenFieldHasEdit + column.name] || column.type == 'checkbox'"
                                    :type="column.type" v-model="scope.row[column.name]" :data="column.value"
                                    @next="editBoxNextFocus" @hide="tableEditBoxHide(item, scope.row, column.name)"
                                    :focus="scope.row[hiddenFieldHasEdit + column.name]">
                                </TableEdit>
                                <span class="defaultText" :class="{ 'null': scope.row[column.name] == null }" v-else>{{
                                        scope.row[column.name]
                                }}</span>
                            </template>
                        </el-table-column>
                    </el-table>
                </div>
            </div>
            <el-form class="setting">
                <el-form-item
                    v-if="selectRow && selectRow.type && databaseTemplate[dbc.dbType].dataType[selectRow.type].jsType == 'select'"
                    :label="global.locale.value" :label-width="140" key="_">
                    <TableEdit :autoFocus="false" type="select" modelValue="" :data="selectRow.selectData" selectNew
                        @new="openDefineNewDialog">
                    </TableEdit>
                </el-form-item>
                <template v-if="selectRow && selectRow.type" size="mini"
                    v-for="(value, key) in databaseTemplate[dbc.dbType].dataType[selectRow.type]">
                    <el-form-item v-if="key != 'jsType'" :label="global.locale[key]" :label-width="140" :key="key">
                        <TableEdit :autoFocus="false" :type="value" v-model="selectRow[key]"
                            :data="key == 'character' ? Object.keys(characterList) : (key == 'collation' ? characterList[selectRow['character']] : [])">
                        </TableEdit>
                    </el-form-item>
                </template>
            </el-form>
        </el-tab-pane>
        <el-tab-pane :label="global.locale.indexs">

        </el-tab-pane>
    </el-tabs>
    <el-dialog v-model="defineNewDialog" :title="global.locale.define_new" width="50%">
        <el-input v-model="defineNewValue" />
        <template #footer>
            <span class="dialog-footer">
                <el-button @click="closeDialog('defineNewDialog')">{{ global.locale.cancel }}</el-button>
                <el-button type="primary" @click="defineNew">{{ global.locale.ok }}</el-button>
            </span>
        </template>
    </el-dialog>
</template>
<script>
import TableEdit from './table-edit.vue'
import databaseTemplate from '../assets/js/database-template';
import databaseConnecton from '../assets/js/database-connecton';
export default {
    data() {
        return {
            hiddenFieldHasEdit: "__$i",
            hiddenFieldPrefix: "__$",
            hiddenFieldState: "__$$state$",
            editFieldPosition: null,
            selectRow: null,
            databaseTemplate: databaseTemplate,
            characterList: {},
            defineNewDialog: false,
            defineNewValue: null,
            dialogVisible: false
        };
    },
    props: {
        item: Object,
        addRow: Function,
        generateSQL: Function,
        dbc: Object
    },
    mounted() {
        this.loadCharacter();
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
        cellClick(row, column, dom) {
            if (this.editFieldPosition)
                this.editFieldPosition.row[this.hiddenFieldHasEdit + this.editFieldPosition.column] = false;
            row[this.hiddenFieldHasEdit + column.property] = true;
            this.editFieldPosition = { row, column: column.property }
        },
        tableEditBoxHide(item, row, columnName) {
            row[this.hiddenFieldHasEdit + columnName] = false;
            let diff = row[this.hiddenFieldPrefix + columnName] != row[columnName];
            item.dataChange = item.dataChange || diff;
            if (diff) {
                if (!row[this.hiddenFieldState])
                    row[this.hiddenFieldState] = "update";
                this.generateSQL(this.item);
            }
        },
        editBoxNextFocus() {
            if (!this.editFieldPosition) return;
            this.editFieldPosition.row[this.hiddenFieldHasEdit + this.editFieldPosition.column] = false;
            setTimeout(() => {
                let row = this.item.data.findIndex(e => e == this.editFieldPosition.row);
                let find = -1;
                for (let column of this.item.columns) {
                    if (find == 1) {
                        find = column.name;
                        break
                    } else if (this.editFieldPosition.column == column.name) {
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
                this.item.data[row][this.hiddenFieldHasEdit + find] = true;
                this.editFieldPosition = { row: this.item.data[row], column: find }
            }, 10);
        },
        stopTab(e) {
            if (e.code == 'Tab') {
                e.stopPropagation();
                e.preventDefault();
            }
        },
        handleCurrentChange(data) {
            this.selectRow = this.item.data[this.item.data.findIndex(e => e == data)];
        },
        openDefineNewDialog() {
            this.defineNewDialog = true;
            this.defineNewValue = null;
        },
        closeDialog(name) {
            this[name] = false;
        },
        defineNew() {
            this.defineNewDialog = false;
            if (this.defineNewValue) {
                this.selectRow.selectData.push(this.defineNewValue);
            }
        }
    },
    components: { TableEdit }
}
</script>
<style lang="scss">
.scroll-parent {
    flex: 1;
    position: relative;
}

.setting {
    height: 30%;
    min-height: 130px;

    .el-form-item {
        margin-bottom: 0;

        .el-input {
            width: 60%;
        }
    }
}
</style>