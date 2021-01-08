/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// identity function for calling harmony imports with the correct context
/******/ 	__webpack_require__.i = function(value) { return value; };
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 1);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(module) {

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = Websock;

var _util = __webpack_require__(2);

var _util2 = _interopRequireDefault(_util);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/*
 * Websock: high-performance binary WebSockets
 * Copyright (C) 2012 Joel Martin
 * Licensed under MPL 2.0 (see LICENSE.txt)
 *
 * Websock is similar to the standard WebSocket object but with extra
 * buffer handling.
 *
 * Websock has built-in receive queue buffering; the message event
 * does not contain actual data but is simply a notification that
 * there is new data available. Several rQ* methods are available to
 * read binary data off of the receive queue.
 */

[module];


/*jslint browser: true, bitwise: true */
/*global Util*/

function Websock() {
    "use strict";

    this._websocket = null; // WebSocket object

    this._rQi = 0; // Receive queue index
    this._rQlen = 0; // Next write position in the receive queue
    this._rQbufferSize = 1024 * 1024 * 4; // Receive queue buffer size (4 MiB)
    this._rQmax = this._rQbufferSize / 8;
    // called in init: this._rQ = new Uint8Array(this._rQbufferSize);
    this._rQ = null; // Receive queue

    this._sQbufferSize = 1024 * 10; // 10 KiB
    // called in init: this._sQ = new Uint8Array(this._sQbufferSize);
    this._sQlen = 0;
    this._sQ = null; // Send queue

    this._eventHandlers = {
        'message': function message() {},
        'open': function open() {},
        'close': function close() {},
        'error': function error() {}
    };
};

(function () {
    "use strict";
    // this has performance issues in some versions Chromium, and
    // doesn't gain a tremendous amount of performance increase in Firefox
    // at the moment.  It may be valuable to turn it on in the future.

    var ENABLE_COPYWITHIN = false;

    var MAX_RQ_GROW_SIZE = 40 * 1024 * 1024; // 40 MiB

    var typedArrayToString = function () {
        // This is only for PhantomJS, which doesn't like apply-ing
        // with Typed Arrays
        try {
            var arr = new Uint8Array([1, 2, 3]);
            String.fromCharCode.apply(null, arr);
            return function (a) {
                return String.fromCharCode.apply(null, a);
            };
        } catch (ex) {
            return function (a) {
                return String.fromCharCode.apply(null, Array.prototype.slice.call(a));
            };
        }
    }();

    Websock.prototype = {
        // Getters and Setters
        get_sQ: function get_sQ() {
            return this._sQ;
        },

        get_rQ: function get_rQ() {
            return this._rQ;
        },

        get_rQi: function get_rQi() {
            return this._rQi;
        },

        set_rQi: function set_rQi(val) {
            this._rQi = val;
        },

        // Receive Queue
        rQlen: function rQlen() {
            return this._rQlen - this._rQi;
        },

        rQpeek8: function rQpeek8() {
            return this._rQ[this._rQi];
        },

        rQshift8: function rQshift8() {
            return this._rQ[this._rQi++];
        },

        rQskip8: function rQskip8() {
            this._rQi++;
        },

        rQskipBytes: function rQskipBytes(num) {
            this._rQi += num;
        },

        // TODO(directxman12): test performance with these vs a DataView
        rQshift16: function rQshift16() {
            return (this._rQ[this._rQi++] << 8) + this._rQ[this._rQi++];
        },

        rQshift32: function rQshift32() {
            return (this._rQ[this._rQi++] << 24) + (this._rQ[this._rQi++] << 16) + (this._rQ[this._rQi++] << 8) + this._rQ[this._rQi++];
        },

        rQshiftStr: function rQshiftStr(len) {
            if (typeof len === 'undefined') {
                len = this.rQlen();
            }
            var arr = new Uint8Array(this._rQ.buffer, this._rQi, len);
            this._rQi += len;
            return typedArrayToString(arr);
        },

        rQshiftBytes: function rQshiftBytes(len) {
            if (typeof len === 'undefined') {
                len = this.rQlen();
            }
            this._rQi += len;
            return new Uint8Array(this._rQ.buffer, this._rQi - len, len);
        },

        rQshiftTo: function rQshiftTo(target, len) {
            if (len === undefined) {
                len = this.rQlen();
            }
            // TODO: make this just use set with views when using a ArrayBuffer to store the rQ
            target.set(new Uint8Array(this._rQ.buffer, this._rQi, len));
            this._rQi += len;
        },

        rQwhole: function rQwhole() {
            return new Uint8Array(this._rQ.buffer, 0, this._rQlen);
        },

        rQslice: function rQslice(start, end) {
            if (end) {
                return new Uint8Array(this._rQ.buffer, this._rQi + start, end - start);
            } else {
                return new Uint8Array(this._rQ.buffer, this._rQi + start, this._rQlen - this._rQi - start);
            }
        },

        // Check to see if we must wait for 'num' bytes (default to FBU.bytes)
        // to be available in the receive queue. Return true if we need to
        // wait (and possibly print a debug message), otherwise false.
        rQwait: function rQwait(msg, num, goback) {
            var rQlen = this._rQlen - this._rQi; // Skip rQlen() function call
            if (rQlen < num) {
                if (goback) {
                    if (this._rQi < goback) {
                        throw new Error("rQwait cannot backup " + goback + " bytes");
                    }
                    this._rQi -= goback;
                }
                return true; // true means need more data
            }
            return false;
        },

        // Send Queue

        flush: function flush() {
            if (this._websocket.bufferedAmount !== 0) {
                _util2.default.Debug("bufferedAmount: " + this._websocket.bufferedAmount);
            }

            if (this._sQlen > 0 && this._websocket.readyState === WebSocket.OPEN) {
                this._websocket.send(this._encode_message());
                this._sQlen = 0;
            }
        },

        send: function send(arr) {
            this._sQ.set(arr, this._sQlen);
            this._sQlen += arr.length;
            this.flush();
        },

        send_string: function send_string(str) {
            this.send(str.split('').map(function (chr) {
                return chr.charCodeAt(0);
            }));
        },

        // Event Handlers
        off: function off(evt) {
            this._eventHandlers[evt] = function () {};
        },

        on: function on(evt, handler) {
            this._eventHandlers[evt] = handler;
        },

        _allocate_buffers: function _allocate_buffers() {
            this._rQ = new Uint8Array(this._rQbufferSize);
            this._sQ = new Uint8Array(this._sQbufferSize);
        },

        init: function init() {
            this._allocate_buffers();
            this._rQi = 0;
            this._websocket = null;
        },

        open: function open(uri, protocols) {
            var ws_schema = uri.match(/^([a-z]+):\/\//)[1];
            this.init();

            this._websocket = new WebSocket(uri, protocols);
            this._websocket.binaryType = 'arraybuffer';

            this._websocket.onmessage = this._recv_message.bind(this);
            this._websocket.onopen = function () {
                _util2.default.Debug('>> WebSock.onopen');
                if (this._websocket.protocol) {
                    _util2.default.Info("Server choose sub-protocol: " + this._websocket.protocol);
                }

                this._eventHandlers.open();
                _util2.default.Debug("<< WebSock.onopen");
            }.bind(this);
            this._websocket.onclose = function (e) {
                _util2.default.Debug(">> WebSock.onclose");
                this._eventHandlers.close(e);
                _util2.default.Debug("<< WebSock.onclose");
            }.bind(this);
            this._websocket.onerror = function (e) {
                _util2.default.Debug(">> WebSock.onerror: " + e);
                this._eventHandlers.error(e);
                _util2.default.Debug("<< WebSock.onerror: " + e);
            }.bind(this);
        },

        close: function close() {
            if (this._websocket) {
                if (this._websocket.readyState === WebSocket.OPEN || this._websocket.readyState === WebSocket.CONNECTING) {
                    _util2.default.Info("Closing WebSocket connection");
                    this._websocket.close();
                }

                this._websocket.onmessage = function (e) {
                    return;
                };
            }
        },

        // private methods
        _encode_message: function _encode_message() {
            // Put in a binary arraybuffer
            // according to the spec, you can send ArrayBufferViews with the send method
            return new Uint8Array(this._sQ.buffer, 0, this._sQlen);
        },

        _expand_compact_rQ: function _expand_compact_rQ(min_fit) {
            var resizeNeeded = min_fit || this._rQlen - this._rQi > this._rQbufferSize / 2;
            if (resizeNeeded) {
                if (!min_fit) {
                    // just double the size if we need to do compaction
                    this._rQbufferSize *= 2;
                } else {
                    // otherwise, make sure we satisy rQlen - rQi + min_fit < rQbufferSize / 8
                    this._rQbufferSize = (this._rQlen - this._rQi + min_fit) * 8;
                }
            }

            // we don't want to grow unboundedly
            if (this._rQbufferSize > MAX_RQ_GROW_SIZE) {
                this._rQbufferSize = MAX_RQ_GROW_SIZE;
                if (this._rQbufferSize - this._rQlen - this._rQi < min_fit) {
                    throw new Exception("Receive Queue buffer exceeded " + MAX_RQ_GROW_SIZE + " bytes, and the new message could not fit");
                }
            }

            if (resizeNeeded) {
                var old_rQbuffer = this._rQ.buffer;
                this._rQmax = this._rQbufferSize / 8;
                this._rQ = new Uint8Array(this._rQbufferSize);
                this._rQ.set(new Uint8Array(old_rQbuffer, this._rQi));
            } else {
                if (ENABLE_COPYWITHIN) {
                    this._rQ.copyWithin(0, this._rQi);
                } else {
                    this._rQ.set(new Uint8Array(this._rQ.buffer, this._rQi));
                }
            }

            this._rQlen = this._rQlen - this._rQi;
            this._rQi = 0;
        },

        _decode_message: function _decode_message(data) {
            // push arraybuffer values onto the end
            var u8 = new Uint8Array(data);
            if (u8.length > this._rQbufferSize - this._rQlen) {
                this._expand_compact_rQ(u8.length);
            }
            this._rQ.set(u8, this._rQlen);
            this._rQlen += u8.length;
        },

        _recv_message: function _recv_message(e) {
            try {
                this._decode_message(e.data);
                if (this.rQlen() > 0) {
                    this._eventHandlers.message();
                    // Compact the receive queue
                    if (this._rQlen == this._rQi) {
                        this._rQlen = 0;
                        this._rQi = 0;
                    } else if (this._rQlen > this._rQmax) {
                        this._expand_compact_rQ();
                    }
                } else {
                    _util2.default.Debug("Ignoring empty message");
                }
            } catch (exc) {
                var exception_str = "";
                if (exc.name) {
                    exception_str += "\n    name: " + exc.name + "\n";
                    exception_str += "    message: " + exc.message + "\n";
                }

                if (typeof exc.description !== 'undefined') {
                    exception_str += "    description: " + exc.description + "\n";
                }

                if (typeof exc.stack !== 'undefined') {
                    exception_str += exc.stack;
                }

                if (exception_str.length > 0) {
                    _util2.default.Error("recv_message, caught exception: " + exception_str);
                } else {
                    _util2.default.Error("recv_message, caught exception: " + exc);
                }

                if (typeof exc.name !== 'undefined') {
                    this._eventHandlers.error(exc.name + ": " + exc.message);
                } else {
                    this._eventHandlers.error(exc);
                }
            }
        }
    };
})();
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(3)(module)))

