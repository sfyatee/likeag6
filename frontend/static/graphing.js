// Graphing: old-style two-column with sidebar; default to 3D.
// 2D = matrix transform demo (unit square/basis). 3D = transformed basis in XY plane.
(function(){
  const $ = (s, r=document) => r.querySelector(s);

  // DOM
  const modeSel   = $('#mode');
  const presetSel = $('#preset');
  const resetBtn  = $('#reset');
  const applyBtn  = $('#apply');
  const exportBtn = $('#export');

  const a11 = $('#a11'), a12 = $('#a12'), a21 = $('#a21'), a22 = $('#a22');
  const matrixOut = $('#matrixOut');

  const canvas2d  = $('#canvas2d');
  const stageMsg  = $('#stageMsg');
  const threeRoot = $('#threeRoot');

  // Default mode: 3D (old style feel)
  let mode = '3d';
  let raf = null;
  let three = null;

  // ---------- Utils ----------
  function prettyMatrixText(m){
    return `[ ${m[0][0]} ${m[0][1]}\n  ${m[1][0]} ${m[1][1]} ]`;
  }
  function currentMatrix(){
    const A = [
      [ parseFloat(a11.value || 0), parseFloat(a12.value || 0) ],
      [ parseFloat(a21.value || 0), parseFloat(a22.value || 0) ],
    ];
    matrixOut.textContent = prettyMatrixText(A);
    return A;
  }
  function setMatrix(A){
    a11.value = A[0][0]; a12.value = A[0][1];
    a21.value = A[1][0]; a22.value = A[1][1];
    currentMatrix();
  }
  function applyPreset(name){
    const d2r = (d)=> d*Math.PI/180;
    switch(name){
      case 'identity': setMatrix([[1,0],[0,1]]); break;
      case 'scaleUp': setMatrix([[1.5,0],[0,1.5]]); break;
      case 'scaleDown': setMatrix([[0.6,0],[0,0.6]]); break;
      case 'rotate30': {
        const c=Math.cos(d2r(30)), s=Math.sin(d2r(30));
        setMatrix([[c,-s],[s,c]]);
      } break;
      case 'shearX': setMatrix([[1,0.6],[0,1]]); break;
      case 'reflectX': setMatrix([[1,0],[0,-1]]); break;
      case 'reflectY': setMatrix([[-1,0],[0,1]]); break;
    }
  }

  // ---------- 2D drawing (dark theme to match stage) ----------
  const ctx = canvas2d.getContext('2d', { alpha:false });

  function resize2D(){
    const rect = canvas2d.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas2d.width  = Math.floor(rect.width * dpr);
    canvas2d.height = Math.floor(rect.height * dpr);
    canvas2d.style.width  = rect.width + 'px';
    canvas2d.style.height = rect.height + 'px';
    ctx.setTransform(dpr,0,0,dpr,0,0);
  }

  function draw2D(){
    const rect = canvas2d.getBoundingClientRect();
    const w = rect.width, h = rect.height;

    // background
    ctx.fillStyle = '#0d1117'; ctx.fillRect(0,0,w,h);

    const xrange = 10, yrange = 10;
    const xMin=-xrange, xMax=+xrange, yMin=-yrange, yMax=+yrange;
    const x2s = x => (x - xMin)/(xMax-xMin)*w;
    const y2s = y => h - (y - yMin)/(yMax-yMin)*h;

    // grid
    ctx.strokeStyle = '#21262d'; ctx.lineWidth = 1;
    ctx.beginPath();
    for(let x=Math.ceil(xMin); x<=Math.floor(xMax); x+=1){
      const sx = x2s(x); ctx.moveTo(sx,0); ctx.lineTo(sx,h);
    }
    for(let y=Math.ceil(yMin); y<=Math.floor(yMax); y+=1){
      const sy = y2s(y); ctx.moveTo(0,sy); ctx.lineTo(w,sy);
    }
    ctx.stroke();

    // axes
    ctx.strokeStyle = '#30363d'; ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, y2s(0)); ctx.lineTo(w, y2s(0));
    ctx.moveTo(x2s(0), 0); ctx.lineTo(x2s(0), h);
    ctx.stroke();

    // transform
    const A = currentMatrix();
    const T = (x,y)=> [ A[0][0]*x + A[0][1]*y, A[1][0]*x + A[1][1]*y ];

    const square = [[0,0],[1,0],[1,1],[0,1],[0,0]];
    // original
    ctx.strokeStyle = '#8b949e'; ctx.lineWidth = 1.8;
    ctx.beginPath();
    square.forEach((p,i)=>{ const [sx,sy]=[x2s(p[0]), y2s(p[1])]; i?ctx.lineTo(sx,sy):ctx.moveTo(sx,sy); });
    ctx.stroke();

    // transformed
    const sqT = square.map(([x,y])=> T(x,y));
    ctx.strokeStyle = '#58a6ff'; ctx.lineWidth = 2.5;
    ctx.beginPath();
    sqT.forEach((p,i)=>{ const [sx,sy]=[x2s(p[0]), y2s(p[1])]; i?ctx.lineTo(sx,sy):ctx.moveTo(sx,sy); });
    ctx.stroke();

    // basis
    const e1=[1,0], e2=[0,1], Ae1=T(1,0), Ae2=T(0,1);
    function arrow(from, to, color){
      const [x1,y1]=from, [x2,y2]=to;
      const dx=x2-x1, dy=y2-y1; const L=Math.hypot(dx,dy)||1;
      const ux=dx/L, uy=dy/L;
      const ah=0.25, aw=0.14;
      const hx=x2-ux*ah, hy=y2-uy*ah;
      const p1=[hx + (-uy)*aw, hy + (ux)*aw];
      const p2=[hx - (-uy)*aw, hy - (ux)*aw];
      ctx.strokeStyle=color; ctx.fillStyle=color; ctx.lineWidth=2.2;
      ctx.beginPath(); ctx.moveTo(x2s(x1),y2s(y1)); ctx.lineTo(x2s(x2),y2s(y2)); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x2s(x2),y2s(y2)); ctx.lineTo(x2s(p1[0]),y2s(p1[1])); ctx.lineTo(x2s(p2[0]),y2s(p2[1])); ctx.closePath(); ctx.fill();
    }
    arrow([0,0], e1, '#3fb950');
    arrow([0,0], e2, '#d29922');
    arrow([0,0], Ae1, '#3fb950');
    arrow([0,0], Ae2, '#d29922');
  }

  // ---------- 3D ----------
  async function ensureTHREE(){
    if (window.THREE) return window.THREE;
    await new Promise(res => setTimeout(res, 30));
    if (window.THREE) return window.THREE;
    let tries = 0;
    return await new Promise((resolve,reject)=>{
      const id = setInterval(()=>{
        tries++;
        if (window.THREE){ clearInterval(id); resolve(window.THREE); }
        if (tries>100){ clearInterval(id); reject(new Error('THREE not available')); }
      }, 30);
    });
  }

  async function init3D(){
    if (three) return three;
    const THREE = await ensureTHREE();

    // OrbitControls via ESM CDN (rewrites bare 'three' import)
    const { OrbitControls } = await import('https://esm.sh/three@0.160.0/examples/jsm/controls/OrbitControls.js');

    // DARK background for contrast
    const scene = new THREE.Scene(); scene.background = new THREE.Color(0x0d1117);
    const camera = new THREE.PerspectiveCamera(60, 2, 0.1, 1000); camera.position.set(6,6,8);
    const renderer = new THREE.WebGLRenderer({ antialias:true, preserveDrawingBuffer:true });
    renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));
    threeRoot.innerHTML = ''; threeRoot.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; controls.dampingFactor = .07;

    scene.add(new THREE.HemisphereLight(0xffffff, 0x202020, .9));
    const dl = new THREE.DirectionalLight(0xffffff, .6); dl.position.set(5,10,7); scene.add(dl);

    const axes = new THREE.AxesHelper(10); scene.add(axes);
    const grid = new THREE.GridHelper(40,40, 0x30363d, 0x21262d);
    grid.material.transparent = true; grid.material.opacity = .7; scene.add(grid);

    // Basis and transformed basis
    const arrowE1  = new THREE.ArrowHelper(new THREE.Vector3(1,0,0), new THREE.Vector3(), 1, 0x3fb950, .22, .12);
    const arrowE2  = new THREE.ArrowHelper(new THREE.Vector3(0,1,0), new THREE.Vector3(), 1, 0xd29922, .22, .12);
    const arrowAE1 = new THREE.ArrowHelper(new THREE.Vector3(1,0,0), new THREE.Vector3(), 1, 0x58a6ff, .22, .12);
    const arrowAE2 = new THREE.ArrowHelper(new THREE.Vector3(0,1,0), new THREE.Vector3(), 1, 0x58a6ff, .22, .12);
    scene.add(arrowE1, arrowE2, arrowAE1, arrowAE2);

    function resize(){
      const rect = threeRoot.getBoundingClientRect();
      renderer.setSize(rect.width, rect.height, false);
      camera.aspect = Math.max(0.0001, rect.width/Math.max(1,rect.height));
      camera.updateProjectionMatrix();
    }

    function updateArrows(){
      const A = currentMatrix();
      const e1 = new THREE.Vector2(1,0), e2 = new THREE.Vector2(0,1);
      const Ae1 = new THREE.Vector2(A[0][0]*e1.x + A[0][1]*e1.y, A[1][0]*e1.x + A[1][1]*e1.y);
      const Ae2 = new THREE.Vector2(A[0][0]*e2.x + A[0][1]*e2.y, A[1][0]*e2.x + A[1][1]*e2.y);
      const len1 = Math.max(0.001, Ae1.length());
      const len2 = Math.max(0.001, Ae2.length());
      arrowAE1.setDirection(new THREE.Vector3(Ae1.x, Ae1.y, 0).normalize()); arrowAE1.setLength(len1);
      arrowAE2.setDirection(new THREE.Vector3(Ae2.x, Ae2.y, 0).normalize()); arrowAE2.setLength(len2);
    }

    function render(){ controls.update(); renderer.render(scene, camera); }
    function animate(){ raf = requestAnimationFrame(animate); render(); }

    three = { THREE, scene, camera, renderer, controls, resize, updateArrows, animate };
    resize(); updateArrows(); animate();
    return three;
  }

  // ---------- Mode switching ----------
  function setMode(next){
    mode = next;
    localStorage.setItem('graph-mode', next);
    history.replaceState(null, '', next === '3d' ? '#3d' : '#2d');

    if (mode === '2d'){
      canvas2d.style.display = 'block';
      threeRoot.style.display = 'none';
      if (raf) { cancelAnimationFrame(raf); raf = null; }
      resize2D(); draw2D();
    } else {
      canvas2d.style.display = 'none';
      threeRoot.style.display = 'block';
      init3D().then(t=>{
        t.resize();
        t.updateArrows();
        if (!raf) t.animate();
      }).catch(err=>{
        stageMsg.textContent = '3D failed to initialize: '+err.message;
        stageMsg.hidden = false;
      });
    }
  }

  // ---------- Events ----------
  window.addEventListener('resize', ()=>{
    if (mode==='2d'){ resize2D(); draw2D(); }
    else if (three){ three.resize(); }
  });

  [a11,a12,a21,a22].forEach(inp=>{
    inp.addEventListener('input', ()=>{
      currentMatrix();
      if (mode==='2d'){ draw2D(); }
      else if (three){ three.updateArrows(); }
    });
  });

  presetSel.addEventListener('change', ()=>{
    applyPreset(presetSel.value);
    if (mode==='2d'){ draw2D(); }
    else if (three){ three.updateArrows(); }
  });

  resetBtn.addEventListener('click', ()=>{
    setMatrix([[1,0],[0,1]]);
    if (mode==='2d'){ draw2D(); }
    else if (three){ three.updateArrows(); }
  });

  applyBtn.addEventListener('click', ()=>{
    currentMatrix();
    if (mode==='2d'){ draw2D(); }
    else if (three){ three.updateArrows(); }
  });

  exportBtn.addEventListener('click', ()=>{
    if (mode==='2d'){
      const url = canvas2d.toDataURL('image/png');
      const a = document.createElement('a'); a.href=url; a.download='g6labs_graph2d.png'; a.click();
    } else if (three){
      const url = three.renderer.domElement.toDataURL('image/png');
      const a = document.createElement('a'); a.href=url; a.download='g6labs_graph3d.png'; a.click();
    }
  });

  modeSel.addEventListener('change', ()=> setMode(modeSel.value));

  // ---------- Init ----------
  document.addEventListener('DOMContentLoaded', ()=>{
    currentMatrix();
    applyPreset('identity');
    modeSel.value = '3d';
    setMode('3d');
  });
})();
