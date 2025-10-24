/* ===================== THEME ======================= */
const root=document.documentElement;
let currentTheme="peach";
document.querySelectorAll(".theme-switch button[data-theme]").forEach(b=>{
  b.addEventListener("click",()=>{
    document.querySelectorAll(".theme-switch button[data-theme]").forEach(x=>x.classList.remove("active"));
    b.classList.add("active");
    const t=b.dataset.theme; currentTheme=t;
    root.classList.toggle("theme-mint",t==="mint");
    root.classList.toggle("theme-night",t==="night");
    if(t==="peach"){ root.classList.remove("theme-mint","theme-night"); }
  });
});

/* ===================== TOOLBAR (AÇILIR) ======================= */
const toolbar  = document.getElementById("toolbar");
const toolbarToggle = document.getElementById("toolbarToggle");
const toolbarTray   = document.getElementById("toolbarTray");
const revealZone    = document.getElementById("revealZone");

let isOpen = !toolbar.classList.contains("collapsed");
let hideT  = null;
let animT  = null;

function setToolbar(open){
  if (open === isOpen) return;
  isOpen = open;
  clearTimeout(animT);
  toolbar.classList.toggle("collapsed", !open);
  toolbarToggle.setAttribute("aria-expanded", String(open));
  toolbarTray.setAttribute("aria-hidden",   String(!open));
  syncToolbarH();
  animT = setTimeout(syncToolbarH, 150);
}
function toggleToolbar(){ setToolbar(!isOpen); }
toolbarToggle.addEventListener("click", toggleToolbar);

function scheduleHide(ms = 1400){
  clearTimeout(hideT);
  hideT = setTimeout(() => {
    if (document.body.classList.contains("celebrating")) setToolbar(false);
  }, ms);
}
revealZone.addEventListener("mouseenter", () => {
  if (document.body.classList.contains("celebrating") && !isOpen) {
    setToolbar(true); scheduleHide();
  }
});
revealZone.addEventListener("mousemove", () => { if (isOpen) scheduleHide(); });
toolbar.addEventListener("pointerenter", () => clearTimeout(hideT));
toolbar.addEventListener("pointerleave", () => {
  if (document.body.classList.contains("celebrating") && isOpen) scheduleHide(900);
});
document.addEventListener("pointerdown", (e) => {
  if (!toolbar.contains(e.target) && isOpen && document.body.classList.contains("celebrating")) setToolbar(false);
});
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && isOpen) setToolbar(false); });
toolbarTray.addEventListener("focusin",  () => clearTimeout(hideT));
toolbarTray.addEventListener("focusout", () => { if (document.body.classList.contains("celebrating") && isOpen) scheduleHide(900); });

function syncToolbarH(){
  const h = Math.max(48, toolbar.getBoundingClientRect().height || 56);
  document.documentElement.style.setProperty("--toolbar-h", h + "px");
}
syncToolbarH();
addEventListener("resize",            syncToolbarH, { passive:true });
addEventListener("orientationchange", syncToolbarH);

/* ===================== CAKE SVG ======================= */
const svg=document.getElementById("cake");
const gLayers=document.getElementById("layers");
const creamPath=document.getElementById("creamPath");
const dripDots=document.getElementById("dripDots");
const gCandles=document.getElementById("candles");
const cakeWrap=document.getElementById("cakeWrap");
function cssVar(n){ return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); }
function setVar(n,v){ root.style.setProperty(n,v); }

const geom={ x:80, w:160, lh:24, lg:3, topY:116, plateY:232, creamY:84, creamH:30 };

function rebuildView(plateY){
  const topPad = 2;        
  const bottomPad = 6;     
  const plate=svg.querySelector("#plate");
  plate.setAttribute("y",plateY);
  const vbH = plateY + bottomPad + topPad;
  svg.setAttribute("viewBox",`0 ${-topPad} 320 ${vbH}`);
  cakeWrap.style.aspectRatio=`320/${plateY + bottomPad}`;
}