/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _websock = __webpack_require__(0);

var _websock2 = _interopRequireDefault(_websock);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var SyncPlay = function SyncPlay(initobj, onconnected, videonode) {
  var version = "1.6.7";
  var username;
  var room;
  var password = null;
  var url;
  var socket;
  var motd = null;
  var conn_callback;
  var filename;
  var duration;
  var size;
  var clientRtt = 0;
  var node;
  var clientno;

  var clientIgnoringOnTheFly = 0;
  var serverIgnoringOnTheFly = 0;

  var paused;
  var position;
  var videoobj;
  var seek = false;
  var latencyCalculation;

  var stateChanged = false;

  var playlist = [];
  var playlistIndex = void 0;

  function init(initobj, onconnected, vnode) {
    url = initobj.url;
    room = initobj.room;
    node = vnode;
    username = initobj.name;
    conn_callback = onconnected;
    if (initobj.hasOwnProperty("password")) {
      password = initobj.password;
    }
  }
  init(initobj, onconnected, videonode);

  function establishWS(conncallback) {
    socket = new _websock2.default();
    socket.open("ws://" + url);
    socket.on("open", function (p) {
      sendHello();
    });
    socket.on("message", socketHandler);
  }

  function sendState(position, paused, doSeek, latencyCalculation, stateChange) {
    var state = {};
    if (typeof stateChange == "undefined") {
      return false;
    }
    var positionAndPausedIsSet = position != null && paused != null;
    var clientIgnoreIsNotSet = clientIgnoringOnTheFly == 0 || serverIgnoringOnTheFly != 0;
    if (clientIgnoreIsNotSet && positionAndPausedIsSet && videoobj.initialized) {
      state["playstate"] = {};
      state["playstate"]["position"] = position(videoobj);
      state["playstate"]["paused"] = paused(videoobj);
      if (doSeek) {
        state["playstate"]["doSeek"] = doSeek;
        seek = false;
      }
    }
    state["ping"] = {};
    if (latencyCalculation != null) {
      state["ping"]["latencyCalculation"] = latencyCalculation;
    }
    state["ping"]["clientLatencyCalculation"] = new Date().getTime() / 1000;
    state["ping"]["clientRtt"] = clientRtt;
    if (stateChange) {
      clientIgnoringOnTheFly += 1;
    }
    if (serverIgnoringOnTheFly || clientIgnoringOnTheFly) {
      state["ignoringOnTheFly"] = {};
      if (serverIgnoringOnTheFly) {
        state["ignoringOnTheFly"]["server"] = serverIgnoringOnTheFly;
        serverIgnoringOnTheFly = 0;
      }
      if (clientIgnoringOnTheFly) {
        state["ignoringOnTheFly"]["client"] = clientIgnoringOnTheFly;
      }
    }
    send({ "State": state });
  }

  function socketHandler() {
    var large_payload = socket.rQshiftStr();
    var split_payload = large_payload.split("\r\n");
    for (var index = 0; index < split_payload.length; index += 1) {
      if (split_payload[index] == "") {
        break;
      }
      var payload = JSON.parse(split_payload[index]);
      console.debug("Server << " + JSON.stringify(payload));
      if (payload.hasOwnProperty("Hello")) {
        motd = payload.Hello.motd;
        username = payload.Hello.username;
        sendRoomEvent("joined");
        conn_callback({
          connected: true,
          motd: motd,
          username: username
        });
      }
      if (payload.hasOwnProperty("Error")) {
        throw payload.Error;
      }
      if (payload.hasOwnProperty("Set")) {
        if (payload.Set.hasOwnProperty("user")) {
          for (var i in payload.Set.user) {
            if (payload.Set.user[i].hasOwnProperty("event")) {
              var sevent = new CustomEvent("userlist", {
                detail: {
                  user: Object.keys(payload.Set.user)[0],
                  evt: Object.keys(payload.Set.user[i]["event"])[0]
                },
                bubbles: true,
                cancelable: true
              });
              node.dispatchEvent(sevent);
            }
            if (payload.Set.user[i].hasOwnProperty("file")) {
              if (Object.keys(payload.Set.user)[0] != username) {
                var sevent = new CustomEvent("fileupdate", {
                  detail: payload.Set,
                  bubbles: true,
                  cancelable: true
                });
                node.dispatchEvent(sevent);
              }
            }
          }
        }
        if (payload.Set.hasOwnProperty("playlistIndex")) {
          playlistIndex = payload.Set.playlistIndex.index;
          var _sevent = new CustomEvent("playlistindex", {
            detail: payload.Set.playlistIndex,
            bubbles: true,
            cancelable: true
          });
          node.dispatchEvent(_sevent);
        }
        if (payload.Set.hasOwnProperty("playlistChange")) {
          playlist = payload.Set.playlistChange.files;
          var _sevent2 = new CustomEvent("playlistchanged", {
            detail: payload.Set.playlistChange,
            bubbles: true,
            cancelable: true
          });
          node.dispatchEvent(_sevent2);
        }
      }
      if (payload.hasOwnProperty("List")) {
        var room = Object.keys(payload.List)[0];
        var sevent = new CustomEvent("listusers", {
          detail: payload.List[room],
          bubbles: true,
          cancelable: true
        });
        node.dispatchEvent(sevent);
      }
      if (payload.hasOwnProperty("State")) {
        clientRtt = payload.State.ping.yourLatency;
        latencyCalculation = payload.State.ping.latencyCalculation;
        window.position = payload.State.playstate.position;

        if (payload.State.hasOwnProperty("ignoringOnTheFly")) {
          var ignore = payload.State.ignoringOnTheFly;
          if (ignore.hasOwnProperty("server")) {
            serverIgnoringOnTheFly = ignore["server"];
            clientIgnoringOnTheFly = 0;
            stateChanged = false;
          } else if (ignore.hasOwnProperty("client")) {
            if (ignore["client"] == clientIgnoringOnTheFly) {
              clientIgnoringOnTheFly = 0;
              stateChanged = false;
            }
          }
        }
        if (payload.State.playstate.hasOwnProperty("setBy")) {
          if (payload.State.playstate.setBy != null) {
            if (payload.State.playstate.setBy != username) {
              var sevent = new CustomEvent("userevent", {
                detail: payload.State.playstate,
                bubbles: true,
                cancelable: true
              });
              if (!stateChanged && !clientIgnoringOnTheFly) {
                stateChanged = false;
                node.dispatchEvent(sevent);
              }
            }
          }
        }
        sendState(position, paused, seek, latencyCalculation, stateChanged);
      }
    }
  }

  function sendFileInfo() {
    var payload = {
      "Set": {
        "file": {
          "duration": duration,
          "name": filename,
          "size": size
        }
      }
    };
    send(payload);
  }

  function sendList() {
    var payload = {
      "List": null
    };
    send(payload);
  }

  function sendPlaylist(playlist) {
    var payload = { "Set": { "playlistChange": { "user": username, "files": playlist } } };
    send(payload);
  }

  function sendPlaylistIndex(index) {
    var payload = { "Set": { "playlistIndex": { "user": username, "index": index } } };
    send(payload);
  }

  function sendRoomEvent(evt) {
    var user = username;
    var payload = {
      "Set": {
        "user": {}
      }
    };
    var userval = {
      "room": {
        "name": room
      },
      "event": {}
    };
    userval["event"][evt] = true;
    payload.Set.user[user] = userval;
    send(payload);
  }

  function sendHello() {
    var payload = {
      "Hello": {
        "username": username,
        "room": {
          "name": room
        },
        "version": version
      }
    };
    if (password != null) {
      if (typeof window.md5 != "undefined") {
        payload.Hello["password"] = window.md5(password);
      }
    }
    send(payload);
    sendList();
  }

  function send(message) {
    console.debug("Client >> " + JSON.stringify(message));
    message = JSON.stringify(message) + "\r\n";
    socket.send_string(message);
  }

  function setGetters(fobj, second) {
    videoobj = second;
    paused = fobj.is_paused;
    position = fobj.get_position;
    paused = paused.bind(second);
    position = position.bind(second);
  }

  function playPause() {
    if (videoobj.initialized) stateChanged = true;
  }

  function seeked() {
    if (videoobj.initialized) {
      seek = true;
      stateChanged = true;
    }
  }

  function getPlaylist() {
    return playlist;
  }

  function getPlaylistIndex() {
    return playlistIndex;
  }

  return {
    connect: function connect() {
      establishWS(onconnected);
    },
    set_file: function set_file(name, length, size_bytes) {
      filename = name;
      duration = length;
      size = size_bytes;
      sendFileInfo();
    },
    setStateGetters: setGetters,
    disconnect: function disconnect() {
      sendRoomEvent("left");
    },
    playPause: playPause,
    seeked: seeked,
    getPlaylistIndex: getPlaylistIndex,
    getPlaylist: getPlaylist,
    sendPlaylistIndex: sendPlaylistIndex,
    sendPlaylist: sendPlaylist
  };
};

