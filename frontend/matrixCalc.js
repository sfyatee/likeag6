
/* ==========
   Elements
========== */
const aRows = document.getElementById('aRows');
const aCols = document.getElementById('aCols');
const bRows = document.getElementById('bRows');
const bCols = document.getElementById('bCols');
const Agrid = document.getElementById('A');
const Bgrid = document.getElementById('B');
const Rgrid = document.getElementById('Result');
const opError = document.getElementById('opError');
const compat = document.getElementById('compat');
const derivation = document.getElementById('derivation');
const copyStepsBtn = document.getElementById('copySteps');
const copyResultBtn = document.getElementById('copyResult');

/* ==========
   Fraction helpers
========== */
function gcd(a,b){ a=Math.abs(a); b=Math.abs(b); while(b){ const t=a%b; a=b; b=t; } return a||1; }
function toFraction(x, maxDen=100, tol=1e-8){
  if (!Number.isFinite(x)) return String(x);
  const sign = x<0 ? -1 : 1;
  x = Math.abs(x);
  if (Math.abs(x - Math.round(x)) < tol) return String(sign*Math.round(x));
  // Continued fraction
  let h1=1, h0=0, k1=0, k0=1, b = x;
  for(let i=0;i<50;i++){
    const a = Math.floor(b);
    const h2 = a*h1 + h0;
    const k2 = a*k1 + k0;
    if (k2 > maxDen) break;
    const approx = h2 / k2;
    if (Math.abs(approx - x) < tol) {
      const num = sign*h2, den = k2;
      const g = gcd(num,den);
      return (den/g===1) ? String((num/g)) : `${num/g}/${den/g}`;
    }
    h0=h1; k0=k1; h1=h2; k1=k2;
    const frac = b - a;
    if (frac === 0) break;
    b = 1/frac;
  }
  // Fallback: best current convergent within maxDen
  const num = sign*h1, den = k1;
  const g = gcd(num,den);
  if (den/g <= maxDen) {
    return (den/g===1) ? String((num/g)) : `${num/g}/${den/g}`;
  }
  const s = Number(sign*x).toFixed(6);
  return s.replace(/\.?0+$/,'');
}
function strip(x){ return toFraction(Number(x)); }

/* ==========
   Grid utils
========== */
function buildGrid(container, rows, cols, fill = 0){
  container.innerHTML = '';
  container.style.gridTemplateColumns = `repeat(${cols}, 80px)`;
  container.style.gridTemplateRows = `repeat(${rows}, auto)`;
  for(let i=0;i<rows;i++){
    for(let j=0;j<cols;j++){
      const inp = document.createElement('input');
      inp.type = 'number';
      inp.step = '0.1';
      inp.value = String(fill);
      inp.dataset.i = String(i);
      inp.dataset.j = String(j);
      container.appendChild(inp);
    }
  }
}
function writeMatrix(container, M){
  const rows = M.length, cols = rows ? M[0].length : 0;
  buildGrid(container, rows, cols, 0);
  const inputs = container.querySelectorAll('input');
  let idx = 0;
  for(let i=0;i<rows;i++){
    for(let j=0;j<cols;j++){
      inputs[idx++].value = String(M[i][j]);
    }
  }
}
function readMatrix(container, rows, cols){
  const M = Array.from({length: rows}, () => Array(cols).fill(0));
  const inputs = container.querySelectorAll('input');
  inputs.forEach(inp => {
    const i = +inp.dataset.i;
    const j = +inp.dataset.j;
    M[i][j] = parseFloat(inp.value || '0');
  });
  return M;
}
function showMatrix(container, M){
  container.innerHTML = '';
  const rows = M.length, cols = rows ? M[0].length : 0;
  container.style.gridTemplateColumns = `repeat(${cols}, 80px)`;
  container.style.gridTemplateRows = `repeat(${rows}, auto)`;
  for(let i=0;i<rows;i++){
    for(let j=0;j<cols;j++){
      const cell = document.createElement('input');
      cell.type = 'text';
      cell.value = strip(M[i][j]);
      cell.readOnly = true;
      container.appendChild(cell);
    }
  }
}