function buildLayers(n){
  gLayers.innerHTML="";
  const x=geom.x,w=geom.w,h=geom.lh,g=geom.lg,start=geom.topY;
  for(let i=0;i<n;i++){
    const r=document.createElementNS("http://www.w3.org/2000/svg","rect");
    r.setAttribute("class","layer"); r.setAttribute("x",x); r.setAttribute("y",start+i*(h+g));
    r.setAttribute("width",w); r.setAttribute("height",h); r.setAttribute("rx",10);
    r.style.animationDelay=(0.25+i*0.18).toFixed(2)+"s";
    r.setAttribute("fill", i%2 ? cssVar("--cake-mid") : cssVar("--cake-dark"));
    gLayers.appendChild(r);
  }
  const lastY=start+(n-1)*(h+g);
  const plateY=Math.max(lastY+h+16, geom.plateY);
  rebuildView(plateY);
  const frostDelay=0.25+(n-1)*0.18+0.55;
  document.getElementById("frosting").style.setProperty("--frostDelay",`${frostDelay}s`);
}

function buildCream(dripCount,amp){
  const x0=geom.x, w=geom.w, y=geom.creamY, h=geom.creamH;
  const seg=Math.max(1,dripCount), step=w/seg;
  let d=`M ${x0} ${y} H ${x0+w} V ${y+h-8}`;
  for(let i=0;i<seg;i++){
    const sx=x0+w-(i+0.5)*step;
    const cp1x=sx+step*0.25, cp2x=sx-step*0.25;
    const peakY=y+h+amp;
    d+=` C ${cp1x} ${y+h}, ${cp2x} ${peakY}, ${sx-step/2} ${y+h}`;
  }
  d+=` V ${y} Z`;
  creamPath.setAttribute("d",d);
  dripDots.innerHTML="";
  const dots=Math.min(6,seg);
  for(let i=0;i<dots;i++){
    const cx=x0+16+i*((w-32)/(dots-1||1));
    const c=document.createElementNS("http://www.w3.org/2000/svg","circle");
    c.setAttribute("cx",cx); c.setAttribute("cy",y+h-2); c.setAttribute("r",5);
    dripDots.appendChild(c);
  }
}

function buildCandles(n){
  gCandles.innerHTML=""; if(n<=0) return;
  const pad=18, x0=geom.x+pad, x1=geom.x+geom.w-pad, span=x1-x0;
  const yStick=geom.creamY-34, hStick=42;
  const baseDelay=parseFloat(getComputedStyle(document.getElementById("frosting")).getPropertyValue("--frostDelay"))||1.1;
  for(let i=0;i<n;i++){
    const cx=x0 + (n===1?span/2:i*(span/(n-1)));
    const x=Math.round(cx-6);
    const g=document.createElementNS("http://www.w3.org/2000/svg","g");
    g.setAttribute("class","candle"); g.style.animationDelay=(baseDelay+0.2+i*0.12)+"s";
    const stick=document.createElementNS("http://www.w3.org/2000/svg","rect");
    stick.setAttribute("class","c-stick"); stick.setAttribute("x",x); stick.setAttribute("y",yStick);
    stick.setAttribute("width",12); stick.setAttribute("height",hStick); stick.setAttribute("rx",6); g.appendChild(stick);
    for(let k=0;k<3;k++){
      const stripe=document.createElementNS("http://www.w3.org/2000/svg","rect");
      stripe.setAttribute("class","c-stripe"); stripe.setAttribute("x",x); stripe.setAttribute("y",yStick+8+k*11);
      stripe.setAttribute("width",12); stripe.setAttribute("height",4); stripe.setAttribute("rx",2); g.appendChild(stripe);
    }
    const flame=document.createElementNS("http://www.w3.org/2000/svg","ellipse");
    flame.setAttribute("class","flame"); flame.style.setProperty("--flameDelay",(baseDelay+0.5+i*0.12)+"s");
    flame.setAttribute("cx",x+6); flame.setAttribute("cy",yStick-8); flame.setAttribute("rx",7); flame.setAttribute("ry",9);
    const halo=document.createElementNS("http://www.w3.org/2000/svg","circle");
    halo.setAttribute("class","halo"); halo.setAttribute("cx",x+6); halo.setAttribute("cy",yStick-8); halo.setAttribute("r",20);
    g.appendChild(flame); g.appendChild(halo); gCandles.appendChild(g);
  }
}