window.SyncPlay = SyncPlay;

/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/*
 * from noVNC: HTML5 VNC client
 * Copyright (C) 2012 Joel Martin
 * Licensed under MPL 2.0 (see LICENSE.txt)
 *
 * See README.md for usage and integration instructions.
 */


/*jslint bitwise: false, white: false */
/*global window, console, document, navigator, ActiveXObject */

// Globals defined here

Object.defineProperty(exports, "__esModule", {
    value: true
});
var Util = {};

/*
 * Make arrays quack
 */

Array.prototype.push8 = function (num) {
    this.push(num & 0xFF);
};

Array.prototype.push16 = function (num) {
    this.push(num >> 8 & 0xFF, num & 0xFF);
};
Array.prototype.push32 = function (num) {
    this.push(num >> 24 & 0xFF, num >> 16 & 0xFF, num >> 8 & 0xFF, num & 0xFF);
};

// IE does not support map (even in IE9)
//This prototype is provided by the Mozilla foundation and
//is distributed under the MIT license.
//http://www.ibiblio.org/pub/Linux/LICENSES/mit.license
if (!Array.prototype.map) {
    Array.prototype.map = function (fun /*, thisp*/) {
        var len = this.length;
        if (typeof fun != "function") throw new TypeError();

        var res = new Array(len);
        var thisp = arguments[1];
        for (var i = 0; i < len; i++) {
            if (i in this) res[i] = fun.call(thisp, this[i], i, this);
        }

        return res;
    };
}

