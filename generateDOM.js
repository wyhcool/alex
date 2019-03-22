/*
 * html 代码转 dom 代码
 */
(function() {
    var domCode = '';
    var nodeNameCounters = {};
    var requiredVariables = '';
    var newVariables = '';

    // encode() 方法将用于保证字符串是一个安全的 JavaScript 字符串，只需要转义反斜杠、单引号(字符串被包含在单引号内)和换行符即可。
    // 不使用内置 escape() 方法，该方法不会对 ASCII 字母和数字进行编码，也不会对下面这些 ASCII 标点符号进行编码： * @ - _ + . / ，其他所有的字符都会被转义序列替换。
    function encode(str) {
        if (!str) {
            return null;
        }
        str = str.replace(/\\/g, '\\\\');
        str = str.replace(/'/g, '\\\'');
        str = str.replace(/\n/g, '\\\n');
        return str;
    }

    // 查找节点值中那些特殊的 $var 字符串，并对其进行处理
    // 该方法只检查字符串中是否包含美元符号，如果是，则返回一个带引号的字符串或者一个变量名称
    // 而且还会把变量声明添加到 requiredVariables 字符串中
    function checkForVariable(v) {
        if (v.indexOf('$') === -1) {
            v = '\'' + v + '\'';
        } else {
            v = v.substring(v.indexOf('$') + 1);
            requiredVariables += 'var ' + v + ';\n';
        }
        return v;
    }

    function generate(strHTML, strRoot) {
        //将 html 代码添加到页面主体中，以便能够遍历相应的 DOM 树
        var domRoot = document.createElement('DIV');
        domRoot.innerHTML = strHTML;

        //重置变量
        domCode = '';
        nodeNameCounters = {};
        requiredVariables = '';
        newVariables = '';

        //使用 processNode() 方法处理 domRoot 中的所有节点
        var node = domRoot.firstChild;
        while (node) {
            Alex.walkTheDOMRecursive(processNode, node, 0, strRoot);
            node = node.nextSibling;
        }

        //输出生成的代码
        domCode = '/* requiredVariables in this code \n' + requiredVariables + '*/\n\n' +
                  domCode + '\n\n' + 
                  '/* newVariables in this code \n' + newVariables + '*/\n\n';
        return domCode;
    }

    //分析树中的每个节点
    function processNode(tabCount, refParent) {
        //根据树的深度级别重复制表符，以便对每一行进行适当的缩进
        var tabs = (tabCount ? '\t'.repeat(tabCount): '');

        //确定节点类型并处理
        switch(this.nodeType) {
            case Alex.node.ELEMENT_NODE:
                //计数器加1，并创建使用标签和计数器的值表示的新变量
                if (this.nodeName in nodeNameCounters) {
                    ++nodeNameCounters[this.nodeName];
                } else {
                    nodeNameCounters[this.nodeName] = 1;
                }

                var ref = this.nodeName.toLowerCase() + nodeNameCounters[this.nodeName];

                //添加创建该元素的 DOM 代码
                domCode += tabs + 'var ' + ref + ' = document.createElement(' + this.nodeName + ');\n';

                //将新变量添加到结果中以便报告
                newVariables += '' + ref + ';\n';

                //检查是否存在属性，如果是则循环遍历这些属性，并使用 processAttribute() 方法遍历它们的 DOM 树
                if (this.attributes) {
                    for (var i = 0; i < this.attributes.length; i++) {
                        //所有属性自身也是节点，但没有包含在 childNodes 中，也无法通过同辈定位的方式进行迭代
                        //属性节点都包含在 node.attributes 类数组中
                        Alex.walkTheDOMRecursive(
                            processAttribute, 
                            this.attributes.item(i),
                            tabCount,
                            ref);
                    }
                }
                break;
            case Alex.node.TEXT_NODE:
                //检测文本节点中除了空白符之外的值
                var value = (this.nodeValue ? encode(this.nodeValue.trim()) : '');
                if (value) {
                    if ('text' in nodeNameCounters) {
                        ++nodeNameCounters['text'];
                    } else {
                        nodeNameCounters['text'] = 1;
                    }

                    var ref = 'text' + nodeNameCounters['text'];

                    //检查是不是 $var 格式的值
                    value = checkForVariable(value);
                    
                    //添加创建该元素的 DOM 代码
                    domCode += tabs + 'var ' + ref + ' = document.createTextNode(' + value + ');\n';

                    //将新变量添加到结果中以便报告
                    newVariables += '' + ref + ';\n';

                } else {
                    //如果不存在值或者只有空白符则直接返回
                    //即这个节点不会被添加到父节点中
                    return;
                }

                break;
            default:
                //忽略其他情况
                break;
        }

        //添加该节点到其父节点
        if (refParent) {
            domCode += tabs + refParent + '.appendChild(' + ref + ');\n';
        }
        
        return ref;
    }

    function processAttribute(tabCount, refParent) {
        
        //跳过非属性节点
        if (this.nodeType !== Alex.node.ATTRIBUTE_NODE) {
            return;
        }

        //取得属性值
        var attrValue = (this.nodeValue ? encode(this.nodeValue.trim()) : '');

        //如果没有属性值则返回
        if (!attrValue) {
            return;
        }
        
        //确定缩进级别
        var tabs = (tabCount ? '\t'.repeat(tabCount): '');

        //根据 nodeName 进行判断，除了 class 和 style 需要特殊注意以外，所有类型都可以按常规来处理
        switch(this.nodeName) {
            case 'class':
                //使用 className 属性为 class 赋值
                domCode += tabs + refParent + '.className = ' + checkForVariable(attrValue) + ';\n';
                break;
            case 'style':
                //基于 ; 和临近的空格符来分割样式属性的值
                var style = attrValue.split(/\s*;\s*/);

                if (style) {
                    for (var i = 0; i < style.length; i++) {
                        if (!style[i]) {
                            continue;
                        }

                        //基于 : 和临近的空格符来分割每对样式属性
                        var prop = style[i].split(/\s*:\s*/);
                        
                        //属性值为空，则没有意义
                        if (!prop[1]) {
                            continue;
                        }
                        
                        //将 css-property 格式的 CSS 属性转换为 cssProperty 格式
                        prop[0] = Alex.camelize(prop[0]);

                        var propValue = checkForVariable(prop[1]);
                        if (prop[0] === 'float') {
                            //float是保留字
                            //cssFloat 是标准的属性
                            //styleFloat 是 IE 使用的属性
                            domCode +=  tabs + refParent + '.style.cssFloat = ' + propValue + ';\n';
                            domCode +=  tabs + refParent + '.style.styleFloat = ' + propValue + ';\n';
                        } else {
                            domCode +=  tabs + refParent + '.style.' + prop[0] + ' = ' + propValue + ';\n';
                        }

                    }
                }
                break;
            default:
                if (this.nodeName.indexOf('on') === 0) {
                    //如果属性名称以 on 开头，也就是嵌入的事件属性，需要创建一个给该属性赋值的函数
                    domCode += tabs + refParent + '.' + this.nodeName + ' = function() {' + attrValue + '};\n';
                } else {
                    //对于其他情况使用 setAttribute
                    domCode += tabs + refParent + '.setAttribute(\'' + this.nodeName + '\', ' + checkForVariable(attrValue) + ');\n';
                }
                break;
        }

    }

    

    if (!window.Alex) {
        window['Alex'] = {};
    }
    window['Alex']['generateDOM'] = generate;

})();