buildLayers(3); buildCream(4,14); buildCandles(1);

/* ===================== NAME / CELEBRATE ======================= */
const form=document.getElementById("nameForm");
const input=document.getElementById("nameInput");
const nameText=document.getElementById("nameText");
let confTimer=null;

form.addEventListener("submit",e=>{
  e.preventDefault();
  const v=input.value.trim(); if(!v) return;
  nameText.textContent=v;
  form.classList.add("hide"); setTimeout(()=>{ form.style.display="none"; },450);
  nameText.classList.remove("show"); requestAnimationFrame(()=> setTimeout(()=> nameText.classList.add("show"), 40));
  burst(); 
  // Anlık balon patlaması
balloonBurst(28);

if (!balloonsOn) {
  balloonsOn = true;
  balloonBtn.classList.add("active");
  spawnBalloon();
  balloonTimer = setInterval(spawnBalloon, 900);
  setTimeout(() => {
    clearInterval(balloonTimer);
    balloonsOn = false;
    balloonBtn.classList.remove("active");
  }, 6000);
}

  if(!confTimer){ confTimer=startConfetti(); }
  document.body.classList.add("celebrating");
  setToolbar(false);
});

/* ===================== CONTROLS PANEL ======================= */
const controls=document.getElementById("controls");
const collapseBtn=document.getElementById("collapseBtn");
const controlsToggle=document.getElementById("controlsToggle");
controlsToggle.addEventListener("click", () => {
  const open = controls.classList.toggle("open");     
  controls.setAttribute("aria-hidden", String(!open));
  controlsToggle.setAttribute("aria-expanded", String(open));
  if (open) {                                         
    setToolbar(true);
    clearTimeout(hideT);
  }
});collapseBtn.addEventListener("click",()=>{ const c=controls.classList.toggle("collapsed"); collapseBtn.setAttribute("aria-expanded",(!c).toString()); });

/* ===================== BALLOONS ======================= */
const balloonBtn=document.getElementById("balloonBtn");
let balloonsOn=false, balloonTimer=null;
balloonBtn.addEventListener("click",()=> balloonBurst(20));
balloonBtn.addEventListener("dblclick",()=>{
  balloonsOn=!balloonsOn; balloonBtn.classList.toggle("active",balloonsOn);
  if(balloonsOn){ spawnBalloon(); balloonTimer=setInterval(spawnBalloon,900); }
  else { clearInterval(balloonTimer); document.querySelectorAll(".balloon").forEach(b=>b.remove()); }
});
function spawnBalloon(){
  const el=document.createElement("div");
  el.className="balloon";
  const hue=Math.floor(Math.random()*360);
  el.style.background=`hsl(${hue} 85% 62%)`;
  el.style.setProperty("--b-time",(2200+Math.random()*2000)+"ms");
  el.style.setProperty("--dx",(Math.random()*80-40)+"px");
  el.style.setProperty("--x",(5+Math.random()*90)+"vw");
  document.body.appendChild(el);
  setTimeout(()=>el.remove(),4200);
}
function balloonBurst(n=20){ for(let i=0;i<n;i++) setTimeout(spawnBalloon,i*60); }

