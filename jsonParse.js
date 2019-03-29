// This is a function that can parse a JSON text, producing a JavaScript data
// structrue.
// It is a recursive descent parser.

(function() {

    var jsonParse = function() {
        
        // By defining the function inside of another function to avoid creating
        // global variables.

        var at,          //The index of the next character
            ch,          //The current character
            text,        //The JSON text
            escapee = {
                "\"": "\"",
                "\\": "\\",
                "/":  "/",
                b:    "\b",   //退格 backspace
                f:    "\f",  //换页 form feed
                n:    "\n",  //换行 line feed
                r:    "\r",  //回车 carriage return
                t:    "\t"   //制表 tab
            },

            // Call error when something is wrong.
            error = function(m) {
                throw {
                    name:    "SytaxError",
                    message:  m,
                    position: at,
                    text:     text
                };
            },

            // Get the next character.
            // If the parameter c is provided, verify that it matches the current 
            // character.
            next = function(c) {
                if (c && c !== ch) {
                    error("Excepted '" + c + "' instead of '" + ch + "'" );
                }

                // When there is no more characters, return the empty string.
                ch = text.charAt(at);
                at += 1;
                return ch;
            },

            // Skip whitespace
            white = function() {
                while (ch && /\s/.test(ch)) {
                    next();
                }
            },

            // Parse true, false, null
            word = function() {
                switch (ch) {
                    case "t":
                        next("t");
                        next("r");
                        next("u");
                        next("e");
                        return true;
                    case "f":
                        next("f");
                        next("a");
                        next("l");
                        next("s");
                        next("e");
                        return false;
                    case "n":
                        next("n");
                        next("u");
                        next("l");
                        next("l");
                        return null;
                }
                error("Unexpected '" + ch + "'");
            },

            // Parse a number value
            number = function() {
                var number,
                    string = "";

                if (ch === "-") {
                    string = ch;
                    next();
                }
                while (ch >= "0" && ch <= "9") {
                    string += ch;
                    next();
                }
                if (ch === ".") {
                    string += ch;
                    while (next() && ch >= "0" && ch <= "9") {
                        string += ch;
                    }
                }
                if (ch === "e" || ch === "E") {
                    string += ch;
                    next();
                    if (ch === "-" || ch === "+") {
                        string += ch;
                        next();
                    }
                    while(ch >= "0" && ch <= "9") {
                        string += ch;
                        next();
                    }
                }
                number = +string;
                if (isNaN(number)) {
                    error("Bad number");
                } else {
                    return number;
                }
            },

            // Parse a string vlaue
            string = function() {
                var hex,
                    i,
                    string = "",
                    uffff;

                if (ch === "\"") {
                    while (next()) {
                        if (ch === "\"") {
                            next();
                            return string;
                        } else if (ch === "\\") {
                            next();
                            if (ch === "u") {
                                uffff = 0;
                                for (i = 0; i < 4; i++) {
                                    hex = parseInt(next(), 16);
                                    if (!isFinite(hex)) {
                                        break;
                                    }
                                    uffff = uffff * 16 + hex;
                                }
                                string += String.fromCharCode(uffff);
                            } else if (typeof escapee[ch] === "string") {
                                string += escapee[ch];
                            } else {
                                break;
                            }
                        } else {
                            string += ch;
                        }
                    }
                }
                error("Bad string");
            },

            // Parse an array value
            array = function() {
                var array = [];

                if (ch === "[") {
                    next();
                    white();
                    if (ch === "]") {
                        next();
                        return array; //empty
                    }
                    while (ch) {
                        array.push(value());
                        white();
                        if (ch === "]") {
                            next();
                            return array;
                        }
                        next(",");
                        white();
                    }
                }
                error("Bad array");
            },
            
            // Parse an object value
            object = function() {
                var key,
                    object = {};

                if (ch === "{") {
                    next();
                    white();
                    if (ch === "}") {
                        next();
                        return object; //empty
                    }
                    while (ch) {
                        key = string();
                        white();
                        next(":");
                        object[key] = value();
                        white();
                        if (ch === "}") {
                            next();
                            return object;
                        }
                        next(",");
                        white();
                    }
                }
                error("Bad object");
            },

            // Parse a JSON value. 
            // It could be an object, an array, a string, a number or a word
            value = function() {
                white();
                switch(ch) {
                    case "{":
                        return object();
                    case "[":
                        return array();
                    case "\"":
                        return string();
                    case "-":
                        return number();
                    default:
                        return ch >= "0" && ch <= "9" ? number() : word();
                }
            };

        // It will access to all of the above functions and varibales.
        return function(source, reviver) {
            var result;

            text = source;
            at = 0;
            ch = " ";
            result = value();
            white();
            if (ch) {
                error("Syntax error");
            }

            return typeof reviver === "function" ?
                function walk(holder, key) {
                    var k, v, value = holder[key];
                    if (value && typeof value === "object") {
                        for (k in value) {
                            if (Object.prototype.hasOwnProperty.call(value, k)) {
                                v = walk(value, k);
                                if (v !== undefined) {
                                    value[k] = v;
                                } else {
                                    delete value[k];
                                }
                            }
                        }
                    }
                    return reviver.call(holder, key, value);
                }({"": result}, "") : result;
        };
    }();

    if (!window.Alex) {
        window['Alex'] = {};
    }
    window['Alex']['jsonParse'] = jsonParse;

})();
