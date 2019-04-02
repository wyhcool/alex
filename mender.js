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


//Array
//forEach() 方法遍历数组元素，无返回值
//forEach() 方法按升序为数组中含有效值的每一项执行一次callback 函数，
//那些已删除或者未初始化的项将被跳过（例如在稀疏数组上）。
if (!Array.prototype.forEach) {
    Array.prototype.forEach = function(callback, thisArg) {
        var scope = thisArg || window;
        for (var i = 0, len = this.length; i < len; i++) {
            callback.call(scope, this[i], i, this);
        }
    };
}

//filter() 方法便利数组元素，返回一个返回值为 true 的项组成的新数组
//filter() 为数组中的每个元素调用一次 callback 函数，
//并利用所有使得 callback 返回 true 或等价于 true 的值的元素创建一个新数组。
//callback 只会在已经赋值的索引上被调用，对于那些已经被删除或者从未被赋值的索引不会被调用。
//那些没有通过 callback 测试的元素会被跳过，不会被包含在新数组中。
if (!Array.prototype.filter) {
    Array.prototype.filter = function(callback, thisArg) {
        var scope = thisArg || window;
        var a = [];
        for (var i = 0, len = this.length; i < len; i++) {
            if (!callback.call(scope, this[i], i, this)) {
                continue;
            }
            a.push(this[i]);
        }
        return a;
    };
}