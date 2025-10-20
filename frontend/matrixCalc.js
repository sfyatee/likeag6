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
      cell.type = 'number';
      cell.step = '0.0001';
      cell.value = Number(M[i][j].toFixed(6));
      cell.readOnly = true;
      container.appendChild(cell);
    }
  }
}

/* ==================
   Build initial grids
================== */
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

/* ==================
   Compatibility hint
================== */
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

/* Swap A and B */
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
   API calls
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
function strip(x){
  const s = Number(x).toFixed(6);
  return s.replace(/\.?0+$/, '');
}
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
  // Each entry becomes "a[i,1]×b[1,j] + a[i,2]×b[2,j] + ..."
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

  // [A] ± [B] = [ elementwise expression ] = [R]
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

  // Show assembly with expression matrix in the middle:
  // [A] × [B] = [ (row·col) expressions ] = [R]
  html += `<div class="eq-row">
    ${matrixHTML(A)}
    <div class="eq-symbol">×</div>
    ${matrixHTML(B)}
    <div class="eq-symbol">=</div>
    ${exprMulMatrixHTML(A, B)}
    <div class="eq-symbol">=</div>
    ${matrixHTML(R)}
  </div>`;

  // Then detailed per-entry rows
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
   Do ops
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

    if (opName === 'add' || opName === 'sub') {
      renderAddSubSteps(opName, A, B, R);
    } else {
      renderMulSteps(A, B, R);
    }
  } catch (e){
    opError.textContent = 'Network error: ' + e.message;
    renderEmptyRight();
  }
}

/* Buttons */
document.getElementById('btnAdd').addEventListener('click', () => doOp('/api/matrix/add', 'add'));
document.getElementById('btnSub').addEventListener('click', () => doOp('/api/matrix/subtract', 'sub'));
document.getElementById('btnMul').addEventListener('click', () => doOp('/api/matrix/multiply', 'mul'));

/* Copy steps */
copyStepsBtn.addEventListener('click', () => {
  const text = derivation.innerText.trim();
  if (!text) return;
  navigator.clipboard.writeText(text);
});
