<template>
    <div>
        <el-input ref="input" v-if="['number', 'text'].indexOf(type) > -1" :type="type" class="input" @keydown="keydown"
            v-model="value" @blur="hide" size="small" :placeholder="placeholder" @contextmenu.prevent="setNull"
            @change="change">
        </el-input>
        <el-date-picker ref="input" v-if="type == 'date'" v-model="value" class="input" format="YYYY-MM-DD"
            value-format="YYYY-MM-DD" type="date" placeholder="YYYY-MM-DD" @blur="hide" size="small" @change="change"
            @keydown="keydown" />
        <el-date-picker ref="input" v-if="type == 'datetime'" v-model="value" class="input" type="datetime"
            value-format="YYYY-MM-DD hh:mm:ss" format="YYYY-MM-DD hh:mm:ss" @blur="hide" size="small" @change="change"
            @keydown="keydown" />
        <el-date-picker ref="input" v-if="type == 'timestamp'" v-model="value" class="input" type="datetime"
            value-format="x" format="YYYY-MM-DD hh:mm:ss" @blur="hide" size="small" @keydown="keydown" />
        <el-time-picker ref="input" v-if="type == 'time'" v-model="value" class="input" placeholder="hh:mm:ss"
            @blur="hide" size="small" @keydown="keydown" @change="change" />
        <el-select ref="input" v-if="type == 'select'" v-model="value" class="input" filterable size="small"
            @blur="hide" @visible-change="downlistVisibleChange" @keydown="keydown" @change="change">
            <el-option v-for="item in data" :key="item" :label="item" :value="item"></el-option>
        </el-select>
        <el-select ref="input" v-if="type == 'select-multiple'" multiple v-model="value" class="input" filterable
            size="small" @blur="hide" @visible-change="downlistVisibleChange" @keydown="keydown" @change="change">
            <el-option v-for="item in data" :key="item" :label="item" :value="item">
            </el-option>
        </el-select>
        <div class="inline-block" ref="input" :tabindex="focusShow ? 1 : -1" v-if="type == 'checkbox'"
            @keydown="keydown" @blur="hide" :class="{ 'is-focus': focusShow }">
            <el-checkbox v-model="value" class="input" :tabindex="-1" @change="change">
            </el-checkbox>
        </div>
    </div>
</template>
<script>
export default {
    data() {
        return {
            value: null,
            focusShow: false,
            downlistVisible: false,
            placeholder: null,
            set: false,
            nextChangeValHide: false
        }
    },
    props: {
        type: String,
        modelValue: [Number, String, Boolean, Array],
        field: String,
        data: [Object, Array],
        focus: Boolean,
        autoFocus: {
            type: Boolean,
            default: true
        },
        row: Object
    },
    emits: ['duplicate', 'hide', 'update:modelValue', 'next', 'change'],
    watch: {
        value(n, o) {
            if (!this.set) return;
            if (n == null)
                this.placeholder = '(Null)';
            else this.placeholder = n.toString();
            if (this.type == 'time') {
                if (!n) {
                    this.convertToValue(this.modelValue);
                    console.log('clear', this.modelValue,this.value)
                }
            } else {
                this.$emit('update:modelValue', n);
            }
            if (this.nextChangeValHide) {
                this.focusShow = false;
                this.nextChangeValHide = false;
                this.$emit('hide')
            }
        },
        focus(n) {
            if (n) {
                this.focusShow = true;
                this.$nextTick(() => {
                    this.$refs.input.focus();
                })
            }
        },
        modelValue(n) {
            this.convertToValue(n);
        }
    },
    mounted() {
        this.convertToValue(this.modelValue);
        this.set = true;
        this.$nextTick(() => {
            if (this.autoFocus) {
                this.$refs.input && this.$refs.input.focus();
            }
        })

    },
    methods: {
        convertToValue(n) {
            let num = typeof (n) == 'number';
            if (this.type == 'date' && num) {
                this.value = this.dateFormat(n);
            } else if (this.type == 'datetime' && num) {
                this.value = this.dateTimeFormat(n);
            } else if (this.type == 'time') {
                this.value = n ? new Date('2000-01-01 ' + n) : Date.now();
            } else if (this.type == 'checkbox') {
                this.value = n ? true : false;
            } else {
                this.value = n;
            }
        },
        hide(e) {
            if (!this.downlistVisible) {
                this.focusShow = false;
                this.$emit('hide')
            }
        },
        keydown(e) {
            if (e.code == 'Tab') {
                this.$emit('next')
            }
        },
        downlistVisibleChange(val) {
            this.downlistVisible = val;
            if (!val) {
                if (this.type == 'select') {
                    this.nextChangeValHide = true;
                    setTimeout(() => {
                        this.focusShow = false;
                        this.$emit('hide')
                    }, 150);
                } else if (this.type == 'select-multiple') {
                    this.focusShow = false;
                    this.$emit('hide')
                }
            }

        },
        setNull() {
            this.value = null;
        },
        change(n) {
            if (this.type == 'time' && n) {
                console.log('change',n)
                this.$emit('update:modelValue', this.timeFormat(new Date(n)));
            } else {
                this.$emit('change', n)
            }
        }
    }
}
</script>
<style>
.cell .el-input {
    width: 100% !important;
}

.is-focus .el-checkbox__inner {
    border-color: var(--el-checkbox-input-border-color-hover);
}

.inline-block {
    display: inline-block;
}

.inline-block:focus {
    outline: none;
}

.define_new.el-select-dropdown__item.is-disabled {
    cursor: pointer;
    color: var(--el-color-primary-light-5)
}
</style>