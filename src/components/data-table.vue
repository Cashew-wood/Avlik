<template>
    <el-table :data="item.data" class="table" @cell-click="cellClick" border highlight-current-row
        :row-class-name="tableRowClassName" @current-change="handleCurrentChange(item, $event)" @keydown="stopTab">
        <el-table-column align="center" type="index" fixed width="50" />
        <el-table-column v-for="(column, k) in item.columns" :kye="k" :prop="column.name" :label="column.name"
            :width="130" align="center">
            <template #default="scope">
                <TableEdit
                    v-if="scope.row[hiddenFieldHasEdit] == column.name && dbTemplate.dataType[column.type] && dbTemplate.dataType[column.type].jsType"
                    v-model="scope.row[column.name]" :type="dbTemplate.dataType[column.type].jsType"
                    :data="getColumnData(column)" @hide="tableEditBoxHide(item, scope.row, column.name)"
                    @next="editBoxNextFocus">
                </TableEdit>
                <span class="defaultText" :class="{ 'null': scope.row[column.name] == null }" v-else>{{
                        dataFormat(dbTemplate.dataType[column.type] && dbTemplate.dataType[column.type].jsType,
                            scope.row[column.name])
                }}</span>
            </template>
        </el-table-column>
    </el-table>
</template>
<script>
import TableEdit from './table-edit.vue';
export default {
    data() {
        return {
            hiddenFieldHasEdit: "__$$edit$",
            hiddenFieldPrefix: "__$",
            hiddenFieldState: "__$$state$",
            editFieldPosition: null
        };
    },
    props: {
        item: Object,
        generateSQL: Function,
        dbTemplate: Object,
        addRow: Function
    },
    mounted() {

    },
    methods: {
        tableEditBoxHide(item, row, columnName) {
            console.log('hide', columnName)
            if (row[this.hiddenFieldHasEdit] == columnName)
                row[this.hiddenFieldHasEdit] = null;
            let diff = row[this.hiddenFieldPrefix + columnName] != row[columnName];
            item.dataChange = item.dataChange || diff;
            if (diff) {
                if (!row[this.hiddenFieldState])
                    row[this.hiddenFieldState] = "update";
                item.explain = this.generateSQL(item);
            }
        },
        handleCurrentChange(tab, data) {
            tab.selected = tab.data.findIndex(e => e == data);
        },
        tableRowClassName({ row, index }) {
            return row[this.hiddenFieldState] || "";
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
            console.log(row, column)
            row[this.hiddenFieldHasEdit] = column.label;
            this.editFieldPosition = { row, column: column.label }
        },
        editBoxNextFocus() {
            if (!this.editFieldPosition) return;
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
                this.item.data[row][this.hiddenFieldHasEdit] = find;
                this.editFieldPosition = { row: this.item.data[row], column: find }
            }, 10);
        },
        stopTab(e) {
            if (e.code == 'Tab') {
                e.stopPropagation();
                e.preventDefault();
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
        }
    },
    components: { TableEdit }
}
</script>
<style lang="scss">
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

        &.null {
            color: var(--el-color-info-light-7)
        }
    }
}
</style>