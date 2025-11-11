/*
likeag6/frontend/wasm/loader.js

A tiny placeholder/no-op loader so the browser can fetch "/static/wasm/loader.js"
without a 404 or wrong MIME. This file intentionally does not attempt to load
or run the real WebAssembly module; it only ensures a well-known global
(`window.wasmGonum`) exists so other client code can detect the presence of a
loader and fail gracefully.

If you want full wasm initialization, keep the current build flow so that
`frontend/main.wasm` and `frontend/wasm/wasm_exec.js` are present and the real
runtime can register the real functions (e.g. `gonumAdd`, `gonumSub`, ...).
*/

(function () {
  if (typeof window === "undefined") return;

  // Mark that the loader is present (useful for detection in client code)
  try {
    Object.defineProperty(window, "__wasm_loader_present__", {
      value: true,
      writable: false,
      configurable: false,
      enumerable: false,
    });
  } catch (e) {
    // ignore if property can't be defined
    window.__wasm_loader_present__ = true;
  }

  // If a wasm runtime implementation already set a real `wasmGonum`, do nothing.
  if (window.wasmGonum && typeof window.wasmGonum === "object") {
    // ensure minimal shape
    if (typeof window.wasmGonum.init !== "function") {
      window.wasmGonum.init = async function () {
        return !!(window.wasmGonum && window.wasmGonum.isReady && window.wasmGonum.isReady());
      };
    }
    return;
  }

  // Provide a benign shim so the rest of the app can call into window.wasmGonum
  // without causing hard exceptions. Each method returns a rejected Promise with
  // a helpful message so UI code can show it to the user.
  function makeRejected(name) {
    return async function () {
      throw new Error(
        "WASM backend not initialized. Please build and serve the wasm artifacts (frontend/main.wasm and frontend/wasm/wasm_exec.js)."
      );
    };
  }

  window.wasmGonum = {
    // init() should attempt to initialize the runtime; this shim simply
    // returns a rejected promise to indicate wasm is not available.
    init: async function () {
      // Return false to indicate not ready (some client code interprets boolean)
      return false;
    },
    // isReady returns false for the shim
    isReady: function () {
      return false;
    },
    // Arithmetic operations - throw helpful errors when called
    add: makeRejected("add"),
    sub: makeRejected("sub"),
    mul: makeRejected("mul"),
    rref: makeRejected("rref"),
  };

  // Also expose short names for compatibility (older code may call window.gonumAdd, etc.)
  window.gonumAdd = function () {
    throw new Error(
      "gonumAdd not available: wasm not initialized. Build and serve frontend/main.wasm and frontend/wasm/wasm_exec.js."
    );
  };
  window.gonumSub = window.gonumAdd;
  window.gonumMul = window.gonumAdd;
  window.gonumRREF = window.gonumAdd;
})();
