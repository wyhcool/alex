
(function() {
    
    //Alex命名空间
    if (!window.Alex) {
        window['Alex'] = {};
    }

    //兼容对 Node 对象的支持
    window['Alex']['node'] = {
        ELEMENT_NODE                 : 1,
        ATTRIBUTE_NODE               : 2,
        TEXT_NODE                    : 3,
        CDATA_SECTION_NODE           : 4,
        ENTITY_REFERENCE_NODE        : 5,
        ENTITY_NODE                  : 6,
        PROCESSING_INSTRUCTION_NODE  : 7,
        COMMENT_NODE                 : 8,
        DOCUMENT_NODE                : 9,
        DOCUMENT_TYPE_NODE           : 10,
        DOCUMENT_FRAGMENT_NODE       : 11,
        NOTATION_NODE                : 12
    };

    //获取浏览器窗口大小
    function getBrowserWindowSize() {
        var de = document.documentElement;
        return {
            'width': (
                window.innerWidth
                || (de && de.clientWidth)
                || document.body.clientWidth
            ),
            'height': (
                window.innerHeight
                || (de && de.clientHeight)
                || document.body.clientHeight
            )
        };
    }
    window['Alex']['getBrowserWindowSize'] = getBrowserWindowSize;

    //指定执行环境
    function bindFunction(obj, func) {
        return function() {
            func.apply(obj, arguments);
        };
    }
    window['Alex']['bindFunction'] = bindFunction;

    //使用能力检测来检查必要条件，确定当前浏览器是否与整个库兼容
    function isCompatible(other) {
        if (other === false
            || !Array.prototype.push
            || !Object.hasOwnProperty
            || !document.createElement
            || !document.getElementsByClassName
        ) {
            return false;
        }
        return true;
    }
    window['Alex']['isCompatible'] = isCompatible;

    //根据id获取元素
    function $() {
        var element, 
            elements = [],
            i, len;

        //查找参数中的所有元素
        for (i = 0, len = arguments.length; i < len; i++) {
            element = arguments[i];

            //如果该参数是一个字符串，那假设它是一个id
            if (typeof element === "string") {
                element = document.getElementById(element);
            }

            //如果只提供了一个参数，则立即返回该元素
            if (len === 1) {
                return element;
            }
            //否则，将它添加到数组中
            elements.push(element);
        }

        //返回包含多个被请求元素的数组
        return elements;
    }
    window['Alex']['$'] = $;

    //document.getElementsByClassName 这个方法只能在 ie9 及其以上的浏览器使用，也就是说 getElementsByClassName 是在支持 html5 的浏览器下才能执行。
    function getElementsByClassName(className, tag, parent) {
        var allTags,
            element,
            matchingElements,
            regex,
            i, len;


        parent = parent || document;
        if (!(parent = $(parent))) {
            return false;
        }

        //查找所有匹配的标签
        allTags = (tag === "*" && parent.all) ? parent.all : parent.getElementsByTagName(tag);

        //创建一个正则表达式来判断 className 是否正确
        //正则表达式中含有变量时使用构造函数 RegExp 或 eval，使用字面量形式无法办到
        className = className.replace(/\-/g, "\\-");
        regex = new RegExp("(^|\\s)" + className + "(\\s|$)");

        matchingElements = [];
        //检查每个元素
        for (i = 0, len = allTags.length; i < len; i++) {
            element = allTags[i];
            if (regex.test(element.className)) {
                matchingElements.push(element);
            }
        }

        return matchingElements;
    }
    window['Alex']['getElementsByClassName'] = getElementsByClassName;


    function addEvent(node, type, listener) {
        //兼容性检查以保证平稳退化
        if (!isCompatible()) { return false; }

        if (!(node = $(node))) { return false; }

        if (node.addEventListener) {
            //W3C
            node.addEventListener(type, listener, false);
            return true;
        } else if (node.attachEvent) {
            //MSIE
            node["e" + type + listener] = listener;
            node[type + listener] = function() {
                node["e" + type + listener](window.event);
            };
            node.attachEvent("on" + type, node[type + listener]);
            return true;
        }
        
        //若两种方法都不具备
        return false;
    }
    window['Alex']['addEvent'] = addEvent;
   

    function removeEvent(node, type, listener) {
        if (!(node = $(node))) { return false; }

        if (node.addEventListener) {
            //W3C
            node.removeEventListener(type, listener, false);
            return true;
        } else if (node.attachEvent) {
            //MSIE
            node.detachEvent("on" + type, node[type + listener]);
            node[type + listener] = null;
            return true;
        }

        //若两种方法都不具备
        return false;
    }
    window['Alex']['removeEvent'] = removeEvent;

    //切换 DOM 树中元素的可见性
    function toggleDisplay(node, value) {
        if (!(node = $(node))) {
            return false;
        }

        if (node.style.display !== "none") {
            node.style.display = "none";
        } else {
            node.style.display = value || "";
        }
        return true;
    }
    window['Alex']['toggleDisplay'] = toggleDisplay;

    function insertAfter(node, referenceNode) {
        if (!(node = $(node))) {
            return false;
        }
        if (!(referenceNode = $(referenceNode))) {
            return false;
        }

        return referenceNode.parentNode.insertBefore(node, referenceNode.nextSibling);
    }
    window['Alex']['insertAfer'] = insertAfter;

    function prependChild(parent, newChild) {
        if (!(parent = $(parent))) {
            return false;
        }
        if (!(newChild = $(newChild))) {
            return false;
        }

        if (parent.firstChild) {
            parent.insertBefore(newChild, parent.firstChild);
        } else {
            parent.appendChild(newChild);
        }

        return parent;
    }
    window['Alex']['prependChild'] = prependChild;

    function removeChildren(parent) {
        if (!(parent = $(parent))) {
            return false;
        }
        //当存在子节点时删除该子节点
        while (parent.firstChild) {
            //TODO: Why not use
            // parent.removeChild(parent.firstChild);
            parent.firstChild.parentNode.removeChild(parent.firstChild);
        }
        //返回父元素，以便实现级连
        return parent;
    }
    window['Alex']['removeChildren'] = removeChildren;


    //遍历 DOM 树，非递归，不计深度，按出现顺序
    function walkElementsLinear(func, node) {
        var root = node || window.document;
        var nodes = root.getElementsByTagName('*');
        for (var i = 0; i < nodes.length; i++) {
            func.call(nodes[i]);
        }
    }
    
    //遍历 DOM 树，递归地，跟踪深度
    function walkTheDOMRecursive(func, node, depth, returnedFromParent) {
        var root = node || window.document;
        returnedFromParent = func.call(root, depth++, returnedFromParent);
        var node = root.firstChild;
        while (node) {
            walkTheDOMRecursive(func, node, depth, returnedFromParent);
            node = node.nextSibling;
        }
    }

    //遍历每个 DOM 节点的属性
    function walkTheDOMWithAttributes(node, func, depth, returnedFromParent) {
        var root = node || window.document;
        returnedFromParent = func.call(root, depth++, returnedFromParent);
        if (root.attributes) {
            for (var i = 0; i < root.attributes.length; i++) {
                walkTheDOMWithAttributes(root.attributes.item(i), func, depth - 1, returnedFromParent);
            }
        }
        if (root.nodeType !== Alex.node.ATTRIBUTE_NODE) {
            node = root.firstChild;
            while (node) {
                walkTheDOMWithAttributes(node, func, depth, returnedFromParent);
                node = node.nextSibling;
            }
        }
    }

    //驼峰化一个连字符连接的字符串
    //主要用于处理嵌入的样式属性
    //CSS 属性中使用了连字符，在 ECMAScript 连字符用作减号，不能用作标识符
    function camelize(s) {
        return s.replace(/-(\w)/g, function(strMatch, captureGroup) {
            return captureGroup.toUpperCase();
        });
    }
    window['Alex']['camelize'] = camelize;


})();