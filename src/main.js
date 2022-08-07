import { createApp } from 'vue'
import App from './App.vue'
import routes from './router'
import './assets/css/iconfont.css'
import 'element-plus/dist/index.css'
import ElementPlus from 'element-plus'
import { reactive } from "vue";
import zhCN from './assets/js/locale/zh-cn'
import el_zhCn from 'element-plus/lib/locale/lang/zh-cn'
import en from './assets/js/locale/en.js'
import el_en from 'element-plus/lib/locale/lang/en'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import global_constant from './assets/js/global_constant.js'
import Utils from './assets/js/utils.js'
let app = createApp(App)
app.use(routes);
app.use(ElementPlus)
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
    app.component(key, component)
}
app.config.globalProperties.constant = global_constant;
app.config.globalProperties.global = reactive({});
app.config.globalProperties.global.locales = { 'zh-cn': [zhCN, el_zhCn], 'en': [en, el_en] }

app.config.globalProperties.setCurrentLocale = function (country) {
    app.config.globalProperties.global.locale = this.global.locales[country][0];
    app.config.globalProperties.global.el_locale = this.global.locales[country][1];
    global_constant.locale = this.global.locale;
}
app.config.globalProperties.setCurrentLocale('en');
app.config.globalProperties.error = function (e){
    this.$message({
        duration: 3000,
        message: e,
        type: 'error'
    })
}
Object.assign(app.config.globalProperties,new Utils())
app.mount('#app')