/* ==========
   Build initial grids
========== */
function rebuildAllGrids(){
  buildGrid(Agrid, +aRows.value, +aCols.value, 0);
  buildGrid(Bgrid, +bRows.value, +bCols.value, 0);
  Rgrid.innerHTML = '';
  opError.textContent = '';
  renderEmptyRight();
  updateCompatibilityHint();
}
[aRows, aCols, bRows, bCols].forEach(el => el.addEventListener('input', rebuildAllGrids));
rebuildAllGrids();

/* ==========
   Compatibility hint
========== */
function updateCompatibilityHint(){
  const ar = +aRows.value, ac = +aCols.value;
  const br = +bRows.value, bc = +bCols.value;
  let msg = `Add/Sub require same sizes (A: ${ar}×${ac}, B: ${br}×${bc}). `;
  msg += `Multiply requires A.cols == B.rows (${ac} vs ${br}).`;
  compat.textContent = msg;
}

/* ==========
   Fill tools
========== */
function fillZeros(container){ container.querySelectorAll('input').forEach(i => i.value = '0'); }
function fillOnes(container){ container.querySelectorAll('input').forEach(i => i.value = '1'); }
function fillIdentity(container){
  const inputs = container.querySelectorAll('input');
  inputs.forEach(inp => {
    const i = +inp.dataset.i, j = +inp.dataset.j;
    inp.value = (i === j) ? '1' : '0';
  });
}
function fillRandom(container, min=-9, max=9){
  container.querySelectorAll('input').forEach(inp => {
    const v = Math.floor(Math.random()*(max-min+1))+min;
    inp.value = String(v);
  });
}
document.getElementById('aZeros').addEventListener('click', () => fillZeros(Agrid));
document.getElementById('aOnes').addEventListener('click', () => fillOnes(Agrid));
document.getElementById('aIdentity').addEventListener('click', () => fillIdentity(Agrid));
document.getElementById('aRandom').addEventListener('click', () => fillRandom(Agrid));
document.getElementById('bZeros').addEventListener('click', () => fillZeros(Bgrid));
document.getElementById('bOnes').addEventListener('click', () => fillOnes(Bgrid));
document.getElementById('bIdentity').addEventListener('click', () => fillIdentity(Bgrid));
document.getElementById('bRandom').addEventListener('click', () => fillRandom(Bgrid));

/* ==========
   Swap A and B
========== */
document.getElementById('swapAB').addEventListener('click', () => {
  const ar = aRows.value, ac = aCols.value, br = bRows.value, bc = bCols.value;
  const A = readMatrix(Agrid, +ar, +ac);
  const B = readMatrix(Bgrid, +br, +bc);
  aRows.value = br; aCols.value = bc; bRows.value = ar; bCols.value = ac;
  rebuildAllGrids();
  writeMatrix(Agrid, B);
  writeMatrix(Bgrid, A);
  updateCompatibilityHint();
});

/* ==========
   API calls (for add/sub/mul)
========== */
async function callAPI(path, A, B){
  const res = await fetch(path, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({ A, B })
  });
  return res.json();
}

/* ==========
   Step render helpers
========== */
function dims(M){ return [M.length, M.length? M[0].length : 0]; }

