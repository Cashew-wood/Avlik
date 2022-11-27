export default {
    data() {
        return {

        }
    },
    methods: {
        setDisplayLocale(lang) {
            this.setCurrentLocale(lang);
            this.setLocale(this.dbTemplates)
            this.setLocale(this.menu)
            localStorage.setItem('lang', lang);
        },
        setLocale(obj) {
            for (let key in obj) {
                if (key.startsWith('$')) continue;
                let val = obj[key];
                let t = typeof (val);
                if (t == 'function' || t == 'number' || t == 'boolean' || t == 'bigint' || t == 'undefined') continue;
                else if (Array.isArray(val)) {
                    for (let item of val) this.setLocale(item);
                } else if (t == 'object') {
                    this.setLocale(val)
                } else if (t == 'string' && val.startsWith('${')) {
                    obj[key.substring(1)] = this.global.locale[val.substring(2, val.length - 1)];
                    if (this.global.locale[val.substring(2, val.length - 1)] == null) {
                        console.log(val, this.global.locale, val.substring(2, val.length - 1))
                    }
                }
            }
        },
        getNodeDataPathById(id) {
            let root = [{ path: [], items: this.dbc }];
            let find = null;
            do {
                let list = []
                for (let obj of root) {
                    let k = 0;
                    for (let node of obj.items) {
                        if (node.id == id) {
                            find = { path: obj.path.concat([k]), data: node };
                            break
                        } else {
                            list.push({ path: obj.path.concat([k]), items: node.items })
                        }
                        k++;
                    }
                }
                if (find) break
                root = list;
            } while (root.length);
            return find;
        }
    }
}