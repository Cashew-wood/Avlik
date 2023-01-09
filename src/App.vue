

<template>
     <el-config-provider :locale="global.el_locale">
          <router-view></router-view>
     </el-config-provider>
</template>
<script>
import { ElConfigProvider } from 'element-plus'
import icon from "./assets/img/icon.png";
export default {
     data() {
     },
     components: { ElConfigProvider },
     mounted() {
          const setup = () => {
               this.global.device = this.lazy(window.native.device);
               native.window.icon = icon;
               native.window.title = 'Avlik'
               window.native.app.executablePath.then((e) => {
                    this.global.executablePath = e;
               });
          };
          if (window.native && window.native.isInit) {
               setup();
          } else {
               window.addEventListener("native", setup);
          }
          document.body.addEventListener('keydown', (e => {
               if (e.code == 'F12')
                    window.native.window.showDevTool();
          }))
     },
     methods: {
          lazy(obj) {
               return new Proxy({}, {
                    get(target, p) {
                         if (typeof p != 'string' || p.startsWith('__v')) return;
                         return new Promise((r, s) => {
                              if (target[p]) r(target[p]);
                              obj[p].then(r);
                         })
                    }
               })
          }
     }
}
</script>
<style scoped>

</style>