// 
// requestAnimationFrame shim with setTimeout fallback
//

window.requestAnimFrame = function () {
    return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame || function (callback) {
        window.setTimeout(callback, 1000 / 60);
    };
}();

/* 
 * ------------------------------------------------------
 * Namespaced in Util
 * ------------------------------------------------------
 */

/*
 * Logging/debug routines
 */

Util._log_level = 'warn';
Util.init_logging = function (level) {
    if (typeof level === 'undefined') {
        level = Util._log_level;
    } else {
        Util._log_level = level;
    }
    if (typeof window.console === "undefined") {
        if (typeof window.opera !== "undefined") {
            window.console = {
                'log': window.opera.postError,
                'warn': window.opera.postError,
                'error': window.opera.postError };
        } else {
            window.console = {
                'log': function log(m) {},
                'warn': function warn(m) {},
                'error': function error(m) {} };
        }
    }

    Util.Debug = Util.Info = Util.Warn = Util.Error = function (msg) {};
    switch (level) {
        case 'debug':
            Util.Debug = function (msg) {
                console.log(msg);
            };
        case 'info':
            Util.Info = function (msg) {
                console.log(msg);
            };
        case 'warn':
            Util.Warn = function (msg) {
                console.warn(msg);
            };
        case 'error':
            Util.Error = function (msg) {
                console.error(msg);
            };
        case 'none':
            break;
        default:
            throw "invalid logging type '" + level + "'";
    }
};
Util.get_logging = function () {
    return Util._log_level;
};
// Initialize logging level
Util.init_logging();