/* ===================== CANDLES: BLOW TOGGLE (SMOKE) ======================= */
gCandles.addEventListener("click",()=>{
  const toBlown=!cakeWrap.classList.contains("blown");
  cakeWrap.classList.toggle("blown",toBlown);
  if(toBlown) smokeForCandles();
});
function smokeForCandles(){
  const box=cakeWrap.getBoundingClientRect();
  const flames=[...gCandles.querySelectorAll(".flame")];
  const vh=parseFloat(svg.getAttribute("viewBox").split(" ")[3]);
  flames.forEach(f=>{
    const cx=box.left + (parseFloat(f.getAttribute("cx"))/320)*box.width;
    const cy=box.top + (parseFloat(f.getAttribute("cy"))/vh)*box.height;
    for(let i=0;i<8;i++){
      const s=document.createElement("div");
      s.style.position="fixed"; s.style.left=(cx+(Math.random()*10-5))+"px"; s.style.top=(cy+(Math.random()*6-3))+"px";
      const size=6+Math.random()*8; s.style.width=size+"px"; s.style.height=size+"px";
      s.style.borderRadius="50%"; s.style.background="rgba(160,160,170,.35)"; s.style.filter="blur(.5px)";
      s.style.pointerEvents="none"; s.style.zIndex=8;
      const dx=(Math.random()*20-10), dy=-(40+Math.random()*30), t=700+Math.random()*700;
      document.body.appendChild(s);
      s.animate([{transform:"translate(0,0)",opacity:.6},{transform:`translate(${dx}px, ${dy}px)`,opacity:0}],{duration:t,easing:"ease-out",fill:"forwards"}).onfinish=()=>s.remove();
    }
  });
}

/* ===================== SLIDERS & COLORS ======================= */
const layerCount=document.getElementById("layerCount");
const layerCountVal=document.getElementById("layerCountVal");
const dripCount=document.getElementById("dripCount");
const dripCountVal=document.getElementById("dripCountVal");
const dripLen=document.getElementById("dripLen");
const dripLenVal=document.getElementById("dripLenVal");
const creamColor=document.getElementById("creamColor");
const cakeDark=document.getElementById("cakeDark");
const cakeLight=document.getElementById("cakeLight");
const candleCount=document.getElementById("candleCount");
const candleCountVal=document.getElementById("candleCountVal");

function applyColors(){ setVar("--cream",creamColor.value); setVar("--cake-dark",cakeDark.value); setVar("--cake-mid",cakeLight.value); }
[creamColor,cakeDark,cakeLight].forEach(i=> i.addEventListener("input",applyColors));

layerCount.addEventListener("input",()=>{ layerCountVal.textContent=layerCount.value; buildLayers(+layerCount.value); buildCandles(+candleCount.value); });
dripCount.addEventListener("input",()=>{ dripCountVal.textContent=dripCount.value; buildCream(+dripCount.value, +dripLen.value); });
dripLen.addEventListener("input",()=>{ dripLenVal.textContent=dripLen.value; buildCream(+dripCount.value, +dripLen.value); });
candleCount.addEventListener("input",()=>{ candleCountVal.textContent=candleCount.value; buildCandles(+candleCount.value); });

/* ===================== EXPORT & SHARE ======================= */
document.getElementById("reelsBtn").addEventListener("click",()=>{ document.body.classList.toggle("reels"); window.scrollTo({top:0,behavior:"instant"}); });

document.getElementById("pngBtn").addEventListener("click",async()=>{
  const el=document.getElementById("card");
  try{
    document.body.classList.add("png-export");
    const scale=(window.devicePixelRatio||1)*(document.body.classList.contains("reels")?1.4:1);
    const canvas=await html2canvas(el,{backgroundColor:getComputedStyle(document.documentElement).getPropertyValue("--bg")||"#ffffff",scale});
    document.body.classList.remove("png-export");
    const url=canvas.toDataURL("image/png");
    const who=(nameText.textContent||"birthday");
    const a=document.createElement("a"); a.href=url; a.download=`happy-birthday-${who}.png`; a.click();
  }catch(_){ document.body.classList.remove("png-export"); alert("PNG oluşturulamadı."); }
});

