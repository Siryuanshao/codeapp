function NA(Q) {
  return Q && Q.__esModule && Object.prototype.hasOwnProperty.call(Q, "default") ? Q.default : Q;
}
var d = { exports: {} }, v;
function GA() {
  if (v) return d.exports;
  v = 1;
  var Q = typeof Reflect == "object" ? Reflect : null, A = Q && typeof Q.apply == "function" ? Q.apply : function(B, D, o) {
    return Function.prototype.apply.call(B, D, o);
  }, g;
  Q && typeof Q.ownKeys == "function" ? g = Q.ownKeys : Object.getOwnPropertySymbols ? g = function(B) {
    return Object.getOwnPropertyNames(B).concat(Object.getOwnPropertySymbols(B));
  } : g = function(B) {
    return Object.getOwnPropertyNames(B);
  };
  function I(E) {
    console && console.warn && console.warn(E);
  }
  var C = Number.isNaN || function(B) {
    return B !== B;
  };
  function w() {
    w.init.call(this);
  }
  d.exports = w, d.exports.once = wA, w.EventEmitter = w, w.prototype._events = void 0, w.prototype._eventsCount = 0, w.prototype._maxListeners = void 0;
  var N = 10;
  function F(E) {
    if (typeof E != "function")
      throw new TypeError('The "listener" argument must be of type Function. Received type ' + typeof E);
  }
  Object.defineProperty(w, "defaultMaxListeners", {
    enumerable: !0,
    get: function() {
      return N;
    },
    set: function(E) {
      if (typeof E != "number" || E < 0 || C(E))
        throw new RangeError('The value of "defaultMaxListeners" is out of range. It must be a non-negative number. Received ' + E + ".");
      N = E;
    }
  }), w.init = function() {
    (this._events === void 0 || this._events === Object.getPrototypeOf(this)._events) && (this._events = /* @__PURE__ */ Object.create(null), this._eventsCount = 0), this._maxListeners = this._maxListeners || void 0;
  }, w.prototype.setMaxListeners = function(B) {
    if (typeof B != "number" || B < 0 || C(B))
      throw new RangeError('The value of "n" is out of range. It must be a non-negative number. Received ' + B + ".");
    return this._maxListeners = B, this;
  };
  function y(E) {
    return E._maxListeners === void 0 ? w.defaultMaxListeners : E._maxListeners;
  }
  w.prototype.getMaxListeners = function() {
    return y(this);
  }, w.prototype.emit = function(B) {
    for (var D = [], o = 1; o < arguments.length; o++) D.push(arguments[o]);
    var G = B === "error", Y = this._events;
    if (Y !== void 0)
      G = G && Y.error === void 0;
    else if (!G)
      return !1;
    if (G) {
      var k;
      if (D.length > 0 && (k = D[0]), k instanceof Error)
        throw k;
      var R = new Error("Unhandled error." + (k ? " (" + k.message + ")" : ""));
      throw R.context = k, R;
    }
    var a = Y[B];
    if (a === void 0)
      return !1;
    if (typeof a == "function")
      A(a, this, D);
    else
      for (var r = a.length, oA = n(a, r), o = 0; o < r; ++o)
        A(oA[o], this, D);
    return !0;
  };
  function s(E, B, D, o) {
    var G, Y, k;
    if (F(D), Y = E._events, Y === void 0 ? (Y = E._events = /* @__PURE__ */ Object.create(null), E._eventsCount = 0) : (Y.newListener !== void 0 && (E.emit(
      "newListener",
      B,
      D.listener ? D.listener : D
    ), Y = E._events), k = Y[B]), k === void 0)
      k = Y[B] = D, ++E._eventsCount;
    else if (typeof k == "function" ? k = Y[B] = o ? [D, k] : [k, D] : o ? k.unshift(D) : k.push(D), G = y(E), G > 0 && k.length > G && !k.warned) {
      k.warned = !0;
      var R = new Error("Possible EventEmitter memory leak detected. " + k.length + " " + String(B) + " listeners added. Use emitter.setMaxListeners() to increase limit");
      R.name = "MaxListenersExceededWarning", R.emitter = E, R.type = B, R.count = k.length, I(R);
    }
    return E;
  }
  w.prototype.addListener = function(B, D) {
    return s(this, B, D, !1);
  }, w.prototype.on = w.prototype.addListener, w.prototype.prependListener = function(B, D) {
    return s(this, B, D, !0);
  };
  function BA() {
    if (!this.fired)
      return this.target.removeListener(this.type, this.wrapFn), this.fired = !0, arguments.length === 0 ? this.listener.call(this.target) : this.listener.apply(this.target, arguments);
  }
  function b(E, B, D) {
    var o = { fired: !1, wrapFn: void 0, target: E, type: B, listener: D }, G = BA.bind(o);
    return G.listener = D, o.wrapFn = G, G;
  }
  w.prototype.once = function(B, D) {
    return F(D), this.on(B, b(this, B, D)), this;
  }, w.prototype.prependOnceListener = function(B, D) {
    return F(D), this.prependListener(B, b(this, B, D)), this;
  }, w.prototype.removeListener = function(B, D) {
    var o, G, Y, k, R;
    if (F(D), G = this._events, G === void 0)
      return this;
    if (o = G[B], o === void 0)
      return this;
    if (o === D || o.listener === D)
      --this._eventsCount === 0 ? this._events = /* @__PURE__ */ Object.create(null) : (delete G[B], G.removeListener && this.emit("removeListener", B, o.listener || D));
    else if (typeof o != "function") {
      for (Y = -1, k = o.length - 1; k >= 0; k--)
        if (o[k] === D || o[k].listener === D) {
          R = o[k].listener, Y = k;
          break;
        }
      if (Y < 0)
        return this;
      Y === 0 ? o.shift() : EA(o, Y), o.length === 1 && (G[B] = o[0]), G.removeListener !== void 0 && this.emit("removeListener", B, R || D);
    }
    return this;
  }, w.prototype.off = w.prototype.removeListener, w.prototype.removeAllListeners = function(B) {
    var D, o, G;
    if (o = this._events, o === void 0)
      return this;
    if (o.removeListener === void 0)
      return arguments.length === 0 ? (this._events = /* @__PURE__ */ Object.create(null), this._eventsCount = 0) : o[B] !== void 0 && (--this._eventsCount === 0 ? this._events = /* @__PURE__ */ Object.create(null) : delete o[B]), this;
    if (arguments.length === 0) {
      var Y = Object.keys(o), k;
      for (G = 0; G < Y.length; ++G)
        k = Y[G], k !== "removeListener" && this.removeAllListeners(k);
      return this.removeAllListeners("removeListener"), this._events = /* @__PURE__ */ Object.create(null), this._eventsCount = 0, this;
    }
    if (D = o[B], typeof D == "function")
      this.removeListener(B, D);
    else if (D !== void 0)
      for (G = D.length - 1; G >= 0; G--)
        this.removeListener(B, D[G]);
    return this;
  };
  function m(E, B, D) {
    var o = E._events;
    if (o === void 0)
      return [];
    var G = o[B];
    return G === void 0 ? [] : typeof G == "function" ? D ? [G.listener || G] : [G] : D ? DA(G) : n(G, G.length);
  }
  w.prototype.listeners = function(B) {
    return m(this, B, !0);
  }, w.prototype.rawListeners = function(B) {
    return m(this, B, !1);
  }, w.listenerCount = function(E, B) {
    return typeof E.listenerCount == "function" ? E.listenerCount(B) : X.call(E, B);
  }, w.prototype.listenerCount = X;
  function X(E) {
    var B = this._events;
    if (B !== void 0) {
      var D = B[E];
      if (typeof D == "function")
        return 1;
      if (D !== void 0)
        return D.length;
    }
    return 0;
  }
  w.prototype.eventNames = function() {
    return this._eventsCount > 0 ? g(this._events) : [];
  };
  function n(E, B) {
    for (var D = new Array(B), o = 0; o < B; ++o)
      D[o] = E[o];
    return D;
  }
  function EA(E, B) {
    for (; B + 1 < E.length; B++)
      E[B] = E[B + 1];
    E.pop();
  }
  function DA(E) {
    for (var B = new Array(E.length), D = 0; D < B.length; ++D)
      B[D] = E[D].listener || E[D];
    return B;
  }
  function wA(E, B) {
    return new Promise(function(D, o) {
      function G(k) {
        E.removeListener(B, Y), o(k);
      }
      function Y() {
        typeof E.removeListener == "function" && E.removeListener("error", G), D([].slice.call(arguments));
      }
      f(E, B, Y, { once: !0 }), B !== "error" && iA(E, G, { once: !0 });
    });
  }
  function iA(E, B, D) {
    typeof E.on == "function" && f(E, "error", B, D);
  }
  function f(E, B, D, o) {
    if (typeof E.on == "function")
      o.once ? E.once(B, D) : E.on(B, D);
    else if (typeof E.addEventListener == "function")
      E.addEventListener(B, function G(Y) {
        o.once && E.removeEventListener(B, G), D(Y);
      });
    else
      throw new TypeError('The "emitter" argument must be of type EventEmitter. Received type ' + typeof E);
  }
  return d.exports;
}
var kA = GA();
const gA = /* @__PURE__ */ NA(kA);
class P {
  __destroy_into_raw() {
    const A = this.__wbg_ptr;
    return this.__wbg_ptr = 0, u.unregister(this), A;
  }
  free() {
    const A = this.__destroy_into_raw();
    i.__wbg_dapadapter_free(A, 0);
  }
  /**
   * Attaches a worker to the adapter.
   *
   * Listens for the worker's `debug` message (containing `DebugInfo`) to construct
   * the internal debugger, `paused` messages to emit DAP `stopped` events,
   * and `stop` messages to emit `terminated`.
   * @param {Worker} worker
   */
  attach(A) {
    i.dapadapter_attach(this.__wbg_ptr, A);
  }
  constructor() {
    const A = i.dapadapter_new();
    return this.__wbg_ptr = A >>> 0, u.register(this, this.__wbg_ptr, this), this;
  }
  /**
   * @param {Function} callback
   */
  on(A) {
    i.dapadapter_on(this.__wbg_ptr, A);
  }
  /**
   * @param {any} msg
   * @returns {any}
   */
  sendMessage(A) {
    return i.dapadapter_sendMessage(this.__wbg_ptr, A);
  }
  /**
   * @param {boolean} value
   */
  setFilterInternals(A) {
    i.dapadapter_setFilterInternals(this.__wbg_ptr, A);
  }
}
Symbol.dispose && (P.prototype[Symbol.dispose] = P.prototype.free);
class x {
  static __wrap(A) {
    A = A >>> 0;
    const g = Object.create(x.prototype);
    return g.__wbg_ptr = A, _.register(g, g.__wbg_ptr, g), g;
  }
  __destroy_into_raw() {
    const A = this.__wbg_ptr;
    return this.__wbg_ptr = 0, _.unregister(this), A;
  }
  free() {
    const A = this.__destroy_into_raw();
    i.__wbg_trap_free(A, 0);
  }
  /**
   * A marker method to indicate that an object is an instance of the `Trap`
   * class.
   */
  static __wbg_wasmer_trap() {
    i.trap___wbg_wasmer_trap();
  }
}
Symbol.dispose && (x.prototype[Symbol.dispose] = x.prototype.free);
function MA(Q) {
  const A = H(Q, i.__wbindgen_malloc, i.__wbindgen_realloc), g = L, I = i.prefetch_urls(A, g);
  var C = IA(I[0], I[1]).slice();
  return i.__wbindgen_free(I[0], I[1] * 4, 4), C;
}
function FA() {
  return {
    __proto__: null,
    "./engine_bg.js": {
      __proto__: null,
      __wbg_BigInt_b7bbccdff258c9f2: function(A) {
        return BigInt(A);
      },
      __wbg_Error_8c4e43fe74559d73: function(A, g) {
        return Error(U(A, g));
      },
      __wbg_Number_04624de7d0e8332d: function(A) {
        return Number(A);
      },
      __wbg_String_8f0eb39a4a4c2f66: function(A, g) {
        const I = String(g), C = H(I, i.__wbindgen_malloc, i.__wbindgen_realloc), w = L;
        K().setInt32(A + 4, w, !0), K().setInt32(A + 0, C, !0);
      },
      __wbg___wbindgen_bigint_get_as_i64_8fcf4ce7f1ca72a2: function(A, g) {
        const I = g, C = typeof I == "bigint" ? I : void 0;
        K().setBigInt64(A + 8, h(C) ? BigInt(0) : C, !0), K().setInt32(A + 0, !h(C), !0);
      },
      __wbg___wbindgen_boolean_get_bbbb1c18aa2f5e25: function(A) {
        const g = A, I = typeof g == "boolean" ? g : void 0;
        return h(I) ? 16777215 : I ? 1 : 0;
      },
      __wbg___wbindgen_debug_string_0bc8482c6e3508ae: function(A, g) {
        const I = V(g), C = H(I, i.__wbindgen_malloc, i.__wbindgen_realloc), w = L;
        K().setInt32(A + 4, w, !0), K().setInt32(A + 0, C, !0);
      },
      __wbg___wbindgen_function_table_5ae7216dfcbcc506: function() {
        return i.__wbindgen_export;
      },
      __wbg___wbindgen_in_47fa6863be6f2f25: function(A, g) {
        return A in g;
      },
      __wbg___wbindgen_is_bigint_31b12575b56f32fc: function(A) {
        return typeof A == "bigint";
      },
      __wbg___wbindgen_is_function_0095a73b8b156f76: function(A) {
        return typeof A == "function";
      },
      __wbg___wbindgen_is_object_5ae8e5880f2c1fbd: function(A) {
        const g = A;
        return typeof g == "object" && g !== null;
      },
      __wbg___wbindgen_is_string_cd444516edc5b180: function(A) {
        return typeof A == "string";
      },
      __wbg___wbindgen_is_undefined_9e4d92534c42d778: function(A) {
        return A === void 0;
      },
      __wbg___wbindgen_jsval_eq_11888390b0186270: function(A, g) {
        return A === g;
      },
      __wbg___wbindgen_jsval_loose_eq_9dd77d8cd6671811: function(A, g) {
        return A == g;
      },
      __wbg___wbindgen_lt_bb59cc3d23526e0d: function(A, g) {
        return A < g;
      },
      __wbg___wbindgen_neg_6b4d356dff49dcc6: function(A) {
        return -A;
      },
      __wbg___wbindgen_number_get_8ff4255516ccad3e: function(A, g) {
        const I = g, C = typeof I == "number" ? I : void 0;
        K().setFloat64(A + 8, h(C) ? 0 : C, !0), K().setInt32(A + 0, !h(C), !0);
      },
      __wbg___wbindgen_rethrow_05525c567f154472: function(A) {
        throw A;
      },
      __wbg___wbindgen_shr_ef8e07cce709eb54: function(A, g) {
        return A >> g;
      },
      __wbg___wbindgen_string_get_72fb696202c56729: function(A, g) {
        const I = g, C = typeof I == "string" ? I : void 0;
        var w = h(C) ? 0 : H(C, i.__wbindgen_malloc, i.__wbindgen_realloc), N = L;
        K().setInt32(A + 4, N, !0), K().setInt32(A + 0, w, !0);
      },
      __wbg___wbindgen_throw_be289d5034ed271b: function(A, g) {
        throw new Error(U(A, g));
      },
      __wbg__wbg_cb_unref_d9b87ff7982e3b21: function(A) {
        A._wbg_cb_unref();
      },
      __wbg_addEventListener_3acb0aad4483804c: function() {
        return M(function(A, g, I, C) {
          A.addEventListener(U(g, I), C);
        }, arguments);
      },
      __wbg_apply_2e22c45cb4f12415: function() {
        return M(function(A, g, I) {
          return Reflect.apply(A, g, I);
        }, arguments);
      },
      __wbg_apply_ada2ee1a60ac7b3c: function() {
        return M(function(A, g, I) {
          return A.apply(g, I);
        }, arguments);
      },
      __wbg_arrayBuffer_bb54076166006c39: function() {
        return M(function(A) {
          return A.arrayBuffer();
        }, arguments);
      },
      __wbg_bind_1dc37de2b9939128: function(A, g, I, C) {
        return A.bind(g, I, C);
      },
      __wbg_bind_29ba380591735d8c: function(A, g, I) {
        return A.bind(g, I);
      },
      __wbg_buffer_7b5f53e46557d8f1: function(A) {
        return A.buffer;
      },
      __wbg_byteLength_7b03c17ff1e4037f: function(A) {
        return A.byteLength;
      },
      __wbg_call_389efe28435a9388: function() {
        return M(function(A, g) {
          return A.call(g);
        }, arguments);
      },
      __wbg_call_4708e0c13bdc8e95: function() {
        return M(function(A, g, I) {
          return A.call(g, I);
        }, arguments);
      },
      __wbg_constructor_ad6c0ed428f55d34: function(A) {
        return A.constructor;
      },
      __wbg_crypto_86f2631e91b51511: function(A) {
        return A.crypto;
      },
      __wbg_customSections_193491b069139fb1: function(A, g, I) {
        return WebAssembly.Module.customSections(A, U(g, I));
      },
      __wbg_data_5330da50312d0bc1: function(A) {
        return A.data;
      },
      __wbg_done_57b39ecd9addfe81: function(A) {
        return A.done;
      },
      __wbg_entries_58c7934c745daac7: function(A) {
        return Object.entries(A);
      },
      __wbg_error_7534b8e9a36f1ab4: function(A, g) {
        let I, C;
        try {
          I = A, C = g, console.error(U(A, g));
        } finally {
          i.__wbindgen_free(I, C, 1);
        }
      },
      __wbg_exports_794a42000dacd046: function(A) {
        return WebAssembly.Module.exports(A);
      },
      __wbg_exports_86b4926134c40288: function(A) {
        return A.exports;
      },
      __wbg_fetch_d1488f40cef1e210: function(A, g, I) {
        return A.fetch(U(g, I));
      },
      __wbg_from_bddd64e7d5ff6941: function(A) {
        return Array.from(A);
      },
      __wbg_getPrototypeOf_2653517f1dc884d5: function() {
        return M(function(A) {
          return Reflect.getPrototypeOf(A);
        }, arguments);
      },
      __wbg_getRandomValues_b3f15fcbfabb0f8b: function() {
        return M(function(A, g) {
          A.getRandomValues(g);
        }, arguments);
      },
      __wbg_getTime_1e3cd1391c5c3995: function(A) {
        return A.getTime();
      },
      __wbg_getTimezoneOffset_81776d10a4ec18a8: function(A) {
        return A.getTimezoneOffset();
      },
      __wbg_getUint32_bb6f5a401408e7fa: function(A, g, I) {
        return A.getUint32(g >>> 0, I !== 0);
      },
      __wbg_get_7efbcc3819719b0f: function() {
        return M(function(A, g) {
          return A.get(g >>> 0);
        }, arguments);
      },
      __wbg_get_9b94d73e6221f75c: function(A, g) {
        return A[g >>> 0];
      },
      __wbg_get_b3ed3ad4be2bc8ac: function() {
        return M(function(A, g) {
          return Reflect.get(A, g);
        }, arguments);
      },
      __wbg_get_index_253dd2a9e007656d: function(A, g) {
        return A[g >>> 0];
      },
      __wbg_get_index_9a5bfdd2ca49c65f: function(A, g) {
        return A[g >>> 0];
      },
      __wbg_get_with_ref_key_1dc361bd10053bfe: function(A, g) {
        return A[g];
      },
      __wbg_grow_5d42bf28c2da22cb: function() {
        return M(function(A, g) {
          return A.grow(g >>> 0);
        }, arguments);
      },
      __wbg_grow_d034989fce14cc8e: function() {
        return M(function(A, g) {
          return A.grow(g >>> 0);
        }, arguments);
      },
      __wbg_imports_8333d40ab24779ad: function(A) {
        return WebAssembly.Module.imports(A);
      },
      __wbg_instanceof_ArrayBuffer_c367199e2fa2aa04: function(A) {
        let g;
        try {
          g = A instanceof ArrayBuffer;
        } catch {
          g = !1;
        }
        return g;
      },
      __wbg_instanceof_Error_8573fe0b0b480f46: function(A) {
        let g;
        try {
          g = A instanceof Error;
        } catch {
          g = !1;
        }
        return g;
      },
      __wbg_instanceof_Function_2a29eec978bb3b11: function(A) {
        let g;
        try {
          g = A instanceof Function;
        } catch {
          g = !1;
        }
        return g;
      },
      __wbg_instanceof_Global_2db767b6b2347f01: function(A) {
        let g;
        try {
          g = A instanceof WebAssembly.Global;
        } catch {
          g = !1;
        }
        return g;
      },
      __wbg_instanceof_Map_53af74335dec57f4: function(A) {
        let g;
        try {
          g = A instanceof Map;
        } catch {
          g = !1;
        }
        return g;
      },
      __wbg_instanceof_Memory_dc8c61e3f831ee37: function(A) {
        let g;
        try {
          g = A instanceof WebAssembly.Memory;
        } catch {
          g = !1;
        }
        return g;
      },
      __wbg_instanceof_Object_1c6af87502b733ed: function(A) {
        let g;
        try {
          g = A instanceof Object;
        } catch {
          g = !1;
        }
        return g;
      },
      __wbg_instanceof_RangeError_0b0dd056bc557b89: function(A) {
        let g;
        try {
          g = A instanceof RangeError;
        } catch {
          g = !1;
        }
        return g;
      },
      __wbg_instanceof_Response_ee1d54d79ae41977: function(A) {
        let g;
        try {
          g = A instanceof Response;
        } catch {
          g = !1;
        }
        return g;
      },
      __wbg_instanceof_SharedArrayBuffer_91d8a2fa16a2cc26: function(A) {
        let g;
        try {
          g = A instanceof SharedArrayBuffer;
        } catch {
          g = !1;
        }
        return g;
      },
      __wbg_instanceof_Table_127f216e592f4159: function(A) {
        let g;
        try {
          g = A instanceof WebAssembly.Table;
        } catch {
          g = !1;
        }
        return g;
      },
      __wbg_instanceof_Tag_f1d6b24a98b95210: function(A) {
        let g;
        try {
          g = A instanceof WebAssembly.Tag;
        } catch {
          g = !1;
        }
        return g;
      },
      __wbg_instanceof_Uint8Array_9b9075935c74707c: function(A) {
        let g;
        try {
          g = A instanceof Uint8Array;
        } catch {
          g = !1;
        }
        return g;
      },
      __wbg_isArray_d314bb98fcf08331: function(A) {
        return Array.isArray(A);
      },
      __wbg_isSafeInteger_bfbc7332a9768d2a: function(A) {
        return Number.isSafeInteger(A);
      },
      __wbg_is_f29129f676e5410c: function(A, g) {
        return Object.is(A, g);
      },
      __wbg_iterator_6ff6560ca1568e55: function() {
        return Symbol.iterator;
      },
      __wbg_length_32ed9a279acd054c: function(A) {
        return A.length;
      },
      __wbg_length_35a7bace40f36eac: function(A) {
        return A.length;
      },
      __wbg_length_aeb94ff17a8a8556: function(A) {
        return A.length;
      },
      __wbg_load_eff64ff5e429a422: function() {
        return M(function(A, g) {
          return Atomics.load(A, g >>> 0);
        }, arguments);
      },
      __wbg_message_9ddc4b9a62a7c379: function(A) {
        return A.message;
      },
      __wbg_msCrypto_d562bbe83e0d4b91: function(A) {
        return A.msCrypto;
      },
      __wbg_new_0728bd2d4c5d41dd: function() {
        return M(function(A) {
          return new WebAssembly.Tag(A);
        }, arguments);
      },
      __wbg_new_0_73afc35eb544e539: function() {
        return /* @__PURE__ */ new Date();
      },
      __wbg_new_245cd5c49157e602: function(A) {
        return new Date(A);
      },
      __wbg_new_2ac7fa8be584d280: function(A, g, I) {
        return new DataView(A, g >>> 0, I >>> 0);
      },
      __wbg_new_361308b2356cecd0: function() {
        return new Object();
      },
      __wbg_new_3eb36ae241fe6f44: function() {
        return new Array();
      },
      __wbg_new_4a996a46a82782b6: function() {
        return M(function(A, g) {
          return new WebAssembly.Global(A, g);
        }, arguments);
      },
      __wbg_new_57c27ff3ddf5b62c: function() {
        return M(function(A) {
          return new WebAssembly.Module(A);
        }, arguments);
      },
      __wbg_new_67274f72d5abea37: function() {
        return M(function(A) {
          return new WebAssembly.Table(A);
        }, arguments);
      },
      __wbg_new_8a6f238a6ece86ea: function() {
        return new Error();
      },
      __wbg_new_a4e3cab1cdd635ba: function() {
        return M(function(A, g) {
          return new WebAssembly.Instance(A, g);
        }, arguments);
      },
      __wbg_new_b061c0550d9f3281: function() {
        return M(function(A) {
          return new WebAssembly.Memory(A);
        }, arguments);
      },
      __wbg_new_ca409f861989e0c5: function(A) {
        return new SharedArrayBuffer(A >>> 0);
      },
      __wbg_new_dca287b076112a51: function() {
        return /* @__PURE__ */ new Map();
      },
      __wbg_new_dd2b680c8bf6ae29: function(A) {
        return new Uint8Array(A);
      },
      __wbg_new_from_slice_a3d2629dc1826784: function(A, g) {
        return new Uint8Array(T(A, g));
      },
      __wbg_new_no_args_1c7c842f08d00ebb: function(A, g) {
        return new Function(U(A, g));
      },
      __wbg_new_with_args_7bba34e94b1cfa40: function(A, g, I, C) {
        return new Function(U(A, g), U(I, C));
      },
      __wbg_new_with_byte_offset_9120ba79e057895b: function(A, g) {
        return new Uint8Array(A, g >>> 0);
      },
      __wbg_new_with_byte_offset_and_length_aa261d9c9da49eb1: function(A, g, I) {
        return new Uint8Array(A, g >>> 0, I >>> 0);
      },
      __wbg_new_with_byte_offset_and_length_bc2e7b72cc96d1c1: function(A, g, I) {
        return new Int32Array(A, g >>> 0, I >>> 0);
      },
      __wbg_new_with_length_1763c527b2923202: function(A) {
        return new Array(A >>> 0);
      },
      __wbg_new_with_length_a2c39cbe88fd8ff1: function(A) {
        return new Uint8Array(A >>> 0);
      },
      __wbg_next_3482f54c49e8af19: function() {
        return M(function(A) {
          return A.next();
        }, arguments);
      },
      __wbg_next_418f80d8f5303233: function(A) {
        return A.next;
      },
      __wbg_node_e1f24f89a7336c2e: function(A) {
        return A.node;
      },
      __wbg_notify_78a90977fab74963: function() {
        return M(function(A, g) {
          return Atomics.notify(A, g >>> 0);
        }, arguments);
      },
      __wbg_now_a3af9a2f4bbaa4d1: function() {
        return Date.now();
      },
      __wbg_now_ebffdf7e580f210d: function(A) {
        return A.now();
      },
      __wbg_postMessage_2041f4e90af61318: function() {
        return M(function(A, g) {
          A.postMessage(g);
        }, arguments);
      },
      __wbg_process_3975fd6c72f520aa: function(A) {
        return A.process;
      },
      __wbg_prototypesetcall_bdcdcc5842e4d77d: function(A, g, I) {
        Uint8Array.prototype.set.call(T(A, g), I);
      },
      __wbg_push_8ffdcb2063340ba5: function(A, g) {
        return A.push(g);
      },
      __wbg_queueMicrotask_0aa0a927f78f5d98: function(A) {
        return A.queueMicrotask;
      },
      __wbg_queueMicrotask_5bb536982f78a56f: function(A) {
        queueMicrotask(A);
      },
      __wbg_randomFillSync_f8c153b79f285817: function() {
        return M(function(A, g) {
          A.randomFillSync(g);
        }, arguments);
      },
      __wbg_require_b74f47fc2d022fd6: function() {
        return M(function() {
          return module.require;
        }, arguments);
      },
      __wbg_resolve_002c4b7d9d8f6b64: function(A) {
        return Promise.resolve(A);
      },
      __wbg_setUint32_d168af7751a8557e: function(A, g, I, C) {
        A.setUint32(g >>> 0, I >>> 0, C !== 0);
      },
      __wbg_set_0af2522656c2a71b: function() {
        return M(function(A, g, I) {
          A.set(g >>> 0, I);
        }, arguments);
      },
      __wbg_set_1eb0999cf5d27fc8: function(A, g, I) {
        return A.set(g, I);
      },
      __wbg_set_25cf9deff6bf0ea8: function(A, g, I) {
        A.set(g, I >>> 0);
      },
      __wbg_set_3f1d0b984ed272ed: function(A, g, I) {
        A[g] = I;
      },
      __wbg_set_6cb8631f80447a67: function() {
        return M(function(A, g, I) {
          return Reflect.set(A, g, I);
        }, arguments);
      },
      __wbg_set_cc56eefd2dd91957: function(A, g, I) {
        A.set(T(g, I));
      },
      __wbg_set_f43e577aea94465b: function(A, g, I) {
        A[g >>> 0] = I;
      },
      __wbg_set_index_b3244a6c458021e4: function(A, g, I) {
        A[g >>> 0] = I;
      },
      __wbg_set_index_f259b54e97f7b177: function(A, g, I) {
        A[g >>> 0] = I;
      },
      __wbg_set_onmessage_ea7cc2ba099021cd: function(A, g) {
        A.onmessage = g;
      },
      __wbg_set_value_fc06e541de098215: function(A, g) {
        A.value = g;
      },
      __wbg_slice_8bbd46adb2100583: function(A, g, I) {
        return A.slice(g >>> 0, I >>> 0);
      },
      __wbg_stack_0ed75d68575b0f3c: function(A, g) {
        const I = g.stack, C = H(I, i.__wbindgen_malloc, i.__wbindgen_realloc), w = L;
        K().setInt32(A + 4, w, !0), K().setInt32(A + 0, C, !0);
      },
      __wbg_static_accessor_GLOBAL_12837167ad935116: function() {
        const A = typeof global > "u" ? null : global;
        return h(A) ? 0 : p(A);
      },
      __wbg_static_accessor_GLOBAL_THIS_e628e89ab3b1c95f: function() {
        const A = typeof globalThis > "u" ? null : globalThis;
        return h(A) ? 0 : p(A);
      },
      __wbg_static_accessor_SELF_a621d3dfbb60d0ce: function() {
        const A = typeof self > "u" ? null : self;
        return h(A) ? 0 : p(A);
      },
      __wbg_static_accessor_WINDOW_f8727f0cf888e0bd: function() {
        const A = typeof window > "u" ? null : window;
        return h(A) ? 0 : p(A);
      },
      __wbg_store_d1d951c98d9bed41: function() {
        return M(function(A, g, I) {
          return Atomics.store(A, g >>> 0, I);
        }, arguments);
      },
      __wbg_subarray_a96e1fef17ed23cb: function(A, g, I) {
        return A.subarray(g >>> 0, I >>> 0);
      },
      __wbg_then_0d9fe2c7b1857d32: function(A, g, I) {
        return A.then(g, I);
      },
      __wbg_then_b9e7b3b5f1a9e1b5: function(A, g) {
        return A.then(g);
      },
      __wbg_toString_56d946daff83867b: function(A, g, I) {
        const C = g.toString(I), w = H(C, i.__wbindgen_malloc, i.__wbindgen_realloc), N = L;
        K().setInt32(A + 4, N, !0), K().setInt32(A + 0, w, !0);
      },
      __wbg_toString_964ff7fe6eca8362: function(A) {
        return A.toString();
      },
      __wbg_trap_new: function(A) {
        return x.__wrap(A);
      },
      __wbg_validate_71c2d02a71bda62f: function() {
        return M(function(A) {
          return WebAssembly.validate(A);
        }, arguments);
      },
      __wbg_value_0546255b415e96c1: function(A) {
        return A.value;
      },
      __wbg_value_ce37a60e576310ff: function(A) {
        return A.value;
      },
      __wbg_versions_4e31226f5e8dc909: function(A) {
        return A.versions;
      },
      __wbg_wait_be5dae1e53f590f1: function() {
        return M(function(A, g, I) {
          return Atomics.wait(A, g >>> 0, I);
        }, arguments);
      },
      __wbg_warn_81ab00e6e16e886d: function(A, g, I) {
        console.warn(A, g, I);
      },
      __wbindgen_cast_0000000000000001: function(A, g) {
        return q(A, g, i.wasm_bindgen__closure__destroy__he9935bf5b8e5eaac, YA);
      },
      __wbindgen_cast_0000000000000002: function(A, g) {
        return RA(A, g, i.wasm_bindgen__closure__destroy__he9935bf5b8e5eaac, KA);
      },
      __wbindgen_cast_0000000000000003: function(A, g) {
        return q(A, g, i.wasm_bindgen__closure__destroy__h0f566116ea738929, e);
      },
      __wbindgen_cast_0000000000000004: function(A, g) {
        return q(A, g, i.wasm_bindgen__closure__destroy__h0f566116ea738929, e);
      },
      __wbindgen_cast_0000000000000005: function(A, g) {
        return q(A, g, i.wasm_bindgen__closure__destroy__h0f566116ea738929, JA);
      },
      __wbindgen_cast_0000000000000006: function(A, g) {
        return q(A, g, i.wasm_bindgen__closure__destroy__he1c6a9cce84bafe4, yA);
      },
      __wbindgen_cast_0000000000000007: function(A) {
        return A;
      },
      __wbindgen_cast_0000000000000008: function(A) {
        return A;
      },
      __wbindgen_cast_0000000000000009: function(A, g) {
        return T(A, g);
      },
      __wbindgen_cast_000000000000000a: function(A, g) {
        return U(A, g);
      },
      __wbindgen_cast_000000000000000b: function(A, g) {
        return BigInt.asUintN(64, A) | BigInt.asUintN(64, g) << BigInt(64);
      },
      __wbindgen_cast_000000000000000c: function(A) {
        return BigInt.asUintN(64, A);
      },
      __wbindgen_cast_000000000000000d: function(A, g) {
        var I = IA(A, g).slice();
        return i.__wbindgen_free(A, g * 4, 4), I;
      },
      __wbindgen_init_externref_table: function() {
        const A = i.__wbindgen_externrefs, g = A.grow(4);
        A.set(0, void 0), A.set(g + 0, void 0), A.set(g + 1, null), A.set(g + 2, !0), A.set(g + 3, !1);
      }
    }
  };
}
function YA(Q, A, g) {
  i.wasm_bindgen__convert__closures_____invoke__h8181430204266fe8(Q, A, g);
}
function KA(Q, A, g) {
  i.wasm_bindgen__convert__closures_____invoke__h3539d83fc0ea60a4(Q, A, g);
}
function yA(Q, A, g) {
  i.wasm_bindgen__convert__closures_____invoke__h36ee117695786273(Q, A, g);
}
function JA(Q, A, g) {
  const I = i.wasm_bindgen__convert__closures________invoke__he5adf6138eb6d6d2(Q, A, g);
  if (I[1])
    throw z(I[0]);
}
function e(Q, A, g) {
  const I = i.wasm_bindgen__convert__closures________invoke__h4adfd56a9cbd4460(Q, A, g);
  if (I[2])
    throw z(I[1]);
  return z(I[0]);
}
const u = typeof FinalizationRegistry > "u" ? { register: () => {
}, unregister: () => {
} } : new FinalizationRegistry((Q) => i.__wbg_dapadapter_free(Q >>> 0, 1)), _ = typeof FinalizationRegistry > "u" ? { register: () => {
}, unregister: () => {
} } : new FinalizationRegistry((Q) => i.__wbg_trap_free(Q >>> 0, 1));
function p(Q) {
  const A = i.__externref_table_alloc();
  return i.__wbindgen_externrefs.set(A, Q), A;
}
const l = typeof FinalizationRegistry > "u" ? { register: () => {
}, unregister: () => {
} } : new FinalizationRegistry((Q) => Q.dtor(Q.a, Q.b));
function V(Q) {
  const A = typeof Q;
  if (A == "number" || A == "boolean" || Q == null)
    return `${Q}`;
  if (A == "string")
    return `"${Q}"`;
  if (A == "symbol") {
    const C = Q.description;
    return C == null ? "Symbol" : `Symbol(${C})`;
  }
  if (A == "function") {
    const C = Q.name;
    return typeof C == "string" && C.length > 0 ? `Function(${C})` : "Function";
  }
  if (Array.isArray(Q)) {
    const C = Q.length;
    let w = "[";
    C > 0 && (w += V(Q[0]));
    for (let N = 1; N < C; N++)
      w += ", " + V(Q[N]);
    return w += "]", w;
  }
  const g = /\[object ([^\]]+)\]/.exec(toString.call(Q));
  let I;
  if (g && g.length > 1)
    I = g[1];
  else
    return toString.call(Q);
  if (I == "Object")
    try {
      return "Object(" + JSON.stringify(Q) + ")";
    } catch {
      return "Object";
    }
  return Q instanceof Error ? `${Q.name}: ${Q.message}
${Q.stack}` : I;
}
function IA(Q, A) {
  Q = Q >>> 0;
  const g = K(), I = [];
  for (let C = Q; C < Q + 4 * A; C += 4)
    I.push(i.__wbindgen_externrefs.get(g.getUint32(C, !0)));
  return i.__externref_drop_slice(Q, A), I;
}
function T(Q, A) {
  return Q = Q >>> 0, W().subarray(Q / 1, Q / 1 + A);
}
let c = null;
function K() {
  return (c === null || c.buffer.detached === !0 || c.buffer.detached === void 0 && c.buffer !== i.memory.buffer) && (c = new DataView(i.memory.buffer)), c;
}
function U(Q, A) {
  return Q = Q >>> 0, hA(Q, A);
}
let Z = null;
function W() {
  return (Z === null || Z.byteLength === 0) && (Z = new Uint8Array(i.memory.buffer)), Z;
}
function M(Q, A) {
  try {
    return Q.apply(this, A);
  } catch (g) {
    const I = p(g);
    i.__wbindgen_exn_store(I);
  }
}
function h(Q) {
  return Q == null;
}
function RA(Q, A, g, I) {
  const C = { a: Q, b: A, cnt: 1, dtor: g }, w = (...N) => {
    C.cnt++;
    try {
      return I(C.a, C.b, ...N);
    } finally {
      w._wbg_cb_unref();
    }
  };
  return w._wbg_cb_unref = () => {
    --C.cnt === 0 && (C.dtor(C.a, C.b), C.a = 0, l.unregister(C));
  }, l.register(w, C, C), w;
}
function q(Q, A, g, I) {
  const C = { a: Q, b: A, cnt: 1, dtor: g }, w = (...N) => {
    C.cnt++;
    const F = C.a;
    C.a = 0;
    try {
      return I(F, C.b, ...N);
    } finally {
      C.a = F, w._wbg_cb_unref();
    }
  };
  return w._wbg_cb_unref = () => {
    --C.cnt === 0 && (C.dtor(C.a, C.b), C.a = 0, l.unregister(C));
  }, l.register(w, C, C), w;
}
function H(Q, A, g) {
  if (g === void 0) {
    const F = O.encode(Q), y = A(F.length, 1) >>> 0;
    return W().subarray(y, y + F.length).set(F), L = F.length, y;
  }
  let I = Q.length, C = A(I, 1) >>> 0;
  const w = W();
  let N = 0;
  for (; N < I; N++) {
    const F = Q.charCodeAt(N);
    if (F > 127) break;
    w[C + N] = F;
  }
  if (N !== I) {
    N !== 0 && (Q = Q.slice(N)), C = g(C, I, I = N + Q.length * 3, 1) >>> 0;
    const F = W().subarray(C + N, C + I), y = O.encodeInto(Q, F);
    N += y.written, C = g(C, I, N, 1) >>> 0;
  }
  return L = N, C;
}
function z(Q) {
  const A = i.__wbindgen_externrefs.get(Q);
  return i.__externref_table_dealloc(Q), A;
}
let j = new TextDecoder("utf-8", { ignoreBOM: !0, fatal: !0 });
j.decode();
const UA = 2146435072;
let t = 0;
function hA(Q, A) {
  return t += A, t >= UA && (j = new TextDecoder("utf-8", { ignoreBOM: !0, fatal: !0 }), j.decode(), t = A), j.decode(W().subarray(Q, Q + A));
}
const O = new TextEncoder();
"encodeInto" in O || (O.encodeInto = function(Q, A) {
  const g = O.encode(Q);
  return A.set(g), {
    read: Q.length,
    written: g.length
  };
});
let L = 0, i;
function SA(Q, A) {
  return i = Q.exports, c = null, Z = null, i.__wbindgen_start(), i;
}
async function LA(Q, A) {
  if (typeof Response == "function" && Q instanceof Response) {
    if (typeof WebAssembly.instantiateStreaming == "function")
      try {
        return await WebAssembly.instantiateStreaming(Q, A);
      } catch (C) {
        if (Q.ok && g(Q.type) && Q.headers.get("Content-Type") !== "application/wasm")
          console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve Wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n", C);
        else
          throw C;
      }
    const I = await Q.arrayBuffer();
    return await WebAssembly.instantiate(I, A);
  } else {
    const I = await WebAssembly.instantiate(Q, A);
    return I instanceof WebAssembly.Instance ? { instance: I, module: Q } : I;
  }
  function g(I) {
    switch (I) {
      case "basic":
      case "cors":
      case "default":
        return !0;
    }
    return !1;
  }
}
async function cA(Q) {
  if (i !== void 0) return i;
  Q !== void 0 && (Object.getPrototypeOf(Q) === Object.prototype ? { module_or_path: Q } = Q : console.warn("using deprecated parameters for the initialization function; pass a single object instead")), Q === void 0 && (Q = new URL("", import.meta.url));
  const A = FA();
  (typeof Q == "string" || typeof Request == "function" && Q instanceof Request || typeof URL == "function" && Q instanceof URL) && (Q = fetch(Q));
  const { instance: g, module: I } = await LA(await Q, A);
  return SA(g);
}
const sA = new URL("http://localhost:20233/debugger/engine_bg.wasm"), J = /* @__PURE__ */ Symbol();
function HA(Q) {
  return Q instanceof Error ? {
    type: "error",
    error: { type: Q.constructor.name, message: Q.message }
  } : {
    type: "error",
    error: { type: typeof Q, message: String(Q) }
  };
}
class aA {
  name;
  data;
  constructor(A, g) {
    this.name = A, this.data = g;
  }
  download() {
    const A = new Uint8Array(this.data), g = new Blob([A]), I = URL.createObjectURL(g), C = document.createElement("a");
    C.href = I, C.download = this.name, document.body.appendChild(C), C.click(), document.body.removeChild(C), URL.revokeObjectURL(I);
  }
}
class qA extends gA {
  /**
   * Access to internal properties of the debugger.
   * These are put under a special symbol so that they cannot be accessed by
   * clients of the library.
   */
  [J];
  dap;
  /**
   * Whether or not debugging is enabled.
   * Changes will takes effect during the next call to {@link Engine.run}.
   */
  enabled = !0;
  /**
   * When true, internal frames (bdb, bridge) are omitted from DAP `stackTrace`
   * responses. Internal frames are always tagged with `presentationHint: "subtle"`
   * regardless, so raw clients can filter themselves.
   * Must be set before calling {@link Engine.run}.
   */
  set filterInternals(A) {
    this.dap.setFilterInternals(A);
  }
  constructor() {
    super(), this[J] = {
      attach: this.attach.bind(this)
    }, this.onMessage = this.onMessage.bind(this), this.dap = new P(), this.dap.on(this.onMessage);
  }
  send(A) {
    return this.dap.sendMessage(A);
  }
  attach(A) {
    A.addEventListener("message", (g) => {
      if (g.data.type !== "artifact") return;
      const I = new aA(g.data.name, new Uint8Array(g.data.data));
      this.emit("artifact", I);
    }), this.dap.attach(A);
  }
  onMessage(A) {
    this.emit("event", A);
  }
}
const CA = `class h {
  static __wrap(A) {
    A = A >>> 0;
    const g = Object.create(h.prototype);
    return g.__wbg_ptr = A, p.register(g, g.__wbg_ptr, g), g;
  }
  __destroy_into_raw() {
    const A = this.__wbg_ptr;
    return this.__wbg_ptr = 0, p.unregister(this), A;
  }
  free() {
    const A = this.__destroy_into_raw();
    B.__wbg_trap_free(A, 0);
  }
  /**
   * A marker method to indicate that an object is an instance of the \`Trap\`
   * class.
   */
  static __wbg_wasmer_trap() {
    B.trap___wbg_wasmer_trap();
  }
}
Symbol.dispose && (h.prototype[Symbol.dispose] = h.prototype.free);
function Z() {
  B.main();
}
function W() {
  return {
    __proto__: null,
    "./engine_bg.js": {
      __proto__: null,
      __wbg_BigInt_b7bbccdff258c9f2: function(A) {
        return BigInt(A);
      },
      __wbg_Error_8c4e43fe74559d73: function(A, g) {
        return Error(N(A, g));
      },
      __wbg_Number_04624de7d0e8332d: function(A) {
        return Number(A);
      },
      __wbg_String_8f0eb39a4a4c2f66: function(A, g) {
        const I = String(g), C = K(I, B.__wbindgen_malloc, B.__wbindgen_realloc), E = M;
        i().setInt32(A + 4, E, !0), i().setInt32(A + 0, C, !0);
      },
      __wbg___wbindgen_bigint_get_as_i64_8fcf4ce7f1ca72a2: function(A, g) {
        const I = g, C = typeof I == "bigint" ? I : void 0;
        i().setBigInt64(A + 8, G(C) ? BigInt(0) : C, !0), i().setInt32(A + 0, !G(C), !0);
      },
      __wbg___wbindgen_boolean_get_bbbb1c18aa2f5e25: function(A) {
        const g = A, I = typeof g == "boolean" ? g : void 0;
        return G(I) ? 16777215 : I ? 1 : 0;
      },
      __wbg___wbindgen_debug_string_0bc8482c6e3508ae: function(A, g) {
        const I = H(g), C = K(I, B.__wbindgen_malloc, B.__wbindgen_realloc), E = M;
        i().setInt32(A + 4, E, !0), i().setInt32(A + 0, C, !0);
      },
      __wbg___wbindgen_function_table_5ae7216dfcbcc506: function() {
        return B.__wbindgen_export;
      },
      __wbg___wbindgen_in_47fa6863be6f2f25: function(A, g) {
        return A in g;
      },
      __wbg___wbindgen_is_bigint_31b12575b56f32fc: function(A) {
        return typeof A == "bigint";
      },
      __wbg___wbindgen_is_function_0095a73b8b156f76: function(A) {
        return typeof A == "function";
      },
      __wbg___wbindgen_is_object_5ae8e5880f2c1fbd: function(A) {
        const g = A;
        return typeof g == "object" && g !== null;
      },
      __wbg___wbindgen_is_string_cd444516edc5b180: function(A) {
        return typeof A == "string";
      },
      __wbg___wbindgen_is_undefined_9e4d92534c42d778: function(A) {
        return A === void 0;
      },
      __wbg___wbindgen_jsval_eq_11888390b0186270: function(A, g) {
        return A === g;
      },
      __wbg___wbindgen_jsval_loose_eq_9dd77d8cd6671811: function(A, g) {
        return A == g;
      },
      __wbg___wbindgen_lt_bb59cc3d23526e0d: function(A, g) {
        return A < g;
      },
      __wbg___wbindgen_neg_6b4d356dff49dcc6: function(A) {
        return -A;
      },
      __wbg___wbindgen_number_get_8ff4255516ccad3e: function(A, g) {
        const I = g, C = typeof I == "number" ? I : void 0;
        i().setFloat64(A + 8, G(C) ? 0 : C, !0), i().setInt32(A + 0, !G(C), !0);
      },
      __wbg___wbindgen_rethrow_05525c567f154472: function(A) {
        throw A;
      },
      __wbg___wbindgen_shr_ef8e07cce709eb54: function(A, g) {
        return A >> g;
      },
      __wbg___wbindgen_string_get_72fb696202c56729: function(A, g) {
        const I = g, C = typeof I == "string" ? I : void 0;
        var E = G(C) ? 0 : K(C, B.__wbindgen_malloc, B.__wbindgen_realloc), w = M;
        i().setInt32(A + 4, w, !0), i().setInt32(A + 0, E, !0);
      },
      __wbg___wbindgen_throw_be289d5034ed271b: function(A, g) {
        throw new Error(N(A, g));
      },
      __wbg__wbg_cb_unref_d9b87ff7982e3b21: function(A) {
        A._wbg_cb_unref();
      },
      __wbg_addEventListener_3acb0aad4483804c: function() {
        return D(function(A, g, I, C) {
          A.addEventListener(N(g, I), C);
        }, arguments);
      },
      __wbg_apply_2e22c45cb4f12415: function() {
        return D(function(A, g, I) {
          return Reflect.apply(A, g, I);
        }, arguments);
      },
      __wbg_apply_ada2ee1a60ac7b3c: function() {
        return D(function(A, g, I) {
          return A.apply(g, I);
        }, arguments);
      },
      __wbg_arrayBuffer_bb54076166006c39: function() {
        return D(function(A) {
          return A.arrayBuffer();
        }, arguments);
      },
      __wbg_bind_1dc37de2b9939128: function(A, g, I, C) {
        return A.bind(g, I, C);
      },
      __wbg_bind_29ba380591735d8c: function(A, g, I) {
        return A.bind(g, I);
      },
      __wbg_buffer_7b5f53e46557d8f1: function(A) {
        return A.buffer;
      },
      __wbg_byteLength_7b03c17ff1e4037f: function(A) {
        return A.byteLength;
      },
      __wbg_call_389efe28435a9388: function() {
        return D(function(A, g) {
          return A.call(g);
        }, arguments);
      },
      __wbg_call_4708e0c13bdc8e95: function() {
        return D(function(A, g, I) {
          return A.call(g, I);
        }, arguments);
      },
      __wbg_constructor_ad6c0ed428f55d34: function(A) {
        return A.constructor;
      },
      __wbg_crypto_86f2631e91b51511: function(A) {
        return A.crypto;
      },
      __wbg_customSections_193491b069139fb1: function(A, g, I) {
        return WebAssembly.Module.customSections(A, N(g, I));
      },
      __wbg_data_5330da50312d0bc1: function(A) {
        return A.data;
      },
      __wbg_done_57b39ecd9addfe81: function(A) {
        return A.done;
      },
      __wbg_entries_58c7934c745daac7: function(A) {
        return Object.entries(A);
      },
      __wbg_error_7534b8e9a36f1ab4: function(A, g) {
        let I, C;
        try {
          I = A, C = g, console.error(N(A, g));
        } finally {
          B.__wbindgen_free(I, C, 1);
        }
      },
      __wbg_exports_794a42000dacd046: function(A) {
        return WebAssembly.Module.exports(A);
      },
      __wbg_exports_86b4926134c40288: function(A) {
        return A.exports;
      },
      __wbg_fetch_d1488f40cef1e210: function(A, g, I) {
        return A.fetch(N(g, I));
      },
      __wbg_from_bddd64e7d5ff6941: function(A) {
        return Array.from(A);
      },
      __wbg_getPrototypeOf_2653517f1dc884d5: function() {
        return D(function(A) {
          return Reflect.getPrototypeOf(A);
        }, arguments);
      },
      __wbg_getRandomValues_b3f15fcbfabb0f8b: function() {
        return D(function(A, g) {
          A.getRandomValues(g);
        }, arguments);
      },
      __wbg_getTime_1e3cd1391c5c3995: function(A) {
        return A.getTime();
      },
      __wbg_getTimezoneOffset_81776d10a4ec18a8: function(A) {
        return A.getTimezoneOffset();
      },
      __wbg_getUint32_bb6f5a401408e7fa: function(A, g, I) {
        return A.getUint32(g >>> 0, I !== 0);
      },
      __wbg_get_7efbcc3819719b0f: function() {
        return D(function(A, g) {
          return A.get(g >>> 0);
        }, arguments);
      },
      __wbg_get_9b94d73e6221f75c: function(A, g) {
        return A[g >>> 0];
      },
      __wbg_get_b3ed3ad4be2bc8ac: function() {
        return D(function(A, g) {
          return Reflect.get(A, g);
        }, arguments);
      },
      __wbg_get_index_253dd2a9e007656d: function(A, g) {
        return A[g >>> 0];
      },
      __wbg_get_index_9a5bfdd2ca49c65f: function(A, g) {
        return A[g >>> 0];
      },
      __wbg_get_with_ref_key_1dc361bd10053bfe: function(A, g) {
        return A[g];
      },
      __wbg_grow_5d42bf28c2da22cb: function() {
        return D(function(A, g) {
          return A.grow(g >>> 0);
        }, arguments);
      },
      __wbg_grow_d034989fce14cc8e: function() {
        return D(function(A, g) {
          return A.grow(g >>> 0);
        }, arguments);
      },
      __wbg_imports_8333d40ab24779ad: function(A) {
        return WebAssembly.Module.imports(A);
      },
      __wbg_instanceof_ArrayBuffer_c367199e2fa2aa04: function(A) {
        let g;
        try {
          g = A instanceof ArrayBuffer;
        } catch {
          g = !1;
        }
        return g;
      },
      __wbg_instanceof_Error_8573fe0b0b480f46: function(A) {
        let g;
        try {
          g = A instanceof Error;
        } catch {
          g = !1;
        }
        return g;
      },
      __wbg_instanceof_Function_2a29eec978bb3b11: function(A) {
        let g;
        try {
          g = A instanceof Function;
        } catch {
          g = !1;
        }
        return g;
      },
      __wbg_instanceof_Global_2db767b6b2347f01: function(A) {
        let g;
        try {
          g = A instanceof WebAssembly.Global;
        } catch {
          g = !1;
        }
        return g;
      },
      __wbg_instanceof_Map_53af74335dec57f4: function(A) {
        let g;
        try {
          g = A instanceof Map;
        } catch {
          g = !1;
        }
        return g;
      },
      __wbg_instanceof_Memory_dc8c61e3f831ee37: function(A) {
        let g;
        try {
          g = A instanceof WebAssembly.Memory;
        } catch {
          g = !1;
        }
        return g;
      },
      __wbg_instanceof_Object_1c6af87502b733ed: function(A) {
        let g;
        try {
          g = A instanceof Object;
        } catch {
          g = !1;
        }
        return g;
      },
      __wbg_instanceof_RangeError_0b0dd056bc557b89: function(A) {
        let g;
        try {
          g = A instanceof RangeError;
        } catch {
          g = !1;
        }
        return g;
      },
      __wbg_instanceof_Response_ee1d54d79ae41977: function(A) {
        let g;
        try {
          g = A instanceof Response;
        } catch {
          g = !1;
        }
        return g;
      },
      __wbg_instanceof_SharedArrayBuffer_91d8a2fa16a2cc26: function(A) {
        let g;
        try {
          g = A instanceof SharedArrayBuffer;
        } catch {
          g = !1;
        }
        return g;
      },
      __wbg_instanceof_Table_127f216e592f4159: function(A) {
        let g;
        try {
          g = A instanceof WebAssembly.Table;
        } catch {
          g = !1;
        }
        return g;
      },
      __wbg_instanceof_Tag_f1d6b24a98b95210: function(A) {
        let g;
        try {
          g = A instanceof WebAssembly.Tag;
        } catch {
          g = !1;
        }
        return g;
      },
      __wbg_instanceof_Uint8Array_9b9075935c74707c: function(A) {
        let g;
        try {
          g = A instanceof Uint8Array;
        } catch {
          g = !1;
        }
        return g;
      },
      __wbg_isArray_d314bb98fcf08331: function(A) {
        return Array.isArray(A);
      },
      __wbg_isSafeInteger_bfbc7332a9768d2a: function(A) {
        return Number.isSafeInteger(A);
      },
      __wbg_is_f29129f676e5410c: function(A, g) {
        return Object.is(A, g);
      },
      __wbg_iterator_6ff6560ca1568e55: function() {
        return Symbol.iterator;
      },
      __wbg_length_32ed9a279acd054c: function(A) {
        return A.length;
      },
      __wbg_length_35a7bace40f36eac: function(A) {
        return A.length;
      },
      __wbg_length_aeb94ff17a8a8556: function(A) {
        return A.length;
      },
      __wbg_load_eff64ff5e429a422: function() {
        return D(function(A, g) {
          return Atomics.load(A, g >>> 0);
        }, arguments);
      },
      __wbg_message_9ddc4b9a62a7c379: function(A) {
        return A.message;
      },
      __wbg_msCrypto_d562bbe83e0d4b91: function(A) {
        return A.msCrypto;
      },
      __wbg_new_0728bd2d4c5d41dd: function() {
        return D(function(A) {
          return new WebAssembly.Tag(A);
        }, arguments);
      },
      __wbg_new_0_73afc35eb544e539: function() {
        return /* @__PURE__ */ new Date();
      },
      __wbg_new_245cd5c49157e602: function(A) {
        return new Date(A);
      },
      __wbg_new_2ac7fa8be584d280: function(A, g, I) {
        return new DataView(A, g >>> 0, I >>> 0);
      },
      __wbg_new_361308b2356cecd0: function() {
        return new Object();
      },
      __wbg_new_3eb36ae241fe6f44: function() {
        return new Array();
      },
      __wbg_new_4a996a46a82782b6: function() {
        return D(function(A, g) {
          return new WebAssembly.Global(A, g);
        }, arguments);
      },
      __wbg_new_57c27ff3ddf5b62c: function() {
        return D(function(A) {
          return new WebAssembly.Module(A);
        }, arguments);
      },
      __wbg_new_67274f72d5abea37: function() {
        return D(function(A) {
          return new WebAssembly.Table(A);
        }, arguments);
      },
      __wbg_new_8a6f238a6ece86ea: function() {
        return new Error();
      },
      __wbg_new_a4e3cab1cdd635ba: function() {
        return D(function(A, g) {
          return new WebAssembly.Instance(A, g);
        }, arguments);
      },
      __wbg_new_b061c0550d9f3281: function() {
        return D(function(A) {
          return new WebAssembly.Memory(A);
        }, arguments);
      },
      __wbg_new_ca409f861989e0c5: function(A) {
        return new SharedArrayBuffer(A >>> 0);
      },
      __wbg_new_dca287b076112a51: function() {
        return /* @__PURE__ */ new Map();
      },
      __wbg_new_dd2b680c8bf6ae29: function(A) {
        return new Uint8Array(A);
      },
      __wbg_new_from_slice_a3d2629dc1826784: function(A, g) {
        return new Uint8Array(S(A, g));
      },
      __wbg_new_no_args_1c7c842f08d00ebb: function(A, g) {
        return new Function(N(A, g));
      },
      __wbg_new_with_args_7bba34e94b1cfa40: function(A, g, I, C) {
        return new Function(N(A, g), N(I, C));
      },
      __wbg_new_with_byte_offset_9120ba79e057895b: function(A, g) {
        return new Uint8Array(A, g >>> 0);
      },
      __wbg_new_with_byte_offset_and_length_aa261d9c9da49eb1: function(A, g, I) {
        return new Uint8Array(A, g >>> 0, I >>> 0);
      },
      __wbg_new_with_byte_offset_and_length_bc2e7b72cc96d1c1: function(A, g, I) {
        return new Int32Array(A, g >>> 0, I >>> 0);
      },
      __wbg_new_with_length_1763c527b2923202: function(A) {
        return new Array(A >>> 0);
      },
      __wbg_new_with_length_a2c39cbe88fd8ff1: function(A) {
        return new Uint8Array(A >>> 0);
      },
      __wbg_next_3482f54c49e8af19: function() {
        return D(function(A) {
          return A.next();
        }, arguments);
      },
      __wbg_next_418f80d8f5303233: function(A) {
        return A.next;
      },
      __wbg_node_e1f24f89a7336c2e: function(A) {
        return A.node;
      },
      __wbg_notify_78a90977fab74963: function() {
        return D(function(A, g) {
          return Atomics.notify(A, g >>> 0);
        }, arguments);
      },
      __wbg_now_a3af9a2f4bbaa4d1: function() {
        return Date.now();
      },
      __wbg_now_ebffdf7e580f210d: function(A) {
        return A.now();
      },
      __wbg_postMessage_2041f4e90af61318: function() {
        return D(function(A, g) {
          A.postMessage(g);
        }, arguments);
      },
      __wbg_process_3975fd6c72f520aa: function(A) {
        return A.process;
      },
      __wbg_prototypesetcall_bdcdcc5842e4d77d: function(A, g, I) {
        Uint8Array.prototype.set.call(S(A, g), I);
      },
      __wbg_push_8ffdcb2063340ba5: function(A, g) {
        return A.push(g);
      },
      __wbg_queueMicrotask_0aa0a927f78f5d98: function(A) {
        return A.queueMicrotask;
      },
      __wbg_queueMicrotask_5bb536982f78a56f: function(A) {
        queueMicrotask(A);
      },
      __wbg_randomFillSync_f8c153b79f285817: function() {
        return D(function(A, g) {
          A.randomFillSync(g);
        }, arguments);
      },
      __wbg_require_b74f47fc2d022fd6: function() {
        return D(function() {
          return module.require;
        }, arguments);
      },
      __wbg_resolve_002c4b7d9d8f6b64: function(A) {
        return Promise.resolve(A);
      },
      __wbg_setUint32_d168af7751a8557e: function(A, g, I, C) {
        A.setUint32(g >>> 0, I >>> 0, C !== 0);
      },
      __wbg_set_0af2522656c2a71b: function() {
        return D(function(A, g, I) {
          A.set(g >>> 0, I);
        }, arguments);
      },
      __wbg_set_1eb0999cf5d27fc8: function(A, g, I) {
        return A.set(g, I);
      },
      __wbg_set_25cf9deff6bf0ea8: function(A, g, I) {
        A.set(g, I >>> 0);
      },
      __wbg_set_3f1d0b984ed272ed: function(A, g, I) {
        A[g] = I;
      },
      __wbg_set_6cb8631f80447a67: function() {
        return D(function(A, g, I) {
          return Reflect.set(A, g, I);
        }, arguments);
      },
      __wbg_set_cc56eefd2dd91957: function(A, g, I) {
        A.set(S(g, I));
      },
      __wbg_set_f43e577aea94465b: function(A, g, I) {
        A[g >>> 0] = I;
      },
      __wbg_set_index_b3244a6c458021e4: function(A, g, I) {
        A[g >>> 0] = I;
      },
      __wbg_set_index_f259b54e97f7b177: function(A, g, I) {
        A[g >>> 0] = I;
      },
      __wbg_set_onmessage_ea7cc2ba099021cd: function(A, g) {
        A.onmessage = g;
      },
      __wbg_set_value_fc06e541de098215: function(A, g) {
        A.value = g;
      },
      __wbg_slice_8bbd46adb2100583: function(A, g, I) {
        return A.slice(g >>> 0, I >>> 0);
      },
      __wbg_stack_0ed75d68575b0f3c: function(A, g) {
        const I = g.stack, C = K(I, B.__wbindgen_malloc, B.__wbindgen_realloc), E = M;
        i().setInt32(A + 4, E, !0), i().setInt32(A + 0, C, !0);
      },
      __wbg_static_accessor_GLOBAL_12837167ad935116: function() {
        const A = typeof global > "u" ? null : global;
        return G(A) ? 0 : y(A);
      },
      __wbg_static_accessor_GLOBAL_THIS_e628e89ab3b1c95f: function() {
        const A = typeof globalThis > "u" ? null : globalThis;
        return G(A) ? 0 : y(A);
      },
      __wbg_static_accessor_SELF_a621d3dfbb60d0ce: function() {
        const A = typeof self > "u" ? null : self;
        return G(A) ? 0 : y(A);
      },
      __wbg_static_accessor_WINDOW_f8727f0cf888e0bd: function() {
        const A = typeof window > "u" ? null : window;
        return G(A) ? 0 : y(A);
      },
      __wbg_store_d1d951c98d9bed41: function() {
        return D(function(A, g, I) {
          return Atomics.store(A, g >>> 0, I);
        }, arguments);
      },
      __wbg_subarray_a96e1fef17ed23cb: function(A, g, I) {
        return A.subarray(g >>> 0, I >>> 0);
      },
      __wbg_then_0d9fe2c7b1857d32: function(A, g, I) {
        return A.then(g, I);
      },
      __wbg_then_b9e7b3b5f1a9e1b5: function(A, g) {
        return A.then(g);
      },
      __wbg_toString_56d946daff83867b: function(A, g, I) {
        const C = g.toString(I), E = K(C, B.__wbindgen_malloc, B.__wbindgen_realloc), w = M;
        i().setInt32(A + 4, w, !0), i().setInt32(A + 0, E, !0);
      },
      __wbg_toString_964ff7fe6eca8362: function(A) {
        return A.toString();
      },
      __wbg_trap_new: function(A) {
        return h.__wrap(A);
      },
      __wbg_validate_71c2d02a71bda62f: function() {
        return D(function(A) {
          return WebAssembly.validate(A);
        }, arguments);
      },
      __wbg_value_0546255b415e96c1: function(A) {
        return A.value;
      },
      __wbg_value_ce37a60e576310ff: function(A) {
        return A.value;
      },
      __wbg_versions_4e31226f5e8dc909: function(A) {
        return A.versions;
      },
      __wbg_wait_be5dae1e53f590f1: function() {
        return D(function(A, g, I) {
          return Atomics.wait(A, g >>> 0, I);
        }, arguments);
      },
      __wbg_warn_81ab00e6e16e886d: function(A, g, I) {
        console.warn(A, g, I);
      },
      __wbindgen_cast_0000000000000001: function(A, g) {
        return Y(A, g, B.wasm_bindgen__closure__destroy__he9935bf5b8e5eaac, O);
      },
      __wbindgen_cast_0000000000000002: function(A, g) {
        return l(A, g, B.wasm_bindgen__closure__destroy__he9935bf5b8e5eaac, x);
      },
      __wbindgen_cast_0000000000000003: function(A, g) {
        return Y(A, g, B.wasm_bindgen__closure__destroy__h0f566116ea738929, q);
      },
      __wbindgen_cast_0000000000000004: function(A, g) {
        return Y(A, g, B.wasm_bindgen__closure__destroy__h0f566116ea738929, q);
      },
      __wbindgen_cast_0000000000000005: function(A, g) {
        return Y(A, g, B.wasm_bindgen__closure__destroy__h0f566116ea738929, T);
      },
      __wbindgen_cast_0000000000000006: function(A, g) {
        return Y(A, g, B.wasm_bindgen__closure__destroy__he1c6a9cce84bafe4, d);
      },
      __wbindgen_cast_0000000000000007: function(A) {
        return A;
      },
      __wbindgen_cast_0000000000000008: function(A) {
        return A;
      },
      __wbindgen_cast_0000000000000009: function(A, g) {
        return S(A, g);
      },
      __wbindgen_cast_000000000000000a: function(A, g) {
        return N(A, g);
      },
      __wbindgen_cast_000000000000000b: function(A, g) {
        return BigInt.asUintN(64, A) | BigInt.asUintN(64, g) << BigInt(64);
      },
      __wbindgen_cast_000000000000000c: function(A) {
        return BigInt.asUintN(64, A);
      },
      __wbindgen_cast_000000000000000d: function(A, g) {
        var I = j(A, g).slice();
        return B.__wbindgen_free(A, g * 4, 4), I;
      },
      __wbindgen_init_externref_table: function() {
        const A = B.__wbindgen_externrefs, g = A.grow(4);
        A.set(0, void 0), A.set(g + 0, void 0), A.set(g + 1, null), A.set(g + 2, !0), A.set(g + 3, !1);
      }
    }
  };
}
function O(Q, A, g) {
  B.wasm_bindgen__convert__closures_____invoke__h8181430204266fe8(Q, A, g);
}
function x(Q, A, g) {
  B.wasm_bindgen__convert__closures_____invoke__h3539d83fc0ea60a4(Q, A, g);
}
function d(Q, A, g) {
  B.wasm_bindgen__convert__closures_____invoke__h36ee117695786273(Q, A, g);
}
function T(Q, A, g) {
  const I = B.wasm_bindgen__convert__closures________invoke__he5adf6138eb6d6d2(Q, A, g);
  if (I[1])
    throw a(I[0]);
}
function q(Q, A, g) {
  const I = B.wasm_bindgen__convert__closures________invoke__h4adfd56a9cbd4460(Q, A, g);
  if (I[2])
    throw a(I[1]);
  return a(I[0]);
}
typeof FinalizationRegistry > "u" || new FinalizationRegistry((Q) => B.__wbg_dapadapter_free(Q >>> 0, 1));
const p = typeof FinalizationRegistry > "u" ? { register: () => {
}, unregister: () => {
} } : new FinalizationRegistry((Q) => B.__wbg_trap_free(Q >>> 0, 1));
function y(Q) {
  const A = B.__externref_table_alloc();
  return B.__wbindgen_externrefs.set(A, Q), A;
}
const c = typeof FinalizationRegistry > "u" ? { register: () => {
}, unregister: () => {
} } : new FinalizationRegistry((Q) => Q.dtor(Q.a, Q.b));
function H(Q) {
  const A = typeof Q;
  if (A == "number" || A == "boolean" || Q == null)
    return \`\${Q}\`;
  if (A == "string")
    return \`"\${Q}"\`;
  if (A == "symbol") {
    const C = Q.description;
    return C == null ? "Symbol" : \`Symbol(\${C})\`;
  }
  if (A == "function") {
    const C = Q.name;
    return typeof C == "string" && C.length > 0 ? \`Function(\${C})\` : "Function";
  }
  if (Array.isArray(Q)) {
    const C = Q.length;
    let E = "[";
    C > 0 && (E += H(Q[0]));
    for (let w = 1; w < C; w++)
      E += ", " + H(Q[w]);
    return E += "]", E;
  }
  const g = /\\[object ([^\\]]+)\\]/.exec(toString.call(Q));
  let I;
  if (g && g.length > 1)
    I = g[1];
  else
    return toString.call(Q);
  if (I == "Object")
    try {
      return "Object(" + JSON.stringify(Q) + ")";
    } catch {
      return "Object";
    }
  return Q instanceof Error ? \`\${Q.name}: \${Q.message}
\${Q.stack}\` : I;
}
function j(Q, A) {
  Q = Q >>> 0;
  const g = i(), I = [];
  for (let C = Q; C < Q + 4 * A; C += 4)
    I.push(B.__wbindgen_externrefs.get(g.getUint32(C, !0)));
  return B.__externref_drop_slice(Q, A), I;
}
function S(Q, A) {
  return Q = Q >>> 0, R().subarray(Q / 1, Q / 1 + A);
}
let k = null;
function i() {
  return (k === null || k.buffer.detached === !0 || k.buffer.detached === void 0 && k.buffer !== B.memory.buffer) && (k = new DataView(B.memory.buffer)), k;
}
function N(Q, A) {
  return Q = Q >>> 0, P(Q, A);
}
let J = null;
function R() {
  return (J === null || J.byteLength === 0) && (J = new Uint8Array(B.memory.buffer)), J;
}
function D(Q, A) {
  try {
    return Q.apply(this, A);
  } catch (g) {
    const I = y(g);
    B.__wbindgen_exn_store(I);
  }
}
function G(Q) {
  return Q == null;
}
function l(Q, A, g, I) {
  const C = { a: Q, b: A, cnt: 1, dtor: g }, E = (...w) => {
    C.cnt++;
    try {
      return I(C.a, C.b, ...w);
    } finally {
      E._wbg_cb_unref();
    }
  };
  return E._wbg_cb_unref = () => {
    --C.cnt === 0 && (C.dtor(C.a, C.b), C.a = 0, c.unregister(C));
  }, c.register(E, C, C), E;
}
function Y(Q, A, g, I) {
  const C = { a: Q, b: A, cnt: 1, dtor: g }, E = (...w) => {
    C.cnt++;
    const o = C.a;
    C.a = 0;
    try {
      return I(o, C.b, ...w);
    } finally {
      C.a = o, E._wbg_cb_unref();
    }
  };
  return E._wbg_cb_unref = () => {
    --C.cnt === 0 && (C.dtor(C.a, C.b), C.a = 0, c.unregister(C));
  }, c.register(E, C, C), E;
}
function K(Q, A, g) {
  if (g === void 0) {
    const o = U.encode(Q), F = A(o.length, 1) >>> 0;
    return R().subarray(F, F + o.length).set(o), M = o.length, F;
  }
  let I = Q.length, C = A(I, 1) >>> 0;
  const E = R();
  let w = 0;
  for (; w < I; w++) {
    const o = Q.charCodeAt(w);
    if (o > 127) break;
    E[C + w] = o;
  }
  if (w !== I) {
    w !== 0 && (Q = Q.slice(w)), C = g(C, I, I = w + Q.length * 3, 1) >>> 0;
    const o = R().subarray(C + w, C + I), F = U.encodeInto(Q, o);
    w += F.written, C = g(C, I, w, 1) >>> 0;
  }
  return M = w, C;
}
function a(Q) {
  const A = B.__wbindgen_externrefs.get(Q);
  return B.__externref_table_dealloc(Q), A;
}
let L = new TextDecoder("utf-8", { ignoreBOM: !0, fatal: !0 });
L.decode();
const t = 2146435072;
let s = 0;
function P(Q, A) {
  return s += A, s >= t && (L = new TextDecoder("utf-8", { ignoreBOM: !0, fatal: !0 }), L.decode(), s = A), L.decode(R().subarray(Q, Q + A));
}
const U = new TextEncoder();
"encodeInto" in U || (U.encodeInto = function(Q, A) {
  const g = U.encode(Q);
  return A.set(g), {
    read: Q.length,
    written: g.length
  };
});
let M = 0, B;
function V(Q, A) {
  return B = Q.exports, k = null, J = null, B.__wbindgen_start(), B;
}
async function z(Q, A) {
  if (typeof Response == "function" && Q instanceof Response) {
    if (typeof WebAssembly.instantiateStreaming == "function")
      try {
        return await WebAssembly.instantiateStreaming(Q, A);
      } catch (C) {
        if (Q.ok && g(Q.type) && Q.headers.get("Content-Type") !== "application/wasm")
          console.warn("\`WebAssembly.instantiateStreaming\` failed because your server does not serve Wasm with \`application/wasm\` MIME type. Falling back to \`WebAssembly.instantiate\` which is slower. Original error:\\n", C);
        else
          throw C;
      }
    const I = await Q.arrayBuffer();
    return await WebAssembly.instantiate(I, A);
  } else {
    const I = await WebAssembly.instantiate(Q, A);
    return I instanceof WebAssembly.Instance ? { instance: I, module: Q } : I;
  }
  function g(I) {
    switch (I) {
      case "basic":
      case "cors":
      case "default":
        return !0;
    }
    return !1;
  }
}
async function b(Q) {
  if (B !== void 0) return B;
  Q !== void 0 && (Object.getPrototypeOf(Q) === Object.prototype ? { module_or_path: Q } = Q : console.warn("using deprecated parameters for the initialization function; pass a single object instead")), Q === void 0 && (Q = new URL("", import.meta.url));
  const A = W();
  (typeof Q == "string" || typeof Request == "function" && Q instanceof Request || typeof URL == "function" && Q instanceof URL) && (Q = fetch(Q));
  const { instance: g, module: I } = await z(await Q, A);
  return V(g);
}
var m = new URL("http://localhost:20233/debugger/engine_bg.wasm");
function X(Q) {
  return Q instanceof Error ? {
    type: "error",
    error: { type: Q.constructor.name, message: Q.message }
  } : {
    type: "error",
    error: { type: typeof Q, message: String(Q) }
  };
}
try {
  await b({ module_or_path: m }), Z();
} catch (Q) {
  postMessage({
    type: "stop",
    result: X(Q)
  });
}
`, $ = typeof self < "u" && self.Blob && new Blob(["URL.revokeObjectURL(import.meta.url);", "const nativeFetch=self.fetch.bind(self);self.fetch=(input,options)=>{const url=typeof input==='string'?input:input.url||String(input);const prefix='https://fabioibanez.github.io/website/';const file=url.slice(prefix.length);const target=file==='llvm.core.wasm'?'adapter.wasm':file==='llvm-resources.tar.gz'?'empty.tar.gz':file;return nativeFetch(url.startsWith(prefix)?'http://localhost:20233/debugger/'+target:input,options);};", CA], { type: "text/javascript;charset=utf-8" });
function pA(Q) {
  let A;
  try {
    if (A = $ && (self.URL || self.webkitURL).createObjectURL($), !A) throw "";
    const g = new Worker(A, {
      type: "module",
      name: Q?.name
    });
    return g.addEventListener("error", () => {
      (self.URL || self.webkitURL).revokeObjectURL(A);
    }), g;
  } catch {
    return new Worker(
      "data:text/javascript;charset=utf-8," + encodeURIComponent(CA),
      {
        type: "module",
        name: Q?.name
      }
    );
  }
}
class QA {
  stdout = new AA(1);
  stderr = new AA(2);
  stdin = new S();
  debugger;
  debuggeeMemory;
  /** A function which, when called, rejects the ongoing execution */
  rejector;
  /** The ongoing `run` promise, if any */
  promise;
  /**
   * The programming language of this engine.
   */
  lang;
  /**
   * The *initial* filesystem that the code sees.
   *
   * This is neither updated while the code is running, nor
   * will updating it have any effect on code that is already running.
   */
  fs = {};
  static async create(A) {
    if (await cA({ module_or_path: sA }), typeof window < "u" && typeof fetch < "u")
      for (const g of MA(A)) fetch(g, { cache: "force-cache" });
    return new QA(A);
  }
  constructor(A) {
    this.debugger = new qA(), this.lang = A;
  }
  /**
   * Stops the currently running execution.
   */
  stop() {
    this.rejector?.();
  }
  /**
   * Runs the program. {@link CompletedResult} carries build/run timing: `timing.runMs`
   * is the isolated user-program execution step, `timing.buildMs` covers toolchain fetch,
   * compile, and link, and `timing.totalMs` adds host-side worker startup and teardown.
   */
  async run() {
    if (this.promise) return this.promise;
    this.promise = this.execute();
    try {
      return await this.promise;
    } finally {
      this.promise = void 0;
    }
  }
  async execute() {
    const A = performance.now(), g = new pA();
    // Code App uses this shared memory to format its libc++ values while paused.
    g.addEventListener("message", (event) => {
      if (event.data.type === "debug") this.debuggeeMemory = event.data.info.memory.memory;
    });
    this.stdout[J].attach(g), this.stderr[J].attach(g), this.debugger[J].attach(g);
    try {
      return await new Promise(async (I, C) => {
        this.rejector = () => C("stopped"), g.addEventListener("error", (N) => C(N.error)), await new Promise((N) => {
          const F = (y) => {
            y.data.type === "ready" && (g.removeEventListener("message", F), N());
          };
          g.addEventListener("message", F);
        }), g.addEventListener("message", (N) => {
          N.data.type === "stop" ? I({
            type: "completed",
            exitCode: N.data.exit_code,
            timing: {
              totalMs: performance.now() - A,
              buildMs: N.data.build_ms,
              runMs: N.data.run_ms
            }
          }) : N.data.type === "error" && I({
            type: "error",
            error: { type: "EngineError", message: N.data.message }
          });
        });
        const w = {
          fs: this.fs,
          lang: this.lang,
          stdin_buffer: this.stdin[J].buffer,
          is_debug: this.debugger.enabled
        };
        g.postMessage(w);
      });
    } catch (I) {
      return I === "stopped" ? { type: "stopped" } : HA(I);
    } finally {
      this.debuggeeMemory = void 0;
      this.rejector = void 0, this.stdout[J].detach(g), this.stderr[J].detach(g), this.stdin[J].clear(), g.terminate();
    }
  }
}
class AA extends gA {
  constructor(A) {
    super(), this.mode = A, this.callback = ((g) => {
      const I = g.data;
      if (I.type !== "stdout" || I.mode !== this.mode) return;
      const C = I.data;
      this.emit("data", C);
    }).bind(this), this[J] = {
      attach: this.attach.bind(this),
      detach: this.detach.bind(this)
    };
  }
  callback;
  [J];
  attach(A) {
    A.addEventListener("message", this.callback);
  }
  detach(A) {
    A.removeEventListener("message", this.callback);
  }
}
class S {
  /**
   * Ring buffer to store stdin data.
   *
   * - TypeScript controls write_index, Rust controls read_index
   * - One slot is always kept empty to distinguish full from empty
   */
  static BUFFER_SIZE = 2048;
  static HEADER_SIZE = 8;
  // 2 x i32
  static DATA_SIZE = S.BUFFER_SIZE - S.HEADER_SIZE;
  static READ_IDX = 0;
  static WRITE_IDX = 1;
  static encoder = new TextEncoder();
  buffer = new SharedArrayBuffer(S.BUFFER_SIZE);
  indices;
  data;
  [J];
  constructor() {
    this.indices = new Int32Array(this.buffer, 0, 2), this.data = new Int8Array(this.buffer, S.HEADER_SIZE), this[J] = {
      clear: this.clear.bind(this),
      buffer: this.buffer
    };
  }
  clear() {
    this.indices.fill(0);
  }
  async write(A) {
    const g = typeof A == "string" ? S.encoder.encode(A) : A;
    return this.writeBytes(g);
  }
  async writeBytes(A) {
    const { DATA_SIZE: g, READ_IDX: I, WRITE_IDX: C } = S;
    let w = 0;
    for (; w < A.length; ) {
      const N = Atomics.load(this.indices, I);
      let F = Atomics.load(this.indices, C);
      F === g - 1 && N > 0 && (F = 0);
      const y = N <= F ? g - F - 1 : N - F - 1;
      if (y === 0) {
        await Atomics.waitAsync(this.indices, I, N).value;
        continue;
      }
      const s = Math.min(A.length - w, y);
      this.data.set(A.subarray(w, w + s), F), Atomics.store(this.indices, C, (F + s) % g), Atomics.notify(this.indices, C), w += s;
    }
  }
}
export {
  aA as Artifact,
  qA as Debugger,
  QA as Engine,
  S as Stdin,
  AA as Stdout
};