// Set configuration default for Crockford style function namespaces
Util.conf_default = function (cfg, api, defaults, v, mode, type, defval, desc) {
    var getter, setter;

    // Default getter function
    getter = function getter(idx) {
        if (type in { 'arr': 1, 'array': 1 } && typeof idx !== 'undefined') {
            return cfg[v][idx];
        } else {
            return cfg[v];
        }
    };

    // Default setter function
    setter = function setter(val, idx) {
        if (type in { 'boolean': 1, 'bool': 1 }) {
            if (!val || val in { '0': 1, 'no': 1, 'false': 1 }) {
                val = false;
            } else {
                val = true;
            }
        } else if (type in { 'integer': 1, 'int': 1 }) {
            val = parseInt(val, 10);
        } else if (type === 'str') {
            val = String(val);
        } else if (type === 'func') {
            if (!val) {
                val = function val() {};
            }
        }
        if (typeof idx !== 'undefined') {
            cfg[v][idx] = val;
        } else {
            cfg[v] = val;
        }
    };

    // Set the description
    api[v + '_description'] = desc;

    // Set the getter function
    if (typeof api['get_' + v] === 'undefined') {
        api['get_' + v] = getter;
    }

    // Set the setter function with extra sanity checks
    if (typeof api['set_' + v] === 'undefined') {
        api['set_' + v] = function (val, idx) {
            if (mode in { 'RO': 1, 'ro': 1 }) {
                throw v + " is read-only";
            } else if (mode in { 'WO': 1, 'wo': 1 } && typeof cfg[v] !== 'undefined') {
                throw v + " can only be set once";
            }
            setter(val, idx);
        };
    }

    // Set the default value
    if (typeof defaults[v] !== 'undefined') {
        defval = defaults[v];
    } else if (type in { 'arr': 1, 'array': 1 } && !(defval instanceof Array)) {
        defval = [];
    }
    // Coerce existing setting to the right type
    //Util.Debug("v: " + v + ", defval: " + defval + ", defaults[v]: " + defaults[v]);
    setter(defval);
};

