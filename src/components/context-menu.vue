<template>
    <el-dropdown ref="contextmenu" trigger="contextmenu">
        <div class="contextmenu" :style="rect"></div>
        <template #dropdown>
            <el-dropdown-menu>
                <template v-for="(menu, i) in data" :key="i">
                    <el-dropdown-item v-if="menu.items" v-for="(sub, k) in menu.items" :key="k" :divided="sub.divided || (k==0 && menu.divided)"
                        @click="sub.onClick && sub.onClick(refData)">
                        {{ global.locale[menu.name] }}-{{ global.locale[sub.name] }}
                    </el-dropdown-item>
                    <el-dropdown-item :divided="menu.divided" v-else @click="menu.onClick && menu.onClick(refData)">
                        {{ global.locale[menu.name] }}
                    </el-dropdown-item>
                </template>
            </el-dropdown-menu>
        </template>
    </el-dropdown>
</template>
<script>
export default {
    data() {
        return {
            visible: false,
            data: [],
            refData: null,
            rect: {
                left: 0,
                top: 0,
                width: 0,
                height: 0
            }
        }
    },
    methods: {
        show(target, menu, data) {
            if (this.visible) {
                this.$refs.contextmenu.handleClose();
                this.visible = false;
                setTimeout(() => {
                    this.show(target, menu, data)
                }, 150);
                return;
            }
            const rect = target.getBoundingClientRect();
            console.log(target,rect)
            this.rect.top = rect.top + 'px';
            this.rect.left = rect.left + 'px';
            this.rect.width = rect.width + 'px';
            this.rect.height = rect.height + 'px';
            console.log('cm',this.rect)
            this.data = menu;
            this.visible = true;
            this.refData = data;
            this.$refs.contextmenu.handleOpen();
        }
    }
}
</script>
<style>
.contextmenu {
    position: fixed;
}
</style>