(()=>{
const root=document.documentElement, rm=matchMedia('(prefers-reduced-motion:reduce)').matches;
root.classList.add('js');

/* 名前を一文字ずつ登場させる */
const h1=document.querySelector('h1');
if(!rm){
  const t=h1.textContent; h1.setAttribute('aria-label',t); h1.textContent='';
  [...t].forEach((s,i)=>{const e=document.createElement('span');e.className='ch';e.setAttribute('aria-hidden','true');e.style.setProperty('--i',i);e.textContent=s;h1.append(e)});
}

/* マウスに合わせてイラストと光が動く */
let tx=0,ty=0,mx=0,my=0,sy=scrollY;
addEventListener('pointermove',e=>{
  tx=e.clientX/innerWidth-.5; ty=e.clientY/innerHeight-.5;
  root.style.setProperty('--px',tx*2); root.style.setProperty('--py',ty*2);
  root.style.setProperty('--cx',e.clientX+'px'); root.style.setProperty('--cy',e.clientY+'px');
},{passive:true});
addEventListener('scroll',()=>{sy=scrollY},{passive:true});

/* 星空 */
const c=document.getElementById('sky'),g=c.getContext('2d');
let W,H,S=[],P=[],M=null,T=2500;
function size(){
  const d=Math.min(devicePixelRatio||1,2);W=innerWidth;H=innerHeight;
  c.width=W*d;c.height=H*d;g.setTransform(d,0,0,d,0,0);
  S=Array.from({length:Math.min(170,W*H/8500|0)},()=>({x:Math.random()*W,y:Math.random()*H,r:Math.random()*1.2+.3,z:Math.random()*.8+.2,p:Math.random()*6.3,c:Math.random()<.1?'226,178,79':'255,255,255'}));
  P=Array.from({length:34},()=>({x:Math.random()*W,y:Math.random()*H,r:Math.random()*1.5+.6,v:Math.random()*.25+.08,p:Math.random()*6.3}));
  if(rm)draw(0);
}
function draw(t){
  mx+=(tx-mx)*.05;my+=(ty-my)*.05;
  g.clearRect(0,0,W,H);
  for(const s of S){
    const a=rm?.7:.45+.55*Math.abs(Math.sin(t*.0006*s.z+s.p));
    const x=((s.x-mx*s.z*28)%W+W)%W, y=((s.y-sy*s.z*.12-my*s.z*28)%H+H)%H;
    g.fillStyle=`rgba(${s.c},${a})`;g.beginPath();g.arc(x,y,s.r,0,6.283);g.fill();
  }
  for(const q of P){
    if(!rm){q.y-=q.v;if(q.y<-5)q.y=H+5}
    const x=q.x+Math.sin(t*.0005+q.p)*14, a=.2+.35*Math.sin(t*.001+q.p)**2;
    g.fillStyle=`rgba(111,220,230,${a})`;g.beginPath();g.arc(x,q.y,q.r,0,6.283);g.fill();
  }
  if(!rm){
    if(!M&&t>T){M={x:Math.random()*W*.7+W*.3,y:Math.random()*H*.35,k:0};T=t+7000+Math.random()*6000}
    if(M){
      M.k+=.016;const k=M.k,hx=M.x-k*520,hy=M.y+k*300,tx2=hx+120,ty2=hy-69;
      const gr=g.createLinearGradient(tx2,ty2,hx,hy);gr.addColorStop(0,'rgba(226,178,79,0)');gr.addColorStop(1,'rgba(255,236,190,.95)');
      g.globalAlpha=Math.sin(Math.min(k,1)*Math.PI);g.strokeStyle=gr;g.lineWidth=1.8;g.beginPath();g.moveTo(tx2,ty2);g.lineTo(hx,hy);g.stroke();g.globalAlpha=1;
      if(k>=1)M=null;
    }
  }
}
function loop(t){draw(t);requestAnimationFrame(loop)}
size();addEventListener('resize',size);
if(!rm)requestAnimationFrame(loop);

/* 星座のプロフィール */
const map=document.getElementById('map'),info=document.getElementById('info'),nodes=[...map.querySelectorAll('.node')];
function pick(n){
  nodes.forEach(m=>m.classList.toggle('on',m===n));
  info.innerHTML='';const k=document.createElement('strong');k.textContent=n.dataset.k;
  info.append(k,n.dataset.v);
}
nodes.forEach(n=>['pointerenter','focus','click'].forEach(ev=>n.addEventListener(ev,()=>pick(n))));
pick(nodes[1]);
if(rm)map.classList.add('in');
else new IntersectionObserver((es,o)=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');o.unobserve(e.target)}}),{threshold:.4}).observe(map);
})();
