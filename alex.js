
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
        // if (other === false
        //     || !Array.prototype.push
        //     || !Object.hasOwnProperty
        //     || !document.createElement
        //     || !document.getElementsByClassName
        // ) {
        //     return false;
        // }
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
            //当使用 addEventListener() 为一个元素注册事件的时候，句柄里的 this 值是该元素的引用。
            //第三个参数设置为 false，将 DOM 的默认方法设置为只接收事件冒泡，与 MSIE 下保持一致
            node.addEventListener(type, listener, false);
            return true;
        } else if (node.attachEvent) {
            //MSIE，兼容 IE8 IE7
            node["e" + type + listener] = listener;
            //使用 attachEvent 方法有个缺点，this 的值会变成 window 对象的引用而不是触发事件的元素。
            node[type + listener] = function() {
                //通过使用匿名函数使 this 关键字在 MSIE 和 W3C 的环境中保持一致，this 引用的是将侦听器指派给的对象
                node["e" + type + listener](window.event);
            };
            node.attachEvent("on" + type, node[type + listener]);
            return true;
        }
        
        //若两种方法都不具备
        return false;
    }
    window['Alex']['addEvent'] = addEvent;
   
    function addLoadEvent(loadEvent, waitForImages) {
        if (!isCompatible()) { return false; }

        //如果等待标记是 true，则使用常规的添加事件的方法
        if (waitForImages) {
            return addEvent(window, 'load', loadEvent);
        }

        //否则使用一些不同的方式包装 loadEvent() 方法

        //以便为 this 关键字指定正确的内容、同时确保事件不会被执行两次
        var done = false;
        var init = function() {
            //如果这个函数已经被调用过了则返回
            if (!done) {
                done = true;
                //在 document 环境中运行载入事件
                loadEvent.apply(document, arguments);
            }
        };

        //如果支持 readyState 且已加载
        if (document.readyState === 'complete') {
            init();
        } else if (document.addEventListener) {
            //如果支持 DOMContentLoaded 事件，当所有 DOM 解析完后会触发这个事件
            document.addEventListener('DOMContentLoaded', init, false);
            
            document.addEventListener('load', init, false);
        } else {
            //http://javascript.nwbox.com/IEContentLoaded/
            (function () {
                try {
                    // throws errors until after ondocumentready
                    document.documentElement.doScroll('left');
                } catch (e) {
                    setTimeout(arguments.callee, 50);
                    return;
                }
                // no errors, fire
                init();
            })();

            document.attachEvent("onreadystatechange", function() {
                if (document.readyState === 'complete') {
                    document.onreadystatechange = null;
                    init();
                }
            });
            window.attachEvent("onload", init);
        }
    }
    window['Alex']['addLoadEvent'] = addLoadEvent;

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

    //取消冒泡阶段
    function stopPropagation(eventObject) {
        eventObject = eventObject || getEventObject(eventObject);
        if (eventObject.stopPropagation) {
            eventObject.stopPropagation();
        } else {
            eventObject.cancelBubble = true;
        }
    };
    window['Alex']['stopPropagation'] = stopPropagation;

    //取消默认动作
    function preventDefault(eventObject) {
        eventObject = eventObject || getEventObject(eventObject);
        if (eventObject.preventDefault) {
            eventObject.preventDefault();
        } else {
            eventObject.returnValue = false;
        }
    }
    window['Alex']['preventDefault'] = preventDefault;

    //获取事件对象
    function getEventObject(eventObject) {
        return eventObject || window.event;
    }
    window['Alex']['getEventObject'] = getEventObject;

    //访问事件的目标对象
    function getTarget(eventObject) {
        eventObject = eventObject || getEventObject(eventObject);

        //如果是 W3C 或 MSIE 的模型
        var target = eventObject.target || eventObject.srcElement;

        //如果像 Safari 中一样是文本节点，则重新将目标指定为父元素
        if (target.nodeType === Alex.node.TEXT_NODE) {
            target = target.parentNode;
        }

        return target;
    }
    window['Alex']['getTarget'] = getTarget;

    //确定鼠标按下的键
    function getMouseButton(eventObject) {
        eventObject = eventObject || getEventObject(eventObject);

        var buttons = {
            left: false,
            middle: false,
            right: false
        };

        //检查 eventObject 对象的 toString() 方法的值
        //W3C DOM 对象有 toString 方法且返回值中包含有 MouseEvent 字段
        if (eventObject.toString && eventObject.toString().indexOf('MouseEvent') !== -1) {
            //W3C
            switch(eventObject.button) {
                case 0: buttons.left = true; break;
                case 1: buttons.middle = true; break;
                case 2: buttons.right = true; break;
                default: break;
            }
        } else if (eventObject.button) {
            //MSIE
            switch(eventObject.button) {
                case 1: buttons.left = true; break;
                case 2: buttons.right = true; break;
                case 3: 
                    buttons.left = true;
                    buttons.right = true; 
                    break;
                case 4: buttons.middle = true;
                case 5:
                    buttons.left = true;
                    buttons.middle = true; 
                    break;
                case 6:
                    buttons.right = true;
                    buttons.middle = true; 
                    break;
                case 7:
                    buttons.left = true;
                    buttons.right = true;
                    buttons.middle = true; 
                    break;
                default: break;
            }
        } else {
            return false;
        }

        return buttons;
    }
    window['Alex']['getMouseButton'] = getMouseButton;

    //获取鼠标的位置
    function getPointerPositionInDocuemnt(eventObject) {
        eventObject = eventObject || getEventObject(eventObject);

        var x = eventObject.pageX || (eventObject.clientX + (document.documentElement.scrollLeft || document.body.scrollLeft));
        var y = eventObject.pageY || (eventObject.clientY + (document.documentElement.scrollTop || document.body.scrollTop));
        
        return {x: x, y: y};
    }
    window['Alex']['getPointerPositionInDocuemnt'] = getPointerPositionInDocuemnt;

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

    //通过id修改单个元素的样式
    function setStyleById(element, styles) {
        if (!(element = $(element))) {
            return false;
        }

        for (var property in styles) {
            if (!styles.hasOwnProperty(property)) {
                continue;
            }
            if (element.style.setProperty) {
                element.style.setProperty(property, styles[property], null);
            } else {
                element.style[camelize(property)] = styles[property];
            }
        }
        return true;
    }
    window['Alex']['setStyleById'] = setStyleById;

    //通过类名修改多个元素的样式
    function setStyleByClassName(parent, tag, className, styles) {
        if (!(parent = $(parent))) {
            return false;
        }
        var elements = getElementsByClassName(parent, tag, className);
        for (var i = 0, len = elements.length; i < len; i++) {
            setStyleById(elements[i], styles);
        }
        return true;
    }
    window['Alex']['setStyleByClassName'] = setStyleByClassName;

    //通过标签名修改多个元素的样式
    function setStyleByTagName(tagName, styles, parent) {
        parent = $(parent) || document;
        var elements = parent.getElementsByTagName(tagName);
        for (var i = 0, len = elements.length; i < len; i++) {
            setStyleById(elements[i], styles);
        }
        return true;
    }
    window['Alex']['setStyleByTagName'] = setStyleByTagName;

    //取得包含元素类名的数组
    function getClassNames(element) {
        if (!(element = $(element))) {
            return false;
        }
        //用一个空格替换多个空格，然后基于空格分割类名
        return element.className.replace(/\s+/g, ' ').split(' ');
    }
    window['Alex']['getClassNames'] = getClassNames;

    //检查元素中是否存在某个类
    function hasClassName(element, className) {
        if (!(element = $(element))) {
            return false;
        }
        var classes = getClassNames(element);
        for (var i = 0, len = classes.length; i < len; i++) {
            if (classes[i] === className) {
                return true;
            } 
        }
        return false;
    }
    window['Alex']['hasClassName'] = hasClassName;

    //为元素添加类
    function addClassName(element, className) {
        if (!(element = $(element))) {
            return false;
        }
        element.className += (element.className ? ' ' : '') + className;
        return true;
    }
    window['Alex']['addClassName'] = addClassName;

    //从元素中删除类
    function removeClassName(element, className) {
        if (!(element = $(element))) {
            return false;
        }
        var classes = getClassNames(element);
        //遍历数组删除匹配项，需要反向循环
        for (var len = classes.length, i = len - 1; i >= 0; i--) {
            if (classes[i] === className) {
                classes.splice(i, 1);
            }
        }
        element.className = classes.join(' ');
        return (len === classes.length ? false : true);
    }
    window['Alex']['removeClassName'] = removeClassName;

    //添加新的样式表
    function addStyleSheet(url, media) {
        media = media || 'screen';
        var link = document.createElement('LINK');
        link.setAttribute('rel', 'stylesheet');
        link.setAttribute('type', 'text/css');
        link.setAttribute('href', url);
        link.setAttribute('media', media);
        document.getElementsByTagName('head')[0].appendChild(link);
    }
    window['Alex']['addStyleSheet'] = addStyleSheet;

    //移除样式表
    function removeStyleSheet(url, media) {
        var styles = getStyleSheets(url, media);
        for (var i = 0, len = styles.length; i < len; i++) {
            //样式表所属节点
            //W3C styleSheet.ownerNode; IE styleSheet.owningElement
            var node = styles[i].ownerNode || styles[i].owningElement;
            //禁用样式表
            styles[i].disabled = true;
            //移除节点
            node.parentNode.removeChild(node);
        }
    }
    window['Alex']['removeStyleSheet'] = removeStyleSheet;

    //通过 URL 和 media(可选) 取得包含所有样式表的数组
    function getStyleSheets(url, media) {
        var sheets = [];
        for (var i = 0, len = document.styleSheets.length; i < len; i++) {
            if (url && document.styleSheets[i].href.indexOf(url) === -1) {
                continue;
            }
            if (media) {
                //规范化 media 字符串
                media = media.replace(/,\s*/g, ',');
                var sheetMedia;

                if (document.styleSheets[i].media.mediaText) {
                    //W3C
                    sheetMedia = document.styleSheets[i].media.mediaText.replace(/,\s*/g, ',');
                    //safari 会添加额外的逗号和空格
                    sheetMedia = sheetMedia.replace(/,\s*$/, '');
                } else {
                    //MSIE
                    sheetMedia = document.styleSheets[i].media.replace(/,\s*/g, ',');
                }

                if (media !== sheetMedia) {
                    continue;
                }
            }
            sheets.push(document.styleSheets[i]);
        }
        return sheets;
    }
    window['Alex']['getStyleSheets'] = getStyleSheets;

    //编辑一条样式规则
    function editCSSRule(selector, styles, url, media) {
        var styleSheets = getStyleSheets(url, media);
        xxx = styleSheets;
        for (var i = 0, len = styleSheets.length; i < len; i++) {
            //取得规则列表
            //W3C styleSheets[i].cssRules; IE styleSheets[i].rules
            var rules = styleSheets[i].cssRules || styleSheets[i].rules;
            if (!rules) {
                continue;
            }

            //由于 IE 默认使用大写，故转换为大写形式
            //注意如果使用区分大小写的 id，可能会有冲突
            selector = selector.toUpperCase();

            for (var j = 0; j < rules.length; j++) {
                //检查匹配
                if (rules[j].selectorText.toUpperCase() === selector) {
                    for (var property in styles) {
                        if (!styles.hasOwnProperty(property)) {
                            continue;
                        }
                        rules[j].style[camelize(property)] = styles[property];
                    }
                }
            }
        }
    }
    window['Alex']['editCSSRule'] = editCSSRule;

    //添加一条样式规则
    function addCSSRule(selector, styles, index, url, media) {
        var declaration = '';

        for (var property in styles) {
            if (!styles.hasOwnProperty(property)) {
                continue;
            }
            declaration += property + ':' + styles[property] + '; ';
        }

        var styleSheets = getStyleSheets(url, media);

        var newIndex;
        for (var i = 0, len = styleSheets.length; i < len; i++) {
            //添加规则
            if (styleSheets[i].insertRule) {
                //W3C
                //index = length 是列表的末尾
                newIndex = (index >= 0 ? index : styleSheets[i].cssRules.length);
                styleSheets[i].insertRule(selector + ' { ' + declaration + ' } ', newIndex);
            } else if (styleSheets[i].addRule) {
                //IE
                //index = -1 是列表末尾
                newIndex = (index >= 0 ? index : -1);
                styleSheets[i].addRule(selector, declaration, newIndex);
            }
        }
    }
    window['Alex']['addCSSRule'] = addCSSRule;

    //取得一个元素的计算样式
    function getStyle(element, property) {
        if (!(element = $(element))) {
            return false;
        }

        //检测元素 style 属性中的值
        var value = element.style[camelize(property)];
        if (!value) {
            //取得计算值
            if (document.defaultView && document.defaultView.getComputedStyle) {
                //W3C
                var css = document.defaultView.getComputedStyle(element, null);
                value = css ? css.getPropertyValue(property) : null;
            } else if (element.currentStyle) {
                //MSIE
                vlaue = element.currentStyle[camelize(property)];
            }

        }
        //返回空字符串而不是 auto
        return value === 'auto' ? '' : value;
    }
    window['Alex']['getStyle'] = getStyle;
    window['Alex']['getStyleById'] = getStyle;

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

    // 解决 IE < 9 不能转化 DOM Collections
    function convertToArray(nodes) {
        var array = [];
        try {
            array = [].prototype.slice.call(nodes, 0);
        } catch (ex) {
            for (var i = 0, len = nodes.length; i < len; i++) {
                array.push(nodes[i]);
            }
        }
        return array;
    }

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
    window['Alex']['walkTheDOMRecursive'] = walkTheDOMRecursive;

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
    window['Alex']['walkTheDOMWithAttributes'] = walkTheDOMWithAttributes;

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