function matrixHTML(M, extraClass=''){
  const [r,c] = dims(M);
  let rows = '';
  for(let i=0;i<r;i++){
    rows += `<div class="mat-row">${M[i].map(v => `<div class="mat-cell">${strip(v)}</div>`).join('')}</div>`;
  }
  return `<div class="mat ${extraClass}" style="grid-template-rows: repeat(${r}, auto);"><div class="row">${rows}</div></div>`;
}
function exprAddSubMatrixHTML(A, B, op){
  const [r,c] = dims(A);
  const M = Array.from({length:r}, ()=>Array(c).fill(''));
  for(let i=0;i<r;i++){
    for(let j=0;j<c;j++){
      const a = strip(A[i][j]);
      const bRaw = B[i][j];
      const b = strip(bRaw);
      const bShown = bRaw < 0 ? `(${b})` : b;
      M[i][j] = op === 'add' ? `${a} + ${bShown}` : `${a} − ${bShown}`;
    }
  }
  const rows = M.map(row => `<div class="mat-row">${row.map(s => `<div class="mat-cell">${s}</div>`).join('')}</div>`).join('');
  return `<div class="mat expr" style="grid-template-rows: repeat(${r}, auto);"><div class="row">${rows}</div></div>`;
}
function exprMulMatrixHTML(A, B){
  const [ar, ac] = dims(A);
  const [, bc] = dims(B);
  const M = Array.from({length: ar}, () => Array(bc).fill(''));
  for(let i=0;i<ar;i++){
    for(let j=0;j<bc;j++){
      const terms = [];
      for(let k=0;k<ac;k++){
        const a = strip(A[i][k]);
        const bRaw = B[k][j];
        const b = strip(bRaw);
        const bShown = bRaw < 0 ? `(${b})` : b;
        terms.push(`${a}×${bShown}`);
      }
      M[i][j] = terms.join(' + ');
    }
  }
  const rows = M.map(row => `<div class="mat-row">${row.map(s => `<div class="mat-cell">${s}</div>`).join('')}</div>`).join('');
  return `<div class="mat expr" style="grid-template-rows: repeat(${ar}, auto);"><div class="row">${rows}</div></div>`;
}

function renderEmptyRight(){
  derivation.innerHTML = `
    <div class="empty-title">Matrix Operations</div>
    <div class="empty-text">Enter sizes and values for A and B on the left. Choose an operation and the step-by-step explanation will show up here.</div>
  `;
}
function renderAddSubSteps(op, A, B, R){
  const symbol = (op === 'add') ? '+' : '−';
  const [ar, ac] = dims(A), [br, bc] = dims(B);
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
  derivation.innerHTML = html;
}
function renderMulSteps(A, B, R){
  const [ar, ac] = dims(A), [br, bc] = dims(B);
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
  for(let i=0;i<ar;i++){
    for(let j=0;j<bc;j++){
      const row = A[i];
      const col = B.map(r => r[j]);
      const val = R[i][j];
      html += `<div class="eq-row">
        ${matrixHTML([row], 'expr')}
        <div class="eq-symbol">·</div>
        ${matrixHTML(col.map(v=>[v]), 'expr')}
        <div class="eq-symbol">=</div>
        <div class="eq-line">${strip(val)}</div>
      </div>`;
    }
  }
  derivation.innerHTML = html;
}

/* ==========
   RREF with recorded steps (client-side)
========== */
function cloneM(M){ return M.map(row => row.slice()); }
function snapshot(M){ return cloneM(M); }

