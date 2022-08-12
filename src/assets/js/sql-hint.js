function extractField(struct, pos) {
    let p;
    let fields;
    let last;
    let end = struct.fields.end || struct.value.length;
    if (struct.fields.value.length > 0) {
        last = struct.fields.value[struct.fields.value.length - 1];
        if (last.end) {
            fields = struct.value.substring(last.end, end);
        } else {
            let ll = struct.fields.value[struct.fields.value.length - 2];
            if (ll) {
                fields = struct.value.substring(ll.end, end);
            } else {
                fields = struct.value.substring(struct.fields.start, end);
            }
        }
    } else {
        fields = struct.value.substring(struct.fields.start, end);
    }
    if (last && !last.end) {
        if ((p = /(\w+),?$/.exec(fields))) {
            last.alias = p[0].replace(',', '');
            last.value = fields.substring(1, p.index);
        } else {
            last.value = fields.substring(1, fields.length - (fields.endsWith(',') ? 1 : 0));
        }
        last.end = pos;
    } else if ((p = /(\w+\.)?(\w+)\s*(as \s+)?(\w*)\s*,?$/.exec(fields))) {
        struct.fields.value.push({ value: p[2], table: p[1] && p[1].substring(0, p[1].length - 1), alias: p[4], start: p.index, end: pos })
    }
}
export default function (editor) {
    let content = editor.getValue();
    let cursor = editor.getCursor();
    let struct = { value: '', nested: null };
    let string = null;
    let lastBlock = null;
    let nested = null;
    let sl = null;
    for (let i = 0; i < content.length; i++) {
        const char = content[i];
        let append = struct;
        while (append != null) {
            append.value += char;
            append = append.parent;
        }
        if (string != null) {
            if (string == char) {
                string = null;
            }
        } else if (char == "'" || char == '"') {
            string = char;
        } else if (char == '(') {
            nested = { value: '', parent: struct, start: i };
            struct = nested;
        } else if (char == ')') {
            lastBlock && (lastBlock.end = i);
            lastBlock = null;
            struct.end = i;
            struct.value = struct.value.substring(0, struct.value.length - 1);
            struct = struct.parent;
            if (!struct.from && struct.fields) {
                struct.fields.value.push({ nested, start: nested.start })
            }
        } else if (struct.isSelect || (sl = /^\s*select/i.exec(struct.value))) {
            if (!struct.isSelect) {
                struct.fields = { value: [], start: i }
                struct.isSelect = true;
            }
            if (char == ',' && !struct.fields.end) {
                extractField(struct, i);
            } else {
                let p;
                if (struct.value.endsWith(';') || i == content.length - 1) {
                    lastBlock && (lastBlock.end = i);
                    lastBlock = null;
                } else if ((p = /\s+from\s+$/i.exec(struct.value))) {
                    struct.fields.end = i - p[0].length;
                    extractField(struct, struct.fields.end);
                    struct.from = { start: i };
                    lastBlock = struct.from;
                } else if ((p = /\s+where\s+$/i.exec(struct.value))) {
                    lastBlock && (lastBlock.end = i - p[0].length);
                    struct.where = { start: i };
                    lastBlock = struct.where
                } else if ((p = /\s+group\s+by\s+$/i.exec(struct.value))) {
                    lastBlock && (lastBlock.end = i - p[0].length);
                    struct.group = { start: i }
                    lastBlock = struct.group
                } else if ((p = /\s+having\s+$/i.exec(struct.value))) {
                    lastBlock && (lastBlock.end = i - p[0].length);
                    struct.having = { start: i };
                    lastBlock = struct.having
                } else if ((p = /\s+order\s+by\s+$/i.exec(struct.value))) {
                    lastBlock && (lastBlock.end = i - p[0].length);
                    struct.order = { start: i };
                    lastBlock = struct.order
                }
            }
        }
    }
    console.log(struct)
}