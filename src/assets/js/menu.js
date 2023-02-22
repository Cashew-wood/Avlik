export default {
    data() {
        return {
            menu: [{
                _name: '${file}',
                items: [{
                    _name: '${open_sql_file}',
                    invoke: this.chooseFile
                }, {
                    _name: '${exit}',
                    divided: true,
                    invoke: () => { native.window.close() }
                }]
            }, {
                _name: '${look}',
                items: [{
                    _name: '${hide_navigation}',
                    icon: '',
                    invoke: (e) => { this.show_navigation = !this.show_navigation; e.icon = this.show_navigation ? '' : 'Check'; }
                }, {
                    _name: '${hide_tool}',
                    icon: '',
                    invoke: (e) => { this.show_tool = !this.show_tool; e.icon = this.show_tool ? '' : 'Check'; }
                }]
            }, {
                _name: '${help}',
                items: [{
                    _name: '${check_update}',
                    invoke: () => { this.$alert(this.global.locale.no_update, this.global.locale.prompt) }
                }, {
                    name: '中文（简体）',
                    invoke: () => { this.setDisplayLocale('zh-cn') },
                    divided: true
                }, {
                    name: 'English',
                    invoke: () => { this.setDisplayLocale('en') },
                }, {
                    _name: '${about}',
                    divided: true,
                    invoke: async () => { this.$alert(`Name:${await native.window.title}<br/>Vserion:${await native.app.version}`, this.global.locale.prompt, { dangerouslyUseHTMLString: true }) }
                }]
            }]
        }
    },
    methods: {
        menuItem(man, sub) {
            sub.invoke(sub);
            console.log(sub)
        },
        async chooseFile() {
            let selectId = this.$refs.tree.getCurrentKey();
            let info = this.getNodeDataPathById(selectId);
            if (!selectId || info.path.length < 1) {
                this.$message({
                    duration: 3000,
                    message: this.global.locale.not_selected_db,
                    type: 'warning'
                })
                return;
            }
            let files = await native.io.chooseFile(this.global.locale.open, false, null, 'SQL|*.sql')
            if (files) {
                let file = files[0];
                let content = await native.io.readToText(file, 'utf-8');
                console.log(this.$refs.tree);
                this.openSQLPanel(file.substring(file.lastIndexOf('\\') + 1, file.lastIndexOf('.')), content, info.path[0], info.path[1]);
            }
        }
    }
}