function rrefWithSteps(A){
  const M = cloneM(A);
  const r = M.length, c = M[0].length;
  const eps = 1e-10;
  const steps = [];
  let row = 0;

  for(let col=0; col<c && row<r; col++){
    // find pivot row
    let piv = row;
    let maxAbs = Math.abs(M[piv][col]);
    for(let i=row+1;i<r;i++){
      const v = Math.abs(M[i][col]);
      if (v > maxAbs){ maxAbs = v; piv = i; }
    }
    if (maxAbs < eps) continue;

    if (piv !== row){
      // swap rows
      const tmp = M[piv]; M[piv] = M[row]; M[row] = tmp;
      steps.push({op:`R${row+1} ↔ R${piv+1}`, mat:snapshot(M)});
    }

    // scale row to make pivot = 1
    const p = M[row][col];
    if (Math.abs(p - 1) > eps){
      for(let j=col;j<c;j++) M[row][j] /= p;
      steps.push({op:`R${row+1} ← (1/${strip(p)}) · R${row+1}`, mat:snapshot(M)});
    }

    // eliminate other rows in this column
    for(let i=0;i<r;i++){
      if (i === row) continue;
      const f = M[i][col];
      if (Math.abs(f) < eps) continue;
      for(let j=col;j<c;j++) M[i][j] -= f * M[row][j];
      const sign = f<0 ? '+' : '−';
      const fac = strip(Math.abs(f));
      steps.push({op:`R${i+1} ← R${i+1} ${sign} ${fac}·R${row+1}`, mat:snapshot(M)});
    }

    row++;
  }

  // clean small noise
  for(let i=0;i<r;i++){
    for(let j=0;j<c;j++){
      if (Math.abs(M[i][j]) < 1e-12) M[i][j] = 0;
    }
  }
  return {result:M, steps};
}

function renderRREFStepsDetailed(A, trace){
  let html = `<div class="step-block"><div class="op-title">Operation:</div>
  <div class="dim-note">Gauss–Jordan elimination to RREF</div></div>`;

  // initial matrix
  html += `<div class="eq-row">
    ${matrixHTML(A)}
    <div class="eq-symbol">→</div>
    ${matrixHTML(trace.steps.length ? trace.steps[0].mat : trace.result)}
  </div>`;

  // list steps
  for(const s of trace.steps){
    html += `<div class="eq-row">
      <div class="eq-line">${s.op}</div>
      <div class="eq-symbol">⇒</div>
      ${matrixHTML(s.mat)}
    </div>`;
  }

  derivation.innerHTML = html;
}

/* ==========
   Operations (API for add/sub/mul, client for RREF steps)
========== */
async function doOp(path, opName){
  opError.textContent = '';
  Rgrid.innerHTML = '';
  const Ar = +aRows.value, Ac = +aCols.value;
  const Br = +bRows.value, Bc = +bCols.value;
  const A = readMatrix(Agrid, Ar, Ac);
  const B = readMatrix(Bgrid, Br, Bc);
  try {
    const data = await callAPI(path, A, B);
    if (data.error){
      opError.textContent = data.error;
      renderEmptyRight();
      return;
    }
    const R = data.result;
    showMatrix(Rgrid, R);
    if (opName === 'add' || opName === 'sub') renderAddSubSteps(opName, A, B, R);
    else renderMulSteps(A, B, R);
  } catch (e){
    opError.textContent = 'Network error: ' + e.message;
    renderEmptyRight();
  }
}

async function doRREF(){
  opError.textContent = '';
  Rgrid.innerHTML = '';
  const Ar = +aRows.value, Ac = +aCols.value;
  const A = readMatrix(Agrid, Ar, Ac);
  try {
    const trace = rrefWithSteps(A); // client-side steps + result
    showMatrix(Rgrid, trace.result);
    renderRREFStepsDetailed(A, trace);
  } catch(e){
    opError.textContent = 'RREF error: ' + e.message;
    renderEmptyRight();
  }
}

document.getElementById('btnAdd').addEventListener('click', () => doOp('/api/matrix/add', 'add'));
document.getElementById('btnSub').addEventListener('click', () => doOp('/api/matrix/subtract', 'sub'));
document.getElementById('btnMul').addEventListener('click', () => doOp('/api/matrix/multiply', 'mul'));
document.getElementById('btnRREF').addEventListener('click', doRREF);

/* ==========
   Copy
========== */
copyStepsBtn.addEventListener('click', () => {
  const text = derivation.innerText.trim();
  if (!text) return;
  navigator.clipboard.writeText(text);
});
copyResultBtn.addEventListener('click', () => {
  const cells = Array.from(Rgrid.querySelectorAll('input')).map(i => i.value);
  navigator.clipboard.writeText(cells.join('\t'));
});
