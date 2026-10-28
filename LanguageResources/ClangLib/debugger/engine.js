function MA(C) {
  return C && C.__esModule && Object.prototype.hasOwnProperty.call(C, "default") ? C.default : C;
}
var K = { exports: {} }, e;
function GA() {
  if (e) return K.exports;
  e = 1;
  var C = typeof Reflect == "object" ? Reflect : null, A = C && typeof C.apply == "function" ? C.apply : function(B, N, c) {
    return Function.prototype.apply.call(B, N, c);
  }, I;
  C && typeof C.ownKeys == "function" ? I = C.ownKeys : Object.getOwnPropertySymbols ? I = function(B) {
    return Object.getOwnPropertyNames(B).concat(Object.getOwnPropertySymbols(B));
  } : I = function(B) {
    return Object.getOwnPropertyNames(B);
  };
  function Q(E) {
    console && console.warn && console.warn(E);
  }
  var g = Number.isNaN || function(B) {
    return B !== B;
  };
  function D() {
    D.init.call(this);
  }
  K.exports = D, K.exports.once = DA, D.EventEmitter = D, D.prototype._events = void 0, D.prototype._eventsCount = 0, D.prototype._maxListeners = void 0;
  var M = 10;
  function o(E) {
    if (typeof E != "function")
      throw new TypeError('The "listener" argument must be of type Function. Received type ' + typeof E);
  }
  Object.defineProperty(D, "defaultMaxListeners", {
    enumerable: !0,
    get: function() {
      return M;
    },
    set: function(E) {
      if (typeof E != "number" || E < 0 || g(E))
        throw new RangeError('The value of "defaultMaxListeners" is out of range. It must be a non-negative number. Received ' + E + ".");
      M = E;
    }
  }), D.init = function() {
    (this._events === void 0 || this._events === Object.getPrototypeOf(this)._events) && (this._events = /* @__PURE__ */ Object.create(null), this._eventsCount = 0), this._maxListeners = this._maxListeners || void 0;
  }, D.prototype.setMaxListeners = function(B) {
    if (typeof B != "number" || B < 0 || g(B))
      throw new RangeError('The value of "n" is out of range. It must be a non-negative number. Received ' + B + ".");
    return this._maxListeners = B, this;
  };
  function Z(E) {
    return E._maxListeners === void 0 ? D.defaultMaxListeners : E._maxListeners;
  }
  D.prototype.getMaxListeners = function() {
    return Z(this);
  }, D.prototype.emit = function(B) {
    for (var N = [], c = 1; c < arguments.length; c++) N.push(arguments[c]);
    var G = B === "error", F = this._events;
    if (F !== void 0)
      G = G && F.error === void 0;
    else if (!G)
      return !1;
    if (G) {
      var k;
      if (N.length > 0 && (k = N[0]), k instanceof Error)
        throw k;
      var h = new Error("Unhandled error." + (k ? " (" + k.message + ")" : ""));
      throw h.context = k, h;
    }
    var O = F[B];
    if (O === void 0)
      return !1;
    if (typeof O == "function")
      A(O, this, N);
    else
      for (var v = O.length, cA = f(O, v), c = 0; c < v; ++c)
        A(cA[c], this, N);
    return !0;
  };
  function d(E, B, N, c) {
    var G, F, k;
    if (o(N), F = E._events, F === void 0 ? (F = E._events = /* @__PURE__ */ Object.create(null), E._eventsCount = 0) : (F.newListener !== void 0 && (E.emit(
      "newListener",
      B,
      N.listener ? N.listener : N
    ), F = E._events), k = F[B]), k === void 0)
      k = F[B] = N, ++E._eventsCount;
    else if (typeof k == "function" ? k = F[B] = c ? [N, k] : [k, N] : c ? k.unshift(N) : k.push(N), G = Z(E), G > 0 && k.length > G && !k.warned) {
      k.warned = !0;
      var h = new Error("Possible EventEmitter memory leak detected. " + k.length + " " + String(B) + " listeners added. Use emitter.setMaxListeners() to increase limit");
      h.name = "MaxListenersExceededWarning", h.emitter = E, h.type = B, h.count = k.length, Q(h);
    }
    return E;
  }
  D.prototype.addListener = function(B, N) {
    return d(this, B, N, !1);
  }, D.prototype.on = D.prototype.addListener, D.prototype.prependListener = function(B, N) {
    return d(this, B, N, !0);
  };
  function BA() {
    if (!this.fired)
      return this.target.removeListener(this.type, this.wrapFn), this.fired = !0, arguments.length === 0 ? this.listener.call(this.target) : this.listener.apply(this.target, arguments);
  }
  function q(E, B, N) {
    var c = { fired: !1, wrapFn: void 0, target: E, type: B, listener: N }, G = BA.bind(c);
    return G.listener = N, c.wrapFn = G, G;
  }
  D.prototype.once = function(B, N) {
    return o(N), this.on(B, q(this, B, N)), this;
  }, D.prototype.prependOnceListener = function(B, N) {
    return o(N), this.prependListener(B, q(this, B, N)), this;
  }, D.prototype.removeListener = function(B, N) {
    var c, G, F, k, h;
    if (o(N), G = this._events, G === void 0)
      return this;
    if (c = G[B], c === void 0)
      return this;
    if (c === N || c.listener === N)
      --this._eventsCount === 0 ? this._events = /* @__PURE__ */ Object.create(null) : (delete G[B], G.removeListener && this.emit("removeListener", B, c.listener || N));
    else if (typeof c != "function") {
      for (F = -1, k = c.length - 1; k >= 0; k--)
        if (c[k] === N || c[k].listener === N) {
          h = c[k].listener, F = k;
          break;
        }
      if (F < 0)
        return this;
      F === 0 ? c.shift() : EA(c, F), c.length === 1 && (G[B] = c[0]), G.removeListener !== void 0 && this.emit("removeListener", B, h || N);
    }
    return this;
  }, D.prototype.off = D.prototype.removeListener, D.prototype.removeAllListeners = function(B) {
    var N, c, G;
    if (c = this._events, c === void 0)
      return this;
    if (c.removeListener === void 0)
      return arguments.length === 0 ? (this._events = /* @__PURE__ */ Object.create(null), this._eventsCount = 0) : c[B] !== void 0 && (--this._eventsCount === 0 ? this._events = /* @__PURE__ */ Object.create(null) : delete c[B]), this;
    if (arguments.length === 0) {
      var F = Object.keys(c), k;
      for (G = 0; G < F.length; ++G)
        k = F[G], k !== "removeListener" && this.removeAllListeners(k);
      return this.removeAllListeners("removeListener"), this._events = /* @__PURE__ */ Object.create(null), this._eventsCount = 0, this;
    }
    if (N = c[B], typeof N == "function")
      this.removeListener(B, N);
    else if (N !== void 0)
      for (G = N.length - 1; G >= 0; G--)
        this.removeListener(B, N[G]);
    return this;
  };
  function n(E, B, N) {
    var c = E._events;
    if (c === void 0)
      return [];
    var G = c[B];
    return G === void 0 ? [] : typeof G == "function" ? N ? [G.listener || G] : [G] : N ? NA(G) : f(G, G.length);
  }
  D.prototype.listeners = function(B) {
    return n(this, B, !0);
  }, D.prototype.rawListeners = function(B) {
    return n(this, B, !1);
  }, D.listenerCount = function(E, B) {
    return typeof E.listenerCount == "function" ? E.listenerCount(B) : t.call(E, B);
  }, D.prototype.listenerCount = t;
  function t(E) {
    var B = this._events;
    if (B !== void 0) {
      var N = B[E];
      if (typeof N == "function")
        return 1;
      if (N !== void 0)
        return N.length;
    }
    return 0;
  }
  D.prototype.eventNames = function() {
    return this._eventsCount > 0 ? I(this._events) : [];
  };
  function f(E, B) {
    for (var N = new Array(B), c = 0; c < B; ++c)
      N[c] = E[c];
    return N;
  }
  function EA(E, B) {
    for (; B + 1 < E.length; B++)
      E[B] = E[B + 1];
    E.pop();
  }
  function NA(E) {
    for (var B = new Array(E.length), N = 0; N < B.length; ++N)
      B[N] = E[N].listener || E[N];
    return B;
  }
  function DA(E, B) {
    return new Promise(function(N, c) {
      function G(k) {
        E.removeListener(B, F), c(k);
      }
      function F() {
        typeof E.removeListener == "function" && E.removeListener("error", G), N([].slice.call(arguments));
      }
      P(E, B, F, { once: !0 }), B !== "error" && YA(E, G, { once: !0 });
    });
  }
  function YA(E, B, N) {
    typeof E.on == "function" && P(E, "error", B, N);
  }
  function P(E, B, N, c) {
    if (typeof E.on == "function")
      c.once ? E.once(B, N) : E.on(B, N);
    else if (typeof E.addEventListener == "function")
      E.addEventListener(B, function G(F) {
        c.once && E.removeEventListener(B, G), N(F);
      });
    else
      throw new TypeError('The "emitter" argument must be of type EventEmitter. Received type ' + typeof E);
  }
  return K.exports;
}
var kA = GA();
const IA = /* @__PURE__ */ MA(kA);
class S {
  __destroy_into_raw() {
    const A = this.__wbg_ptr;
    return this.__wbg_ptr = 0, r.unregister(this), A;
  }
  free() {
    const A = this.__destroy_into_raw();
    Y.__wbg_dapadapter_free(A, 0);
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
    Y.dapadapter_attach(this.__wbg_ptr, A);
  }
  constructor() {
    const A = Y.dapadapter_new();
    return this.__wbg_ptr = A >>> 0, r.register(this, this.__wbg_ptr, this), this;
  }
  /**
   * @param {Function} callback
   */
  on(A) {
    Y.dapadapter_on(this.__wbg_ptr, A);
  }
  /**
   * @param {any} msg
   * @returns {any}
   */
  sendMessage(A) {
    return Y.dapadapter_sendMessage(this.__wbg_ptr, A);
  }
  /**
   * @param {boolean} value
   */
  setFilterInternals(A) {
    Y.dapadapter_setFilterInternals(this.__wbg_ptr, A);
  }
}
Symbol.dispose && (S.prototype[Symbol.dispose] = S.prototype.free);
class p {
  static __wrap(A) {
    A = A >>> 0;
    const I = Object.create(p.prototype);
    return I.__wbg_ptr = A, _.register(I, I.__wbg_ptr, I), I;
  }
  __destroy_into_raw() {
    const A = this.__wbg_ptr;
    return this.__wbg_ptr = 0, _.unregister(this), A;
  }
  free() {
    const A = this.__destroy_into_raw();
    Y.__wbg_trap_free(A, 0);
  }
  /**
   * A marker method to indicate that an object is an instance of the `Trap`
   * class.
   */
  static __wbg_wasmer_trap() {
    Y.trap___wbg_wasmer_trap();
  }
}
Symbol.dispose && (p.prototype[Symbol.dispose] = p.prototype.free);
function wA(C) {
  const A = U(C, Y.__wbindgen_malloc, Y.__wbindgen_realloc), I = l, Q = Y.prefetch_urls(A, I);
  var g = QA(Q[0], Q[1]).slice();
  return Y.__wbindgen_free(Q[0], Q[1] * 4, 4), g;
}
function oA() {
  return {
    __proto__: null,
    "./engine_bg.js": {
      __proto__: null,
      __wbg_BigInt_b7bbccdff258c9f2: function(A) {
        return BigInt(A);
      },
      __wbg_Error_8c4e43fe74559d73: function(A, I) {
        return Error(j(A, I));
      },
      __wbg_Number_04624de7d0e8332d: function(A) {
        return Number(A);
      },
      __wbg_String_8f0eb39a4a4c2f66: function(A, I) {
        const Q = String(I), g = U(Q, Y.__wbindgen_malloc, Y.__wbindgen_realloc), D = l;
        J().setInt32(A + 4, D, !0), J().setInt32(A + 0, g, !0);
      },
      __wbg___wbindgen_bigint_get_as_i64_8fcf4ce7f1ca72a2: function(A, I) {
        const Q = I, g = typeof Q == "bigint" ? Q : void 0;
        J().setBigInt64(A + 8, y(g) ? BigInt(0) : g, !0), J().setInt32(A + 0, !y(g), !0);
      },
      __wbg___wbindgen_boolean_get_bbbb1c18aa2f5e25: function(A) {
        const I = A, Q = typeof I == "boolean" ? I : void 0;
        return y(Q) ? 16777215 : Q ? 1 : 0;
      },
      __wbg___wbindgen_debug_string_0bc8482c6e3508ae: function(A, I) {
        const Q = L(I), g = U(Q, Y.__wbindgen_malloc, Y.__wbindgen_realloc), D = l;
        J().setInt32(A + 4, D, !0), J().setInt32(A + 0, g, !0);
      },
      __wbg___wbindgen_function_table_5ae7216dfcbcc506: function() {
        return Y.__wbindgen_export;
      },
      __wbg___wbindgen_in_47fa6863be6f2f25: function(A, I) {
        return A in I;
      },
      __wbg___wbindgen_is_bigint_31b12575b56f32fc: function(A) {
        return typeof A == "bigint";
      },
      __wbg___wbindgen_is_function_0095a73b8b156f76: function(A) {
        return typeof A == "function";
      },
      __wbg___wbindgen_is_object_5ae8e5880f2c1fbd: function(A) {
        const I = A;
        return typeof I == "object" && I !== null;
      },
      __wbg___wbindgen_is_string_cd444516edc5b180: function(A) {
        return typeof A == "string";
      },
      __wbg___wbindgen_is_undefined_9e4d92534c42d778: function(A) {
        return A === void 0;
      },
      __wbg___wbindgen_jsval_eq_11888390b0186270: function(A, I) {
        return A === I;
      },
      __wbg___wbindgen_jsval_loose_eq_9dd77d8cd6671811: function(A, I) {
        return A == I;
      },
      __wbg___wbindgen_lt_bb59cc3d23526e0d: function(A, I) {
        return A < I;
      },
      __wbg___wbindgen_neg_6b4d356dff49dcc6: function(A) {
        return -A;
      },
      __wbg___wbindgen_number_get_8ff4255516ccad3e: function(A, I) {
        const Q = I, g = typeof Q == "number" ? Q : void 0;
        J().setFloat64(A + 8, y(g) ? 0 : g, !0), J().setInt32(A + 0, !y(g), !0);
      },
      __wbg___wbindgen_rethrow_05525c567f154472: function(A) {
        throw A;
      },
      __wbg___wbindgen_shr_ef8e07cce709eb54: function(A, I) {
        return A >> I;
      },
      __wbg___wbindgen_string_get_72fb696202c56729: function(A, I) {
        const Q = I, g = typeof Q == "string" ? Q : void 0;
        var D = y(g) ? 0 : U(g, Y.__wbindgen_malloc, Y.__wbindgen_realloc), M = l;
        J().setInt32(A + 4, M, !0), J().setInt32(A + 0, D, !0);
      },
      __wbg___wbindgen_throw_be289d5034ed271b: function(A, I) {
        throw new Error(j(A, I));
      },
      __wbg__wbg_cb_unref_d9b87ff7982e3b21: function(A) {
        A._wbg_cb_unref();
      },
      __wbg_addEventListener_3acb0aad4483804c: function() {
        return w(function(A, I, Q, g) {
          A.addEventListener(j(I, Q), g);
        }, arguments);
      },
      __wbg_apply_2e22c45cb4f12415: function() {
        return w(function(A, I, Q) {
          return Reflect.apply(A, I, Q);
        }, arguments);
      },
      __wbg_apply_ada2ee1a60ac7b3c: function() {
        return w(function(A, I, Q) {
          return A.apply(I, Q);
        }, arguments);
      },
      __wbg_arrayBuffer_bb54076166006c39: function() {
        return w(function(A) {
          return A.arrayBuffer();
        }, arguments);
      },
      __wbg_bind_1dc37de2b9939128: function(A, I, Q, g) {
        return A.bind(I, Q, g);
      },
      __wbg_bind_29ba380591735d8c: function(A, I, Q) {
        return A.bind(I, Q);
      },
      __wbg_buffer_7b5f53e46557d8f1: function(A) {
        return A.buffer;
      },
      __wbg_byteLength_7b03c17ff1e4037f: function(A) {
        return A.byteLength;
      },
      __wbg_call_389efe28435a9388: function() {
        return w(function(A, I) {
          return A.call(I);
        }, arguments);
      },
      __wbg_call_4708e0c13bdc8e95: function() {
        return w(function(A, I, Q) {
          return A.call(I, Q);
        }, arguments);
      },
      __wbg_constructor_ad6c0ed428f55d34: function(A) {
        return A.constructor;
      },
      __wbg_crypto_86f2631e91b51511: function(A) {
        return A.crypto;
      },
      __wbg_customSections_193491b069139fb1: function(A, I, Q) {
        return WebAssembly.Module.customSections(A, j(I, Q));
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
      __wbg_error_7534b8e9a36f1ab4: function(A, I) {
        let Q, g;
        try {
          Q = A, g = I, console.error(j(A, I));
        } finally {
          Y.__wbindgen_free(Q, g, 1);
        }
      },
      __wbg_exports_794a42000dacd046: function(A) {
        return WebAssembly.Module.exports(A);
      },
      __wbg_exports_86b4926134c40288: function(A) {
        return A.exports;
      },
      __wbg_fetch_d1488f40cef1e210: function(A, I, Q) {
        return A.fetch(j(I, Q));
      },
      __wbg_from_bddd64e7d5ff6941: function(A) {
        return Array.from(A);
      },
      __wbg_getPrototypeOf_2653517f1dc884d5: function() {
        return w(function(A) {
          return Reflect.getPrototypeOf(A);
        }, arguments);
      },
      __wbg_getRandomValues_b3f15fcbfabb0f8b: function() {
        return w(function(A, I) {
          A.getRandomValues(I);
        }, arguments);
      },
      __wbg_getTime_1e3cd1391c5c3995: function(A) {
        return A.getTime();
      },
      __wbg_getTimezoneOffset_81776d10a4ec18a8: function(A) {
        return A.getTimezoneOffset();
      },
      __wbg_getUint32_bb6f5a401408e7fa: function(A, I, Q) {
        return A.getUint32(I >>> 0, Q !== 0);
      },
      __wbg_get_7efbcc3819719b0f: function() {
        return w(function(A, I) {
          return A.get(I >>> 0);
        }, arguments);
      },
      __wbg_get_9b94d73e6221f75c: function(A, I) {
        return A[I >>> 0];
      },
      __wbg_get_b3ed3ad4be2bc8ac: function() {
        return w(function(A, I) {
          return Reflect.get(A, I);
        }, arguments);
      },
      __wbg_get_index_253dd2a9e007656d: function(A, I) {
        return A[I >>> 0];
      },
      __wbg_get_index_9a5bfdd2ca49c65f: function(A, I) {
        return A[I >>> 0];
      },
      __wbg_get_with_ref_key_1dc361bd10053bfe: function(A, I) {
        return A[I];
      },
      __wbg_grow_5d42bf28c2da22cb: function() {
        return w(function(A, I) {
          return A.grow(I >>> 0);
        }, arguments);
      },
      __wbg_grow_d034989fce14cc8e: function() {
        return w(function(A, I) {
          return A.grow(I >>> 0);
        }, arguments);
      },
      __wbg_imports_8333d40ab24779ad: function(A) {
        return WebAssembly.Module.imports(A);
      },
      __wbg_instanceof_ArrayBuffer_c367199e2fa2aa04: function(A) {
        let I;
        try {
          I = A instanceof ArrayBuffer;
        } catch {
          I = !1;
        }
        return I;
      },
      __wbg_instanceof_Error_8573fe0b0b480f46: function(A) {
        let I;
        try {
          I = A instanceof Error;
        } catch {
          I = !1;
        }
        return I;
      },
      __wbg_instanceof_Function_2a29eec978bb3b11: function(A) {
        let I;
        try {
          I = A instanceof Function;
        } catch {
          I = !1;
        }
        return I;
      },
      __wbg_instanceof_Global_2db767b6b2347f01: function(A) {
        let I;
        try {
          I = A instanceof WebAssembly.Global;
        } catch {
          I = !1;
        }
        return I;
      },
      __wbg_instanceof_Map_53af74335dec57f4: function(A) {
        let I;
        try {
          I = A instanceof Map;
        } catch {
          I = !1;
        }
        return I;
      },
      __wbg_instanceof_Memory_dc8c61e3f831ee37: function(A) {
        let I;
        try {
          I = A instanceof WebAssembly.Memory;
        } catch {
          I = !1;
        }
        return I;
      },
      __wbg_instanceof_Object_1c6af87502b733ed: function(A) {
        let I;
        try {
          I = A instanceof Object;
        } catch {
          I = !1;
        }
        return I;
      },
      __wbg_instanceof_RangeError_0b0dd056bc557b89: function(A) {
        let I;
        try {
          I = A instanceof RangeError;
        } catch {
          I = !1;
        }
        return I;
      },
      __wbg_instanceof_Response_ee1d54d79ae41977: function(A) {
        let I;
        try {
          I = A instanceof Response;
        } catch {
          I = !1;
        }
        return I;
      },
      __wbg_instanceof_SharedArrayBuffer_91d8a2fa16a2cc26: function(A) {
        let I;
        try {
          I = A instanceof SharedArrayBuffer;
        } catch {
          I = !1;
        }
        return I;
      },
      __wbg_instanceof_Table_127f216e592f4159: function(A) {
        let I;
        try {
          I = A instanceof WebAssembly.Table;
        } catch {
          I = !1;
        }
        return I;
      },
      __wbg_instanceof_Tag_f1d6b24a98b95210: function(A) {
        let I;
        try {
          I = A instanceof WebAssembly.Tag;
        } catch {
          I = !1;
        }
        return I;
      },
      __wbg_instanceof_Uint8Array_9b9075935c74707c: function(A) {
        let I;
        try {
          I = A instanceof Uint8Array;
        } catch {
          I = !1;
        }
        return I;
      },
      __wbg_isArray_d314bb98fcf08331: function(A) {
        return Array.isArray(A);
      },
      __wbg_isSafeInteger_bfbc7332a9768d2a: function(A) {
        return Number.isSafeInteger(A);
      },
      __wbg_is_f29129f676e5410c: function(A, I) {
        return Object.is(A, I);
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
        return w(function(A, I) {
          return Atomics.load(A, I >>> 0);
        }, arguments);
      },
      __wbg_message_9ddc4b9a62a7c379: function(A) {
        return A.message;
      },
      __wbg_msCrypto_d562bbe83e0d4b91: function(A) {
        return A.msCrypto;
      },
      __wbg_new_0728bd2d4c5d41dd: function() {
        return w(function(A) {
          return new WebAssembly.Tag(A);
        }, arguments);
      },
      __wbg_new_0_73afc35eb544e539: function() {
        return /* @__PURE__ */ new Date();
      },
      __wbg_new_245cd5c49157e602: function(A) {
        return new Date(A);
      },
      __wbg_new_2ac7fa8be584d280: function(A, I, Q) {
        return new DataView(A, I >>> 0, Q >>> 0);
      },
      __wbg_new_361308b2356cecd0: function() {
        return new Object();
      },
      __wbg_new_3eb36ae241fe6f44: function() {
        return new Array();
      },
      __wbg_new_4a996a46a82782b6: function() {
        return w(function(A, I) {
          return new WebAssembly.Global(A, I);
        }, arguments);
      },
      __wbg_new_57c27ff3ddf5b62c: function() {
        return w(function(A) {
          return new WebAssembly.Module(A);
        }, arguments);
      },
      __wbg_new_67274f72d5abea37: function() {
        return w(function(A) {
          return new WebAssembly.Table(A);
        }, arguments);
      },
      __wbg_new_8a6f238a6ece86ea: function() {
        return new Error();
      },
      __wbg_new_a4e3cab1cdd635ba: function() {
        return w(function(A, I) {
          return new WebAssembly.Instance(A, I);
        }, arguments);
      },
      __wbg_new_b061c0550d9f3281: function() {
        return w(function(A) {
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
      __wbg_new_from_slice_a3d2629dc1826784: function(A, I) {
        return new Uint8Array(H(A, I));
      },
      __wbg_new_no_args_1c7c842f08d00ebb: function(A, I) {
        return new Function(j(A, I));
      },
      __wbg_new_with_args_7bba34e94b1cfa40: function(A, I, Q, g) {
        return new Function(j(A, I), j(Q, g));
      },
      __wbg_new_with_byte_offset_9120ba79e057895b: function(A, I) {
        return new Uint8Array(A, I >>> 0);
      },
      __wbg_new_with_byte_offset_and_length_aa261d9c9da49eb1: function(A, I, Q) {
        return new Uint8Array(A, I >>> 0, Q >>> 0);
      },
      __wbg_new_with_byte_offset_and_length_bc2e7b72cc96d1c1: function(A, I, Q) {
        return new Int32Array(A, I >>> 0, Q >>> 0);
      },
      __wbg_new_with_length_1763c527b2923202: function(A) {
        return new Array(A >>> 0);
      },
      __wbg_new_with_length_a2c39cbe88fd8ff1: function(A) {
        return new Uint8Array(A >>> 0);
      },
      __wbg_next_3482f54c49e8af19: function() {
        return w(function(A) {
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
        return w(function(A, I) {
          return Atomics.notify(A, I >>> 0);
        }, arguments);
      },
      __wbg_now_a3af9a2f4bbaa4d1: function() {
        return Date.now();
      },
      __wbg_now_ebffdf7e580f210d: function(A) {
        return A.now();
      },
      __wbg_postMessage_2041f4e90af61318: function() {
        return w(function(A, I) {
          A.postMessage(I);
        }, arguments);
      },
      __wbg_process_3975fd6c72f520aa: function(A) {
        return A.process;
      },
      __wbg_prototypesetcall_bdcdcc5842e4d77d: function(A, I, Q) {
        Uint8Array.prototype.set.call(H(A, I), Q);
      },
      __wbg_push_8ffdcb2063340ba5: function(A, I) {
        return A.push(I);
      },
      __wbg_queueMicrotask_0aa0a927f78f5d98: function(A) {
        return A.queueMicrotask;
      },
      __wbg_queueMicrotask_5bb536982f78a56f: function(A) {
        queueMicrotask(A);
      },
      __wbg_randomFillSync_f8c153b79f285817: function() {
        return w(function(A, I) {
          A.randomFillSync(I);
        }, arguments);
      },
      __wbg_require_b74f47fc2d022fd6: function() {
        return w(function() {
          return module.require;
        }, arguments);
      },
      __wbg_resolve_002c4b7d9d8f6b64: function(A) {
        return Promise.resolve(A);
      },
      __wbg_setUint32_d168af7751a8557e: function(A, I, Q, g) {
        A.setUint32(I >>> 0, Q >>> 0, g !== 0);
      },
      __wbg_set_0af2522656c2a71b: function() {
        return w(function(A, I, Q) {
          A.set(I >>> 0, Q);
        }, arguments);
      },
      __wbg_set_1eb0999cf5d27fc8: function(A, I, Q) {
        return A.set(I, Q);
      },
      __wbg_set_25cf9deff6bf0ea8: function(A, I, Q) {
        A.set(I, Q >>> 0);
      },
      __wbg_set_3f1d0b984ed272ed: function(A, I, Q) {
        A[I] = Q;
      },
      __wbg_set_6cb8631f80447a67: function() {
        return w(function(A, I, Q) {
          return Reflect.set(A, I, Q);
        }, arguments);
      },
      __wbg_set_cc56eefd2dd91957: function(A, I, Q) {
        A.set(H(I, Q));
      },
      __wbg_set_f43e577aea94465b: function(A, I, Q) {
        A[I >>> 0] = Q;
      },
      __wbg_set_index_b3244a6c458021e4: function(A, I, Q) {
        A[I >>> 0] = Q;
      },
      __wbg_set_index_f259b54e97f7b177: function(A, I, Q) {
        A[I >>> 0] = Q;
      },
      __wbg_set_onmessage_ea7cc2ba099021cd: function(A, I) {
        A.onmessage = I;
      },
      __wbg_set_value_fc06e541de098215: function(A, I) {
        A.value = I;
      },
      __wbg_slice_8bbd46adb2100583: function(A, I, Q) {
        return A.slice(I >>> 0, Q >>> 0);
      },
      __wbg_stack_0ed75d68575b0f3c: function(A, I) {
        const Q = I.stack, g = U(Q, Y.__wbindgen_malloc, Y.__wbindgen_realloc), D = l;
        J().setInt32(A + 4, D, !0), J().setInt32(A + 0, g, !0);
      },
      __wbg_static_accessor_GLOBAL_12837167ad935116: function() {
        const A = typeof global > "u" ? null : global;
        return y(A) ? 0 : m(A);
      },
      __wbg_static_accessor_GLOBAL_THIS_e628e89ab3b1c95f: function() {
        const A = typeof globalThis > "u" ? null : globalThis;
        return y(A) ? 0 : m(A);
      },
      __wbg_static_accessor_SELF_a621d3dfbb60d0ce: function() {
        const A = typeof self > "u" ? null : self;
        return y(A) ? 0 : m(A);
      },
      __wbg_static_accessor_WINDOW_f8727f0cf888e0bd: function() {
        const A = typeof window > "u" ? null : window;
        return y(A) ? 0 : m(A);
      },
      __wbg_store_d1d951c98d9bed41: function() {
        return w(function(A, I, Q) {
          return Atomics.store(A, I >>> 0, Q);
        }, arguments);
      },
      __wbg_subarray_a96e1fef17ed23cb: function(A, I, Q) {
        return A.subarray(I >>> 0, Q >>> 0);
      },
      __wbg_then_0d9fe2c7b1857d32: function(A, I, Q) {
        return A.then(I, Q);
      },
      __wbg_then_b9e7b3b5f1a9e1b5: function(A, I) {
        return A.then(I);
      },
      __wbg_toString_56d946daff83867b: function(A, I, Q) {
        const g = I.toString(Q), D = U(g, Y.__wbindgen_malloc, Y.__wbindgen_realloc), M = l;
        J().setInt32(A + 4, M, !0), J().setInt32(A + 0, D, !0);
      },
      __wbg_toString_964ff7fe6eca8362: function(A) {
        return A.toString();
      },
      __wbg_trap_new: function(A) {
        return p.__wrap(A);
      },
      __wbg_validate_71c2d02a71bda62f: function() {
        return w(function(A) {
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
        return w(function(A, I, Q) {
          return Atomics.wait(A, I >>> 0, Q);
        }, arguments);
      },
      __wbg_warn_81ab00e6e16e886d: function(A, I, Q) {
        console.warn(A, I, Q);
      },
      __wbindgen_cast_0000000000000001: function(A, I) {
        return hA(A, I, Y.wasm_bindgen_9e4ca303acbbbe7a___closure__destroy___dyn_core_37ee0ce0c4cd57d5___ops__function__Fn__web_sys_78b8e98be7a29c4d___features__gen_MessageEvent__MessageEvent____Output_______, FA);
      },
      __wbindgen_cast_0000000000000002: function(A, I) {
        return z(A, I, Y.wasm_bindgen_9e4ca303acbbbe7a___closure__destroy___dyn_core_37ee0ce0c4cd57d5___ops__function__Fn__web_sys_78b8e98be7a29c4d___features__gen_MessageEvent__MessageEvent____Output_______, JA);
      },
      __wbindgen_cast_0000000000000003: function(A, I) {
        return z(A, I, Y.wasm_bindgen_9e4ca303acbbbe7a___closure__destroy___dyn_for__a__core_37ee0ce0c4cd57d5___ops__function__FnMut____a_js_sys_63fabc86795a2ba6___Array____Output___core_37ee0ce0c4cd57d5___result__Result_js_sys_63fabc86795a2ba6___Array__wasm_bindgen_9e4ca303acbbbe7a___JsValue___, u);
      },
      __wbindgen_cast_0000000000000004: function(A, I) {
        return z(A, I, Y.wasm_bindgen_9e4ca303acbbbe7a___closure__destroy___dyn_for__a__core_37ee0ce0c4cd57d5___ops__function__FnMut____a_js_sys_63fabc86795a2ba6___Array____Output___core_37ee0ce0c4cd57d5___result__Result_js_sys_63fabc86795a2ba6___Array__wasm_bindgen_9e4ca303acbbbe7a___JsValue___, u);
      },
      __wbindgen_cast_0000000000000005: function(A, I) {
        return z(A, I, Y.wasm_bindgen_9e4ca303acbbbe7a___closure__destroy___dyn_for__a__core_37ee0ce0c4cd57d5___ops__function__FnMut____a_js_sys_63fabc86795a2ba6___Array____Output___core_37ee0ce0c4cd57d5___result__Result_js_sys_63fabc86795a2ba6___Array__wasm_bindgen_9e4ca303acbbbe7a___JsValue___, iA);
      },
      __wbindgen_cast_0000000000000006: function(A, I) {
        return z(A, I, Y.wasm_bindgen_9e4ca303acbbbe7a___closure__destroy___dyn_core_37ee0ce0c4cd57d5___ops__function__FnMut__wasm_bindgen_9e4ca303acbbbe7a___JsValue____Output_______, ZA);
      },
      __wbindgen_cast_0000000000000007: function(A) {
        return A;
      },
      __wbindgen_cast_0000000000000008: function(A) {
        return A;
      },
      __wbindgen_cast_0000000000000009: function(A, I) {
        return H(A, I);
      },
      __wbindgen_cast_000000000000000a: function(A, I) {
        return j(A, I);
      },
      __wbindgen_cast_000000000000000b: function(A, I) {
        return BigInt.asUintN(64, A) | BigInt.asUintN(64, I) << BigInt(64);
      },
      __wbindgen_cast_000000000000000c: function(A) {
        return BigInt.asUintN(64, A);
      },
      __wbindgen_cast_000000000000000d: function(A, I) {
        var Q = QA(A, I).slice();
        return Y.__wbindgen_free(A, I * 4, 4), Q;
      },
      __wbindgen_init_externref_table: function() {
        const A = Y.__wbindgen_externrefs, I = A.grow(4);
        A.set(0, void 0), A.set(I + 0, void 0), A.set(I + 1, null), A.set(I + 2, !0), A.set(I + 3, !1);
      }
    }
  };
}
function FA(C, A, I) {
  Y.wasm_bindgen_9e4ca303acbbbe7a___convert__closures_____invoke___web_sys_78b8e98be7a29c4d___features__gen_MessageEvent__MessageEvent_____(C, A, I);
}
function JA(C, A, I) {
  Y.wasm_bindgen_9e4ca303acbbbe7a___convert__closures_____invoke___web_sys_78b8e98be7a29c4d___features__gen_MessageEvent__MessageEvent______1_(C, A, I);
}
function ZA(C, A, I) {
  Y.wasm_bindgen_9e4ca303acbbbe7a___convert__closures_____invoke___wasm_bindgen_9e4ca303acbbbe7a___JsValue_____(C, A, I);
}
function iA(C, A, I) {
  const Q = Y.wasm_bindgen_9e4ca303acbbbe7a___convert__closures________invoke___js_sys_63fabc86795a2ba6___Array__core_37ee0ce0c4cd57d5___result__Result_____wasm_bindgen_9e4ca303acbbbe7a___JsValue__(C, A, I);
  if (Q[1])
    throw x(Q[0]);
}
function u(C, A, I) {
  const Q = Y.wasm_bindgen_9e4ca303acbbbe7a___convert__closures________invoke___js_sys_63fabc86795a2ba6___Array__core_37ee0ce0c4cd57d5___result__Result_js_sys_63fabc86795a2ba6___Array__wasm_bindgen_9e4ca303acbbbe7a___JsValue__(C, A, I);
  if (Q[2])
    throw x(Q[1]);
  return x(Q[0]);
}
const r = typeof FinalizationRegistry > "u" ? { register: () => {
}, unregister: () => {
} } : new FinalizationRegistry((C) => Y.__wbg_dapadapter_free(C >>> 0, 1)), _ = typeof FinalizationRegistry > "u" ? { register: () => {
}, unregister: () => {
} } : new FinalizationRegistry((C) => Y.__wbg_trap_free(C >>> 0, 1));
function m(C) {
  const A = Y.__externref_table_alloc();
  return Y.__wbindgen_externrefs.set(A, C), A;
}
const a = typeof FinalizationRegistry > "u" ? { register: () => {
}, unregister: () => {
} } : new FinalizationRegistry((C) => C.dtor(C.a, C.b));
function L(C) {
  const A = typeof C;
  if (A == "number" || A == "boolean" || C == null)
    return `${C}`;
  if (A == "string")
    return `"${C}"`;
  if (A == "symbol") {
    const g = C.description;
    return g == null ? "Symbol" : `Symbol(${g})`;
  }
  if (A == "function") {
    const g = C.name;
    return typeof g == "string" && g.length > 0 ? `Function(${g})` : "Function";
  }
  if (Array.isArray(C)) {
    const g = C.length;
    let D = "[";
    g > 0 && (D += L(C[0]));
    for (let M = 1; M < g; M++)
      D += ", " + L(C[M]);
    return D += "]", D;
  }
  const I = /\[object ([^\]]+)\]/.exec(toString.call(C));
  let Q;
  if (I && I.length > 1)
    Q = I[1];
  else
    return toString.call(C);
  if (Q == "Object")
    try {
      return "Object(" + JSON.stringify(C) + ")";
    } catch {
      return "Object";
    }
  return C instanceof Error ? `${C.name}: ${C.message}
${C.stack}` : Q;
}
function QA(C, A) {
  C = C >>> 0;
  const I = J(), Q = [];
  for (let g = C; g < C + 4 * A; g += 4)
    Q.push(Y.__wbindgen_externrefs.get(I.getUint32(g, !0)));
  return Y.__externref_drop_slice(C, A), Q;
}
function H(C, A) {
  return C = C >>> 0, b().subarray(C / 1, C / 1 + A);
}
let X = null;
function J() {
  return (X === null || X.buffer.detached === !0 || X.buffer.detached === void 0 && X.buffer !== Y.memory.buffer) && (X = new DataView(Y.memory.buffer)), X;
}
function j(C, A) {
  return C = C >>> 0, yA(C, A);
}
let W = null;
function b() {
  return (W === null || W.byteLength === 0) && (W = new Uint8Array(Y.memory.buffer)), W;
}
function w(C, A) {
  try {
    return C.apply(this, A);
  } catch (I) {
    const Q = m(I);
    Y.__wbindgen_exn_store(Q);
  }
}
function y(C) {
  return C == null;
}
function hA(C, A, I, Q) {
  const g = { a: C, b: A, cnt: 1, dtor: I }, D = (...M) => {
    g.cnt++;
    try {
      return Q(g.a, g.b, ...M);
    } finally {
      D._wbg_cb_unref();
    }
  };
  return D._wbg_cb_unref = () => {
    --g.cnt === 0 && (g.dtor(g.a, g.b), g.a = 0, a.unregister(g));
  }, a.register(D, g, g), D;
}
function z(C, A, I, Q) {
  const g = { a: C, b: A, cnt: 1, dtor: I }, D = (...M) => {
    g.cnt++;
    const o = g.a;
    g.a = 0;
    try {
      return Q(o, g.b, ...M);
    } finally {
      g.a = o, D._wbg_cb_unref();
    }
  };
  return D._wbg_cb_unref = () => {
    --g.cnt === 0 && (g.dtor(g.a, g.b), g.a = 0, a.unregister(g));
  }, a.register(D, g, g), D;
}
function U(C, A, I) {
  if (I === void 0) {
    const o = V.encode(C), Z = A(o.length, 1) >>> 0;
    return b().subarray(Z, Z + o.length).set(o), l = o.length, Z;
  }
  let Q = C.length, g = A(Q, 1) >>> 0;
  const D = b();
  let M = 0;
  for (; M < Q; M++) {
    const o = C.charCodeAt(M);
    if (o > 127) break;
    D[g + M] = o;
  }
  if (M !== Q) {
    M !== 0 && (C = C.slice(M)), g = I(g, Q, Q = M + C.length * 3, 1) >>> 0;
    const o = b().subarray(g + M, g + Q), Z = V.encodeInto(C, o);
    M += Z.written, g = I(g, Q, M, 1) >>> 0;
  }
  return l = M, g;
}
function x(C) {
  const A = Y.__wbindgen_externrefs.get(C);
  return Y.__externref_table_dealloc(C), A;
}
let T = new TextDecoder("utf-8", { ignoreBOM: !0, fatal: !0 });
T.decode();
const jA = 2146435072;
let s = 0;
function yA(C, A) {
  return s += A, s >= jA && (T = new TextDecoder("utf-8", { ignoreBOM: !0, fatal: !0 }), T.decode(), s = A), T.decode(b().subarray(C, C + A));
}
const V = new TextEncoder();
"encodeInto" in V || (V.encodeInto = function(C, A) {
  const I = V.encode(C);
  return A.set(I), {
    read: C.length,
    written: I.length
  };
});
let l = 0, Y;
function RA(C, A) {
  return Y = C.exports, X = null, W = null, Y.__wbindgen_start(), Y;
}
async function lA(C, A) {
  if (typeof Response == "function" && C instanceof Response) {
    if (typeof WebAssembly.instantiateStreaming == "function")
      try {
        return await WebAssembly.instantiateStreaming(C, A);
      } catch (g) {
        if (C.ok && I(C.type) && C.headers.get("Content-Type") !== "application/wasm")
          console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve Wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n", g);
        else
          throw g;
      }
    const Q = await C.arrayBuffer();
    return await WebAssembly.instantiate(Q, A);
  } else {
    const Q = await WebAssembly.instantiate(C, A);
    return Q instanceof WebAssembly.Instance ? { instance: Q, module: C } : Q;
  }
  function I(Q) {
    switch (Q) {
      case "basic":
      case "cors":
      case "default":
        return !0;
    }
    return !1;
  }
}
async function XA(C) {
  if (Y !== void 0) return Y;
  C !== void 0 && (Object.getPrototypeOf(C) === Object.prototype ? { module_or_path: C } = C : console.warn("using deprecated parameters for the initialization function; pass a single object instead")), C === void 0 && (C = new URL("", import.meta.url));
  const A = oA();
  (typeof C == "string" || typeof Request == "function" && C instanceof Request || typeof URL == "function" && C instanceof URL) && (C = fetch(C));
  const { instance: I, module: Q } = await lA(await C, A);
  return RA(I);
}
const dA = new URL("http://localhost:20233/debugger/engine_bg.wasm"), i = /* @__PURE__ */ Symbol();
function UA(C) {
  return C instanceof Error ? {
    type: "error",
    error: { type: C.constructor.name, message: C.message }
  } : {
    type: "error",
    error: { type: typeof C, message: String(C) }
  };
}
class OA {
  name;
  data;
  constructor(A, I) {
    this.name = A, this.data = I;
  }
  download() {
    const A = new Uint8Array(this.data), I = new Blob([A]), Q = URL.createObjectURL(I), g = document.createElement("a");
    g.href = Q, g.download = this.name, document.body.appendChild(g), g.click(), document.body.removeChild(g), URL.revokeObjectURL(Q);
  }
}
class zA extends IA {
  /**
   * Access to internal properties of the debugger.
   * These are put under a special symbol so that they cannot be accessed by
   * clients of the library.
   */
  [i];
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
    super(), this[i] = {
      attach: this.attach.bind(this)
    }, this.onMessage = this.onMessage.bind(this), this.dap = new S(), this.dap.on(this.onMessage);
  }
  send(A) {
    return this.dap.sendMessage(A);
  }
  attach(A) {
    A.addEventListener("message", (I) => {
      if (I.data.type !== "artifact") return;
      const Q = new OA(I.data.name, new Uint8Array(I.data.data));
      this.emit("artifact", Q);
    }), this.dap.attach(A);
  }
  onMessage(A) {
    this.emit("event", A);
  }
}
const gA = `class y {
  static __wrap(A) {
    A = A >>> 0;
    const I = Object.create(y.prototype);
    return I.__wbg_ptr = A, m.register(I, I.__wbg_ptr, I), I;
  }
  __destroy_into_raw() {
    const A = this.__wbg_ptr;
    return this.__wbg_ptr = 0, m.unregister(this), A;
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
Symbol.dispose && (y.prototype[Symbol.dispose] = y.prototype.free);
function W() {
  B.main();
}
function b() {
  return {
    __proto__: null,
    "./engine_bg.js": {
      __proto__: null,
      __wbg_BigInt_b7bbccdff258c9f2: function(A) {
        return BigInt(A);
      },
      __wbg_Error_8c4e43fe74559d73: function(A, I) {
        return Error(M(A, I));
      },
      __wbg_Number_04624de7d0e8332d: function(A) {
        return Number(A);
      },
      __wbg_String_8f0eb39a4a4c2f66: function(A, I) {
        const Q = String(I), g = J(Q, B.__wbindgen_malloc, B.__wbindgen_realloc), E = w;
        Y().setInt32(A + 4, E, !0), Y().setInt32(A + 0, g, !0);
      },
      __wbg___wbindgen_bigint_get_as_i64_8fcf4ce7f1ca72a2: function(A, I) {
        const Q = I, g = typeof Q == "bigint" ? Q : void 0;
        Y().setBigInt64(A + 8, G(g) ? BigInt(0) : g, !0), Y().setInt32(A + 0, !G(g), !0);
      },
      __wbg___wbindgen_boolean_get_bbbb1c18aa2f5e25: function(A) {
        const I = A, Q = typeof I == "boolean" ? I : void 0;
        return G(Q) ? 16777215 : Q ? 1 : 0;
      },
      __wbg___wbindgen_debug_string_0bc8482c6e3508ae: function(A, I) {
        const Q = U(I), g = J(Q, B.__wbindgen_malloc, B.__wbindgen_realloc), E = w;
        Y().setInt32(A + 4, E, !0), Y().setInt32(A + 0, g, !0);
      },
      __wbg___wbindgen_function_table_5ae7216dfcbcc506: function() {
        return B.__wbindgen_export;
      },
      __wbg___wbindgen_in_47fa6863be6f2f25: function(A, I) {
        return A in I;
      },
      __wbg___wbindgen_is_bigint_31b12575b56f32fc: function(A) {
        return typeof A == "bigint";
      },
      __wbg___wbindgen_is_function_0095a73b8b156f76: function(A) {
        return typeof A == "function";
      },
      __wbg___wbindgen_is_object_5ae8e5880f2c1fbd: function(A) {
        const I = A;
        return typeof I == "object" && I !== null;
      },
      __wbg___wbindgen_is_string_cd444516edc5b180: function(A) {
        return typeof A == "string";
      },
      __wbg___wbindgen_is_undefined_9e4d92534c42d778: function(A) {
        return A === void 0;
      },
      __wbg___wbindgen_jsval_eq_11888390b0186270: function(A, I) {
        return A === I;
      },
      __wbg___wbindgen_jsval_loose_eq_9dd77d8cd6671811: function(A, I) {
        return A == I;
      },
      __wbg___wbindgen_lt_bb59cc3d23526e0d: function(A, I) {
        return A < I;
      },
      __wbg___wbindgen_neg_6b4d356dff49dcc6: function(A) {
        return -A;
      },
      __wbg___wbindgen_number_get_8ff4255516ccad3e: function(A, I) {
        const Q = I, g = typeof Q == "number" ? Q : void 0;
        Y().setFloat64(A + 8, G(g) ? 0 : g, !0), Y().setInt32(A + 0, !G(g), !0);
      },
      __wbg___wbindgen_rethrow_05525c567f154472: function(A) {
        throw A;
      },
      __wbg___wbindgen_shr_ef8e07cce709eb54: function(A, I) {
        return A >> I;
      },
      __wbg___wbindgen_string_get_72fb696202c56729: function(A, I) {
        const Q = I, g = typeof Q == "string" ? Q : void 0;
        var E = G(g) ? 0 : J(g, B.__wbindgen_malloc, B.__wbindgen_realloc), D = w;
        Y().setInt32(A + 4, D, !0), Y().setInt32(A + 0, E, !0);
      },
      __wbg___wbindgen_throw_be289d5034ed271b: function(A, I) {
        throw new Error(M(A, I));
      },
      __wbg__wbg_cb_unref_d9b87ff7982e3b21: function(A) {
        A._wbg_cb_unref();
      },
      __wbg_addEventListener_3acb0aad4483804c: function() {
        return N(function(A, I, Q, g) {
          A.addEventListener(M(I, Q), g);
        }, arguments);
      },
      __wbg_apply_2e22c45cb4f12415: function() {
        return N(function(A, I, Q) {
          return Reflect.apply(A, I, Q);
        }, arguments);
      },
      __wbg_apply_ada2ee1a60ac7b3c: function() {
        return N(function(A, I, Q) {
          return A.apply(I, Q);
        }, arguments);
      },
      __wbg_arrayBuffer_bb54076166006c39: function() {
        return N(function(A) {
          return A.arrayBuffer();
        }, arguments);
      },
      __wbg_bind_1dc37de2b9939128: function(A, I, Q, g) {
        return A.bind(I, Q, g);
      },
      __wbg_bind_29ba380591735d8c: function(A, I, Q) {
        return A.bind(I, Q);
      },
      __wbg_buffer_7b5f53e46557d8f1: function(A) {
        return A.buffer;
      },
      __wbg_byteLength_7b03c17ff1e4037f: function(A) {
        return A.byteLength;
      },
      __wbg_call_389efe28435a9388: function() {
        return N(function(A, I) {
          return A.call(I);
        }, arguments);
      },
      __wbg_call_4708e0c13bdc8e95: function() {
        return N(function(A, I, Q) {
          return A.call(I, Q);
        }, arguments);
      },
      __wbg_constructor_ad6c0ed428f55d34: function(A) {
        return A.constructor;
      },
      __wbg_crypto_86f2631e91b51511: function(A) {
        return A.crypto;
      },
      __wbg_customSections_193491b069139fb1: function(A, I, Q) {
        return WebAssembly.Module.customSections(A, M(I, Q));
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
      __wbg_error_7534b8e9a36f1ab4: function(A, I) {
        let Q, g;
        try {
          Q = A, g = I, console.error(M(A, I));
        } finally {
          B.__wbindgen_free(Q, g, 1);
        }
      },
      __wbg_exports_794a42000dacd046: function(A) {
        return WebAssembly.Module.exports(A);
      },
      __wbg_exports_86b4926134c40288: function(A) {
        return A.exports;
      },
      __wbg_fetch_d1488f40cef1e210: function(A, I, Q) {
        return A.fetch(M(I, Q));
      },
      __wbg_from_bddd64e7d5ff6941: function(A) {
        return Array.from(A);
      },
      __wbg_getPrototypeOf_2653517f1dc884d5: function() {
        return N(function(A) {
          return Reflect.getPrototypeOf(A);
        }, arguments);
      },
      __wbg_getRandomValues_b3f15fcbfabb0f8b: function() {
        return N(function(A, I) {
          A.getRandomValues(I);
        }, arguments);
      },
      __wbg_getTime_1e3cd1391c5c3995: function(A) {
        return A.getTime();
      },
      __wbg_getTimezoneOffset_81776d10a4ec18a8: function(A) {
        return A.getTimezoneOffset();
      },
      __wbg_getUint32_bb6f5a401408e7fa: function(A, I, Q) {
        return A.getUint32(I >>> 0, Q !== 0);
      },
      __wbg_get_7efbcc3819719b0f: function() {
        return N(function(A, I) {
          return A.get(I >>> 0);
        }, arguments);
      },
      __wbg_get_9b94d73e6221f75c: function(A, I) {
        return A[I >>> 0];
      },
      __wbg_get_b3ed3ad4be2bc8ac: function() {
        return N(function(A, I) {
          return Reflect.get(A, I);
        }, arguments);
      },
      __wbg_get_index_253dd2a9e007656d: function(A, I) {
        return A[I >>> 0];
      },
      __wbg_get_index_9a5bfdd2ca49c65f: function(A, I) {
        return A[I >>> 0];
      },
      __wbg_get_with_ref_key_1dc361bd10053bfe: function(A, I) {
        return A[I];
      },
      __wbg_grow_5d42bf28c2da22cb: function() {
        return N(function(A, I) {
          return A.grow(I >>> 0);
        }, arguments);
      },
      __wbg_grow_d034989fce14cc8e: function() {
        return N(function(A, I) {
          return A.grow(I >>> 0);
        }, arguments);
      },
      __wbg_imports_8333d40ab24779ad: function(A) {
        return WebAssembly.Module.imports(A);
      },
      __wbg_instanceof_ArrayBuffer_c367199e2fa2aa04: function(A) {
        let I;
        try {
          I = A instanceof ArrayBuffer;
        } catch {
          I = !1;
        }
        return I;
      },
      __wbg_instanceof_Error_8573fe0b0b480f46: function(A) {
        let I;
        try {
          I = A instanceof Error;
        } catch {
          I = !1;
        }
        return I;
      },
      __wbg_instanceof_Function_2a29eec978bb3b11: function(A) {
        let I;
        try {
          I = A instanceof Function;
        } catch {
          I = !1;
        }
        return I;
      },
      __wbg_instanceof_Global_2db767b6b2347f01: function(A) {
        let I;
        try {
          I = A instanceof WebAssembly.Global;
        } catch {
          I = !1;
        }
        return I;
      },
      __wbg_instanceof_Map_53af74335dec57f4: function(A) {
        let I;
        try {
          I = A instanceof Map;
        } catch {
          I = !1;
        }
        return I;
      },
      __wbg_instanceof_Memory_dc8c61e3f831ee37: function(A) {
        let I;
        try {
          I = A instanceof WebAssembly.Memory;
        } catch {
          I = !1;
        }
        return I;
      },
      __wbg_instanceof_Object_1c6af87502b733ed: function(A) {
        let I;
        try {
          I = A instanceof Object;
        } catch {
          I = !1;
        }
        return I;
      },
      __wbg_instanceof_RangeError_0b0dd056bc557b89: function(A) {
        let I;
        try {
          I = A instanceof RangeError;
        } catch {
          I = !1;
        }
        return I;
      },
      __wbg_instanceof_Response_ee1d54d79ae41977: function(A) {
        let I;
        try {
          I = A instanceof Response;
        } catch {
          I = !1;
        }
        return I;
      },
      __wbg_instanceof_SharedArrayBuffer_91d8a2fa16a2cc26: function(A) {
        let I;
        try {
          I = A instanceof SharedArrayBuffer;
        } catch {
          I = !1;
        }
        return I;
      },
      __wbg_instanceof_Table_127f216e592f4159: function(A) {
        let I;
        try {
          I = A instanceof WebAssembly.Table;
        } catch {
          I = !1;
        }
        return I;
      },
      __wbg_instanceof_Tag_f1d6b24a98b95210: function(A) {
        let I;
        try {
          I = A instanceof WebAssembly.Tag;
        } catch {
          I = !1;
        }
        return I;
      },
      __wbg_instanceof_Uint8Array_9b9075935c74707c: function(A) {
        let I;
        try {
          I = A instanceof Uint8Array;
        } catch {
          I = !1;
        }
        return I;
      },
      __wbg_isArray_d314bb98fcf08331: function(A) {
        return Array.isArray(A);
      },
      __wbg_isSafeInteger_bfbc7332a9768d2a: function(A) {
        return Number.isSafeInteger(A);
      },
      __wbg_is_f29129f676e5410c: function(A, I) {
        return Object.is(A, I);
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
        return N(function(A, I) {
          return Atomics.load(A, I >>> 0);
        }, arguments);
      },
      __wbg_message_9ddc4b9a62a7c379: function(A) {
        return A.message;
      },
      __wbg_msCrypto_d562bbe83e0d4b91: function(A) {
        return A.msCrypto;
      },
      __wbg_new_0728bd2d4c5d41dd: function() {
        return N(function(A) {
          return new WebAssembly.Tag(A);
        }, arguments);
      },
      __wbg_new_0_73afc35eb544e539: function() {
        return /* @__PURE__ */ new Date();
      },
      __wbg_new_245cd5c49157e602: function(A) {
        return new Date(A);
      },
      __wbg_new_2ac7fa8be584d280: function(A, I, Q) {
        return new DataView(A, I >>> 0, Q >>> 0);
      },
      __wbg_new_361308b2356cecd0: function() {
        return new Object();
      },
      __wbg_new_3eb36ae241fe6f44: function() {
        return new Array();
      },
      __wbg_new_4a996a46a82782b6: function() {
        return N(function(A, I) {
          return new WebAssembly.Global(A, I);
        }, arguments);
      },
      __wbg_new_57c27ff3ddf5b62c: function() {
        return N(function(A) {
          return new WebAssembly.Module(A);
        }, arguments);
      },
      __wbg_new_67274f72d5abea37: function() {
        return N(function(A) {
          return new WebAssembly.Table(A);
        }, arguments);
      },
      __wbg_new_8a6f238a6ece86ea: function() {
        return new Error();
      },
      __wbg_new_a4e3cab1cdd635ba: function() {
        return N(function(A, I) {
          return new WebAssembly.Instance(A, I);
        }, arguments);
      },
      __wbg_new_b061c0550d9f3281: function() {
        return N(function(A) {
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
      __wbg_new_from_slice_a3d2629dc1826784: function(A, I) {
        return new Uint8Array(R(A, I));
      },
      __wbg_new_no_args_1c7c842f08d00ebb: function(A, I) {
        return new Function(M(A, I));
      },
      __wbg_new_with_args_7bba34e94b1cfa40: function(A, I, Q, g) {
        return new Function(M(A, I), M(Q, g));
      },
      __wbg_new_with_byte_offset_9120ba79e057895b: function(A, I) {
        return new Uint8Array(A, I >>> 0);
      },
      __wbg_new_with_byte_offset_and_length_aa261d9c9da49eb1: function(A, I, Q) {
        return new Uint8Array(A, I >>> 0, Q >>> 0);
      },
      __wbg_new_with_byte_offset_and_length_bc2e7b72cc96d1c1: function(A, I, Q) {
        return new Int32Array(A, I >>> 0, Q >>> 0);
      },
      __wbg_new_with_length_1763c527b2923202: function(A) {
        return new Array(A >>> 0);
      },
      __wbg_new_with_length_a2c39cbe88fd8ff1: function(A) {
        return new Uint8Array(A >>> 0);
      },
      __wbg_next_3482f54c49e8af19: function() {
        return N(function(A) {
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
        return N(function(A, I) {
          return Atomics.notify(A, I >>> 0);
        }, arguments);
      },
      __wbg_now_a3af9a2f4bbaa4d1: function() {
        return Date.now();
      },
      __wbg_now_ebffdf7e580f210d: function(A) {
        return A.now();
      },
      __wbg_postMessage_2041f4e90af61318: function() {
        return N(function(A, I) {
          A.postMessage(I);
        }, arguments);
      },
      __wbg_process_3975fd6c72f520aa: function(A) {
        return A.process;
      },
      __wbg_prototypesetcall_bdcdcc5842e4d77d: function(A, I, Q) {
        Uint8Array.prototype.set.call(R(A, I), Q);
      },
      __wbg_push_8ffdcb2063340ba5: function(A, I) {
        return A.push(I);
      },
      __wbg_queueMicrotask_0aa0a927f78f5d98: function(A) {
        return A.queueMicrotask;
      },
      __wbg_queueMicrotask_5bb536982f78a56f: function(A) {
        queueMicrotask(A);
      },
      __wbg_randomFillSync_f8c153b79f285817: function() {
        return N(function(A, I) {
          A.randomFillSync(I);
        }, arguments);
      },
      __wbg_require_b74f47fc2d022fd6: function() {
        return N(function() {
          return module.require;
        }, arguments);
      },
      __wbg_resolve_002c4b7d9d8f6b64: function(A) {
        return Promise.resolve(A);
      },
      __wbg_setUint32_d168af7751a8557e: function(A, I, Q, g) {
        A.setUint32(I >>> 0, Q >>> 0, g !== 0);
      },
      __wbg_set_0af2522656c2a71b: function() {
        return N(function(A, I, Q) {
          A.set(I >>> 0, Q);
        }, arguments);
      },
      __wbg_set_1eb0999cf5d27fc8: function(A, I, Q) {
        return A.set(I, Q);
      },
      __wbg_set_25cf9deff6bf0ea8: function(A, I, Q) {
        A.set(I, Q >>> 0);
      },
      __wbg_set_3f1d0b984ed272ed: function(A, I, Q) {
        A[I] = Q;
      },
      __wbg_set_6cb8631f80447a67: function() {
        return N(function(A, I, Q) {
          return Reflect.set(A, I, Q);
        }, arguments);
      },
      __wbg_set_cc56eefd2dd91957: function(A, I, Q) {
        A.set(R(I, Q));
      },
      __wbg_set_f43e577aea94465b: function(A, I, Q) {
        A[I >>> 0] = Q;
      },
      __wbg_set_index_b3244a6c458021e4: function(A, I, Q) {
        A[I >>> 0] = Q;
      },
      __wbg_set_index_f259b54e97f7b177: function(A, I, Q) {
        A[I >>> 0] = Q;
      },
      __wbg_set_onmessage_ea7cc2ba099021cd: function(A, I) {
        A.onmessage = I;
      },
      __wbg_set_value_fc06e541de098215: function(A, I) {
        A.value = I;
      },
      __wbg_slice_8bbd46adb2100583: function(A, I, Q) {
        return A.slice(I >>> 0, Q >>> 0);
      },
      __wbg_stack_0ed75d68575b0f3c: function(A, I) {
        const Q = I.stack, g = J(Q, B.__wbindgen_malloc, B.__wbindgen_realloc), E = w;
        Y().setInt32(A + 4, E, !0), Y().setInt32(A + 0, g, !0);
      },
      __wbg_static_accessor_GLOBAL_12837167ad935116: function() {
        const A = typeof global > "u" ? null : global;
        return G(A) ? 0 : Z(A);
      },
      __wbg_static_accessor_GLOBAL_THIS_e628e89ab3b1c95f: function() {
        const A = typeof globalThis > "u" ? null : globalThis;
        return G(A) ? 0 : Z(A);
      },
      __wbg_static_accessor_SELF_a621d3dfbb60d0ce: function() {
        const A = typeof self > "u" ? null : self;
        return G(A) ? 0 : Z(A);
      },
      __wbg_static_accessor_WINDOW_f8727f0cf888e0bd: function() {
        const A = typeof window > "u" ? null : window;
        return G(A) ? 0 : Z(A);
      },
      __wbg_store_d1d951c98d9bed41: function() {
        return N(function(A, I, Q) {
          return Atomics.store(A, I >>> 0, Q);
        }, arguments);
      },
      __wbg_subarray_a96e1fef17ed23cb: function(A, I, Q) {
        return A.subarray(I >>> 0, Q >>> 0);
      },
      __wbg_then_0d9fe2c7b1857d32: function(A, I, Q) {
        return A.then(I, Q);
      },
      __wbg_then_b9e7b3b5f1a9e1b5: function(A, I) {
        return A.then(I);
      },
      __wbg_toString_56d946daff83867b: function(A, I, Q) {
        const g = I.toString(Q), E = J(g, B.__wbindgen_malloc, B.__wbindgen_realloc), D = w;
        Y().setInt32(A + 4, D, !0), Y().setInt32(A + 0, E, !0);
      },
      __wbg_toString_964ff7fe6eca8362: function(A) {
        return A.toString();
      },
      __wbg_trap_new: function(A) {
        return y.__wrap(A);
      },
      __wbg_validate_71c2d02a71bda62f: function() {
        return N(function(A) {
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
        return N(function(A, I, Q) {
          return Atomics.wait(A, I >>> 0, Q);
        }, arguments);
      },
      __wbg_warn_81ab00e6e16e886d: function(A, I, Q) {
        console.warn(A, I, Q);
      },
      __wbindgen_cast_0000000000000001: function(A, I) {
        return a(A, I, B.wasm_bindgen_9e4ca303acbbbe7a___closure__destroy___dyn_core_37ee0ce0c4cd57d5___ops__function__Fn__web_sys_78b8e98be7a29c4d___features__gen_MessageEvent__MessageEvent____Output_______, V);
      },
      __wbindgen_cast_0000000000000002: function(A, I) {
        return F(A, I, B.wasm_bindgen_9e4ca303acbbbe7a___closure__destroy___dyn_core_37ee0ce0c4cd57d5___ops__function__Fn__web_sys_78b8e98be7a29c4d___features__gen_MessageEvent__MessageEvent____Output_______, p);
      },
      __wbindgen_cast_0000000000000003: function(A, I) {
        return F(A, I, B.wasm_bindgen_9e4ca303acbbbe7a___closure__destroy___dyn_for__a__core_37ee0ce0c4cd57d5___ops__function__FnMut____a_js_sys_63fabc86795a2ba6___Array____Output___core_37ee0ce0c4cd57d5___result__Result_js_sys_63fabc86795a2ba6___Array__wasm_bindgen_9e4ca303acbbbe7a___JsValue___, z);
      },
      __wbindgen_cast_0000000000000004: function(A, I) {
        return F(A, I, B.wasm_bindgen_9e4ca303acbbbe7a___closure__destroy___dyn_for__a__core_37ee0ce0c4cd57d5___ops__function__FnMut____a_js_sys_63fabc86795a2ba6___Array____Output___core_37ee0ce0c4cd57d5___result__Result_js_sys_63fabc86795a2ba6___Array__wasm_bindgen_9e4ca303acbbbe7a___JsValue___, z);
      },
      __wbindgen_cast_0000000000000005: function(A, I) {
        return F(A, I, B.wasm_bindgen_9e4ca303acbbbe7a___closure__destroy___dyn_for__a__core_37ee0ce0c4cd57d5___ops__function__FnMut____a_js_sys_63fabc86795a2ba6___Array____Output___core_37ee0ce0c4cd57d5___result__Result_js_sys_63fabc86795a2ba6___Array__wasm_bindgen_9e4ca303acbbbe7a___JsValue___, H);
      },
      __wbindgen_cast_0000000000000006: function(A, I) {
        return F(A, I, B.wasm_bindgen_9e4ca303acbbbe7a___closure__destroy___dyn_core_37ee0ce0c4cd57d5___ops__function__FnMut__wasm_bindgen_9e4ca303acbbbe7a___JsValue____Output_______, K);
      },
      __wbindgen_cast_0000000000000007: function(A) {
        return A;
      },
      __wbindgen_cast_0000000000000008: function(A) {
        return A;
      },
      __wbindgen_cast_0000000000000009: function(A, I) {
        return R(A, I);
      },
      __wbindgen_cast_000000000000000a: function(A, I) {
        return M(A, I);
      },
      __wbindgen_cast_000000000000000b: function(A, I) {
        return BigInt.asUintN(64, A) | BigInt.asUintN(64, I) << BigInt(64);
      },
      __wbindgen_cast_000000000000000c: function(A) {
        return BigInt.asUintN(64, A);
      },
      __wbindgen_cast_000000000000000d: function(A, I) {
        var Q = T(A, I).slice();
        return B.__wbindgen_free(A, I * 4, 4), Q;
      },
      __wbindgen_init_externref_table: function() {
        const A = B.__wbindgen_externrefs, I = A.grow(4);
        A.set(0, void 0), A.set(I + 0, void 0), A.set(I + 1, null), A.set(I + 2, !0), A.set(I + 3, !1);
      }
    }
  };
}
function V(C, A, I) {
  B.wasm_bindgen_9e4ca303acbbbe7a___convert__closures_____invoke___web_sys_78b8e98be7a29c4d___features__gen_MessageEvent__MessageEvent_____(C, A, I);
}
function p(C, A, I) {
  B.wasm_bindgen_9e4ca303acbbbe7a___convert__closures_____invoke___web_sys_78b8e98be7a29c4d___features__gen_MessageEvent__MessageEvent______1_(C, A, I);
}
function K(C, A, I) {
  B.wasm_bindgen_9e4ca303acbbbe7a___convert__closures_____invoke___wasm_bindgen_9e4ca303acbbbe7a___JsValue_____(C, A, I);
}
function H(C, A, I) {
  const Q = B.wasm_bindgen_9e4ca303acbbbe7a___convert__closures________invoke___js_sys_63fabc86795a2ba6___Array__core_37ee0ce0c4cd57d5___result__Result_____wasm_bindgen_9e4ca303acbbbe7a___JsValue__(C, A, I);
  if (Q[1])
    throw O(Q[0]);
}
function z(C, A, I) {
  const Q = B.wasm_bindgen_9e4ca303acbbbe7a___convert__closures________invoke___js_sys_63fabc86795a2ba6___Array__core_37ee0ce0c4cd57d5___result__Result_js_sys_63fabc86795a2ba6___Array__wasm_bindgen_9e4ca303acbbbe7a___JsValue__(C, A, I);
  if (Q[2])
    throw O(Q[1]);
  return O(Q[0]);
}
typeof FinalizationRegistry > "u" || new FinalizationRegistry((C) => B.__wbg_dapadapter_free(C >>> 0, 1));
const m = typeof FinalizationRegistry > "u" ? { register: () => {
}, unregister: () => {
} } : new FinalizationRegistry((C) => B.__wbg_trap_free(C >>> 0, 1));
function Z(C) {
  const A = B.__externref_table_alloc();
  return B.__wbindgen_externrefs.set(A, C), A;
}
const X = typeof FinalizationRegistry > "u" ? { register: () => {
}, unregister: () => {
} } : new FinalizationRegistry((C) => C.dtor(C.a, C.b));
function U(C) {
  const A = typeof C;
  if (A == "number" || A == "boolean" || C == null)
    return \`\${C}\`;
  if (A == "string")
    return \`"\${C}"\`;
  if (A == "symbol") {
    const g = C.description;
    return g == null ? "Symbol" : \`Symbol(\${g})\`;
  }
  if (A == "function") {
    const g = C.name;
    return typeof g == "string" && g.length > 0 ? \`Function(\${g})\` : "Function";
  }
  if (Array.isArray(C)) {
    const g = C.length;
    let E = "[";
    g > 0 && (E += U(C[0]));
    for (let D = 1; D < g; D++)
      E += ", " + U(C[D]);
    return E += "]", E;
  }
  const I = /\\[object ([^\\]]+)\\]/.exec(toString.call(C));
  let Q;
  if (I && I.length > 1)
    Q = I[1];
  else
    return toString.call(C);
  if (Q == "Object")
    try {
      return "Object(" + JSON.stringify(C) + ")";
    } catch {
      return "Object";
    }
  return C instanceof Error ? \`\${C.name}: \${C.message}
\${C.stack}\` : Q;
}
function T(C, A) {
  C = C >>> 0;
  const I = Y(), Q = [];
  for (let g = C; g < C + 4 * A; g += 4)
    Q.push(B.__wbindgen_externrefs.get(I.getUint32(g, !0)));
  return B.__externref_drop_slice(C, A), Q;
}
function R(C, A) {
  return C = C >>> 0, h().subarray(C / 1, C / 1 + A);
}
let k = null;
function Y() {
  return (k === null || k.buffer.detached === !0 || k.buffer.detached === void 0 && k.buffer !== B.memory.buffer) && (k = new DataView(B.memory.buffer)), k;
}
function M(C, A) {
  return C = C >>> 0, S(C, A);
}
let i = null;
function h() {
  return (i === null || i.byteLength === 0) && (i = new Uint8Array(B.memory.buffer)), i;
}
function N(C, A) {
  try {
    return C.apply(this, A);
  } catch (I) {
    const Q = Z(I);
    B.__wbindgen_exn_store(Q);
  }
}
function G(C) {
  return C == null;
}
function a(C, A, I, Q) {
  const g = { a: C, b: A, cnt: 1, dtor: I }, E = (...D) => {
    g.cnt++;
    try {
      return Q(g.a, g.b, ...D);
    } finally {
      E._wbg_cb_unref();
    }
  };
  return E._wbg_cb_unref = () => {
    --g.cnt === 0 && (g.dtor(g.a, g.b), g.a = 0, X.unregister(g));
  }, X.register(E, g, g), E;
}
function F(C, A, I, Q) {
  const g = { a: C, b: A, cnt: 1, dtor: I }, E = (...D) => {
    g.cnt++;
    const c = g.a;
    g.a = 0;
    try {
      return Q(c, g.b, ...D);
    } finally {
      g.a = c, E._wbg_cb_unref();
    }
  };
  return E._wbg_cb_unref = () => {
    --g.cnt === 0 && (g.dtor(g.a, g.b), g.a = 0, X.unregister(g));
  }, X.register(E, g, g), E;
}
function J(C, A, I) {
  if (I === void 0) {
    const c = j.encode(C), o = A(c.length, 1) >>> 0;
    return h().subarray(o, o + c.length).set(c), w = c.length, o;
  }
  let Q = C.length, g = A(Q, 1) >>> 0;
  const E = h();
  let D = 0;
  for (; D < Q; D++) {
    const c = C.charCodeAt(D);
    if (c > 127) break;
    E[g + D] = c;
  }
  if (D !== Q) {
    D !== 0 && (C = C.slice(D)), g = I(g, Q, Q = D + C.length * 3, 1) >>> 0;
    const c = h().subarray(g + D, g + Q), o = j.encodeInto(C, c);
    D += o.written, g = I(g, Q, D, 1) >>> 0;
  }
  return w = D, g;
}
function O(C) {
  const A = B.__wbindgen_externrefs.get(C);
  return B.__externref_table_dealloc(C), A;
}
let l = new TextDecoder("utf-8", { ignoreBOM: !0, fatal: !0 });
l.decode();
const s = 2146435072;
let d = 0;
function S(C, A) {
  return d += A, d >= s && (l = new TextDecoder("utf-8", { ignoreBOM: !0, fatal: !0 }), l.decode(), d = A), l.decode(h().subarray(C, C + A));
}
const j = new TextEncoder();
"encodeInto" in j || (j.encodeInto = function(C, A) {
  const I = j.encode(C);
  return A.set(I), {
    read: C.length,
    written: I.length
  };
});
let w = 0, B;
function L(C, A) {
  return B = C.exports, k = null, i = null, B.__wbindgen_start(), B;
}
async function x(C, A) {
  if (typeof Response == "function" && C instanceof Response) {
    if (typeof WebAssembly.instantiateStreaming == "function")
      try {
        return await WebAssembly.instantiateStreaming(C, A);
      } catch (g) {
        if (C.ok && I(C.type) && C.headers.get("Content-Type") !== "application/wasm")
          console.warn("\`WebAssembly.instantiateStreaming\` failed because your server does not serve Wasm with \`application/wasm\` MIME type. Falling back to \`WebAssembly.instantiate\` which is slower. Original error:\\n", g);
        else
          throw g;
      }
    const Q = await C.arrayBuffer();
    return await WebAssembly.instantiate(Q, A);
  } else {
    const Q = await WebAssembly.instantiate(C, A);
    return Q instanceof WebAssembly.Instance ? { instance: Q, module: C } : Q;
  }
  function I(Q) {
    switch (Q) {
      case "basic":
      case "cors":
      case "default":
        return !0;
    }
    return !1;
  }
}
async function q(C) {
  if (B !== void 0) return B;
  C !== void 0 && (Object.getPrototypeOf(C) === Object.prototype ? { module_or_path: C } = C : console.warn("using deprecated parameters for the initialization function; pass a single object instead")), C === void 0 && (C = new URL("", import.meta.url));
  const A = b();
  (typeof C == "string" || typeof Request == "function" && C instanceof Request || typeof URL == "function" && C instanceof URL) && (C = fetch(C));
  const { instance: I, module: Q } = await x(await C, A);
  return L(I);
}
var n = new URL("http://localhost:20233/debugger/engine_bg.wasm");
function t(C) {
  return C instanceof Error ? {
    type: "error",
    error: { type: C.constructor.name, message: C.message }
  } : {
    type: "error",
    error: { type: typeof C, message: String(C) }
  };
}
const f = self.fetch.bind(self);
self.fetch = (C, A) => {
  const I = C instanceof Request ? C.url : String(C), Q = "https://fabioibanez.github.io/website/", g = I.slice(Q.length), E = g === "llvm.core.wasm" ? "adapter.wasm" : g === "llvm-resources.tar.gz" ? "empty.tar.gz" : g;
  return f(I.startsWith(Q) ? \`http://localhost:20233/debugger/\${E}\` : C, A);
};
try {
  await q({ module_or_path: n }), W();
} catch (C) {
  postMessage({
    type: "stop",
    result: t(C)
  });
}
`, $ = typeof self < "u" && self.Blob && new Blob(["URL.revokeObjectURL(import.meta.url);", gA], { type: "text/javascript;charset=utf-8" });
function mA(C) {
  let A;
  try {
    if (A = $ && (self.URL || self.webkitURL).createObjectURL($), !A) throw "";
    const I = new Worker(A, {
      type: "module",
      name: C?.name
    });
    return I.addEventListener("error", () => {
      (self.URL || self.webkitURL).revokeObjectURL(A);
    }), I;
  } catch {
    return new Worker(
      "data:text/javascript;charset=utf-8," + encodeURIComponent(gA),
      {
        type: "module",
        name: C?.name
      }
    );
  }
}
class CA {
  stdout = new AA(1);
  stderr = new AA(2);
  stdin = new R();
  debugger;
  /** Shared debuggee memory used by Code App's value formatters while paused. */
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
    if (await XA({ module_or_path: dA }), typeof window < "u" && typeof fetch < "u")
      for (const I of wA(A)) fetch(I, { cache: "force-cache" });
    return new CA(A);
  }
  constructor(A) {
    this.debugger = new zA(), this.lang = A;
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
    const A = performance.now(), I = new mA();
    I.addEventListener("message", (Q) => {
      if (Q.data.type === "debug") {
        const g = Q.data.info;
        this.debuggeeMemory = g.memory.memory;
      }
    }), this.stdout[i].attach(I), this.stderr[i].attach(I), this.debugger[i].attach(I);
    try {
      return await new Promise(async (Q, g) => {
        this.rejector = () => g("stopped"), I.addEventListener("error", (M) => g(M.error)), await new Promise((M) => {
          const o = (Z) => {
            Z.data.type === "ready" && (I.removeEventListener("message", o), M());
          };
          I.addEventListener("message", o);
        }), I.addEventListener("message", (M) => {
          M.data.type === "stop" ? Q({
            type: "completed",
            exitCode: M.data.exit_code,
            timing: {
              totalMs: performance.now() - A,
              buildMs: M.data.build_ms,
              runMs: M.data.run_ms
            }
          }) : M.data.type === "error" && Q({
            type: "error",
            error: { type: "EngineError", message: M.data.message }
          });
        });
        const D = {
          fs: this.fs,
          lang: this.lang,
          stdin_buffer: this.stdin[i].buffer,
          is_debug: this.debugger.enabled
        };
        I.postMessage(D);
      });
    } catch (Q) {
      return Q === "stopped" ? { type: "stopped" } : UA(Q);
    } finally {
      this.debuggeeMemory = void 0, this.rejector = void 0, this.stdout[i].detach(I), this.stderr[i].detach(I), this.stdin[i].clear(), I.terminate();
    }
  }
}
class AA extends IA {
  constructor(A) {
    super(), this.mode = A, this.callback = ((I) => {
      const Q = I.data;
      if (Q.type !== "stdout" || Q.mode !== this.mode) return;
      const g = Q.data;
      this.emit("data", g);
    }).bind(this), this[i] = {
      attach: this.attach.bind(this),
      detach: this.detach.bind(this)
    };
  }
  callback;
  [i];
  attach(A) {
    A.addEventListener("message", this.callback);
  }
  detach(A) {
    A.removeEventListener("message", this.callback);
  }
}
class R {
  /**
   * Ring buffer to store stdin data.
   *
   * - TypeScript controls write_index, Rust controls read_index
   * - One slot is always kept empty to distinguish full from empty
   */
  static BUFFER_SIZE = 2048;
  static HEADER_SIZE = 8;
  // 2 x i32
  static DATA_SIZE = R.BUFFER_SIZE - R.HEADER_SIZE;
  static READ_IDX = 0;
  static WRITE_IDX = 1;
  static encoder = new TextEncoder();
  buffer = new SharedArrayBuffer(R.BUFFER_SIZE);
  indices;
  data;
  [i];
  constructor() {
    this.indices = new Int32Array(this.buffer, 0, 2), this.data = new Int8Array(this.buffer, R.HEADER_SIZE), this[i] = {
      clear: this.clear.bind(this),
      buffer: this.buffer
    };
  }
  clear() {
    this.indices.fill(0);
  }
  async write(A) {
    const I = typeof A == "string" ? R.encoder.encode(A) : A;
    return this.writeBytes(I);
  }
  async writeBytes(A) {
    const { DATA_SIZE: I, READ_IDX: Q, WRITE_IDX: g } = R;
    let D = 0;
    for (; D < A.length; ) {
      const M = Atomics.load(this.indices, Q);
      let o = Atomics.load(this.indices, g);
      o === I - 1 && M > 0 && (o = 0);
      const Z = M <= o ? I - o - 1 : M - o - 1;
      if (Z === 0) {
        await Atomics.waitAsync(this.indices, Q, M).value;
        continue;
      }
      const d = Math.min(A.length - D, Z);
      this.data.set(A.subarray(D, D + d), o), Atomics.store(this.indices, g, (o + d) % I), Atomics.notify(this.indices, g), D += d;
    }
  }
}
export {
  OA as Artifact,
  zA as Debugger,
  CA as Engine,
  R as Stdin,
  AA as Stdout
};
