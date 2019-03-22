/*
 * 日志
 */
(function(){
    function MyLogger(id) {
        id = id || 'AlexLogWindow';
        
        //引用日志窗口的 DOM 节点
        var logWindow = null;
    
        //在 DOM 树中创建 logWindow 节点
        var createWindow = function() {
            //取得新窗口在浏览器中居左下角放置时的左上角位置
            var browserWindowSize = Alex.getBrowserWindowSize();
            var top = browserWindowSize.height - 200;
            var left = 0;
    
            //创建作为日志窗口的 DOM 节点
            logWindow = document.createElement('ul');
    
            //指定 id 值以便必要时在 DOM 树能够识别它
            logWindow.setAttribute('id', id);
    
            //在屏幕中居左下定位日志窗口
            logWindow.style.position = 'absolute';
            logWindow.style.top = top + 'px';
            logWindow.style.left = left + 'px';
    
            //设置固定大小并允许窗口内容滚动
            logWindow.style.width = '200px';
            logWindow.style.height = '200px';
            logWindow.style.overflow = 'scroll';
    
            //添加其他样式
            logWindow.style.listStyle = 'none';
            logWindow.style.padding = '0';
            logWindow.style.margin = '0';
            logWindow.style.border = '1px solid gray';
            logWindow.style.backgroundColor = 'white';
            logWindow.style.font = '10px/10px Verdana, Tahoma, Sans';
    
            //将其添加到文档主体中，使其在浏览器中可见
            document.body.appendChild(logWindow);
        };
    
        //向日志窗口中添加一条新纪录
        this.writeRaw = function(message) {
            //如果初始的窗口不存在，则创建它
            if (!logWindow) {
                createWindow();
            }
    
            //创建列表项
            var li = document.createElement('li');
            li.style.padding = '2px 3px';
            li.style.margin = '0';
            li.style.border = '0';
            li.style.borderBottom = '1px dotted black';
            li.style.color = '#000';
            li.style.font = '9px/9px Verdana, Tahoma, Sans';
    
            //为日志节点添加信息
            if (typeof message === 'undefined') {
                li.appendChild(document.createTextNode('Message was undefined'));
            } else if (typeof li.innerHTML !== 'undefined') {
                li.innerHTML = message;
            } else {
                li.appendChild(document.createTextNode(message));
            }
    
            //将这个条目添加到日志窗口
            logWindow.appendChild(li);
    
            return true;
        };
    }
    
    MyLogger.prototype = {
        //write 方法将 writeRaw 方法包装起来，同时执行了一些额外的检测
        //以防止代码记录某个对象的实例，并且将左右尖括号转换为 &lt; 和 &gt;
        write: function(message) {
            //警告 message 为空值
            if (typeof message === 'string' && message.length === 0) {
                return this.writeRaw('null message');
            }
            //如果 message 不是字符串，则尝试调用 toString() 方法
            //如果不存在，则记录对象类型
            if (typeof message !== 'string') {
                if (message.toString) {
                    return this.writeRaw(message.toString());
                } else {
                    return this.writeRaw(typeof message);
                }
            }
    
            //转换 < 和 > ，以便 innerHTML 不会将 message 作为 HTML 解析
            message = message.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    
            return this.writeRaw(message);
        },
    
        //向日志窗口中添加标题
        header: function(message) {
            message = '<span style="color:white;background-color:black;font-size:bold;padding:0 5px;">' +
                      message + "</span>";
            return this.writeRaw(message);
        }
    };
    
    if (!window.Alex) {
        window['Alex'] = {};
    }
    window['Alex']['log'] = new MyLogger();

})();