// Set group of configuration defaults
Util.conf_defaults = function (cfg, api, defaults, arr) {
    var i;
    for (i = 0; i < arr.length; i++) {
        Util.conf_default(cfg, api, defaults, arr[i][0], arr[i][1], arr[i][2], arr[i][3], arr[i][4]);
    }
};

/*
 * Cross-browser routines
 */

// Dynamically load scripts without using document.write()
// Reference: http://unixpapa.com/js/dyna.html
//
// Handles the case where load_scripts is invoked from a script that
// itself is loaded via load_scripts. Once all scripts are loaded the
// window.onscriptsloaded handler is called (if set).
Util.get_include_uri = function () {
    return typeof INCLUDE_URI !== "undefined" ? INCLUDE_URI : "include/";
};
Util._loading_scripts = [];
Util._pending_scripts = [];
Util.load_scripts = function (files) {
    var head = document.getElementsByTagName('head')[0],
        script,
        ls = Util._loading_scripts,
        ps = Util._pending_scripts;
    for (var f = 0; f < files.length; f++) {
        script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = Util.get_include_uri() + files[f];
        //console.log("loading script: " + script.src);
        script.onload = script.onreadystatechange = function (e) {
            while (ls.length > 0 && (ls[0].readyState === 'loaded' || ls[0].readyState === 'complete')) {
                // For IE, append the script to trigger execution
                var s = ls.shift();
                //console.log("loaded script: " + s.src);
                head.appendChild(s);
            }
            if (!this.readyState || Util.Engine.presto && this.readyState === 'loaded' || this.readyState === 'complete') {
                if (ps.indexOf(this) >= 0) {
                    this.onload = this.onreadystatechange = null;
                    //console.log("completed script: " + this.src);
                    ps.splice(ps.indexOf(this), 1);

                    // Call window.onscriptsload after last script loads
                    if (ps.length === 0 && window.onscriptsload) {
                        window.onscriptsload();
                    }
                }
            }
        };
        // In-order script execution tricks
        if (Util.Engine.trident) {
            // For IE wait until readyState is 'loaded' before
            // appending it which will trigger execution
            // http://wiki.whatwg.org/wiki/Dynamic_Script_Execution_Order
            ls.push(script);
        } else {
            // For webkit and firefox set async=false and append now
            // https://developer.mozilla.org/en-US/docs/HTML/Element/script
            script.async = false;
            head.appendChild(script);
        }
        ps.push(script);
    }
};

