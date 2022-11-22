import databaseConnecton from './database-connecton';
const tableColumns = {};
function findMatchObj(dbc, word, all, tableDB) {
    let list = [];
    for (let db of dbc.items) {
        if ((all && db.label.toLowerCase() == word) || (!all && db.label.toLowerCase().startsWith(word))) {
            list.push({ type: 'db', value: db });
        }
        if ((tableDB && db.label == tableDB) || !tableDB)
            list = list.concat(findTableMatchObj(db, word, all));
    }
    return list;
}
function findTableMatchObj(db, word, all) {
    const list = [];
    for (let item of db.items) {
        for (let table of item.items) {
            if ((all && table.label.toLowerCase() == word) || (!all && table.label.toLowerCase().startsWith(word))) {
                list.push({ type: 'table', value: table, db });
            }
        }
    }
    return list;
}
function lastIndexOf(str) {
    return [str.lastIndexOf(' '), str.lastIndexOf('\t'), str.lastIndexOf('\n'), str.lastIndexOf('='), str.lastIndexOf(',')].sort((a, b) => b - a)[0];
}
function indexOfToken(str, values, left) {
    const chars = [' ', '\t', '\n'];
    let keywrod = [];
    if (Array.isArray(values)) {
        keywrod = values;
    } else {
        for (let value in values) {
            keywrod.push(value);
        }
    }
    const findList = [];
    let skip = 0;
    let strarea = false;
    let start = 0;
    let end = str.length;
    if (left) {
        let leftSymbol = str.lastIndexOf('(');
        let rightSymbol = str.lastIndexOf(')');
        if (leftSymbol > rightSymbol) {
            start = leftSymbol;
        }
    } else {
        let leftSymbol = str.indexOf('(');
        let rightSymbol = str.indexOf(')');
        if ((leftSymbol > rightSymbol || leftSymbol == -1) && rightSymbol != -1) {
            end = rightSymbol;
        }
    }
    let index = -1;
    for (let i = start; i < end; i++) {
        if (i > 0 && str[i - 1] != '\\' && (str[i] == '\'' || str[i] == '"')) {
            strarea = !strarea;
            continue;
        }
        if (strarea) continue;
        if (str[i] == '(') {
            skip++;
        } else if (str[i] == ')') {
            skip--;
            continue;
        }
        if (skip) continue;
        if (i == 0 || chars.includes(str[i - 1])) {
            index = i;
        } else if (i == str.length - 1 || chars.includes(str[i])) {
            const word = str.substring(index, chars.includes(str[i]) ? i : str.length);
            const j = keywrod.indexOf(word);
            if (j > -1)
                findList.push({ value: word, index: i - word.length });
        }
    }
    return findList;
}
function getTableList(str) {
    const chars = [' ', '\t', '\n'];
    const token = [];
    let start = -1;
    let skip = 0;
    let strarea = false;
    for (let i = 0; i < str.length; i++) {
        if (i > 0 && str[i - 1] != '\\' && (str[i] == '\'' || str[i] == '"')) {
            strarea = !strarea;
            continue;
        }
        if (strarea) continue;
        if (str[i] == '(') {
            skip++;
            if (skip == 1 && start == -1) {
                start = i;
            }
        } else if (str[i] == ')') {
            skip--;
            continue;
        }
        if (skip) continue;
        if (chars.includes(str[i]) || str[i] == ',') {
            if (start > -1)
                token.push(str.substring(start, i));
            start = -1;
            continue;
        } else if (start == -1) {
            start = i;
        }
        if (i == str.length - 1)
            token.push(str.substring(start));
    }
    let tableList = [];
    for (let i = 0; i < token.length; i++) {
        if (token[i] == 'from') continue;
        if (token[i] == 'as') continue;
        if (token[i] == 'join' || token[i + 1] == 'join') continue;
        if (token[i] == 'on' || token[i - 1] == 'on') continue;
        if (tableList.length == 0 || tableList[tableList.length - 1]?.alias)
            tableList.push({ table: token[i] })
        else tableList[tableList.length - 1].alias = token[i];
    }
    return tableList;
}
const keywordTokens = ['select', 'from', 'where', 'group', 'order', 'having', 'update', 'insert', 'limit', 'delete'];
export default async function (editor) {
    let cursor = editor.getCursor();
    let firstContent = '';
    for (let i = 0; i < cursor.line; i++) {
        let line = editor.getLine(i + 1)
        firstContent += line;
    }
    firstContent += editor.getLine(cursor.line).substring(0, cursor.ch).toLowerCase();
    let lastContent = editor.getValue().substring(firstContent.length).toLowerCase();

    let keyword = editor.tab.keywords;
    let token = editor.getTokenAt(cursor);
    if (token.type == 'string') {
        return null;
    } else if (token.string.startsWith('.')) {
        token.start++;
    }
    let j = lastIndexOf(firstContent);
    let word = firstContent.substring(j == -1 ? 0 : j + 1);
    let list = []
    if (word.length) {
        for (let s in keyword) {
            if (s.startsWith(word)) {
                list.push(s);
            }
        }
        let firstKeywords = indexOfToken(firstContent, keywordTokens);
        firstKeywords.sort((a, b) => b.index - a.index);
        let tableList = [];
        if (firstKeywords[0]?.value == 'select') {
            let findToken = indexOfToken(lastContent, keywordTokens);
            findToken.sort((a, b) => a.index - b.index);
            if (findToken[0]?.value == 'from') {
                let fromAfter = lastContent.substring(findToken[0].index + 4);
                const nextToken = indexOfToken(fromAfter, keywordTokens);
                nextToken.sort((a, b) => b.index - a.index);
                fromAfter = nextToken[0] ? fromAfter.substring(0, nextToken[0].index) : fromAfter;
                tableList = getTableList(fromAfter);
            }
        } else if (firstKeywords[0]?.value == 'where') {
            let findToken = indexOfToken(firstContent.substring(0, firstKeywords[0].index), keywordTokens);
            findToken.sort((a, b) => b.index - a.index);
            if (findToken[0]?.value == 'from') {
                let fromAfter = firstContent.substring(findToken[0].index, firstKeywords[0].index);
                tableList = getTableList(fromAfter);
            }
        } else if (firstKeywords[0]?.value == 'from') {
            let fromAfter = firstContent.substring(firstKeywords[0].index + 4) + lastContent;
            const nextToken = indexOfToken(fromAfter, keywordTokens);
            fromAfter = nextToken[0] ? fromAfter.substring(0, nextToken[0].index) : fromAfter;
            tableList = getTableList(fromAfter);
        }
        const p = word.lastIndexOf(".");
        let before = word.substring(0, p == -1 ? word.length : p);
        let after = p == -1 ? null : word.substring(p + 1);
        let limitDB = editor.tab.db.label;
        if (tableList.length == 1 && !tableList[0].alias && firstKeywords[0]?.value != 'from') {
            after = before;
            before = tableList[0].table;
        } else {
            for (let table of tableList) {
                if (table.alias == before) {
                    before = table.table;
                    const sp = before.split('.');
                    if (sp.length == 2) {
                        limitDB = sp[0];
                        before = sp[1];
                    }
                }
            }
        }
        let mainDBTables = editor.tab.dbc.items[editor.tab.dbIndex].items[0]?.items;
        if (!mainDBTables.length) {
            mainDBTables = [{ items: (await databaseConnecton.getTableList(editor.tab.dbc, editor.tab.db.label)).map(e => { return { label: e } }) }];
            editor.tab.dbc = { ...editor.tab.dbc, items: [].concat(editor.tab.dbc.items) }
            editor.tab.dbc.items[editor.tab.dbIndex] = { ...editor.tab.db, items: mainDBTables };
        }
        const match = findMatchObj(editor.tab.dbc, before, p > -1, limitDB);
        if (after != null) {
            for (let item of match) {
                if (item.type == 'db') {
                    let tables = item.value.items[0]?.items;
                    if (!tables || !tables.length) {
                        tables = [{ items: (await databaseConnecton.getTableList(editor.tab.dbc, item.value.label)).map(e => { return { label: e } }) }];
                    }
                    const child = findTableMatchObj({ ...db, items: tables }, after, false)
                    list = list.concat(child.map(e => e.value.label));
                } else if (item.type == 'table') {
                    const key = editor.tab.dcIndex + "&" + item.db.label + "&" + item.value.label;
                    if (!tableColumns[key])
                        tableColumns[key] = await databaseConnecton.getTableColumns(editor.tab.dbc, item.db.label, item.value.label);
                    for (let column of tableColumns[key]) {
                        if (column.name.toLowerCase().startsWith(after)) {
                            list.push(column.name);
                        }
                    }
                }
            }
        } else {
            for (let item of match) {
                list.push(item.value.label)
            }
        }
    }


    return { list, from: { ch: token.start, line: cursor.line }, to: { ch: token.end, line: cursor.line } }
}