document.getElementById("waBtn").addEventListener("click",()=>{
  const who=(nameText.textContent||"🎉");
  const msg=`Mutlu yıllar ${who}! 🎉🎂`;
  window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`,"_blank");
});

/* ===================== REPLAY ======================= */
document.getElementById("replayBtn").addEventListener("click",()=>{
  setToolbar(true);
  form.style.display="flex"; form.classList.remove("hide");
  input.value=""; nameText.textContent=""; nameText.classList.remove("show");
  if(confTimer){ clearInterval(confTimer); confTimer=null; }
  document.querySelectorAll(".confetti").forEach(e=>e.remove());
  document.querySelectorAll(".balloon").forEach(e=>e.remove());
  cakeWrap.classList.remove("blown");
  document.body.classList.remove("celebrating","named");
});

/* ===================== CONFETTI ======================= */
const shapeSelect=document.getElementById("shapeSelect");
function startConfetti(){ return setInterval(()=>{const n=6+(Math.random()*3|0);for(let i=0;i<n;i++){piece("left");piece("right")}},420); }
function burst(){ for(let i=0;i<80;i++) setTimeout(()=>piece("burst"), i*6); }
function piece(side="left"){
  const shape=shapeSelect.value, s=(Math.random()*8+8)|0, color=confColor();
  const ns="http://www.w3.org/2000/svg"; const el=document.createElementNS(ns,"svg");
  el.setAttribute("class","confetti"); el.setAttribute("width",s); el.setAttribute("height",s);
  el.style.position="fixed"; el.style.zIndex=9; el.style.pointerEvents="none";
  const sh=(shape==="mix")?["square","circle","triangle","star","heart"][(Math.random()*5)|0]:shape; let node;
  if(sh==="circle"){ node=document.createElementNS(ns,"circle"); node.setAttribute("cx",s/2); node.setAttribute("cy",s/2); node.setAttribute("r",s/2); }
  else if(sh==="triangle"){ node=document.createElementNS(ns,"polygon"); node.setAttribute("points",`0,${s} ${s/2},0 ${s},${s}`); }
  else if(sh==="star"){ node=document.createElementNS(ns,"polygon"); node.setAttribute("points",starPoints(s,s*0.45,5).map(p=>p.join(",")).join(" ")); }
  else if(sh==="heart"){ node=document.createElementNS(ns,"path"); node.setAttribute("d",heartPath(s)); }
  else{ node=document.createElementNS(ns,"rect"); node.setAttribute("width",s); node.setAttribute("height",s); node.setAttribute("rx",2); }
  node.setAttribute("fill",color); el.appendChild(node); document.body.appendChild(el);
  if(side==="burst"){
    const box=cakeWrap.getBoundingClientRect();
    el.style.left=(box.left+box.width/2)+"px"; el.style.top=(box.top+box.height*.28)+"px"; el.style.transform="translate(-50%,-50%)";
    const dx=(Math.random()*2-1)*140, dy=(Math.random()*2-0.2)*180, rot=(Math.random()*2-1)*720;
    el.animate([{transform:"translate(-50%,-50%)",opacity:1},{transform:`translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) rotate(${rot}deg)`,opacity:0}],{duration:1300+Math.random()*450,easing:"cubic-bezier(.2,.8,.2,1)",fill:"forwards"}).onfinish=()=>el.remove();
  }else{
    const y=(Math.random()*80+8)+"vh"; el.style.setProperty("--y",y);
    const dur=(Math.random()*3+3).toFixed(2)+"s"; el.style.setProperty("--t",dur);
    el.classList.add(side==="left"?"from-left":"from-right"); el.style.top=y; (side==="left")?(el.style.left="-12px"):(el.style.right="-12px");
    setTimeout(()=>el.remove(), parseFloat(dur)*1000+150);
  }
}
function starPoints(size,inner,spikes){ const pts=[]; const cx=size/2,cy=size/2; let rot=Math.PI/2*3; const step=Math.PI/spikes; for(let i=0;i<spikes;i++){ pts.push([cx+Math.cos(rot)*size/2, cy+Math.sin(rot)*size/2]); rot+=step; pts.push([cx+Math.cos(rot)*inner, cy+Math.sin(rot)*inner]); rot+=step; } return pts; }
function heartPath(s){ const r=s/4; const x=s/2,y=s/2.4; return `M ${x} ${y} C ${x} ${y-r*1.6}, ${x-r*1.6} ${y-r*1.6}, ${x-r*1.6} ${y} C ${x-r*1.6} ${y+r}, ${x} ${y+r*1.9}, ${x} ${y+r*2.4} C ${x} ${y+r*1.9}, ${x+r*1.6} ${y+r}, ${x+r*1.6} ${y} C ${x+r*1.6} ${y-r*1.6}, ${x} ${y-r*1.6}, ${x} ${y} Z`; }
function confColor(){ const palette=[cssVar("--accent")||"#ff6d57","#ffd93d","#6bcBef","#1fb79a","#8f84ff","#ff9bb0"]; return palette[(Math.random()*palette.length)|0]; }

/* ===================== RANDOM & RESET ======================= */
const randBtn=document.getElementById("randBtn");
const resetBtn=document.getElementById("resetBtn");
randBtn.addEventListener("click",()=>{
  const newTheme=["peach","mint","night"][(Math.random()*3)|0];
  document.querySelectorAll(".theme-switch button[data-theme]").forEach(x=>x.classList.remove("active"));
  document.querySelector(`.theme-switch button[data-theme="${newTheme}"]`).classList.add("active");
  root.classList.toggle("theme-mint",newTheme==="mint");
  root.classList.toggle("theme-night",newTheme==="night");
  if(newTheme==="peach"){ root.classList.remove("theme-mint","theme-night"); }
  currentTheme=newTheme;
  const base="#"+Math.floor(Math.random()*0xffffff).toString(16).padStart(6,"0");
  const cream=mix("#ffffff",base,0.15), dark=mix("#3a2a22",base,0.35), light=mix("#bca79b",base,0.15);
  creamColor.value=cream; cakeDark.value=dark; cakeLight.value=light; applyColors();
  layerCount.value=rand(1,6); layerCount.dispatchEvent(new Event("input"));
  dripCount.value=rand(1,8); dripCount.dispatchEvent(new Event("input"));
  dripLen.value=rand(6,28); dripLen.dispatchEvent(new Event("input"));
  candleCount.value=rand(0,7); candleCount.dispatchEvent(new Event("input"));
});
resetBtn.addEventListener("click",()=>{
  layerCount.value=3; dripCount.value=4; dripLen.value=14; candleCount.value=1;
  creamColor.value="#f3f1ee"; cakeDark.value="#6f594b"; cakeLight.value="#a88571"; applyColors();
  [layerCount,dripCount,dripLen,candleCount].forEach(el=>el.dispatchEvent(new Event("input")));
  document.querySelectorAll(".theme-switch button[data-theme]").forEach(x=>x.classList.remove("active"));
  document.querySelector('.theme-switch button[data-theme="peach"]').classList.add("active");
  root.classList.remove("theme-mint","theme-night"); currentTheme="peach";
});
function rand(a,b){ return a+Math.floor(Math.random()*(b-a+1)); }
function mix(a,b,t){
  const pa=parseInt(a.slice(1),16), pb=parseInt(b.slice(1),16);
  const r=x=>((x>>16)&255), g=x=>((x>>8)&255), bl=x=>(x&255);
  const nr=Math.round(r(pa)*(1-t)+r(pb)*t), ng=Math.round(g(pa)*(1-t)+g(pb)*t), nb=Math.round(bl(pa)*(1-t)+bl(pb)*t);
  return "#"+((nr<<16)|(ng<<8)|nb).toString(16).padStart(6,"0");
}

/* ===================== INIT ======================= */
buildLayers(3); buildCream(4,14); buildCandles(1); applyColors(); setToolbar(false);
