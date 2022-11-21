import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
const { execFile  } = require('node:child_process');
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

let execute=true
export default defineConfig({
  server: {
    port: 8081
  },
  build:{
    sourcemap:true
  },
  plugins: [vue(), AutoImport({
    resolvers: [ElementPlusResolver()],
  }),
  Components({
    resolvers: [ElementPlusResolver()],
  }),{
    closeBundle:(e)=>{
        let dist=import.meta.url.substring(8,import.meta.url.lastIndexOf("/")).replaceAll('/','\\')+'\\dist';
        console.log(['res='+dist,'icon={index}','name=Avlik','embedded','single','output='+dist+'\\build','public=bin\\libs,bin\\plugin','app.company=Sepo',
        'app.product=Database Connection','app.copyright=Sepo','app.trademark=Sepo','app.version=1.1.1.0'].join(" "))
       execFile('bin\\SepoBuild.exe', ['res='+dist,'icon={index}','name=Avlik','embedded','single','output='+dist+'\\build','public=bin\\libs,bin\\plugin','app.company=Sepo',
      'app.product=Database Connection','app.copyright=Sepo','app.trademark=Sepo','app.version=1.1.1.0'], (error, stdout, stderr) => {
          console.log(error,stdout,stderr)
        });
    
    },
    configureServer:(e)=>{
      if(execute)execute=false;
      else return;
      let doneFn=()=>{
        execFile('bin\\SepoProgram.exe', [`http://localhost:${e.config.server.port || 3000}`,'devtool'], (error, stdout, stderr) => {
          console.log(error,stdout,stderr)
        });
      }
      doneFn();
    }
  }]
})