// Get DOM element position on page
Util.getPosition = function (obj) {
    var x = 0,
        y = 0;
    if (obj.offsetParent) {
        do {
            x += obj.offsetLeft;
            y += obj.offsetTop;
            obj = obj.offsetParent;
        } while (obj);
    }
    return { 'x': x, 'y': y };
};

// Get mouse event position in DOM element
Util.getEventPosition = function (e, obj, scale) {
    var evt, docX, docY, pos;
    //if (!e) evt = window.event;
    evt = e ? e : window.event;
    evt = evt.changedTouches ? evt.changedTouches[0] : evt.touches ? evt.touches[0] : evt;
    if (evt.pageX || evt.pageY) {
        docX = evt.pageX;
        docY = evt.pageY;
    } else if (evt.clientX || evt.clientY) {
        docX = evt.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
        docY = evt.clientY + document.body.scrollTop + document.documentElement.scrollTop;
    }
    pos = Util.getPosition(obj);
    if (typeof scale === "undefined") {
        scale = 1;
    }
    return { 'x': (docX - pos.x) / scale, 'y': (docY - pos.y) / scale };
};

// Event registration. Based on: http://www.scottandrew.com/weblog/articles/cbs-events
Util.addEvent = function (obj, evType, fn) {
    if (obj.attachEvent) {
        var r = obj.attachEvent("on" + evType, fn);
        return r;
    } else if (obj.addEventListener) {
        obj.addEventListener(evType, fn, false);
        return true;
    } else {
        throw "Handler could not be attached";
    }
};

