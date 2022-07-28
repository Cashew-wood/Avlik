import Home from './views/Home.vue'
import { createRouter, createWebHashHistory } from 'vue-router'
const routes = [
    { path: '/', component: Home }
  ]
export default createRouter({
  history: createWebHashHistory(),
  routes, 
})