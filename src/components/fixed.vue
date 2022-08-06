<template>
    <div class="fixed-parent">
        <div class="fixed" ref="fixed">
            <slot :height="height"></slot>
        </div>
    </div>
</template>
<script>
export default {
    data() {
        return {
            height: 0
        }
    },
    mounted() {
        setTimeout(() => {
            this.height = this.$refs.fixed.offsetHeight;
            let observable = new ResizeObserver((e) => {
                this.height = this.$refs.fixed && this.$refs.fixed.offsetHeight;
            })
            observable.observe(this.$refs.fixed);
        }, 100);
    }
}
</script>
<style>
.fixed-parent {
    position: relative;
}

.fixed-parent .fixed {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    top: 0;
}
</style>