
(function() {
    
    //Alex命名空间
    if (!window.Alex) {
        window['Alex'] = {};
    }

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

})();