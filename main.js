(()=>{
const root=document.documentElement, rm=matchMedia('(prefers-reduced-motion:reduce)').matches;
root.classList.add('js');

/* 開いたときのロゴアニメーション (流れは style.css の説明を参照)。終わったらヒーローの登場アニメーション (.play) へ */
/* 立ち絵の読み込みが終わってから登場アニメーションを始める (遅い回線で途中から絵がパッと出ないように)。最大2.5秒待つ */
const artImg=document.querySelector('.stage .art');
const artReady=new Promise(res=>{
  if(!artImg||artImg.complete&&artImg.naturalWidth)return res();
  artImg.addEventListener('load',res,{once:true});artImg.addEventListener('error',res,{once:true});setTimeout(res,2500);
});
const play=()=>artReady.then(()=>root.classList.add('play'));
const scr=document.querySelector('.intro-screen');
if(root.classList.contains('intro')&&scr){
  let out=false;
  const finish=()=>{
    if(out)return;out=true;
    /* 穴が開き始めたら (0.3秒) 隠してあった立ち絵や文字をふわっと出す。穴の向こうで出てくるように見える */
    root.classList.add('intro-out');setTimeout(play,300);
    try{sessionStorage.setItem('intro','1')}catch{}
    setTimeout(()=>{scr.remove();root.classList.remove('intro','intro-go','intro-out')},2350);
  };
  const go=()=>{if(out||root.classList.contains('intro-go'))return;root.classList.add('intro-go');setTimeout(finish,2900)};
  /* 3枚の画像が読めてから始める。遅いときも1.5秒で始める */
  Promise.all([...scr.querySelectorAll('img')].map(i=>i.decode?i.decode().catch(()=>{}):null)).then(go);
  setTimeout(go,1500);
  scr.addEventListener('click',finish);
  addEventListener('keydown',finish,{once:true});
}else play();

/* メニュー: 三本線で開閉。項目を選ぶ・Esc・もう一度押すで閉じる */
const nav=document.querySelector('.nav'), links=[...document.querySelectorAll('.menu-links a')], menuBtn=document.querySelector('.menu-btn');
const setMenu=open=>{
  nav.classList.toggle('open',open);root.classList.toggle('menu-open',open);
  menuBtn.setAttribute('aria-expanded',open);menuBtn.setAttribute('aria-label',open?'メニューを閉じる':'メニューを開く');
};
menuBtn.addEventListener('click',()=>setMenu(!nav.classList.contains('open')));
links.forEach(a=>a.addEventListener('click',()=>setMenu(false)));
document.getElementById('menu').addEventListener('click',e=>{if(e.target.id==='menu')setMenu(false)});
addEventListener('keydown',e=>{if(e.key==='Escape'&&nav.classList.contains('open')){setMenu(false);menuBtn.focus()}});

/* スクロールしたらボタンの背景を濃くし、メニューの中の今いる項目を光らせる */
const onScroll=()=>nav.classList.toggle('scrolled',scrollY>40);
onScroll();addEventListener('scroll',onScroll,{passive:true});
const sections=links.map(a=>document.querySelector(a.hash)).filter(Boolean);
const seen=new Map();
const spy=new IntersectionObserver(es=>{
  es.forEach(e=>seen.set(e.target,e.isIntersecting));
  const cur=sections.find(s=>seen.get(s));
  links.forEach(a=>a.classList.toggle('on',!!cur&&a.hash==='#'+cur.id));
},{rootMargin:'-45% 0px -50% 0px'});
sections.forEach(s=>spy.observe(s));

/* 項目がふわっと出てくる */
const reveals=document.querySelectorAll('.reveal');
if(rm||!('IntersectionObserver' in window))reveals.forEach(r=>r.classList.add('in'));
else{
  const io=new IntersectionObserver((es,o)=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');o.unobserve(e.target)}}),{threshold:.12});
  reveals.forEach(r=>io.observe(r));
}

/* メールアドレスをコピー */
document.querySelectorAll('[data-copy]').forEach(b=>b.addEventListener('click',async()=>{
  try{await navigator.clipboard.writeText(b.dataset.copy)}catch{return}
  const t=b.textContent;b.textContent='コピーしました';b.classList.add('done');
  setTimeout(()=>{b.textContent=t;b.classList.remove('done')},1800);
}));

/* 星座盤 (ホロスコープ風): 金の細い線の多重円。外側 (目盛り・12星座の記号) と内側 (12分割・放射線・星形) が逆向きにゆっくり回る。
   記号は12星座のみで、数字やアルファベットは入れない */
const wOut=document.getElementById('wheel-outer'), wIn=document.getElementById('wheel-inner');
if(wOut&&wIn){
  const NS='http://www.w3.org/2000/svg', D=Math.PI/180;
  const P=(r,deg)=>[(r*Math.sin(deg*D)).toFixed(2),(-r*Math.cos(deg*D)).toFixed(2)];
  const add=(g,tag,attrs,cls)=>{const e=document.createElementNS(NS,tag);for(const k in attrs)e.setAttribute(k,attrs[k]);if(cls)e.setAttribute('class',cls);g.append(e);return e};
  const ring=(g,r,cls)=>add(g,'circle',{r},cls);
  const spoke=(g,r1,r2,deg,cls)=>{const[a,b]=P(r1,deg),[c,d]=P(r2,deg);return add(g,'line',{x1:a,y1:b,x2:c,y2:d},cls)};
  const sparkle=(g,r,deg,s,cls)=>{const[x,y]=P(r,deg);add(g,'path',{d:`M${x} ${+y-s}Q${x} ${y} ${+x+s} ${y}Q${x} ${y} ${x} ${+y+s}Q${x} ${y} ${+x-s} ${y}Q${x} ${y} ${x} ${+y-s}Z`},cls)};

  /* 外側: 二重の縁、細かい目盛り、12星座の帯 */
  [194,189,181].forEach(r=>ring(wOut,r,'w-ring'));
  for(let a=0;a<360;a+=2)spoke(wOut,a%10?184:178,189,a,a%10?'w-tick':'w-tick major');
  ring(wOut,176,'w-ring');
  for(let k=0;k<12;k++){
    spoke(wOut,146,176,k*30,'w-ring');
    const deg=-(k*30+15), [x,y]=P(161,deg); /* 本来のホロスコープと同じく反時計回りに おひつじ→おうし→… */
    const t=add(wOut,'text',{x,y,transform:`rotate(${deg} ${x} ${y})`},'w-sign');
    t.textContent=String.fromCodePoint(0x2648+k)+'\uFE0E';
  }
  ring(wOut,146,'w-ring');ring(wOut,142,'w-ring thin');
  /* 光の点 */
  [[189,40,4],[146,160,3.2],[176,250,3.6],[194,312,2.8]].forEach(([r,a,s])=>sparkle(wOut,r,a,s*2.2,'w-light'));

  /* 内側: 12分割の帯、星形の結び線、放射線、中心 */
  for(let k=0;k<12;k++){
    spoke(wIn,112,142,k*30+15,'w-ring');
    sparkle(wIn,127,k*30,k%3?2.2:3.4,'w-mark');
    const[x,y]=P(127,k*30+15);add(wIn,'circle',{cx:x,cy:y,r:1.1},'w-dot');
  }
  ring(wIn,112,'w-ring');ring(wIn,96,'w-ring dash');
  /* 真ん中は控えめに: 12本の線は内側の輪 (r=66) までで止め、中心は小さな輪と点と星だけ (多いとやかましく、無いとさみしい) */
  for(let k=0;k<12;k++)spoke(wIn,66,112,k*30,"w-ring thin");
  ring(wIn,66,"w-ring thin");
  ring(wIn,30,"w-ring thin");
  for(let k=0;k<8;k++){const[x,y]=P(46,k*45+22.5);add(wIn,"circle",{cx:x,cy:y,r:.9},"w-dot")}
  sparkle(wIn,0,0,7,"w-light soft");
  [[96,205,3.4],[112,330,2.6]].forEach(([r,a,s])=>sparkle(wIn,r,a,s*2.2,'w-light'));
}

/* マウスに合わせて星空がわずかに流れる (立ち絵は動かさない) */
let tx=0,ty=0,mx=0,my=0,sy=scrollY;
if(!rm&&matchMedia('(pointer:fine)').matches){
  addEventListener('pointermove',e=>{tx=e.clientX/innerWidth-.5;ty=e.clientY/innerHeight-.5},{passive:true});
}
addEventListener('scroll',()=>{sy=scrollY},{passive:true});

/* 星空 */
const c=document.getElementById('stars'),g=c.getContext('2d');
let W,H,S=[],M=null,T=3000;
const COLORS=['255,255,255','255,255,255','255,255,255','207,228,255','243,203,114','139,242,228'];
function size(){
  const d=Math.min(devicePixelRatio||1,2);W=innerWidth;H=innerHeight;
  c.width=W*d;c.height=H*d;g.setTransform(d,0,0,d,0,0);
  S=Array.from({length:Math.min(220,W*H/6500|0)},()=>{
    const big=Math.random()<.06;
    return{x:Math.random()*W,y:Math.random()*H,r:big?Math.random()*2+2.2:Math.random()*1.1+.3,z:Math.random()*.8+.2,
      p:Math.random()*6.3,s:Math.random()*.8+.4,big,c:big?COLORS[3+(Math.random()*3|0)]:COLORS[Math.random()*COLORS.length|0]};
  });
  if(rm)draw(0);
}
/* 星座: 実際の赤経(時)・赤緯(度)から形を作る。at は置き場所 (横は画面幅、縦は画面2枚分の空に対する割合) */
const CONS=[
  {jp:'北斗七星',en:'URSA MAJOR',at:[.8,1.3],
   s:[[11.062,61.75],[11.031,56.38],[11.897,53.69],[12.257,57.03],[12.901,55.96],[13.399,54.93],[13.792,49.31]],
   l:[[0,1],[1,2],[2,3],[3,0],[3,4],[4,5],[5,6]]},
  {jp:'カシオペヤ座',en:'CASSIOPEIA',at:[.86,.62],
   s:[[0.153,59.15],[0.675,56.54],[0.945,60.72],[1.430,60.24],[1.907,63.67]],
   l:[[0,1],[1,2],[2,3],[3,4]]},
  {jp:'オリオン座',en:'ORION',at:[.1,.98],
   s:[[5.919,7.41],[5.419,6.35],[5.679,-1.94],[5.604,-1.2],[5.533,-.3],[5.796,-9.67],[5.242,-8.2],[5.586,9.93]],
   l:[[0,1],[0,2],[1,4],[2,3],[3,4],[2,5],[4,6],[7,0],[7,1]]},
  {jp:'はくちょう座',en:'CYGNUS',at:[.12,1.72],
   s:[[20.691,45.28],[20.371,40.26],[19.512,27.96],[20.770,33.97],[19.749,45.13]],
   l:[[0,1],[1,2],[4,1],[1,3]]},
].map(k=>{
  const ra0=k.s.reduce((a,p)=>a+p[0],0)/k.s.length, de0=k.s.reduce((a,p)=>a+p[1],0)/k.s.length, cd=Math.cos(de0*Math.PI/180);
  /* 空を見上げた向き: 東(赤経が大きい方)が左 */
  return{...k,p:k.s.map(([ra,de])=>[-(ra-ra0)*15*cd,-(de-de0)])};
});
function drawSky(){
  const deg=Math.min(W,1000)/62, band=H*2;
  /* 星図の座標線: 画面の外にある天の北極を中心にした赤緯の円と、15°ごとの赤経の線 */
  const px=W*1.05-mx*10, py=-H*.35-((sy*.05)%140)-my*8;
  g.save();g.strokeStyle='rgba(185,168,255,.07)';g.lineWidth=1;g.setLineDash([2,6]);
  const R=Math.hypot(W+Math.abs(px),H*1.4+Math.abs(py));
  for(let r=140;r<R;r+=140){g.beginPath();g.arc(px,py,r,0,6.283);g.stroke()}
  for(let a=0;a<360;a+=15){const t=a*Math.PI/180;g.beginPath();g.moveTo(px,py);g.lineTo(px+Math.cos(t)*R,py+Math.sin(t)*R);g.stroke()}
  g.restore();
  /* 星座の線と星 (名前などの文字は入れない) */
  for(const k of CONS){
    const cx=k.at[0]*W-mx*14, cy=((k.at[1]*H-sy*.12-my*10)%band+band)%band;
    if(cy<-300||cy>H+300)continue;
    const pts=k.p.map(([x,y])=>[cx+x*deg,cy+y*deg]);
    g.strokeStyle='rgba(185,168,255,.28)';g.lineWidth=1;g.beginPath();
    for(const[a,b]of k.l){g.moveTo(...pts[a]);g.lineTo(...pts[b])}
    g.stroke();
    g.fillStyle='rgba(240,236,255,.85)';
    for(const[x,y]of pts){g.beginPath();g.arc(x,y,1.7,0,6.283);g.fill()}
  }
}
function sparkle(x,y,r){
  g.beginPath();g.moveTo(x,y-r*2.4);g.quadraticCurveTo(x,y,x+r*2.4,y);g.quadraticCurveTo(x,y,x,y+r*2.4);g.quadraticCurveTo(x,y,x-r*2.4,y);g.quadraticCurveTo(x,y,x,y-r*2.4);g.fill();
}
function draw(t){
  mx+=(tx-mx)*.04;my+=(ty-my)*.04;
  g.clearRect(0,0,W,H);
  drawSky();
  for(const s of S){
    const tw=rm?.8:.5+.5*Math.sin(t*.001*s.s+s.p);
    const x=((s.x-mx*s.z*18)%W+W)%W, y=((s.y-sy*s.z*.08-my*s.z*12)%H+H)%H;
    g.fillStyle=`rgba(${s.c},${.25+.7*tw})`;
    if(s.big){g.shadowColor=`rgba(${s.c},.8)`;g.shadowBlur=8;sparkle(x,y,s.r*(.7+.3*tw));g.shadowBlur=0}
    else{g.beginPath();g.arc(x,y,s.r,0,6.283);g.fill()}
  }
  if(!rm){
    if(!M&&t>T){M={x:Math.random()*W*.6+W*.4,y:Math.random()*H*.3,k:0};T=t+8000+Math.random()*8000}
    if(M){
      M.k+=.014;const k=M.k,hx=M.x-k*560,hy=M.y+k*240,ex=hx+150,ey=hy-64;
      const gr=g.createLinearGradient(ex,ey,hx,hy);gr.addColorStop(0,'rgba(139,242,228,0)');gr.addColorStop(1,'rgba(240,250,255,.95)');
      g.globalAlpha=Math.sin(Math.min(k,1)*Math.PI);g.strokeStyle=gr;g.lineWidth=1.6;g.lineCap='round';
      g.beginPath();g.moveTo(ex,ey);g.lineTo(hx,hy);g.stroke();g.globalAlpha=1;
      if(k>=1)M=null;
    }
  }
}
function loop(t){draw(t);requestAnimationFrame(loop)}
size();
if(rm&&document.fonts)document.fonts.ready.then(()=>draw(0));
let rz;addEventListener('resize',()=>{clearTimeout(rz);rz=setTimeout(size,150)});
if(!rm)requestAnimationFrame(loop);
})();
