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
app.config.globalProperties.format = function (str) {
    let n = ''
    let k = 1;
    for (let i = 0; i < str.length; i++) {
        if (str[i] == '{' && str.length > i && str[i + 1] == '}') {
            n += arguments[k++];
            i++;
        } else {
            n += str[i];
        }
    }
    return n;
}

app.config.globalProperties.dateFormat = function (val) {
    if (typeof val == 'string') {
        if (/^\d+$/.test(val)) {
            val = parseInt(val);
        } else {
            return val;
        }
    }
    let d = new Date(val);
    return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
}
app.config.globalProperties.dateTimeFormat = function (val) {
    if (typeof val == 'string') {
        if (/^\d+$/.test(val)) {
            val = parseInt(val);
        } else {
            return val;
        }
    }
    let d = new Date(val);
    return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
}
app.config.globalProperties.timeFormat = function (d) {
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
}
app.config.globalProperties.randomString = function (l) {
    let s = '';
    for (let i = 0; i < l; i++) {
        let v = parseInt(Math.random() * 62);
        if (v < 36) {
            s += v.toString(36);
        } else {
            s += String.fromCharCode(65 + v - 36);
        }
    }
    return s;
}
app.mount('#app')
