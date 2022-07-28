<template>
    <el-tabs type="border-card">
        <el-tab-pane :label="global.locale.fields">
            <div class="scroll">
                <el-table :data="item.data" class="table" border @cell-click="cellClick" highlight-current-row
                    @keydown="stopTab">
                    <el-table-column align="center" v-for="(column, i) in item.columns" :key="i" :width="column.width"
                        :prop="column.name" :label="global.locale[column.display]">
                        <template #default="scope">
                            <TableEdit v-if="scope.row[hiddenFieldHasEdit + column.name] || column.type == 'checkbox'"
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
        </el-tab-pane>
        <el-tab-pane :label="global.locale.indexs">

        </el-tab-pane>
    </el-tabs>
</template>
<script>
import TableEdit from './table-edit.vue'
export default {
    data() {
        return {
            hiddenFieldHasEdit: "__$i",
            hiddenFieldPrefix: "__$",
            hiddenFieldState: "__$$state$",
            editFieldPosition: null
        };
    },
    props: {
        item: Object,
        addRow: Function
    },
    methods: {
        cellClick(row, column, dom) {
            if (this.editFieldPosition)
                this.editFieldPosition.row[this.hiddenFieldHasEdit + this.editFieldPosition.column] = false;
            row[this.hiddenFieldHasEdit + column.property] = true;
            this.editFieldPosition = { row, column: column.property }
        },
        tableEditBoxHide(item, row, columnName) {
            console.log('hide', columnName)
            row[this.hiddenFieldHasEdit + columnName] = false;
            let diff = row[this.hiddenFieldPrefix + columnName] != row[columnName];
            item.dataChange = item.dataChange || diff;
            if (diff) {
                if (!row[this.hiddenFieldState])
                    row[this.hiddenFieldState] = "update";
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
                console.log(this.hiddenFieldHasEdit + find)
                this.item.data[row][this.hiddenFieldHasEdit + find] = true;
                this.editFieldPosition = { row: this.item.data[row], column: find }
            }, 10);
        },
        stopTab(e){
            if(e.code=='Tab'){
                e.stopPropagation();
                e.preventDefault();
            }
        }
    },
    components: { TableEdit }
}
</script>
<style lang="scss">
</style>