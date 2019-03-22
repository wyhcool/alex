// 兼容旧环境

// String
// repeat()方法构造并返回一个新字符串，该字符串包含被连接在一起的指定数量的字符串的副本。
if (!String.prototype.repeat) {
    String.prototype.repeat = function(count) {
        'use strict';
        if (this == null) {
            throw new TypeError('can\'t convert ' + this + ' to object');
        }
        var str = '' + this;
        count = +count;
        // typeof NaN = 'number', NaN != NaN, 利用 NaN 是 JavaScript 之中唯一不等于自身的值
        if (count != count) {
            count = 0;
        }
        if (count < 0) {
            throw new RangeError('repeat count must be non-negative');
        }
        if (count == Infinity) {
            throw new RangeError('repeat count must be less than infinity');
        }
        count = Math.floor(count);
        if (str.length == 0 || count == 0) {
            return '';
        }
        // 确保 count 是一个 31 位的整数。这样我们就可以使用如下优化的算法。
        // 当前（2014年8月），绝大多数浏览器都不能支持 1 << 28 长的字符串，所以：
        if (str.length * count >= 1 << 28) {
            throw new RangeError('repeat count must not overflow maximum string size');
        }
        var rpt = '';
        for ( ; ; ) {
            if ((count & 1) == 1) {
                rpt += str;
            }
            count >>>= 1;
            if (count == 0) {
                break;
            }
            str += str;
        }
        
        // 非优化算法
        // rpt = new Array(count).join(str);
        // 或者
        // while (count > 0) {
        //     rpt += str;
        //     --count;
        // }

        return rpt;
    }
}
// trim() 方法删除一个字符串两端的空白字符。
// 在这个上下文中的空白字符是所有的空白字符 (space, tab, non-break space 等) 以及所有行终止符字符（如 LF，CR）。
if (!String.prototype.trim) {
    String.prototype.trim = function () {
        return this.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '');
    };
}
// 通常所用的空格是 \x20 ，是在标准 ASCII 可见字符 0x20~0x7e 范围内。
// 而 \xa0 属于 latin1 （ISO/IEC_8859-1）中的扩展字符集字符，代表空白符nbsp(non-breaking space)。
// latin1 字符集向下兼容 ASCII （ 0x20~0x7e ）。