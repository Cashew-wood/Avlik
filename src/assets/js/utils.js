export default function () {
    return {
        randomString(l) {
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
        },
        timeFormat(d) {
            return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
        },
        dateTimeFormat(val) {
            if (typeof val == 'string') {
                if (/^\d+$/.test(val)) {
                    val = parseInt(val);
                } else {
                    return val;
                }
            }
            let d = new Date(val);
            return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
        },
        dateFormat(val) {
            if (typeof val == 'string') {
                if (/^\d+$/.test(val)) {
                    val = parseInt(val);
                } else {
                    return val;
                }
            }
            let d = new Date(val);
            return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
        },
        format(str) {
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
    }
}