<template>
    <div class="title_bar" @dblclick="setSate(state == 'max' ? 'normal' : 'max')">
        <div class="left">
            <img class="icon" src="../assets/img/icon.png" />
            <span class="name">{{ title }}</span>
        </div>
        <div class="right">
            <span class="iconfont icon-2zuixiaohua-1" @click="setSate('min')" />
            <span class="iconfont" :class="state == 'max' ? 'icon-3zuidahua-1' : 'icon-3zuidahua-3'"
                @click="setSate(state == 'max' ? 'normal' : 'max')" />
            <span class="iconfont icon-4guanbi-1" @click="setSate('close')" />
        </div>
    </div>
</template>
<script>
export default {
    data() {
        return {
            title: '',
            state: ''
        }
    },
    methods: {
        setSate(state) {
            this.state = state;
            if (state == 'close') {
                native.window.close();
                return;
            }
            native.window.state = state;
        }
    },
    async mounted() {
        this.title = await native.window.title;
    },
}
</script>
<style lang="scss">
.title_bar {
    display: flex;
    justify-content: space-between;
    height: 32px;
    align-items: center;
    background-color: var(--el-border-color-light);

    .left {
        flex: 1;
        display: flex;
        align-items: center;

        .icon {
            width: 24px;
            margin-left: 10px;
        }

        .name {
            margin-left: 10px;
        }
    }

    .right {
        .iconfont {
            padding: 6px 16px;

            &:hover {
                background-color: var(--el-color-primary-light-9);
            }
        }
    }
}
</style>