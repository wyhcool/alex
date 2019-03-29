
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
                window.innerWidth //最常用，可用 self.innerWidth 替换，self 指窗口本身，它返回的对象跟 window 对象是一模一样的
                || (de && de.clientWidth) //MSIE 严格模型
                || document.body.clientWidth //MSIE怪异(quirk)模式
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

    //设置 XMLHttpRequest 对象的各个不同的部分
    function getRequestObject(url, options) {
        //初始化请求对象
        var req = false;
        if (window.XMLHttpRequest) {
            req = new window.XMLHttpRequest();
        } else if (window.ActiveXObject) {
            req = new window.ActiveXObject('Microsoft.XMLHTTP');
        }

        if (!req) {
            return false;
        }

        //定义默认的选项
        options = options || {};
        options.method = options.method || 'GET';
        options.send = options.send || null;

        //为请求的各个阶段定义不同的侦听器
        req.onreadystatechange = function() {
            switch(req.readyState) {
                case 1:
                    //载入中
                    if (options.loadListener) {
                        options.loadListener.apply(req, arguments);
                    }
                    break;
                case 2:
                    //载入完成
                    if (options.loadedListener) {
                        options.loadedListener.apply(req, arguments);
                    }
                    break;
                case 3:
                    //交互
                    if (options.interactiveListener) {
                        options.interactiveListener.apply(req, arguments);
                    }
                    break;
                case 4:
                    //完成
                    //如果失败抛出错误
                    try {
                        if (req.status && req.status === 200) {

                            //针对 content-type 的特殊侦听器
                            //由于 Content-Type 头部可能包含字符集，需要通过正则提出所需部分
                            var contentType = req.getRequestHeader('Content-Type');
                            var mimeType = contentType.match(/\s*([^;]+)\s*(;|$)/i)[1];

                            switch(mimeType) {
                                case 'text/javascript':
                                case 'application/javascript':
                                    //响应是 javascript，以 req.responseText 作为回调的参数
                                    if (options.jsResponseListener) {
                                        options.jsResponseListener.call(req, req.responseText);
                                    }
                                    break;
                                case 'application/json':
                                    //响应是 json,对 req.responseText 进行解析，返回 json 对象
                                    if (options.jsonResponseListener) {
                                        try {
                                            var json = Alex.jsonParse(req.responseText);
                                        } catch (ex) {
                                            json = false;
                                        }
                                        options.jsonResponseListener.call(req, json);
                                    }
                                    break;
                                case 'text/xml':
                                    //响应是 xml
                                    if (options.xmlResponseListener) {
                                        options.xmlResponseListener.call(req, req.responseXML);
                                    }
                                    break;
                                case 'text/html':
                                    //响应是 html
                                    if (options.htmlResponseListener) {
                                        options.htmlResponseListener.call(req, req.responseText);
                                    }
                                    break;
                                    
                            }
                            //针对响应成功完成的侦听器
                            if (options.completeListener) {
                                options.completeListener.apply(req, arguments);
                            }

                        } else {
                            //响应完成却存在错误
                            if (options.errorListener) {
                                options.errorListener.apply(req, arguments);
                            }
                        }
                    } catch (ex) {
                        //忽略错误
                    }
                    break;
            }
        };

        //开启请求
        req.open(options.method, url, true);
        //添加特殊头部信息以标识请求
        req.setRequestHeader('X-ADS-Ajax-Request', 'AjaxRequest');
        return req;
    }
    window['Alex']['getRequestObject'] = getRequestObject;

    //通过包装 getRequestObject() 方法和 send() 方法发送 XMLHttpRequest 对象的请求
    function ajaxRequest(url, options) {
        var req = getRequestObject(url, options);
        return req.send(options.send);
    }
    window['Alex']['ajaxRequest'] = ajaxRequest;

    //
    //请求排队


    //跨域资源共享 JSONP 实现
    //XssHttpRequest 对象的计数器
    var XssHttpRequestCount = 0;
    //XssHttpRequest 对象的一个跨站点 <script> 标签的实现
    var XssHttpRequest = function() {
        this.requestID = 'XSS_HTTP_REQUEST_' + (++XssHttpRequestCount);
    }
    XssHttpRequest.prototype = {
        url: null,
        scriptObject: null,
        responseJSON: null,
        status: 0,
        readyState: 0,
        timeout: 30000,
        onreadystatechange: function() { },

        setReadyState: function(newReadyState){
            //如果比当前状态更新，则只更新就绪状态
            if (this.readyState < newReadyState || newReadyState === 0) {
                this.readyState = newReadyState;
                this.onreadystatechange();
            }
        },

        open: function(url, timeout) {
            this.timeout = timeout || 30000;
            //把一个名为 XSS_HTTP_REQUEST_CALLBACK 的特殊变量附加给 URL，其中包含本次请求的回调函数的名称
            this.url = url + ((url.indexOf('?') !== -1) ? '&' : '?') + 'XSS_HTTP_REQUEST_CALLBACK=' + this.requestID + '_CALLABCK';
            this.setReadyState(0);
        },

        send: function() {
            var requestObject = this;

            //创建一个载入外部数据的新 script 对象
            this.scriptObject = document.createElement('SCRIPT');
            this.scriptObject.setAttribute('id', this.requestID);
            this.scriptObject.setAttribute('type', 'text/javascript');

            //尚未设置 src 属性，也不将其添加到文档

            //创建一个在给定毫秒数之后触发的 setTimeout() 方法
            //如果在给定的事件内脚本没有载入完成，则取消载入
            var timeoutWatcher = setTimeout(function() {
                //在脚本晚于假定的停止时间之后载入的情况下，通过一个空方法重新赋值
                window[this.requestID + '_CALLBACK'] = function() {};

                //移除脚本以防止进一步载入
                requestObject.scriptObject.parentNode.removeChild(requestObject.scriptObject);

                //将状态设置为错误
                requestObject.status = 2;
                requestObject.statusText = 'Timeout after' + requestObject.timeout + ' milliseconds.';

                //更新就绪状态
                requestObject.setReadyState(2);
                requestObject.setReadyState(3);
                requestObject.setReadyState(4);
            }, this.timeout);


            //创建与请求中的回调方法匹配的方法
            //必须是全局方法，相当于在不同的 <script\> 中调用方法
            window[this.requestID + '_CALLBACK'] = function(JSON) {
                //当脚本载入时将执行该方法，同时传入预期的 JSON 对象

                //在请求载入成功时清除 timeoutWatcher 方法
                clearTimeout(timeoutWatcher);

                //更新就绪状态
                requestObject.setReadyState(2);
                requestObject.setReadyState(3);

                //将状态设置为成功
                requestObject.requestJSON = JSON;
                requestObject.status = 1;
                requestObject.statusText = 'Loaded';

                //更新就绪状态
                requestObject.setReadyState(4);
            };

            //设置初始就绪状态
            this.setReadyState(1);

            //最后设置 src 属性并将其添加到文档头部，这样才会载入脚本
            this.scriptObject.setAttribute('src', this.url);
            var head = document.getElementsByTagName('head')[0];
            head.appendChild(this.scriptObject);
        }
    };

    window['Alex']['XssHttpRequest'] = XssHttpRequest;

    //设置 XssHttpRequest 对象的不同部分
    function getXssRequestObject(url, options) {
        var req = new XssHttpRequest();

        options = options || {};
        //默认中断时间为 30 秒
        options.timeout = options.timeout || 30000;
        req.onreadystatechange = function() {
            switch(req.readyState) {
                case 1:
                    //载入中
                    if (options.loadListener) {
                        options.loadListener.apply(req, arguments);
                    }
                    break;
                case 2:
                    //载入完成
                    if (options.loadedListener) {
                        options.loadedListener.apply(req, arguments);
                    }
                    break;
                case 3:
                    //交互
                    if (options.interactiveListener) {
                        options.interactiveListener.apply(req, arguments);
                    }
                    break;
                case 4:
                    //完成
                    if (req.status === 1) {
                        if (options.completeListener) {
                            options.completeListener.apply(req, arguments);
                        }
                    } else {
                        if (options.errorListener) {
                            options.errorListener.apply(req, arguments);
                        }
                    }
                    break;
            }
        };
        req.open(url, options, timeout);

        return req;
    }
    window['Alex']['getXssRequestObject'] = getXssRequestObject;

    //发送 XssHttpRequest 对象
    function xssRequest(url, options) {
        var req = getXssRequestObject(url, options);
        return req.send(null);
    }
    window['Alex']['xssRequest'] = xssRequest;

    //生成回调函数
    function makeCallback(method, target) {
        return function() {
            method.apply(target, arguments);
        }
    }

    //跟踪地址变化
    //一个用来基于 hash 触发注册的方法的 URL hash 侦听器
    var actionPager = {
        //前一个 hash
        lastHash: '',
        //为 hash 模式注册的方法列表
        callbacks: [],
        //Safari 历史记录列表
        safariHistory: false,
        //IE iframe 引用
        msieHistory: false,
        //应该被转换的链接的类名
        ajaxifyClassName: '',
        //应用程序的根目录，当创建 hash 时它将是被清理后的 URL
        ajaxifyRoot: '',

        init: function(ajaxifyClass, ajaxifyRoot, startingHash) {
            
            this.ajaxifyClassName = ajaxifyClass || 'AlexActionLink';
            this.ajaxifyRoot = ajaxifyRoot || '';

            var ua = navigator.userAgent;
            if (/Safari/i.test(ua)) {
                this.safariHistory = [];
            } else if (/MSIE/i.test(ua)) {
                //MSIE 添加一个 iframe 以便跟踪重写后退按钮
                this.msieHistory = document.createElement('IFRAME');
                this.msieHistory.setAttribute('id', 'msieHistory');
                this.msieHistory.setAttribute('name', 'msieHistory');
                setStyleById(this.msieHistory, {
                    'width': '100px',
                    'height': '100px',
                    'border': '1px solid black',
                    'visibility': 'visible',
                    'zindex': -1
                });
                document.body.appendChild(this.msieHistory);
                this.msieHistory = frames['msieHistory'];
            }
            
            //将链接转换为 Ajax 链接
            this.ajaxifyLinks();

            //取得当前地址
            var location = this.getLocation();

            //检测地址中是否包含了 hash
            if (!location.hash && !startingHash) {
                startingHash = 'start';
            }

            //按照需要保存 hash
            var ajaxHash = this.getHashFromURL(location.hash) || startingHash;
            this.addBackButtonHash(ajaxHash);

            //添加监视事件以观察地址栏中的变化
            var watcherCallback = makeCallback(
                this.watchLocationForChange,
                this
            );
            
            window.setInterval(watcherCallback, 200);

        },

        //将链接转换为锚以便 Ajax 进行处理
        ajaxifyLinks: function() {
            var links = getElementsByClassName(this.ajaxifyClassName, 'a', document);
            for (var i = 0, len = links.length; i < len; i++) {
                if (hasClassName(links[i], 'AlexActionPagerModified')) {
                    continue;
                }

                //将 href 转换为 #value 形式
                links[i].setAttribute('href', 
                        this.convertURLToHash(links[i].getAttribute('href')));

                //注册单击事件以便在必要时添加历史记录
                addEvent(links[i], 'click', function() {
                    if (this.href && this.href.indexOf('#') > -1) {
                        actionPager.addBackButtonHash(
                            actionPager.getHashFromURL(this.href)
                        );
                    }
                });
            }
        },

        //保存 hash
        addBackButtonHash: function(ajaxHash) {
            //保存 hash
            if (!ajaxHash) {
                return false;
            }
            if (this.safariHistory !== false) {
                //为 safari 使用特殊数组
                if (this.safariHistory.length === 0) {
                    this.safariHistory[window.history.length] = ajaxHash;
                } else {
                    this.safariHistory[window.history.length+1] = ajaxHash;
                }
            } else if (this.msieHistory !== false) {
                //在 MSIE 中通过导航 iframe
                this.msieHistory.document.execCommand('Stop');
                this.msieHistory.location.href = '/fakepage?hash=' + ajaxHash + '&title=' + document.title;
            } else {
                //通过改变地址的值
                var timeoutCallback = makeCallback(function() {
                    if (tihis.getHashFromURL(window.location.href) !== ajaxHash) {
                        window.location.replace(location.href + '#' + ajaxHash);
                    }
                }, this);
                setTimeout(timeoutCallback, 200);
            }
            return true;
        },

        watchLocationForChange: function() {
            var newHash;
            //取得新的 hash 值
            if (this.safariHistory !== false) {
                if (this.safariHistory[history.length]) {
                    newHash = this.safariHistory[history.length];
                }
            } else if (this.msieHistory !== false) {
                newHash = this.msieHistory.location.href.split('&')[0].split('=')[1];
            } else if (location.hash !== '') {
                newHash = this.getHashFromURL(window.location.href);
            }

            //如果新 hash 值与最后一次 hash 值不相同，则更新页面
            if (newHash && this.lastHash !== newHash) {
                if (this.msieHistory !== false && this.getHashFromURL(window.location.href) !== newHash) {
                    //修复MSIE中的地址栏
                    location.hash = newHash;
                }

                //在发生异常的情况下使用 try-catch 结构
                try {
                    this.executeListeners(newHash);
                    this.ajaxifyLinks();
                } catch (ex) {
                    //TODO
                    alert(ex);
                }

                //将其保存为最后一个 hash
                this.lastHash = newHash;
            }
        },

        register: function(regex, method, context) {
            var obj = {'regex': regex};
            if (context) {
                obj.callback = function(matches) {
                    method.apply(context, matches);
                }
            } else {
                obj.callback = function(matches) {
                    method.apply(window, matches);
                }
            }
            //将侦听器添加到回调函数数组中
            this.callback.push(obj);
        },

        convertURLToHash: function(url) {
            if (!url) {
                //没有 url，因而返回一个 #
                return '#';
            } else if (url.indexOf('#') !== -1) {
                //存在 hash，因而返回它
                return url.split('#')[1];
            } else {
                //不存在 hash
                //如果 URL 中包含域名(MSIE)，则去掉
                if (url.indexOf('://') !== -1) {
                    url = url.match(/:\/\/[^\/]+(.*)/)[1];
                }
                //按照 init() 中的约定去掉根目录
                return '#' + url.substr(this.ajaxifyRoot.length);
            }
        },

        getHashFromURL: function(url) {
            if (!url || url.indexOf('#') === -1) {
                return '';
            }
            return url.split('#')[1];
        },

        getLocation: function() {
            //检查 hash
            if (!window.location.hash) {
                //没有则生成一个
                var url = {host: null, hash: null};
                if (window.location.href.indexOf('#') > -1) {
                    parts = window.location.href.split('#');
                    url.domain = parts[0];
                    url.hash = parts[1];
                } else {
                    url.domain = window.location;
                }
            }
            return window.location;
        },

        //执行与 hash 匹配的侦听器 
        executeListeners: function(hash) {
            //执行与 hash 匹配的任何侦听器
            var matches;
            for (var i in this.callbacks) {
                if (matches = hash.match(this.callbacks[i].regex)) {
                    this.callbacks[i].callback(matches);
                }
            }
        }
    };
    window['Alex']['actionPager'] = actionPager;

})();