Util.removeEvent = function (obj, evType, fn) {
    if (obj.detachEvent) {
        var r = obj.detachEvent("on" + evType, fn);
        return r;
    } else if (obj.removeEventListener) {
        obj.removeEventListener(evType, fn, false);
        return true;
    } else {
        throw "Handler could not be removed";
    }
};

Util.stopEvent = function (e) {
    if (e.stopPropagation) {
        e.stopPropagation();
    } else {
        e.cancelBubble = true;
    }

    if (e.preventDefault) {
        e.preventDefault();
    } else {
        e.returnValue = false;
    }
};

// Set browser engine versions. Based on mootools.
Util.Features = { xpath: !!document.evaluate, air: !!window.runtime, query: !!document.querySelector };

Util.Engine = {
    // Version detection break in Opera 11.60 (errors on arguments.callee.caller reference)
    //'presto': (function() {
    //         return (!window.opera) ? false : ((arguments.callee.caller) ? 960 : ((document.getElementsByClassName) ? 950 : 925)); }()),
    'presto': function () {
        return !window.opera ? false : true;
    }(),

    'trident': function () {
        return !window.ActiveXObject ? false : window.XMLHttpRequest ? document.querySelectorAll ? 6 : 5 : 4;
    }(),
    'webkit': function () {
        try {
            return navigator.taintEnabled ? false : Util.Features.xpath ? Util.Features.query ? 525 : 420 : 419;
        } catch (e) {
            return false;
        }
    }(),
    //'webkit': (function() {
    //        return ((typeof navigator.taintEnabled !== "unknown") && navigator.taintEnabled) ? false : ((Util.Features.xpath) ? ((Util.Features.query) ? 525 : 420) : 419); }()),
    'gecko': function () {
        return !document.getBoxObjectFor && window.mozInnerScreenX == null ? false : document.getElementsByClassName ? 19 : 18;
    }()
};
if (Util.Engine.webkit) {
    // Extract actual webkit version if available
    Util.Engine.webkit = function (v) {
        var re = new RegExp('WebKit/([0-9\.]*) ');
        v = (navigator.userAgent.match(re) || ['', v])[1];
        return parseFloat(v, 10);
    }(Util.Engine.webkit);
}

exports.default = Util;

/***/ }),
/* 3 */
/***/ (function(module, exports) {

module.exports = function(module) {
	if(!module.webpackPolyfill) {
		module.deprecate = function() {};
		module.paths = [];
		// module.parent = undefined by default
		if(!module.children) module.children = [];
		Object.defineProperty(module, "loaded", {
			enumerable: true,
			get: function() {
				return module.l;
			}
		});
		Object.defineProperty(module, "id", {
			enumerable: true,
			get: function() {
				return module.i;
			}
		});
		module.webpackPolyfill = 1;
	}
	return module;
};


/***/ })
/******/ ]);