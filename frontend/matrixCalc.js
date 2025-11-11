/*
likeag6/frontend/matrixCalc.js

WASM-only frontend for the matrix calculator.

- Initializes the Go WebAssembly runtime by loading /static/wasm/wasm_exec.js and /static/main.wasm.
- Exposes window.wasmGonum with: init(), isReady(), add(A,B), sub(A,B), mul(A,B), rref(A)
- The UI code uses the wasm implementation exclusively. If WASM fails to initialize, the UI will show an error and disable operation buttons.
- RREF step-by-step tracing remains implemented client-side for educational output; the numeric RREF result is obtained from WASM.
*/

(function () {
  // ------- WASM runtime and wrapper -------
  const WASM_EXEC_PATH = "/static/wasm/wasm_exec.js";
  const WASM_MODULE_PATH = "/static/main.wasm";

  let wasmReady = false;
  let wasmInitializing = false;
  let wasmInitPromise = null;

  // Helper to load a script tag (wasm_exec.js)
  function injectScript(src) {
    return new Promise((resolve, reject) => {
      // If script already present, resolve when loaded or immediately if already available
      const existing = Array.from(document.getElementsByTagName("script")).find(
        (s) => s.src && s.src.indexOf(src) !== -1,
      );
      if (existing) {
        if (existing.dataset && existing.dataset.loaded === "1")
          return resolve();
        existing.addEventListener("load", () => resolve());
        existing.addEventListener("error", (e) => reject(e));
        return;
      }
      const s = document.createElement("script");
      s.src = src;
      s.async = true;
      s.addEventListener("load", () => {
        s.dataset.loaded = "1";
        resolve();
      });
      s.addEventListener("error", (e) =>
        reject(new Error("Failed to load script " + src + ": " + e.message)),
      );
      document.head.appendChild(s);
    });
  }

  // Helper to try to unwrap various possible return shapes from the Go-exported functions.
  // The wasm functions may return:
  //  - a JSON string (older code)
  //  - an object { result: <matrix>, error: <string|null> }
  //  - a plain matrix (unlikely) or some other JS value
  function unwrapWasmResult(res) {
    if (res === null || res === undefined) {
      return { result: null, error: "empty result from wasm" };
    }
    // If it's a string, try to parse JSON
    if (typeof res === "string") {
      try {
        const parsed = JSON.parse(res);
        if (
          parsed &&
          typeof parsed === "object" &&
          ("result" in parsed || "error" in parsed)
        ) {
          return { result: parsed.result ?? null, error: parsed.error ?? null };
        }
        // If parsed is simply an array, treat it as result
        return { result: parsed, error: null };
      } catch (e) {
        // not JSON: treat as error string
        return { result: null, error: String(res) };
      }
    }
    // If it's an object, check for .error/.result
    if (typeof res === "object") {
      // Some Go->JS bridges wrap values; try common shapes
      try {
        if ("error" in res || "result" in res) {
          return { result: res.result ?? null, error: res.error ?? null };
        }
        // If it's already an Array (matrix), return it as result
        if (Array.isArray(res)) {
          return { result: res, error: null };
        }
        // As a last resort, return the object as result
        return { result: res, error: null };
      } catch (e) {
        return {
          result: null,
          error: "failed to read wasm result: " + e.message,
        };
      }
    }
    // Other types
    return { result: res, error: null };
  }

  // Initialize the Go wasm runtime and the module. Returns a Promise that resolves when ready.
  async function initWasm() {
    if (wasmReady) return true;
    if (wasmInitPromise) return wasmInitPromise;
    wasmInitPromise = (async () => {
      if (wasmInitializing)
        throw new Error("WASM initialization already in progress");
      wasmInitializing = true;
      // Load wasm_exec.js
      try {
        await injectScript(WASM_EXEC_PATH);
      } catch (e) {
        wasmInitializing = false;
        throw new Error("Failed to load wasm_exec.js: " + e.message);
      }
      if (typeof Go === "undefined") {
        wasmInitializing = false;
        throw new Error(
          "wasm_exec.js did not expose Go runtime (global Go is undefined).",
        );
      }
      const go = new Go();
      try {
        // Fetch and instantiate the module
        let result;
        // Try instantiateStreaming if available
        try {
          if (WebAssembly.instantiateStreaming) {
            const resp = await fetch(WASM_MODULE_PATH);
            if (!resp.ok)
              throw new Error(
                "Failed to fetch " + WASM_MODULE_PATH + ": " + resp.status,
              );
            result = await WebAssembly.instantiateStreaming(
              resp,
              go.importObject,
            );
          } else {
            const bytes = await (await fetch(WASM_MODULE_PATH)).arrayBuffer();
            result = await WebAssembly.instantiate(bytes, go.importObject);
          }
        } catch (e) {
          // Fallback to arrayBuffer + instantiate
          const bytes = await (await fetch(WASM_MODULE_PATH)).arrayBuffer();
          result = await WebAssembly.instantiate(bytes, go.importObject);
        }
        // Start the Go runtime (this schedules long-running tasks but returns to event loop)
        go.run(result.instance);
        // Wait for the exported functions to appear
        const start = Date.now();
        const timeoutMs = 5000;
        while (Date.now() - start < timeoutMs) {
          if (
            typeof window.gonumAdd === "function" &&
            typeof window.gonumSub === "function" &&
            typeof window.gonumMul === "function" &&
            typeof window.gonumRREF === "function"
          ) {
            wasmReady = true;
            wasmInitializing = false;
            return true;
          }
          // Small delay
          await new Promise((r) => setTimeout(r, 25));
        }
        wasmInitializing = false;
        throw new Error(
          "WASM module loaded but expected functions not registered in time",
        );
      } catch (err) {
        wasmInitializing = false;
        throw err;
      }
    })();
    return wasmInitPromise;
  }

  // Expose a simple API on window.wasmGonum
  window.wasmGonum = {
    init: async function () {
      try {
        return await initWasm();
      } catch (e) {
        console.error("wasmGonum.init failed:", e && e.message ? e.message : e);
        throw e;
      }
    },
    isReady: function () {
      return !!wasmReady;
    },
    // all operations return a Promise that resolves to the raw matrix (Array of arrays)
    add: async function (A, B) {
      if (!wasmReady) await initWasm();
      const raw = window.gonumAdd(A, B);
      const { result, error } = unwrapWasmResult(raw);
      if (error) throw new Error(error);
      return result;
    },
    sub: async function (A, B) {
      if (!wasmReady) await initWasm();
      const raw = window.gonumSub(A, B);
      const { result, error } = unwrapWasmResult(raw);
      if (error) throw new Error(error);
      return result;
    },
    mul: async function (A, B) {
      if (!wasmReady) await initWasm();
      const raw = window.gonumMul(A, B);
      const { result, error } = unwrapWasmResult(raw);
      if (error) throw new Error(error);
      return result;
    },
    rref: async function (A) {
      if (!wasmReady) await initWasm();
      const raw = window.gonumRREF(A);
      const { result, error } = unwrapWasmResult(raw);
      if (error) throw new Error(error);
      return result;
    },
  };

  // ------- UI logic (matrix calculator) -------
  // Grab DOM elements
  const aRowsEl = document.getElementById("aRows");
  const aColsEl = document.getElementById("aCols");
  const bRowsEl = document.getElementById("bRows");
  const bColsEl = document.getElementById("bCols");
  const AgridEl = document.getElementById("A");
  const BgridEl = document.getElementById("B");
  const RgridEl = document.getElementById("Result");
  const opErrorEl = document.getElementById("opError");
  const compatEl = document.getElementById("compat");
  const derivationEl = document.getElementById("derivation");
  const copyStepsBtn = document.getElementById("copySteps");
  const copyResultBtn = document.getElementById("copyResult");

  // Small helper: disable operation buttons when wasm not ready
  function setOpsEnabled(enabled) {
    const ids = ["btnAdd", "btnSub", "btnMul", "btnRREF"];
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.disabled = !enabled;
      el.classList.toggle("disabled", !enabled);
    });
  }

  // Fraction helpers (display)
  function gcd(a, b) {
    a = Math.abs(a);
    b = Math.abs(b);
    while (b) {
      const t = a % b;
      a = b;
      b = t;
    }
    return a || 1;
  }
  function toFraction(x, maxDen = 100, tol = 1e-8) {
    if (!Number.isFinite(x)) return String(x);
    const sign = x < 0 ? -1 : 1;
    x = Math.abs(x);
    if (Math.abs(x - Math.round(x)) < tol) return String(sign * Math.round(x));
    let h1 = 1,
      h0 = 0,
      k1 = 0,
      k0 = 1,
      b = x;
    for (let i = 0; i < 50; i++) {
      const a = Math.floor(b);
      const h2 = a * h1 + h0;
      const k2 = a * k1 + k0;
      if (k2 > maxDen) break;
      const approx = h2 / k2;
      if (Math.abs(approx - x) < tol) {
        const num = sign * h2,
          den = k2;
        const g = gcd(num, den);
        return den / g === 1 ? String(num / g) : `${num / g}/${den / g}`;
      }
      h0 = h1;
      k0 = k1;
      h1 = h2;
      k1 = k2;
      const frac = b - a;
      if (frac === 0) break;
      b = 1 / frac;
    }
    const num = sign * h1,
      den = k1;
    const g = gcd(num, den);
    if (den / g <= maxDen)
      return den / g === 1 ? String(num / g) : `${num / g}/${den / g}`;
    return Number(sign * x)
      .toFixed(6)
      .replace(/\.?0+$/, "");
  }
  function strip(x) {
    return toFraction(Number(x));
  }

  // Grid helpers
  function buildGrid(container, rows, cols, fill = 0) {
    container.innerHTML = "";
    container.style.gridTemplateColumns = `repeat(${cols}, 80px)`;
    container.style.gridTemplateRows = `repeat(${rows}, auto)`;
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        const inp = document.createElement("input");
        inp.type = "number";
        inp.step = "0.1";
        inp.value = String(fill);
        inp.dataset.i = String(i);
        inp.dataset.j = String(j);
        container.appendChild(inp);
      }
    }
  }
  function writeMatrix(container, M) {
    const rows = M.length,
      cols = rows ? M[0].length : 0;
    buildGrid(container, rows, cols, 0);
    const inputs = container.querySelectorAll("input");
    let idx = 0;
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        inputs[idx++].value = String(M[i][j]);
      }
    }
  }
  function readMatrix(container, rows, cols) {
    const M = Array.from({ length: rows }, () => Array(cols).fill(0));
    const inputs = container.querySelectorAll("input");
    inputs.forEach((inp) => {
      const i = +inp.dataset.i;
      const j = +inp.dataset.j;
      M[i][j] = parseFloat(inp.value || "0");
    });
    return M;
  }
  function showMatrix(container, M) {
    container.innerHTML = "";
    const rows = M.length,
      cols = rows ? M[0].length : 0;
    container.style.gridTemplateColumns = `repeat(${cols}, 80px)`;
    container.style.gridTemplateRows = `repeat(${rows}, auto)`;
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        const cell = document.createElement("input");
        cell.type = "text";
        cell.value = strip(M[i][j]);
        cell.readOnly = true;
        container.appendChild(cell);
      }
    }
  }

  // Expression rendering utilities
  function dims(M) {
    return [M.length, M.length ? M[0].length : 0];
  }
  function matrixHTML(M, extraClass = "") {
    const [r, c] = dims(M);
    let rows = "";
    for (let i = 0; i < r; i++) {
      rows += `<div class="mat-row">${M[i].map((v) => `<div class="mat-cell">${strip(v)}</div>`).join("")}</div>`;
    }
    return `<div class="mat ${extraClass}" style="grid-template-rows: repeat(${r}, auto);"><div class="row">${rows}</div></div>`;
  }
  function exprAddSubMatrixHTML(A, B, op) {
    const [r, c] = dims(A);
    const M = Array.from({ length: r }, () => Array(c).fill(""));
    for (let i = 0; i < r; i++) {
      for (let j = 0; j < c; j++) {
        const a = strip(A[i][j]);
        const bRaw = B[i][j];
        const b = strip(bRaw);
        const bShown = bRaw < 0 ? `(${b})` : b;
        M[i][j] = op === "add" ? `${a} + ${bShown}` : `${a} − ${bShown}`;
      }
    }
    const rows = M.map(
      (row) =>
        `<div class="mat-row">${row.map((s) => `<div class="mat-cell">${s}</div>`).join("")}</div>`,
    ).join("");
    return `<div class="mat expr" style="grid-template-rows: repeat(${r}, auto);"><div class="row">${rows}</div></div>`;
  }
  function exprMulMatrixHTML(A, B) {
    const [ar, ac] = dims(A);
    const [, bc] = dims(B);
    const M = Array.from({ length: ar }, () => Array(bc).fill(""));
    for (let i = 0; i < ar; i++) {
      for (let j = 0; j < bc; j++) {
        const terms = [];
        for (let k = 0; k < ac; k++) {
          const a = strip(A[i][k]);
          const bRaw = B[k][j];
          const b = strip(bRaw);
          const bShown = bRaw < 0 ? `(${b})` : b;
          terms.push(`${a}×${bShown}`);
        }
        M[i][j] = terms.join(" + ");
      }
    }
    const rows = M.map(
      (row) =>
        `<div class="mat-row">${row.map((s) => `<div class="mat-cell">${s}</div>`).join("")}</div>`,
    ).join("");
    return `<div class="mat expr" style="grid-template-rows: repeat(${ar}, auto);"><div class="row">${rows}</div></div>`;
  }

  function renderEmptyRight() {
    derivationEl.innerHTML = `
      <div class="empty-title">Matrix Operations</div>
      <div class="empty-text">Enter sizes and values for A and B on the left. Choose an operation and the step-by-step explanation will show up here.</div>
    `;
  }
  function renderAddSubSteps(op, A, B, R) {
    const symbol = op === "add" ? "+" : "−";
    const [ar, ac] = dims(A),
      [br, bc] = dims(B);
    let html = `<div class="step-block"><div class="op-title">Operation:</div>
    <div class="dim-note">A is ${ar}×${ac}, B is ${br}×${bc}</div></div>`;
    html += `<div class="eq-row">
      ${matrixHTML(A)}
      <div class="eq-symbol">${symbol}</div>
      ${matrixHTML(B)}
      <div class="eq-symbol">=</div>
      ${exprAddSubMatrixHTML(A, B, op)}
      <div class="eq-symbol">=</div>
      ${matrixHTML(R)}
    </div>`;
    derivationEl.innerHTML = html;
  }
  function renderMulSteps(A, B, R) {
    const [ar, ac] = dims(A),
      [br, bc] = dims(B);
    let html = `<div class="step-block"><div class="op-title">Operation:</div>
    <div class="dim-note">A is ${ar}×${ac}, B is ${br}×${bc}</div></div>`;
    html += `<div class="eq-row">
      ${matrixHTML(A)}
      <div class="eq-symbol">×</div>
      ${matrixHTML(B)}
      <div class="eq-symbol">=</div>
      ${exprMulMatrixHTML(A, B)}
      <div class="eq-symbol">=</div>
      ${matrixHTML(R)}
    </div>`;
    html += `<div class="small-note">Per-entry dot products:</div>`;
    for (let i = 0; i < ar; i++) {
      for (let j = 0; j < bc; j++) {
        const row = A[i];
        const col = B.map((r) => r[j]);
        const val = R[i][j];
        html += `<div class="eq-row">
          ${matrixHTML([row], "expr")}
          <div class="eq-symbol">·</div>
          ${matrixHTML(
            col.map((v) => [v]),
            "expr",
          )}
          <div class="eq-symbol">=</div>
          <div class="eq-line">${strip(val)}</div>
        </div>`;
      }
    }
    derivationEl.innerHTML = html;
  }

  // RREF steps (client-side trace)
  function cloneM(M) {
    return M.map((row) => row.slice());
  }
  function snapshot(M) {
    return cloneM(M);
  }
  function rrefWithSteps(A) {
    const M = cloneM(A);
    const r = M.length,
      c = M[0].length;
    const eps = 1e-10;
    const steps = [];
    let row = 0;
    for (let col = 0; col < c && row < r; col++) {
      let piv = row;
      let maxAbs = Math.abs(M[piv][col]);
      for (let i = row + 1; i < r; i++) {
        const v = Math.abs(M[i][col]);
        if (v > maxAbs) {
          maxAbs = v;
          piv = i;
        }
      }
      if (maxAbs < eps) continue;
      if (piv !== row) {
        const tmp = M[piv];
        M[piv] = M[row];
        M[row] = tmp;
        steps.push({ op: `R${row + 1} ↔ R${piv + 1}`, mat: snapshot(M) });
      }
      const p = M[row][col];
      if (Math.abs(p - 1) > eps) {
        for (let j = col; j < c; j++) M[row][j] /= p;
        steps.push({
          op: `R${row + 1} ← (1/${strip(p)}) · R${row + 1}`,
          mat: snapshot(M),
        });
      }
      for (let i = 0; i < r; i++) {
        if (i === row) continue;
        const f = M[i][col];
        if (Math.abs(f) < eps) continue;
        for (let j = col; j < c; j++) M[i][j] -= f * M[row][j];
        const sign = f < 0 ? "+" : "−";
        const fac = strip(Math.abs(f));
        steps.push({
          op: `R${i + 1} ← R${i + 1} ${sign} ${fac}·R${row + 1}`,
          mat: snapshot(M),
        });
      }
      row++;
    }
    for (let i = 0; i < r; i++) {
      for (let j = 0; j < c; j++) {
        if (Math.abs(M[i][j]) < 1e-12) M[i][j] = 0;
      }
    }
    return { result: M, steps };
  }

  function renderRREFStepsDetailed(A, trace) {
    let html = `<div class="step-block"><div class="op-title">Operation:</div>
    <div class="dim-note">Gauss–Jordan elimination to RREF</div></div>`;
    html += `<div class="eq-row">
      ${matrixHTML(A)}
      <div class="eq-symbol">→</div>
      ${matrixHTML(trace.steps.length ? trace.steps[0].mat : trace.result)}
    </div>`;
    for (const s of trace.steps) {
      html += `<div class="eq-row">
        <div class="eq-line">${s.op}</div>
        <div class="eq-symbol">⇒</div>
        ${matrixHTML(s.mat)}
      </div>`;
    }
    derivationEl.innerHTML = html;
  }

  // Build initial grids and wire UI
  function rebuildAllGrids() {
    buildGrid(AgridEl, +aRowsEl.value, +aColsEl.value, 0);
    buildGrid(BgridEl, +bRowsEl.value, +bColsEl.value, 0);
    RgridEl.innerHTML = "";
    opErrorEl.textContent = "";
    renderEmptyRight();
    updateCompatibilityHint();
  }

  function updateCompatibilityHint() {
    const ar = +aRowsEl.value,
      ac = +aColsEl.value;
    const br = +bRowsEl.value,
      bc = +bColsEl.value;
    let msg = `Add/Sub require same sizes (A: ${ar}×${ac}, B: ${br}×${bc}). `;
    msg += `Multiply requires A.cols == B.rows (${ac} vs ${br}).`;
    compatEl.textContent = msg;
  }

  [aRowsEl, aColsEl, bRowsEl, bColsEl].forEach((el) =>
    el.addEventListener("input", rebuildAllGrids),
  );
  rebuildAllGrids();

  // Fill tools
  function fillZeros(container) {
    container.querySelectorAll("input").forEach((i) => (i.value = "0"));
  }
  function fillOnes(container) {
    container.querySelectorAll("input").forEach((i) => (i.value = "1"));
  }
  function fillIdentity(container) {
    const inputs = container.querySelectorAll("input");
    inputs.forEach((inp) => {
      const i = +inp.dataset.i,
        j = +inp.dataset.j;
      inp.value = i === j ? "1" : "0";
    });
  }
  function fillRandom(container, min = -9, max = 9) {
    container.querySelectorAll("input").forEach((inp) => {
      const v = Math.floor(Math.random() * (max - min + 1)) + min;
      inp.value = String(v);
    });
  }
  document
    .getElementById("aZeros")
    .addEventListener("click", () => fillZeros(AgridEl));
  document
    .getElementById("aOnes")
    .addEventListener("click", () => fillOnes(AgridEl));
  document
    .getElementById("aIdentity")
    .addEventListener("click", () => fillIdentity(AgridEl));
  document
    .getElementById("aRandom")
    .addEventListener("click", () => fillRandom(AgridEl));
  document
    .getElementById("bZeros")
    .addEventListener("click", () => fillZeros(BgridEl));
  document
    .getElementById("bOnes")
    .addEventListener("click", () => fillOnes(BgridEl));
  document
    .getElementById("bIdentity")
    .addEventListener("click", () => fillIdentity(BgridEl));
  document
    .getElementById("bRandom")
    .addEventListener("click", () => fillRandom(BgridEl));

  // Swap A and B
  document.getElementById("swapAB").addEventListener("click", () => {
    const ar = aRowsEl.value,
      ac = aColsEl.value,
      br = bRowsEl.value,
      bc = bColsEl.value;
    const A = readMatrix(AgridEl, +ar, +ac);
    const B = readMatrix(BgridEl, +br, +bc);
    aRowsEl.value = br;
    aColsEl.value = bc;
    bRowsEl.value = ar;
    bColsEl.value = ac;
    rebuildAllGrids();
    writeMatrix(AgridEl, B);
    writeMatrix(BgridEl, A);
    updateCompatibilityHint();
  });

  // Computation operations (WASM-only)
  async function doOpWasm(opName) {
    opErrorEl.textContent = "";
    RgridEl.innerHTML = "";
    const Ar = +aRowsEl.value,
      Ac = +aColsEl.value;
    const Br = +bRowsEl.value,
      Bc = +bColsEl.value;
    const A = readMatrix(AgridEl, Ar, Ac);
    const B = readMatrix(BgridEl, Br, Bc);
    try {
      if (!window.wasmGonum) throw new Error("wasmGonum not available");
      let R;
      if (opName === "add") {
        R = await window.wasmGonum.add(A, B);
      } else if (opName === "sub") {
        R = await window.wasmGonum.sub(A, B);
      } else if (opName === "mul") {
        R = await window.wasmGonum.mul(A, B);
      } else {
        throw new Error("unknown op");
      }
      if (!R) throw new Error("no result from WASM");
      showMatrix(RgridEl, R);
      if (opName === "add" || opName === "sub")
        renderAddSubSteps(opName, A, B, R);
      else renderMulSteps(A, B, R);
    } catch (e) {
      opErrorEl.textContent =
        "Operation error: " + (e && e.message ? e.message : e);
      renderEmptyRight();
    }
  }

  async function doRREFWasm() {
    opErrorEl.textContent = "";
    RgridEl.innerHTML = "";
    const Ar = +aRowsEl.value,
      Ac = +aColsEl.value;
    const A = readMatrix(AgridEl, Ar, Ac);
    try {
      // Client-side trace for steps
      const trace = rrefWithSteps(A);
      // Numeric RREF from WASM
      if (!window.wasmGonum) throw new Error("wasmGonum not available");
      let numeric;
      try {
        numeric = await window.wasmGonum.rref(A);
      } catch (e) {
        console.warn(
          "WASM rref failed, using JS result",
          e && e.message ? e.message : e,
        );
        numeric = trace.result;
      }
      showMatrix(RgridEl, numeric);
      renderRREFStepsDetailed(A, trace);
    } catch (e) {
      opErrorEl.textContent = "RREF error: " + (e && e.message ? e.message : e);
      renderEmptyRight();
    }
  }

  // Wire buttons
  document
    .getElementById("btnAdd")
    .addEventListener("click", () => doOpWasm("add"));
  document
    .getElementById("btnSub")
    .addEventListener("click", () => doOpWasm("sub"));
  document
    .getElementById("btnMul")
    .addEventListener("click", () => doOpWasm("mul"));
  document.getElementById("btnRREF").addEventListener("click", doRREFWasm);

  // Copy
  copyStepsBtn.addEventListener("click", () => {
    const text = derivationEl.innerText.trim();
    if (!text) return;
    navigator.clipboard.writeText(text);
  });
  copyResultBtn.addEventListener("click", () => {
    const cells = Array.from(RgridEl.querySelectorAll("input")).map(
      (i) => i.value,
    );
    navigator.clipboard.writeText(cells.join("\t"));
  });

  // Attempt to initialize wasm on load. If it fails, show a visible error and disable ops.
  (async function tryInit() {
    setOpsEnabled(false);
    try {
      await window.wasmGonum.init();
      // mark ready
      setOpsEnabled(true);
      opErrorEl.textContent = "";
      console.log("WASM initialized and ready");
    } catch (e) {
      console.error("WASM init failed:", e && e.message ? e.message : e);
      opErrorEl.textContent =
        "WASM initialization failed: " + (e && e.message ? e.message : e);
      setOpsEnabled(false);
    }
  })();
})();
