/*
 * 观察者模式
 */
(function(){
    
    function Observer() {
        this.fns = [];
    }

    Observer.prototype = {
        subscribe: function(fn) {
            this.fns.push(fn);
        },

        unsubscribe: function(fn) {
            this.fns.filter(function(el) {
                if (el !== fn) {
                    return true;
                }
            });
        },
        update: function(o, thisObj) {
            var scope = thisObj || window;
            this.fns.forEach(function(el) {
                el.call(scope, o);
            });
        }
    };

    if (!window.Alex) {
        window['Alex'] = {};
    }
    window['Alex']['log'] = new MyLogger();

})();