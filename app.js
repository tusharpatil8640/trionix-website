
(function(){
'use strict';
var T = window.THREE;
var REDUCE = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
var PI = Math.PI;
function lerp(a,b,k){return a+(b-a)*k;}
function damp(a,b,l,dt){return lerp(a,b,1-Math.exp(-l*dt));}
function clamp(x,a,b){return Math.max(a,Math.min(b,x));}
var BGCOL = 0xF4F6F9;

/* ---------- copy buttons & form ---------- */
document.querySelectorAll('[data-copy]').forEach(function(b){
  b.addEventListener('click',function(){
    var el=document.getElementById(b.dataset.copy); var txt=el.textContent;
    var done=function(){b.textContent='Copied'; setTimeout(function(){b.textContent='Copy';},1500);};
    var fallback=function(){var r=document.createRange(); r.selectNodeContents(el); var s=getSelection(); s.removeAllRanges(); s.addRange(r); b.textContent='Selected';};
    try{ navigator.clipboard.writeText(txt).then(done,fallback);}catch(e){fallback();}
  });
});
var form=document.getElementById('enq');
if(form){form.addEventListener('submit',function(e){
  e.preventDefault();
  var st=document.getElementById('f-status');
  var em=document.getElementById('f-em');if(!document.getElementById('f-name').value.trim()||!document.getElementById('f-ph').value.trim()||!em.value.trim()){st.textContent='Please add your name, phone number and email.';return;}
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(em.value.trim())){st.textContent='Please check the email address.';em.focus();return;}
  var btn=form.querySelector('button[type=submit]');
  if(form.elements['_honey'] && form.elements['_honey'].value){return;}
  var g=function(id){return document.getElementById(id).value.trim();};
  var data={type:'enquiry',name:g('f-name'),company:g('f-co'),phone:g('f-ph'),email:g('f-em'),service:document.getElementById('f-svc').value,requirement:g('f-msg'),page:'Contact',vid:(window.TRX&&TRX.vid)||'',_honey:(form.elements['_honey']&&form.elements['_honey'].value)||''};
  btn.disabled=true; st.textContent='Sending your enquiry...';
  var fail=function(){btn.disabled=false;st.textContent='Sorry, the enquiry could not be sent right now. Please call +91 78410 09799 or email sales@trionixautomation.com.';};
  if(!window.TRX_EP||window.TRX_EP.indexOf('http')!==0){fail();return;}
  fetch(window.TRX_EP,{method:'POST',body:JSON.stringify(data)})
    .then(function(r){return r.json();})
    .then(function(j){if(j&&j.ok){form.reset();btn.disabled=false;st.textContent='Thank you, your enquiry has been sent to Trionix. We will get back to you soon.';}else{fail();}})
    .catch(fail);
});}
var navEl=document.getElementById('nav');
function setNavH(){document.documentElement.style.setProperty('--nav-h',navEl.offsetHeight+'px');}
setNavH(); window.addEventListener('resize',setNavH);

var HAS3D = !!T && (function(){try{var c=document.createElement('canvas');return !!(c.getContext('webgl')||c.getContext('experimental-webgl'));}catch(e){return false;}})();
if(!HAS3D) document.documentElement.classList.add('no3d');

/* =====================================================================
   HELPERS
   ===================================================================== */
var Y, DOT, RING, TEX={};
function cnv(w,h){var c=document.createElement('canvas');c.width=w;c.height=h;return c;}
function ctex(c,rep,srgb){var t=new T.CanvasTexture(c);if(srgb!==false)t.encoding=T.sRGBEncoding;t.anisotropy=8;if(rep){t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(rep[0],rep[1]);}t.__shared=true;return t;}
function initShared(){
  Y=new T.Vector3(0,1,0);
  var c=cnv(64,64),g=c.getContext('2d');var gr=g.createRadialGradient(32,32,0,32,32,32);
  gr.addColorStop(0,'rgba(255,255,255,1)');gr.addColorStop(.35,'rgba(255,255,255,.75)');gr.addColorStop(1,'rgba(255,255,255,0)');
  g.fillStyle=gr;g.fillRect(0,0,64,64);DOT=ctex(c,null,false);
  var c2=cnv(128,128),g2=c2.getContext('2d');g2.strokeStyle='#E8891E';g2.lineWidth=10;g2.beginPath();g2.arc(64,64,50,0,PI*2);g2.stroke();
  g2.fillStyle='#E8891E';g2.beginPath();g2.arc(64,64,14,0,PI*2);g2.fill();RING=ctex(c2);
  /* corrugated cladding normal map */
  var c3=cnv(128,8),g3=c3.getContext('2d');for(var x=0;x<128;x++){var n=Math.sin(x/128*PI*2*4);g3.fillStyle='rgb('+Math.round(128+110*n)+',128,255)';g3.fillRect(x,0,1,8);}
  TEX.corr=ctex(c3,[1,1],false);
  /* grating (alpha) */
  var c4=cnv(64,64),g4=c4.getContext('2d');g4.fillStyle='#000';g4.fillRect(0,0,64,64);g4.fillStyle='#fff';for(var i=0;i<8;i++){g4.fillRect(i*8,0,2,64);g4.fillRect(0,i*8,64,1);}TEX.grate=ctex(c4,[1,1],false);
  /* duct slots */
  var c5=cnv(64,32),g5=c5.getContext('2d');g5.fillStyle='#8f969e';g5.fillRect(0,0,64,32);g5.fillStyle='#5d636b';for(i=0;i<8;i++)g5.fillRect(i*8+3,0,2,22);g5.fillStyle='#a3aab2';g5.fillRect(0,26,64,6);TEX.duct=ctex(c5,[1,1]);
  /* brushed steel */
  var c6=cnv(256,64),g6=c6.getContext('2d');g6.fillStyle='#b9c1ca';g6.fillRect(0,0,256,64);for(i=0;i<500;i++){g6.fillStyle='rgba('+(Math.random()>.5?255:90)+','+(Math.random()>.5?255:100)+',255,'+(Math.random()*.08)+')';g6.fillRect(0,Math.random()*64,256,1);}TEX.brushed=ctex(c6,[1,1]);
  /* noise for powder coat roughness */
  var c7=cnv(128,128),g7=c7.getContext('2d');var im=g7.createImageData(128,128);for(i=0;i<im.data.length;i+=4){var v=150+Math.random()*60;im.data[i]=im.data[i+1]=im.data[i+2]=v;im.data[i+3]=255;}g7.putImageData(im,0,0);TEX.noise=ctex(c7,[4,4],false);
  /* rough concrete */
  var c8=cnv(256,256),g8=c8.getContext('2d');g8.fillStyle='#c9cfd6';g8.fillRect(0,0,256,256);for(i=0;i<3000;i++){g8.fillStyle='rgba(80,90,100,'+(Math.random()*.08)+')';g8.fillRect(Math.random()*256,Math.random()*256,2,2);}TEX.concrete=ctex(c8,[3,3]);
}
function M(c,o){return new T.MeshStandardMaterial(Object.assign({color:c,metalness:.2,roughness:.55,envMapIntensity:.6},o||{}));}
function METAL(c,r){return new T.MeshStandardMaterial({color:c,metalness:.85,roughness:r==null?.32:r,envMapIntensity:.75});}
function PAINT(c,r){return new T.MeshStandardMaterial({color:c,metalness:.12,roughness:r==null?.5:r,roughnessMap:TEX.noise,envMapIntensity:.5});}
function BM(c,o){return new T.MeshBasicMaterial(Object.assign({color:c},o||{}));}
function GLOW(c,k){return new T.MeshStandardMaterial({color:c,emissive:new T.Color(c),emissiveIntensity:k==null?1:k,roughness:.3});}
function V(a){return new T.Vector3(a[0],a[1],a[2]);}
function box(w,h,d,m,x,y,z,p){var o=new T.Mesh(new T.BoxGeometry(w,h,d),m);o.position.set(x||0,y||0,z||0);if(p)p.add(o);return o;}
function cyl(rt,rb,h,m,x,y,z,p,seg){var o=new T.Mesh(new T.CylinderGeometry(rt,rb,h,seg||28),m);o.position.set(x||0,y||0,z||0);if(p)p.add(o);return o;}
/* cylinder whose axis lies along x / z */
function cylX(r,len,m,x,y,z,p,seg){var o=cyl(r,r,len,m,x,y,z,p,seg);o.rotation.z=PI/2;return o;}
function cylZ(r,len,m,x,y,z,p,seg){var o=cyl(r,r,len,m,x,y,z,p,seg);o.rotation.x=PI/2;return o;}
function sph(r,m,x,y,z,p,ws,hs){var o=new T.Mesh(new T.SphereGeometry(r,ws||24,hs||16),m);o.position.set(x||0,y||0,z||0);if(p)p.add(o);return o;}
function tor(R,r,m,x,y,z,p,arc){var o=new T.Mesh(new T.TorusGeometry(R,r,10,36,arc||PI*2),m);o.position.set(x||0,y||0,z||0);if(p)p.add(o);return o;}
function rod(a,b,r,m,p,seg){var A=V(a),B=V(b),len=A.distanceTo(B);var o=new T.Mesh(new T.CylinderGeometry(r,r,len,seg||14),m);o.position.copy(A).add(B).multiplyScalar(.5);o.quaternion.setFromUnitVectors(Y,B.clone().sub(A).normalize());if(p)p.add(o);return o;}
function pipe(pts,r,m,p,opt){opt=opt||{};for(var i=0;i<pts.length-1;i++){rod(pts[i],pts[i+1],r,m,p,opt.seg||18);}for(var j=1;j<pts.length-1;j++){sph(r,m,pts[j][0],pts[j][1],pts[j][2],p,16,12);}
  if(opt.flanges){var fm=opt.fm||m;for(i=0;i<pts.length-1;i++){var A=V(pts[i]),B=V(pts[i+1]),L=A.distanceTo(B);var n=Math.floor(L/(opt.flanges));for(var k=1;k<=n;k++){var P=A.clone().lerp(B,k/(n+1));var f=new T.Mesh(new T.CylinderGeometry(r*1.45,r*1.45,r*.35,24),fm);f.position.copy(P);f.quaternion.setFromUnitVectors(Y,B.clone().sub(A).normalize());p.add(f);}}}}
function polyPath(pts){var cp=new T.CurvePath();for(var i=0;i<pts.length-1;i++)cp.add(new T.LineCurve3(V(pts[i]),V(pts[i+1])));return cp;}
function smooth(pts){return new T.CatmullRomCurve3(pts.map(V),false,'catmullrom',.25);}
function rrShape(w,h,r){var s=new T.Shape();var x=-w/2,y=-h/2;s.moveTo(x+r,y);s.lineTo(x+w-r,y);s.quadraticCurveTo(x+w,y,x+w,y+r);s.lineTo(x+w,y+h-r);s.quadraticCurveTo(x+w,y+h,x+w-r,y+h);s.lineTo(x+r,y+h);s.quadraticCurveTo(x,y+h,x,y+h-r);s.lineTo(x,y+r);s.quadraticCurveTo(x,y,x+r,y);return s;}
var RBC={};
function rboxGeo(w,h,d,r,b){b=b==null?Math.min(.008,d/4,w/6,h/6):b;var iw=w-2*b,ih=h-2*b;r=Math.max(.0008,Math.min(r,iw/2-.0004,ih/2-.0004));
  var key=[w,h,d,r,b].map(function(v){return v.toFixed(4);}).join('_');if(RBC[key])return RBC[key];
  var g=new T.ExtrudeGeometry(rrShape(iw,ih,r),{depth:Math.max(.0002,d-2*b),bevelEnabled:true,bevelThickness:b,bevelSize:b,bevelSegments:3,curveSegments:5});g.translate(0,0,-(d-2*b)/2);g.__shared=true;RBC[key]=g;return g;}
function rbox(w,h,d,r,m,x,y,z,p,b){var o=new T.Mesh(rboxGeo(w,h,d,r,b),m);o.position.set(x||0,y||0,z||0);if(p)p.add(o);return o;}
/* instanced rods: list of [a,b] pairs */
function irods(pairs,r,m,p,seg){var g=new T.CylinderGeometry(r,r,1,seg||8);var im=new T.InstancedMesh(g,m,pairs.length);var mt=new T.Matrix4(),q=new T.Quaternion(),s=new T.Vector3(),A=new T.Vector3(),B=new T.Vector3(),C=new T.Vector3();
  pairs.forEach(function(pr,i){A.set(pr[0][0],pr[0][1],pr[0][2]);B.set(pr[1][0],pr[1][1],pr[1][2]);var L=A.distanceTo(B);C.copy(A).add(B).multiplyScalar(.5);q.setFromUnitVectors(Y,B.clone().sub(A).normalize());s.set(1,L,1);mt.compose(C,q,s);im.setMatrixAt(i,mt);});p.add(im);return im;}
/* instanced boxes: list of [x,y,z,(sx,sy,sz),(ry)] */
function iboxes(list,w,h,d,m,p){var im=new T.InstancedMesh(new T.BoxGeometry(w,h,d),m,list.length);var mt=new T.Matrix4(),q=new T.Quaternion(),e=new T.Euler(),s=new T.Vector3(),P=new T.Vector3();
  list.forEach(function(b,i){P.set(b[0],b[1],b[2]);s.set(b[3]||1,b[4]||1,b[5]||1);e.set(b[7]||0,b[6]||0,b[8]||0);q.setFromEuler(e);mt.compose(P,q,s);im.setMatrixAt(i,mt);});p.add(im);return im;}

function rrect(g,x,y,w,h,r){g.beginPath();g.moveTo(x+r,y);g.lineTo(x+w-r,y);g.quadraticCurveTo(x+w,y,x+w,y+r);g.lineTo(x+w,y+h-r);g.quadraticCurveTo(x+w,y+h,x+w-r,y+h);g.lineTo(x+r,y+h);g.quadraticCurveTo(x,y+h,x,y+h-r);g.lineTo(x,y+r);g.quadraticCurveTo(x,y,x+r,y);g.closePath();}
function screen(w,h,draw,fps){var c=cnv(w,h);var g=c.getContext('2d');var tex=new T.CanvasTexture(c);tex.encoding=T.sRGBEncoding;tex.anisotropy=4;var last=-9;
  return {tex:tex,update:function(t,v){if(t-last<1/(fps||15))return;last=t;draw(g,t,w,h,v||{});tex.needsUpdate=true;}};}
function screenMat(s){return new T.MeshBasicMaterial({map:s.tex,toneMapped:false});}
function label(text,o){
  o=o||{};var fs=44;var c=cnv(8,8),g=c.getContext('2d');var font='600 '+fs+'px "IBM Plex Mono", monospace';g.font=font;var tw=g.measureText(text).width;
  c.width=Math.ceil(tw+fs*1.4);c.height=Math.ceil(fs*1.9);g=c.getContext('2d');g.font=font;
  g.fillStyle='rgba(255,255,255,.96)';rrect(g,3,3,c.width-6,c.height-6,16);g.fill();
  g.strokeStyle=o.border||'#13A89E';g.lineWidth=5;g.stroke();
  g.fillStyle=o.border||'#13A89E';g.beginPath();g.arc(fs*.55,c.height/2,9,0,PI*2);g.fill();
  g.fillStyle='#0B2545';g.textBaseline='middle';g.fillText(text,fs*.95,c.height/2+2);
  var tex=new T.CanvasTexture(c);tex.encoding=T.sRGBEncoding;
  var m=new T.SpriteMaterial({map:tex,transparent:true,depthWrite:false,depthTest:false,toneMapped:false});
  var s=new T.Sprite(m);var h=o.h||.2;s.scale.set(h*c.width/c.height,h,1);s.renderOrder=30;s.__label=true;
  if(o.pos)s.position.copy(V(o.pos));return s;
}
/* pulses that travel along a curve; visible on light backgrounds */
function pulseMat(color){return new T.SpriteMaterial({map:DOT,color:color,transparent:true,depthWrite:false,toneMapped:false});}
function cable(parent,pts,color,o){
  o=o||{};var curve=o.curve||smooth(pts);
  var tm=new T.MeshStandardMaterial({color:o.jacket||0x2c3440,roughness:.55,metalness:.1,emissive:new T.Color(color),emissiveIntensity:.0});
  var tube=new T.Mesh(new T.TubeGeometry(curve,o.seg||100,o.r||.02,10,false),tm);parent.add(tube);
  var sm=pulseMat(color),sm2=pulseMat(0xffffff);
  var n=o.n||4,sp=[],size=o.size||.16,speed=o.speed||.22;
  for(var i=0;i<n;i++){var s=new T.Sprite(sm);s.scale.setScalar(size);s.renderOrder=5;parent.add(s);var c2=new T.Sprite(sm2);c2.scale.setScalar(size*.35);c2.renderOrder=6;parent.add(c2);sp.push([s,c2]);}
  return {curve:curve,tube:tube,set:function(k){sm.opacity=k;sm2.opacity=k*.9;tm.emissiveIntensity=.55*k;},
    update:function(t){for(var i=0;i<n;i++){var u=((t*speed+i/n)%1+1)%1;var p=curve.getPointAt(u);sp[i][0].position.copy(p);sp[i][1].position.copy(p);}}};
}
function beam(parent,color,o){
  o=o||{};var tmp=new T.Vector3();
  var rm=BM(color,{transparent:true,opacity:.25,depthWrite:false,toneMapped:false});
  var ray=new T.Mesh(new T.CylinderGeometry(1,1,1,16,1,true),rm);parent.add(ray);
  var core=BM(0xffffff,{transparent:true,opacity:.6,depthWrite:false,toneMapped:false});
  var line=new T.Mesh(new T.CylinderGeometry(1,1,1,8,1,true),core);parent.add(line);
  var sm=pulseMat(color),sm2=pulseMat(0xffffff);
  var n=o.n||5,sp=[];for(var i=0;i<n;i++){var s=new T.Sprite(sm);s.scale.setScalar(o.size||.26);parent.add(s);var c=new T.Sprite(sm2);c.scale.setScalar((o.size||.26)*.35);parent.add(c);sp.push([s,c]);}
  return {update:function(a,b,t,k){var len=a.distanceTo(b);var w=o.w||.04;
    ray.position.copy(a).add(b).multiplyScalar(.5);ray.scale.set(w,len,w);ray.quaternion.setFromUnitVectors(Y,tmp.copy(b).sub(a).normalize());
    line.position.copy(ray.position);line.quaternion.copy(ray.quaternion);line.scale.set(w*.22,len,w*.22);
    rm.opacity=.04+.3*k;core.opacity=.1+.6*k;sm.opacity=k;sm2.opacity=k;ray.visible=line.visible=k>.02;
    for(var i=0;i<n;i++){var u=((t*(o.speed||.45)+i/n)%1);sp[i][0].position.lerpVectors(a,b,u);sp[i][1].position.copy(sp[i][0].position);sp[i][0].visible=sp[i][1].visible=k>.02;}}};
}
function rings(parent,color,pos,o){
  o=o||{};var arr=[];var n=3;
  for(var i=0;i<n;i++){var m=BM(color,{transparent:true,opacity:0,side:T.DoubleSide,depthWrite:false,toneMapped:false});
    var r=new T.Mesh(new T.RingGeometry(.94,1,64),m);r.position.copy(V(pos));if(o.flat!==false)r.rotation.x=-PI/2;parent.add(r);arr.push(r);}
  return {update:function(t,k){arr.forEach(function(r,i){var f=((t*.55+i/n)%1);var s=(o.min||.15)+f*(o.max||1.1);r.scale.set(s,s,s);r.material.opacity=(1-f)*k*.85;r.visible=k>.02;if(o.face)r.lookAt(o.face);});}};
}
/* soft floor that fades into the page + shadow catcher */
function softFloor(parent,R,o){
  o=o||{};var c=cnv(1024,1024),g=c.getContext('2d');
  var gr=g.createRadialGradient(512,512,0,512,512,512);gr.addColorStop(0,'rgba(214,224,234,1)');gr.addColorStop(.55,'rgba(222,230,238,.85)');gr.addColorStop(1,'rgba(244,246,249,0)');
  g.fillStyle=gr;g.fillRect(0,0,1024,1024);
  g.globalCompositeOperation='source-atop';g.strokeStyle='rgba(19,168,158,.35)';g.lineWidth=1.5;var step=1024/(o.cells||24);
  for(var x=0;x<=1024;x+=step){g.beginPath();g.moveTo(x,0);g.lineTo(x,1024);g.stroke();g.beginPath();g.moveTo(0,x);g.lineTo(1024,x);g.stroke();}
  var tex=new T.CanvasTexture(c);tex.encoding=T.sRGBEncoding;tex.anisotropy=8;
  var d=new T.Mesh(new T.CircleGeometry(R,96),new T.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false,toneMapped:false}));d.rotation.x=-PI/2;d.position.y=(o.y||0)+.001;d.renderOrder=-1;d.__noShadow=true;parent.add(d);
  var sc=new T.Mesh(new T.PlaneGeometry(R*2,R*2),new T.ShadowMaterial({opacity:o.shadow||.22}));sc.rotation.x=-PI/2;sc.position.y=(o.y||0)+.002;sc.receiveShadow=true;sc.__noShadow=true;parent.add(sc);
  return d;
}
/* =====================================================================
   CANVAS DRAWINGS
   ===================================================================== */
var MONO='"IBM Plex Mono", monospace', DISP='Montserrat, sans-serif';
function drawHMI(g,t,w,h){
  g.fillStyle='#eef2f6';g.fillRect(0,0,w,h);
  g.fillStyle='#0B2545';g.fillRect(0,0,w,30);
  g.fillStyle='#13A89E';g.fillRect(0,30,w,3);
  g.fillStyle='#fff';g.font='600 15px '+MONO;g.textAlign='left';g.fillText('BOILER-01 · AUTO',10,20);
  var s=Math.floor(t)%60,mi=(30+Math.floor(t/60))%60;g.textAlign='right';g.fillText('14:'+(mi<10?'0':'')+mi+':'+(s<10?'0':'')+s,w-10,20);g.textAlign='left';
  /* mimic */
  var lv=.55+.15*Math.sin(t*.7);
  g.fillStyle='#d9e1ea';rrect(g,14,50,70,120,10);g.fill();g.strokeStyle='#0B2545';g.lineWidth=2;g.stroke();
  g.fillStyle='#13A89E';g.fillRect(16,52+116*(1-lv),66,116*lv);
  g.fillStyle='#0B2545';g.font='700 13px '+MONO;g.fillText('LT '+Math.round(lv*100)+'%',18,188);
  g.strokeStyle='#6f84a0';g.lineWidth=6;g.beginPath();g.moveTo(84,140);g.lineTo(150,140);g.lineTo(150,95);g.lineTo(190,95);g.stroke();
  g.setLineDash([8,8]);g.lineDashOffset=-t*30;g.strokeStyle='#F2A541';g.lineWidth=3;g.beginPath();g.moveTo(84,140);g.lineTo(150,140);g.lineTo(150,95);g.lineTo(190,95);g.stroke();g.setLineDash([]);
  g.save();g.translate(150,140);g.fillStyle='#13A89E';g.beginPath();g.arc(0,0,13,0,PI*2);g.fill();g.rotate(t*4);g.fillStyle='#fff';g.fillRect(-10,-2,20,4);g.fillRect(-2,-10,4,20);g.restore();
  var vals=[['PT-101',(10.3+.25*Math.sin(t*1.3)).toFixed(1),'bar'],['FT-201',(8.2+.4*Math.sin(t*.9+1)).toFixed(1),'TPH'],['AT-301 O₂',(4.1+.3*Math.sin(t*1.7)).toFixed(1),'%']];
  for(var i=0;i<3;i++){var y=50+i*42;g.fillStyle='#fff';rrect(g,196,y,112,36,6);g.fill();g.strokeStyle='#c7d2de';g.lineWidth=1;g.stroke();g.fillStyle='#4A4E55';g.font='500 10px '+MONO;g.fillText(vals[i][0],202,y+12);g.fillStyle='#0B2545';g.font='700 15px '+MONO;g.fillText(vals[i][1]+' '+vals[i][2],202,y+29);}
  var al=Math.floor(t*1.2)%5===0;g.fillStyle=al?'#F2A541':'#dbe4ec';g.fillRect(0,h-26,w,26);g.fillStyle='#0B2545';g.font='600 12px '+MONO;g.fillText(al?'ALARM  FD FAN CURRENT HIGH':'NO ACTIVE ALARMS',10,h-9);
}
function nameplate(tag,title){return function(g,t,w,h){
  var gr=g.createLinearGradient(0,0,w,0);gr.addColorStop(0,'#cfd5dc');gr.addColorStop(.5,'#eef1f4');gr.addColorStop(1,'#c9d0d8');
  g.fillStyle=gr;g.fillRect(0,0,w,h);for(var i=0;i<h;i+=2){g.fillStyle='rgba(255,255,255,'+(Math.random()*.15)+')';g.fillRect(0,i,w,1);}
  g.strokeStyle='#0B2545';g.lineWidth=5;g.strokeRect(6,6,w-12,h-12);
  [[12,12],[w-12,12],[12,h-12],[w-12,h-12]].forEach(function(p){g.fillStyle='#8a939d';g.beginPath();g.arc(p[0],p[1],6,0,PI*2);g.fill();});
  g.fillStyle='#13A89E';g.beginPath();g.moveTo(42,22);g.lineTo(30,44);g.lineTo(54,44);g.fill();
  g.fillStyle='#0B2545';g.beginPath();g.moveTo(30,48);g.lineTo(18,70);g.lineTo(42,70);g.fill();
  g.fillStyle='#F2A541';g.beginPath();g.moveTo(54,48);g.lineTo(42,70);g.lineTo(66,70);g.fill();
  g.fillStyle='#0B2545';g.font='800 32px '+DISP;g.fillText('TRIONIX',78,50);
  g.font='600 13px '+MONO;g.fillStyle='#0B7C74';g.fillText('AUTOMATION AND CONTROL TECH',80,68);
  g.font='700 26px '+MONO;g.fillStyle='#0B2545';g.fillText(title,300,50);
  g.font='500 18px '+MONO;g.fillStyle='#24364F';g.fillText('415 V AC · 3Ø · 50 Hz   IP66   TAG '+tag+'   SR. 26-1042   MFG 10/2026',24,106);
};}
function drawMeter(kind){return function(g,t,w,h){
  g.fillStyle='#f7f7f2';g.fillRect(0,0,w,h);g.strokeStyle='#222';g.lineWidth=2;g.strokeRect(1,1,w-2,h-2);
  var cx=w/2,cy=h*.78,R=w*.62;g.strokeStyle='#222';g.lineWidth=1.5;
  for(var i=0;i<=10;i++){var a=PI*1.25+i/10*PI*.5;var r0=R*(i%5?0.9:0.84);g.beginPath();g.moveTo(cx+Math.cos(a)*r0,cy+Math.sin(a)*r0);g.lineTo(cx+Math.cos(a)*R*.97,cy+Math.sin(a)*R*.97);g.stroke();}
  g.fillStyle='#c0392b';g.beginPath();g.arc(cx,cy,R*.97,PI*1.68,PI*1.75);g.arc(cx,cy,R*.9,PI*1.75,PI*1.68,true);g.fill();
  g.fillStyle='#222';g.font='700 '+Math.round(h*.13)+'px '+DISP;g.textAlign='center';g.fillText(kind,cx,h*.62);
  g.font='500 '+Math.round(h*.08)+'px '+MONO;g.fillText(kind==='A'?'0 - 100 A':'0 - 500 V',cx,h*.93);g.textAlign='left';
  var val=kind==='A'?(.52+.06*Math.sin(t*1.7)+.02*Math.sin(t*7)):(.83+.003*Math.sin(t*3));var a2=PI*1.25+val*PI*.5;
  g.strokeStyle='#111';g.lineWidth=2.2;g.beginPath();g.moveTo(cx,cy);g.lineTo(cx+Math.cos(a2)*R*.92,cy+Math.sin(a2)*R*.92);g.stroke();
  g.fillStyle='#111';g.beginPath();g.arc(cx,cy,5,0,PI*2);g.fill();
};}
function drawMFM(g,t,w,h){
  g.fillStyle='#16201a';g.fillRect(0,0,w,h);g.fillStyle='#8ce6c4';g.font='700 '+Math.round(h*.17)+'px '+MONO;g.textAlign='right';
  g.fillText((415+Math.sin(t*.8)*1.2).toFixed(1),w*.8,h*.3);g.fillText((52.4+Math.sin(t*1.7)*1.5).toFixed(1),w*.8,h*.56);g.fillText((0.96+Math.sin(t*.3)*.01).toFixed(2),w*.8,h*.82);
  g.font='600 '+Math.round(h*.09)+'px '+MONO;g.textAlign='left';g.fillText('V',w*.84,h*.3);g.fillText('A',w*.84,h*.56);g.fillText('PF',w*.82,h*.82);
}
function drawLCD(unit,base,amp){return function(g,t,w,h){
  g.fillStyle='#bcd3b4';g.fillRect(0,0,w,h);g.fillStyle='#16241a';g.font='700 '+Math.round(h*.3)+'px '+MONO;g.textAlign='center';
  g.fillText((base+amp*Math.sin(t*.9)).toFixed(2),w/2,h*.55);g.font='600 '+Math.round(h*.16)+'px '+MONO;g.fillText(unit,w/2,h*.8);
};}
function drawSCADA(g,t,w,h){
  g.fillStyle='#eef2f6';g.fillRect(0,0,w,h);g.fillStyle='#0B2545';g.fillRect(0,0,w,24);
  g.fillStyle='#fff';g.font='600 13px '+MONO;g.fillText('SCADA · BOILER HOUSE',8,16);
  g.strokeStyle='#0B2545';g.lineWidth=2.5;rrect(g,24,48,64,110,8);g.stroke();rrect(g,w-96,58,64,100,8);g.stroke();
  var l1=.5+.25*Math.sin(t*.6),l2=.6-.2*Math.sin(t*.6);
  g.fillStyle='#13A89E';g.fillRect(26,50+106*(1-l1),60,106*l1);g.fillRect(w-94,60+96*(1-l2),60,96*l2);
  g.strokeStyle='#8fa1b7';g.lineWidth=7;g.beginPath();g.moveTo(88,130);g.lineTo(w-96,130);g.stroke();
  g.setLineDash([10,10]);g.lineDashOffset=-t*40;g.strokeStyle='#F2A541';g.lineWidth=3;g.beginPath();g.moveTo(88,130);g.lineTo(w-96,130);g.stroke();g.setLineDash([]);
  g.save();g.translate(w/2,130);g.fillStyle='#13A89E';g.beginPath();g.arc(0,0,17,0,PI*2);g.fill();g.rotate(t*3);g.fillStyle='#fff';g.fillRect(-13,-3,26,6);g.fillRect(-3,-13,6,26);g.restore();
  g.fillStyle='#0B2545';g.font='600 13px '+MONO;g.fillText('LT-101 '+Math.round(l1*100)+'%',22,180);g.fillText('FT-201 '+(8+Math.sin(t)).toFixed(1)+' m³/h',w/2-60,170);
  g.strokeStyle='#F2A541';g.lineWidth=2;g.beginPath();for(var x=0;x<w-20;x+=4){var y=h-30-14*Math.sin(t*1.3+x*.04);if(x)g.lineTo(10+x,y);else g.moveTo(10+x,y);}g.stroke();
}
function drawTrend(g,t,w,h){
  g.fillStyle='#eef2f6';g.fillRect(0,0,w,h);g.fillStyle='#0B2545';g.fillRect(0,0,w,24);g.fillStyle='#fff';g.font='600 13px '+MONO;g.fillText('TRENDS · LAST 8 H',8,16);
  g.strokeStyle='#d0d9e3';g.lineWidth=1;for(var i=1;i<6;i++){g.beginPath();g.moveTo(0,24+i*(h-24)/6);g.lineTo(w,24+i*(h-24)/6);g.stroke();}
  [['#13A89E',0,40],['#F2A541',2,28],['#0B2545',4,20]].forEach(function(L){g.beginPath();for(var x=0;x<w;x+=3){var k=t*.8+x*.03+L[1];var y=h*.6-L[2]*Math.sin(k*.6)-8*Math.sin(k*2.1);if(x)g.lineTo(x,y);else g.moveTo(x,y);}g.strokeStyle=L[0];g.lineWidth=2.5;g.stroke();});
}
function drawPhone(g,t,w,h,v){
  g.fillStyle='#F4F6F9';g.fillRect(0,0,w,h);
  g.fillStyle='#0B2545';g.font='600 17px '+MONO;g.fillText('9:41',26,34);rrect(g,w-66,22,34,15,4);g.fill();
  g.fillStyle='#0B2545';g.fillRect(0,52,w,72);
  g.fillStyle='#13A89E';g.beginPath();g.moveTo(42,64);g.lineTo(32,82);g.lineTo(52,82);g.fill();
  g.fillStyle='#fff';g.beginPath();g.moveTo(32,86);g.lineTo(22,104);g.lineTo(42,104);g.fill();
  g.fillStyle='#F2A541';g.beginPath();g.moveTo(52,86);g.lineTo(42,104);g.lineTo(62,104);g.fill();
  g.fillStyle='#fff';g.font='800 28px '+DISP;g.fillText('TRIONIX',74,98);
  if((v.sec||0)>.5){
    g.fillStyle='#fff';rrect(g,26,160,w-52,440,22);g.fill();g.strokeStyle='#d0d9e3';g.lineWidth=2;g.stroke();
    g.strokeStyle='#F2A541';g.lineWidth=7;g.beginPath();g.arc(w/2,226,26,PI,0);g.stroke();g.fillStyle='#F2A541';rrect(g,w/2-36,226,72,54,8);g.fill();
    g.fillStyle='#0B2545';g.font='700 25px '+DISP;g.textAlign='center';g.fillText('Sign in',w/2,326);g.textAlign='left';
    g.fillStyle='#4A4E55';g.font='600 14px '+MONO;g.fillText('USER ID',50,362);g.fillText('PASSWORD',50,438);
    g.fillStyle='#F4F6F9';rrect(g,46,370,w-92,46,10);g.fill();rrect(g,46,446,w-92,46,10);g.fill();
    g.fillStyle='#0B2545';g.font='500 18px '+MONO;g.fillText('plant.manager',60,400);
    var n=Math.min(8,Math.floor((t*4)%14));g.fillText('••••••••'.slice(0,n),60,476);
    var ok=(t*4)%14>9;g.fillStyle=ok?'#13A89E':'#0B2545';rrect(g,46,514,w-92,56,12);g.fill();
    g.fillStyle='#fff';g.font='700 20px '+DISP;g.textAlign='center';g.fillText(ok?'Signed in ✓':'Sign in',w/2,549);g.textAlign='left';
    g.fillStyle='#4A4E55';g.font='500 15px '+MONO;g.fillText('Role: Plant manager · view only',34,640);
    return;
  }
  var tab=Math.floor(t/4)%3;var tabs=['Mimic','Graphs','Data log'];
  for(var i=0;i<3;i++){var x=18+i*((w-36)/3);g.fillStyle=i===tab?'#13A89E':'#fff';rrect(g,x+3,136,(w-36)/3-6,40,10);g.fill();g.fillStyle=i===tab?'#fff':'#0B2545';g.font='700 16px '+DISP;g.textAlign='center';g.fillText(tabs[i],x+(w-36)/6,162);}g.textAlign='left';
  g.fillStyle='#fff';rrect(g,18,188,w-36,330,18);g.fill();
  if(tab===0){
    var lv=.55+.15*Math.sin(t*.7);g.strokeStyle='#0B2545';g.lineWidth=3;rrect(g,40,226,70,150,10);g.stroke();g.fillStyle='#13A89E';g.fillRect(43,229+144*(1-lv),64,144*lv);
    g.strokeStyle='#8fa1b7';g.lineWidth=9;g.beginPath();g.moveTo(110,340);g.lineTo(200,340);g.lineTo(200,250);g.lineTo(300,250);g.stroke();
    g.setLineDash([10,10]);g.lineDashOffset=-t*40;g.strokeStyle='#F2A541';g.lineWidth=4;g.beginPath();g.moveTo(110,340);g.lineTo(200,340);g.lineTo(200,250);g.lineTo(300,250);g.stroke();g.setLineDash([]);
    g.save();g.translate(200,340);g.fillStyle='#13A89E';g.beginPath();g.arc(0,0,19,0,PI*2);g.fill();g.rotate(t*4);g.fillStyle='#fff';g.fillRect(-14,-3,28,6);g.fillRect(-3,-14,6,28);g.restore();
    g.fillStyle='#F2A541';rrect(g,290,226,44,90,8);g.fill();
    g.fillStyle='#0B2545';g.font='700 18px '+MONO;g.fillText('LT '+Math.round(lv*100)+'%',36,410);g.fillText((10.2+.3*Math.sin(t)).toFixed(1)+' bar',200,410);
    g.font='600 15px '+MONO;g.fillStyle='#4A4E55';g.fillText('Feed pump ● RUN',36,450);g.fillText('Fuel feed '+Math.round(62+6*Math.sin(t*.5))+'%',36,480);
  }else if(tab===1){
    g.fillStyle='#4A4E55';g.font='600 14px '+MONO;g.fillText('STEAM PRESSURE · FLOW',34,216);
    g.strokeStyle='#e1e7ee';g.lineWidth=1;for(i=0;i<5;i++){g.beginPath();g.moveTo(30,240+i*55);g.lineTo(w-30,240+i*55);g.stroke();}
    [['#13A89E',0,40],['#F2A541',2,25]].forEach(function(L){g.beginPath();for(var x=0;x<=w-60;x+=4){var k=t*1.2+x*.035+L[1];var y=360-L[2]*Math.sin(k*.7)-12*Math.sin(k*2.1);if(x)g.lineTo(30+x,y);else g.moveTo(30+x,y);}g.strokeStyle=L[0];g.lineWidth=4;g.stroke();});
    g.fillStyle='#0B2545';g.font='700 22px '+MONO;g.fillText((10.2+.3*Math.sin(t)).toFixed(1)+' bar',34,500);g.fillStyle='#9A5F12';g.fillText((8.4+.3*Math.sin(t*.8)).toFixed(1)+' TPH',w/2+10,500);
  }else{
    g.fillStyle='#0B2545';g.font='700 14px '+MONO;g.fillText('TIME     PT-101  FT-201  O₂',30,218);
    for(i=0;i<8;i++){var mm=(Math.floor(t)+i)%60;g.fillStyle=i%2?'#F4F6F9':'#fff';g.fillRect(24,230+i*30,w-48,30);g.fillStyle='#24364F';g.font='500 14px '+MONO;g.fillText('14:'+(mm<10?'0':'')+mm+'   '+(10.1+.2*Math.sin(i+t*.2)).toFixed(1)+'    '+(8.3+.3*Math.sin(i*2)).toFixed(1)+'    '+(4.0+.2*Math.cos(i)).toFixed(1),30,250+i*30);}
    g.fillStyle='#13A89E';rrect(g,30,478,(w-70)/2,30,8);g.fill();g.fillStyle='#F2A541';rrect(g,40+(w-70)/2,478,(w-70)/2,30,8);g.fill();
    g.fillStyle='#fff';g.font='700 14px '+DISP;g.textAlign='center';g.fillText('Export Excel',30+(w-70)/4,498);g.fillStyle='#0B2545';g.fillText('Export PDF',40+(w-70)*3/4,498);g.textAlign='left';
  }
  var al=(v.alert||0)>.5&&Math.floor(t*1.2)%2===0;
  g.fillStyle=al?'#dcf8c6':'#fff';rrect(g,18,534,w-36,120,18);g.fill();g.strokeStyle=al?'#25D366':'#d0d9e3';g.lineWidth=3;g.stroke();
  g.fillStyle=al?'#128C7E':'#0B7C74';g.font='700 15px '+MONO;g.fillText(al?'WhatsApp · Trionix Alerts':'● All systems running',34,566);
  g.fillStyle='#0B2545';g.font='600 17px '+DISP;
  if(al){g.fillText('ALARM: Drum level LOW',34,596);g.font='500 15px '+DISP;g.fillText('BOILER-01 · LT-101 at 18%',34,622);g.fillText('Sent to: Shift engineer',34,644);}
  else{g.font='500 15px '+DISP;g.fillText('Alarms are sent to your',34,600);g.fillText('WhatsApp when limits cross',34,624);}
}
function drawOLED(g,t,w,h){
  g.fillStyle='#02060c';g.fillRect(0,0,w,h);var pv=150+2.4*Math.sin(t*.8)*Math.exp(-.12*(t%25))+.15*Math.sin(t*5);
  g.fillStyle='#7ff0e4';g.font='600 14px '+MONO;g.fillText('PID LOOP · TX-MC1',8,18);
  g.font='700 34px '+MONO;g.fillText(pv.toFixed(1)+'°C',8,58);
  g.fillStyle='#F2A541';g.font='600 14px '+MONO;g.fillText('SV 150.0  OUT '+Math.round(45+20*Math.sin(t*.8))+'%',8,80);
  g.strokeStyle='#7ff0e4';g.lineWidth=2;g.beginPath();for(var x=0;x<w-16;x+=3){var yy=110-10*Math.sin(t*1.3+x*.06)*Math.exp(-x*.004);if(x)g.lineTo(8+x,yy);else g.moveTo(8+x,yy);}g.stroke();
}
function ctrlFace(kind){return function(g,t,w,h){
  g.fillStyle='#14171b';g.fillRect(0,0,w,h);
  g.fillStyle='#07090b';rrect(g,w*.06,h*.06,w*.88,kind==='timer'?h*.62:h*.56,8);g.fill();
  var pv,sv;
  if(kind==='timer'){var s=Math.floor(t)%60;g.fillStyle='#ff6a3d';g.font='700 '+Math.round(h*.24)+'px '+MONO;g.textAlign='center';g.fillText('0'+Math.floor(t/60)%10+':'+(s<10?'0':'')+s,w/2,h*.38);g.fillStyle='#7ff0e4';g.font='700 '+Math.round(h*.14)+'px '+MONO;g.fillText('T1  SET 05:00',w/2,h*.6);g.textAlign='left';}
  else{sv=kind==='pid'?150:85;pv=sv+3*Math.sin(t*.7)*Math.exp(-.1*(t%30))+.2*Math.sin(t*4);var big=kind==='pid'?h*.24:h*.16;
    g.textAlign='right';g.fillStyle='#ff6a3d';g.font='700 '+Math.round(big)+'px '+MONO;g.fillText(pv.toFixed(1),w*.88,h*.3);
    g.fillStyle='#7ff0e4';g.font='700 '+Math.round(big*.62)+'px '+MONO;g.fillText(sv.toFixed(1),w*.88,h*.52);
    g.textAlign='left';g.fillStyle='#8a96a3';g.font='600 '+Math.round(big*.3)+'px '+MONO;g.fillText('PV',w*.1,h*.18);g.fillText('SV',w*.1,h*.44);}
  var by=h*.73,n=4,bw=w*.17;for(var i=0;i<n;i++){g.fillStyle='#2a3038';rrect(g,w*.08+i*(bw+w*.055),by,bw,h*.14,6);g.fill();g.fillStyle='#8a96a3';g.font='600 '+Math.round(h*.06)+'px '+MONO;g.textAlign='center';g.fillText(['SET','◀','▼','▲'][i],w*.08+i*(bw+w*.055)+bw/2,by+h*.09);}g.textAlign='left';
  g.fillStyle=Math.floor(t*2)%2?'#F2A541':'#3a2a12';g.beginPath();g.arc(w*.12,h*.94,h*.022,0,PI*2);g.fill();
  g.fillStyle='#37d67a';g.beginPath();g.arc(w*.22,h*.94,h*.022,0,PI*2);g.fill();
};}

/* =====================================================================
   DETAILED PANEL
   ===================================================================== */
function buildPanel(o){
  o=o||{};var g=new T.Group();var W=1.2,H=2.0,D=.6,PL=.1;
  var ral=PAINT(0xD9DDE1,.42),plinthM=PAINT(0x45484c,.6),orangeM=PAINT(0xE08A2E,.55);
  var blk=M(0x1b1e22,{roughness:.45}),gry=M(0x9aa2ab,{roughness:.5}),chrome=METAL(0xe0e4e8,.15),white=M(0xf3f4f5,{roughness:.5});
  /* plinth, body, canopy */
  rbox(W,PL,D,.004,plinthM,0,PL/2,0,g);
  box(W-.1,.06,.01,M(0x2a2d31),0,PL/2,D/2+.001,g);
  rbox(W,H,.02,.006,ral,0,PL+H/2,-D/2+.01,g);
  rbox(.02,H,D,.006,ral,-W/2+.01,PL+H/2,0,g);rbox(.02,H,D,.006,ral,W/2-.01,PL+H/2,0,g);
  rbox(W,.02,D,.006,ral,0,PL+H-.01,0,g);rbox(W,.02,D,.006,M(0xb7bec6,{metalness:.4}),0,PL+.02,0,g);
  /* front frame flange */
  box(.024,H,.02,ral,-W/2+.012,PL+H/2,D/2-.01,g);box(.024,H,.02,ral,W/2-.012,PL+H/2,D/2-.01,g);box(W,.024,.02,ral,0,PL+H-.012,D/2-.01,g);box(W,.024,.02,ral,0,PL+.012,D/2-.01,g);
  rbox(W+.08,.035,D+.08,.012,ral,0,PL+H+.018,0,g);
  [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(function(a){var e=tor(.032,.009,chrome,a[0]*(W/2-.08),PL+H+.075,a[1]*(D/2-.08),g);cyl(.014,.014,.03,chrome,a[0]*(W/2-.08),PL+H+.045,a[1]*(D/2-.08),g,12);});
  /* side filter fan + louvres */
  var sf=new T.Group();sf.position.set(W/2+.004,PL+1.45,0);g.add(sf);rbox(.012,.27,.27,.015,M(0x3a3f45),0,0,0,sf).rotation.y=PI/2;
  for(var i=0;i<7;i++)box(.014,.012,.22,M(0x23272b),0,-.1+i*.034,0,sf);
  var sf2=sf.clone();sf2.position.set(-W/2-.004,PL+.45,0);g.add(sf2);
  /* ---------- interior ---------- */
  var inner=new T.Group();g.add(inner);var zp=-D/2+.035,zb=zp+.004;
  rbox(W-.14,H-.2,.006,.004,orangeM,0,PL+H/2,zp,inner);
  var ductY=[1.98,1.62,1.22,.86,.52];var slots=[],ductM=M(0xa0a7af,{roughness:.6});
  ductY.forEach(function(y){box(W-.3,.06,.06,ductM,0,y,zb+.03,inner);box(W-.3,.012,.064,M(0x8d949c),0,y+.024,zb+.032,inner);for(var x=-(W-.3)/2+.015;x<(W-.3)/2;x+=.024)slots.push([x,y-.005,zb+.0605]);});
  [-1,1].forEach(function(s){box(.06,1.56,.06,ductM,s*(W/2-.12),1.24,zb+.03,inner);for(var y=.5;y<2.0;y+=.024)slots.push([s*(W/2-.12)-s*.0,y,zb+.0605,1,1,1]);});
  var sl=iboxes(slots,.006,.036,.002,M(0x5c626a),inner);
  function din(y,x0,x1){box(x1-x0,.035,.008,METAL(0xc9ced4,.3),(x0+x1)/2,y,zb+.004,inner);}
  /* Row A: PLC + SMPS + switch */
  din(1.80,-.46,.46);
  var plcM=M(0x3d434a,{roughness:.45}),plcF=M(0x6c747d,{roughness:.4});
  rbox(.11,.13,.08,.006,plcM,-.38,1.80,zb+.04,inner);rbox(.085,.07,.004,.004,plcF,-.38,1.815,zb+.082,inner);
  var ledList=[];
  for(i=0;i<3;i++)ledList.push([-.415,1.845-i*.012,zb+.083]);
  for(i=0;i<7;i++){var mx=-.295+i*.05;rbox(.045,.13,.08,.004,plcM,mx,1.80,zb+.04,inner);box(.036,.016,.03,M(0x2f8f4e),mx,1.862,zb+.065,inner);box(.036,.016,.03,M(0x2f8f4e),mx,1.738,zb+.065,inner);
    for(var k=0;k<8;k++)ledList.push([mx-.012+(k%2)*.024*.0+(k%2?.008:-.008),1.835-Math.floor(k/2)*.01,zb+.0815]);
    box(.03,.03,.002,white,mx,1.785,zb+.081,inner);}
  var plcLeds=new T.InstancedMesh(new T.BoxGeometry(.006,.005,.002),new T.MeshBasicMaterial({toneMapped:false}),ledList.length);
  var mt=new T.Matrix4(),cA=new T.Color(0x22e07a),cB=new T.Color(0x0e3a22);ledList.forEach(function(p,i){mt.makeTranslation(p[0],p[1],p[2]);plcLeds.setMatrixAt(i,mt);plcLeds.setColorAt(i,cA);});inner.add(plcLeds);
  rbox(.12,.13,.1,.004,METAL(0xb8c0c8,.35),.18,1.80,zb+.05,inner);for(i=0;i<6;i++)box(.09,.006,.002,M(0x40464d),.18,1.76+i*.014,zb+.101,inner);
  box(.03,.012,.004,M(0x2f8f4e),.18,1.855,zb+.101,inner);
  rbox(.08,.11,.08,.006,M(0x5a6068),.34,1.80,zb+.04,inner);for(i=0;i<5;i++){box(.012,.012,.006,M(0x111),.31+i*.015,1.78,zb+.082,inner);}
  /* Row B: MCBs + MCCB */
  din(1.42,-.46,.46);
  for(i=0;i<14;i++){var bx=-.43+i*.0205;rbox(.019,.085,.065,.002,white,bx,1.42,zb+.033,inner);box(.008,.018,.012,i<3?M(0xc0392b):M(0x1f3c88),bx,1.425,zb+.07,inner);}
  rbox(.1,.14,.09,.008,blk,.12,1.42,zb+.045,inner);box(.02,.035,.03,M(0x111),.12,1.43,zb+.1,inner);box(.06,.02,.002,M(0xF2A541),.12,1.37,zb+.0905,inner);
  rbox(.07,.085,.07,.004,white,.28,1.42,zb+.035,inner);box(.01,.02,.012,M(0x1f3c88),.28,1.425,zb+.075,inner);
  /* Row C: contactors + OLR + interposing relays */
  din(1.06,-.46,.46);din(.995,-.46,-.1);
  for(i=0;i<5;i++){var cx=-.4+i*.065;rbox(.045,.075,.08,.004,M(0x7c848d),cx,1.07,zb+.04,inner);rbox(.04,.02,.012,.003,white,cx,1.075,zb+.085,inner);rbox(.045,.04,.07,.003,M(0x5f666e),cx,.998,zb+.035,inner);box(.012,.012,.004,M(0x1f3c88),cx+.01,.998,zb+.071,inner);}
  for(i=0;i<9;i++){var rx=.0+i*.045;rbox(.036,.07,.03,.003,blk,rx,1.04,zb+.015,inner);rbox(.028,.038,.036,.003,M(0x9bb7d4,{transparent:true,opacity:.75,roughness:.2}),rx,1.05,zb+.048,inner);box(.006,.006,.003,GLOW(0xff3b2f,1),rx+.01,1.015,zb+.032,inner);}
  /* Row D: terminals */
  din(.70,-.46,.46);
  var tl=[];for(i=0;i<36;i++)tl.push([-.43+i*.0235,.70,zb+.025]);
  var term=new T.InstancedMesh(new T.BoxGeometry(.021,.055,.045),M(0xffffff,{roughness:.5}),tl.length);
  var cg=new T.Color(0x9aa2ab),cbl=new T.Color(0x2f6bd8),cy=new T.Color(0x8cc63f);
  tl.forEach(function(p,i){mt.makeTranslation(p[0],p[1],p[2]);term.setMatrixAt(i,mt);term.setColorAt(i,i>31?cy:(i%6>3?cbl:cg));});inner.add(term);
  box(.86,.01,.003,white,0,.72,zb+.049,inner);
  /* earth bar */
  box(.5,.026,.008,METAL(0xc8794a,.35),0,.38,zb+.006,inner);for(i=0;i<10;i++)cyl(.006,.006,.012,chrome,-.22+i*.05,.38,zb+.014,inner,8).rotation.x=PI/2;
  /* wires (instanced) */
  var wires={0x1b1e22:[],0x2f6bd8:[],0xc0392b:[],0x9aa2ab:[]};var wcols=Object.keys(wires);
  function wire(x,y0,y1,i){var z=zb+.03+((i%3)-1)*.008;wires[wcols[i%wcols.length]].push([[x,y0,z],[x,y1,z]]);}
  for(i=0;i<14;i++){var xx=-.43+i*.0205;wire(xx,1.465,1.59,i);wire(xx,1.375,1.25,i+1);}
  for(i=0;i<5;i++){var xc=-.4+i*.065;wire(xc-.01,1.11,1.19,i);wire(xc+.01,1.11,1.19,i+2);wire(xc,.975,.89,i+1);}
  for(i=0;i<9;i++){wire(.0+i*.045,1.075,1.19,i);wire(.0+i*.045,1.005,.89,i+3);}
  for(i=0;i<36;i++){wire(-.43+i*.0235,.7275,.83,i);if(i%2)wire(-.43+i*.0235,.6725,.55,i+1);}
  for(i=0;i<8;i++){var xp=-.295+i*.05-.05;wire(xp,1.87,1.95,i);wire(xp,1.735,1.65,i+2);}
  wcols.forEach(function(c){irods(wires[c],.0028,M(+c,{roughness:.5}),inner,6);});
  /* incoming field cables + glands */
  var glandX=[-.36,-.24,-.12,0,.12,.24,.36];
  glandX.forEach(function(x){cyl(.018,.018,.012,blk,x,PL+.035,0,inner,6);cyl(.013,.016,.02,M(0x2b2f34),x,PL+.05,0,inner,16);rod([x,PL+.05,0],[x*.9,.49,zb+.03],.008,M(0x2b2f34),inner,8);});
  box(.5,.012,.012,GLOW(0xffffff,.9),0,PL+H-.06,D/2-.12,inner);
  /* ---------- door ---------- */
  var Wd=W-.024,Hd=H-.024;
  var pivot=new T.Group();pivot.position.set(-W/2+.012,PL+.012,D/2);g.add(pivot);
  rbox(Wd,Hd,.025,.012,ral,Wd/2,Hd/2,.0125,pivot);
  var fz=.025;function U(u){return Wd/2+u;}function Vv(v){return Hd/2+v;}
  /* gasket + doc pocket on inner side */
  box(Wd-.04,.01,.01,blk,Wd/2,Hd-.03,-.004,pivot);box(Wd-.04,.01,.01,blk,Wd/2,.03,-.004,pivot);box(.01,Hd-.06,.01,blk,.03,Hd/2,-.004,pivot);box(.01,Hd-.06,.01,blk,Wd-.03,Hd/2,-.004,pivot);
  rbox(.36,.26,.02,.01,M(0x7d858e),Wd/2,Hd/2+.25,-.012,pivot);
  /* decal (labels, warning, strip) */
  var dc=cnv(1024,Math.round(1024*Hd/Wd)),dg=dc.getContext('2d');var sx=1024/Wd,sy=dc.height/Hd;
  function DX(u){return (u+Wd/2)*sx;}function DY(v){return (Hd/2-v)*sy;}
  function plate(u,v,txt,wd){var w=(wd||.1)*sx,h=.026*sy;dg.fillStyle='#fbfbf8';rrect(dg,DX(u)-w/2,DY(v)-h/2,w,h,4);dg.fill();dg.strokeStyle='#222';dg.lineWidth=2;dg.stroke();dg.fillStyle='#111';dg.font='700 '+Math.round(h*.55)+'px '+MONO;dg.textAlign='center';dg.textBaseline='middle';dg.fillText(txt,DX(u),DY(v)+1);}
  [['POWER ON',-.36],['RUN',-.12],['TRIP',.12],['FAULT',.36]].forEach(function(a){plate(a[1],.012,a[0]);});
  [['START',-.36],['STOP',-.12],['AUTO/MAN',.12],['RESET',.36]].forEach(function(a){plate(a[1],-.24,a[0]);});
  plate(-.36,-.49,'LOCAL/REM');plate(-.12,-.49,'KEY ENABLE');plate(-.44,.24,'AMMETER',.12);plate(.44,.29,'MULTI-FN METER',.15);
  dg.fillStyle='#F2C230';dg.beginPath();dg.arc(DX(.32),DY(-.42),.075*sx,0,PI*2);dg.fill();dg.strokeStyle='#222';dg.lineWidth=2;dg.stroke();
  dg.fillStyle='#111';dg.font='800 '+Math.round(.012*sy)+'px '+MONO;dg.textAlign='center';dg.fillText('EMERGENCY',DX(.32),DY(-.42)-.053*sy);dg.fillText('STOP',DX(.32),DY(-.42)+.058*sy);
  var tx=DX(-.4),ty=DY(-.76),ts=.11*sx;dg.fillStyle='#F2C230';dg.beginPath();dg.moveTo(tx,ty-ts*.55);dg.lineTo(tx+ts*.6,ty+ts*.48);dg.lineTo(tx-ts*.6,ty+ts*.48);dg.closePath();dg.fill();dg.strokeStyle='#111';dg.lineWidth=6;dg.stroke();
  dg.fillStyle='#111';dg.beginPath();dg.moveTo(tx+4,ty-ts*.3);dg.lineTo(tx-12,ty+6);dg.lineTo(tx,ty+6);dg.lineTo(tx-6,ty+ts*.35);dg.lineTo(tx+14,ty-2);dg.lineTo(tx+2,ty-2);dg.closePath();dg.fill();
  dg.font='800 '+Math.round(.022*sy)+'px '+DISP;dg.fillText('DANGER',tx,ty+ts*.75);dg.font='700 '+Math.round(.016*sy)+'px '+MONO;dg.fillText('415 V',tx,ty+ts*.95);
  [['#13A89E',-.08],['#0B2545',0],['#F2A541',.08]].forEach(function(a){dg.fillStyle=a[0];dg.fillRect(DX(a[1]-.04),DY(.775),.08*sx,.008*sy);});
  var dtex=new T.CanvasTexture(dc);dtex.encoding=T.sRGBEncoding;dtex.anisotropy=8;
  var dec=new T.Mesh(new T.PlaneGeometry(Wd,Hd),new T.MeshStandardMaterial({map:dtex,transparent:true,roughness:.5,metalness:.1,polygonOffset:true,polygonOffsetFactor:-2}));dec.position.set(Wd/2,Hd/2,fz+.0006);dec.__noShadow=true;pivot.add(dec);
  /* nameplate */
  var np=screen(800,140,nameplate(o.tag||'CP-01',o.title||'PLC CONTROL PANEL'),1);np.update(0);
  rbox(.58,.105,.004,.004,METAL(0xc8cfd6,.3),U(0),Vv(.86),fz+.002,pivot);
  var npm=new T.Mesh(new T.PlaneGeometry(.57,.1),new T.MeshStandardMaterial({map:np.tex,metalness:.35,roughness:.4}));npm.position.set(U(0),Vv(.86),fz+.0045);pivot.add(npm);
  /* HMI */
  rbox(.52,.38,.035,.02,blk,U(0),Vv(.47),fz+.0175,pivot);
  var hmi=screen(320,224,drawHMI,12);var scr=new T.Mesh(new T.PlaneGeometry(.45,.315),screenMat(hmi));scr.position.set(U(0),Vv(.48),fz+.0355);pivot.add(scr);
  box(.04,.006,.002,M(0x5a6068),U(.2),Vv(.3),fz+.036,pivot);
  /* meters */
  var mA=screen(160,160,drawMeter('A'),10),mV=screen(160,160,drawMeter('V'),2),mf=screen(160,160,drawMFM,4);
  [[mA,-.44,.43],[mV,-.44,.63]].forEach(function(m){rbox(.135,.135,.04,.008,blk,U(m[1]),Vv(m[2]),fz+.02,pivot);var p=new T.Mesh(new T.PlaneGeometry(.115,.115),new T.MeshStandardMaterial({map:m[0].tex,roughness:.25}));p.position.set(U(m[1]),Vv(m[2]),fz+.0405);pivot.add(p);});
  rbox(.135,.135,.04,.008,blk,U(.44),Vv(.45),fz+.02,pivot);var mfp=new T.Mesh(new T.PlaneGeometry(.1,.08),screenMat(mf));mfp.position.set(U(.44),Vv(.47),fz+.0405);pivot.add(mfp);
  for(i=0;i<4;i++)cyl(.008,.008,.006,M(0x444),U(.405+i*.024),Vv(.405),fz+.042,pivot,10).rotation.x=PI/2;
  /* lamps */
  var lampC=[0xffffff,0x37d67a,0xF2A541,0xff3b2f],lamps=[];
  for(i=0;i<4;i++){var lx=U(-.36+i*.24),ly=Vv(.07);var bz=cyl(.03,.03,.012,chrome,lx,ly,fz+.006,pivot,24);bz.rotation.x=PI/2;
    var lm=new T.MeshStandardMaterial({color:lampC[i],emissive:new T.Color(lampC[i]),emissiveIntensity:1,roughness:.15,transparent:true,opacity:.95});
    var lens=sph(.024,lm,lx,ly,fz+.012,pivot,20,12);lens.scale.z=.55;lamps.push(lm);}
  /* buttons */
  var btnC=[0x2fae58,0xd63a2f,null,0x2f6bd8];
  for(i=0;i<4;i++){var px=U(-.36+i*.24),py=Vv(-.165);cyl(.03,.03,.012,chrome,px,py,fz+.006,pivot,24).rotation.x=PI/2;
    if(btnC[i]){cyl(.022,.022,.016,M(btnC[i],{roughness:.35}),px,py,fz+.018,pivot,24).rotation.x=PI/2;}
    else{cyl(.024,.024,.012,blk,px,py,fz+.016,pivot,24).rotation.x=PI/2;var kn=rbox(.014,.045,.022,.005,blk,px,py,fz+.028,pivot);kn.rotation.z=.7;}}
  [-.36,-.12].forEach(function(u,j){var px=U(u),py=Vv(-.415);cyl(.03,.03,.012,chrome,px,py,fz+.006,pivot,24).rotation.x=PI/2;
    if(j===0){cyl(.024,.024,.012,blk,px,py,fz+.016,pivot,24).rotation.x=PI/2;rbox(.014,.045,.022,.005,blk,px,py,fz+.028,pivot).rotation.z=-.7;}
    else{cyl(.022,.022,.016,chrome,px,py,fz+.018,pivot,24).rotation.x=PI/2;box(.004,.018,.004,M(0x222),px,py,fz+.027,pivot);}});
  var ex=U(.32),ey=Vv(-.42);cyl(.034,.034,.014,M(0xF2C230),ex,ey,fz+.007,pivot,24).rotation.x=PI/2;cyl(.016,.016,.03,M(0x222),ex,ey,fz+.02,pivot,16).rotation.x=PI/2;
  var es=new T.Mesh(new T.SphereGeometry(.05,28,16,0,PI*2,0,PI/2),M(0xd8322a,{roughness:.3}));es.rotation.x=PI/2;es.scale.y=.5;es.position.set(ex,ey,fz+.034);pivot.add(es);
  /* door filter grille, handle, hinges */
  rbox(.24,.24,.02,.012,M(0x3a3f45),U(.3),Vv(-.76),fz+.01,pivot);for(i=0;i<7;i++)box(.2,.01,.008,M(0x23272b),U(.3),Vv(-.85+i*.03),fz+.022,pivot);
  rbox(.045,.24,.03,.012,blk,U(.53),Vv(0),fz+.015,pivot);cyl(.012,.012,.012,chrome,U(.53),Vv(.07),fz+.035,pivot,16).rotation.x=PI/2;
  [.25,Hd/2,Hd-.25].forEach(function(y){cyl(.011,.011,.08,chrome,-.002,y,.012,pivot,16);});
  var st8={f:-1};
  return {group:g,pivot:pivot,W:W,H:H,D:D,top:PL+H+.04,
    update:function(t,v){hmi.update(t);mA.update(t);mV.update(t);mf.update(t);
      lamps[0].emissiveIntensity=1.1;lamps[1].emissiveIntensity=1.1;lamps[2].emissiveIntensity=(Math.sin(t*4)>0?1.4:.05);lamps[3].emissiveIntensity=(Math.floor(t*1.2)%5===0?1.4:.04);
      var f8=Math.floor(t*8);if(f8!==st8.f){st8.f=f8;for(var i=0;i<ledList.length;i++){plcLeds.setColorAt(i,((i*7+f8*3)%5)?cA:cB);}plcLeds.instanceColor.needsUpdate=true;}
      pivot.rotation.y=-1.9*((v&&v.door)||0);}};
}

/* =====================================================================
   FIELD DEVICES
   ===================================================================== */
var galv=null;
function mats(){if(galv)return;galv=METAL(0xb7bec6,.38);}
function flange(r,th,m,p,x,y,z,axis){var f=cyl(r,r,th,m,x,y,z,p,24);if(axis==='x')f.rotation.z=PI/2;if(axis==='z')f.rotation.x=PI/2;return f;}
function buildPT(col,unit,base,tag){
  mats();var g=new T.Group();var body=PAINT(col||0x2a5c94,.35);
  box(.2,.012,.2,galv,0,.006,0,g);cyl(.03,.03,.95,galv,0,.48,0,g,16);cyl(.034,.034,.01,galv,0,.955,0,g,16);
  box(.09,.06,.02,galv,0,.8,.035,g);box(.07,.08,.05,METAL(0xd0d5da,.3),0,.82,.075,g);
  for(var i=0;i<3;i++){var v=cyl(.006,.006,.03,galv,-.025+i*.025,.875,.075,g,8);}
  box(.06,.05,.06,METAL(0xc8ced5,.3),0,.885,.075,g);
  cyl(.018,.018,.04,body,0,.93,.075,g,16);
  var hz=cylZ(.055,.14,body,0,.995,.075,g,28);
  cylZ(.06,.022,METAL(0xd5dade,.25),0,.995,.155,g,28);cylZ(.06,.022,METAL(0xd5dade,.25),0,.995,-.005,g,28);
  var lcd=screen(96,96,drawLCD(unit||'bar',base||10.4,.15),3);var disc=new T.Mesh(new T.CircleGeometry(.04,32),screenMat(lcd));disc.position.set(0,.995,.1665);g.add(disc);
  cyl(.012,.012,.03,M(0x2b2f34),.06,.97,.075,g,12).rotation.z=PI/2;
  var tp=tagPlate(tag||'PT-101');tp.position.set(.0,.86,.075);tp.rotation.x=-.1;g.add(tp);rod([-.03,.875,.075],[-.012,.93,.05],.0008,METAL(0xd0d5da,.3),g);rod([.03,.875,.075],[.012,.93,.05],.0008,METAL(0xd0d5da,.3),g);
  var gl=cyl(.012,.014,.035,M(0x2b2f34),.075,.985,.075,g,16);gl.rotation.z=PI/2;rod([.09,.985,.075],[.12,.95,.075],.006,M(0x2b2e33,{roughness:.6}),g);rod([.12,.95,.075],[.12,.02,.075],.006,M(0x2b2e33,{roughness:.6}),g);
  return {group:g,update:function(t){lcd.update(t);}};
}
function buildFlowmeter(){
  mats();var g=new T.Group();var steel=METAL(0xc4cad1,.35);var pipeM=PAINT(0x6c7a8a,.5);
  cylX(.06,1.4,pipeM,0,.42,0,g,24);
  [-.22,.22].forEach(function(x){flange(.11,.025,steel,g,x,.42,0,'x');for(var i=0;i<8;i++){var a=i*PI/4;cylX(.008,.04,steel,x,.42+Math.sin(a)*.09,Math.cos(a)*.09,g,8);}});
  cylX(.1,.42,PAINT(0x2a5c94,.35),0,.42,0,g,32);
  cyl(.025,.025,.1,PAINT(0x2a5c94,.35),0,.56,0,g,16);
  var hz=cylZ(.06,.12,PAINT(0x2a5c94,.35),0,.65,0,g,28);cylZ(.064,.02,METAL(0xd5dade,.25),0,.65,.07,g,28);
  var lcd=screen(96,96,drawLCD('m³/h',8.2,.4),3);var disc=new T.Mesh(new T.CircleGeometry(.045,32),screenMat(lcd));disc.position.set(0,.65,.081);g.add(disc);
  [-.6,.6].forEach(function(x){box(.06,.36,.06,galv,x,.18,0,g);box(.16,.02,.12,galv,x,.36,0,g);});
  var tp=tagPlate('FT-201');tp.position.set(0,.52,.105);g.add(tp);
  return {group:g,update:function(t){lcd.update(t);}};
}
function buildPumpSet(motorCol){
  mats();var g=new T.Group();var spin=[];
  rbox(1.0,.06,.36,.01,PAINT(0x3b4a5c,.5),0,.03,0,g);
  var mc=PAINT(motorCol||0x1f5aa6,.4);
  var mot=new T.Group();mot.position.set(-.18,.22,0);g.add(mot);
  cylX(.14,.38,mc,0,0,0,mot,36);
  var fins=[];for(var i=0;i<20;i++){var a=i/20*PI*2;if(Math.abs(Math.sin(a)+1)<.15)continue;fins.push([0,Math.sin(a)*.152,Math.cos(a)*.152,1,1,1,0,a]);}
  iboxes(fins,.34,.025,.006,mc,mot);
  cylX(.145,.1,mc,-.24,0,0,mot,36);cylX(.1,.012,M(0x22262a),-.295,0,0,mot,32);
  rbox(.12,.08,.12,.01,mc,.02,.17,0,mot);
  [-.12,.12].forEach(function(x){box(.06,.08,.3,mc,x,-.12,0,mot);});
  cylX(.02,.12,METAL(0xdde2e7,.2),.25,0,0,mot,16);
  var cp=new T.Group();cp.position.set(.11,.22,0);g.add(cp);var cm=PAINT(0xF2A541,.4);
  cylX(.06,.05,cm,0,0,0,cp,24);for(i=0;i<6;i++){var b=cylX(.006,.06,METAL(0xcfd5db),0,Math.sin(i*PI/3)*.045,Math.cos(i*PI/3)*.045,cp,8);}spin.push(cp);
  var pc=PAINT(0x2c6a72,.45);
  cylX(.04,.14,pc,.22,.22,0,g,20);box(.08,.12,.14,pc,.22,.12,0,g);
  cylX(.16,.11,pc,.36,.24,0,g,36);
  cylX(.055,.16,pc,.47,.22,0,g,24);flange(.085,.02,pc,g,.55,.22,0,'x');
  cyl(.045,.045,.22,pc,.36,.44,0,g,24);flange(.075,.02,pc,g,.36,.555,0);
  box(.18,.06,.2,pc,.36,.09,0,g);
  return {group:g,update:function(t,dt){spin.forEach(function(s){s.rotation.x+=dt*14;});}};
}
function buildControlValve(){
  mats();var g=new T.Group();var body=PAINT(0x4a5562,.45),act=PAINT(0x1f5aa6,.4),steel=METAL(0xd0d6dc,.3);
  cylX(.05,1.2,PAINT(0x6c7a8a,.5),0,.32,0,g,20);
  [-.16,.16].forEach(function(x){flange(.1,.025,steel,g,x,.32,0,'x');});
  sph(.1,body,0,.32,0,g);cylX(.07,.26,body,0,.32,0,g,24);
  cyl(.05,.06,.12,body,0,.46,0,g,24);
  [-.05,.05].forEach(function(x){box(.02,.22,.03,steel,x,.62,0,g);});cyl(.012,.012,.24,METAL(0xeeeeee,.15),0,.62,0,g,12);
  box(.16,.02,.08,steel,0,.73,0,g);
  var up=new T.Mesh(new T.SphereGeometry(.17,32,12,0,PI*2,0,PI/2.6),act);up.position.y=.74;up.scale.y=.6;g.add(up);
  var dn=new T.Mesh(new T.SphereGeometry(.17,32,12,0,PI*2,PI-PI/2.6,PI/2.6),act);dn.position.y=.79;dn.scale.y=.4;g.add(dn);
  cyl(.172,.172,.02,steel,0,.77,0,g,40);
  rbox(.1,.12,.07,.01,M(0xe7eaee,{roughness:.4}),.12,.6,.03,g);
  [[.1,.64],[.14,.64]].forEach(function(p){cylZ(.014,.012,M(0xffffff),p[0],p[1],.07,g,16);});
  pipe([[.12,.66,.0],[.12,.86,0],[.02,.86,0]],.004,METAL(0xc8794a,.3),g);
  [-.5,.5].forEach(function(x){box(.06,.3,.06,galv,x,.15,0,g);});
  var tp=tagPlate('FCV-301');tp.position.set(.12,.5,.09);g.add(tp);
  return {group:g};
}
function buildVFD(){
  var g=new T.Group();var dk=M(0x2a2e34,{roughness:.45});
  box(.06,.7,.06,METAL(0xb7bec6,.4),0,.35,0,g);
  rbox(.24,.4,.16,.012,dk,0,.85,.06,g);rbox(.2,.24,.005,.01,M(0x5a6068),0,.86,.142,g);
  for(var i=0;i<6;i++)box(.2,.008,.03,M(0x14171a),0,1.06,.0+i*.02,g);
  var s=screen(96,48,function(g2,t,w,h){g2.fillStyle='#1a2a1e';g2.fillRect(0,0,w,h);g2.fillStyle='#8ce6c4';g2.font='700 20px '+MONO;g2.fillText((48.5+Math.sin(t)*.5).toFixed(1)+' Hz',6,30);},3);
  var p=new T.Mesh(new T.PlaneGeometry(.1,.05),screenMat(s));p.position.set(0,.93,.146);g.add(p);
  for(i=0;i<6;i++)box(.022,.014,.006,M(0x111),-.05+(i%3)*.05,.86-Math.floor(i/3)*.03,.146,g);
  return {group:g,update:function(t){s.update(t);}};
}
function buildDesk(){
  var g=new T.Group();var dm=PAINT(0x3b4a5c,.5);
  rbox(1.3,.04,.6,.01,PAINT(0xe9edf1,.5),0,.74,0,g);[-.6,.6].forEach(function(x){box(.04,.72,.56,dm,x,.36,0,g);});
  var scs=[];[[-.32,drawSCADA],[.32,drawTrend]].forEach(function(a){var m=new T.Group();m.position.set(a[0],0,-.15);m.rotation.y=a[0]>0?-.18:.18;g.add(m);
    box(.04,.18,.04,M(0x22262a),0,.85,-.02,m);box(.2,.01,.12,M(0x22262a),0,.765,0,m);rbox(.6,.37,.03,.01,M(0x15181b),0,1.1,0,m);var s=screen(360,224,a[1],10);scs.push(s);var p=new T.Mesh(new T.PlaneGeometry(.56,.33),screenMat(s));p.position.set(0,1.1,.016);m.add(p);});
  rbox(.44,.015,.14,.005,M(0x2a2e33),0,.765,.14,g);
  return {group:g,update:function(t){scs.forEach(function(s){s.update(t);});}};
}
function buildRack(){
  var g=new T.Group();var fr=M(0x1d2228,{roughness:.4,metalness:.4});
  rbox(.6,1.6,.62,.01,fr,0,.82,0,g);
  var leds=[];for(var i=0;i<9;i++){var y=.2+i*.16;rbox(.52,.12,.02,.004,M(i%3?0x30363e:0x4a525c,{metalness:.5,roughness:.35}),0,y,.302,g);for(var j=0;j<4;j++)leds.push([-.2+j*.025,y+.03,.314]);for(j=0;j<10;j++)box(.025,.04,.004,M(0x12161a),.04+j*.022,y,.314,g);}
  var lm=new T.InstancedMesh(new T.BoxGeometry(.01,.008,.004),new T.MeshBasicMaterial({toneMapped:false}),leds.length);var mt=new T.Matrix4(),cA=new T.Color(0x22e07a),cB=new T.Color(0xF2A541);leds.forEach(function(p,i){mt.makeTranslation(p[0],p[1],p[2]);lm.setMatrixAt(i,mt);lm.setColorAt(i,cA);});g.add(lm);
  var door=rbox(.58,1.5,.01,.006,new T.MeshStandardMaterial({color:0x9fb0c4,transparent:true,opacity:.22,roughness:.1,metalness:.3}),0,.82,.33,g);door.__noShadow=true;
  var st7={f:-1};
  return {group:g,update:function(t){var f=Math.floor(t*7);if(f!==st7.f){st7.f=f;for(var i=0;i<leds.length;i++)lm.setColorAt(i,((i*5+f)%7)?cA:cB);lm.instanceColor.needsUpdate=true;}}};
}
function buildGateway(){
  mats();var g=new T.Group();cyl(.03,.03,1.1,galv,0,.55,0,g,16);box(.25,.012,.25,galv,0,.006,0,g);
  rbox(.3,.36,.16,.012,M(0xe9ecef,{roughness:.4}),0,1.0,.09,g);box(.26,.32,.004,new T.MeshStandardMaterial({color:0xaabbd0,transparent:true,opacity:.35,roughness:.1}),0,1.0,.172,g);
  box(.12,.08,.04,M(0x2a2e34),0,1.02,.11,g);box(.03,.01,.005,GLOW(0x22e07a),-.03,1.05,.132,g);box(.03,.01,.005,GLOW(0xF2A541),.02,1.05,.132,g);
  rod([-.1,1.18,.09],[-.13,1.48,.09],.012,M(0x22262a),g);rod([.1,1.18,.09],[.13,1.48,.09],.012,M(0x22262a),g);
  return {group:g,top:[0,1.5,.09]};
}
function buildSatellite(){
  var g=new T.Group();
  var c=cnv(128,128),x=c.getContext('2d');x.fillStyle='#c99a2e';x.fillRect(0,0,128,128);for(var i=0;i<400;i++){x.fillStyle='rgba('+(200+Math.random()*55)+','+(150+Math.random()*60)+',40,.5)';x.beginPath();x.moveTo(Math.random()*128,Math.random()*128);x.lineTo(Math.random()*128,Math.random()*128);x.lineTo(Math.random()*128,Math.random()*128);x.fill();}
  var foil=new T.MeshStandardMaterial({map:ctex(c),metalness:.95,roughness:.28});
  rbox(.42,.42,.6,.02,foil,0,0,0,g);
  var sc=cnv(256,128),s=sc.getContext('2d');s.fillStyle='#0f2a66';s.fillRect(0,0,256,128);for(i=0;i<16;i++)for(var j=0;j<8;j++){s.fillStyle='#1c3f8f';s.fillRect(i*16+1,j*16+1,14,14);s.fillStyle='rgba(120,170,255,.25)';s.fillRect(i*16+2,j*16+2,6,6);}
  var pm=new T.MeshStandardMaterial({map:ctex(sc),metalness:.5,roughness:.25});
  var wings=new T.Group();g.add(wings);
  [-1,1].forEach(function(sgn){box(1.3,.02,.46,pm,sgn*1.0,0,0,wings);box(1.32,.03,.02,METAL(0xd9dee3),sgn*1.0,0,.23,wings);box(1.32,.03,.02,METAL(0xd9dee3),sgn*1.0,0,-.23,wings);rod([sgn*.21,0,0],[sgn*.35,0,0],.02,METAL(0xcccccc),wings);});
  var dish=new T.Mesh(new T.SphereGeometry(.32,32,12,0,PI*2,0,.85),new T.MeshStandardMaterial({color:0xf2f4f6,side:T.DoubleSide,metalness:.3,roughness:.35}));dish.rotation.x=PI;dish.position.y=-.55;g.add(dish);
  rod([0,-.21,0],[0,-.45,0],.025,METAL(0xcccccc),g);rod([0,-.55,0],[0,-.32,0],.012,METAL(0xcccccc),g);cyl(.03,.015,.06,METAL(0xcccccc),0,-.3,0,g);
  [[.18,.24,.25],[-.18,.24,-.25]].forEach(function(p){cyl(.04,.025,.08,METAL(0x777f88),p[0],p[1],p[2],g,12);});
  return {group:g,wings:wings};
}
function buildPhone(){
  var g=new T.Group();rbox(.43,.88,.045,.06,METAL(0x1d2025,.3),0,0,0,g,.01);
  var s=screen(360,720,drawPhone,12);var p=new T.Mesh(new T.PlaneGeometry(.39,.79),screenMat(s));p.position.z=.0235;g.add(p);
  sph(.008,M(0x000000),0,.405,.024,g,10,8);
  return {group:g,update:function(t,v){s.update(t,v);}};
}
/* =====================================================================
   REAL PANEL — manufacturer CAD parts (logos removed), hand-built wiring
   ===================================================================== */
var PARTS=null, partsPromise=null;
function loadParts(){
  if(partsPromise) return partsPromise;
  partsPromise=new Promise(function(res){
    try{
      var L=new T.GLTFLoader(); if(window.MeshoptDecoder) L.setMeshoptDecoder(window.MeshoptDecoder);
      var onLoad=function(g){
        PARTS={};
        g.scene.children.slice().forEach(function(n){ n.position.set(0,0,0); PARTS[n.name]=n;
          n.traverse(function(o){ if(o.isMesh){ o.geometry.__shared=true; var m=o.material; m.__shared=true; m.envMapIntensity=.6; if(m.name==='#c9c9bf') m.roughness=.42; else if(m.metalness<.3) m.roughness=Math.max(.38,Math.min(.62,m.roughness)); } }); });
        res(PARTS);
      };
      var onErr=function(e){ console.warn('3D parts not loaded',e); PARTS=null; res(null); };
      fetch('/parts.txt').then(function(r){ if(!r.ok) throw new Error(r.status); return r.text(); }).then(function(b64){
        var bin=atob(b64.trim()), u=new Uint8Array(bin.length); for(var i=0;i<bin.length;i++) u[i]=bin.charCodeAt(i);
        L.parse(u.buffer,'',onLoad,onErr);
      }).catch(onErr);
    }catch(e){ console.warn(e); res(null); }
  });
  return partsPromise;
}
function part(name,tints){
  var src=PARTS&&PARTS[name]; if(!src) return new T.Group();
  var c=src.clone(true);
  c.traverse(function(o){ if(o.isMesh&&tints&&tints[o.material.name]){ var t=tints[o.material.name]; var m=o.material.clone(); m.__shared=false; m.color.set(t.c); m.roughness=t.r!=null?t.r:.28; m.metalness=0; if(t.e){ m.emissive=new T.Color(t.e); m.emissiveIntensity=t.ei||1; } if(t.op){ m.transparent=true; m.opacity=t.op; } o.material=m; o.__tint=m; } });
  return c;
}

/* ---------- shared live HMI screen (real Trionix screens + live values) ---------- */
var HMI={canvas:null,imgs:{},ver:0,last:-1};
(function(){
  var c=document.createElement('canvas'); c.width=800; c.height=480; HMI.canvas=c; HMI.g=c.getContext('2d');
  ['s1','s2','s3','s4','s5','s6','s7','s8'].forEach(function(k){ var im=new Image(); im.onload=function(){HMI.imgs[k]=im;}; im.src='/hmi-'+k+'.jpg'; });
})();
var HMI_SEQ=[['s1',4],['s2',2.5],['s3',7],['s4',6],['s5',4],['s6',6],['s7',4.5],['s8',3.5]];
var HMI_TOT=HMI_SEQ.reduce(function(a,b){return a+b[1];},0);
function hmiBox(g,x,y,w,h,txt,col,al){ g.fillStyle='#eef2f6'; g.fillRect(x+1,y+1,w-2,h-2); g.fillStyle=col||'#0B2545'; g.font='600 12px '+MONO; g.textAlign=al||'center'; g.textBaseline='middle'; g.fillText(txt, al==='left'?x+6:x+w/2, y+h/2+1); g.textAlign='left'; g.textBaseline='alphabetic'; }
function updateHMI(t){
  if(t-HMI.last<1/12) return HMI.ver; HMI.last=t; var g=HMI.g;
  var tt=t%HMI_TOT, k=0, acc=0; for(var i=0;i<HMI_SEQ.length;i++){ if(tt<acc+HMI_SEQ[i][1]){k=i;break;} acc+=HMI_SEQ[i][1]; }
  var key=HMI_SEQ[k][0], lt=tt-acc, im=HMI.imgs[key];
  if(im) g.drawImage(im,0,0,800,480); else { g.fillStyle='#F4F6F9'; g.fillRect(0,0,800,480); g.fillStyle='#0B2545'; g.font='800 40px '+DISP; g.fillText('TRIONIX',290,250); }
  var s=Math.floor(t)%60,mi=(12+Math.floor(t/60))%60, clock='28-10-2026  14:'+(mi<10?'0':'')+mi+':'+(s<10?'0':'')+s;
  var flow=24.3+.6*Math.sin(t*.7)+.15*Math.sin(t*3.1), air=0.0, sp1=(78+3*Math.sin(t*.5)).toFixed(1), sp2=(0).toFixed(1);
  if(key!=='s1') hmiBox(g,608,11,184,26,clock,'#0B2545');
  if(key==='s3'){
    hmiBox(g,46,56,70,17,'AUTO','#0B7C74'); hmiBox(g,212,56,118,17,'FILTRATION','#0B7C74'); hmiBox(g,420,56,70,17,(Math.floor(t)%1800)+' s'); hmiBox(g,598,56,190,17,(41862.4+t*.0068).toFixed(1)+' m³');
    hmiBox(g,572,113,56,16,flow.toFixed(1)); hmiBox(g,16,307,60,16,sp1); hmiBox(g,598,307,44,16,sp2); hmiBox(g,262,348,56,16,air.toFixed(1));
    g.save(); g.setLineDash([10,8]); g.lineDashOffset=-t*40; g.strokeStyle='rgba(255,255,255,.75)'; g.lineWidth=2;
    g.beginPath(); g.moveTo(137,250); g.lineTo(137,355); g.lineTo(262,355); g.lineTo(262,323); g.lineTo(405,323); g.stroke();
    g.beginPath(); g.moveTo(540,100); g.lineTo(740,100); g.lineTo(740,118); g.stroke(); g.restore();
  } else if(key==='s4'){
    var el=Math.floor(lt*60+380)%1800;
    hmiBox(g,650,122,115,20,'RUNNING','#0B7C74'); hmiBox(g,650,147,79,19,'1800'); hmiBox(g,650,171,79,19,String(el)); hmiBox(g,650,195,79,19,String(1800-el));
    g.fillStyle='#13A89E'; g.fillRect(567,235,214*(el/1800),9);
    for(var j=0;j<5;j++){ g.fillStyle=j<4?'#13A89E':(Math.floor(t*2)%2?'#F2A541':'#d0d8e0'); g.beginPath(); g.arc(573,289+j*18.2,6,0,PI*2); g.fill(); }
    g.save(); g.setLineDash([10,8]); g.lineDashOffset=-t*40; g.strokeStyle='rgba(255,255,255,.8)'; g.lineWidth=2; g.beginPath(); g.moveTo(100,220); g.lineTo(100,295); g.lineTo(190,295); g.lineTo(190,268); g.lineTo(290,268); g.stroke(); g.beginPath(); g.moveTo(380,120); g.lineTo(490,120); g.lineTo(490,140); g.stroke(); g.restore();
  } else if(key==='s6'){
    g.save(); g.beginPath(); g.rect(14,83,526,329); g.clip(); g.strokeStyle='#e3e9ef'; g.lineWidth=1;
    for(var y=0;y<6;y++){ g.beginPath(); g.moveTo(14,120+y*55); g.lineTo(540,120+y*55); g.stroke(); }
    [['#13A89E',0,26,250],['#8fa1b7',2.2,10,330]].forEach(function(L){ g.beginPath(); for(var x=0;x<=526;x+=3){ var kk=t*.8+x*.025+L[1]; var yy=L[3]-L[2]*Math.sin(kk*.6)-6*Math.sin(kk*2.3); if(x) g.lineTo(14+x,yy); else g.moveTo(14+x,yy); } g.strokeStyle=L[0]; g.lineWidth=2.5; g.stroke(); });
    g.restore();
    hmiBox(g,672,85,79,19,(41862.4+t*.0068).toFixed(0)); hmiBox(g,672,113,79,19,(812.6+t*.0068).toFixed(1)); hmiBox(g,672,141,79,19,flow.toFixed(1));
    [4821,4790,2210,2198].forEach(function(h,i){ hmiBox(g,672,267+i*34,79,19,String(h+Math.floor(t/3600))); });
  } else if(key==='s7'){
    hmiBox(g,91,61,53,20,'1','#c0392b'); hmiBox(g,312,61,54,20,lt>2.5?'0':'1','#9A5F12');
    var rows=[['14:21:05','ALARM','Low RF tank level – LS02','#c0392b'],['13:58:40','CLEARED','Air scrub failure – FT-102','#0B7C74'],['11:02:12','CLEARED','No flow – FT-101','#0B7C74']];
    rows.forEach(function(r,i){ var y=126+i*30; g.fillStyle=i===0?(lt<2.5&&Math.floor(t*2)%2?'#fde7e4':'#fff5f3'):'#ffffff'; g.fillRect(14,y,772,26); g.fillStyle='#d9e1ea'; g.fillRect(14,y+26,772,1);
      g.font='600 12px '+MONO; g.fillStyle='#24364F'; g.fillText(r[0],24,y+17); g.fillStyle=r[3]; g.fillText(r[1],120,y+17); g.fillStyle='#0B2545'; g.font='500 13px '+DISP; g.fillText(r[2],220,y+17); });
  }
  HMI.ver++; return HMI.ver;
}
function hmiTexture(){ var tx=new T.CanvasTexture(HMI.canvas); tx.encoding=T.sRGBEncoding; tx.anisotropy=8; tx.__ver=-1; return tx; }

/* ---------- small helpers ---------- */
function tagLabel(text,w,h,opt){ opt=opt||{}; var c=cnv(Math.round(w*4000),Math.round(h*4000)),g=c.getContext('2d');
  g.fillStyle=opt.bg||'#f7f7f2'; g.fillRect(0,0,c.width,c.height); g.strokeStyle='rgba(0,0,0,.25)'; g.lineWidth=3; g.strokeRect(1,1,c.width-2,c.height-2);
  g.fillStyle=opt.fg||'#111'; g.font=(opt.weight||700)+' '+Math.round(c.height*.58)+'px '+MONO; g.textAlign='center'; g.textBaseline='middle'; g.fillText(text,c.width/2,c.height/2+2);
  var m=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshStandardMaterial({map:ctex(c),roughness:.6,polygonOffset:true,polygonOffsetFactor:-2})); m.__noShadow=true; return m; }
function stripeTex(c1,c2){ var c=cnv(8,64),g=c.getContext('2d'); g.fillStyle=c1; g.fillRect(0,0,8,64); g.fillStyle=c2; for(var i=0;i<4;i++){ g.save(); g.translate(0,i*16); g.beginPath(); g.moveTo(0,0); g.lineTo(8,0); g.lineTo(8,8); g.lineTo(0,8); g.fill(); g.restore(); } var t=ctex(c); t.wrapS=t.wrapT=T.RepeatWrapping; t.repeat.set(1,40); return t; }
function corrTex(){ var c=cnv(4,64),g=c.getContext('2d'); for(var y=0;y<64;y++){ var v=Math.round(128+100*Math.sin(y/64*PI*2*4)); g.fillStyle='rgb('+v+','+v+','+v+')'; g.fillRect(0,y,4,1); } var t=ctex(c,null,false); t.wrapS=t.wrapT=T.RepeatWrapping; t.repeat.set(1,60); return t; }

/* ---------- the panel ---------- */
function buildRealPanel(o){
  o=o||{}; var g=new T.Group(); var W=1.0,H=2.0,D=.5,PL=.1;
  var ral=PAINT(0xC9CDCB,.42), plinthM=PAINT(0x3a3d41,.6), plateM=PAINT(0xD9731F,.55); plateM.envMapIntensity=.3;
  var blk=M(0x18191b,{roughness:.5}), zinc=METAL(0xc9ced4,.32), chrome=METAL(0xe3e6ea,.14), gasket=M(0x101112,{roughness:.8});
  var shell=new T.Group(); g.add(shell);
  /* plinth + shell */
  rbox(W,PL,D,.004,plinthM,0,PL/2,0,shell); box(W-.12,.07,.004,M(0x222426),0,PL/2,D/2+.001,shell);
  rbox(W,H,.018,.006,ral,0,PL+H/2,-D/2+.009,shell);
  rbox(.018,H,D,.006,ral,-W/2+.009,PL+H/2,0,shell); rbox(.018,H,D,.006,ral,W/2-.009,PL+H/2,0,shell);
  rbox(W+.06,.03,D+.06,.012,ral,0,PL+H+.015,0,shell); rbox(W,.02,D,.006,ral,0,PL+.01,0,shell);
  [-1,1].forEach(function(s){ box(.03,H-.02,.018,ral,s*(W/2-.015),PL+H/2,D/2-.009,shell); }); box(W,.03,.018,ral,0,PL+H-.015,D/2-.009,shell); box(W,.03,.018,ral,0,PL+.015,D/2-.009,shell);
  [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(function(a){ tor(.03,.008,chrome,a[0]*(W/2-.08),PL+H+.07,a[1]*(D/2-.08),shell); cyl(.013,.013,.03,chrome,a[0]*(W/2-.08),PL+H+.042,a[1]*(D/2-.08),shell,14); });
  /* side louvres */
  [-1,1].forEach(function(s){ var lv=new T.Group(); lv.position.set(s*(W/2+.002),PL+1.55,0); shell.add(lv); rbox(.24,.24,.01,.02,M(0x3a3e43,{roughness:.6}),0,0,0,lv).rotation.y=PI/2; for(var i=0;i<8;i++) box(.012,.012,.2,M(0x23272b),s*.003,-.095+i*.027,0,lv); });

  /* ---------- interior ---------- */
  var inner=new T.Group(); g.add(inner); inner.__inner=true;
  var zP=-D/2+.03, zp=zP+.0015; /* plate front */
  rbox(.88,1.82,.003,.003,plateM,0,PL+.09+.91,zP,inner);
  var led=box(.7,.012,.012,new T.MeshStandardMaterial({color:0xffffff,emissive:new T.Color(0xfff6e8),emissiveIntensity:1.2}),0,PL+H-.05,D/2-.14,inner); led.__noShadow=true;
  var ilight=new T.PointLight(0xfff4e6,.45,2.6,1.6); ilight.position.set(0,PL+H-.12,.05); inner.add(ilight);
  /* DIN rails */
  var railShape=new T.Shape(); [[-17.5,7.5],[-12.5,7.5],[-12.5,1],[12.5,1],[12.5,7.5],[17.5,7.5],[17.5,6.5],[13.5,6.5],[13.5,0],[-13.5,0],[-13.5,6.5],[-17.5,6.5]].forEach(function(p,i){ if(i) railShape.lineTo(p[0]/1000,p[1]/1000); else railShape.moveTo(p[0]/1000,p[1]/1000); });
  /* simpler robust rail: build from boxes */
  function rail2(x0,x1,y){ var L=x1-x0, cx=(x0+x1)/2; box(L,.025,.0012,zinc,cx,y,zp+.0006,inner); box(L,.001,.0075,zinc,cx,y+.0125,zp+.00375,inner); box(L,.001,.0075,zinc,cx,y-.0125,zp+.00375,inner); box(L,.005,.0012,zinc,cx,y+.015,zp+.0069,inner); box(L,.005,.0012,zinc,cx,y-.015,zp+.0069,inner);
    var sl=[]; for(var x=x0+.015;x<x1-.01;x+=.025) sl.push([x,y,zp+.0013]); iboxes(sl,.015,.0052,.0004,M(0x2c2f33),inner); }
  /* slotted wiring duct with lid */
  var ductM=new T.MeshStandardMaterial({color:0x8e9396,roughness:.55,metalness:0,envMapIntensity:.5}), ductIn=M(0x6f7477,{roughness:.7});
  var fingers=[], DD=.06, DW=.06;
  function duct(x0,y0,x1,y1){ var hor=Math.abs(y1-y0)<1e-6; var L=hor?(x1-x0):(y1-y0); var cx=(x0+x1)/2, cy=(y0+y1)/2;
    if(hor){ box(L,DW,.002,ductIn,cx,cy,zp+.001,inner); var lid=rbox(L+.002,DW+.004,.004,.0015,ductM,cx,cy,zp+DD,inner); for(var x=x0+.004;x<x1-.004;x+=.012){ fingers.push([x+.0035,cy+DW/2-.001,zp+DD/2]); fingers.push([x+.0035,cy-DW/2+.001,zp+DD/2]); } }
    else { box(DW,L,.002,ductIn,cx,cy,zp+.001,inner); rbox(DW+.004,L+.002,.004,.0015,ductM,cx,cy,zp+DD,inner); for(var y=y0+.004;y<y1-.004;y+=.012){ fingers.push([cx+DW/2-.001,y+.0035,zp+DD/2,1,1,1,0,0,PI/2]); fingers.push([cx-DW/2+.001,y+.0035,zp+DD/2,1,1,1,0,0,PI/2]); } }
    /* wires visible inside duct */
    var cols=[0x1d5fbf,0x1d5fbf,0x2a2d31,0xc0392b,0x8a9096,0x1d5fbf]; for(var i=0;i<6;i++){ var off=-DW/2+.012+i*.007, dz=zp+.01+((i*7)%4)*.009; var r=rod(hor?[x0+.01,cy+off,dz]:[cx+off,y0+.01,dz],hor?[x1-.01,cy+off,dz]:[cx+off,y1-.01,dz],.0018,M(cols[i],{roughness:.45}),inner,6); r.__noShadow=true; }
  }
  /* layout rows */
  var yA=PL+1.72, yB=PL+1.38, yC=PL+1.03, yD=PL+.68;
  var dY=[yA+.17,(yA+yB)/2+.01,(yB+yC)/2,(yC+yD)/2,yD-.17];
  dY.forEach(function(y){ duct(-.39,y,.39,y); });
  duct(-.42,dY[4]-DW/2,-.42,dY[0]+DW/2); duct(.42,dY[4]-DW/2,.42,dY[0]+DW/2);
  var fin=iboxes(fingers,.0075,.002,DD-.004,ductM,inner); fin.__noShadow=true;
  /* wires */
  var WIRES={}; function wire(col,pts,r){ (WIRES[col]=WIRES[col]||[]).push({pts:pts,r:r||.0016}); }
  var ferr=[]; var slotsCache={};
  function slotX(x){ var k=Math.round((x+.39-.004-.0095)/.012); return -.39+.004+.0095+k*.012-.0035; }
  function slotY(y){ return y; }
  function toDuct(x,yT,zT,dir,yEdge,col,r){ var xs=Math.max(-.37,Math.min(.37,slotX(x)));
    wire(col,[[x,yT,zT],[x,yT+dir*.01,zT],[x+(xs-x)*.4,yT+dir*.03,zT-.004],[xs,yEdge-dir*.012,zp+.042],[xs,yEdge+dir*.004,zp+.034]],r);
    ferr.push([x,yT+dir*.006,zT,1,1,1,0,0,0]); }
  function edge(y,dir){ /* duct edge facing a device row */ var best=null; dY.forEach(function(d){ var e=d-dir*DW/2; if(dir>0? (e>y&&(best===null||e<best)) : (e<y&&(best===null||e>best))) best=e; }); return best; }
  var Z7=zp+.0075;
  function place(name,x,y,z,tints){ var p=part(name,tints); p.position.set(x,y,z); inner.add(p); return p; }
  function terms(x,w,n,y,z,dir,col,r){ var ye=edge(y,dir); for(var i=0;i<n;i++){ var xx=n===1?x:x-w/2+i*(w/(n-1)); toDuct(xx,y,z,dir,ye,typeof col==='function'?col(i):col,r); } }
  var BLUE=0x0f3f9e, GREY=0x6d747a, BLACK=0x18191b, RED=0xa8231a, YEL=0xc99a12, BLU2=0x123c8c, WHITE=0xd9dde1, GY='gy';
  /* Row A: PSU + PLC + I/O + switch */
  rail2(-.39,.39,yA);
  var xs=-.385, devA=[['psu',.07,.012],['cpu',.11,0],['di16',.045,0],['di16',.045,0],['dq16',.045,0],['ai4',.045,0],['aq2',.045,.012],['sw',.045,0]];
  var pos={};
  devA.forEach(function(d){ var cx=xs+d[1]/2; place(d[0],cx,yA,Z7); pos[d[0]+(pos[d[0]]?'2':'')]=cx; xs+=d[1]+d[2]; });
  terms(pos.psu,.04,3,yA-.0625,Z7+.1,-1,function(i){return [RED,BLACK,GY][i];},.0019); terms(pos.psu,.045,4,yA+.0625,Z7+.1,1,function(i){return i<2?BLUE:0x6a8fd8;});
  terms(pos.cpu,.09,12,yA+.05,Z7+.063,1,function(i){return i<2?(i?0x6a8fd8:BLUE):BLUE;}); terms(pos.cpu,.07,9,yA-.05,Z7+.063,-1,BLUE);
  ['di16','di162','dq16'].forEach(function(k){ terms(pos[k],.032,9,yA+.05,Z7+.063,1,BLUE); terms(pos[k],.032,9,yA-.05,Z7+.063,-1,k==='dq16'?GREY:BLUE); });
  terms(pos.ai4,.03,6,yA+.05,Z7+.063,1,GREY); terms(pos.ai4,.025,4,yA-.05,Z7+.063,-1,WHITE); terms(pos.aq2,.025,4,yA+.05,Z7+.063,1,GREY); terms(pos.aq2,.02,3,yA-.05,Z7+.063,-1,WHITE);
  /* device tag labels (panel builder BMK labels) */
  var psuTag=tagLabel('-U1  24V DC',.05,.011); psuTag.position.set(pos.psu,yA+.035,Z7+.1272); inner.add(psuTag);
  var cpuTag=tagLabel('-A1',.024,.01); cpuTag.position.set(pos.cpu+.032,yA+.036,Z7+.0753); inner.add(cpuTag);
  var swTag=tagLabel('-A9 SWITCH',.036,.011); swTag.position.set(pos.sw,yA-.006,Z7+.0753); inner.add(swTag);
  /* Row B: 2 VFDs + MCBs + MPCBs */
  var vlcd=screen(128,64,function(g2,t,w,h){ g2.fillStyle='#0d1a14'; g2.fillRect(0,0,w,h); g2.fillStyle='#7df2c8'; g2.font='700 30px '+MONO; g2.textAlign='right'; g2.fillText((48.5+Math.sin(t*.6)*.4).toFixed(2),w-30,40); g2.font='700 14px '+MONO; g2.fillText('Hz',w-6,40); g2.textAlign='left'; g2.font='600 12px '+MONO; g2.fillText('RUN  FWD',6,58); },4);
  var vx=[-.335,-.225]; vx.forEach(function(x,i){ place('vfd',x,yB,zp); var lp=new T.Mesh(new T.PlaneGeometry(.036,.018),screenMat(vlcd)); lp.position.set(x-.012,yB+.032,zp+.1468); inner.add(lp); var tl=tagLabel('-T'+(i+1)+'  VFD-0'+(i+1),.06,.011); tl.position.set(x,yB+.064,zp+.1475); inner.add(tl);
    terms(x,.06,7,yB-.075,zp+.085,-1,function(j){return [RED,YEL,BLU2,GY,BLACK,BLACK,BLACK][j];},.0021); });
  rail2(-.165,.39,yB);
  for(var i=0;i<12;i++){ var mx=-.152+i*.018; place('mcb',mx,yB,Z7); toDuct(mx,yB+.045,Z7+.05,1,edge(yB+.045,1),i<3?[RED,YEL,BLU2][i]:RED,.0018); toDuct(mx,yB-.045,Z7+.05,-1,edge(yB-.045,-1),i<3?[RED,YEL,BLU2][i]:RED,.0018); }
  var mpx=.085; for(i=0;i<6;i++){ var px=mpx+i*.05; place('mpcb',px,yB,Z7); terms(px,.027,3,yB+.0487,Z7+.075,1,function(j){return [RED,YEL,BLU2][j];},.002); terms(px,.027,3,yB-.0487,Z7+.075,-1,function(j){return [RED,YEL,BLU2][j];},.002); }
  /* Row C: DOL starters (contactor + overload) and control contactors */
  rail2(-.39,.39,yC+.03);
  for(i=0;i<6;i++){ var sx=-.36+i*.05, cy=yC+.03; place('cont',sx,cy,Z7); place('olr',sx,cy-.029-.038+.012,Z7+.002);
    terms(sx,.027,3,cy+.029,Z7+.056,1,function(j){return [RED,YEL,BLU2][j];},.002); toDuct(sx+.018,cy+.029,Z7+.064,1,edge(cy+.029,1),BLACK);
    terms(sx,.027,3,cy-.093,Z7+.055,-1,function(j){return [RED,YEL,BLU2][j];},.002);
    var tl=tagLabel('-K'+(i+1),.02,.009); tl.position.set(sx,cy+.017,Z7+.0735); inner.add(tl); }
  for(i=0;i<8;i++){ var kx=-.04+i*.05; place('cont',kx,yC+.03,Z7); terms(kx,.027,3,yC+.059,Z7+.056,1,BLACK); terms(kx,.027,3,yC+.001,Z7+.056,-1,BLACK); var tl2=tagLabel('-K'+(i+11),.022,.009); tl2.position.set(kx,yC+.047,Z7+.0735); inner.add(tl2); }
  /* Row D: terminal blocks (hand-modelled, realistic profile) */
  rail2(-.39,.39,yD);
  var tbS=new T.Shape(); [[-30,0],[-30,22],[-24,30],[-14,30],[-14,36],[-6,44],[6,44],[14,36],[14,30],[24,30],[30,22],[30,0]].forEach(function(p,i){ var x=p[0]/1000,y=p[1]/1000; if(i) tbS.lineTo(x,y); else tbS.moveTo(x,y); });
  var tbList=[], tbCols=[]; var tx=-.383; var groups=[[8,0x8cc63f],[1,0x6c7176],[24,0xb9bec3],[1,0x6c7176],[20,0x2f6bd8],[1,0x6c7176],[72,0xb9bec3],[1,0x6c7176]];
  groups.forEach(function(gr){ for(var k=0;k<gr[0];k++){ tbList.push([tx,yD,Z7]); tbCols.push(gr[1]); tx+=.0052; } });
  var tbMesh=new T.InstancedMesh((function(){ var gm=new T.ExtrudeGeometry(tbS,{depth:.0048,bevelEnabled:false}); /* shape in XY: x=height,y=depth */ gm.rotateZ(PI/2); /* now x=-depth? */ gm.rotateY(PI/2); gm.translate(-.0024,0,0); return gm; })(),M(0xffffff,{roughness:.55}),tbList.length);
  var mt=new T.Matrix4(),cc=new T.Color(); tbList.forEach(function(p,k){ mt.makeTranslation(p[0],p[1],p[2]); tbMesh.setMatrixAt(k,mt); tbMesh.setColorAt(k,cc.set(tbCols[k])); }); inner.add(tbMesh);
  var screws=[]; tbList.forEach(function(p,k){ if(tbCols[k]===0x6c7176) return; screws.push([p[0],yD+.019,Z7+.031],[p[0],yD-.019,Z7+.031]); });
  var sc=new T.InstancedMesh(new T.CylinderGeometry(.0016,.0016,.003,10),METAL(0xd7dade,.25),screws.length); screws.forEach(function(p,k){ mt.makeRotationX(PI/2); mt.setPosition(p[0],p[1],p[2]); sc.setMatrixAt(k,mt); }); inner.add(sc);
  var mk=cnv(1024,48),mg=mk.getContext('2d'); mg.fillStyle='#ffffff'; mg.fillRect(0,0,1024,48); mg.fillStyle='#111'; mg.font='700 22px '+MONO; for(var n=0;n<44;n++) mg.fillText(String(n+1),4+n*23.2,32);
  var mkm=new T.Mesh(new T.PlaneGeometry(.66,.007),new T.MeshStandardMaterial({map:ctex(mk),roughness:.6})); mkm.position.set(-.383+.33,yD,Z7+.0442); inner.add(mkm);
  tbList.forEach(function(p,k){ if(tbCols[k]===0x6c7176) return; var c=tbCols[k]; var top=c===0x8cc63f?GY:(c===0x2f6bd8?BLUE:(k<40?RED:BLUE)); toDuct(p[0],yD+.03,Z7+.026,1,edge(yD+.03,1),top,.0015);
    var bot=c===0x8cc63f?GY:([BLACK,WHITE,GREY][k%3]); toDuct(p[0],yD-.03,Z7+.026,-1,edge(yD-.03,-1),bot,.0014); });
  /* earth bar + gland plate + incoming field cables */
  var yE=yD-.29; box(.5,.025,.006,METAL(0xc8794a,.3),0,yE,zp+.025,inner); [-.24,.24].forEach(function(x){ box(.02,.03,.025,M(0xe9b43c,{roughness:.5}),x,yE,zp+.012,inner); });
  for(i=0;i<12;i++){ var ex=-.2+i*.036; cyl(.004,.004,.008,chrome,ex,yE,zp+.03,inner,10).rotation.x=PI/2; wire(GY,[[ex,yE+.012,zp+.03],[ex,yE+.05,zp+.035],[slotX(ex),dY[4]-DW/2-.01,zp+.035],[slotX(ex),dY[4]-DW/2+.004,zp+.034]],.0022); }
  var gp=rbox(W-.06,.004,D-.06,.004,zinc,0,PL+.03,0,inner);
  var cabM=[M(0x2a2c2f,{roughness:.6}),M(0x5b6066,{roughness:.6}),M(0x1d4f8c,{roughness:.55})]; var fieldPaths=[];
  for(i=0;i<10;i++){ var gx=-.36+i*.08, gz=-.06+(i%2)*.1; var gl=new T.Group(); gl.position.set(gx,PL+.032,gz); inner.add(gl);
    cyl(.016,.016,.008,METAL(0x9aa1a8,.35),0,.004,0,gl,6); cyl(.013,.015,.022,M(0x2b2e32,{roughness:.55}),0,.019,0,gl,24); cyl(.01,.012,.012,M(0x2b2e32,{roughness:.55}),0,.036,0,gl,24);
    var cr=.0065+(i%3)*.0015, cm=cabM[i%3]; var top2=yE-.03-(i%4)*.012; var tx2=slotX(gx*.9);
    var pth=smooth([[gx,PL-.05,gz],[gx,PL+.04,gz],[gx,top2-.05,gz*.4+zp*.6],[gx*.95,top2,zp+.035]]); fieldPaths.push(pth); var tb=new T.Mesh(new T.TubeGeometry(pth,24,cr,12,false),cm); inner.add(tb);
    var endP=pth.getPointAt(1); cyl(cr+.0012,cr+.0012,.018,M(0x111111,{roughness:.4}),endP.x,endP.y-.008,endP.z,inner,12);
    var cores=[BLACK,WHITE,GY,BLUE]; for(var j=0;j<(i%2?2:4);j++){ var ox=(j-1.5)*.0035; wire(cores[j],[[endP.x+ox,endP.y,endP.z],[endP.x+ox,endP.y+.02,endP.z],[tx2+ox*2,dY[4]-DW/2-.03,zp+.04],[tx2+ox*2,dY[4]-DW/2+.004,zp+.034]],.0013); } }
  /* build wires */
  var wkeys=Object.keys(WIRES), gyTex=stripeTex('#2fa84f','#f2d21b');
  wkeys.forEach(function(k){ var list=WIRES[k]; var geos=list.map(function(w){ return new T.TubeGeometry(smooth(w.pts),14,w.r,6,false); });
    var merged=T.BufferGeometryUtils.mergeBufferGeometries(geos); geos.forEach(function(x){x.dispose();});
    var mm=k==='gy'?new T.MeshStandardMaterial({map:gyTex,roughness:.55,envMapIntensity:.35}):new T.MeshStandardMaterial({color:+k,roughness:.58,metalness:0,envMapIntensity:.35}); var wm=new T.Mesh(merged,mm); inner.add(wm); });
  var fm=iboxes(ferr.map(function(f){return [f[0],f[1],f[2]];}),.0042,.011,.0042,M(0xf4f4f0,{roughness:.5}),inner);
  /* green Ethernet patch cords */
  var ethM=new T.MeshStandardMaterial({color:0x1f9d4b,roughness:.45}), clr=new T.MeshStandardMaterial({color:0xdfe6ea,roughness:.15,transparent:true,opacity:.65});
  function rj45(x,y,z){ var p=new T.Group(); p.position.set(x,y,z); inner.add(p); rbox(.012,.016,.011,.002,clr,0,-.008,0,p); rbox(.013,.018,.013,.003,ethM,0,-.024,0,p); return [x,y-.033,z]; }
  var ethTop=dY[1]+DW/2;
  var e1=rj45(pos.cpu-.03,yA-.05,Z7+.035), e2=rj45(pos.sw-.012,yA-.05,Z7+.035), e3=rj45(pos.sw+.004,yA-.05,Z7+.035), e4=rj45(pos.sw+.018,yA-.05,Z7+.035);
  [[e1,slotX(pos.cpu-.03)],[e2,slotX(pos.sw-.012)],[e3,slotX(pos.sw+.004)],[e4,slotX(pos.sw+.018)]].forEach(function(a){ var e=a[0]; var tb=new T.Mesh(new T.TubeGeometry(smooth([e,[e[0],e[1]-.02,e[2]+.004],[a[1],ethTop+.02,zp+.06],[a[1],ethTop+.004,zp+.045]]),20,.0028,8,false),ethM); inner.add(tb); });

  /* ---------- door ---------- */
  var Wd=W-.006,Hd=H-.006,fz=.022;
  var pivot=new T.Group(); pivot.position.set(-W/2+.003,PL+.003,D/2); g.add(pivot);
  rbox(Wd,Hd,fz,.01,ral,Wd/2,Hd/2,fz/2,pivot);
  [.03,Wd-.03].forEach(function(x){ box(.008,Hd-.07,.008,gasket,x,Hd/2,-.004,pivot); }); [.03,Hd-.03].forEach(function(y){ box(Wd-.06,.008,.008,gasket,Wd/2,y,-.004,pivot); });
  [.18,Wd-.18].forEach(function(x){ box(.04,Hd-.2,.014,ral,x,Hd/2,-.007,pivot); });
  box(.012,Hd-.12,.006,zinc,Wd-.07,Hd/2,-.01,pivot);
  rbox(.32,.24,.02,.01,M(0x6d747b,{roughness:.6}),Wd/2,.55,-.012,pivot);
  function U(u){return Wd/2+u;} function Vv(v){return Hd/2+v;}
  /* decal: labels, warning, tri-strip */
  var dc=cnv(1024,Math.round(1024*Hd/Wd)),dg=dc.getContext('2d'),sx2=1024/Wd,sy2=dc.height/Hd;
  function DX(u){return (u+Wd/2)*sx2;} function DY2(v){return (Hd/2-v)*sy2;}
  function plate(u,v,txt,wd){var w=(wd||.09)*sx2,h=.024*sy2;dg.fillStyle='#fbfbf8';rrect(dg,DX(u)-w/2,DY2(v)-h/2,w,h,4);dg.fill();dg.strokeStyle='#333';dg.lineWidth=2;dg.stroke();dg.fillStyle='#111';dg.font='700 '+Math.round(h*.52)+'px '+MONO;dg.textAlign='center';dg.textBaseline='middle';dg.fillText(txt,DX(u),DY2(v)+1);}
  var yL=-.06, yP=-.22, yS=-.38;
  [['POWER ON',-.3],['RUN',-.1],['TRIP',.1],['FAULT',.3]].forEach(function(a){plate(a[1],yL-.045,a[0]);});
  [['START',-.3],['STOP',-.1],['RESET',.1]].forEach(function(a){plate(a[1],yP-.045,a[0]);}); plate(.3,yP-.075,'EMERGENCY STOP',.13);
  plate(-.32,.27,'AMMETER',.1); plate(.32,.27,'MULTI-FUNCTION METER',.16);
  var tx3=DX(-.36),ty3=DY2(-.72),ts=.1*sx2;dg.fillStyle='#F2C230';dg.beginPath();dg.moveTo(tx3,ty3-ts*.55);dg.lineTo(tx3+ts*.6,ty3+ts*.48);dg.lineTo(tx3-ts*.6,ty3+ts*.48);dg.closePath();dg.fill();dg.strokeStyle='#111';dg.lineWidth=5;dg.stroke();
  dg.fillStyle='#111';dg.beginPath();dg.moveTo(tx3+4,ty3-ts*.3);dg.lineTo(tx3-11,ty3+6);dg.lineTo(tx3,ty3+6);dg.lineTo(tx3-6,ty3+ts*.34);dg.lineTo(tx3+13,ty3-2);dg.lineTo(tx3+2,ty3-2);dg.closePath();dg.fill();
  dg.font='800 '+Math.round(.02*sy2)+'px '+DISP;dg.fillText('DANGER',tx3,ty3+ts*.75);dg.font='700 '+Math.round(.015*sy2)+'px '+MONO;dg.fillText('415 V',tx3,ty3+ts*.95);
  var dec=new T.Mesh(new T.PlaneGeometry(Wd,Hd),new T.MeshStandardMaterial({map:ctex(dc),transparent:true,roughness:.5,polygonOffset:true,polygonOffsetFactor:-2}));dec.position.set(Wd/2,Hd/2,fz+.0005);dec.__noShadow=true;pivot.add(dec);
  /* nameplate */
  var np=screen(800,140,nameplate(o.tag||'CP-01',o.title||'PLC CONTROL PANEL'),1);np.update(0);
  rbox(.56,.1,.003,.003,METAL(0xc8cfd6,.3),U(0),Vv(.86),fz+.0015,pivot);
  var npm=new T.Mesh(new T.PlaneGeometry(.55,.096),new T.MeshStandardMaterial({map:np.tex,metalness:.35,roughness:.4}));npm.position.set(U(0),Vv(.86),fz+.0032);pivot.add(npm);
  /* real HMI with real screens */
  var HS=1.6; var hmi=part('hmi'); var hY=Vv(.55); hmi.scale.setScalar(HS); hmi.position.set(U(0),hY,fz+.006-.045*HS); pivot.add(hmi);
  var fc=cnv(856,632),fg=fc.getContext('2d'); fg.fillStyle='#22262b'; fg.fillRect(0,0,856,632); fg.strokeStyle='rgba(255,255,255,.07)'; fg.lineWidth=2; for(var fk=0;fk<8;fk++){ rrect(fg,108+fk*77,488,58,40,6); fg.stroke(); fg.fillStyle='rgba(255,255,255,.18)'; fg.font='600 14px '+MONO; fg.fillText('F'+(fk+1),128+fk*77,513); }
  var foil=new T.Mesh(new T.PlaneGeometry(.2135*HS,.1575*HS),new T.MeshStandardMaterial({map:ctex(fc),roughness:.38,metalness:0})); foil.position.set(U(0),hY,fz+.0072); pivot.add(foil);
  var htex=hmiTexture(); var scr=new T.Mesh(new T.PlaneGeometry(.154*HS,.086*HS),new T.MeshBasicMaterial({map:htex,toneMapped:false})); scr.position.set(U(-.006*HS),hY+.0148*HS,fz+.0076); pivot.add(scr);
  var glass=new T.Mesh(new T.PlaneGeometry(.156*HS,.088*HS),new T.MeshPhysicalMaterial({color:0xffffff,roughness:.05,metalness:0,transparent:true,opacity:.12,clearcoat:1})); glass.position.set(U(-.006*HS),hY+.0148*HS,fz+.008); pivot.add(glass);
  /* meters (96x96) */
  var mA=screen(160,160,drawMeter('A'),10),mf=screen(160,160,drawMFM,4);
  rbox(.096,.096,.05,.006,blk,U(-.32),Vv(.33),fz-.012,pivot); var pa=new T.Mesh(new T.PlaneGeometry(.084,.084),new T.MeshStandardMaterial({map:mA.tex,roughness:.2})); pa.position.set(U(-.32),Vv(.33),fz+.0132); pivot.add(pa);
  rbox(.096,.096,.05,.006,blk,U(.32),Vv(.33),fz-.012,pivot); var pm2=new T.Mesh(new T.PlaneGeometry(.07,.055),screenMat(mf)); pm2.position.set(U(.32),Vv(.345),fz+.0132); pivot.add(pm2);
  for(var q=0;q<4;q++) cyl(.0055,.0055,.004,M(0x3a3e43),U(.296+q*.017),Vv(.302),fz+.014,pivot,12).rotation.x=PI/2;
  /* pilot lamps, push buttons, e-stop (real parts) */
  var lampC=[[0xffffff,0xffffff],[0x2fbf5a,0x22e06a],[0xf2a541,0xffa020],[0xe0352b,0xff2a1a]], lamps=[];
  lampC.forEach(function(c,i){ var l=part('lamp',{lens:{c:c[0],e:c[1],ei:.9,r:.2}}); l.position.set(U(-.3+i*.2),Vv(yL),fz-.047); pivot.add(l); l.traverse(function(o){ if(o.__tint) lamps.push(o.__tint); }); });
  [[0x1e9a46],[0xd2342a],[0x23272c]].forEach(function(c,i){ var b=part('pb',{cap:{c:c[0],r:.3}}); b.position.set(U(-.3+i*.2),Vv(yP),fz-.047); pivot.add(b); });
  var es=part('estop'); es.position.set(U(.3),Vv(yP),fz-.05); pivot.add(es);
  /* filter grille, handle, hinges */
  rbox(.2,.2,.016,.01,M(0x3a3f45,{roughness:.6}),U(.3),Vv(-.74),fz+.008,pivot); for(var h=0;h<7;h++) box(.17,.008,.006,M(0x23272b),U(.3),Vv(-.815+h*.025),fz+.017,pivot);
  rbox(.04,.22,.03,.012,blk,U(.46),Vv(0),fz+.015,pivot); cyl(.011,.011,.012,chrome,U(.46),Vv(.06),fz+.034,pivot,16).rotation.x=PI/2;
  [.22,Hd/2,Hd-.22].forEach(function(y){ cyl(.012,.012,.08,chrome,-.002,y,.012,pivot,16); });
  /* door inner: duct, device wiring, HMI rear cable */
  box(.03,Hd-.5,.03,ductM,.07,Hd/2,-.022,pivot);
  /* hinge loop (spiral hose + green Ethernet) rebuilt when the door moves */
  var hoseM=new T.MeshStandardMaterial({color:0x1b1d20,roughness:.55,bumpMap:corrTex(),bumpScale:.0015});
  var loop={hose:null,eth:null,ang:-9};
  var Pp=new T.Vector3(), Pd=new T.Vector3();
  function rebuildLoop(){
    pivot.updateMatrix(); var m=pivot.matrix;
    var d1=new T.Vector3(.07,Hd/2-.05,-.04).applyMatrix4(m), d2=new T.Vector3(.04,Hd/2-.06,-.08).applyMatrix4(m);
    var hp=[[-.42,PL+.95,zp+.065],[-.45,PL+.93,.0],[(-.47+d2.x)/2,(PL+.93+d2.y)/2,(.12+d2.z)/2],[d2.x,d2.y,d2.z],[d1.x,d1.y,d1.z]];
    if(loop.hose){ inner.remove(loop.hose); loop.hose.geometry.dispose(); }
    loop.hose=new T.Mesh(new T.TubeGeometry(smooth(hp),40,.011,10,false),hoseM); inner.add(loop.hose);
    var h1=new T.Vector3(U(-.06),hY-.1,-.05).applyMatrix4(m), h0=new T.Vector3(.1,hY-.09,-.03).applyMatrix4(m), h2=new T.Vector3(.07,hY-.12,-.04).applyMatrix4(m);
    var ep=[[-.42,PL+1.32,zp+.065],[-.455,PL+1.3,.02],[(-.47+h2.x)/2,(PL+1.3+h2.y)/2,(.13+h2.z)/2],[h2.x,h2.y,h2.z],[h0.x,h0.y,h0.z],[h1.x,h1.y,h1.z]];
    if(loop.eth){ inner.remove(loop.eth); loop.eth.geometry.dispose(); }
    loop.eth=new T.Mesh(new T.TubeGeometry(smooth(ep),48,.0029,8,false),ethM); inner.add(loop.eth);
  }
  /* door-side short wires from devices to the door duct */
  var dw=[]; [[-.3,yL],[-.1,yL],[.1,yL],[.3,yL],[-.3,yP],[-.1,yP],[.1,yP],[.3,yP]].forEach(function(p,i){ var x=U(p[0]),y=Vv(p[1]); dw.push(new T.TubeGeometry(smooth([[x,y,-.045],[x,y-.02,-.05],[(x+.07)/2,y-.03,-.04],[.085,y-.035,-.03]]),12,.0015,6,false)); dw.push(new T.TubeGeometry(smooth([[x+.01,y,-.045],[x+.01,y-.025,-.052],[(x+.08)/2,y-.04,-.045],[.085,y-.045,-.03]]),12,.0015,6,false)); });
  var dwm=new T.Mesh(T.BufferGeometryUtils.mergeBufferGeometries(dw),new T.MeshStandardMaterial({color:0xc0392b,roughness:.45})); pivot.add(dwm); dwm.__inner=true;
  var tickInner=function(){};
  inner.traverse(function(o){ o.__noShadow=true; });
  var api={group:g,pivot:pivot,inner:inner,W:W,H:H,D:D,top:PL+H+.04,fieldPaths:fieldPaths,
    update:function(t,v){
      var door=(v&&v.door)||0; pivot.rotation.y=-1.92*door;
      var showIn=door>.004||o.alwaysInner; inner.visible=showIn; dwm.visible=door>.004;
      if(showIn&&Math.abs(door-loop.ang)>.002){ loop.ang=door; rebuildLoop(); }
      var ver=updateHMI(t); if(htex.__ver!==ver){ htex.__ver=ver; htex.needsUpdate=true; }
      mA.update(t); mf.update(t); if(showIn) vlcd.update(t);
      if(lamps.length===4){ lamps[0].emissiveIntensity=.9; lamps[1].emissiveIntensity=.95; lamps[2].emissiveIntensity=(Math.sin(t*4)>0?1.2:.03); lamps[3].emissiveIntensity=(Math.floor(t*1.2)%5===0?1.3:.03); }
    }};
  return api;
}

/* ---------- field instruments: hand-built to real proportions, Trionix tag plates ---------- */
function tagPlate(text){ var c=cnv(320,96),g2=c.getContext('2d'); var gr=g2.createLinearGradient(0,0,320,0); gr.addColorStop(0,'#c9ced4'); gr.addColorStop(.5,'#eef0f2'); gr.addColorStop(1,'#c3c9cf'); g2.fillStyle=gr; g2.fillRect(0,0,320,96);
  g2.fillStyle='#13A89E'; g2.beginPath(); g2.moveTo(30,14); g2.lineTo(20,32); g2.lineTo(40,32); g2.fill(); g2.fillStyle='#0B2545'; g2.beginPath(); g2.moveTo(20,36); g2.lineTo(10,54); g2.lineTo(30,54); g2.fill(); g2.fillStyle='#F2A541'; g2.beginPath(); g2.moveTo(40,36); g2.lineTo(30,54); g2.lineTo(50,54); g2.fill();
  g2.fillStyle='#14202e'; g2.font='800 26px '+DISP; g2.fillText('TRIONIX',60,44); g2.font='700 30px '+MONO; g2.fillText(text,60,84); g2.fillStyle='#666'; g2.beginPath(); g2.arc(300,20,6,0,PI*2); g2.fill();
  var m=new T.Mesh(new T.PlaneGeometry(.075,.0225),new T.MeshStandardMaterial({map:ctex(c),metalness:.55,roughness:.35,side:T.DoubleSide})); return m; }
/* =====================================================================
   WEB SERVER & APP — real satellite (NASA TDRS), detailed Earth, HD devices
   ===================================================================== */
var SAT=null, satPromise=null;
function loadSat(){
  if(satPromise) return satPromise;
  satPromise=new Promise(function(res){
    try{
      var L=new T.GLTFLoader(); if(window.MeshoptDecoder) L.setMeshoptDecoder(window.MeshoptDecoder);
      fetch('/sat.txt').then(function(r){ if(!r.ok) throw new Error(r.status); return r.text(); }).then(function(b64){
        var bin=atob(b64.trim()), u=new Uint8Array(bin.length); for(var i=0;i<bin.length;i++) u[i]=bin.charCodeAt(i);
        L.parse(u.buffer,'',function(g){
          var s=g.scene;
          var solar=new T.MeshPhysicalMaterial({color:0x0e1a3a,metalness:.55,roughness:.2,clearcoat:1,clearcoatRoughness:.08});
          var gold=new T.MeshStandardMaterial({color:0xd6a33a,metalness:1,roughness:.32});
          var bronze=new T.MeshStandardMaterial({color:0xb98a45,metalness:.9,roughness:.35});
          var osr=new T.MeshStandardMaterial({color:0xe9ecef,metalness:.92,roughness:.1});
          var mesh=new T.MeshStandardMaterial({color:0xf1f2f3,metalness:.15,roughness:.55,side:T.DoubleSide});
          var white=new T.MeshStandardMaterial({color:0xf4f5f6,metalness:.05,roughness:.45,side:T.DoubleSide});
          var dark=new T.MeshStandardMaterial({color:0x1d2024,metalness:.6,roughness:.4});
          var silver=new T.MeshStandardMaterial({color:0xc8cdd2,metalness:.9,roughness:.28});
          [solar,gold,bronze,osr,mesh,white,dark,silver].forEach(function(m){ m.__shared=true; });
          s.traverse(function(o){ if(!o.isMesh) return; o.geometry.__shared=true; var n=(o.material&&o.material.name)||'';
            var m=null;
            if(/SolarPanel(11|22|33|44|55|66)/.test(n)) m=solar;
            else if(/SolarPanel-bronze/.test(n)) m=bronze;
            else if(/SolarPanel-gold|AntennaCresent$|AntennaCresentGreenEnds/.test(n)) m=gold;
            else if(/SolarPanel-black/.test(n)) m=dark;
            else if(/MainBoxSide1Z|MainBoxSide2Z|MainBoxBottomY|MainBoxThermals|MainBoxBottomDisk/.test(n)) m=gold;
            else if(/MainBoxSide1X|MainBoxSide2X|MainBoxTopY|WhiteReflector/.test(n)) m=osr;
            else if(/MainDish$|MainDishRails|SmallDishRails/.test(n)) m=mesh;
            else if(/SmallDish$|MainDishDisk|SmallDishColl/.test(n)) m=white;
            else if(/Black|Thrustr|Chorn$|XXX/.test(n)) m=dark;
            else m=silver;
            o.material=m; });
          SAT=s; res(s);
        },function(e){ console.warn('sat',e); res(null); });
      }).catch(function(e){ console.warn('sat',e); res(null); });
    }catch(e){ res(null); }
  });
  return satPromise;
}
function buildTDRS(span){
  if(!SAT) return buildSatellite();
  var g=new T.Group(), s=SAT.clone(true), holder=new T.Group(); holder.add(s); g.add(holder);
  var bb=new T.Box3().setFromObject(s), c=bb.getCenter(new T.Vector3()), sz=bb.getSize(new T.Vector3());
  var k=(span||2.2)/Math.max(sz.x,sz.y,sz.z); s.scale.setScalar(k); s.position.copy(c).multiplyScalar(-k);
  return {group:g,wings:new T.Object3D(),holder:holder};
}

/* ---------- Earth ---------- */
var EARTH_TEX=null;
function earthTex(){ if(EARTH_TEX) return EARTH_TEX; var L=new T.TextureLoader(); EARTH_TEX={};
  ['day','night','clouds','spec'].forEach(function(k){ var t=L.load('/earth-'+k+'.jpg'); t.anisotropy=8; t.__shared=true; EARTH_TEX[k]=t; });
  return EARTH_TEX; }
function ll(lat,lon,r){ var phi=(90-lat)*PI/180, th=(lon+180)*PI/180; return new T.Vector3(-r*Math.sin(phi)*Math.cos(th), r*Math.cos(phi), r*Math.sin(phi)*Math.sin(th)); }
function buildEarth(R,sun){
  var tx=earthTex(); var g=new T.Group(); var spin=new T.Group(); g.add(spin);
  var uni={day:{value:tx.day},night:{value:tx.night},spec:{value:tx.spec},sunDir:{value:sun.clone().normalize()},camPos:{value:new T.Vector3()}};
  var em=new T.ShaderMaterial({uniforms:uni,
    vertexShader:'varying vec2 vUv;varying vec3 vN;varying vec3 vW;void main(){vUv=uv;vN=normalize(mat3(modelMatrix)*normal);vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}',
    fragmentShader:'uniform sampler2D day;uniform sampler2D night;uniform sampler2D spec;uniform vec3 sunDir;uniform vec3 camPos;varying vec2 vUv;varying vec3 vN;varying vec3 vW;'+
      'void main(){vec3 n=normalize(vN);float d=dot(n,sunDir);float dk=smoothstep(-.18,.28,d);vec3 dc=texture2D(day,vUv).rgb;vec3 nc=texture2D(night,vUv).rgb;float sp=texture2D(spec,vUv).r;'+
      'vec3 v=normalize(camPos-vW);vec3 h=normalize(sunDir+v);float s=pow(max(dot(n,h),0.),48.)*sp*.9*dk;'+
      'vec3 col=dc*(.07+1.0*max(d,0.))+vec3(1.,.82,.55)*pow(nc,vec3(1.4))*(1.-dk)*1.6+s*vec3(1.,.96,.88);'+
      'float fr=pow(1.-max(dot(n,v),0.),2.6);col=mix(col,vec3(.42,.66,1.)*(.25+.9*dk),fr*.6);gl_FragColor=vec4(col,1.);}'});
  var earth=new T.Mesh(new T.SphereGeometry(R,96,64),em); spin.add(earth);
  var cuni={map:{value:tx.clouds},sunDir:uni.sunDir};
  var cm=new T.ShaderMaterial({uniforms:cuni,transparent:true,depthWrite:false,
    vertexShader:'varying vec2 vUv;varying vec3 vN;void main(){vUv=uv;vN=normalize(mat3(modelMatrix)*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader:'uniform sampler2D map;uniform vec3 sunDir;varying vec2 vUv;varying vec3 vN;void main(){float a=texture2D(map,vUv).r;float d=max(dot(normalize(vN),sunDir),0.);gl_FragColor=vec4(vec3(.1+.95*d),a*.85);}'});
  var clouds=new T.Mesh(new T.SphereGeometry(R*1.012,96,64),cm); spin.add(clouds);
  var am=new T.ShaderMaterial({transparent:true,depthWrite:false,side:T.BackSide,uniforms:{sunDir:uni.sunDir},
    vertexShader:'varying vec3 vN;varying vec3 vV;void main(){vN=normalize(normalMatrix*normal);vec4 mv=modelViewMatrix*vec4(position,1.);vV=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}',
    fragmentShader:'varying vec3 vN;varying vec3 vV;void main(){float i=pow(max(.0,.72+dot(vN,vV)),3.2);gl_FragColor=vec4(.35,.62,1.,i*1.1);}'});
  var atm=new T.Mesh(new T.SphereGeometry(R*1.09,64,48),am); g.add(atm);
  return {group:g,spin:spin,earth:earth,clouds:clouds,uni:uni,R:R};
}
function spaceBackdrop(size){
  var c=cnv(1024,1024),x=c.getContext('2d'); var gr=x.createRadialGradient(512,512,0,512,512,512);
  gr.addColorStop(0,'rgba(6,18,38,1)'); gr.addColorStop(.55,'rgba(9,30,58,.96)'); gr.addColorStop(.8,'rgba(11,37,69,.55)'); gr.addColorStop(1,'rgba(11,37,69,0)');
  x.fillStyle=gr; x.fillRect(0,0,1024,1024);
  for(var i=0;i<900;i++){ var a=Math.random()*PI*2, r=Math.pow(Math.random(),.6)*470; var px=512+Math.cos(a)*r, py=512+Math.sin(a)*r; var s=Math.random(); x.fillStyle='rgba(255,255,255,'+(.25+.7*s*(1-r/520))+')'; x.fillRect(px,py,s>.97?2.2:1.2,s>.97?2.2:1.2); }
  var t=new T.CanvasTexture(c); t.encoding=T.sRGBEncoding;
  var sp=new T.Sprite(new T.SpriteMaterial({map:t,depthWrite:false,toneMapped:false})); sp.scale.set(size,size,1); sp.renderOrder=-5; return sp;
}
function textBand(R,h,txt){
  var c=cnv(4096,128),x=c.getContext('2d'); x.clearRect(0,0,4096,128); x.font='700 64px '+DISP; x.textBaseline='middle';
  var px=0, parts=txt; var i=0; while(px<4096){ var p=parts[i%parts.length]; x.fillStyle=i%2?'#F2A541':'#3FD9CB'; x.fillText(p,px,66); px+=x.measureText(p).width+40; x.fillStyle='#ffffff'; x.beginPath(); x.moveTo(px-22,50); x.lineTo(px-10,72); x.lineTo(px-34,72); x.fill(); px+=10; i++; }
  var t=new T.CanvasTexture(c); t.encoding=T.sRGBEncoding; t.wrapS=T.RepeatWrapping; t.anisotropy=8;
  var m=new T.Mesh(new T.CylinderGeometry(R,R,h,160,1,true),new T.MeshBasicMaterial({map:t,transparent:true,side:T.DoubleSide,depthWrite:false,toneMapped:false,opacity:.95}));
  return m;
}

/* ---------- HD device screens ---------- */
function triLogo(x,X,Y,s,light){ x.fillStyle='#13A89E'; x.beginPath(); x.moveTo(X+s*.5,Y); x.lineTo(X+s*.25,Y+s*.43); x.lineTo(X+s*.75,Y+s*.43); x.fill(); x.fillStyle=light?'#ffffff':'#0B2545'; x.beginPath(); x.moveTo(X+s*.25,Y+s*.5); x.lineTo(X,Y+s*.93); x.lineTo(X+s*.5,Y+s*.93); x.fill(); x.fillStyle='#F2A541'; x.beginPath(); x.moveTo(X+s*.75,Y+s*.5); x.lineTo(X+s*.5,Y+s*.93); x.lineTo(X+s,Y+s*.93); x.fill(); }
function pv(t){ return {flow:24.3+.6*Math.sin(t*.7)+.15*Math.sin(t*3.1), pr:2.42+.06*Math.sin(t*.9), tot:41862.4+t*.0068, lvl:62+6*Math.sin(t*.4), vfd:78+3*Math.sin(t*.5)}; }
function card(x,X,Y,W,H,r){ x.fillStyle='#ffffff'; rrect(x,X,Y,W,H,r||12); x.fill(); x.strokeStyle='#dde4ec'; x.lineWidth=1; x.stroke(); }
function trend(x,X,Y,W,H,t,cols){ x.save(); x.beginPath(); x.rect(X,Y,W,H); x.clip(); x.strokeStyle='#e6ebf1'; x.lineWidth=1; for(var i=1;i<5;i++){ x.beginPath(); x.moveTo(X,Y+H*i/5); x.lineTo(X+W,Y+H*i/5); x.stroke(); }
  (cols||['#13A89E','#F2A541']).forEach(function(c,j){ x.beginPath(); for(var k=0;k<=W;k+=3){ var kk=t*.9+k*.022+j*2.2; var yy=Y+H*(.5+(j?.12:-.08))-H*.22*Math.sin(kk*.6)-H*.07*Math.sin(kk*2.3); if(k) x.lineTo(X+k,yy); else x.moveTo(X+k,yy); } x.strokeStyle=c; x.lineWidth=2.4; x.stroke(); }); x.restore(); }
function dataLog(x,X,Y,W,rows,t,fs){ fs=fs||11; var cols=['Time','FT-101 m³/h','PT-101 bar','LT-101 %','VFD-01 %']; var cw=W/cols.length;
  x.fillStyle='#0B2545'; x.fillRect(X,Y,W,fs*2.2); x.fillStyle='#fff'; x.font='600 '+fs+'px '+MONO; cols.forEach(function(c,i){ x.fillText(c,X+6+i*cw,Y+fs*1.45); });
  for(var r=0;r<rows;r++){ var yy=Y+fs*2.2+r*fs*2; x.fillStyle=r%2?'#f4f7fa':'#ffffff'; x.fillRect(X,yy,W,fs*2); var s=(Math.floor(t)-r*10); var mm=((s/60|0)%60+60)%60, ss=(s%60+60)%60; var p=pv(t-r*10);
    x.fillStyle='#24364F'; x.font='500 '+fs+'px '+MONO; [('14:'+(mm<10?'0':'')+mm+':'+(ss<10?'0':'')+ss),p.flow.toFixed(2),p.pr.toFixed(2),p.lvl.toFixed(1),p.vfd.toFixed(1)].forEach(function(v,i){ x.fillText(v,X+6+i*cw,yy+fs*1.4); }); } }
function waChat(x,X,Y,W,H,t,s){ s=s||1;
  x.fillStyle='#075E54'; x.fillRect(X,Y,W,58*s); x.fillStyle='#fff'; x.font='600 '+(15*s)+'px '+DISP; x.fillText('←',X+10*s,Y+36*s);
  x.fillStyle='#fff'; x.beginPath(); x.arc(X+50*s,Y+29*s,17*s,0,PI*2); x.fill(); triLogo(x,X+38*s,Y+17*s,24*s,false);
  x.fillStyle='#fff'; x.font='700 '+(15*s)+'px '+DISP; x.fillText('Trionix Alerts',X+76*s,Y+26*s); x.font='400 '+(11*s)+'px '+DISP; x.fillText('Business account · online',X+76*s,Y+44*s);
  x.fillStyle='#ECE5DD'; x.fillRect(X,Y+58*s,W,H-58*s); x.fillStyle='rgba(0,0,0,.035)'; for(var i=0;i<60;i++){ x.beginPath(); x.arc(X+((i*73)%W),Y+58*s+((i*131)%(H-58*s)),3*s,0,PI*2); x.fill(); }
  var msgs=[['ALARM · BOILER-01','Drum level LOW','LT-101 at 18 % (limit 25 %)','14:21',1],['CLEARED · FD FAN','Trip reset by operator','Running normally','14:26',0],['DAILY REPORT','Shift A report is ready','Daily_Report_28-10.xlsx  ·  PDF','14:30',2],['ALARM · UF PLANT','No flow – FT-101','Flow 0.0 m³/h for 60 s','14:34',1]];
  var n=1+Math.floor((t*.5)%5); var yy=Y+70*s;
  x.fillStyle='#d9f2ff'; rrect(x,X+W/2-40*s,yy,80*s,20*s,6*s); x.fill(); x.fillStyle='#4a5560'; x.font='600 '+(10*s)+'px '+DISP; x.textAlign='center'; x.fillText('TODAY',X+W/2,yy+14*s); x.textAlign='left'; yy+=30*s;
  for(var m=0;m<Math.min(n,4);m++){ var q=msgs[m]; var bh=(q[4]===2?92:76)*s, bw=W*.82;
    x.fillStyle='#ffffff'; rrect(x,X+10*s,yy,bw,bh,9*s); x.fill(); x.fillStyle=q[4]===1?'#c0392b':(q[4]===2?'#0B7C74':'#1f8a4c'); x.fillRect(X+10*s,yy+8*s,3*s,bh-16*s);
    x.fillStyle=q[4]===1?'#c0392b':(q[4]===2?'#0B7C74':'#1f8a4c'); x.font='700 '+(12*s)+'px '+MONO; x.fillText(q[0],X+20*s,yy+20*s);
    x.fillStyle='#111b21'; x.font='600 '+(13*s)+'px '+DISP; x.fillText(q[1],X+20*s,yy+40*s); x.fillStyle='#54656f'; x.font='400 '+(11.5*s)+'px '+DISP; x.fillText(q[2],X+20*s,yy+58*s);
    if(q[4]===2){ x.fillStyle='#eef7f6'; rrect(x,X+18*s,yy+64*s,bw-20*s,20*s,4*s); x.fill(); x.fillStyle='#0B7C74'; x.font='600 '+(10.5*s)+'px '+MONO; x.fillText('⬇ Excel   ⬇ PDF',X+26*s,yy+78*s); }
    x.fillStyle='#667781'; x.font='400 '+(10*s)+'px '+DISP; x.textAlign='right'; x.fillText(q[3],X+10*s+bw-8*s,yy+bh-7*s); x.textAlign='left'; yy+=bh+8*s; }
  x.fillStyle='#f0f2f5'; x.fillRect(X,Y+H-50*s,W,50*s); x.fillStyle='#fff'; rrect(x,X+10*s,Y+H-42*s,W-64*s,34*s,17*s); x.fill(); x.fillStyle='#8696a0'; x.font='400 '+(12*s)+'px '+DISP; x.fillText('Message',X+26*s,Y+H-20*s);
  x.fillStyle='#00a884'; x.beginPath(); x.arc(X+W-28*s,Y+H-25*s,17*s,0,PI*2); x.fill(); }
function drawPhoneHD(x,t,w,h,v){
  x.setTransform(2,0,0,2,0,0); var W=w/2,H=h/2; x.clearRect(0,0,W,H);
  x.save(); rrect(x,0,0,W,H,34); x.clip();
  x.fillStyle='#F4F6F9'; x.fillRect(0,0,W,H);
  var head=function(){ x.fillStyle='#0B2545'; x.font='600 13px '+DISP; x.fillText('9:41',26,26); x.fillStyle='#0B2545'; rrect(x,W-58,15,26,12,3); x.fill(); x.fillRect(W-31,19,2,4); };
  if((v.sec||0)>.5){ head();
    triLogo(x,W/2-30,90,60,false); x.fillStyle='#0B2545'; x.font='800 26px '+DISP; x.textAlign='center'; x.fillText('TRIONIX',W/2,184); x.fillStyle='#0B7C74'; x.font='600 9px '+MONO; x.fillText('AUTOMATION AND CONTROL TECH',W/2,200);
    x.fillStyle='#0B2545'; x.font='700 19px '+DISP; x.fillText('Sign in',W/2,262); x.textAlign='left';
    x.fillStyle='#4A4E55'; x.font='600 10px '+MONO; x.fillText('USER ID',30,296); x.fillText('PASSWORD',30,370);
    card(x,26,304,W-52,42,10); card(x,26,378,W-52,42,10); x.fillStyle='#0B2545'; x.font='500 15px '+MONO; x.fillText('plant.manager',40,331);
    var n=Math.min(9,Math.floor((t*4)%16)); x.fillText('●●●●●●●●●'.slice(0,n),40,405);
    var ok=(t*4)%16>11; x.fillStyle=ok?'#13A89E':'#0B2545'; rrect(x,26,446,W-52,48,12); x.fill(); x.fillStyle='#fff'; x.font='700 16px '+DISP; x.textAlign='center'; x.fillText(ok?'Signed in  ✓':'Sign in',W/2,476);
    x.fillStyle='#4A4E55'; x.font='500 11px '+DISP; x.fillText('Access by user ID and password',W/2,530); x.fillText('Role: Plant manager · view only',W/2,548); x.textAlign='left';
  } else if((v.alert||0)>.5){ waChat(x,0,36,W,H-36,t,1); head(); }
  else {
    head(); x.fillStyle='#0B2545'; x.fillRect(0,40,W,62); triLogo(x,16,52,36,true); x.fillStyle='#fff'; x.font='800 19px '+DISP; x.fillText('TRIONIX',60,76); x.fillStyle='#9fdcd6'; x.font='500 10px '+MONO; x.fillText('UF PLANT · LIVE',60,92);
    x.fillStyle='#37d67a'; x.beginPath(); x.arc(W-26,72,5,0,PI*2); x.fill();
    var tab=Math.floor(t/4.5)%3, P=pv(t);
    if(tab===0){ card(x,10,112,W-20,(W-28)*.6+16,12); if(HMI.canvas) x.drawImage(HMI.canvas,18,120,W-36,(W-36)*.6);
      var yy=112+(W-28)*.6+26; [['FILTRATE FLOW',P.flow.toFixed(1),'m³/h'],['FEED PRESSURE',P.pr.toFixed(2),'bar'],['FEED TANK',P.lvl.toFixed(0),'%'],['VFD-01',P.vfd.toFixed(1),'%']].forEach(function(k,i){ var X=10+(i%2)*((W-30)/2+10), Y=yy+Math.floor(i/2)*72; card(x,X,Y,(W-30)/2,62,10); x.fillStyle='#4A4E55'; x.font='600 9.5px '+MONO; x.fillText(k[0],X+10,Y+18); x.fillStyle='#0B2545'; x.font='700 21px '+MONO; x.fillText(k[1],X+10,Y+46); var vw=x.measureText(k[1]).width; x.fillStyle='#4A4E55'; x.font='500 11px '+MONO; x.fillText(k[2],X+14+vw,Y+46); });
    } else if(tab===1){ card(x,10,112,W-20,240,12); x.fillStyle='#0B2545'; x.font='700 13px '+DISP; x.fillText('Process graphs · last 1 h',22,136); trend(x,20,148,W-40,190,t); x.fillStyle='#13A89E'; x.fillRect(22,360,12,3); x.fillStyle='#24364F'; x.font='500 10px '+MONO; x.fillText('FT-101 m³/h',38,364); x.fillStyle='#F2A541'; x.fillRect(140,360,12,3); x.fillStyle='#24364F'; x.fillText('PT-101 bar',156,364);
      card(x,10,378,W-20,150,12); if(HMI.imgs.s6) x.drawImage(HMI.imgs.s6,0,0,800,480,18,386,W-36,(W-36)*.6*.72);
    } else { card(x,10,112,W-20,H-200,12); x.fillStyle='#0B2545'; x.font='700 13px '+DISP; x.fillText('Data log · every 10 s',22,136); dataLog(x,18,148,W-36,17,t,9.5);
      x.fillStyle='#13A89E'; rrect(x,18,H-136,(W-46)/2,36,10); x.fill(); x.fillStyle='#F2A541'; rrect(x,28+(W-46)/2,H-136,(W-46)/2,36,10); x.fill(); x.fillStyle='#fff'; x.font='700 13px '+DISP; x.textAlign='center'; x.fillText('Export Excel',18+(W-46)/4,H-113); x.fillStyle='#0B2545'; x.fillText('Export PDF',28+(W-46)*.75,H-113); x.textAlign='left'; }
    x.fillStyle='#ffffff'; x.fillRect(0,H-64,W,64); x.fillStyle='#dde4ec'; x.fillRect(0,H-64,W,1);
    ['Mimic','Graphs','Data log','Alerts'].forEach(function(l,i){ var X=W*(i+.5)/4; x.fillStyle=i===tab?'#13A89E':'#8090a3'; rrect(x,X-12,H-54,24,18,5); x.fill(); x.font='600 10.5px '+DISP; x.textAlign='center'; x.fillText(l,X,H-22); x.textAlign='left'; });
  }
  x.fillStyle='#000'; rrect(x,W/2-46,10,92,26,13); x.fill();
  x.restore(); x.setTransform(1,0,0,1,0,0);
}
function drawTablet(x,t,w,h){
  x.setTransform(1,0,0,1,0,0); x.fillStyle='#0b0d10'; x.fillRect(0,0,w,h); x.save(); rrect(x,0,0,w,h,26); x.clip();
  x.fillStyle='#F4F6F9'; x.fillRect(0,0,w,h);
  x.imageSmoothingQuality='high'; if(HMI.canvas) x.drawImage(HMI.canvas,0,36,w,h-36);
  x.fillStyle='#0B2545'; x.fillRect(0,0,w,36); x.fillStyle='#fff'; x.font='600 18px '+DISP; x.fillText('9:41',22,25); triLogo(x,w/2-90,7,22,true); x.font='700 17px '+DISP; x.fillText('TRIONIX  ·  UF Plant HMI (live)',w/2-60,25); x.fillStyle='#37d67a'; x.beginPath(); x.arc(w-30,18,6,0,PI*2); x.fill();
  x.restore();
}
function drawDesktop(x,t,w,h){
  x.setTransform(1,0,0,1,0,0); var P=pv(t);
  x.fillStyle='#e7ebf0'; x.fillRect(0,0,w,h);
  x.fillStyle='#d4dae2'; x.fillRect(0,0,w,46); ['#ff5f57','#febc2e','#28c840'].forEach(function(c,i){ x.fillStyle=c; x.beginPath(); x.arc(22+i*22,23,7,0,PI*2); x.fill(); });
  x.fillStyle='#F4F6F9'; rrect(x,100,8,260,38,8); x.fill(); triLogo(x,112,16,20,false); x.fillStyle='#0B2545'; x.font='600 15px '+DISP; x.fillText('Trionix Web Server',140,32);
  x.fillStyle='#ffffff'; x.fillRect(0,46,w,44); x.fillStyle='#eef1f5'; rrect(x,90,54,w-200,30,15); x.fill(); x.fillStyle='#4A4E55'; x.font='500 15px '+DISP; x.fillText('Secure  |  Trionix Web Server  ·  UF Water Filtration Plant  ·  signed in as plant.manager',110,74);
  var top=90; x.fillStyle='#0B2545'; x.fillRect(0,top,230,h-top); triLogo(x,22,top+22,40,true); x.fillStyle='#fff'; x.font='800 24px '+DISP; x.fillText('TRIONIX',72,top+52);
  ['Dashboard','Mimic','Trends','Data log','Reports','Alarms','Users'].forEach(function(l,i){ var Y=top+100+i*50; if(i===0){ x.fillStyle='rgba(19,168,158,.25)'; rrect(x,12,Y-28,206,42,8); x.fill(); } x.fillStyle=i===0?'#fff':'#a9b8cc'; x.font='600 17px '+DISP; x.fillText(l,32,Y); });
  var X0=250; x.fillStyle='#0B2545'; x.font='800 26px '+DISP; x.fillText('UF Water Filtration Plant — Live',X0,top+44); x.fillStyle='#0B7C74'; x.font='600 14px '+MONO; x.fillText('● ONLINE  ·  last update '+(Math.floor(t)%60)+' s ago via satellite link',X0,top+70);
  [['FILTRATE FLOW',P.flow.toFixed(1)+' m³/h'],['FEED PRESSURE',P.pr.toFixed(2)+' bar'],['FILTRATE TOTAL',P.tot.toFixed(0)+' m³'],['RUN HOURS P-1A',String(4821+Math.floor(t/3600))+' h']].forEach(function(k,i){ var X=X0+i*((w-X0-20)/4); card(x,X,top+86,(w-X0-20)/4-14,86,12); x.fillStyle='#4A4E55'; x.font='600 13px '+MONO; x.fillText(k[0],X+16,top+114); x.fillStyle='#0B2545'; x.font='700 28px '+MONO; x.fillText(k[1],X+16,top+154); });
  var mw=(w-X0-20)*.58, mh=mw*.6; card(x,X0,top+186,mw+16,mh+16,12); if(HMI.canvas) x.drawImage(HMI.canvas,X0+8,top+194,mw,mh);
  var RX=X0+mw+30, RW=w-RX-20; card(x,RX,top+186,RW,230,12); x.fillStyle='#0B2545'; x.font='700 17px '+DISP; x.fillText('Trends',RX+16,top+212); trend(x,RX+12,top+224,RW-24,180,t);
  card(x,RX,top+428,RW,mh-226,12); x.fillStyle='#0B2545'; x.font='700 17px '+DISP; x.fillText('WhatsApp alerts sent',RX+16,top+454);
  [['14:21','ALARM  Drum level LOW','#c0392b'],['14:26','CLEARED  FD fan trip','#1f8a4c'],['14:30','REPORT  Shift A (Excel, PDF)','#0B7C74']].forEach(function(r,i){ var Y=top+484+i*30; x.fillStyle='#4A4E55'; x.font='500 14px '+MONO; x.fillText(r[0],RX+16,Y); x.fillStyle=r[2]; x.font='600 14px '+DISP; x.fillText(r[1],RX+80,Y); });
  var LY=top+186+mh+30; card(x,X0,LY,w-X0-20,h-LY-16,12); x.fillStyle='#0B2545'; x.font='700 17px '+DISP; x.fillText('Data log',X0+16,LY+28);
  x.fillStyle='#13A89E'; rrect(x,w-330,LY+10,140,30,8); x.fill(); x.fillStyle='#F2A541'; rrect(x,w-180,LY+10,140,30,8); x.fill(); x.fillStyle='#fff'; x.font='700 14px '+DISP; x.textAlign='center'; x.fillText('Export Excel',w-260,LY+30); x.fillStyle='#0B2545'; x.fillText('Export PDF',w-110,LY+30); x.textAlign='left';
  dataLog(x,X0+12,LY+48,w-X0-44,Math.max(2,Math.floor((h-LY-80)/26)),t,13);
}
function hdScreen(w,h,draw,fps){ var s=screen(w,h,draw,fps); s.tex.anisotropy=8; return s; }
function buildPhoneHD(){
  var g=new T.Group(); var W=.24,H=.5;
  var frame=new T.MeshStandardMaterial({color:0x8d939a,metalness:.95,roughness:.28});
  rbox(W,H,.016,.034,frame,0,0,0,g,.004);
  rbox(W-.004,H-.004,.002,.032,new T.MeshPhysicalMaterial({color:0x0a0b0d,roughness:.1,clearcoat:1}),0,0,.0078,g,.0006);
  var s=hdScreen(640,1336,drawPhoneHD,10); var sc=new T.Mesh(new T.PlaneGeometry(W-.012,H-.012),new T.MeshBasicMaterial({map:s.tex,transparent:true,toneMapped:false})); sc.position.z=.0092; g.add(sc);
  var gl=new T.Mesh(new T.PlaneGeometry(W-.012,H-.012),new T.MeshPhysicalMaterial({color:0xffffff,transparent:true,opacity:.08,roughness:.04,clearcoat:1})); gl.position.z=.0096; g.add(gl);
  rbox(.085,.085,.006,.018,new T.MeshPhysicalMaterial({color:0x2b2f34,roughness:.3,clearcoat:.6}),-.062,.17,-.009,g,.002);
  [[-.08,.19],[-.044,.19],[-.08,.153]].forEach(function(p){ cylZ(.014,.006,METAL(0x3a3f45,.3),p[0],p[1],-.013,g,24); cylZ(.009,.0062,new T.MeshPhysicalMaterial({color:0x05070a,roughness:.05,clearcoat:1}),p[0],p[1],-.0135,g,24); });
  box(.003,.04,.006,frame,W/2+.001,.1,0,g); box(.003,.06,.006,frame,-W/2-.001,.12,0,g); box(.003,.06,.006,frame,-W/2-.001,.05,0,g);
  var st=new T.Group(); g.add(st); var acr=new T.MeshPhysicalMaterial({color:0xdfe6ea,transparent:true,opacity:.35,roughness:.05,transmission:0,clearcoat:1});
  rbox(.16,.012,.12,.006,acr,0,-H/2-.03,.02,st); var b2=rbox(.14,.2,.01,.006,acr,0,-H/2+.06,-.03,st); b2.rotation.x=.18;
  return {group:g,update:function(t,v){s.update(t,v);}};
}
function buildTablet(){
  var g=new T.Group(); var W=.6,H=.4;
  var al=new T.MeshStandardMaterial({color:0xb8bec5,metalness:.92,roughness:.3});
  rbox(W,H,.012,.03,al,0,0,0,g,.003); rbox(W-.004,H-.004,.002,.028,new T.MeshPhysicalMaterial({color:0x0a0b0d,roughness:.1,clearcoat:1}),0,0,.0058,g,.0005);
  var s=hdScreen(1280,832,drawTablet,6); var sc=new T.Mesh(new T.PlaneGeometry(W-.026,H-.026),new T.MeshBasicMaterial({map:s.tex,toneMapped:false})); sc.position.z=.0072; g.add(sc);
  var gl=new T.Mesh(new T.PlaneGeometry(W-.02,H-.02),new T.MeshPhysicalMaterial({color:0xffffff,transparent:true,opacity:.07,roughness:.04,clearcoat:1})); gl.position.z=.0076; g.add(gl);
  var cv=new T.MeshStandardMaterial({color:0x0B2545,roughness:.7}); var f=rbox(W,H*.62,.008,.02,cv,0,-H*.12,-.03,g); f.rotation.x=-.55; f.position.set(0,-.07,-.08);
  return {group:g,update:function(t){s.update(t);}};
}
function buildDesktop(){
  var g=new T.Group(); var W=1.06,H=.64;
  var blk=new T.MeshStandardMaterial({color:0x16181b,roughness:.45,metalness:.3}), al=new T.MeshStandardMaterial({color:0xc5cbd1,metalness:.9,roughness:.3});
  rbox(W,H,.03,.012,blk,0,0,0,g,.004);
  var s=hdScreen(1600,960,drawDesktop,4); var sc=new T.Mesh(new T.PlaneGeometry(W-.03,H-.04),new T.MeshBasicMaterial({map:s.tex,toneMapped:false})); sc.position.set(0,.006,.0155); g.add(sc);
  var gl=new T.Mesh(new T.PlaneGeometry(W-.03,H-.04),new T.MeshPhysicalMaterial({color:0xffffff,transparent:true,opacity:.06,roughness:.06,clearcoat:1})); gl.position.set(0,.006,.016); g.add(gl);
  rbox(.2,.12,.04,.02,blk,0,.05,-.035,g); var neck=rbox(.07,.36,.03,.012,al,0,-.36,-.07,g); neck.rotation.x=-.12; rbox(.34,.014,.24,.03,al,0,-.53,-.03,g);
  var kc=cnv(512,160),kx=kc.getContext('2d'); kx.fillStyle='#d7dce1'; kx.fillRect(0,0,512,160); kx.fillStyle='#ffffff'; for(var r=0;r<5;r++) for(var k=0;k<15;k++){ rrect(kx,8+k*33.4,8+r*30,29,26,4); kx.fill(); }
  var kb=rbox(.58,.012,.19,.008,new T.MeshStandardMaterial({map:ctex(kc),roughness:.6}),0,-.53,.28,g); kb.rotation.x=.04;
  rbox(.06,.02,.1,.03,new T.MeshStandardMaterial({color:0xf2f3f5,roughness:.4}),.42,-.53,.29,g);
  return {group:g,update:function(t){s.update(t);}};
}

/* ---------- Trionix microcontroller communication unit (panel -> satellite, no modem) ---------- */
function commBoardTex(){
  var c=cnv(1024,830),g=c.getContext('2d'); g.fillStyle='#0d2c4f'; g.fillRect(0,0,1024,830);
  var R=function(a,b){return a+Math.random()*(b-a);}; g.lineCap='round';
  g.fillStyle='rgba(255,255,255,.025)'; for(var i=0;i<1024;i+=9) g.fillRect(i,0,1,830);
  for(i=0;i<85;i++){ var x=R(40,990),y=R(40,700); g.strokeStyle='rgba(212,170,80,.85)'; g.lineWidth=R(2,5); g.beginPath(); g.moveTo(x,y); for(var k=0;k<3;k++){ if(k%2) x=R(40,990); else y=R(40,700); g.lineTo(x,y);} g.stroke();
    g.fillStyle='#e0bd6a'; g.beginPath(); g.arc(x,y,6,0,PI*2); g.fill(); g.fillStyle='#0d2c4f'; g.beginPath(); g.arc(x,y,2.5,0,PI*2); g.fill(); }
  for(i=0;i<170;i++){ g.fillStyle='#d9b45e'; g.fillRect(R(30,1000),R(30,720),5,8); }
  g.fillStyle='#ffffff'; g.font='700 26px '+MONO; g.fillText('TRIONIX · SAT COMM BOARD',540,805);
  g.font='600 20px '+MONO; [['U1 MCU',150,70],['U2 SAT',580,62],['U3 RS-485',440,545],['SD1',705,545],['C4',260,560],['BT1',845,668]].forEach(function(s){ g.fillText(s[0],s[1],s[2]); });
  g.font='700 18px '+MONO; g.fillText('PWR',773,590); g.fillText('SAT',815,590); g.fillText('TX',864,590);
  [['A',122],['B',205],['GND',288],['24V',371],['0V',454]].forEach(function(s){ g.fillText(s[0],s[1]-s[0].length*5.5,694); });
  [[28,28],[996,28],[28,802],[996,802]].forEach(function(p){ g.fillStyle='#e0bd6a'; g.beginPath(); g.arc(p[0],p[1],20,0,PI*2); g.fill(); g.fillStyle='#d6dde4'; g.beginPath(); g.arc(p[0],p[1],10,0,PI*2); g.fill(); });
  return ctex(c);
}
function drawCommOLED(x,t,w,h){
  x.fillStyle='#02050a'; x.fillRect(0,0,w,h); x.fillStyle='#8fe9ff'; x.font='700 22px '+MONO;
  x.fillText('SAT  LINK OK',10,28); x.fillText('LOG  1 s',10,58);
  var n=Math.floor(t*3)%4; x.fillText('TX   '+'>>>>'.slice(0,n+1),10,88);
  x.font='600 17px '+MONO; x.fillStyle='#F2A541'; x.fillText('TRIONIX',10,118);
  for(var i=0;i<5;i++){ x.fillStyle=i<4?'#8fe9ff':'#2a4a5a'; x.fillRect(196+i*11,100-i*9-10,7,i*9+12); }
}
function commSticker(){
  var c=cnv(640,140),x=c.getContext('2d'); x.fillStyle='rgba(255,255,255,.96)'; rrect(x,2,2,636,136,16); x.fill();
  triLogo(x,22,22,96); x.fillStyle='#0B2545'; x.font='800 54px '+DISP; x.fillText('TRIONIX',138,74);
  x.fillStyle='#0B7C74'; x.font='600 21px '+MONO; x.fillText('MICROCONTROLLER · SATELLITE LINK',140,112);
  return ctex(c);
}
function buildCommUnit(){
  var g=new T.Group(); var galv=METAL(0xb9c0c7,.38);
  var pc=new T.MeshStandardMaterial({color:0xe3e6ea,roughness:.42,metalness:.04,envMapIntensity:.6});
  var EY=.82, EW=.46, EH=.38;
  /* pole stand */
  rbox(.32,.02,.32,.01,galv,0,.01,-.09,g); cyl(.024,.024,1.2,galv,0,.6,-.11,g,18); cyl(.03,.03,.012,galv,0,1.2,-.11,g,18);
  [[-.12,-.21],[.12,-.21],[-.12,.03],[.12,.03]].forEach(function(p){ cyl(.012,.012,.012,METAL(0x8a9198,.3),p[0],.026,p[1],g,8); });
  rbox(.12,.34,.012,.004,galv,0,EY,-.08,g);
  [EY-.1,EY+.1].forEach(function(y){ var u=new T.Mesh(new T.TorusGeometry(.03,.0045,6,18,PI),galv); u.position.set(0,y,-.11); u.rotation.set(PI/2,0,0); g.add(u); });
  /* enclosure tray */
  rbox(EW,EH,.02,.02,pc,0,EY,-.064,g);
  box(EW,.016,.1,pc,0,EY+EH/2-.008,-.02,g); box(EW,.016,.1,pc,0,EY-EH/2+.008,-.02,g);
  box(.016,EH,.1,pc,-EW/2+.008,EY,-.02,g); box(.016,EH,.1,pc,EW/2-.008,EY,-.02,g);
  /* PCB */
  var B=new T.Group(); B.position.set(0,EY,-.05); g.add(B);
  var side=M(0x0d2c4f,{roughness:.5}); var tm=new T.MeshStandardMaterial({map:commBoardTex(),roughness:.36,metalness:.2});
  var pcb=new T.Mesh(new T.BoxGeometry(.42,.34,.006),[side,side,side,side,tm,side]); B.add(pcb);
  var silver=METAL(0xd3d8dd,.22), gold=METAL(0xd6b25e,.25), blk=M(0x15171a,{roughness:.4}), pin=METAL(0xdfe3e7,.25);
  /* MCU module with shield can */
  box(.09,.08,.004,M(0x14243a),-.11,.07,.005,B); rbox(.07,.052,.008,.003,silver,-.11,.06,.011,B);
  for(var i=0;i<6;i++) box(.004,.012,.001,gold,-.142+i*.012,.103,.0075,B);
  /* satellite modem module + coax pigtail */
  rbox(.11,.08,.012,.004,silver,.07,.075,.012,B); var lb=new T.Mesh(new T.PlaneGeometry(.055,.03),M(0x30353b,{roughness:.6})); lb.position.set(.06,.075,.0185); B.add(lb);
  cylZ(.004,.006,gold,.115,.1,.021,B,10);
  B.add(new T.Mesh(new T.TubeGeometry(smooth([[.115,.1,.022],[.14,.13,.035],[.17,.16,.03],[.17,.185,.03]]),24,.0025,6,false),M(0x111316,{roughness:.5})));
  /* RS-485 driver, regulator, inductor, caps, SD, coin cell */
  box(.026,.016,.004,blk,-.01,-.03,.005,B); var pp=[]; for(i=0;i<4;i++){ pp.push([-.019+i*.006,-.04,.0035],[-.019+i*.006,-.02,.0035]); } iboxes(pp,.0025,.006,.001,pin,B);
  rbox(.05,.04,.016,.004,blk,-.14,-.05,.011,B); box(.022,.022,.012,M(0x3a3f45,{roughness:.6}),-.09,-.06,.009,B);
  [[-.06,-.08],[-.035,-.08],[.0,.0],[.185,-.05]].forEach(function(p){ cylZ(.009,.024,M(0x1a1d22,{roughness:.35}),p[0],p[1],.015,B,18); cylZ(.0088,.001,METAL(0xc9ced4,.2),p[0],p[1],.0275,B,18); });
  box(.032,.026,.003,silver,.06,-.05,.0045,B); cylZ(.013,.004,silver,.12,-.1,.005,B,24);
  /* OLED */
  rbox(.08,.052,.005,.002,blk,.13,0,.006,B); var ol=screen(256,128,drawCommOLED,8); var op=new T.Mesh(new T.PlaneGeometry(.07,.035),screenMat(ol)); op.position.set(.13,0,.0088); B.add(op);
  /* status LEDs */
  var ledC=[0x37d67a,0x3FD9CB,0xF2A541],ledM=[]; ledC.forEach(function(c,k){ var lm=new T.MeshStandardMaterial({color:c,emissive:new T.Color(c),emissiveIntensity:1,roughness:.2}); cylZ(.0045,.007,lm,.115+k*.017,-.055,.006,B,12); ledM.push(lm); });
  /* terminal blocks + field wiring to the gland */
  var tbm=M(0x1f9a5f,{roughness:.45}); var wc=[0xF2A541,0x13A89E,0x22262b,0xc8312e,0x2457c5];
  for(i=0;i<5;i++){ var tx=-.16+i*.034; rbox(.032,.03,.03,.003,tbm,tx,-.135,.018,B); cylZ(.0065,.004,silver,tx,-.13,.034,B,14); box(.009,.0015,.001,M(0x555),tx,-.13,.0362,B); box(.012,.008,.012,M(0x0b0d0f),tx,-.151,.016,B);
    B.add(new T.Mesh(new T.TubeGeometry(smooth([[tx,-.15,.016],[tx,-.162,.016],[tx*.5,-.175,.012],[0,-.19,.0]]),16,.0028,6,false),M(wc[i],{roughness:.5}))); }
  /* gland + antenna bulkhead */
  cyl(.017,.017,.026,M(0x2a2e33,{roughness:.5}),0,EY-EH/2-.013,-.02,g,18); cyl(.012,.012,.012,M(0x1a1d20),0,EY-EH/2-.03,-.02,g,14);
  cyl(.009,.009,.022,gold,.17,EY+EH/2+.011,-.02,g,12);
  /* antenna on the pole top */
  var ant=new T.Group(); ant.position.set(0,1.206,-.11); g.add(ant);
  var wht=new T.MeshStandardMaterial({color:0xf4f5f6,roughness:.35,metalness:.02});
  cyl(.07,.072,.03,wht,0,.015,0,ant,36); var dm=sph(.07,wht,0,.03,0,ant,36,14); dm.scale.set(1,.32,1);
  g.add(new T.Mesh(new T.TubeGeometry(smooth([[.17,EY+EH/2+.022,-.02],[.17,EY+EH/2+.08,-.05],[.09,1.12,-.1],[.03,1.2,-.11]]),30,.004,6,false),M(0x111316,{roughness:.5})));
  /* clear lid on a top hinge */
  var lid=new T.Group(); lid.position.set(0,EY+EH/2,.032); g.add(lid);
  var lm2=new T.MeshPhysicalMaterial({color:0xd9e6ee,transparent:true,opacity:.2,roughness:.04,metalness:0,clearcoat:1,depthWrite:false});
  var lidM=rbox(EW+.004,EH+.004,.03,.022,lm2,0,-EH/2,.0,lid); lidM.__noShadow=true;
  var gk=new T.MeshStandardMaterial({color:0x9aa3ad,roughness:.6}); [[0,-.002,EW,.006],[0,-EH+.002,EW,.006]].forEach(function(b){ box(b[2],b[3],.03,gk,b[0],b[1],0,lid); });
  var stk=new T.Mesh(new T.PlaneGeometry(.29,.064),new T.MeshStandardMaterial({map:commSticker(),transparent:true,roughness:.5})); stk.position.set(0,-EH+.045,.0155); lid.add(stk);
  [[-EW/2+.02,-.02],[EW/2-.02,-.02],[-EW/2+.02,-EH+.02],[EW/2-.02,-EH+.02]].forEach(function(p){ cylZ(.007,.006,M(0xb3bac2,{roughness:.4}),p[0],p[1],.017,lid,12); });
  var st={f:-1};
  return {group:g, ant:new T.Vector3(0,1.25,-.11), gland:new T.Vector3(0,EY-EH/2-.035,-.02),
    update:function(t,open){ lid.rotation.x=-open*1.72; ol.update(t);
      var f=Math.floor(t*6); if(f!==st.f){ st.f=f; ledM[1].emissiveIntensity=(f%6<3)?1.4:.05; ledM[2].emissiveIntensity=((f*7)%5<2)?1.5:.05; } }};
}

/* ---------- Trionix HQ, Pune: server room ---------- */
function hqSignTex(){
  var c=cnv(1100,240),x=c.getContext('2d'); x.fillStyle='#0B2545'; rrect(x,0,0,1100,240,22); x.fill();
  triLogo(x,40,34,150,true); x.fillStyle='#ffffff'; x.font='800 104px '+DISP; x.fillText('TRIONIX',222,128);
  x.fillStyle='#3FD9CB'; x.font='600 38px '+MONO; x.fillText('HQ · PUNE · DATA SERVER',226,188);
  x.fillStyle='#13A89E'; x.fillRect(0,222,367,18); x.fillStyle='#ffffff'; x.fillRect(367,222,366,18); x.fillStyle='#F2A541'; x.fillRect(733,222,367,18);
  return ctex(c);
}
var HQ_SITES=['Boiler house','Water treatment','Pump station','Process plant','Water quota · flats','Effluent plant','Utility block','Steam header'];
function drawHQWall(x,t,w,h){
  x.fillStyle='#0a1a30'; x.fillRect(0,0,w,h);
  x.fillStyle='#0B2545'; x.fillRect(0,0,w,46); triLogo(x,12,8,30,true); x.fillStyle='#fff'; x.font='700 20px '+DISP; x.fillText('TRIONIX SERVER · PUNE HQ',52,30);
  var on=Math.floor(t*2)%2; x.fillStyle=on?'#37d67a':'#1c5a39'; x.beginPath(); x.arc(w-80,23,7,0,PI*2); x.fill(); x.fillStyle='#bfe9df'; x.font='600 15px '+MONO; x.fillText('LIVE',w-66,28);
  x.fillStyle='#8fb3c9'; x.font='600 13px '+MONO; x.fillText('CUSTOMER SITES ONLINE',16,74); x.fillStyle='#3FD9CB'; x.font='800 44px '+DISP; x.fillText('15 / 15',16,120);
  x.fillStyle='#8fb3c9'; x.font='600 13px '+MONO; x.fillText('VIA SATELLITE · PACKETS TODAY',16,150); x.fillStyle='#F2A541'; x.font='700 24px '+MONO; x.fillText((1284530+Math.floor(t*37)).toLocaleString('en-IN'),16,178);
  for(var i=0;i<HQ_SITES.length;i++){ var yy=200+i*22; x.fillStyle=i%2?'#0f2440':'#0c1f38'; x.fillRect(10,yy-15,w*.46,20); x.fillStyle=((i+Math.floor(t*1.5))%9===0)?'#F2A541':'#37d67a'; x.beginPath(); x.arc(22,yy-5,5,0,PI*2); x.fill();
    x.fillStyle='#d8e6f0'; x.font='500 13px '+MONO; x.fillText('Site '+(i<9?'0':'')+(i+1)+' · '+HQ_SITES[i],34,yy); x.fillStyle='#7fa0b8'; x.fillText(((i*3+Math.floor(t))%5+1)+' s',w*.46-24,yy); }
  var X=w*.5,Y=62,W=w*.47; x.fillStyle='#0f2440'; x.fillRect(X,Y,W,150); trend(x,X+6,Y+22,W-12,120,t,['#3FD9CB','#F2A541']); x.fillStyle='#8fb3c9'; x.font='600 13px '+MONO; x.fillText('DATA RECEIVED · ALL SITES',X+8,Y+16);
  x.fillStyle='#0f2440'; x.fillRect(X,Y+160,W,140); x.fillStyle='#8fb3c9'; x.fillText('WHATSAPP ALERTS SENT',X+8,Y+178);
  ['Drum level LOW · Site 01','Pump trip · Site 03','Daily report sent · Site 02','Quota 100% · Flat 304'].forEach(function(s,k){ var yy=Y+204+k*24; x.fillStyle='#25D366'; x.beginPath(); x.arc(X+16,yy-5,5,0,PI*2); x.fill(); x.fillStyle='#d8e6f0'; x.font='500 13px '+MONO; x.fillText(s,X+28,yy); });
}
function buildHQ(){
  var g=new T.Group(); var W=1.7,D=1.05,H=1.15,F=.06;
  var white=new T.MeshStandardMaterial({color:0xf1f3f5,roughness:.62,metalness:.04,envMapIntensity:.55}), navy=PAINT(0x0B2545,.45), frameM=METAL(0x4d555e,.35);
  var glass=new T.MeshPhysicalMaterial({color:0xcfe3ea,transparent:true,opacity:.16,roughness:.04,metalness:.1,clearcoat:1,depthWrite:false,side:T.DoubleSide});
  rbox(W+.14,F,D+.14,.01,new T.MeshStandardMaterial({color:0xcfd5db,map:TEX.concrete,roughness:.9}),0,F/2,0,g);
  box(W-.04,.006,D-.04,M(0x56606b,{roughness:.3,metalness:.3}),0,F+.003,0,g);
  box(W,H,.05,white,0,F+H/2,-D/2+.025,g); box(.05,H,D,white,-W/2+.025,F+H/2,0,g);
  var roofY=F+H; rbox(W+.1,.08,D+.1,.012,white,0,roofY+.04,0,g);
  box(W+.104,.05,.012,navy,0,roofY+.045,D/2+.052,g); box(W+.104,.012,.013,GLOW(0x13A89E,.6),0,roofY+.012,D/2+.052,g);
  box(.012,.05,D+.104,navy,W/2+.052,roofY+.045,0,g);
  var fr=new T.Mesh(new T.PlaneGeometry(W-.05,H),glass); fr.position.set(.025,F+H/2,D/2-.012); fr.__noShadow=true; g.add(fr);
  var sd=new T.Mesh(new T.PlaneGeometry(D-.05,H),glass); sd.rotation.y=PI/2; sd.position.set(W/2-.012,F+H/2,-.025); sd.__noShadow=true; g.add(sd);
  for(var i=0;i<=4;i++) box(.024,H,.03,frameM,-W/2+.05+i*(W-.062)/4,F+H/2,D/2-.012,g);
  box(W,.03,.032,frameM,0,F+.015,D/2-.012,g); box(W,.03,.032,frameM,0,roofY-.015,D/2-.012,g);
  for(i=0;i<=2;i++) box(.03,H,.024,frameM,W/2-.012,F+H/2,D/2-.012-i*(D-.03)/2,g);
  box(.032,.03,D,frameM,W/2-.012,F+.015,0,g); box(.032,.03,D,frameM,W/2-.012,roofY-.015,0,g);
  box(.3,.012,.06,GLOW(0xe9f6ff,.9),-.2,roofY-.012,.1,g); box(.3,.012,.06,GLOW(0xe9f6ff,.9),.4,roofY-.012,.1,g);
  /* racks */
  var racks=[]; [-.62,-.27].forEach(function(x){ var rk=buildRack(); rk.group.scale.setScalar(.56); rk.group.position.set(x,F+.006,-.22); g.add(rk.group); racks.push(rk); });
  /* wall display + console */
  var wall=screen(720,420,drawHQWall,6); rbox(.66,.4,.025,.01,M(0x16181b,{roughness:.4}),.38,.74,-D/2+.065,g);
  var wp=new T.Mesh(new T.PlaneGeometry(.63,.367),screenMat(wall)); wp.position.set(.38,.74,-D/2+.079); g.add(wp);
  rbox(.62,.03,.24,.008,new T.MeshStandardMaterial({color:0xe7eaee,roughness:.5}),.38,.42,-.2,g); [[.1,-.3],[.66,-.3],[.1,-.1],[.66,-.1]].forEach(function(p){ box(.02,.4,.02,METAL(0xb9bfc6,.35),p[0],.22,p[1],g); });
    rbox(.2,.12,.012,.006,M(0x16181b),.38,.53,-.25,g); box(.02,.07,.02,METAL(0xb9bfc6,.3),.38,.47,-.26,g);
  var ms=screen(256,150,function(x,t,w,h){ x.fillStyle='#f4f7fa'; x.fillRect(0,0,w,h); x.fillStyle='#0B2545'; x.fillRect(0,0,w,22); x.fillStyle='#fff'; x.font='600 12px '+MONO; x.fillText('Trionix server · data log',6,15); dataLog(x,4,28,w-8,5,t,8); },3);
  var mp=new T.Mesh(new T.PlaneGeometry(.185,.108),screenMat(ms)); mp.position.set(.38,.53,-.243); g.add(mp);
  /* rooftop sign + antenna + AC unit */
  var sign=new T.Group(); sign.position.set(-.05,roofY+.08,D/2-.08); g.add(sign);
  box(1.08,.25,.02,navy,0,.19,-.012,sign); var sp=new T.Mesh(new T.PlaneGeometry(1.06,.231),new T.MeshBasicMaterial({map:hqSignTex(),toneMapped:false})); sp.position.set(0,.19,.0); sign.add(sp);
  [-.4,.4].forEach(function(x){ rod([x,0,-.15],[x,.12,-.02],.008,METAL(0x8a9198,.35),sign); box(.012,.07,.012,METAL(0x8a9198,.35),x,.035,-.02,sign); });
  var ant=new T.Group(); ant.position.set(.62,roofY+.08,-.3); g.add(ant); var wht=new T.MeshStandardMaterial({color:0xf4f5f6,roughness:.35});
  cyl(.018,.018,.34,METAL(0xb9c0c7,.35),0,.17,0,ant,14); rbox(.12,.012,.12,.01,METAL(0xb9c0c7,.35),0,.006,0,ant);
  cyl(.075,.077,.03,wht,0,.355,0,ant,36); var dm=sph(.075,wht,0,.37,0,ant,36,14); dm.scale.set(1,.32,1);
  var ac=new T.Group(); ac.position.set(-.55,roofY+.08,-.3); g.add(ac); rbox(.34,.22,.14,.01,new T.MeshStandardMaterial({color:0xe6e9ec,roughness:.5}),0,.11,0,ac);
  cylZ(.075,.006,M(0x30353b,{roughness:.6}),-.06,.11,.071,ac,28); for(i=0;i<4;i++) box(.15,.004,.004,M(0x9aa1a8),-.06,.06+i*.033,.075,ac);
  /* entrance step */
  box(.5,.03,.14,new T.MeshStandardMaterial({color:0xcfd5db,roughness:.9}),.45,.015,D/2+.13,g);
  return {group:g, ant:new T.Vector3(.62,roofY+.08+.4,-.3),
    update:function(t){ racks.forEach(function(r){ r.update(t); }); wall.update(t); ms.update(t); }};
}

/* ---------- the scene ---------- */
function iiotScene(st){
  var R=new T.Group(); st.scene.add(R);
  var sun=new T.Vector3(.85,.35,.55).normalize();
  var gc=new T.Vector3(-.1,.35,-3.6), GR=2.0;
  var back=spaceBackdrop(10.5); back.position.copy(gc).add(new T.Vector3(0,0,-2.4)); R.add(back);
  var E=buildEarth(GR,sun); E.group.position.copy(gc); R.add(E.group);
  /* face Pune toward the viewer */
  var pune=ll(18.52,73.86,1); var q0=new T.Quaternion().setFromUnitVectors(pune.clone().normalize(),new T.Vector3(.22,.32,1).normalize()); E.spin.quaternion.copy(q0);
  var surf=new T.Group(); E.spin.add(surf);
  /* HQ beacon on the globe */
  var hq=ll(18.52,73.86,GR); var upv=hq.clone().normalize();
  var pin=new T.Group(); pin.position.copy(hq); pin.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),upv); surf.add(pin);
  cyl(.012,.02,.34,new T.MeshStandardMaterial({color:0x13A89E,emissive:new T.Color(0x13A89E),emissiveIntensity:.9}),0,.17,0,pin,16);
  sph(.05,new T.MeshStandardMaterial({color:0xF2A541,emissive:new T.Color(0xF2A541),emissiveIntensity:1.2}),0,.36,0,pin,24,16);
  var hqRings=rings(pin,0x3FD9CB,[0,.006,0],{flat:true,min:.05,max:.55});
  var hqLabel=label('TRIONIX HQ · PUNE',{h:.17,border:'#F2A541'}); hqLabel.position.set(0,.55,0); pin.add(hqLabel);
  /* customer sites: each one talks to the satellite */
  var sites=[[19.08,72.88],[23.02,72.57],[28.61,77.21],[13.08,80.27],[22.57,88.36],[17.39,78.49],[12.97,77.59],[21.15,79.09],[26.85,80.95],[25.2,55.27],[23.81,90.41],[-1.29,36.82],[1.35,103.82],[6.93,79.86],[30.73,76.78]];
  var dotM=new T.MeshBasicMaterial({color:0xF2A541,toneMapped:false}); var dots=[], siteRings=[];
  sites.forEach(function(s,i){ var p=ll(s[0],s[1],GR*1.002); var d=sph(.026,dotM,p.x,p.y,p.z,surf,10,8); dots.push(d);
    var rg=new T.Group(); rg.position.copy(p); rg.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),p.clone().normalize()); surf.add(rg); siteRings.push({r:rings(rg,0xF2A541,[0,.004,0],{flat:true,min:.02,max:.16}),o:i*.37}); });
  /* Trionix text band + orbit */
  var band=textBand(GR*1.32,.16,['TRIONIX','DIRECT TO SATELLITE','REMOTE MONITORING','DATA LOGGING','WHATSAPP ALERTS','SECURE LOGIN','EXCEL & PDF REPORTS','MIMIC & GRAPHS']); band.position.copy(gc); band.rotation.set(.32,0,-.18); R.add(band);
  var orbit=new T.Mesh(new T.TorusGeometry(GR*1.62,.006,6,200),new T.MeshBasicMaterial({color:0xF2A541,transparent:true,opacity:.5,toneMapped:false})); orbit.position.copy(gc); orbit.rotation.set(PI/2-.42,0,.25); R.add(orbit);
  /* real satellite */
  var sat=buildTDRS(1.7); sat.group.position.set(-1.25,2.75,-1.05); R.add(sat.group); sat.group.lookAt(gc.x,gc.y,gc.z);
  var satLabel=label('Communication satellite',{h:.11,border:'#13A89E'}); satLabel.position.set(-1.25,3.75,-1.05); R.add(satLabel);
  /* customer plant: panel + Trionix microcontroller (no modem, no server on site) */
  var plat=new T.Group(); plat.position.set(-3.25,-1.6,.5); R.add(plat); softFloor(plat,1.9,{cells:14,shadow:.25});
  var panel=makePanel({tag:'IOT-01',title:'IIoT PANEL'}); panel.group.scale.setScalar(.55); panel.group.position.set(-.3,0,0); panel.group.rotation.y=.35; plat.add(panel.group);
  var cu=buildCommUnit(); cu.group.position.set(.5,0,-.12); cu.group.rotation.y=.28; cu.group.scale.setScalar(.85); plat.add(cu.group); cu.group.updateMatrix();
  var gl=cu.gland.clone().applyMatrix4(cu.group.matrix);
  var loc=cable(plat,[[-.3,.03,.14],[-.02,.03,.08],[.25,.03,.0],[gl.x-.02,.03,gl.z+.05],[gl.x,.2,gl.z+.02],[gl.x,gl.y,gl.z]],0x13A89E,{n:4,speed:.55,r:.012,size:.09});
  /* Trionix HQ server, Pune */
  var hqb=buildHQ(); hqb.group.position.set(-.35,-1.6,.6); hqb.group.rotation.y=-.3; hqb.group.scale.setScalar(.85); R.add(hqb.group); softFloor(hqb.group,1.45,{cells:12,shadow:.25});
  /* devices */
  var dev=new T.Group(); dev.position.set(2.95,-1.6,.45); R.add(dev); softFloor(dev,2.1,{cells:14,shadow:.25});
  rbox(1.7,.035,.75,.01,new T.MeshStandardMaterial({color:0xf3f4f6,roughness:.5}),0,.72,0,dev); [[-.8,-.32],[.8,-.32],[-.8,.32],[.8,.32]].forEach(function(p){ box(.035,.72,.035,METAL(0xb9bfc6,.35),p[0],.36,p[1],dev); });
  var dsk=buildDesktop(); dsk.group.position.set(.1,1.27,-.18); dsk.group.rotation.y=-.18; dev.add(dsk.group);
  var tb=buildTablet(); tb.group.position.set(-.55,.98,.2); tb.group.rotation.set(-.3,-.05,0); dev.add(tb.group);
  var ph=buildPhoneHD(); ph.group.position.set(.62,1.02,.22); ph.group.rotation.set(-.2,-.32,0); dev.add(ph.group);
  /* labels */
  var lab={cu:label('Trionix microcontroller',{h:.11,border:'#E8891E'}),pn:label('Customer panel',{h:.11}),hq:label('Trionix server · HQ Pune',{h:.12,border:'#E8891E'}),dv:label('Trionix app · mobile · tablet · desktop',{h:.11,border:'#13A89E'})};
  lab.cu.position.set(.78,1.36,-.1); plat.add(lab.cu); lab.pn.position.set(-.55,1.3,.1); plat.add(lab.pn);
  lab.hq.position.set(0,1.78,0); hqb.group.add(lab.hq); lab.dv.position.set(-.2,2.15,-.3); dev.add(lab.dv);
  /* beams: plant -> satellite -> HQ server -> satellite -> devices */
  var upP=beam(R,0xE8891E,{n:5,w:.035}), hqDn=beam(R,0xE8891E,{n:5,w:.034}), hqUp=beam(R,0x13A89E,{n:4,w:.02,size:.18,speed:.5});
  var downs=[beam(R,0x13A89E,{n:3,w:.016,size:.16}),beam(R,0x13A89E,{n:3,w:.016,size:.16}),beam(R,0x13A89E,{n:3,w:.016,size:.16})];
  var siteB=sites.map(function(){ return beam(R,0xF2A541,{n:2,w:.007,size:.07,speed:.32}); });
  var A=new T.Vector3(), S=new T.Vector3(), HQW=new T.Vector3(), P=new T.Vector3(), N=new T.Vector3(), Dd=new T.Vector3(), tmpV=new T.Vector3(), off=new T.Vector3(.07,0,0);
  /* security lock */
  var lock=new T.Group(); R.add(lock); var lm=new T.MeshStandardMaterial({color:0xF2A541,metalness:.5,roughness:.3,transparent:true}); rbox(.3,.23,.1,.03,lm,0,0,0,lock); var shm=new T.MeshStandardMaterial({color:0xd8dee6,metalness:.9,roughness:.2,transparent:true}); var sh=new T.Mesh(new T.TorusGeometry(.1,.025,12,28,PI),shm); sh.position.y=.115; lock.add(sh); cylZ(.025,.11,M(0x0B2545),0,.01,.01,lock);
  var phW=new T.Vector3(), labs=[lab.cu,lab.pn,lab.hq,lab.dv,satLabel]; labs.forEach(function(l){ l.userData.s0=l.scale.clone(); });
  return {zoom:1.15,shadow:{size:5,center:[0,-1.6,0]},keys:['log','up','down','sec','alert'],base:{log:.3,up:.35,down:.3},
    steps:[{cam:[-1.97,-.5,2.05],look:[-3.14,-.98,.3],v:{log:1,up:.5}},
      {cam:[-.25,1.5,8.3],look:[-.55,.45,-1.3],v:{up:1,log:.5,down:.35}},
      {cam:[1.55,.45,3.75],look:[2.65,-.5,.35],v:{down:1,up:.5}},
      {cam:[3.35,-.4,1.75],look:[3.55,-.58,.62],v:{sec:1,down:.6}},
      {cam:[2.7,-.2,2.15],look:[3.25,-.45,.35],v:{alert:1,log:.5,up:.6,down:.6}}],
    update:function(dt,t,v){
      E.uni.camPos.value.copy(st.camera.position);
      E.spin.quaternion.copy(q0); E.spin.rotateY(Math.sin(t*.05)*.22); E.clouds.rotation.y=t*.012;
      hqRings.update(t,1); siteRings.forEach(function(s){ s.r.update(t+s.o,.6+.4*v.up); }); band.rotation.y=t*.08; orbit.rotation.z=.25+t*.02;
      sat.holder.rotation.z=Math.sin(t*.25)*.05; sat.group.position.y=2.75+Math.sin(t*.6)*.04;
      panel.update(t,{}); loc.set(.3+.7*Math.max(v.log,v.up*.8)); loc.update(t);
      var open=Math.min(1,Math.max(0,(v.log-.55)/.4)); cu.update(t,open*open*(3-2*open));
      hqb.update(t);
      S.copy(sat.group.position);
      plat.updateMatrixWorld(); A.copy(cu.ant); cu.group.localToWorld(A); upP.update(A,S,t,v.up);
      hqb.group.updateMatrixWorld(); HQW.copy(hqb.ant); hqb.group.localToWorld(HQW);
      hqDn.update(S,HQW,t+.15,Math.max(v.up,v.down*.6)*.95); tmpV.copy(HQW).add(off); P.copy(S).add(off); hqUp.update(tmpV,P,t+.4,v.down);
      E.group.updateMatrixWorld();
      dots.forEach(function(d,i){ d.getWorldPosition(P); N.copy(P).sub(gc).normalize(); Dd.copy(S).sub(P).normalize(); var k=Math.min(1,Math.max(0,N.dot(Dd)*2.5)); siteB[i].update(P,S,t+i*.13,v.up*.8*k); });
      dev.updateMatrixWorld(); [dsk.group,tb.group,ph.group].forEach(function(o,i){ o.getWorldPosition(tmpV); tmpV.y+=i===0?.55:.42; tmpV.z-=.15; downs[i].update(S,tmpV,t+.3*i,v.down); });
      ph.update(t,v); tb.update(t); dsk.update(t);
      ph.group.getWorldPosition(phW);
      lock.visible=v.sec>.02; lock.scale.setScalar(.001+.42*v.sec); lock.position.set(phW.x-.26,phW.y+.2,phW.z-.05); lock.rotation.y=t*1.2; lm.opacity=shm.opacity=v.sec;
      lab.cu.material.opacity=.4+.6*Math.max(v.log,v.up);
      labs.forEach(function(l){ l.getWorldPosition(tmpV); var k=Math.min(1.8,Math.max(.62,st.camera.position.distanceTo(tmpV)/3.4)); l.scale.copy(l.userData.s0).multiplyScalar(k); });
    }};
}
/* =====================================================================
   PROCESS KIT — instruments, valves, vessels and PID screens
   used by the boiler detail and the industry scenes
   ===================================================================== */
var IND={};
var KM=null;
function km(){ if(KM) return KM; mats(); KM={
  ss:METAL(0xdde3e8,.2), ss2:METAL(0xbfc7cf,.3), dark:M(0x23272c,{roughness:.45}), black:M(0x15171a,{roughness:.5}),
  blue:PAINT(0x2a5c94,.35), act:PAINT(0x1f5aa6,.4), red:PAINT(0xc8312e,.4), yel:PAINT(0xF2C230,.45), gry:PAINT(0x6c7a8a,.45),
  wht:M(0xeef1f4,{roughness:.45}), navy:PAINT(0x0B2545,.45), teal:PAINT(0x13A89E,.4), org:PAINT(0xF2A541,.4), grn:PAINT(0x2f8a4a,.45),
  steam:PAINT(0xb5824a,.45), water:PAINT(0x2f8ce0,.4), ins:METAL(0xd7dde3,.28), frp:M(0x2f6fb5,{roughness:.35}), frpw:M(0xf3f5f7,{roughness:.3})
}; return KM; }

/* small instruments (all face +z, mounted at origin) */
function kHead(p,tag,unit,val,amp,col){ var k=km(); var g=new T.Group(); p.add(g);
  var hz=cylZ(.034,.06,col||k.blue,0,0,0,g,24); cylZ(.036,.012,METAL(0xd5dade,.25),0,0,.034,g,24); cylZ(.036,.012,METAL(0xd5dade,.25),0,0,-.034,g,24);
  var l=screen(96,96,drawLCD(unit,val,amp==null?.2:amp),3); var d=new T.Mesh(new T.CircleGeometry(.025,24),screenMat(l)); d.position.z=.0405; g.add(d);
  if(tag){ var tp=tagPlate(tag); tp.position.set(0,-.05,.012); g.add(tp); }
  g.userData.lcd=l; return g; }
function kTT(p,tag,val,x,y,z,ry){ var k=km(),g=new T.Group(); g.position.set(x,y,z); g.rotation.y=ry||0; p.add(g);
  cyl(.007,.007,.18,k.ss,0,-.08,0,g,10); cyl(.013,.013,.025,k.ss,0,.02,0,g,12); cyl(.009,.009,.04,k.ss,0,.05,0,g,10);
  var h=kHead(g,tag,'°C',val||85,.15); h.position.y=.1; return {group:g,update:function(t){h.userData.lcd.update(t);}}; }
function kPT(p,tag,unit,val,x,y,z,ry){ var k=km(),g=new T.Group(); g.position.set(x,y,z); g.rotation.y=ry||0; p.add(g);
  cyl(.012,.012,.05,k.ss,0,.025,0,g,12); box(.05,.05,.05,METAL(0xc8ced5,.3),0,.07,0,g); for(var i=0;i<2;i++) cylX(.006,.03,k.ss,(i?1:-1)*.035,.07,0,g,8);
  cyl(.016,.016,.03,k.blue,0,.11,0,g,14); var h=kHead(g,tag,unit||'bar',val||4.2,.05); h.position.y=.155; return {group:g,update:function(t){h.userData.lcd.update(t);}}; }
function kLT(p,tag,val,x,y,z,ry){ var k=km(),g=new T.Group(); g.position.set(x,y,z); g.rotation.y=ry||0; p.add(g);
  cyl(.06,.06,.018,k.ss,0,.009,0,g,24); for(var i=0;i<6;i++){ var a=i*PI/3; cyl(.006,.006,.03,k.ss2,Math.cos(a)*.048,.02,Math.sin(a)*.048,g,6); }
  cyl(.045,.02,.1,k.ss,0,-.05,0,g,18); cyl(.016,.016,.06,k.ss,0,.05,0,g,12);
  rbox(.09,.07,.08,.012,M(0x3a414a,{roughness:.4}),0,.11,0,g); var l=screen(96,96,drawLCD('%',val||62,.6),3); var d=new T.Mesh(new T.PlaneGeometry(.05,.05),screenMat(l)); d.position.set(0,.11,.041); g.add(d);
  if(tag){ var tp=tagPlate(tag); tp.position.set(0,.065,.045); g.add(tp); } return {group:g,update:function(t){l.update(t);}}; }
function kMag(p,tag,r,x,y,z,ry,unit,val){ var k=km(),g=new T.Group(); g.position.set(x,y,z); g.rotation.y=ry||0; p.add(g); r=r||.04;
  cylX(r*1.9,r*4.2,k.blue,0,0,0,g,28); [-1,1].forEach(function(s){ cylX(r*2.2,r*.4,k.ss2,s*r*2.3,0,0,g,24); for(var i=0;i<6;i++){ var a=i*PI/3; cylX(.005,r*.6,k.ss2,s*r*2.3,Math.sin(a)*r*1.75,Math.cos(a)*r*1.75,g,6); } });
  cyl(.014,.014,r*1.4+.03,k.blue,0,r*1.9+.015,0,g,12); var h=kHead(g,tag,unit||'m³/h',val||12.4,.3); h.position.y=r*1.9+.065; return {group:g,update:function(t){h.userData.lcd.update(t);}}; }
/* globe control valve on a pipe along x */
function kCV(p,tag,r,x,y,z,ry){ var k=km(),g=new T.Group(); g.position.set(x,y,z); g.rotation.y=ry||0; p.add(g); r=r||.04;
  sph(r*1.6,k.gry,0,0,0,g,20,14); cylX(r*1.1,r*3.6,k.gry,0,0,0,g,20); [-1,1].forEach(function(s){ cylX(r*1.6,r*.35,k.ss2,s*r*1.9,0,0,g,24); });
  cyl(r*.8,r*1.1,r*1.4,k.gry,0,r*1.9,0,g,18); [-1,1].forEach(function(s){ box(r*.3,r*3.2,r*.35,k.ss2,s*r*.75,r*4.1,0,g); }); cyl(r*.14,r*.14,r*3.2,METAL(0xeeeeee,.15),0,r*4.1,0,g,10);
  box(r*2.6,r*.3,r*1.1,k.ss2,0,r*5.7,0,g); var up=new T.Mesh(new T.SphereGeometry(r*2.6,28,10,0,PI*2,0,PI/2.6),k.act); up.position.y=r*5.85; up.scale.y=.55; g.add(up);
  var dn=new T.Mesh(new T.SphereGeometry(r*2.6,28,10,0,PI*2,PI-PI/2.6,PI/2.6),k.act); dn.position.y=r*6.4; dn.scale.y=.4; g.add(dn); cyl(r*2.62,r*2.62,r*.3,k.ss2,0,r*6.15,0,g,32);
  rbox(r*1.6,r*1.9,r*1.1,r*.15,M(0xe7eaee,{roughness:.4}),r*1.8,r*4.2,r*.3,g); cylZ(r*.3,r*.2,M(0xffffff),r*1.6,r*4.5,r*.88,g,12); cylZ(r*.3,r*.2,M(0x9aa1a8),r*2.0,r*4.5,r*.88,g,12);
  pipe([[r*1.8,r*5.2,r*.3],[r*1.8,r*6.7,r*.3],[r*.5,r*6.9,0]],r*.08,METAL(0xc8794a,.3),g);
  if(tag){ var tp=tagPlate(tag); tp.position.set(r*1.8,r*3.4,r*.88); tp.scale.setScalar(Math.max(.8,r*20)); g.add(tp); }
  return {group:g}; }
/* butterfly / ball valve with pneumatic rotary actuator, pipe along x */
function kBV(p,tag,r,x,y,z,ry){ var k=km(),g=new T.Group(); g.position.set(x,y,z); g.rotation.y=ry||0; p.add(g); r=r||.04;
  cylX(r*1.5,r*.9,k.ss2,0,0,0,g,24); cyl(r*.35,r*.35,r*1.3,k.ss2,0,r*1.6,0,g,12); box(r*1.4,r*.25,r*1.4,k.ss2,0,r*2.3,0,g);
  rbox(r*3.2,r*1.4,r*1.4,r*.2,M(0xd9dee3,{metalness:.6,roughness:.3}),0,r*3.1,0,g); [-1,1].forEach(function(s){ cylX(r*.72,r*.3,M(0x30363e),s*r*1.7,r*3.1,0,g,18); });
  rbox(r*1.1,r*.9,r*.9,r*.1,k.act,0,r*4.2,0,g); cyl(r*.32,r*.32,r*.2,k.yel,0,r*4.75,0,g,16);
  if(tag){ var tp=tagPlate(tag); tp.position.set(0,r*3.1,r*.75); tp.scale.setScalar(Math.max(.8,r*18)); g.add(tp); } return {group:g}; }
/* manual valve with handwheel; pipe along x */
function kHV(p,r,x,y,z,ry,col){ var k=km(),g=new T.Group(); g.position.set(x,y,z); g.rotation.y=ry||0; p.add(g);
  sph(r*1.4,k.ss2,0,0,0,g,14,10); [-1,1].forEach(function(s){ cylX(r*1.5,r*.45,k.ss2,s*r*1.3,0,0,g,18); }); cyl(r*.7,r*.9,r*2,k.ss2,0,r*1.5,0,g,14); cyl(r*.14,r*.14,r*1.8,METAL(0xe5e8eb,.2),0,r*3,0,g,8);
  var hw=tor(r*1.25,r*.17,col||k.red,0,r*3.9,0,g); hw.rotation.x=PI/2; rod([-r*1.25,r*3.9,0],[r*1.25,r*3.9,0],r*.11,col||k.red,g,6); rod([0,r*3.9,-r*1.25],[0,r*3.9,r*1.25],r*.11,col||k.red,g,6); return g; }
function kGauge(p,x,y,z,ry,txt,s){ s=s||1; var c=cnv(128,128),g2=c.getContext('2d'); g2.fillStyle='#fff'; g2.beginPath(); g2.arc(64,64,60,0,PI*2); g2.fill(); g2.strokeStyle='#222'; g2.lineWidth=3;
  for(var i=0;i<=10;i++){ var a=PI*.75+i*PI*.15; g2.beginPath(); g2.moveTo(64+Math.cos(a)*44,64+Math.sin(a)*44); g2.lineTo(64+Math.cos(a)*54,64+Math.sin(a)*54); g2.stroke(); }
  g2.strokeStyle='#c0392b'; g2.lineWidth=4; g2.beginPath(); g2.moveTo(64,64); g2.lineTo(64+Math.cos(PI*1.75)*44,64+Math.sin(PI*1.75)*44); g2.stroke(); g2.fillStyle='#222'; g2.font='700 15px '+MONO; g2.textAlign='center'; g2.fillText(txt||'bar',64,100);
  var gg=new T.Group(); gg.position.set(x,y,z); gg.rotation.y=ry||0; p.add(gg); cylZ(.05*s,.03*s,METAL(0xd5dade,.2),0,0,0,gg,24); var d=new T.Mesh(new T.CircleGeometry(.045*s,28),new T.MeshStandardMaterial({map:ctex(c),roughness:.2})); d.position.z=.016*s; gg.add(d);
  cyl(.008*s,.008*s,.06*s,km().ss2,0,-.07*s,0,gg,8); return gg; }
/* flanged pipe run with flanges at bends */
function kPipe(p,pts,r,m,fl){ pipe(pts,r,m,p,{flanges:fl||0,fm:km().ss2}); }
/* vertical vessel: o={r,h,legs:3|4,legH,bottom:'dish'|'cone',top:'dish'|'flat',mat,jacket,jacketMat,nozzles:[[x,z,r,h]]} returns group with .top y */
function kVessel(p,o){ var k=km(),g=new T.Group(); p.add(g); var r=o.r,h=o.h,lh=o.legH==null?.5:o.legH,m=o.mat||k.ss;
  var y0=lh; cyl(r,r,h,m,0,y0+h/2,0,g,40);
  if(o.jacket){ cyl(r*1.06,r*1.06,h*(o.jacketH||.7),o.jacketMat||k.ss2,0,y0+h*(o.jacketH||.7)/2+.02,0,g,40); }
  if((o.bottom||'dish')==='cone'){ var cn=cyl(r,r*.18,r*.8,m,0,y0-r*.4,0,g,40); cyl(r*.12,r*.12,.12,m,0,y0-r*.8-.05,0,g,16); }
  else { var b=sph(r,m,0,y0,0,g,40,16); b.scale.y=.32; }
  var top=y0+h; if(o.top!=='flat'){ var tt=sph(r,m,0,top,0,g,40,16); tt.scale.y=.3; } else { cyl(r*1.02,r*1.02,.03,m,0,top+.015,0,g,40); }
  var n=o.legs||4; for(var i=0;i<n;i++){ var a=i/n*PI*2+PI/n; var lx=Math.cos(a)*r*.86, lz=Math.sin(a)*r*.86; cyl(.03,.03,y0+.05,k.ss2,lx,(y0+.05)/2,lz,g,12); box(.1,.012,.1,k.ss2,lx,.006,lz,g); if(o.loadcells){ rbox(.07,.05,.07,.01,M(0x30363e),lx,.04,lz,g); } }
  (o.nozzles||[]).forEach(function(nz){ var yy=top+r*.22; cyl(nz[2],nz[2],nz[3],m,nz[0],yy+nz[3]/2,nz[1],g,14); cyl(nz[2]*1.6,nz[2]*1.6,.012,k.ss2,nz[0],yy+nz[3],nz[1],g,18); });
  if(o.ins){ for(var j=1;j<4;j++) tor(r*1.005,.004,k.ss2,0,y0+h*j/4,0,g).rotation.x=PI/2; }
  g.userData.top=top+r*.3; g.userData.y0=y0; return g; }
/* agitator drive on top of a vessel: returns rotating shaft group */
function kAgitator(p,y,shaftL,type){ var k=km(); var g=new T.Group(); g.position.y=y; p.add(g);
  cyl(.11,.13,.06,k.ss2,0,.03,0,g,24); rbox(.2,.16,.2,.02,PAINT(0x1f5aa6,.4),0,.15,0,g); cyl(.085,.085,.26,PAINT(0x1f5aa6,.4),0,.36,0,g,28); cyl(.09,.09,.03,M(0x22262a),0,.5,0,g,28);
  var fins=[]; for(var i=0;i<16;i++){ var a=i/16*PI*2; fins.push([Math.cos(a)*.09,.36,Math.sin(a)*.09,1,1,1,-a]); } iboxes(fins,.02,.24,.006,PAINT(0x1f5aa6,.4),g);
  rbox(.08,.06,.06,.01,PAINT(0x1f5aa6,.4),.1,.42,0,g);
  var sh=new T.Group(); g.add(sh); cyl(.018,.018,shaftL,k.ss,0,-shaftL/2,0,sh,12);
  if(type==='anchor'){ var an=new T.Mesh(new T.TorusGeometry(.32,.018,8,32,PI),k.ss); an.rotation.z=PI; an.position.y=-shaftL+.32; sh.add(an); rod([-.32,-shaftL+.32,0],[-.32,-shaftL*.4,0],.016,k.ss,sh); rod([.32,-shaftL+.32,0],[.32,-shaftL*.4,0],.016,k.ss,sh); }
  else { for(var b=0;b<3;b++){ var bl=box(.16,.012,.06,k.ss,0,-shaftL+.08,0,sh); bl.rotation.y=b*PI*2/3; bl.position.set(Math.cos(b*PI*2/3)*.09,-shaftL+.08,-Math.sin(b*PI*2/3)*.09); bl.rotation.x=.5; }
    if(type==='double'){ for(b=0;b<3;b++){ var b2=box(.14,.012,.05,k.ss,Math.cos(b*PI*2/3)*.08,-shaftL*.55,-Math.sin(b*PI*2/3)*.08,sh); b2.rotation.y=b*PI*2/3; b2.rotation.x=.5; } } }
  return sh; }
/* motor (axis along x), returns group */
function kMotor(p,x,y,z,s,col,ry){ var k=km(),g=new T.Group(); g.position.set(x,y,z); g.rotation.y=ry||0; g.scale.setScalar(s||1); p.add(g); var mc=col||PAINT(0x1f5aa6,.4);
  cylX(.14,.36,mc,0,0,0,g,32); var fins=[]; for(var i=0;i<18;i++){ var a=i/18*PI*2; if(Math.sin(a)<-.85) continue; fins.push([0,Math.sin(a)*.15,Math.cos(a)*.15,1,1,1,0,a]); } iboxes(fins,.32,.024,.006,mc,g);
  cylX(.145,.1,mc,-.23,0,0,g,32); cylX(.09,.01,M(0x22262a),-.285,0,0,g,28); rbox(.11,.08,.11,.01,mc,.02,.16,0,g); [-.11,.11].forEach(function(xx){ box(.06,.07,.28,mc,xx,-.12,0,g); });
  cylX(.02,.1,METAL(0xdde2e7,.2),.23,0,0,g,12); return g; }
/* local operator panel with HMI showing a PID trend */
function kOpPanel(p,x,z,ry,draw,name){ var k=km(),g=new T.Group(); g.position.set(x,0,z); g.rotation.y=ry||0; p.add(g);
  box(.06,.75,.06,k.ss2,0,.375,0,g); box(.3,.012,.3,k.ss2,0,.006,0,g);
  rbox(.62,.5,.16,.02,PAINT(0xe4e8ec,.4),0,1.0,0,g); rbox(.6,.48,.01,.02,PAINT(0xd5dbe1,.4),0,1.0,.083,g);
  rbox(.44,.3,.012,.01,M(0x15181b),-.03,1.05,.09,g); var s=screen(512,320,draw,8); var sp=new T.Mesh(new T.PlaneGeometry(.42,.2625),screenMat(s)); sp.position.set(-.03,1.05,.097); g.add(sp);
  [[.24,1.17,0x37d67a],[.24,1.09,0xF2A541],[.24,1.01,0xc8312e]].forEach(function(b){ cylZ(.018,.02,M(0xcfd5db),b[0],b[1],.095,g,16); cylZ(.014,.012,GLOW(b[2],.8),b[0],b[1],.105,g,16); });
  var es=cylZ(.026,.03,PAINT(0xc8312e,.4),.24,.88,.1,g,20); cylZ(.034,.008,k.yel,.24,.88,.088,g,24);
  var np=cnv(256,48),nx=np.getContext('2d'); nx.fillStyle='#0B2545'; nx.fillRect(0,0,256,48); triLogo(nx,8,6,34,true); nx.fillStyle='#fff'; nx.font='700 20px '+DISP; nx.fillText(name||'TRIONIX',52,31);
  var npm=new T.Mesh(new T.PlaneGeometry(.26,.05),new T.MeshBasicMaterial({map:ctex(np),toneMapped:false})); npm.position.set(-.08,.83,.091); g.add(npm);
  rbox(.66,.04,.2,.01,PAINT(0xd5dbe1,.4),0,1.27,0,g);
  return {group:g,screen:s,update:function(t){s.update(t);}}; }
/* PID trend: conventional loop vs Trionix advanced PID */
function stepResp(tau,z,w){ if(tau<0) return 0; var wd=w*Math.sqrt(1-z*z); return 1-Math.exp(-z*w*tau)*(Math.cos(wd*tau)+z/Math.sqrt(1-z*z)*Math.sin(wd*tau)); }
function drawPID(tag,title,unit,sA,sB,dec){ dec=dec==null?1:dec; var P=16; return function(x,t,w,h){
  function sp(tt){ return Math.floor(tt/(P/2))%2? sB:sA; }
  function pv(tt,z,ww){ var k=Math.floor(tt/(P/2)); var t0=k*P/2; var prev=(k-1)%2?sB:sA; if(k<1) prev=sA; var cur=k%2?sB:sA; return prev+(cur-prev)*stepResp(tt-t0,z,ww); }
  x.fillStyle='#f4f7fa'; x.fillRect(0,0,w,h); x.fillStyle='#0B2545'; x.fillRect(0,0,w,40); triLogo(x,10,6,28,true); x.fillStyle='#fff'; x.font='700 17px '+DISP; x.fillText(tag+' · '+title,48,27);
  var now=pv(t,.82,1.15)+.004*(sB-sA)*Math.sin(t*3.7), set=sp(t);
  [['PV',now.toFixed(dec)+' '+unit,'#0B7C74'],['SP',set.toFixed(dec)+' '+unit,'#9A5F12'],['OUT',(48+12*Math.sin(t*.5)).toFixed(0)+' %','#33465E']].forEach(function(c,i){ var X=12+i*166; x.fillStyle='#fff'; rrect(x,X,50,156,52,8); x.fill(); x.strokeStyle='#dbe3ec'; x.stroke(); x.fillStyle='#4A4E55'; x.font='600 12px '+MONO; x.fillText(c[0],X+10,66); x.fillStyle=c[2]; x.font='700 21px '+MONO; x.fillText(c[1],X+10,93); });
  var X0=12,Y0=114,W=w-24,H=h-150; x.fillStyle='#fff'; x.fillRect(X0,Y0,W,H); x.strokeStyle='#e3e9f0'; x.lineWidth=1; for(var i=1;i<5;i++){ x.beginPath(); x.moveTo(X0,Y0+H*i/5); x.lineTo(X0+W,Y0+H*i/5); x.stroke(); }
  var lo=Math.min(sA,sB), hi=Math.max(sA,sB), pad=(hi-lo)*.55, span=24; function Y(v){ return Y0+H-(v-lo+pad)/(hi-lo+2*pad)*H; }
  function line(f,col,wd,dash){ x.beginPath(); for(var px=0;px<=W;px+=2){ var tt=t-span+px/W*span; var v=f(tt); if(px) x.lineTo(X0+px,Y(v)); else x.moveTo(X0+px,Y(v)); } x.strokeStyle=col; x.lineWidth=wd; x.setLineDash(dash||[]); x.stroke(); x.setLineDash([]); }
  line(function(tt){ return pv(tt,.22,1.05); },'#9aa3ad',2,[6,4]); line(sp,'#F2A541',2.5,[8,5]); line(function(tt){ return pv(tt,.82,1.15)+.004*(sB-sA)*Math.sin(tt*3.7); },'#13A89E',3);
  x.font='600 12px '+MONO; var ly=h-14; x.fillStyle='#13A89E'; x.fillRect(14,ly-8,22,4); x.fillStyle='#0B2545'; x.fillText('Trionix advanced PID',42,ly-2); x.fillStyle='#9aa3ad'; x.fillRect(222,ly-8,22,4); x.fillStyle='#4A4E55'; x.fillText('Conventional loop',250,ly-2); x.fillStyle='#F2A541'; x.fillRect(410,ly-8,22,4); x.fillStyle='#4A4E55'; x.fillText('Setpoint',438,ly-2);
}; }
/* signal cable from an instrument to the panel (floor routed) */
function kSig(p,a,b,col,o){ o=o||{}; var y=o.y==null?.02:o.y; var pts=[a].concat(o.via||[]); var l=pts[pts.length-1];
  pts.push([l[0],y,l[2]],[(l[0]+b[0])/2,y,(l[2]+b[2])/2],[b[0],y,b[2]],[b[0],b[1],b[2]]);
  return cable(p,pts,col||0x13A89E,{n:o.n||3,r:o.r||.008,size:o.size||.07,speed:o.speed||.35,seg:70}); }
function faceTo(px,pz,c){ return Math.atan2(c[0]-px,c[2]-pz); }
/* common scene frame for industry views */
function indFrame(st,R,o){ var c2=o.cam2,l2=o.look2;
  if(o.op){ var g=o.op.group, ry=g.rotation.y, nx=Math.sin(ry), nz=Math.cos(ry), sx=Math.cos(ry), sz=-Math.sin(ry); var hx=g.position.x-.03*sx+.1*nx, hz=g.position.z-.03*sz+.1*nz, hy=1.05;
    c2=[hx+nx*1.05+sx*.34, hy+.14, hz+nz*1.05+sz*.34]; l2=[hx-sx*.06, hy-.03, hz-sz*.06]; }
  var steps=[{cam:o.cam,look:o.look,auto:o.auto==null?.09:o.auto},{cam:c2,look:l2,v:{loop:1}}];
  return {zoom:o.zoom||1,shadow:{size:o.shadow||3,center:o.center||[0,0,0]},keys:['loop'],base:{loop:.2},steps:steps,update:o.update}; }
function indLabel(R,txt,pos,col,h){ var l=label(txt,{pos:pos,h:h||.085,border:col||'#13A89E'}); R.add(l); return l; }

/* ---------- feature screens (one per industry) ---------- */
function hmiTop(x,w,title,badge,bcol){ x.fillStyle='#f4f7fa'; x.fillRect(0,0,w,1000); x.fillStyle='#0B2545'; x.fillRect(0,0,w,40); triLogo(x,10,6,28,true); x.fillStyle='#fff'; x.font='700 16px '+DISP; x.fillText(title,48,26);
  if(badge){ x.font='700 12px '+MONO; var bw=x.measureText(badge).width+16; x.fillStyle=bcol||'#13A89E'; rrect(x,w-bw-10,10,bw,20,6); x.fill(); x.fillStyle='#fff'; x.fillText(badge,w-bw-2,24); } }
function kpi(x,X,Y,W,lab,val,col){ x.fillStyle='#fff'; rrect(x,X,Y,W,46,8); x.fill(); x.strokeStyle='#dbe3ec'; x.lineWidth=1; x.stroke(); x.fillStyle='#4A4E55'; x.font='600 11px '+MONO; x.fillText(lab,X+8,Y+15); x.fillStyle=col||'#0B2545'; x.font='700 18px '+MONO; x.fillText(val,X+8,Y+37); }
function panelBox(x,X,Y,W,H,lab){ x.fillStyle='#fff'; x.fillRect(X,Y,W,H); x.strokeStyle='#dbe3ec'; x.strokeRect(X+.5,Y+.5,W-1,H-1); if(lab){ x.fillStyle='#4A4E55'; x.font='600 11px '+MONO; x.fillText(lab,X+8,Y+14); } }
function drawRecipe(){ var steps=['Charge water','Add tomato paste','Heat to 85 °C','Add sugar & salt','Hold 10 min','Add vinegar','Transfer to filler'];
  var ing=[['Water',120.0],['Tomato paste',180.0],['Sugar',42.0],['Salt',3.5],['Vinegar',18.0]];
  return function(x,t,w,h){ hmiTop(x,w,'RECIPE · Tomato ketchup · Batch B-1043','ISA-88');
    var cur=Math.floor(t/3.5)%steps.length, fr=(t%3.5)/3.5; panelBox(x,10,48,236,262,'RECIPE STEPS');
    steps.forEach(function(s,i){ var y=70+i*33; var done=i<cur, on=i===cur; x.fillStyle=on?'rgba(19,168,158,.14)':'#fff'; x.fillRect(14,y,228,28); x.fillStyle=done?'#2f8a4a':(on?'#13A89E':'#c3cad2'); x.beginPath(); x.arc(28,y+14,8,0,PI*2); x.fill(); x.fillStyle='#fff'; x.font='700 10px '+MONO; x.fillText(done?'✓':(i+1),done?24:25,y+18);
      x.fillStyle=on?'#0B2545':(done?'#33465E':'#8a929b'); x.font=(on?'700 ':'500 ')+'13px '+DISP; x.fillText(s,42,y+18); if(on){ x.fillStyle='#dbe3ec'; x.fillRect(42,y+22,190,3); x.fillStyle='#13A89E'; x.fillRect(42,y+22,190*fr,3); } });
    panelBox(x,254,48,248,190,'INGREDIENTS · target / actual kg');
    ing.forEach(function(g,i){ var y=72+i*32, step=[0,1,3,3,5][i], a=step<cur?g[1]*(1+.002*Math.sin(i*3)):(step===cur?g[1]*fr:0); x.fillStyle='#33465E'; x.font='600 12px '+DISP; x.fillText(g[0],262,y+10); x.font='600 11px '+MONO; x.fillStyle='#4A4E55'; x.fillText(g[1].toFixed(1)+' / '+(a?a.toFixed(1):'—'),390,y+10);
      x.fillStyle='#e6ebf1'; x.fillRect(262,y+15,230,6); x.fillStyle=step<cur?'#2f8a4a':'#F2A541'; x.fillRect(262,y+15,230*Math.min(1,a/g[1]),6); });
    kpi(x,254,246,120,'PRODUCT','84.6 °C','#0B7C74'); kpi(x,382,246,120,'BATCH WT',(412.6+Math.sin(t)*.3).toFixed(1)+' kg');
    x.fillStyle='#4A4E55'; x.font='600 11px '+MONO; x.fillText('Every step and weight stored against batch B-1043',12,h-4); }; }
function drawEBR(){ var ev=[['10:02','Supervisor','Recipe GRAN-05 v3 loaded'],['10:04','Operator 2','Batch started · lot G-1043'],['10:19','Operator 2','Inlet SP 60.0 → 62.0 °C · slow drying'],['10:21','System','Filter shake cycle 4'],['10:33','System','ALARM filter ΔP high 18 mbar'],['10:33','Operator 2','Alarm acknowledged'],['10:36','System','End point 42 °C reached'],['10:38','Supervisor','Batch reviewed']];
  return function(x,t,w,h){ hmiTop(x,w,'BATCH RECORD · FBD-01 · Lot G-1043','AUDIT TRAIL','#0B7C74');
    kpi(x,10,48,158,'PHASE','Drying','#0B7C74'); kpi(x,176,48,158,'PRODUCT',(41.6+Math.sin(t*.5)*.2).toFixed(1)+' °C'); var s=2052+Math.floor(t); kpi(x,342,48,160,'ELAPSED','00:'+String(Math.floor(s/60)%60).padStart(2,'0')+':'+String(s%60).padStart(2,'0'));
    panelBox(x,10,102,492,206,''); x.fillStyle='#0B2545'; x.fillRect(10,102,492,22); x.fillStyle='#fff'; x.font='600 11px '+MONO; x.fillText('TIME',18,117); x.fillText('USER',72,117); x.fillText('EVENT',170,117);
    var n=Math.min(ev.length,4+Math.floor(t/2.5)%5); for(var i=0;i<n;i++){ var r=ev[i], y=126+i*22; x.fillStyle=i%2?'#f4f7fa':'#fff'; x.fillRect(11,y,490,22); var al=r[2].indexOf('ALARM')===0; x.fillStyle=al?'#c8312e':'#24364F'; x.font='500 12px '+MONO; x.fillText(r[0],18,y+15); x.fillText(r[1],72,y+15); x.font=(al?'700 ':'500 ')+'12px '+DISP; x.fillText(r[2],170,y+15); }
    x.fillStyle='#4A4E55'; x.font='600 11px '+MONO; x.fillText('Who changed what, when and why · user levels · Excel / PDF',12,h-4); }; }
function ring(x,cx,cy,r,v,col,lab){ x.lineWidth=9; x.strokeStyle='#e6ebf1'; x.beginPath(); x.arc(cx,cy,r,0,PI*2); x.stroke(); x.strokeStyle=col; x.beginPath(); x.arc(cx,cy,r,-PI/2,-PI/2+PI*2*v); x.stroke(); x.fillStyle='#0B2545'; x.font='700 15px '+MONO; x.textAlign='center'; x.fillText((v*100).toFixed(0)+'%',cx,cy+5); x.fillStyle='#4A4E55'; x.font='600 11px '+MONO; x.fillText(lab,cx,cy+r+18); x.textAlign='left'; }
function drawOEE(){ return function(x,t,w,h){ hmiTop(x,w,'LIVE OEE · Tray sealer line 1 · Shift A','RUNNING','#2f8a4a');
    var A=.915+.004*Math.sin(t*.3),P=.94+.006*Math.sin(t*.7),Q=.962+.003*Math.sin(t*.5),O=A*P*Q; panelBox(x,10,48,250,170,'');
    x.lineWidth=14; x.strokeStyle='#e6ebf1'; x.beginPath(); x.arc(70,128,48,0,PI*2); x.stroke(); x.strokeStyle='#13A89E'; x.beginPath(); x.arc(70,128,48,-PI/2,-PI/2+PI*2*O); x.stroke(); x.fillStyle='#0B2545'; x.font='800 22px '+DISP; x.textAlign='center'; x.fillText((O*100).toFixed(1)+'%',70,135); x.font='600 11px '+MONO; x.fillStyle='#4A4E55'; x.fillText('OEE',70,194); x.textAlign='left';
    ring(x,160,102,24,A,'#0B2545','AVAIL'); ring(x,222,102,24,P,'#F2A541','PERF'); ring(x,191,170,22,Q,'#2f8a4a','QUALITY');
    var good=12480+Math.floor(t*.7); kpi(x,268,48,114,'GOOD PACKS',good.toLocaleString('en-IN'),'#2f8a4a'); kpi(x,388,48,114,'REJECTS',String(312+Math.floor(t*.03)),'#c8312e'); kpi(x,268,100,114,'SPEED','42 /min'); kpi(x,388,100,114,'SEAL','168.2 °C','#0B7C74');
    panelBox(x,10,226,492,82,'DOWNTIME · minutes this shift'); [['Film change',14],['Infeed jam',9],['Seal temp low',4],['Others',3]].forEach(function(d,i){ var y=246+i*15; x.fillStyle='#33465E'; x.font='500 11px '+DISP; x.fillText(d[0],18,y+9); x.fillStyle=i?'#9aa3ad':'#F2A541'; x.fillRect(120,y,d[1]*22,10); x.fillStyle='#0B2545'; x.font='600 11px '+MONO; x.fillText(d[1]+'',126+d[1]*22,y+9); });
  }; }
function drawTrayProfile(){ return function(x,t,w,h){ hmiTop(x,w,'TRAY PROFILE · Column C-401','PROFILE CONTROL');
    panelBox(x,10,48,300,262,'TEMPERATURE BY TRAY · °C'); var tg=[78.2,79.0,80.4,82.6,85.9,89.8,93.6,97.9];
    tg.forEach(function(v,i){ var y=66+i*29, act=v+Math.sin(t*.8+i)*.25*(i===4?.4:1); var bw=(act-74)/26*230; x.fillStyle=i===4?'#13A89E':'#9fb6c9'; x.fillRect(64,y,bw,18); x.strokeStyle='#F2A541'; x.lineWidth=2; var tx=64+(v-74)/26*230; x.beginPath(); x.moveTo(tx,y-2); x.lineTo(tx,y+20); x.stroke();
      x.fillStyle='#33465E'; x.font='600 11px '+MONO; x.fillText('T'+(i+1),18,y+13); x.fillStyle='#0B2545'; x.fillText(act.toFixed(1),bw+68,y+13); });
    x.fillStyle='#0B7C74'; x.font='700 11px '+MONO; x.fillText('◀ control tray',236,66+4*29+13);
    kpi(x,318,48,184,'STEAM PER LITRE',(2.08+Math.sin(t*.4)*.02).toFixed(2)+' kg/L','#0B7C74'); kpi(x,318,100,184,'PRODUCT STRENGTH',(94.6+Math.sin(t*.3)*.05).toFixed(2)+' % v/v'); kpi(x,318,152,184,'REFLUX RATIO','3.2 : 1'); kpi(x,318,204,184,'REBOILER STEAM','1.86 t/h');
    x.fillStyle='#4A4E55'; x.font='600 11px '+MONO; x.fillText('Target band ▮ orange · actual ▮ bars',318,272); x.fillText('Energy cost of every litre, live',318,290); }; }
function drawCombustion(){ return function(x,t,w,h){ hmiTop(x,w,'COMBUSTION · Boiler B-01','O₂ TRIM ON','#2f8a4a');
    var o2=3.55+.08*Math.sin(t*1.3); kpi(x,10,48,118,'FLUE O₂',o2.toFixed(2)+' %','#0B7C74'); kpi(x,134,48,118,'EXCESS AIR',(o2/(21-o2)*100).toFixed(0)+' %'); kpi(x,258,48,118,'EFFICIENCY',(84.6+Math.sin(t*.4)*.1).toFixed(1)+' %','#2f8a4a'); kpi(x,382,48,120,'STEAM / FUEL','13.8 kg/kg');
    panelBox(x,10,102,492,178,'FLUE GAS O₂ · last 24 min'); var X0=16,Y0=118,W=480,H=150; function Y(v){ return Y0+H-(v-1.5)/5*H; }
    x.strokeStyle='#e3e9f0'; for(var i=1;i<5;i++){ x.beginPath(); x.moveTo(X0,Y0+H*i/5); x.lineTo(X0+W,Y0+H*i/5); x.stroke(); }
    x.setLineDash([8,5]); x.strokeStyle='#F2A541'; x.lineWidth=2; x.beginPath(); x.moveTo(X0,Y(3.5)); x.lineTo(X0+W,Y(3.5)); x.stroke(); x.setLineDash([6,4]); x.strokeStyle='#9aa3ad';
    x.beginPath(); for(var px=0;px<=W;px+=3){ var tt=t-24+px/W*24; var v=4.6+1.2*Math.sin(tt*.35)+.5*Math.sin(tt*1.1); if(px) x.lineTo(X0+px,Y(v)); else x.moveTo(X0+px,Y(v)); } x.stroke(); x.setLineDash([]);
    x.strokeStyle='#13A89E'; x.lineWidth=3; x.beginPath(); for(px=0;px<=W;px+=3){ tt=t-24+px/W*24; v=3.5+.12*Math.sin(tt*1.3)+.05*Math.sin(tt*3.1); if(px) x.lineTo(X0+px,Y(v)); else x.moveTo(X0+px,Y(v)); } x.stroke();
    x.font='600 11px '+MONO; x.fillStyle='#13A89E'; x.fillRect(14,h-12,20,4); x.fillStyle='#0B2545'; x.fillText('With O₂ trim',40,h-6); x.fillStyle='#9aa3ad'; x.fillRect(150,h-12,20,4); x.fillStyle='#4A4E55'; x.fillText('Fixed air ratio',176,h-6); x.fillStyle='#F2A541'; x.fillRect(310,h-12,20,4); x.fillText('O₂ setpoint',336,h-6); }; }
function drawProgramme(){ var seg=[[0,40],[20,80],[30,80],[80,130],[125,130],[150,80],[165,80]]; var TT=165;
  function prof(m){ for(var i=1;i<seg.length;i++){ if(m<=seg[i][0]){ var a=seg[i-1],b=seg[i]; return a[1]+(b[1]-a[1])*(m-a[0])/(b[0]-a[0]); } } return 80; }
  return function(x,t,w,h){ hmiTop(x,w,'DYEING PROGRAMME · Polyester navy · J-03','STEP 4 / 6'); var now=(t*4)%TT;
    panelBox(x,10,48,492,170,'TEMPERATURE PROFILE · °C vs min'); var X0=40,Y0=64,W=452,H=140; function X(m){ return X0+m/TT*W; } function Y(v){ return Y0+H-(v-30)/110*H; }
    x.strokeStyle='#e3e9f0'; for(var i=0;i<=4;i++){ x.beginPath(); x.moveTo(X0,Y0+H*i/4); x.lineTo(X0+W,Y0+H*i/4); x.stroke(); x.fillStyle='#8a929b'; x.font='500 10px '+MONO; x.fillText(String(140-i*27.5|0),14,Y0+H*i/4+4); }
    x.setLineDash([7,5]); x.strokeStyle='#F2A541'; x.lineWidth=2; x.beginPath(); seg.forEach(function(s,i){ if(i) x.lineTo(X(s[0]),Y(s[1])); else x.moveTo(X(s[0]),Y(s[1])); }); x.stroke(); x.setLineDash([]);
    x.strokeStyle='#13A89E'; x.lineWidth=3; x.beginPath(); for(var m=0;m<=now;m+=1){ var v=prof(m)+.3*Math.sin(m*.7); if(m) x.lineTo(X(m),Y(v)); else x.moveTo(X(m),Y(v)); } x.stroke(); x.fillStyle='#0B2545'; x.beginPath(); x.arc(X(now),Y(prof(now)),5,0,PI*2); x.fill();
    x.fillStyle='#0B7C74'; x.font='700 10px '+MONO; x.fillText('2 °C/min',X(4),Y(70)); x.fillText('1 °C/min',X(48),Y(118)); x.fillText('hold 45 min',X(92),Y(136));
    panelBox(x,10,224,300,86,'PROGRESSIVE DOSING · alkali %'); x.strokeStyle='#7a5cff'; x.lineWidth=3; x.beginPath(); for(var k2=0;k2<=100;k2++){ var px=18+k2*2.8, py=300-Math.pow(k2/100,2.2)*60; if(k2) x.lineTo(px,py); else x.moveTo(px,py); } x.stroke(); var dk=Math.min(1,((t*.08)%1)); x.fillStyle='#7a5cff'; x.beginPath(); x.arc(18+dk*280,300-Math.pow(dk,2.2)*60,5,0,PI*2); x.fill();
    kpi(x,318,224,184,'BATH','' + prof(now).toFixed(1)+' °C','#0B7C74'); kpi(x,318,264,184,'SEGMENT LEFT',Math.max(0,Math.ceil((TT-now)%45))+' min'); }; }
function drawPastRecord(){ return function(x,t,w,h){ var div=((t%14)>9.5&&(t%14)<10.6); hmiTop(x,w,'PASTEURISATION RECORD · HTST-01',div?'DIVERT':'FORWARD',div?'#c8312e':'#2f8a4a');
    panelBox(x,10,48,330,200,'HOLDING TUBE OUTLET · °C'); var X0=16,Y0=64,W=318,H=176; function Y(v){ return Y0+H-(v-70.5)/4*H; }
    x.strokeStyle='#e3e9f0'; for(var i=1;i<4;i++){ x.beginPath(); x.moveTo(X0,Y0+H*i/4); x.lineTo(X0+W,Y0+H*i/4); x.stroke(); }
    x.setLineDash([7,5]); x.strokeStyle='#c8312e'; x.lineWidth=2; x.beginPath(); x.moveTo(X0,Y(72)); x.lineTo(X0+W,Y(72)); x.stroke(); x.setLineDash([]); x.fillStyle='#c8312e'; x.font='700 10px '+MONO; x.fillText('LIMIT 72.0',X0+W-70,Y(72)-4);
    x.strokeStyle='#13A89E'; x.lineWidth=3; x.beginPath(); for(var px=0;px<=W;px+=2){ var tt=t-30+px/W*30, ph=((tt%14)+14)%14; var v=72.75+.12*Math.sin(tt*1.7); if(ph>9.4&&ph<10.8) v-=.95*Math.sin((ph-9.4)/1.4*PI); if(px) x.lineTo(X0+px,Y(v)); else x.moveTo(X0+px,Y(v)); } x.stroke();
    kpi(x,348,48,154,'FDV-701',div?'DIVERT':'FORWARD',div?'#c8312e':'#2f8a4a'); kpi(x,348,100,154,'HOLDING TIME','15.4 s'); kpi(x,348,152,154,'FLOW','5,000 L/h'); kpi(x,348,204,154,'DIVERTS TODAY','2','#9A5F12');
    panelBox(x,10,254,492,56,'LAST CIP · verified'); [['Caustic 75 °C · 1.5 %','✓'],['Acid 65 °C · 1.0 %','✓'],['Final rinse · conductivity','✓']].forEach(function(c,i){ x.fillStyle='#2f8a4a'; x.font='700 13px '+MONO; x.fillText(c[1],18+i*164,292); x.fillStyle='#33465E'; x.font='500 11px '+DISP; x.fillText(c[0],34+i*164,292); }); }; }
function drawMembrane(){ return function(x,t,w,h){ hmiTop(x,w,'MEMBRANE HEALTH · RO-01','PREDICTIVE','#9A5F12');
    panelBox(x,10,48,330,196,'NORMALISED PERMEATE FLOW % · last 30 days'); var X0=16,Y0=64,W=318,H=170; function Y(v){ return Y0+H-(v-80)/22*H; }
    x.strokeStyle='#e3e9f0'; for(var i=1;i<4;i++){ x.beginPath(); x.moveTo(X0,Y0+H*i/4); x.lineTo(X0+W,Y0+H*i/4); x.stroke(); }
    x.setLineDash([7,5]); x.strokeStyle='#F2A541'; x.lineWidth=2; x.beginPath(); x.moveTo(X0,Y(85)); x.lineTo(X0+W,Y(85)); x.stroke(); x.setLineDash([]); x.fillStyle='#9A5F12'; x.font='700 10px '+MONO; x.fillText('CLEAN AT 85 %',X0+6,Y(85)-4);
    x.strokeStyle='#13A89E'; x.lineWidth=3; x.beginPath(); for(var d=0;d<=30;d+=.5){ var v=100-d*.38+.4*Math.sin(d*1.3); var px=X0+d/36*W; if(d) x.lineTo(px,Y(v)); else x.moveTo(px,Y(v)); } x.stroke();
    x.setLineDash([3,4]); x.strokeStyle='#13A89E'; x.beginPath(); x.moveTo(X0+30/36*W,Y(88.6)); x.lineTo(X0+W,Y(86.3)); x.stroke(); x.setLineDash([]);
    var blink=Math.floor(t*1.5)%2; x.fillStyle=blink?'#F2A541':'#f7c98a'; rrect(x,348,48,154,62,8); x.fill(); x.fillStyle='#0B2545'; x.font='700 12px '+MONO; x.fillText('CIP RECOMMENDED',356,70); x.font='800 20px '+DISP; x.fillText('in 6 days',356,98);
    kpi(x,348,118,154,'RECOVERY','75.2 %'); kpi(x,348,170,154,'SALT REJECTION','98.6 %','#2f8a4a'); kpi(x,10,252,160,'PERMEATE',(10.2+Math.sin(t*.4)*.05).toFixed(1)+' m³/h','#0B7C74'); kpi(x,178,252,160,'STAGE ΔP','1.9 bar ↑','#9A5F12'); kpi(x,348,222,154,'FEED','12.6 bar'); }; }
/* =====================================================================
   KIT v2 — real piping (bends, flanges, supports, insulation), ladder
   cable trays with routed cables, cut-away vessels, steel, platforms
   ===================================================================== */
function icyl(list,r,h,m,p,seg){ var im=new T.InstancedMesh(new T.CylinderGeometry(r,r,h,seg||6),m,list.length), mt=new T.Matrix4(), q=new T.Quaternion(), s=new T.Vector3(1,1,1), P=new T.Vector3(), D=new T.Vector3();
  list.forEach(function(b,i){ P.set(b[0],b[1],b[2]); D.set(b[3]||0,b[4]==null?1:b[4],b[5]||0).normalize(); q.setFromUnitVectors(Y,D); mt.compose(P,q,s); im.setMatrixAt(i,mt); }); p.add(im); return im; }
function kPath(pts,rb){ var P=pts.map(function(a){ return a.isVector3?a.clone():V(a); }), segs=[], cur=P[0].clone();
  for(var i=1;i<P.length-1;i++){ var A=P[i-1],B=P[i],C=P[i+1], d1=B.clone().sub(A), d2=C.clone().sub(B), l1=d1.length(), l2=d2.length(); if(l1<1e-5||l2<1e-5) continue; d1.normalize(); d2.normalize();
    var th=Math.acos(Math.max(-1,Math.min(1,d1.dot(d2)))), tl=Math.tan(th/2), rr=Math.min(rb*tl,l1*.48,l2*.48), s=B.clone().addScaledVector(d1,-rr), e=B.clone().addScaledVector(d2,rr);
    if(cur.distanceTo(s)>1e-4) segs.push({t:'l',a:cur.clone(),b:s}); if(th>.01){ var cd=(4/3)*Math.tan(th/4)*rr/Math.max(tl,1e-4); segs.push({t:'b',c:new T.CubicBezierCurve3(s,s.clone().addScaledVector(d1,cd),e.clone().addScaledVector(d2,-cd),e),a:s,b:e,d1:d1,d2:d2,rho:rr/Math.max(tl,1e-4)}); } else segs.push({t:'l',a:s,b:e}); cur=e; }
  segs.push({t:'l',a:cur,b:P[P.length-1].clone()}); return segs; }
function kCurve(pts,rb){ var cp=new T.CurvePath(); kPath(pts,rb).forEach(function(s){ if(s.t==='l'){ if(s.a.distanceTo(s.b)>1e-4) cp.add(new T.LineCurve3(s.a,s.b)); } else cp.add(s.c); }); return cp; }
var KINS=null; function kInsM(){ if(!KINS) KINS=new T.MeshStandardMaterial({color:0xd9dfe5,metalness:.8,roughness:.32,envMapIntensity:.8}); return KINS; }
function kFlange(p,pos,dir,r,m){ var k=km(), f=new T.Group(); f.position.copy(pos); f.quaternion.setFromUnitVectors(Y,dir.clone().normalize()); p.add(f);
  var R=Math.max(r*1.85,r+.022), th=Math.max(r*.32,.01); cyl(R,R,th,m||k.ss2,0,0,0,f,26); cyl(r*1.15,r*1.25,th*1.6,m||k.ss2,0,-th*1.2,0,f,20);
  var n=r>.06?8:(r>.03?6:4), bl=[]; for(var i=0;i<n;i++){ var a=i/n*PI*2+PI/n; bl.push([Math.cos(a)*R*.8,0,Math.sin(a)*R*.8]); } icyl(bl,Math.max(R*.075,.0035),th*2.2,METAL(0x9aa1a8,.35),f,6); return f; }
/* pipe run: o={rb,ins,fl:[start,end] or false, sup:true, seg, mid:[[segIndex,frac]...]} */
function kTube(p,pts,r,m,o){ o=o||{}; var k=km(), g=new T.Group(); p.add(g); var R2=o.ins?r+(o.insT||Math.max(r*.8,.022)):r, mm=o.ins?kInsM():m; var segs=kPath(pts,Math.max(o.rb||r*3,R2*1.45,.045)); var wm=METAL(0x8f99a3,.4);
  segs.forEach(function(s){ if(s.t==='l'){ var L=s.a.distanceTo(s.b); if(L<1e-4) return; var c=new T.Mesh(new T.CylinderGeometry(R2,R2,L,o.seg||18,1,false),mm); c.position.copy(s.a).add(s.b).multiplyScalar(.5); c.quaternion.setFromUnitVectors(Y,s.b.clone().sub(s.a).normalize()); g.add(c);
      if(o.ins&&L>.35){ var d=s.b.clone().sub(s.a).normalize(); for(var u=.2;u<L-.1;u+=.42){ var bp=s.a.clone().addScaledVector(d,u); var b=new T.Mesh(new T.TorusGeometry(R2+.001,.0035,4,24),METAL(0xb7bec6,.35)); b.position.copy(bp); b.quaternion.setFromUnitVectors(new T.Vector3(0,0,1),d); g.add(b); } }
      if(o.sup&&Math.abs(s.a.y-s.b.y)<1e-3&&s.a.y>R2+.12&&L>.5){ var d2=s.b.clone().sub(s.a).normalize(), n=Math.max(1,Math.floor(L/1.1)); for(var j=1;j<=n;j++){ var sp=s.a.clone().lerp(s.b,j/(n+1)); kPipeSupport(g,sp,d2,R2); } } }
    else { g.add(new T.Mesh(new T.TubeGeometry(s.c,24,R2,o.seg||18,false),mm)); if(!o.noweld){ [[s.a,s.d1],[s.b,s.d2]].forEach(function(q){ var w=new T.Mesh(new T.TorusGeometry(R2+.0012,o.ins?.0035:Math.max(.0018,r*.07),5,Math.max(14,o.seg||18)),o.ins?METAL(0xb7bec6,.35):wm); w.position.copy(q[0]); w.quaternion.setFromUnitVectors(new T.Vector3(0,0,1),q[1]); g.add(w); }); if(o.ins){ for(var gi=1;gi<3;gi++){ var u=gi/3, pp=s.c.getPoint(u), tt=s.c.getTangent(u); var w2=new T.Mesh(new T.TorusGeometry(R2+.001,.0025,4,20),METAL(0xb7bec6,.35)); w2.position.copy(pp); w2.quaternion.setFromUnitVectors(new T.Vector3(0,0,1),tt); g.add(w2); } } } } });
  var P0=V(pts[0]), P1=V(pts[1]), Pn=V(pts[pts.length-1]), Pm=V(pts[pts.length-2]); var fl=o.fl===false?[false,false]:(o.fl||[true,true]);
  if(fl[0]) kFlange(g,P0,P1.clone().sub(P0),R2>r?r*1.05:r,o.fm); if(fl[1]) kFlange(g,Pn,Pn.clone().sub(Pm),R2>r?r*1.05:r,o.fm);
  (o.mid||[]).forEach(function(mf){ var s=segs.filter(function(x){return x.t==='l';})[mf[0]]; if(!s) return; var pos=s.a.clone().lerp(s.b,mf[1]), d=s.b.clone().sub(s.a); kFlange(g,pos.clone().addScaledVector(d.clone().normalize(),-.006),d,r,o.fm); kFlange(g,pos.clone().addScaledVector(d.clone().normalize(),.006),d.clone().negate(),r,o.fm); });
  return g; }
function kPipeSupport(p,pos,dir,r){ var k=km(), y=pos.y-r; var sm=PAINT(0x3b4a5c,.5);
  box(.045,y,.045,sm,pos.x,y/2,pos.z,p); box(.14,.012,.14,sm,pos.x,.006,pos.z,p); var hz=Math.abs(dir.x)>.5; box(hz?.05:.16,.012,hz?.16:.05,sm,pos.x,y-.006,pos.z,p);
  var cl=new T.Mesh(new T.TorusGeometry(r+.004,.004,5,16,PI),METAL(0xc9ced4,.3)); cl.position.copy(pos); cl.rotation.set(0,hz?PI/2:0,0); p.add(cl);
  [[-1],[1]].forEach(function(s){ cyl(.006,.006,.03,METAL(0x9aa1a8,.35),pos.x+(hz?0:s[0]*(r+.004)),y+.008,pos.z+(hz?s[0]*(r+.004):0),p,6); }); }
/* ladder cable tray along a straight run (axis 'x' or 'z') */
function kTray(p,a,b,y,w,o){ o=o||{}; var gm=METAL(0xb8bfc6,.4), alongX=Math.abs(b[0]-a[0])>Math.abs(b[1]-a[1]), L=alongX?Math.abs(b[0]-a[0]):Math.abs(b[1]-a[1]), cx=(a[0]+b[0])/2, cz=(a[1]+b[1])/2;
  [-1,1].forEach(function(s){ box(alongX?L:.006,.06,alongX?.006:L,gm,cx+(alongX?0:s*w/2),y+.03,cz+(alongX?s*w/2:0),p); box(alongX?L:.02,.006,alongX?.02:L,gm,cx+(alongX?0:s*(w/2-.01)),y+.06,cz+(alongX?s*(w/2-.01):0),p); });
  var rg=[]; for(var u=.1;u<L;u+=.22) rg.push(alongX?[Math.min(a[0],b[0])+u,y+.008,cz]:[cx,y+.008,Math.min(a[1],b[1])+u]); iboxes(rg,alongX?.025:w,.012,alongX?w:.025,gm,p);
  if(o.legs!==false){ for(u=.15;u<=L;u+=1.0){ var px=alongX?Math.min(a[0],b[0])+u:cx, pz=alongX?cz:Math.min(a[1],b[1])+u; box(.035,y,.035,PAINT(0x3b4a5c,.5),px,y/2,pz,p); box(alongX?.05:w+.06,.02,alongX?w+.06:.05,PAINT(0x3b4a5c,.5),px,y-.01,pz,p); box(.12,.01,.12,PAINT(0x3b4a5c,.5),px,.005,pz,p); } } }
/* routed cable: jacket tube + signal pulses; pts Manhattan */
function kCab(p,pts,col,o){ o=o||{}; var curve=kCurve(pts,o.rb||.05); var jm=new T.MeshStandardMaterial({color:o.jacket||0x1f2328,roughness:.6,emissive:new T.Color(col||0x13A89E),emissiveIntensity:0});
  var tube=new T.Mesh(new T.TubeGeometry(curve,Math.max(40,Math.round(curve.getLength()*40)),o.r||.0065,6,false),jm); p.add(tube);
  var pu=pulseOnly(p,curve,col||0x13A89E,o.n||3,o.speed||(.22/Math.max(.6,curve.getLength()/3)));
  return {set:function(k){ pu.set(k); jm.emissiveIntensity=.5*k; },update:function(t){ pu.update(t); }}; }
/* flexible conduit from an instrument head down to tray level */
function kGland(p,x,y,z){ var k=km(); cyl(.009,.011,.022,M(0x30363e),x,y-.011,z,p,10); }
/* auto-width nameplate canvas */
function kPlate(text,sub,w,h,dark){ var c=cnv(1024,Math.round(1024*h/w)),x=c.getContext('2d'),H=c.height; x.fillStyle=dark?'#0B2545':'#e8ecef'; x.fillRect(0,0,1024,H);
  if(!dark){ var gr=x.createLinearGradient(0,0,1024,0); gr.addColorStop(0,'#c9ced4'); gr.addColorStop(.5,'#f2f4f6'); gr.addColorStop(1,'#c3c9cf'); x.fillStyle=gr; x.fillRect(0,0,1024,H); }
  var s=H*.78; triLogo(x,H*.14,H*.11,s,dark); var tx=H*.14+s+H*.2, avail=1024-tx-H*.2; var fs=Math.round(H*(sub?.42:.5)); x.font='800 '+fs+'px '+DISP; while(x.measureText(text).width>avail&&fs>10){ fs-=2; x.font='800 '+fs+'px '+DISP; }
  x.fillStyle=dark?'#ffffff':'#0B2545'; x.fillText(text,tx,sub?H*.5:H*.66); if(sub){ var fs2=Math.round(H*.26); x.font='600 '+fs2+'px '+MONO; while(x.measureText(sub).width>avail&&fs2>8){ fs2-=1; x.font='600 '+fs2+'px '+MONO; } x.fillStyle=dark?'#3FD9CB':'#0B7C74'; x.fillText(sub,tx,H*.86); }
  return new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshStandardMaterial({map:ctex(c),roughness:.4,metalness:dark?.1:.5})); }
/* equipment data plate (generic, engraved look) */
function kDataPlate(p,lines,x,y,z,ry,w){ w=w||.16; var c=cnv(512,320),g=c.getContext('2d'); var gr=g.createLinearGradient(0,0,512,0); gr.addColorStop(0,'#c4cad0'); gr.addColorStop(.5,'#eef0f2'); gr.addColorStop(1,'#bfc5cb'); g.fillStyle=gr; g.fillRect(0,0,512,320);
  g.strokeStyle='#7d858d'; g.lineWidth=6; g.strokeRect(10,10,492,300); g.fillStyle='#2b3138'; g.font='800 46px '+DISP; g.fillText(lines[0],34,72); g.font='600 32px '+MONO; for(var i=1;i<lines.length;i++) g.fillText(lines[i],34,72+i*56);
  [[26,26],[486,26],[26,294],[486,294]].forEach(function(q){ g.fillStyle='#8a929b'; g.beginPath(); g.arc(q[0],q[1],8,0,PI*2); g.fill(); });
  var m=new T.Mesh(new T.PlaneGeometry(w,w*.625),new T.MeshStandardMaterial({map:ctex(c),metalness:.6,roughness:.35})); m.position.set(x,y,z); m.rotation.y=ry||0; p.add(m); return m; }
/* operator panel v2: pedestal enclosure, sloped hood, glands, full nameplate */
function kOpPanel2(p,x,z,ry,draw,name,sub){ var k=km(),g=new T.Group(); g.position.set(x,0,z); g.rotation.y=ry||0; p.add(g); var pm=PAINT(0xe4e8ec,.38), dm=PAINT(0xd5dbe1,.38);
  rbox(.16,.02,.16,.005,PAINT(0x3b4a5c,.5),0,.01,0,g); for(var i=0;i<4;i++) cyl(.008,.008,.03,METAL(0x9aa1a8,.3),(i%2?1:-1)*.06,.02,(i<2?1:-1)*.06,g,6);
  rbox(.1,.7,.1,.008,pm,0,.37,0,g); rbox(.2,.13,.14,.012,pm,0,.47,.0,g); box(.19,.01,.13,METAL(0x9aa1a8,.35),0,.4,0,g); [-.06,-.03,0,.03,.06].forEach(function(gx){ cyl(.011,.013,.03,M(0x30363e),gx,.385,.0,g,10); });
  rbox(.64,.52,.2,.022,pm,0,1.0,0,g); rbox(.6,.48,.012,.02,dm,0,1.0,.102,g); box(.012,.08,.02,METAL(0xc9ced4,.3),.27,1.0,.112,g); cylZ(.012,.012,M(0x22262a),.27,1.07,.11,g,10);
  [.2,.8].forEach(function(hy){ box(.012,.05,.016,METAL(0xb7bec6,.3),-.305,.75+hy*.48,.105,g); });
  rbox(.46,.32,.012,.01,M(0x15181b),-.04,1.06,.11,g); var s=screen(512,320,draw,8); var sp=new T.Mesh(new T.PlaneGeometry(.44,.275),screenMat(s)); sp.position.set(-.04,1.06,.117); g.add(sp);
  [[.235,1.18,0x37d67a,'RUN'],[.235,1.1,0xF2A541,'ALM'],[.235,1.02,0xc8312e,'TRIP']].forEach(function(b){ cylZ(.018,.02,M(0xcfd5db),b[0],b[1],.115,g,16); cylZ(.014,.012,GLOW(b[2],.8),b[0],b[1],.126,g,16); });
  cylZ(.026,.03,PAINT(0xc8312e,.4),.235,.88,.12,g,20); cylZ(.034,.008,k.yel,.235,.88,.108,g,24);
  var np=kPlate(name||'TRIONIX',sub||'',.44,.055,true); np.position.set(-.04,.83,.109); g.add(np);
  var hood=rbox(.7,.03,.26,.01,dm,0,1.285,.02,g); hood.rotation.x=-.08;
  return {group:g,screen:s,base:[x,0,z],update:function(t){s.update(t);}}; }
/* vertical cut-away shell: o={r,h,y0,bot:'dish'|'cone'|'flat',top:'dish'|'flat'|'none',m,mi,face,cone} ; front half fades */
function kShell(p,o){ var g=new T.Group(); g.rotation.y=o.face||0; p.add(g); var r=o.r,H=o.h,y0=o.y0; var bm=o.m, fm=o.m.clone(); fm.transparent=true; var im=new T.MeshStandardMaterial({color:o.inner||0xaab3bc,metalness:.75,roughness:.32,side:T.BackSide});
  var fg=new T.Group(); g.add(fg); function half(geo,front){ var mesh=new T.Mesh(geo,front?fm:bm); (front?fg:g).add(mesh); if(!front){ var m2=new T.Mesh(geo,im); g.add(m2); } return mesh; }
  var b1=half(new T.CylinderGeometry(r,r,H,56,1,true,PI/2,PI),false), b2=half(new T.CylinderGeometry(r,r,H,56,1,true,-PI/2,PI),true); b1.position.y=b2.position.y=y0+H/2; g.children.forEach(function(c){ if(c.geometry===b1.geometry) c.position.y=y0+H/2; });
  function head(yc,up,sc){ [false,true].forEach(function(front){ var geo=new T.SphereGeometry(r,48,16,front?0:PI,PI,up?0:PI/2,PI/2); var mm=half(geo,front); mm.position.y=yc; mm.scale.y=sc; g.children.forEach(function(c){ if(c.geometry===geo){ c.position.y=yc; c.scale.y=sc; } }); }); }
  if(o.top==='dish') head(y0+H,true,o.topK||.3); else if(o.top==='flat'){ cyl(r*1.03,r*1.03,.03,bm,0,y0+H+.015,0,g,48); }
  if(o.bot==='dish') head(y0,false,o.botK||.3); else if(o.bot==='cone'){ var hc=o.coneH||r*.8; [false,true].forEach(function(front){ var geo=new T.CylinderGeometry(r,o.coneR||r*.15,hc,48,1,true,front?-PI/2:PI/2,PI); var mm=half(geo,front); mm.position.y=y0-hc/2; g.children.forEach(function(c){ if(c.geometry===geo) c.position.y=y0-hc/2; }); }); }
  else if(o.bot==='flat'){ cyl(r,r,.02,bm,0,y0,0,g,48); }
  var edge=METAL(0x8f99a3,.35); [-1,1].forEach(function(s){ var e=box(.012,H,.03,edge,s*r,y0+H/2,0,fg); });
  return {g:g,front:fg,fm:fm,y0:y0,top:y0+H,setCut:function(k){ fm.opacity=1-k*.94; fm.depthWrite=k<.05; fg.visible=fm.opacity>.03; }}; }
/* horizontal cut-away shell (axis along x), front = +z half */
function kHShell(p,o){ var g=new T.Group(); p.add(g); var r=o.r,L=o.L; var bm=o.m, fm=o.m.clone(); fm.transparent=true; var im=new T.MeshStandardMaterial({color:o.inner||0xaab3bc,metalness:.75,roughness:.32,side:T.BackSide}); var fg=new T.Group(); g.add(fg);
  [false,true].forEach(function(front){ var geo=new T.CylinderGeometry(r,r,L,56,1,true,front?-PI/2:PI/2,PI); var m1=new T.Mesh(geo,front?fm:bm); m1.rotation.z=PI/2; (front?fg:g).add(m1); if(!front){ var m2=new T.Mesh(geo,im); m2.rotation.z=PI/2; g.add(m2); } });
  [-1,1].forEach(function(s){ [false,true].forEach(function(front){ var geo=new T.SphereGeometry(r,40,14,front?0:PI,PI,0,PI/2); var mm=new T.Mesh(geo,front?fm:bm); mm.rotation.z=s>0?-PI/2:PI/2; if(!front){ var mi=new T.Mesh(geo,im); mi.rotation.z=mm.rotation.z; mi.position.x=s*L/2; mi.scale.y=o.headK||.32; g.add(mi); } mm.position.x=s*L/2; mm.scale.y=o.headK||.32; (front?fg:g).add(mm); }); });
  var edge=METAL(0x8f99a3,.35); [-1,1].forEach(function(s){ box(L,.012,.03,edge,0,s*r,0,fg); });
  return {g:g,front:fg,fm:fm,setCut:function(k){ fm.opacity=1-k*.94; fm.depthWrite=k<.05; fg.visible=fm.opacity>.03; }}; }
/* steel: channel/I-beam between a and b (axis aligned), skid frame, platform, ladder */
var KWELD=null; function kWeldM(){ if(!KWELD) KWELD=new T.MeshStandardMaterial({color:0x5d646c,metalness:.55,roughness:.75}); return KWELD; }
function kBeam(p,a,b,h,w,m,o){ o=o||{}; var A=V(a),B=V(b),d=B.clone().sub(A),L=d.length(); var g=new T.Group(); g.position.copy(A).add(B).multiplyScalar(.5); var dn=d.clone().normalize(); g.quaternion.setFromUnitVectors(new T.Vector3(1,0,0),dn); p.add(g);
  box(L,h,.006,m,0,0,0,g); box(L,.008,w,m,0,h/2-.004,0,g); box(L,.008,w,m,0,-h/2+.004,0,g);
  var wm=kWeldM(), vert=Math.abs(dn.y)>.9, lowEnd=A.y<B.y?-1:1, lowY=Math.min(A.y,B.y); [-1,1].forEach(function(s){ var ex=s*L/2; if(vert&&s===lowEnd&&lowY<.16&&!o.noBase){ box(.012,Math.max(h,w)+.1,Math.max(h,w)+.1,m,ex,0,0,g); [[1,1],[1,-1],[-1,1],[-1,-1]].forEach(function(q){ cylX(.007,.03,METAL(0x9aa1a8,.35),ex-s*.01,q[0]*(Math.max(h,w)/2+.03),q[1]*(Math.max(h,w)/2+.03),g,6); }); [-1,1].forEach(function(q){ var gs=box(.05,.004,.05,m,ex-s*.03,0,q*(w/2+.022),g); gs.rotation.y=PI/4; gs.scale.set(1,1,.6); }); box(.006,h+.014,w+.014,wm,ex-s*.009,0,0,g); }
    else if(!o.noWeld){ box(.006,h+.012,w+.012,wm,ex-s*.003,0,0,g); } }); return g; }
function kSkid(p,x0,x1,z0,z1,col){ var m=PAINT(col||0x1f5aa6,.45),h=.12,y=h/2; kBeam(p,[x0,y,z0],[x1,y,z0],h,.06,m); kBeam(p,[x0,y,z1],[x1,y,z1],h,.06,m); for(var x=x0;x<=x1+1e-3;x+=Math.max(.5,(x1-x0)/Math.max(1,Math.round((x1-x0)/.8)))) kBeam(p,[x,y,z0+.03],[x,y,z1-.03],h*.85,.05,m);
  [[x0,z0],[x1,z0],[x0,z1],[x1,z1]].forEach(function(c){ var lg=tor(.03,.008,m,c[0],h+.02,c[1],p,PI); lg.rotation.y=Math.abs(c[0]-x0)<1e-3?PI/2:-PI/2; }); }
function kPlatform(p,x0,x1,z0,z1,y,o){ o=o||{}; var t=TEX.grate.clone(); t.needsUpdate=true; t.repeat.set((x1-x0)*7,(z1-z0)*7); var sm=PAINT(0x3b4a5c,.5), rm=PAINT(0xF2C230,.45);
  box(x1-x0,.03,z1-z0,new T.MeshStandardMaterial({color:0x8c96a2,metalness:.6,roughness:.45,alphaMap:t,alphaTest:.5}),(x0+x1)/2,y,(z0+z1)/2,p);
  [[x0,z0,x1,z0],[x0,z1,x1,z1],[x0,z0,x0,z1],[x1,z0,x1,z1]].forEach(function(e){ kBeam(p,[e[0],y-.06,e[1]],[e[2],y-.06,e[3]],.1,.04,sm); });
  [[x0,z0],[x1,z0],[x0,z1],[x1,z1]].forEach(function(c){ box(.05,y-.1,.05,sm,c[0],(y-.1)/2,c[1],p); box(.14,.01,.14,sm,c[0],.005,c[1],p); });
  (o.rails||['n','s','e','w']).forEach(function(sd){ var a,b; if(sd==='n'){a=[x0,z0];b=[x1,z0];} if(sd==='s'){a=[x0,z1];b=[x1,z1];} if(sd==='w'){a=[x0,z0];b=[x0,z1];} if(sd==='e'){a=[x1,z0];b=[x1,z1];}
    rod([a[0],y+1.0,a[1]],[b[0],y+1.0,b[1]],.018,rm,p,10); rod([a[0],y+.5,a[1]],[b[0],y+.5,b[1]],.014,rm,p,10); var L=Math.hypot(b[0]-a[0],b[1]-a[1]),n=Math.max(1,Math.round(L/.7)); for(var i=0;i<=n;i++){ var u=i/n; rod([a[0]+(b[0]-a[0])*u,y,a[1]+(b[1]-a[1])*u],[a[0]+(b[0]-a[0])*u,y+1.0,a[1]+(b[1]-a[1])*u],.016,rm,p,8); }
    box(Math.abs(b[0]-a[0])+.01,.1,Math.abs(b[1]-a[1])+.01,rm,(a[0]+b[0])/2,y+.06,(a[1]+b[1])/2,p); }); }
function kLadder(p,x,z,y0,y1,ry){ var g=new T.Group(); g.position.set(x,0,z); g.rotation.y=ry||0; p.add(g); var rm=PAINT(0xF2C230,.45); rod([-.2,y0,0],[-.2,y1+1,0],.018,rm,g); rod([.2,y0,0],[.2,y1+1,0],.018,rm,g); var rs=[]; for(var y=y0+.28;y<y1;y+=.28) rs.push([[-.2,y,0],[.2,y,0]]); irods(rs,.011,rm,g,6); return g; }
/* better motor: TEFC with fins, fan cowl, terminal box, eye bolt; axis +x (shaft end +x) */
function kMotor2(p,x,y,z,s,col,ry){ var g=new T.Group(); g.position.set(x,y,z); g.rotation.y=ry||0; g.scale.setScalar(s||1); p.add(g); var mc=col||PAINT(0x1f5aa6,.4);
  cylX(.14,.36,mc,0,0,0,g,36); var fins=[]; for(var i=0;i<22;i++){ var a=i/22*PI*2; if(Math.sin(a)<-.8) continue; fins.push([0,Math.sin(a)*.152,Math.cos(a)*.152,1,1,1,0,a]); } iboxes(fins,.34,.026,.006,mc,g);
  cylX(.15,.03,mc,.2,0,0,g,36); cylX(.15,.03,mc,-.2,0,0,g,36); cylX(.148,.12,M(0x2b3036,{roughness:.5}),-.28,0,0,g,36); var cg=[]; for(i=0;i<10;i++){ var a2=i/10*PI*2; cg.push([-.343,Math.sin(a2)*.08,Math.cos(a2)*.08,1,1,1,0,a2]); } iboxes(cg,.004,.1,.012,M(0x15171a),g);
  rbox(.13,.08,.12,.01,mc,.02,.18,0,g); rbox(.1,.03,.09,.008,mc,.02,.235,0,g); cylZ(.013,.03,M(0x30363e),.02,.17,.07,g,10); cylZ(.016,.015,M(0x22262a),.02,.17,.09,g,10);
  tor(.022,.006,METAL(0xc9ced4,.3),-.08,.17,0,g); [-.11,.11].forEach(function(xx){ box(.07,.08,.3,mc,xx,-.13,0,g); [-.12,.12].forEach(function(zz){ cyl(.008,.008,.02,METAL(0x9aa1a8,.3),xx,-.17,zz,g,6); }); });
  cylX(.022,.1,METAL(0xdde2e7,.2),.25,0,0,g,14); var np=kPlate('MOTOR','IE3 · 415 V · 50 Hz',.09,.03,false); np.position.set(-.02,.0,.155); g.add(np); return g; }
/* end-suction centrifugal pump set, axis +x; suction flange at +x end, discharge up */
function kPump2(p,x,z,ry,s,mc,pc){ var k=km(),g=new T.Group(); g.position.set(x,0,z); g.rotation.y=ry||0; g.scale.setScalar(s||1); p.add(g); var bm=PAINT(0x3b4a5c,.5); pc=pc||k.ss;
  kBeam(g,[-.5,.05,-.13],[.55,.05,-.13],.1,.05,bm); kBeam(g,[-.5,.05,.13],[.55,.05,.13],.1,.05,bm); box(1.05,.012,.3,bm,.02,.105,0,g);
  kMotor2(g,-.2,.27,0,1,mc); var cp=new T.Group(); cp.position.set(.1,.27,0); g.add(cp); cylX(.05,.06,M(0x30363e),0,0,0,cp,16);
  var gd=new T.Mesh(new T.CylinderGeometry(.09,.09,.16,20,1,true,0,PI),new T.MeshStandardMaterial({color:0xF2A541,roughness:.5,side:T.DoubleSide})); gd.rotation.z=PI/2; gd.position.set(.1,.27,0); g.add(gd);
  cylX(.06,.14,k.ss2,.24,.27,0,g,20); box(.1,.16,.16,k.ss2,.24,.18,0,g); var vol=new T.Mesh(new T.TorusGeometry(.1,.06,14,28),pc); vol.rotation.y=PI/2; vol.position.set(.36,.27,0); g.add(vol); cylX(.12,.08,pc,.36,.27,0,g,30);
  cylX(.055,.12,pc,.46,.27,0,g,20); kFlange(g,new T.Vector3(.52,.27,0),new T.Vector3(1,0,0),.055); cyl(.045,.05,.14,pc,.36,.43,0,g,20); kFlange(g,new T.Vector3(.36,.5,0),new T.Vector3(0,1,0),.045); box(.12,.1,.18,pc,.36,.16,0,g);
  var np=kPlate('PUMP','',.06,.025,false); np.position.set(.36,.27,.1); g.add(np);
  return {group:g,spin:cp,suc:new T.Vector3(.52,.27,0),dis:new T.Vector3(.36,.5,0)}; }
function kWorld(g,v){ g.updateMatrixWorld(true); return v.clone().applyMatrix4(g.matrixWorld); }
/* vertical tank nozzle with flange, pointing dir from a point on the shell */
function kNozzle(p,pos,dir,r,len,m){ var d=V(dir).normalize(), A=V(pos), B=A.clone().addScaledVector(d,len); var c=new T.Mesh(new T.CylinderGeometry(r,r,len,16),m||km().ss); c.position.copy(A).add(B).multiplyScalar(.5); c.quaternion.setFromUnitVectors(Y,d); p.add(c); kFlange(p,B,d,r); return B; }
/* sight glass with light */
function kSight(p,pos,dir,r){ var d=V(dir).normalize(), g=new T.Group(); g.position.copy(V(pos)); g.quaternion.setFromUnitVectors(new T.Vector3(0,0,1),d); p.add(g); cylZ(r*1.5,.03,km().ss2,0,0,0,g,24); var gl=new T.Mesh(new T.CircleGeometry(r,24),new T.MeshPhysicalMaterial({color:0xcfe6f2,transparent:true,opacity:.45,roughness:.05,clearcoat:1})); gl.position.z=.016; g.add(gl);
  var bl=[]; for(var i=0;i<8;i++){ var a=i/8*PI*2; bl.push([Math.cos(a)*r*1.3,Math.sin(a)*r*1.3,.02,0,0,1]); } icyl(bl,.005,.02,METAL(0x9aa1a8,.3),g,6); return g; }
/* camera helper for tabs: inside view + feature */
function ind3(st,R,o){ var c2=o.cam2,l2=o.look2; if(o.op){ var g=o.op.group, ry=g.rotation.y, nx=Math.sin(ry), nz=Math.cos(ry), sx=Math.cos(ry), sz=-Math.sin(ry); var hx=g.position.x-.04*sx+.12*nx, hz=g.position.z-.04*sz+.12*nz, hy=1.06;
    c2=[hx+nx*1.05+sx*.3, hy+.12, hz+nz*1.05+sz*.3]; l2=[hx-sx*.05, hy-.03, hz-sz*.05]; }
  var steps=[{cam:o.cam,look:o.look,auto:o.auto==null?.08:o.auto},{cam:o.camIn,look:o.lookIn,v:{cut:1}},{cam:c2,look:l2,v:{loop:1}}];
  return {zoom:o.zoom||1,shadow:{size:o.shadow||3,center:o.center||[0,0,0]},keys:['cut','loop'],base:{cut:0,loop:.2},steps:steps,update:o.update}; }
/* label with a leader line + dot at the exact point it describes */
function leadLab(R,txt,anchor,pos,col,h){ var l=label(txt,{pos:pos,h:h||.085,border:col||'#13A89E'}); R.add(l);
  var g=new T.BufferGeometry().setFromPoints([V(anchor),V(pos)]); var lm=new T.LineBasicMaterial({color:new T.Color(col||'#13A89E'),transparent:true,opacity:.9,depthTest:false,toneMapped:false}); var ln=new T.Line(g,lm); ln.renderOrder=29; R.add(ln);
  var dm=new T.MeshBasicMaterial({color:new T.Color(col||'#13A89E'),transparent:true,depthTest:false,toneMapped:false}); var d=new T.Mesh(new T.SphereGeometry((h||.085)*.12,10,8),dm); d.position.copy(V(anchor)); d.renderOrder=29; R.add(d);
  l.userData.lead=[lm,dm]; l.userData.parts=[ln,d]; return l; }
function labOp(l,op){ l.material.opacity=op; l.visible=op>.02; if(l.userData.lead){ l.userData.lead.forEach(function(m){ m.opacity=op*.9; }); l.userData.parts.forEach(function(o){ o.visible=op>.02; }); } }
/* realistic grate fire: layered additive particles rising to a given height */
function kFire(p,cx,cz,w,d,y0,y1){ var c=cnv(128,128),g=c.getContext('2d'),gr=g.createRadialGradient(64,64,0,64,64,64); gr.addColorStop(0,'rgba(255,255,255,1)'); gr.addColorStop(.25,'rgba(255,240,200,.85)'); gr.addColorStop(.6,'rgba(255,170,60,.35)'); gr.addColorStop(1,'rgba(255,120,20,0)'); g.fillStyle=gr; g.fillRect(0,0,128,128); var tex=new T.CanvasTexture(c);
  var layers=[[220,.22,0xffd27a,1.0],[160,.42,0xff8a2a,.95],[90,.75,0xff4a10,.75]].map(function(L){ var N=L[0],pos=new Float32Array(N*3),col=new Float32Array(N*3),seed=[]; for(var i=0;i<N;i++) seed.push([Math.random(),Math.random(),Math.random(),Math.random()]);
    var gm=new T.BufferGeometry(); gm.setAttribute('position',new T.BufferAttribute(pos,3)); gm.setAttribute('color',new T.BufferAttribute(col,3));
    var m=new T.PointsMaterial({size:L[1],map:tex,vertexColors:true,transparent:true,opacity:L[3],depthWrite:false,blending:T.AdditiveBlending,toneMapped:false}); var pts=new T.Points(gm,m); pts.frustumCulled=false; p.add(pts); return {N:N,pos:pos,col:col,seed:seed,gm:gm,base:new T.Color(L[2])}; });
  var hot=new T.Color(0xfff2c8), cool=new T.Color(0xc0300a), cc=new T.Color(), H=y1-y0;
  return function(t,k){ layers.forEach(function(L,li){ for(var i=0;i<L.N;i++){ var s=L.seed[i], sp=.35+s[2]*.35+li*.05, u=(s[0]+t*sp)%1; var tight=1-u*.55; var x=cx+(s[1]-.5)*w*tight+Math.sin(t*3+s[3]*9+u*6)*.06*u, z=cz+(s[3]-.5)*d*tight+Math.cos(t*2.6+s[1]*7+u*5)*.06*u;
      var hmax=H*(.55+.45*s[2]*(li===0?.6:1)); var y=y0+u*hmax; L.pos[i*3]=x; L.pos[i*3+1]=y; L.pos[i*3+2]=z; var f=Math.min(1,u*1.3); cc.copy(hot).lerp(L.base,Math.min(1,f*1.4)).lerp(cool,Math.max(0,f-.55)*1.6); var a=(1-u)*(u<.06?u/.06:1)*k; L.col[i*3]=cc.r*a; L.col[i*3+1]=cc.g*a; L.col[i*3+2]=cc.b*a; }
    L.gm.attributes.position.needsUpdate=true; L.gm.attributes.color.needsUpdate=true; }); }; }

/* ===== cabling v3: instrument gland -> flexible conduit (drip loop) -> rigid conduit with clamps -> riser post -> cable tray -> panel gland plate ===== */
var KFLEX=null; function kFlexM(){ if(!KFLEX){ var c=cnv(64,8),x=c.getContext('2d'); for(var i=0;i<64;i++){ var v=(i%4<2)?78:46; x.fillStyle='rgb('+v+','+(v+3)+','+(v+7)+')'; x.fillRect(i,0,1,8); } var t=ctex(c); t.wrapS=t.wrapT=T.RepeatWrapping; t.repeat.set(26,1); KFLEX=new T.MeshStandardMaterial({map:t,roughness:.5,metalness:.35}); } return KFLEX; }
var KCOND=null; function kCondM(){ if(!KCOND) KCOND=METAL(0xaeb6be,.32); return KCOND; }
function kRing(p,pos,dir,r,m){ var t=new T.Mesh(new T.TorusGeometry(r,r*.32,5,14),m||METAL(0x8f99a3,.35)); t.position.copy(pos); t.quaternion.setFromUnitVectors(new T.Vector3(0,0,1),dir.clone().normalize()); p.add(t); return t; }
function kCable3(R,a,via,TR,E,col,off){ off=off||0; var yT=TR.y+.022, tz=TR.z+off, ex=E[0]+off*.5, ey=.37;
  var A=V(a), pts=[A]; (via||[]).forEach(function(q){ pts.push(V(q)); }); if(pts.length===1) pts.push(new T.Vector3(A.x,A.y-.13,A.z+(tz<A.z?-.04:.04)));
  var F=pts[1], l=pts[pts.length-1]; if(Math.abs(l.z-tz)>1e-3) pts.push(new T.Vector3(l.x,l.y,tz)); var top=pts[pts.length-1].clone(), land=new T.Vector3(l.x,yT,tz); pts.push(land);
  var rest=[land.clone()]; if(Math.abs(l.x-ex)>1e-3) rest.push(new T.Vector3(ex,yT,tz)); if(Math.abs(tz-E[2])>1e-3) rest.push(new T.Vector3(ex,yT,E[2])); rest.push(new T.Vector3(ex,ey,E[2]));
  var g=new T.Group(); R.add(g);
  /* 1. flexible conduit with a drip loop */
  var d=A.distanceTo(F), mid=A.clone().lerp(F,.5); mid.y=Math.min(A.y,F.y)-Math.min(.12,.22*d+.03); var fc=new T.QuadraticBezierCurve3(A,mid,F);
  g.add(new T.Mesh(new T.TubeGeometry(fc,20,.0095,8,false),kFlexM())); cyl(.013,.013,.024,M(0x30363e),A.x,A.y-.006,A.z,g,10); 
  /* 2. branch ladder trays along the route (horizontal + vertical riser), cable laid inside */
  var rig=pts.slice(1), acr=new T.Vector3(off>=0?1:-1,0,0); cyl(.016,.016,.03,M(0x30363e),F.x,F.y,F.z,g,10); box(.09,.006,.06,PAINT(0x8a939c,.45),F.x,F.y-.03,F.z,g); box(.006,.08,.06,PAINT(0x8a939c,.45),F.x-.045,F.y-.07,F.z,g);
  for(var si=0;si<rig.length-1;si++){ var a2=rig[si], b2=rig[si+1]; kTraySeg(g,a2,b2,.075,acr); }
  var rc=kCurve(rig,.04), cjm=new T.MeshStandardMaterial({color:0x2a2f35,roughness:.6}); g.add(new T.Mesh(new T.TubeGeometry(rc,Math.max(24,Math.round(rc.getLength()*30)),.0062,6,false),cjm));
  /* 3. riser post beside the tray for the vertical drop */
  var H=top.y-land.y; if(H>.18){ var pz=TR.z+(off>=0?1:-1)*.13, sm=PAINT(0x8a939c,.45), ph=top.y+.06; box(.026,ph,.026,sm,l.x,ph/2,pz,g); box(.1,.008,.1,sm,l.x,.004,pz,g);
    for(var hy=land.y+.14;hy<top.y;hy+=.38){ var bl=Math.abs(pz-tz)-.02; box(.05,.012,bl,sm,l.x,hy,(pz+tz)/2+(off>=0?.01:-.01),g); } }
  cyl(.0125,.0125,.025,M(0x30363e),land.x,land.y+.03,land.z,g,10);
  /* 4. cable laid in the tray, rising into the panel gland plate */
  var tc=kCurve(rest,.05), jm=new T.MeshStandardMaterial({color:0x2a2f35,roughness:.6,emissive:new T.Color(col||0x13A89E),emissiveIntensity:0}); g.add(new T.Mesh(new T.TubeGeometry(tc,Math.max(30,Math.round(tc.getLength()*30)),.0062,6,false),jm));
  var full=kCurve(pts.concat(rest.slice(1)),.05); var pu=pulseOnly(g,full,col||0x13A89E,3,.22/Math.max(.6,full.getLength()/3));
  return {set:function(k){ pu.set(k); jm.emissiveIntensity=.55*k; },update:function(t){ pu.update(t); }}; }
/* end-of-line: blind/battery-limit flange with line tag */
function kBL(R,pos,dir,r,text,col){ var P=V(pos), D=V(dir).normalize(); kFlange(R,P,D,r); var bf=new T.Mesh(new T.CylinderGeometry(Math.max(r*1.85,r+.022),Math.max(r*1.85,r+.022),.012,26),METAL(0x9aa1a8,.35)); bf.position.copy(P).addScaledVector(D,.014); bf.quaternion.setFromUnitVectors(Y,D); R.add(bf);
  if(text){ var c=cnv(512,96),x=c.getContext('2d'); x.fillStyle=col||'#0B2545'; x.fillRect(0,0,512,96); x.fillStyle='#fff'; x.font='700 50px '+MONO; x.textBaseline='middle'; x.fillText(text,22,50); var w=.035*text.length*.62+.06; var pl=new T.Mesh(new T.PlaneGeometry(Math.min(.36,w),.045),new T.MeshBasicMaterial({map:ctex(c),side:T.DoubleSide})); pl.position.copy(P).addScaledVector(D,-.12); pl.position.y+=r+.05; var fz=Math.abs(D.x)>.5; pl.rotation.y=fz?0:PI/2; R.add(pl); } }
/* control-valve station: CV with upstream/downstream isolation valves and a manual bypass */
function kCVS(R,tag,r,x,y,z,axis,o){ o=o||{}; var ax=axis==='z'?new T.Vector3(0,0,1):new T.Vector3(1,0,0), ry=axis==='z'?PI/2:0, C=new T.Vector3(x,y,z), up=o.up==null?.2:o.up, sp=o.span||.36;
  var cv=kCV(R,tag,r,x,y,z,ry); [-1,1].forEach(function(s){ var q=C.clone().addScaledVector(ax,s*sp*.62); kHV(R,r,q.x,q.y,q.z,ry); var t=C.clone().addScaledVector(ax,s*sp); sph(r*1.25,km().ss2,t.x,t.y,t.z,R,12,8); });
  var a=C.clone().addScaledVector(ax,-sp), b=C.clone().addScaledVector(ax,sp), dy=new T.Vector3(0,0,0); if(o.side){ dy.copy(axis==='z'?new T.Vector3(1,0,0):new T.Vector3(0,0,1)).multiplyScalar(o.side); } else dy.y=-up;
  kTube(R,[a,a.clone().add(dy),b.clone().add(dy),b],r*.85,o.m||km().ss,{fl:false,rb:Math.min(.06,up*.45)}); var bm=C.clone().add(dy); var hv=kHV(R,r*.85,bm.x,bm.y,bm.z,ry,km().yel); if(!o.side&&up>0){ hv.rotation.x=PI; }
  return cv; }
/* steam trap set on a drip leg below a steam line */
function kTrap(R,x,y,z,len){ var k=km(), y1=y-(len||.22); kTube(R,[[x,y,z],[x,y1,z]],.012,k.ss2,{fl:false}); sph(.016,k.ss2,x,y,z,R,10,8); var t=new T.Group(); t.position.set(x,y1-.03,z); R.add(t); cyl(.028,.028,.045,M(0x5d6670,{metalness:.6,roughness:.4}),0,0,0,t,16); cyl(.012,.012,.02,k.ss2,0,-.032,0,t,8); return t; }
/* utility header on stands with capped ends: pts along x at height y, z fixed */
function kHeader(R,x0,x1,y,z,r,m,o){ o=o||{}; var k=km(); kTube(R,[[x0,y,z],[x1,y,z]],r,m,{ins:o.ins,fl:false}); var rr=o.ins?r+Math.max(r*.8,.022):r;
  [x0,x1].forEach(function(x,i){ var e=sph(rr,o.ins?kInsM():m,x,y,z,R,16,10); e.scale.x=.45; });
  var sm=PAINT(0x3b4a5c,.5); for(var x=x0+.25;x<x1;x+=.9){ box(.04,y-rr,.04,sm,x,(y-rr)/2,z,R); box(.04,.014,.18,sm,x,y-rr-.007,z,R); box(.12,.01,.12,sm,x,.005,z,R); kPipeSupport(R,new T.Vector3(x,y,z),new T.Vector3(1,0,0),rr); }
  if(o.text){ var c=cnv(512,96),cx=c.getContext('2d'); cx.fillStyle=o.col||'#0B2545'; cx.fillRect(0,0,512,96); cx.fillStyle='#fff'; cx.font='700 46px '+MONO; cx.textBaseline='middle'; cx.fillText(o.text,20,50); var pl=new T.Mesh(new T.PlaneGeometry(.3,.056),new T.MeshBasicMaterial({map:ctex(c),side:T.DoubleSide})); pl.position.set(o.tx!=null?o.tx:x0+.35,y+rr+.04,z+(o.tz||0)); R.add(pl); } }
/* flow meters by service: vortex for steam, Coriolis for mass flow, non-return valve */
function kVortex(p,tag,r,x,y,z,ry,unit,val){ var k=km(),g=new T.Group(); g.position.set(x,y,z); g.rotation.y=ry||0; p.add(g);
  cylX(r*1.25,r*2.4,k.ss,0,0,0,g,24); [-1,1].forEach(function(s){ cylX(r*1.9,r*.3,k.ss2,s*r*1.3,0,0,g,24); for(var i=0;i<6;i++){ var a=i*PI/3; cylX(.005,r*.5,k.ss2,s*r*1.3,Math.sin(a)*r*1.55,Math.cos(a)*r*1.55,g,6); } });
  cyl(r*.35,r*.35,r*2.2,k.ss,0,r*2.2,0,g,12); var h=kHead(g,tag,unit||'t/h',val||2,.2); h.position.y=r*3.3+.035; return {group:g,update:function(t){h.userData.lcd.update(t);}}; }
function kCoriolis(p,tag,r,x,y,z,ry,unit,val){ var k=km(),g=new T.Group(); g.position.set(x,y,z); g.rotation.y=ry||0; p.add(g);
  [-1,1].forEach(function(s){ cylX(r*1.9,r*.3,k.ss2,s*r*3.2,0,0,g,24); cylX(r*1.1,r*1.2,k.ss,s*r*2.5,0,0,g,18); });
  var hs=new T.Mesh(new T.TorusGeometry(r*1.9,r*.95,10,24,PI),k.ss); hs.rotation.x=0; hs.rotation.z=PI; hs.scale.set(1,1.5,.75); hs.position.y=-r*.2; g.add(hs);
  cyl(r*.4,r*.4,r*1.6,k.ss,0,r*1.2,0,g,12); var h=kHead(g,tag,unit||'kg/h',val||100,.2); h.position.y=r*2.1+.035; return {group:g,update:function(t){h.userData.lcd.update(t);}}; }
function kNRV(p,r,x,y,z,ry,rz){ var k=km(),g=new T.Group(); g.position.set(x,y,z); g.rotation.set(0,ry||0,rz||0); p.add(g);
  cylX(r*1.35,r*2.6,k.ss2,0,0,0,g,20); [-1,1].forEach(function(s){ cylX(r*1.7,r*.3,k.ss2,s*r*1.4,0,0,g,22); }); var d=sph(r*1.05,k.ss2,0,r*.9,0,g,16,8); d.scale.y=.7; cyl(r*1.2,r*1.2,r*.18,k.ss2,0,r*1.15,0,g,18);
  var c=cnv(64,32),x2=c.getContext('2d'); x2.fillStyle='#e8ecef'; x2.fillRect(0,0,64,32); x2.fillStyle='#0B2545'; x2.beginPath(); x2.moveTo(8,12); x2.lineTo(42,12); x2.lineTo(42,4); x2.lineTo(58,16); x2.lineTo(42,28); x2.lineTo(42,20); x2.lineTo(8,20); x2.fill(); var ar=new T.Mesh(new T.PlaneGeometry(r*2,r),new T.MeshBasicMaterial({map:ctex(c)})); ar.position.z=r*1.36; g.add(ar); return g; }
/* valve on a vertical line (pipe along y) */
function kHVv(p,r,x,y,z,ry,col){ var g=kHV(p,r,x,y,z,0,col); g.rotation.set(0,ry||0,PI/2); return g; }

function kTraySeg(p,A,B,w,acr){ var d=B.clone().sub(A),L=d.length(); if(L<.015) return; d.normalize(); var gm=METAL(0xb8bfc6,.4), up, across;
  if(Math.abs(d.y)<.5){ up=new T.Vector3(0,1,0); across=new T.Vector3().crossVectors(d,up).normalize(); } else { across=(acr||new T.Vector3(1,0,0)).clone(); up=new T.Vector3().crossVectors(across,d).normalize(); }
  var g=new T.Group(); g.position.copy(A).add(B).multiplyScalar(.5); g.quaternion.setFromRotationMatrix(new T.Matrix4().makeBasis(d,up,across)); p.add(g); var Lx=L+w*.9;
  [-1,1].forEach(function(s){ box(Lx,.042,.004,gm,0,.012,s*w/2,g); box(Lx,.003,.012,gm,0,.033,s*(w/2-.006),g); });
  var rg=[]; for(var u=-Lx/2+.04;u<Lx/2;u+=.11) rg.push([u,-.009,0]); iboxes(rg,.014,.005,w,gm,g); return g; }
/* =====================================================================
   INDUSTRY PROCESS VIEWS (Automation page, zig-zag sections)
   each: overview (auto-rotate) + control-loop close-up on the HMI
   ===================================================================== */
function kPump(p,x,z,ry,s,mc){ var k=km(),g=new T.Group(); g.position.set(x,0,z); g.rotation.y=ry||0; g.scale.setScalar(s||1); p.add(g);
  rbox(.9,.05,.3,.01,PAINT(0x3b4a5c,.5),0,.025,0,g); kMotor(g,-.18,.21,0,1,mc);
  var cp=new T.Group(); cp.position.set(.1,.21,0); g.add(cp); cylX(.055,.05,k.org,0,0,0,cp,20); for(var i=0;i<6;i++) cylX(.005,.055,k.ss2,0,Math.sin(i*PI/3)*.04,Math.cos(i*PI/3)*.04,cp,6);
  cylX(.035,.1,k.ss2,.18,.21,0,g,16); box(.07,.11,.12,k.ss2,.18,.11,0,g);
  cylX(.14,.1,k.ss,.3,.22,0,g,32); cylX(.05,.12,k.ss,.41,.22,0,g,20); cylX(.07,.015,k.ss2,.47,.22,0,g,20); cyl(.04,.04,.18,k.ss,.3,.4,0,g,18); cyl(.06,.06,.015,k.ss2,.3,.49,0,g,20);
  return {group:g,spin:cp}; }
function kSteam(p,n,x,y,z,spread){ var arr=[]; for(var i=0;i<n;i++){ var s=new T.Sprite(new T.SpriteMaterial({map:DOT,color:0xffffff,transparent:true,depthWrite:false,opacity:0})); p.add(s); arr.push({s:s,o:i/n,dx:(Math.random()-.5)*spread,dz:(Math.random()-.5)*spread}); }
  return function(t,k){ arr.forEach(function(a){ var u=(t*.25+a.o)%1; a.s.position.set(x+a.dx*(1+u),y+u*.7,z+a.dz*(1+u)); var sc=.08+u*.3; a.s.scale.set(sc,sc,1); a.s.material.opacity=(k==null?.5:k)*(1-u)*(u<.1?u*10:1); }); }; }
function kFlow(p,pts,col,n,sp){ return pulseOnly(p,polyPath(pts),col,n||4,sp||.3); }
function indRun(R,o){ /* shared update wiring */ var up=o.up||[],sig=o.sig||[],flows=o.flows||[],labs=o.labs||[],spin=o.spin||[],cam=o.st&&o.st.camera,tv=new T.Vector3(); labs.forEach(function(l){ l.userData.s0=l.scale.clone(); });
  return function(dt,t,v){ var L=v.loop; up.forEach(function(f){ f(t,dt); }); sig.forEach(function(c){ c.set(.2+.8*L); c.update(t); }); flows.forEach(function(f){ f.set(.85); f.update(t); });
    spin.forEach(function(s){ s[0].rotation[s[2]||'x']+=dt*s[1]; }); var lp=Math.max(0,Math.min(1,(L-.35)/.4)); labs.forEach(function(l,i){ var keep=i<Math.min(2,o.loopLabs||0); l.material.opacity=keep?.95:.95*(1-lp); l.visible=l.material.opacity>.02; l.material.depthTest=lp>.5; if(cam){ l.getWorldPosition(tv); var kk=Math.min(1.75,Math.max(.6,cam.position.distanceTo(tv)/2.6)); l.scale.copy(l.userData.s0).multiplyScalar(kk); } }); if(o.extra) o.extra(dt,t,v); }; }

/* ---------- 1. FOOD: jacketed cooking kettle ---------- */
IND.food=function(st){
  var R=new T.Group(); st.scene.add(R); softFloor(R,3.4,{cells:16,shadow:.22}); var k=km(), up=[];
  var V0=new T.Group(); V0.position.set(-.3,0,0); R.add(V0);
  kVessel(V0,{r:.5,h:.72,legH:.55,bottom:'dish',top:'flat',jacket:true,jacketH:.8,loadcells:true}); var top=1.27;
  var lidF=new T.Mesh(new T.CylinderGeometry(.51,.51,.025,40,1,false,0,PI),k.ss); lidF.position.set(0,top+.03,0); lidF.rotation.y=PI/2; V0.add(lidF);
  var hinge=new T.Group(); hinge.position.set(0,top+.045,0); hinge.rotation.x=-1.15; V0.add(hinge); var lidO=new T.Mesh(new T.CylinderGeometry(.51,.51,.025,40,1,false,0,PI),k.ss); lidO.rotation.y=-PI/2; hinge.add(lidO);
  cyl(.02,.02,.08,k.ss2,0,.012,.47,hinge,10).rotation.x=PI/2; cylX(.014,1.0,k.ss2,0,top+.045,0,V0,10);
  var inner=new T.Mesh(new T.CylinderGeometry(.497,.497,.14,40,1,true),new T.MeshStandardMaterial({color:0xaeb6be,metalness:.8,roughness:.3,side:T.BackSide})); inner.position.y=top-.06; V0.add(inner);
  var prod=new T.Mesh(new T.CircleGeometry(.49,48),new T.MeshStandardMaterial({color:0xd9862b,roughness:.3,emissive:new T.Color(0x5a2a05),emissiveIntensity:.25})); prod.rotation.x=-PI/2; prod.position.y=top-.12; V0.add(prod);
  box(1.08,.05,.1,k.ss2,0,top+.07,-.06,V0); var sh=kAgitator(V0,top+.095,.78,'anchor'); sh.parent.position.z=-.06;
  var vap=kSteam(V0,10,.0,top-.1,.18,.5); up.push(function(t){ vap(t,.45); });
  /* CIP spray ball + line */
  pipe([[-.28,top+.04,-.28],[-.28,top+.24,-.28],[-.28,top+.24,-.75]],.016,k.ss,V0); sph(.03,k.ss,-.28,top-.04,-.28,V0,14,10);
  /* steam to jacket: isolation, strainer, TCV, gauge */
  var sm=k.steam; rod([-1.7,.95,0],[-.84,.95,0],.03,sm,R); rod([-1.7,.95,0],[-1.7,.95,-.6],.03,sm,R); sph(.03,sm,-1.7,.95,0,R);
  kHV(R,.03,-1.52,.95,0); var ys=new T.Group(); ys.position.set(-1.36,.95,0); R.add(ys); cylX(.04,.1,k.ss2,0,0,0,ys,14); var yb=cyl(.03,.03,.12,k.ss2,0,-.06,.04,ys,12); yb.rotation.x=.6;
  kCV(R,'TCV-101',.03,-1.15,.95,0); kGauge(R,-.98,1.07,0,0,'bar',.9); cyl(.008,.008,.06,k.ss2,-.98,1.0,0,R,8);
  /* condensate + trap */
  pipe([[.08,.62,.36],[.08,.3,.36],[.42,.3,.62],[.6,.3,.62]],.018,k.steam,R); var trap=new T.Group(); trap.position.set(.47,.3,.62); R.add(trap); sph(.05,k.ss2,0,0,0,trap,14,10); cylX(.035,.06,k.ss2,0,0,0,trap,12);
  /* bottom discharge + pump */
  pipe([[-.3,.39,0],[-.3,.26,0],[.25,.26,0],[.25,.26,-.62],[.42,.22,-.62]],.025,k.ss,R); kBV(R,'XV-102',.025,-.05,.26,0); var pu=kPump(R,.85,-.62,PI,.75); pipe([[.62,.4,-.62],[.62,.75,-.62],[1.3,.75,-.62]],.022,k.ss,R);
  /* instruments */
  var tt=kTT(V0,'TT-101',85.0,.2,top+.045,-.24); up.push(tt.update);
  var wt=kHead(R,'WT-101','kg',412,.8,k.navy); wt.position.set(-.85,.42,.55); wt.rotation.y=.4; up.push(function(t){ wt.userData.lcd.update(t); });
  cyl(.012,.012,.36,k.ss2,-.85,.2,.55,R,8);
  var CAMF=[2.7,2.2,3.4]; var op=kOpPanel(R,1.1,.55,faceTo(1.1,.55,CAMF),drawRecipe(),'TRIONIX · KETTLE PANEL'); up.push(op.update);
  var sig=[kSig(R,[-.1,1.45,-.24],[1.1,.3,.55],0x13A89E,{via:[[-.1,1.55,-.75]]}),kSig(R,[-1.1,1.13,.06],[1.05,.3,.55],0xF2A541),kSig(R,[-.85,.3,.55],[1.0,.3,.55],0x7a5cff)];
  var labs=[indLabel(R,'TT-101 · product temperature',[.15,1.95,-.3]),indLabel(R,'TCV-101 · steam to jacket',[-1.15,1.42,0],'#E8891E'),indLabel(R,'Load cells · batch weight',[-.85,.72,.62],'#7a5cff'),indLabel(R,'Trionix HMI · recipe & batch',[1.1,1.48,.55],'#F2A541'),indLabel(R,'Jacketed kettle · anchor agitator',[-1.0,1.55,.35],'#0B2545')];
  var flows=[kFlow(R,[[-1.7,.99,-.6],[-1.7,.99,0],[-.84,.99,0]],0xE8891E,5,.25)];
  return indFrame(st,R,{cam:CAMF,look:[-.2,.85,0],op:op,shadow:2.6,
    update:indRun(R,{st:st,up:up,sig:sig,flows:flows,labs:labs,loopLabs:4,spin:[[sh,1.2,'y'],[pu.spin,14,'x']]})});
};

/* ---------- 2. PHARMA: fluid bed dryer ---------- */
IND.pharma=function(st){
  var R=new T.Group(); st.scene.add(R); softFloor(R,3.4,{cells:16,shadow:.22}); var k=km(), up=[];
  var X=-.15;
  /* base frame + plenum */
  [[-.4,-.4],[.4,-.4],[-.4,.4],[.4,.4]].forEach(function(p){ box(.06,.42,.06,k.ss2,X+p[0],.21,p[1],R); });
  cyl(.42,.36,.28,k.ss,X,.56,0,R,40); tor(.43,.018,k.black,X,.71,0,R).rotation.x=PI/2;
  /* product bowl on trolley */
  cyl(.5,.42,.36,k.ss,X,.9,0,R,40); tor(.51,.02,k.black,X,1.09,0,R).rotation.x=PI/2;
  var tr=new T.Group(); tr.position.set(X,0,0); R.add(tr); [[-.55,.0],[.55,0]].forEach(function(p){ rod([p[0],.85,-.3],[p[0],.12,-.42],.018,k.ss2,tr); rod([p[0],.85,.3],[p[0],.12,.42],.018,k.ss2,tr); cylZ(.05,.04,k.black,p[0],.06,-.42,tr,16); cylZ(.05,.04,k.black,p[0],.06,.42,tr,16); });
  rod([-.55,.85,.3],[-.55,.85,.62],.016,k.ss2,tr); rod([.55,.85,.3],[.55,.85,.62],.016,k.ss2,tr); rod([-.55,.85,.62],[.55,.85,.62],.016,k.ss2,tr);
  /* expansion chamber with sight glass (fluidised granules) */
  cyl(.52,.5,.9,k.ss,X,1.55,0,R,40); tor(.53,.02,k.black,X,2.0,0,R).rotation.x=PI/2;
  var gs=screen(128,128,function(g,t,w,h){ g.fillStyle='#e9dcc3'; g.fillRect(0,0,w,h); for(var i=0;i<90;i++){ var a=i*2.39996, u=(t*.6+i*.137)%1; var xx=w/2+Math.cos(a*3+t)*w*.4*((i%7)/7), yy=h*(1-u)+Math.sin(t*3+i)*6; g.fillStyle=i%3?'#f7f1e4':'#cbb894'; g.beginPath(); g.arc(xx,yy,3+(i%3),0,PI*2); g.fill(); } },12);
  var sgg=new T.Group(); sgg.position.set(X+.36,1.45,.38); sgg.rotation.y=Math.atan2(.36,.38); R.add(sgg); cylZ(.12,.04,k.ss2,0,0,0,sgg,28); var gl=new T.Mesh(new T.CircleGeometry(.1,28),screenMat(gs)); gl.position.z=.021; sgg.add(gl); for(var i=0;i<8;i++){ var a=i*PI/4; cylZ(.008,.03,k.ss2,Math.cos(a)*.11,Math.sin(a)*.11,.02,sgg,6); }
  /* filter housing + shaker cylinders */
  cyl(.54,.54,.42,k.ss,X,2.21,0,R,40); var dm=sph(.54,k.ss,X,2.42,0,R,40,16); dm.scale.y=.28; [-.18,.18].forEach(function(dx){ cyl(.05,.05,.22,M(0xd9dee3,{metalness:.6,roughness:.3}),X+dx,2.68,0,R,18); cyl(.02,.02,.08,k.ss2,X+dx,2.82,0,R,10); });
  /* exhaust duct to blower */
  pipe([[X+.5,2.2,0],[1.0,2.2,0],[1.0,.5,0],[1.0,.5,-.55]],.12,k.ss,R); var bl=new T.Group(); bl.position.set(1.0,.42,-.75); R.add(bl); cylZ(.3,.22,k.gry,0,0,0,bl,32); box(.24,.3,.22,k.gry,.22,.2,0,bl); kMotor(bl,0,0,-.35,.8,null,PI/2);
  pipe([[1.22,.62,-.75],[1.22,1.3,-.75]],.08,k.gry,R);
  /* AHU with filters, steam coil, damper -> plenum */
  var A=new T.Group(); A.position.set(-1.45,0,0); R.add(A); rbox(.7,.9,.62,.02,PAINT(0xe4e8ec,.4),0,.62,0,A); [-.18,.0,.18].forEach(function(dx,i){ var f=box(.16,.6,.01,i===1?PAINT(0x9a3b2a,.45):M(0xf2efe2,{roughness:.9}),dx,.62,.312,A); });
  for(i=0;i<7;i++) box(.13,.008,.012,M(0xb7b19a),-.18,.38+i*.08,.318,A); for(i=0;i<10;i++) box(.004,.56,.012,METAL(0xc58a4a,.3),-.05+i*.013,.62,.318,A);
  box(.5,.06,.6,k.ss2,0,.14,0,A); pipe([[.35,.62,0],[.75,.62,0],[.75,.56,0]],.13,k.ss,A);
  var dmp=new T.Group(); dmp.position.set(.55,.62,0); A.add(dmp); box(.1,.3,.3,k.ss2,0,0,0,dmp); rbox(.1,.08,.08,.01,k.act,0,.2,.12,dmp);
  pipe([[-.05,.62,-.31],[-.05,1.15,-.31],[-.6,1.15,-.31]],.03,k.steam,A); kCV(A,'TCV-201',.025,-.35,1.15,-.31);
  /* instruments */
  var t1=kTT(R,'TT-201',60.0,-.85,.78,0,0); t1.group.rotation.z=0; up.push(t1.update);
  var t2=kTT(R,'TT-202',42.0,X+.45,1.0,.12,0); up.push(t2.update); var t3=kTT(R,'TT-203',38.0,.55,2.34,0); up.push(t3.update);
  var dp=kPT(R,'PDT-201','mbar',12.5,X-.62,1.9,.25); up.push(dp.update); pipe([[X-.62,2.0,.25],[X-.5,2.1,.15]],.004,k.ss2,R); pipe([[X-.6,1.95,.27],[X-.5,1.7,.15]],.004,k.ss2,R);
  var CAMF=[2.8,2.5,3.6]; var op=kOpPanel(R,1.15,.75,faceTo(1.15,.75,CAMF),drawEBR(),'TRIONIX · FBD PANEL'); up.push(op.update); up.push(function(t){ gs.update(t); });
  var sig=[kSig(R,[-.85,.9,0],[1.15,.3,.75],0x13A89E,{via:[[-.85,.95,.3]]}),kSig(R,[-1.8,1.25,-.31],[1.1,.3,.75],0xF2A541,{via:[[-1.8,1.3,-.65]]}),kSig(R,[X-.62,2.05,.25],[1.2,.3,.75],0x7a5cff)];
  var labs=[indLabel(R,'TT-201 · inlet air',[-.85,1.15,.2]),indLabel(R,'TCV-201 · steam coil',[-1.8,1.62,-.3],'#E8891E'),indLabel(R,'PDT-201 · filter bag ΔP',[X-.75,2.35,.35],'#7a5cff'),indLabel(R,'Trionix HMI · batch record',[1.15,1.48,.75],'#F2A541'),indLabel(R,'Fluid bed dryer · product bowl',[X-.95,2.55,.3],'#0B2545'),indLabel(R,'Sight glass · fluidised bed',[X+.6,1.75,.6],'#0B2545')];
  var flows=[kFlow(R,[[-1.1,.62,0],[-.6,.62,0],[X,.5,0],[X,2.2,0],[1.0,2.2,0],[1.0,.5,0]],0x2f8ce0,8,.18)];
  return indFrame(st,R,{cam:CAMF,look:[-.25,1.25,0],op:op,shadow:2.8,
    update:indRun(R,{st:st,up:up,sig:sig,flows:flows,labs:labs,loopLabs:4})});
};

/* ---------- 3. PACKAGING: tray sealing line + checkweigher + reject ---------- */
IND.packaging=function(st){
  var R=new T.Group(); st.scene.add(R); softFloor(R,3.4,{cells:16,shadow:.22}); var k=km(), up=[]; var BY=.78;
  /* conveyor */
  var bt=cnv(64,64),bx=bt.getContext('2d'); bx.fillStyle='#23272c'; bx.fillRect(0,0,64,64); bx.fillStyle='#2f343a'; for(var i=0;i<8;i++) bx.fillRect(i*8,0,3,64); var btx=new T.CanvasTexture(bt); btx.wrapS=btx.wrapT=T.RepeatWrapping; btx.repeat.set(14,1);
  box(3.2,.03,.36,M(0xffffff,{map:btx,roughness:.8}),0,BY,0,R); [-1,1].forEach(function(s){ box(3.24,.08,.03,k.ss2,0,BY-.02,s*.2,R); box(3.24,.02,.015,k.ss,0,BY+.07,s*.17,R); });
  for(var x=-1.5;x<=1.5;x+=.5){ [-.17,.17].forEach(function(z){ box(.04,BY-.03,.04,k.ss2,x,(BY-.03)/2,z,R); }); }
  cylZ(.045,.4,k.ss2,-1.62,BY-.01,0,R,18); cylZ(.045,.4,k.ss2,1.62,BY-.01,0,R,18); kMotor(R,1.62,BY-.18,-.32,.45,null,PI/2);
  /* sealing station: gantry, film roll, heated head on servo */
  var sx=-.55; [[-.28,-.32],[.28,-.32],[-.28,.32],[.28,.32]].forEach(function(p){ box(.05,.9,.05,k.ss2,sx+p[0],BY+.45,p[1],R); }); rbox(.66,.08,.74,.01,k.ss2,sx,BY+.92,0,R);
  rbox(.3,.22,.22,.02,M(0x2a2e34),sx,BY+1.08,0,R); cyl(.06,.06,.2,M(0x1d2025),sx,BY+1.3,0,R,24); cyl(.065,.065,.04,k.org,sx,BY+1.42,0,R,24);
  var head=new T.Group(); head.position.set(sx,BY+.5,0); R.add(head); rbox(.36,.08,.32,.01,PAINT(0xc8312e,.4),0,0,0,head); box(.32,.025,.28,METAL(0x9aa1a8,.3),0,-.05,0,head); cyl(.02,.02,.4,METAL(0xe5e8eb,.2),0,.24,0,head,10);
  for(i=0;i<3;i++){ cylX(.008,.4,M(0x111),0,.02,-.08+i*.08,head,8); } pipe([[.18,.0,.1],[.28,.1,.1],[.28,.3,.2]],.006,M(0x111),head);
  var roll=new T.Group(); roll.position.set(sx-.55,BY+.62,0); R.add(roll); cylZ(.12,.34,M(0xe7eef3,{roughness:.25,metalness:.1}),0,0,0,roll,28); cylZ(.03,.4,k.ss2,0,0,0,roll,12); box(.03,.6,.03,k.ss2,0,-.3,-.2,roll).position.set(0,-.3,-.2); box(.03,.6,.03,k.ss2,0,-.3,.2,roll).position.set(0,-.3,.2);
  var film=new T.Mesh(new T.PlaneGeometry(.5,.3),new T.MeshStandardMaterial({color:0xe9f2f7,transparent:true,opacity:.55,roughness:.15,side:T.DoubleSide,depthWrite:false})); film.rotation.x=-PI/2; film.rotation.z=-.5; film.position.set(sx-.33,BY+.36,0); R.add(film);
  /* photo eye */
  var pe=new T.Group(); pe.position.set(-1.05,BY+.1,.2); R.add(pe); rbox(.04,.05,.03,.005,k.yel,0,0,0,pe); var beamM=BM(0xff3b2f,{transparent:true,opacity:.6,toneMapped:false}); var pb=box(.004,.004,.4,beamM,0,0,-.2,pe);
  rbox(.04,.05,.03,.005,k.yel,-1.05,BY+.1,-.2,R);
  /* checkweigher section + display */
  var cw=new T.Group(); cw.position.set(.45,0,0); R.add(cw); rbox(.42,.06,.42,.01,k.ss2,0,BY-.06,0,cw); rbox(.12,.5,.12,.01,k.ss2,0,.35,0,cw);
  var ws=screen(160,96,function(g,t,w,h){ g.fillStyle='#0d1a14'; g.fillRect(0,0,w,h); var low=(Math.floor(t/1.2)%7)===3; g.fillStyle=low?'#ff5a4a':'#7dff9a'; g.font='700 30px '+MONO; g.fillText((low?246.1:251.8+Math.sin(t)*.6).toFixed(1)+' g',8,46); g.font='600 14px '+MONO; g.fillStyle='#bfe9df'; g.fillText(low?'REJECT':'OK  250.0 ±2 g',8,78); },6);
  var wsg=new T.Group(); wsg.position.set(.45,1.25,.32); R.add(wsg); box(.04,.5,.04,k.ss2,0,-.25,0,wsg); rbox(.3,.2,.06,.01,M(0x2a2e34),0,0,0,wsg); var wp=new T.Mesh(new T.PlaneGeometry(.26,.156),screenMat(ws)); wp.position.z=.031; wsg.add(wp);
  /* reject pusher + bin */
  var rp=new T.Group(); rp.position.set(.95,BY+.08,.38); R.add(rp); cylZ(.035,.3,M(0xd9dee3,{metalness:.6,roughness:.3}),0,0,0,rp,16); var rod1=new T.Group(); rp.add(rod1); cylZ(.012,.25,METAL(0xe5e8eb,.2),0,0,-.2,rod1,10); rbox(.12,.08,.02,.005,k.ss2,0,0,-.33,rod1);
  rbox(.36,.3,.26,.02,PAINT(0xc8312e,.45),.95,.15,-.62,R); box(.3,.02,.35,k.ss2,.95,BY-.14,-.42,R).rotation.x=-.5;
  /* trays */
  var trays=[],P=3.0,N=6; for(i=0;i<N;i++){ var tg=new T.Group(); R.add(tg); rbox(.2,.05,.15,.015,M(0x1d2025,{roughness:.4}),0,.025,0,tg); var fd=new T.Mesh(new T.BoxGeometry(.17,.035,.12),M(i%2?0xd9862b:0x8bbf4a,{roughness:.6})); fd.position.y=.04; tg.add(fd);
    var lid=new T.Mesh(new T.PlaneGeometry(.2,.15),new T.MeshStandardMaterial({color:0xe9f2f7,transparent:true,opacity:.6,roughness:.15,depthWrite:false})); lid.rotation.x=-PI/2; lid.position.y=.052; tg.add(lid); trays.push({g:tg,lid:lid,o:i/N}); }
  var CAMF=[1.9,2.4,3.6]; var op=kOpPanel(R,-.05,-1.0,faceTo(-.05,-1.0,CAMF),drawOEE(),'TRIONIX · SEALER PANEL'); up.push(op.update); up.push(function(t){ ws.update(t); });
  var sig=[kSig(R,[sx+.2,BY+.62,-.12],[-.05,.3,-1.0],0xF2A541,{via:[[sx+.2,BY+.66,-.48]]}),kSig(R,[-1.05,BY+.1,-.22],[-.1,.3,-1.0],0x13A89E),kSig(R,[.45,.5,-.07],[0,.3,-1.0],0x7a5cff)];
  var labs=[indLabel(R,'Heated seal head · TIC-301',[sx-.5,BY+1.2,.3],'#E8891E'),indLabel(R,'Servo press',[sx+.35,BY+1.3,0],'#0B2545'),indLabel(R,'Checkweigher',[.45,1.62,.32],'#7a5cff'),indLabel(R,'Trionix HMI · live OEE',[-.05,1.5,-1.0],'#F2A541'),indLabel(R,'Reject pusher',[.95,1.12,.45],'#c8312e'),indLabel(R,'Photo-eye registration',[-1.05,1.15,.25])];
  var sx2=sx, TC=1.6, SPC=.5;
  var extra=function(dt,t,v){ var n=Math.floor(t/TC), c=(t%TC)/TC, m=c<.22?(function(u){return u*u*(3-2*u);})(c/.22):1; btx.offset.x=-(n+m)*SPC/3.2*14;
    var hy=c<.25?.5:(c<.35?.5-(c-.25)/.1*.39:(c<.6?.11:(c<.7?.11+(c-.6)/.1*.39:.5))); head.position.y=BY+hy; var push=false;
    trays.forEach(function(tr,i){ var raw=i*SPC+(n+m)*SPC, lap=Math.floor(raw/P), x2=-1.55+(raw%P); tr.g.position.set(x2,BY+.015,0); tr.g.visible=true;
      tr.lid.visible=x2>sx2+.05||(Math.abs(x2-sx2)<.05&&c>.5); var rej=((lap*3+i)%7)===2;
      if(rej&&Math.abs(x2-.95)<.03&&m>=1){ var u2=Math.max(0,Math.min(1,(c-.3)/.25)); tr.g.position.z=-u2*.42; tr.g.position.y=BY+.015-Math.max(0,u2-.5)*.3; push=push||(c>.3&&c<.6); } else if(rej&&x2>1.0) tr.g.visible=false;
      if(x2>1.5) tr.g.visible=false; });
    rod1.position.z=push?-.16:0; beamM.opacity=.3+.4*Math.abs(Math.sin(t*6)); };
  return indFrame(st,R,{cam:CAMF,look:[-.15,.85,0],op:op,shadow:2.6,
    update:indRun(R,{st:st,up:up,sig:sig,labs:labs,loopLabs:4,extra:extra})});
};

/* ---------- 4. DISTILLERY: distillation column with trays ---------- */
IND.distillery=function(st){
  var R=new T.Group(); st.scene.add(R); softFloor(R,3.4,{cells:16,shadow:.22}); var k=km(), up=[]; var CX=-.55, CR=.27, Y0=.32, H=2.75;
  cyl(.3,.32,Y0,k.navy,CX,Y0/2,0,R,32);
  var back=new T.Mesh(new T.CylinderGeometry(CR,CR,H,40,1,true,PI/2,PI),new T.MeshStandardMaterial({color:0xd5dbe1,metalness:.75,roughness:.3,side:T.DoubleSide})); back.position.set(CX,Y0+H/2,0); R.add(back);
  var glassM=new T.MeshPhysicalMaterial({color:0xdbe8f0,transparent:true,opacity:.16,roughness:.05,metalness:.1,clearcoat:1,depthWrite:false,side:T.DoubleSide});
  var front=new T.Mesh(new T.CylinderGeometry(CR,CR,H,40,1,true,-PI/2,PI),glassM); front.position.copy(back.position); front.__noShadow=true; R.add(front);
  [-PI/2,PI/2].forEach(function(a){ box(.012,H,.012,k.ss2,CX+Math.sin(a)*CR,Y0+H/2,Math.cos(a)*CR,R); });
  var dt=sph(CR,k.ss,CX,Y0+H,0,R,32,12); dt.scale.y=.4; var db=sph(CR,k.ss,CX,Y0,0,R,32,12); db.scale.y=.3;
  var liq=new T.MeshStandardMaterial({color:0xe8a43a,transparent:true,opacity:.75,roughness:.2,emissive:new T.Color(0x6a3a05),emissiveIntensity:.3});
  for(var i=0;i<8;i++){ var y=Y0+.25+i*.3, s=i%2?1:-1; var tray=new T.Mesh(new T.CylinderGeometry(CR*.97,CR*.97,.012,36),k.ss2); tray.position.set(CX,y,0); R.add(tray);
    box(.012,.22,CR*1.2,k.ss2,CX+s*CR*.55,y-.1,0,R); var l=new T.Mesh(new T.CylinderGeometry(CR*.95,CR*.95,.03,36),liq); l.position.set(CX,y+.022,0); R.add(l);
    for(var j=0;j<6;j++){ var a=j/6*PI*2; cyl(.025,.025,.03,k.ss2,CX-s*.06+Math.cos(a)*.11,y+.03,Math.sin(a)*.11,R,10); } }
  var bub=[]; for(i=0;i<40;i++){ var b=new T.Sprite(pulseMat(i%2?0xffffff:0xffd28a)); b.scale.setScalar(.035); R.add(b); bub.push({s:b,o:Math.random(),a:Math.random()*PI*2,r:Math.random()*.2}); }
  /* nozzles, manholes, ladder */
  [.9,1.9].forEach(function(y){ cylZ(.08,.12,k.ss,CX-.12,y,-.28,R,20); cylZ(.1,.02,k.ss2,CX-.12,y,-.34,R,24); });
  /* reboiler */
  var rb=new T.Group(); rb.position.set(.15,.45,.15); R.add(rb); cylX(.17,.85,k.ss,0,0,0,rb,32); [-.45,.45].forEach(function(x){ cylX(.2,.04,k.ss2,x,0,0,rb,32); }); var ch=sph(.17,k.ss,.47,0,0,rb,24,12); ch.scale.x=.5; [[-.3,-.15],[.25,-.15]].forEach(function(p){ box(.08,.3,.3,k.navy,p[0],-.3,0,rb); });
  pipe([[.6,.45,.15],[.9,.45,.15],[.9,1.0,.15],[1.25,1.0,.15]],.035,k.steam,R); kCV(R,'FCV-402',.03,1.05,1.0,.15); pipe([[-.25,.55,.15],[CX+.2,.55,.1]],.06,k.ss,R); pipe([[-.25,.3,.15],[-.25,.18,.15],[CX+.3,.18,.0]],.04,k.ss,R);
  /* overhead -> condenser -> reflux drum -> pump -> reflux */
  pipe([[CX,Y0+H+.1,0],[CX,Y0+H+.28,0],[.55,Y0+H+.28,0],[.55,2.75,0]],.06,k.ss,R);
  var cd=new T.Group(); cd.position.set(.55,2.55,0); R.add(cd); cylX(.14,.8,k.ss,0,0,0,cd,28); [-.42,.42].forEach(function(x){ cylX(.17,.04,k.ss2,x,0,0,cd,28); }); [[-.25,.18],[.25,-.18]].forEach(function(p){ cyl(.035,.035,.2,k.water,p[0],p[1]>0?.2:-.2,0,cd,14); }); [-.3,.3].forEach(function(x){ box(.04,2.55,.04,k.navy,.55+x,1.27,-.18,R); });
  pipe([[.95,2.5,0],[.95,1.62,0]],.035,k.ss,R);
  var rd=new T.Group(); rd.position.set(.95,1.45,0); R.add(rd); cylX(.16,.6,k.ss,0,0,0,rd,28); [-.3,.3].forEach(function(x){ var e=sph(.16,k.ss,x,0,0,rd,20,12); e.scale.x=.4; box(.04,1.3,.04,k.navy,x,-.75,0,rd); });
  var lt=kLT(rd,'LT-401',55,.12,.16,0); up.push(lt.update);
  var pu=kPump(R,1.1,.7,PI/2,.7); pipe([[.95,1.29,0],[.95,.3,.0],[1.1,.3,.45]],.025,k.ss,R);
  pipe([[1.1,.38,.98],[1.1,.38,1.15],[-.1,.38,1.15],[-.1,2.6,1.15],[CX,2.6,.25],[CX,2.6,.24]],.025,k.ss,R); var fm=kMag(R,'FT-402',.022,.45,.38,1.15,0); up.push(fm.update); kCV(R,'FCV-401',.022,.15,.38,1.15);
  /* instruments */
  var t1=kTT(R,'TT-401',78.4,CX+.2,Y0+H+.02,-.12); up.push(t1.update); var t2=kTT(R,'TT-402',98.0,CX-.33,.8,.05); t2.group.rotation.z=PI/2; t2.group.position.set(CX-.36,.8,0); up.push(t2.update);
  var pt=kPT(R,'PT-401','bar',.12,CX-.18,Y0+H+.05,.1); up.push(pt.update);
  var CAMF=[2.6,2.6,3.9]; var op=kOpPanel(R,1.0,1.75,faceTo(1.0,1.75,CAMF),drawTrayProfile(),'TRIONIX · DISTILLATION'); up.push(op.update);
  var sig=[kSig(R,[CX+.2,Y0+H+.15,-.12],[1.0,.3,1.75],0x13A89E,{via:[[CX+.5,Y0+H+.2,-.12]]}),kSig(R,[.45,.5,1.15],[.95,.3,1.75],0x7a5cff),kSig(R,[1.05,1.15,.2],[1.05,.3,1.75],0xF2A541)];
  var labs=[indLabel(R,'TT-401 · column top',[CX+.75,3.05,0]),indLabel(R,'FCV-401 · reflux',[.15,.85,1.2],'#7a5cff'),indLabel(R,'FCV-402 · steam to reboiler',[1.05,1.45,.2],'#E8891E'),indLabel(R,'Trionix HMI · tray profile',[1.0,1.48,1.75],'#F2A541'),indLabel(R,'Tray column · cut-away',[CX-.2,2.25,.4],'#0B2545'),indLabel(R,'Condenser',[.55,2.95,0],'#2f8ce0'),indLabel(R,'Reflux drum · LT-401',[.95,1.88,.2],'#0B2545')];
  var flows=[kFlow(R,[[CX,Y0+H+.12,0],[CX,Y0+H+.28,0],[.55,Y0+H+.28,0],[.55,2.7,0]],0xffd28a,4,.3),kFlow(R,[[1.1,.38,1.15],[-.1,.38,1.15],[-.1,2.6,1.15],[CX,2.6,.25]],0xe8a43a,6,.22)];
  var extra=function(dt,t){ bub.forEach(function(b){ var u=(b.o+t*.18)%1; b.s.position.set(CX+Math.cos(b.a+t)*b.r,Y0+.15+u*(H-.3),Math.sin(b.a+t)*b.r*.6+.08); }); };
  return indFrame(st,R,{cam:CAMF,look:[.05,1.55,.2],op:op,shadow:3,
    update:indRun(R,{st:st,up:up,sig:sig,flows:flows,labs:labs,loopLabs:4,spin:[[pu.spin,14,'x']],extra:extra})});
};

/* ---------- 5. BOILER HOUSE: package boiler automation ---------- */
IND.boiler=function(st){
  var R=new T.Group(); st.scene.add(R); softFloor(R,3.6,{cells:16,shadow:.22}); var k=km(), up=[];
  var SY=.85, SR=.55, L=2.0;
  var clad=new T.MeshStandardMaterial({color:0xd7dde3,metalness:.75,roughness:.3}); cylX(SR,L,clad,0,SY,0,R,48); for(var x=-.8;x<=.8;x+=.4) tor(SR+.004,.006,k.ss2,x,SY,0,R).rotation.y=PI/2;
  [-.65,.65].forEach(function(x){ box(.12,.32,.9,k.navy,x,.16,0,R); });
  /* front: smoke box doors + burner */
  cylX(SR+.02,.12,k.navy,L/2+.06,SY,0,R,48); var dr=cylX(SR*.85,.04,k.navy,L/2+.14,SY,0,R,40); [[.35,.25],[-.35,.25],[.35,-.25],[-.35,-.25]].forEach(function(p){ cylX(.02,.06,k.ss2,L/2+.17,SY+p[1]*SR*1.1,p[0]*SR*1.1,R,8); });
  var bu=new T.Group(); bu.position.set(L/2+.3,SY-.05,0); R.add(bu); rbox(.32,.36,.4,.03,PAINT(0xc8312e,.4),.05,0,0,bu); cylX(.14,.12,PAINT(0xc8312e,.4),-.12,0,0,bu,24); kMotor(bu,.12,.28,0,.5,PAINT(0xc8312e,.4),PI/2);
  var bs=new T.Group(); bs.position.set(.26,0,0); bu.add(bs); cylX(.12,.04,M(0x22262a),0,0,0,bs,20); rbox(.14,.1,.08,.01,M(0xe7eaee),.08,-.1,.21,bu);
  pipe([[L/2+.35,.15,-.4],[L/2+.35,.15,-.6],[L/2+.35,SY-.2,-.6],[L/2+.35,SY-.2,-.2]],.02,k.yel,R); kBV(R,'XV-503',.02,L/2+.35,.42,-.6,PI/2); kBV(R,'XV-504',.02,L/2+.35,.62,-.6,PI/2);
  /* top mountings */
  var sv=function(x,z){ var g=new T.Group(); g.position.set(x,SY+SR,z); R.add(g); cyl(.05,.06,.08,k.ss2,0,.04,0,g,14); cyl(.04,.04,.18,PAINT(0xc8312e,.4),0,.17,0,g,14); cyl(.025,.03,.08,k.ss2,0,.3,0,g,10); rod([0,.33,0],[.14,.31,0],.008,k.ss2,g); pipe([[.07,.1,0],[.16,.1,0],[.16,.5,0]],.025,k.ss2,g); };
  sv(-.55,.12); sv(-.3,-.12); var msv=kHV(R,.05,.15,SY+SR+.08,0,PI/2); cyl(.05,.05,.08,k.ss2,.15,SY+SR+.03,0,R,14);
  pipe([[.15,SY+SR+.08,-.06],[.15,SY+SR+.08,-.9],[.15,2.2,-.9],[-1.5,2.2,-.9]],.045,k.ins,R);
  var ft=kMag(R,'FT-501',.04,-.6,2.2,-.9,0,'t/h',2.05); up.push(ft.update);
  var pt=kPT(R,'PT-501','kg/cm²',10.3,.45,SY+SR,.0); up.push(pt.update); kGauge(R,.62,SY+SR+.2,.08,0,'kg/cm²');
  /* level column: gauge glass + electrodes + LT */
  var lc=new T.Group(); lc.position.set(.55,SY,SR+.18); R.add(lc); cyl(.05,.05,.7,k.ss2,0,0,0,lc,18); rod([0,.3,0],[0,.3,-.2],.02,k.ss2,lc); rod([0,-.3,0],[0,-.3,-.2],.02,k.ss2,lc);
  rbox(.05,.4,.04,.01,k.ss2,.09,0,.0,lc); var lvl=box(.026,.2,.045,GLOW(0x13A89E,.9),.09,-.05,.0,lc); for(var e=0;e<3;e++){ cyl(.012,.012,.08,k.ss2,-.02+e*.02,.39,0,lc,8); cyl(.016,.016,.03,k.black,-.02+e*.02,.44,0,lc,10); }
  var lt=kPT(R,'LT-501','%',52.0,.85,.3,SR+.2); up.push(lt.update); pipe([[.55,SY+.3,SR+.2],[.78,SY+.3,SR+.2],[.85,.46,SR+.2]],.006,k.ss2,R);
  /* chimney + O2 */
  pipe([[-L/2-.05,SY+.2,0],[-L/2-.35,SY+.2,0],[-L/2-.35,3.2,0]],.16,k.gry,R); tor(.17,.02,k.ss2,-L/2-.35,2.4,0,R).rotation.x=PI/2;
  var at=new T.Group(); at.position.set(-L/2-.35,1.75,.18); R.add(at); cylZ(.025,.12,k.ss2,0,0,0,at,10); rbox(.12,.12,.08,.01,k.org,0,0,.12,at); var o2=screen(96,48,function(g,t,w,h){ g.fillStyle='#0d1a14'; g.fillRect(0,0,w,h); g.fillStyle='#7dff9a'; g.font='700 22px '+MONO; g.fillText('O₂ '+(4.2+Math.sin(t*.6)*.2).toFixed(1)+'%',6,32); },4); var o2p=new T.Mesh(new T.PlaneGeometry(.09,.045),screenMat(o2)); o2p.position.set(0,0,.161); at.add(o2p); var tp=tagPlate('AT-501'); tp.position.set(0,-.08,.161); at.add(tp); up.push(function(t){ o2.update(t); });
  /* feed water tank + pumps + FCV */
  var ftk=new T.Group(); ftk.position.set(-.5,1.25,-1.35); R.add(ftk); cylX(.32,1.3,PAINT(0xe4e8ec,.35),0,0,0,ftk,32); [-.65,.65].forEach(function(x){ var en=sph(.32,PAINT(0xe4e8ec,.35),x,0,0,ftk,24,12); en.scale.x=.35; box(.06,1.0,.06,k.navy,x*.8,-.6,0,ftk); });
  var p1=kPump(R,-.9,-.65,0,.6), p2=kPump(R,-.2,-.65,0,.6); pipe([[-.5,.93,-1.35],[-.5,.4,-1.35],[-.9,.4,-1.35],[-.9,.3,-.95]],.025,k.water,R);
  pipe([[-.02,.33,-.65],[.4,.33,-.65],[.4,.33,.0],[.4,SY-.25,.35]],.025,k.water,R); kCV(R,'FCV-501',.022,.4,.33,-.35,PI/2); var ff=kMag(R,'FT-502',.022,.4,.33,-.15,PI/2,'t/h',2.0); up.push(ff.update);
  var CAMF=[3.1,2.3,3.4]; var op=kOpPanel(R,1.65,1.0,faceTo(1.65,1.0,CAMF),drawCombustion(),'TRIONIX · BOILER PANEL'); up.push(op.update);
  var sig=[kSig(R,[.45,SY+SR+.25,0],[1.65,.3,1.0],0x13A89E,{via:[[.45,SY+SR+.3,.95]]}),kSig(R,[.85,.4,SR+.2],[1.6,.3,1.0],0x2f8ce0),kSig(R,[.4,.5,-.35],[1.62,.3,1.0],0xF2A541),kSig(R,[-1.35,1.75,.25],[1.7,.3,1.0],0xE8891E)];
  var labs=[indLabel(R,'PT-501 · steam pressure',[.45,2.05,.1]),indLabel(R,'LT-501 · 3-element drum level',[.85,1.0,.85],'#2f8ce0'),indLabel(R,'FCV-501 · feed water',[.4,.85,-.45],'#F2A541'),indLabel(R,'AT-501 · O₂ trim',[-1.35,2.15,.3],'#E8891E'),indLabel(R,'Trionix HMI · O₂ trim',[1.65,1.48,1.0],'#F2A541'),indLabel(R,'FT-501 · steam flow',[-.6,2.55,-.9],'#0B2545'),indLabel(R,'Burner · modulating',[L/2+.4,1.35,0],'#c8312e')];
  var flows=[kFlow(R,[[.15,SY+SR+.12,-.06],[.15,SY+SR+.12,-.9],[.15,2.25,-.9],[-1.5,2.25,-.9]],0x8fc7f2,6,.25),kFlow(R,[[-.02,.37,-.65],[.4,.37,-.65],[.4,.37,.0],[.4,SY-.22,.35]],0x2f8ce0,5,.3)];
  var vap=kSteam(R,8,-L/2-.35,3.2,0,.2);
  var extra=function(dt,t){ lvl.scale.y=.9+.1*Math.sin(t*.8); vap(t,.4); };
  return indFrame(st,R,{cam:CAMF,look:[.1,.95,-.1],op:op,shadow:3,
    update:indRun(R,{st:st,up:up,sig:sig,flows:flows,labs:labs,loopLabs:5,spin:[[bs,10,'x'],[p1.spin,14,'x'],[p2.spin,14,'x']],extra:extra})});
};

/* ---------- 6. TEXTILE: HTHP jet dyeing machine ---------- */
IND.textile=function(st){
  var R=new T.Group(); st.scene.add(R); softFloor(R,3.6,{cells:16,shadow:.22}); var k=km(), up=[]; var VY=1.0, VR=.45, VL=1.9;
  cylX(VR,VL,k.ss,0,VY,0,R,44); [-1,1].forEach(function(s){ var e=sph(VR,k.ss,s*VL/2,VY,0,R,32,16); e.scale.x=.3; }); [-.7,0,.7].forEach(function(x){ box(.1,VY-.2,.6,k.ss2,x,(VY-.2)/2,0,R); });
  /* loading door with window + fabric */
  var door=new T.Group(); door.position.set(VL/2+.14,VY+.05,0); R.add(door); cylX(.3,.05,k.ss2,0,0,0,door,32); tor(.3,.025,k.ss2,0,0,0,door).rotation.y=PI/2; var win=new T.Mesh(new T.CircleGeometry(.22,32),new T.MeshPhysicalMaterial({color:0xcfe3ea,transparent:true,opacity:.35,roughness:.05,clearcoat:1})); win.rotation.y=PI/2; win.position.x=.03; door.add(win);
  for(var i=0;i<8;i++){ var a=i*PI/4; cylX(.015,.05,k.ss2,.02,Math.sin(a)*.32,Math.cos(a)*.32,door,8); }
  var fc=cnv(64,64),fx=fc.getContext('2d'); fx.fillStyle='#b2203a'; fx.fillRect(0,0,64,64); for(i=0;i<16;i++){ fx.fillStyle=i%2?'#c8314d':'#9a1830'; fx.fillRect(0,i*4,64,2); } var ftx=new T.CanvasTexture(fc); ftx.wrapS=ftx.wrapT=T.RepeatWrapping; ftx.repeat.set(1,10); ftx.encoding=T.sRGBEncoding;
  var fab=new T.Mesh(new T.CircleGeometry(.215,32),new T.MeshStandardMaterial({map:ftx,roughness:.85})); fab.rotation.y=PI/2; fab.position.x=.005; door.add(fab);
  /* fabric transport tube over the top + winch reel */
  var tcurve=smooth([[VL/2-.2,VY+.35,0],[VL/2-.25,VY+.85,0],[0,VY+1.0,0],[-VL/2+.25,VY+.85,0],[-VL/2+.2,VY+.35,0]]); var tube=new T.Mesh(new T.TubeGeometry(tcurve,60,.11,20,false),k.ss); R.add(tube);
  var reel=new T.Group(); reel.position.set(VL/2-.2,VY+.75,0); R.add(reel); cylZ(.16,.3,k.ss2,0,0,0,reel,12); kMotor(R,VL/2-.2,VY+.75,.45,.45,null,PI/2); var nz=cyl(.12,.15,.2,k.ss2,-VL/2+.2,VY+.45,0,R,20);
  /* addition tank */
  var at=new T.Group(); at.position.set(.1,0,-1.0); R.add(at); kVessel(at,{r:.18,h:.32,legH:.9,top:'flat',legs:3}); var ash=kAgitator(at,1.27,.32,'pitch'); pipe([[.1,.85,-1.0],[.1,.7,-1.0],[.1,.7,-.4],[.1,.8,-.3]],.015,k.ss,R); kBV(R,'XV-602',.015,.1,.7,-.7,PI/2);
  /* circulation pump + heat exchanger + steam / cooling (split range) */
  var pu=kPump(R,-.2,.75,0,.85); pipe([[0,VY-VR,0],[0,.2,0],[.2,.2,.75]],.06,k.ss,R);
  var hx=new T.Group(); hx.position.set(-1.35,0,.55); R.add(hx); cyl(.15,.15,1.1,k.ss,0,.85,0,hx,28); [.3,1.4].forEach(function(y){ cyl(.19,.19,.04,k.ss2,0,y,0,hx,28); }); var ht=sph(.15,k.ss,0,1.42,0,hx,24,10); ht.scale.y=.4;
  pipe([[.06,.42,.75],[.06,.5,.75],[-1.35,.5,.75],[-1.35,.5,.6]],.05,k.ss,R); pipe([[-1.35,1.5,.55],[-1.35,1.75,.55],[-VL/2+.2,1.75,0],[-VL/2+.2,VY+.55,0]],.05,k.ss,R);
  pipe([[-1.5,1.2,.55],[-1.95,1.2,.55],[-1.95,1.2,.0]],.025,k.steam,R); kCV(R,'TCV-601A',.022,-1.75,1.2,.55);
  pipe([[-1.5,.7,.55],[-1.95,.7,.55],[-1.95,.7,1.1]],.025,k.water,R); kCV(R,'TCV-601B',.022,-1.75,.7,.55);
  /* instruments */
  var tt=kTT(R,'TT-601',98.0,-.75,1.75,.42); up.push(tt.update); var pt=kPT(R,'PT-601','bar',2.1,.45,VY+VR,0); up.push(pt.update); var lt=kPT(R,'LT-601','%',64,-.9,.35,.45); up.push(lt.update);
  var CAMF=[2.6,2.4,3.8]; var op=kOpPanel(R,1.55,1.05,faceTo(1.55,1.05,CAMF),drawProgramme(),'TRIONIX · JET DYEING'); up.push(op.update);
  var sig=[kSig(R,[-.75,1.88,.42],[1.55,.3,1.05],0x13A89E,{via:[[-.75,1.92,.75]]}),kSig(R,[-1.7,1.37,.6],[1.5,.3,1.05],0xE8891E),kSig(R,[-1.7,.87,.6],[1.5,.3,1.05],0x2f8ce0),kSig(R,[.45,VY+VR+.22,0],[1.6,.3,1.05],0x7a5cff,{via:[[.45,VY+VR+.26,.7]]})];
  var labs=[indLabel(R,'TT-601 · bath temperature',[-.75,2.15,.45]),indLabel(R,'TCV-601A · steam',[-1.75,1.62,.6],'#E8891E'),indLabel(R,'TCV-601B · cooling',[-1.75,.45,.75],'#2f8ce0'),indLabel(R,'Trionix HMI · dyeing programme',[1.55,1.48,1.05],'#F2A541'),indLabel(R,'Heat exchanger',[-1.35,1.85,.7],'#0B2545'),indLabel(R,'Fabric rope · winch reel',[VL/2,2.05,0],'#0B2545'),indLabel(R,'Main circulation pump',[-.2,.75,.95],'#0B2545')];
  var flows=[kFlow(R,[[.06,.5,.75],[-1.35,.5,.75],[-1.35,1.75,.55],[-VL/2+.2,1.75,0],[-VL/2+.2,VY+.55,0]],0xc8314d,7,.2)];
  var extra=function(dt,t){ ftx.offset.y=-t*.4; reel.rotation.z-=dt*1.5; };
  return indFrame(st,R,{cam:CAMF,look:[-.2,1.0,0],op:op,shadow:3,
    update:indRun(R,{st:st,up:up,sig:sig,flows:flows,labs:labs,loopLabs:4,spin:[[pu.spin,14,'x'],[ash,2,'y']],extra:extra})});
};

/* ---------- 7. DAIRY & BEVERAGES: HTST pasteuriser ---------- */
IND.dairy=function(st){
  var R=new T.Group(); st.scene.add(R); softFloor(R,3.4,{cells:16,shadow:.22}); var k=km(), up=[];
  /* plate heat exchanger */
  var PX=-.1; box(.1,1.1,.5,k.ss,PX-.4,.55,0,R); box(.08,1.0,.46,k.ss,PX+.4,.55,0,R); rod([PX-.45,1.08,0],[PX+.75,1.08,0],.025,k.ss2,R); rod([PX-.45,.12,0],[PX+.75,.12,0],.02,k.ss2,R); box(.05,1.1,.06,k.ss2,PX+.78,.55,0,R);
  var plates=[]; for(var i=0;i<34;i++){ plates.push([PX-.32+i*.021,.58,0]); } iboxes(plates,.009,.84,.42,METAL(0xd2d9df,.25),R); var gk=[]; for(i=0;i<34;i++) gk.push([PX-.32+i*.021+.0105,.58,0]); iboxes(gk,.004,.82,.4,M(i%2?0x1d2025:0x2f8a4a),R);
  [[.28,.18],[-.28,.18],[.28,.98],[-.28,.98]].forEach(function(p){ cylX(.035,.12,k.ss,PX-.5,p[1],p[0]*.6,R,14); }); [[-.18,.25],[.18,.25],[-.18,-.25],[.18,-.25]].forEach(function(p){ cylX(.016,1.3,k.ss2,PX+.18,.58+p[0]*2.3,p[1],R,8); });
  /* balance tank + feed pump + flow meter */
  var bt=new T.Group(); bt.position.set(-1.35,0,.2); R.add(bt); kVessel(bt,{r:.24,h:.45,legH:.55,bottom:'cone',top:'flat',legs:3}); var fl=sph(.06,M(0xf3f5f7),-1.35,1.0,.2,R,14,10);
  var pu=kPump(R,-1.0,.75,0,.6); pipe([[-1.35,.3,.2],[-1.35,.18,.75],[-.73,.18,.75]],.025,k.ss,R); pipe([[-.82,.3,.75],[-.82,.55,.75],[-.82,.55,.11],[PX-.56,.55,.11]],.025,k.ss,R); var fm=kMag(R,'FT-701',.022,-.82,.55,.45,PI/2); up.push(fm.update);
  /* holding tube (serpentine) + TT + FDV */
  var hold=[]; var hx0=.9; for(i=0;i<6;i++){ hold.push([hx0+i*.1,.35,-.15],[hx0+i*.1,1.15,-.15]); if(i<5) hold.push([hx0+i*.1+.05,1.15+(i%2?-.8:0),-.15]); }
  var hp=[[PX-.56,.98,.17],[PX-.62,1.3,.17],[hx0-.12,1.3,-.15],[hx0-.12,.35,-.15],[hx0,.35,-.15]]; pipe(hp,.022,k.ss,R);
  for(i=0;i<6;i++){ var xx=hx0+i*.1; rod([xx,.35,-.15],[xx,1.15,-.15],.022,k.ss,R); if(i<5){ var y2=(i%2)?.35:1.15; var u=new T.Mesh(new T.TorusGeometry(.05,.022,10,16,PI),k.ss); u.position.set(xx+.05,y2,-.15); if(i%2) u.rotation.z=PI; R.add(u); } }
  box(.65,.04,.08,k.ss2,hx0+.25,.25,-.15,R); [hx0-.05,hx0+.55].forEach(function(x){ box(.04,.25,.04,k.ss2,x,.12,-.15,R); });
  var tt=kTT(R,'TT-701',72.4,hx0+.5,.27,.08); up.push(tt.update);
  pipe([[hx0+.5,.35,-.15],[hx0+.5,.25,-.15],[hx0+.5,.25,.35],[1.6,.25,.35]],.022,k.ss,R); var fdv=kBV(R,'FDV-701',.025,1.25,.25,.35,0);
  pipe([[1.25,.25,.35],[1.25,.25,.65],[-1.0,.25,.65]],.018,k.ss,R);
  /* hot water set */
  var hw=new T.Group(); hw.position.set(.25,0,-1.05); R.add(hw); kVessel(hw,{r:.2,h:.45,legH:.35,top:'dish',legs:3}); pipe([[-.25,1.0,-1.05],[-.7,1.0,-1.05]],.02,k.steam,R); kCV(R,'TCV-702',.02,-.5,1.0,-1.05); pipe([[.25,.45,-.85],[.25,.45,-.2],[PX+.3,.45,-.2]],.02,PAINT(0xc8312e,.4),R);
  var CAMF=[2.4,2.2,3.6]; var op=kOpPanel(R,1.55,1.0,faceTo(1.55,1.0,CAMF),drawPastRecord(),'TRIONIX · PASTEURISER'); up.push(op.update);
  var sig=[kSig(R,[hx0+.5,.42,.08],[1.55,.3,1.0],0x13A89E),kSig(R,[-.45,1.15,-1.0],[1.5,.3,1.0],0xE8891E),kSig(R,[1.25,.4,.38],[1.55,.3,1.0],0xc8312e),kSig(R,[-.82,.62,.45],[1.5,.3,1.0],0x7a5cff)];
  var labs=[indLabel(R,'TT-701 · holding tube outlet',[hx0+.5,.72,.15]),indLabel(R,'TCV-702 · hot water',[-.5,1.45,-1.05],'#E8891E'),indLabel(R,'FDV-701 · flow diversion',[1.25,.62,.45],'#c8312e'),indLabel(R,'Trionix HMI · pasteurisation record',[1.55,1.48,1.0],'#F2A541'),indLabel(R,'Plate heat exchanger',[PX+.15,1.38,0],'#0B2545'),indLabel(R,'Balance tank',[-1.35,1.38,.2],'#0B2545'),indLabel(R,'FT-701 · flow',[-.82,.92,.45],'#7a5cff')];
  var flows=[kFlow(R,[[-.82,.58,.75],[-.82,.58,.11],[PX-.56,.58,.11]],0xf3f5f7,4,.3),kFlow(R,hp.map(function(p){ return [p[0],p[1]+.03,p[2]]; }),0xf3f5f7,5,.25)];
  return indFrame(st,R,{cam:CAMF,look:[0,.75,0],op:op,shadow:2.8,
    update:indRun(R,{st:st,up:up,sig:sig,flows:flows,labs:labs,loopLabs:4,spin:[[pu.spin,14,'x']]})});
};

/* ---------- 8. WATER & EFFLUENT: RO plant skid ---------- */
IND.water=function(st){
  var R=new T.Group(); st.scene.add(R); softFloor(R,3.6,{cells:16,shadow:.22}); var k=km(), up=[]; var frame=PAINT(0x1f5aa6,.4);
  /* pre-treatment filters */
  [[-1.6,-.7,'MGF'],[-1.05,-.7,'ACF']].forEach(function(f){ var g=new T.Group(); g.position.set(f[0],0,f[1]); R.add(g); cyl(.22,.22,1.0,k.frp,0,.65,0,g,32); var a=sph(.22,k.frp,0,1.15,0,g,28,12); a.scale.y=.5; var b=sph(.22,k.frp,0,.15,0,g,28,12); b.scale.y=.4; cyl(.24,.24,.12,k.black,0,.06,0,g,28);
    cyl(.05,.05,.12,k.ss2,0,1.31,0,g,14); rbox(.2,.12,.2,.02,M(0x30363e),0,1.42,0,g); cyl(.06,.06,.06,M(0xd9dee3),0,1.51,0,g,18); kGauge(g,.14,1.42,.1,0,'bar',.7); });
  pipe([[-1.6,1.42,-.6],[-1.6,1.6,-.6],[-1.05,1.6,-.6],[-1.05,1.42,-.6]],.02,PAINT(0x9aa1a8,.4),R);
  var cf=new T.Group(); cf.position.set(-.55,0,-.7); R.add(cf); cyl(.09,.09,.55,k.ss,0,.55,0,cf,24); cyl(.11,.11,.06,k.ss2,0,.85,0,cf,24); box(.05,.28,.05,k.ss2,0,.14,0,cf); kGauge(cf,.11,.95,.0,0,'bar',.6);
  /* HP pump: vertical multistage */
  var hp=new T.Group(); hp.position.set(-.55,0,.35); R.add(hp); rbox(.3,.05,.3,.01,k.ss2,0,.025,0,hp); cyl(.08,.08,.5,k.ss,0,.32,0,hp,24); for(var i=0;i<5;i++) tor(.082,.008,k.ss2,0,.12+i*.1,0,hp).rotation.x=PI/2; cyl(.1,.1,.08,k.ss2,0,.6,0,hp,24);
  cyl(.11,.11,.32,PAINT(0x1f5aa6,.4),0,.82,0,hp,28); cyl(.09,.09,.06,M(0x22262a),0,1.0,0,hp,24); var cpl=cyl(.05,.05,.06,k.org,0,.65,0,hp,16);
  /* RO block: 6 membrane pressure tubes */
  var RX=.55; [[-.8,-.45],[.8,-.45],[-.8,.45],[.8,.45]].forEach(function(p){ box(.06,1.55,.06,frame,RX+p[0],.78,p[1],R); }); [.25,1.55].forEach(function(y){ box(1.66,.06,.06,frame,RX,y,-.45,R); box(1.66,.06,.06,frame,RX,y,.45,R); box(.06,.06,.96,frame,RX-.8,y,0,R); box(.06,.06,.96,frame,RX+.8,y,0,R); });
  var tubes=[]; [.55,.85,1.15].forEach(function(y){ [-.18,.18].forEach(function(z){ cylX(.085,1.5,k.frpw,RX,y,z,R,28); [-1,1].forEach(function(s){ cylX(.092,.05,PAINT(0xdfe3e8,.35),RX+s*.77,y,z,R,28); cylX(.025,.08,k.ss2,RX+s*.84,y,z,R,12); }); tubes.push([y,z]); }); });
  [-1,1].forEach(function(s){ rod([RX+s*.88,.55,-.18],[RX+s*.88,1.15,-.18],.03,k.ss,R); rod([RX+s*.88,.55,.18],[RX+s*.88,1.15,.18],.03,k.ss,R); });
  pipe([[-.55,.6,.43],[-.55,.62,.6],[RX-.88,.62,.6],[RX-.88,.62,.18]],.03,k.ss,R);
  /* dosing tanks + pumps */
  [[-1.6,.55,0xF2A541,'ANTISCALANT'],[-1.6,.15,0xc8312e,'SMBS'],[-1.6,-.25,0x13A89E,'ACID']].forEach(function(d,j){ var g=new T.Group(); g.position.set(d[0]+.45,0,d[1]+.75); R.add(g); cyl(.13,.13,.42,M(0xf2f2ee,{roughness:.6}),0,.21,0,g,24); cyl(.135,.135,.03,PAINT(d[2],.4),0,.43,0,g,24);
    rbox(.12,.1,.09,.01,PAINT(d[2],.4),0,.5,0,g); cylZ(.025,.02,M(0xe7eaee),0,.52,.05,g,14); });
  /* instruments */
  var f1=kMag(R,'FT-801',.022,1.75,.4,.25,PI/2,'m³/h',10.2); up.push(f1.update); pipe([[RX+.88,1.15,.18],[1.75,1.15,.18],[1.75,.4,.18],[1.75,.4,.6]],.022,k.ss,R);
  var f2=kMag(R,'FT-802',.018,1.75,.4,-.45,PI/2,'m³/h',3.4); up.push(f2.update); pipe([[RX+.88,.55,-.18],[1.75,.55,-.18],[1.75,.4,-.25],[1.75,.4,-.75]],.018,k.ss,R);
  var pt=kPT(R,'PT-801','bar',12.6,RX-.88,1.2,.3); up.push(pt.update); var at=kHead(R,'AT-801','µS/cm',18.4,.4,k.teal); at.position.set(1.95,1.0,.05); at.rotation.y=-PI/2; up.push(function(t){ at.userData.lcd.update(t); }); rod([1.95,.95,.05],[1.75,.95,.15],.006,k.ss2,R);
  var vfd=buildVFD(); vfd.group.position.set(-.2,0,.95); R.add(vfd.group); up.push(vfd.update);
  var CAMF=[2.5,2.4,3.8]; var op=kOpPanel(R,.9,1.3,faceTo(.9,1.3,CAMF),drawMembrane(),'TRIONIX · RO PLANT'); up.push(op.update);
  var sig=[kSig(R,[RX-.88,1.4,.3],[.9,.3,1.3],0x13A89E),kSig(R,[-.2,.9,.95],[.85,.3,1.3],0xF2A541),kSig(R,[1.75,.55,.25],[.95,.3,1.3],0x7a5cff),kSig(R,[1.95,1.0,.05],[.95,.3,1.3],0x2f8ce0)];
  var labs=[indLabel(R,'PT-801 · RO feed pressure',[RX-.88,1.78,.3]),indLabel(R,'HP pump · VFD',[-.45,1.35,.6],'#F2A541'),indLabel(R,'FT-801 · permeate flow',[1.75,.85,.3],'#7a5cff'),indLabel(R,'Trionix HMI · membrane health',[.9,1.48,1.3],'#F2A541'),indLabel(R,'RO membranes',[RX,1.82,0],'#0B2545'),indLabel(R,'Pressure sand & carbon filters',[-1.3,1.85,-.7],'#0B2545'),indLabel(R,'Dosing · flow-paced',[-1.15,.85,1.1],'#13A89E'),indLabel(R,'AT-801 · conductivity',[1.95,1.35,.05],'#2f8ce0')];
  var flows=[kFlow(R,[[-.55,.65,.6],[RX-.88,.65,.6],[RX-.88,.65,.18]],0x2f8ce0,4,.3),kFlow(R,[[RX+.88,1.18,.18],[1.75,1.18,.18],[1.75,.43,.18]],0x8fd3ff,4,.3)];
  return indFrame(st,R,{cam:CAMF,look:[0,.8,0],op:op,shadow:3,
    update:indRun(R,{st:st,up:up,sig:sig,flows:flows,labs:labs,loopLabs:4,spin:[[cpl,20,'y']]})});
};

/* ---------- 9. CHEMICAL: jacketed reactor with cascade control ---------- */
IND.chemical=function(st){
  var R=new T.Group(); st.scene.add(R); softFloor(R,3.4,{cells:16,shadow:.22}); var k=km(), up=[];
  var glassLined=new T.MeshPhysicalMaterial({color:0x1e4f9a,roughness:.18,metalness:.1,clearcoat:1,clearcoatRoughness:.1});
  var V0=new T.Group(); V0.position.set(-.25,0,0); R.add(V0); kVessel(V0,{r:.5,h:.8,legH:.62,mat:glassLined,jacket:true,jacketMat:k.ss2,jacketH:.78,legs:4,nozzles:[[.25,.15,.05,.12],[-.25,.15,.05,.12],[.0,-.3,.07,.1]]}); var top=1.42;
  var sh=kAgitator(V0,top+.15,.95,'double'); var mh=rbox(.26,.06,.2,.03,k.ss2,-.2,top+.17,-.2,V0); var sgl=cylZ(.05,.05,k.ss2,.28,top+.15,-.2,V0,16);
  var rdisc=new T.Group(); rdisc.position.set(.3,top+.2,.18); V0.add(rdisc); cyl(.05,.05,.12,k.ss,0,.06,0,rdisc,14); cyl(.07,.07,.02,PAINT(0xc8312e,.4),0,.13,0,rdisc,18); cyl(.05,.05,.1,k.ss,0,.19,0,rdisc,14);
  /* overhead condenser + receiver */
  pipe([[-.25,top+.27,-.3],[-.25,top+.55,-.3],[.75,top+.55,-.3],[.75,2.1,-.3]],.05,k.ss,R);
  var cd=new T.Group(); cd.position.set(.75,1.55,-.3); R.add(cd); cyl(.12,.12,.9,k.ss,0,0,0,cd,24); [-.45,.45].forEach(function(y){ cyl(.15,.15,.04,k.ss2,0,y,0,cd,24); }); cylX(.03,.15,k.water,.15,.3,0,cd,12); cylX(.03,.15,k.water,.15,-.3,0,cd,12); box(.04,1.1,.04,k.navy,.15,-.45,-.15,cd);
  pipe([[.75,1.05,-.3],[.75,.85,-.3],[1.15,.85,-.3]],.03,k.ss,R); var rc=new T.Group(); rc.position.set(1.35,.75,-.3); R.add(rc); cylX(.15,.45,k.ss,0,0,0,rc,24); [-.22,.22].forEach(function(x){ var e=sph(.15,k.ss,x,0,0,rc,20,10); e.scale.x=.4; box(.04,.6,.04,k.navy,x,-.42,0,rc); });
  /* dosing vessel on load cells (elevated) */
  var D=new T.Group(); D.position.set(-1.3,0,-.45); R.add(D); [[-.3,-.3],[.3,-.3],[-.3,.3],[.3,.3]].forEach(function(p){ box(.05,1.25,.05,k.navy,p[0],.62,p[1],D); }); box(.7,.05,.7,k.navy,0,1.25,0,D);
  var dv=new T.Group(); dv.position.y=1.27; D.add(dv); kVessel(dv,{r:.2,h:.35,legH:.1,top:'dish',legs:3,loadcells:true});
  pipe([[-1.3,1.25,-.45],[-1.3,1.15,-.45],[-.9,1.15,-.45],[-.9,top+.3,-.15],[-.35,top+.3,-.15],[-.35,top+.18,-.15]],.018,k.ss,R); kCV(R,'FCV-901',.018,-1.1,1.15,-.45); var fm=kMag(R,'FT-901',.016,-.95,1.15,-.45,0,'kg/h',85); up.push(fm.update);
  /* jacket utilities: split range heating / cooling */
  pipe([[-1.55,.75,.45],[-.78,.75,.45],[-.78,.75,.2]],.025,k.steam,R); kCV(R,'TCV-902A',.022,-1.2,.75,.45);
  pipe([[-1.55,.45,.6],[-.68,.45,.6],[-.68,.65,.35]],.025,k.water,R); kCV(R,'TCV-902B',.022,-1.2,.45,.6);
  /* instruments */
  var t1=kTT(V0,'TT-901',65.0,-.12,top+.2,.28); up.push(t1.update); var t2=kTT(R,'TT-902',58.0,.3,.82,.45); up.push(t2.update); var pt=kPT(V0,'PT-901','bar',.4,.05,top+.24,-.38); up.push(pt.update); var lt=kLT(V0,'LT-901',58,-.32,top+.18,.12); up.push(lt.update);
  var vfd=buildVFD(); vfd.group.position.set(.55,0,.9); R.add(vfd.group); up.push(vfd.update);
  var CAMF=[2.6,2.4,3.6]; var op=kOpPanel(R,1.35,.95,faceTo(1.35,.95,CAMF),drawPID('TIC-901','Reactor temperature · cascade','°C',65,70,1),'TRIONIX · REACTOR'); up.push(op.update);
  var sig=[kSig(R,[-.37,top+.38,.28],[1.35,.3,.95],0x13A89E,{via:[[-.37,top+.45,.85]]}),kSig(R,[.3,.95,.45],[1.3,.3,.95],0x2f8ce0),kSig(R,[-1.15,1.3,-.4],[1.3,.3,.95],0xF2A541,{via:[[-1.15,1.35,0]]}),kSig(R,[-1.15,.9,.5],[1.3,.3,.95],0xE8891E)];
  var labs=[indLabel(R,'TT-901 · reactor (master)',[-.85,2.1,.35]),indLabel(R,'TT-902 · jacket (slave)',[.35,1.25,.55],'#2f8ce0'),indLabel(R,'FCV-901 · dosing',[-1.1,1.6,-.45],'#F2A541'),indLabel(R,'TCV-902A/B · heat / cool',[-1.2,1.15,.55],'#E8891E'),indLabel(R,'Trionix HMI · cascade PID',[1.35,1.48,.95],'#F2A541'),indLabel(R,'Glass-lined reactor',[-.25,.35,.75],'#0B2545'),indLabel(R,'Condenser',[.75,2.25,-.3],'#0B2545'),indLabel(R,'Dosing vessel · load cells',[-1.3,2.0,-.45],'#0B2545')];
  var flows=[kFlow(R,[[-1.3,1.18,-.45],[-.9,1.18,-.45],[-.9,top+.33,-.15],[-.35,top+.33,-.15]],0xF2A541,5,.25),kFlow(R,[[-1.55,.78,.45],[-.78,.78,.45]],0xE8891E,3,.3)];
  return indFrame(st,R,{cam:CAMF,look:[-.15,1.0,0],op:op,shadow:2.8,
    update:indRun(R,{st:st,up:up,sig:sig,flows:flows,labs:labs,loopLabs:5,spin:[[sh,1.6,'y']]})});
};
/* =====================================================================
   INDUSTRY VIEWS v2 — detailed equipment, real piping & cabling,
   tabs: Process · Inside view · feature screen
   ===================================================================== */
function kRun(R,a,via,TR,E,col,off){ return kCable3(R,a,via,TR,E,col,off); }
function kBranch(R,x,z0,z1,y){ if(Math.abs(z1-z0)<.15) return; var e=z1-(z1>z0?1:-1)*.07; kTray(R,[x,z0],[x,e],y,.14,{legs:Math.abs(z1-z0)>.6}); }
function indRun2(st,o){ var up=o.up||[],sig=o.sig||[],flows=o.flows||[],lp=o.lp||[],li=o.li||[],spin=o.spin||[],cuts=o.cuts||[],cam=st.camera,tv=new T.Vector3();
  lp.concat(li).forEach(function(l){ l.userData.s0=l.scale.clone(); });
  return function(dt,t,v){ var L=v.loop,C=v.cut; up.forEach(function(f){ f(t,dt); }); sig.forEach(function(c){ c.set(.25+.75*Math.max(L,.0)); c.update(t); }); flows.forEach(function(f){ f.set(.9); f.update(t); });
    spin.forEach(function(s){ s[0].rotation[s[2]||'x']+=dt*s[1]; }); cuts.forEach(function(c){ c.setCut(C); });
    var fp=Math.max(0,Math.min(1,1-Math.max(C,L)*1.6)), fi=Math.max(0,Math.min(1,C*1.4-.3))*(1-L);
    function sc(l,op){ if(window.__nolab) op=0; labOp(l,op); if(cam){ l.getWorldPosition(tv); var kk=Math.min(1.75,Math.max(.6,cam.position.distanceTo(tv)/2.6)); l.scale.copy(l.userData.s0).multiplyScalar(kk); } }
    lp.forEach(function(l){ sc(l,.95*fp); }); li.forEach(function(l){ sc(l,.95*fi); }); if(o.extra) o.extra(dt,t,v); }; }
function iLab(R,txt,pos,col,arr,anchor){ var l=anchor?leadLab(R,txt,anchor,pos,col,.085):label(txt,{pos:pos,h:.085,border:col||'#13A89E'}); if(!anchor) R.add(l); if(arr) arr.push(l); return l; }

/* ---------- 1. FOOD: steam-jacketed cooking kettle ---------- */
IND.food=function(st){
  var R=new T.Group(); st.scene.add(R); softFloor(R,3.6,{cells:18,shadow:.22}); var k=km(), up=[], lp=[], li=[], CAM=[2.7,2.2,3.4];
  var KX=-.2, face=Math.atan2(CAM[0]-KX,CAM[2]); var y0=.62, H=.62, r=.5, top=y0+H;
  var Kg=new T.Group(); Kg.position.set(KX,0,0); R.add(Kg);
  var shell=kShell(Kg,{r:r,h:H,y0:y0,bot:'dish',botK:.35,top:'none',m:k.ss,face:face});
  var jk=kShell(Kg,{r:r+.055,h:.5,y0:y0+.02,bot:'dish',botK:.36,top:'none',m:new T.MeshStandardMaterial({color:0xe9edf0,metalness:.82,roughness:.26}),face:face,inner:0x9aa3ad});
  tor(r+.058,.012,k.ss2,0,y0+.52,0,Kg).rotation.x=PI/2; tor(r+.004,.016,k.ss2,0,top,0,Kg).rotation.x=PI/2;
  var gap=new T.Mesh(new T.CylinderGeometry(r+.028,r+.028,.48,40,1,true),new T.MeshBasicMaterial({color:0xff8a3a,transparent:true,opacity:0,side:T.DoubleSide,depthWrite:false,toneMapped:false})); gap.position.y=y0+.27; Kg.add(gap);
  var prodM=new T.MeshStandardMaterial({color:0xd9862b,roughness:.3,emissive:new T.Color(0x5a2a05),emissiveIntensity:.25});
  var prod=new T.Mesh(new T.CircleGeometry(r-.008,48),prodM); prod.rotation.x=-PI/2; prod.position.y=top-.12; Kg.add(prod);
  var bulk=new T.Mesh(new T.CylinderGeometry(r-.01,r-.01,H-.12,40,1,true),new T.MeshStandardMaterial({color:0xd9862b,roughness:.4,transparent:true,opacity:0,depthWrite:false})); bulk.position.y=y0+(H-.12)/2; Kg.add(bulk);
  var lidF=new T.Mesh(new T.CylinderGeometry(r+.01,r+.01,.022,48,1,false,0,PI),k.ss); lidF.position.y=top+.03; lidF.rotation.y=PI/2; Kg.add(lidF);
  var hinge=new T.Group(); hinge.position.set(0,top+.045,0); hinge.rotation.x=-1.12; Kg.add(hinge); var lidO=new T.Mesh(new T.CylinderGeometry(r+.01,r+.01,.022,48,1,false,0,PI),k.ss); lidO.rotation.y=-PI/2; hinge.add(lidO); cyl(.02,.02,.1,k.ss2,0,.01,.46,hinge,10).rotation.x=PI/2;
  cylX(.014,1.06,k.ss2,0,top+.045,0,Kg,10); kBeam(Kg,[-.6,top+.11,-.06],[.6,top+.11,-.06],.08,.06,k.ss2);
  var sh=kAgitator(Kg,top+.15,.78,'anchor'); sh.parent.position.z=-.06; [-1,1].forEach(function(s){ for(var j=0;j<3;j++) box(.03,.07,.012,M(0xf2f2ee,{roughness:.6}),s*.33,-.75+.12+j*.12,0,sh); });
  var vap=kSteam(Kg,10,.0,top-.1,.18,.5); up.push(function(t){ vap(t,.45); });
  [0,1,2,3].forEach(function(i){ var a=i*PI/2+PI/4, lx=Math.cos(a)*(r-.02), lz=Math.sin(a)*(r-.02); cyl(.035,.035,y0+.1,k.ss2,lx,(y0+.1)/2,lz,Kg,14); rbox(.12,.04,.12,.008,M(0x30363e),lx,.07,lz,Kg); box(.14,.012,.14,k.ss2,lx,.006,lz,Kg); box(.13,.012,.13,k.ss2,lx,.1,lz,Kg); });
  var jb=new T.Group(); jb.position.set(KX-.62,.14,.42); R.add(jb); rbox(.14,.1,.07,.01,PAINT(0xe4e8ec,.4),0,0,0,jb); var wt=kHead(jb,'WT-101','kg',412,.8,k.navy); wt.position.set(0,.13,0); wt.scale.setScalar(.8); up.push(function(t){ wt.userData.lcd.update(t); });
  kDataPlate(Kg,['KETTLE K-101','1000 L · SS316L','JACKET 3.5 bar'],Math.sin(face)*(r+.058),y0+.32,Math.cos(face)*(r+.058),face,.15);
  /* steam supply: isolation, strainer, TCV-101, gauge -> jacket inlet */
  var jin=[KX-(r+.055),.98,0]; kTube(R,[[-1.75,.98,-.85],[-1.75,.98,0],jin],.026,k.ss,{ins:true,sup:true,fl:[false,true]}); kBL(R,[-1.75,.98,-.85],[0,0,-1],.026,'STEAM IN','#5d6670');
  kHV(R,.026,-1.58,.98,0); var ys=new T.Group(); ys.position.set(-1.42,.98,0); R.add(ys); cylX(.036,.1,k.ss2,0,0,0,ys,14); var yb=cyl(.026,.026,.11,k.ss2,0,-.05,.04,ys,12); yb.rotation.x=.6; kCV(R,'TCV-101',.028,-1.18,.98,0); var pg=kGauge(R,-.96,1.1,0,0,'bar',.85); cyl(.008,.008,.06,k.ss2,-.96,1.03,0,R,8);
  /* condensate: jacket bottom -> strainer -> TD trap -> drain */
  var cx0=KX+Math.cos(.6)*.42, cz0=Math.sin(.6)*.42; kTube(R,[[cx0,.58,cz0],[cx0,.3,cz0],[.62,.3,cz0],[.62,.3,.78]],.018,k.ss,{fl:[true,false]}); kBL(R,[.62,.3,.78],[0,0,1],.018,'CONDENSATE','#5d6670'); var tr=new T.Group(); tr.position.set(.38,.3,cz0); R.add(tr); cylX(.03,.12,k.ss2,0,0,0,tr,14); cyl(.04,.04,.05,k.ss2,0,.03,0,tr,16); kHV(R,.016,.55,.3,cz0,0);
  /* bottom outlet: flush valve -> pump -> to filler */
  var pu=kPump2(R,.82,-.6,PI,.62); kTube(R,[[KX,y0-r*.35-.01,0],[KX,.17,0],[KX,.17,-.6],[.82-.52*.62,.17,-.6]],.028,k.ss,{fl:[true,true],rb:.07}); kBV(R,'XV-102',.028,KX,.17,-.32,PI/2);
  kTube(R,[[.82-.36*.62,.31,-.6],[.82-.36*.62,.9,-.6],[1.65,.9,-.6]],.024,k.ss,{fl:[true,false],sup:true}); kBL(R,[1.65,.9,-.6],[1,0,0],.024,'TO FILLING','#9A5F12');
  /* CIP line + spray ball */
  kTube(R,[[KX-.28,top+.03,-.28],[KX-.28,top+.32,-.28],[KX-.28,top+.32,-.95],[-1.75,top+.32,-.95]],.016,k.ss,{fl:[false,false]}); kBL(R,[-1.75,top+.32,-.95],[-1,0,0],.016,'CIP SUPPLY','#0B7C74'); sph(.03,k.ss,KX-.28,top-.05,-.28,R,14,10); cyl(.008,.008,.09,k.ss,KX-.28,top-.01,-.28,R,8);
  var tt=kTT(Kg,'TT-101',85.0,.2,top+.045,-.24,0); up.push(tt.update);
  /* operator panel + cable tray + routed cables */
  var PX=1.15,PZ=.6, op=kOpPanel2(R,PX,PZ,faceTo(PX,PZ,CAM),drawRecipe(),'TRIONIX','KETTLE PANEL · K-101'); up.push(op.update);
  var TR={z:-1.15,y:.3}, E=[PX,.13,PZ]; kTray(R,[-1.9,TR.z],[1.5,TR.z],TR.y,.2); kBranch(R,PX,TR.z,PZ,TR.y);
  var ttW=kWorld(Kg,new T.Vector3(.2,top+.11,-.24)); var sig=[kRun(R,[ttW.x,ttW.y,ttW.z],[[ttW.x,top+.3,ttW.z],[ttW.x,top+.3,-.85]],TR,E,0x13A89E,-.05),
    kRun(R,[-1.12,1.13,.03],[[-1.12,1.3,.03],[-1.12,1.3,-.4]],TR,E,0xF2A541,0),kRun(R,[KX-.62,.2,.42],[[KX-.62,.2,.95],[-1.2,.2,.95],[-1.2,.2,-.8]],TR,E,0x7a5cff,.05),
    kRun(R,[KX+.1,top+.42,-.06],[[KX+.1,top+.42,-.6]],TR,E,0x2f8ce0,.07)];
  iLab(R,'Jacketed kettle K-101',[KX-.8,1.75,.2],'#0B2545',lp); iLab(R,'TCV-101 · steam to jacket',[-1.18,1.45,0],'#E8891E',lp); iLab(R,'TT-101 · product temperature',[KX+.35,1.95,-.3],'#13A89E',lp); iLab(R,'Load cells WT-101',[KX-.75,.45,.65],'#7a5cff',lp); iLab(R,'Discharge pump',[.7,.75,-.85],'#0B2545',lp); iLab(R,'Cable tray',[-1.4,.55,-1.15],'#33465E',lp);
  iLab(R,'Steam jacket · 3.5 bar',[KX+.75,.85,.55],'#E8891E',li); iLab(R,'Anchor agitator with scrapers',[KX+.7,1.15,.2],'#13A89E',li); iLab(R,'Product at 85 °C',[KX+.6,1.35,.55],'#9A5F12',li); iLab(R,'Jacket condensate outlet',[.5,.45,.55],'#2f8ce0',li); iLab(R,'Bottom outlet valve',[KX+.3,.3,.35],'#0B2545',li);
  var flows=[kFlow(R,[[-1.75,1.04,-.85],[-1.75,1.04,0],[jin[0],1.04,0]],0xE8891E,5,.25)];
  return ind3(st,R,{cam:CAM,look:[-.15,.85,0],camIn:[KX+Math.sin(face)*1.9,1.7,Math.cos(face)*1.9],lookIn:[KX,.92,0],op:op,shadow:2.8,
    update:indRun2(st,{up:up,sig:sig,flows:flows,lp:lp,li:li,cuts:[shell,jk],spin:[[sh,1.2,'y'],[pu.spin,14,'x']],extra:function(dt,t,v){ var c=v.cut; gap.material.opacity=.35*c; bulk.material.opacity=.55*c; bulk.visible=c>.02; }})});
};

/* ---------- 2. PHARMA: fluid bed dryer with filter bags ---------- */
IND.pharma=function(st){
  var R=new T.Group(); st.scene.add(R); softFloor(R,3.8,{cells:18,shadow:.22}); var k=km(), up=[], lp=[], li=[], CAM=[2.9,2.6,3.7];
  var X=-.1, face=Math.atan2(CAM[0]-X,CAM[2]);
  /* base frame + air plenum (fixed) */
  [[-.42,-.42],[.42,-.42],[-.42,.42],[.42,.42]].forEach(function(p){ box(.06,.46,.06,k.ss2,X+p[0],.23,p[1],R); box(.14,.012,.14,k.ss2,X+p[0],.006,p[1],R); });
  var Pg=new T.Group(); Pg.position.x=X; R.add(Pg); var plen=kShell(Pg,{r:.42,h:.26,y0:.46,bot:'flat',top:'none',m:k.ss,face:face}); tor(.43,.02,k.black,0,.72,0,Pg).rotation.x=PI/2;
  /* product bowl on trolley (cone) with retaining screen */
  var bowl=kShell(Pg,{r:.5,h:.02,y0:1.07,bot:'cone',coneR:.42,coneH:.34,top:'none',m:k.ss,face:face}); tor(.51,.022,k.black,0,1.08,0,Pg).rotation.x=PI/2;
  var scr=cnv(64,64),sx=scr.getContext('2d'); sx.fillStyle='#9aa3ad'; sx.fillRect(0,0,64,64); sx.fillStyle='#3b434b'; for(var i=0;i<64;i+=4) for(var j=0;j<64;j+=4) sx.fillRect(i,j,2,2); var stx=new T.CanvasTexture(scr); stx.wrapS=stx.wrapT=T.RepeatWrapping; stx.repeat.set(8,8);
  var mesh=new T.Mesh(new T.CircleGeometry(.41,40),new T.MeshStandardMaterial({map:stx,metalness:.6,roughness:.4,transparent:true,alphaTest:0})); mesh.rotation.x=-PI/2; mesh.position.y=.75; Pg.add(mesh);
  var tr=new T.Group(); tr.position.x=X; R.add(tr); var tq=[[-.5,-.45],[.5,-.45],[.5,.45],[-.5,.45]]; tq.forEach(function(a,ai){ var b=tq[(ai+1)%4]; kBeam(tr,[a[0],.14,a[1]],[b[0],.14,b[1]],.04,.04,k.ss2,{noBase:true}); kBeam(tr,[a[0],.98,a[1]],[b[0],.98,b[1]],.04,.04,k.ss2,{noBase:true}); kBeam(tr,[a[0],.14,a[1]],[a[0],.98,a[1]],.04,.04,k.ss2,{noBase:true}); var cs=new T.Group(); cs.position.set(a[0],0,a[1]); tr.add(cs); box(.04,.012,.04,k.ss2,0,.115,0,cs); box(.008,.07,.04,k.ss2,-.026,.075,0,cs); box(.008,.07,.04,k.ss2,.026,.075,0,cs); cylX(.045,.035,k.black,0,.05,0,cs,16); }); [[0,-.45],[0,.45]].forEach(function(q){ kBeam(tr,[-.5,.98,q[1]],[.5,.98,q[1]],.03,.03,k.ss2,{noBase:true}); }); rod([-.32,.98,.45],[-.32,1.12,.62],.014,k.ss2,tr); rod([.32,.98,.45],[.32,1.12,.62],.014,k.ss2,tr); rod([-.32,1.12,.62],[.32,1.12,.62],.016,k.black,tr);
  /* expansion chamber with sight glasses + filter housing */
  var exp=kShell(Pg,{r:.52,h:.92,y0:1.08,bot:'none',top:'none',m:k.ss,face:face}); tor(.53,.022,k.black,0,2.0,0,Pg).rotation.x=PI/2;
  var gs=screen(128,128,function(g,t,w,h){ g.fillStyle='#e9dcc3'; g.fillRect(0,0,w,h); for(var i=0;i<90;i++){ var a=i*2.39996, u=(t*.6+i*.137)%1; var xx=w/2+Math.cos(a*3+t)*w*.4*((i%7)/7), yy=h*(1-u)+Math.sin(t*3+i)*6; g.fillStyle=i%3?'#f7f1e4':'#cbb894'; g.beginPath(); g.arc(xx,yy,3+(i%3),0,PI*2); g.fill(); } },12);
  [face+.5,face-.5].forEach(function(a,ii){ var sg=kSight(R,[X+Math.sin(a)*.53,1.4+ii*.25,Math.cos(a)*.53],[Math.sin(a),0,Math.cos(a)],.09); var gl=new T.Mesh(new T.CircleGeometry(.088,28),screenMat(gs)); gl.position.z=.017; sg.add(gl); });
  var fh=kShell(Pg,{r:.54,h:.44,y0:2.02,bot:'none',top:'dish',topK:.3,m:k.ss,face:face}); tor(.55,.022,k.black,0,2.02,0,Pg).rotation.x=PI/2;
  var bags=new T.Group(); Pg.add(bags); for(i=0;i<9;i++){ var a2=i/9*PI*2, rr=i===8?0:.3; var bx=Math.cos(a2)*rr, bz=Math.sin(a2)*rr; var bg=cyl(.075,.06,.55,M(0xf1ece0,{roughness:.95}),bx,1.85,bz,bags,14); cyl(.08,.08,.03,k.ss2,bx,2.13,bz,bags,14); } box(1.0,.02,1.0,k.ss2,0,2.15,0,bags).visible=false; var tsh=new T.Mesh(new T.CylinderGeometry(.5,.5,.02,40),k.ss2); tsh.position.y=2.15; bags.add(tsh);
  [-.18,.18].forEach(function(dx){ cyl(.05,.05,.24,M(0xd9dee3,{metalness:.6,roughness:.3}),X+dx,2.75,0,R,18); cyl(.02,.02,.08,k.ss2,X+dx,2.9,0,R,10); });
  /* exhaust duct -> blower; AHU -> plenum */
  kTube(R,[[X+.52,2.25,0],[1.05,2.25,0],[1.05,.95,0],[1.05,.95,-.62]],.11,k.ss,{fl:[true,false],rb:.2}); var bl=new T.Group(); bl.position.set(1.05,.45,-.82); R.add(bl); cylZ(.32,.24,k.gry,0,0,0,bl,32); box(.26,.32,.24,k.gry,.23,.2,0,bl); kMotor2(bl,0,0,-.42,.85,null,PI/2); kTube(R,[[1.05,.77,-.62],[1.05,.95,-.62]],.11,k.gry,{fl:false}); kTube(R,[[1.28,.62,-.82],[1.28,1.4,-.82]],.08,k.gry,{fl:[true,false]});
  var A=new T.Group(); A.position.set(-1.55,0,0); R.add(A); rbox(.72,.94,.64,.02,PAINT(0xe4e8ec,.4),0,.6,0,A); [-.2,0,.2].forEach(function(dx,ii){ box(.16,.62,.01,ii===1?PAINT(0x9a3b2a,.45):M(0xf2efe2,{roughness:.9}),dx,.6,.322,A); }); for(i=0;i<7;i++) box(.13,.008,.012,M(0xb7b19a),-.2,.36+i*.08,.328,A); for(i=0;i<10;i++) box(.004,.58,.012,METAL(0xc58a4a,.3),-.05+i*.013,.6,.328,A);
  box(.6,.06,.62,k.ss2,0,.1,0,A); kTube(R,[[-1.19,.6,0],[-.75,.6,0],[-.75,.59,0],[X-.42,.59,0]],.12,k.ss,{fl:[true,true],rb:.16});
  var dmp=new T.Group(); dmp.position.set(-.95,.6,0); R.add(dmp); box(.08,.3,.3,k.ss2,0,0,0,dmp); rbox(.1,.08,.08,.01,k.act,0,.2,.12,dmp);
  kTube(R,[[-1.6,1.35,-.32],[-1.6,1.35,-.95],[-2.0,1.35,-.95]],.022,k.ss,{ins:true,fl:[true,false]}); kBL(R,[-2.0,1.35,-.95],[-1,0,0],.022,'STEAM IN','#5d6670'); kCV(R,'TCV-201',.022,-1.6,1.35,-.65,PI/2);
  /* instruments */
  var t1=kTT(R,'TT-201',60.0,-.6,.73,0); up.push(t1.update); var t2=kTT(R,'TT-202',42.0,X+Math.sin(face)*.47,1.0,Math.cos(face)*.47,face); t2.group.rotation.z=0; up.push(t2.update); var t3=kTT(R,'TT-203',38.0,.65,2.37,0); up.push(t3.update);
  var dp=kPT(R,'PDT-201','mbar',12.5,X-.68,1.9,.25); up.push(dp.update); kTube(R,[[X-.68,2.0,.25],[X-.68,2.1,.25],[X-.5,2.1,.18]],.004,k.ss2,{fl:false}); kTube(R,[[X-.64,1.95,.27],[X-.64,1.7,.27],[X-.5,1.7,.18]],.004,k.ss2,{fl:false});
  var PX=1.35,PZ=.85, op=kOpPanel2(R,PX,PZ,faceTo(PX,PZ,CAM),drawEBR(),'TRIONIX','FBD PANEL · FBD-01'); up.push(op.update); up.push(function(t){ gs.update(t); });
  var TR={z:-1.25,y:.3}, E=[PX,.13,PZ]; kTray(R,[-2.0,TR.z],[1.6,TR.z],TR.y,.2); kBranch(R,PX,TR.z,PZ,TR.y);
  var sig=[kRun(R,[-.6,.8,0],[[-.6,.8,-.5]],TR,E,0x13A89E,-.05),kRun(R,[-1.55,1.52,-.62],[[-1.55,1.6,-.62]],TR,E,0xF2A541,0),kRun(R,[X-.68,2.05,.25],[[X-.95,2.05,.25],[X-.95,2.05,-.6]],TR,E,0x7a5cff,.04),kRun(R,[.65,2.48,0],[[.65,2.6,0],[.65,2.6,-.5]],TR,E,0x2f8ce0,.07)];
  iLab(R,'Fluid bed dryer FBD-01',[X-.95,2.6,.3],'#0B2545',lp); iLab(R,'Air handling unit · steam coil',[-1.55,1.25,.5],'#0B2545',lp); iLab(R,'TCV-201 · steam',[-1.6,1.75,-.65],'#E8891E',lp); iLab(R,'PDT-201 · bag ΔP',[X-.9,2.3,.35],'#7a5cff',lp); iLab(R,'Exhaust blower · VFD',[1.15,1.5,-.95],'#0B2545',lp); iLab(R,'Product bowl on trolley',[X+.75,.85,.75],'#0B2545',lp);
  iLab(R,'Finger filter bags',[X+.75,2.15,.45],'#13A89E',li); iLab(R,'Fluidised granules',[X+.75,1.35,.55],'#9A5F12',li); iLab(R,'Air distributor screen',[X+.75,.95,.6],'#0B2545',li); iLab(R,'Inlet air plenum',[X+.7,.55,.6],'#2f8ce0',li); iLab(R,'Shaking cylinders',[X+.6,2.85,.2],'#7a5cff',li);
  var parts=[]; for(i=0;i<70;i++){ var pp=new T.Sprite(new T.SpriteMaterial({map:DOT,color:i%3?0xf7f1e4:0xcbb894,transparent:true,depthWrite:false,opacity:0})); pp.scale.setScalar(.05); R.add(pp); parts.push({s:pp,o:Math.random(),a:Math.random()*PI*2,r:Math.random()*.4}); }
  var flows=[kFlow(R,[[-1.19,.66,0],[X-.42,.66,0]],0x2f8ce0,4,.3),kFlow(R,[[X+.52,2.31,0],[1.05,2.31,0],[1.05,.95,0]],0x9aa3ad,4,.25)];
  return ind3(st,R,{cam:CAM,look:[-.2,1.25,0],camIn:[X+Math.sin(face)*2.3,1.9,Math.cos(face)*2.3],lookIn:[X,1.5,0],op:op,shadow:3,
    update:indRun2(st,{up:up,sig:sig,flows:flows,lp:lp,li:li,cuts:[plen,bowl,exp,fh],extra:function(dt,t,v){ var c=v.cut; parts.forEach(function(p){ var u=(p.o+t*.35)%1; p.s.position.set(X+Math.cos(p.a+t*.8)*p.r,.78+u*.75+Math.sin(t*4+p.a)*.03,Math.sin(p.a+t*.8)*p.r); p.s.material.opacity=c*.95*(1-u*.6); }); bags.children.forEach(function(b,ii){ b.position.x+= (ii<9?Math.sin(t*20+ii)*.0004:0); }); }})});
};

/* ---------- 3. PACKAGING: tray sealer line, checkweigher, reject ---------- */
IND.packaging=function(st){
  var R=new T.Group(); st.scene.add(R); softFloor(R,3.8,{cells:18,shadow:.22}); var k=km(), up=[], lp=[], li=[], CAM=[1.9,2.4,3.7]; var BY=.86;
  /* infeed + outfeed conveyors (modular belt) */
  var bt=cnv(64,64),bx=bt.getContext('2d'); bx.fillStyle='#e9edf0'; bx.fillRect(0,0,64,64); bx.fillStyle='#c9d0d6'; for(var i=0;i<8;i++) bx.fillRect(i*8,0,2,64); for(i=0;i<8;i++) bx.fillRect(0,i*8,64,1); var btx=new T.CanvasTexture(bt); btx.wrapS=btx.wrapT=T.RepeatWrapping; btx.repeat.set(16,1.2);
  box(3.3,.03,.34,M(0xffffff,{map:btx,roughness:.6}),0,BY,0,R); [-1,1].forEach(function(s){ box(3.34,.09,.025,k.ss2,0,BY-.03,s*.19,R); box(3.34,.025,.015,M(0x2f6fb5),0,BY+.07,s*.16,R); });
  for(var x=-1.6;x<=1.61;x+=.55){ [-.17,.17].forEach(function(z){ box(.04,BY-.04,.04,k.ss2,x,(BY-.04)/2,z,R); cyl(.03,.035,.03,M(0x22262a),x,.015,z,R,12); }); box(.04,.04,.34,k.ss2,x,.35,0,R); }
  cylZ(.045,.4,k.ss2,-1.66,BY-.01,0,R,18); cylZ(.045,.4,k.ss2,1.66,BY-.01,0,R,18); kMotor2(R,1.66,BY-.2,-.36,.42,null,PI/2);
  /* sealing machine body with guard doors */
  var SX=-.55, body=new T.Group(); body.position.set(SX,0,0); R.add(body); rbox(.9,.62,.7,.02,k.ss,0,1.48,0,body); rbox(.9,.12,.7,.02,k.ss,0,.12,.0,body).position.set(0,.4,0);
  [[-.43,-.33],[.43,-.33],[-.43,.33],[.43,.33]].forEach(function(p){ box(.06,1.2,.06,k.ss,p[0],.6,p[1],body); cyl(.035,.04,.03,M(0x22262a),p[0],.015,p[1],body,12); });
  var gdM=new T.MeshPhysicalMaterial({color:0xdde9ee,transparent:true,opacity:.22,roughness:.05,clearcoat:1,depthWrite:false}); var gd=box(.84,.48,.012,gdM,0,1.02,.36,body); gd.__noShadow=true; box(.84,.02,.02,k.ss2,0,1.27,.36,body); box(.84,.02,.02,k.ss2,0,.78,.36,body); box(.02,.48,.02,k.ss2,-.42,1.02,.36,body); box(.02,.48,.02,k.ss2,.42,1.02,.36,body); box(.2,.02,.02,M(0x22262a),0,1.2,.375,body);
  /* sealing tool: servo press (inside) */
  var head=new T.Group(); head.position.set(0,1.1,0); body.add(head); rbox(.4,.08,.3,.01,PAINT(0xc8312e,.4),0,0,0,head); box(.36,.025,.26,METAL(0x9aa1a8,.3),0,-.05,0,head); for(i=0;i<3;i++) cylX(.008,.42,M(0x111),0,.02,-.08+i*.08,head,8); cyl(.025,.025,.38,METAL(0xe5e8eb,.2),0,.22,0,head,12);
  rbox(.24,.16,.2,.02,M(0x2a2e34),0,1.86,0,body); cyl(.06,.06,.2,M(0x1d2025),0,2.03,0,body,24); var anvil=box(.4,.06,.32,M(0x30363e),0,BY-.02,0,body); anvil.position.y=BY+.0-.03;
  /* film unwind (top rear) + scrap rewind */
  var roll=new T.Group(); roll.position.set(SX-.15,1.95,-.25); R.add(roll); cylZ(.13,.34,M(0xe7eef3,{roughness:.25,metalness:.1}),0,0,0,roll,28); cylZ(.03,.44,k.ss2,0,0,0,roll,12); var rw=new T.Group(); rw.position.set(SX+.32,1.92,-.25); R.add(rw); cylZ(.07,.32,M(0xc9d6de,{roughness:.3}),0,0,0,rw,20);
  var film=new T.Mesh(new T.PlaneGeometry(.34,.6),new T.MeshStandardMaterial({color:0xe9f2f7,transparent:true,opacity:.5,roughness:.15,side:T.DoubleSide,depthWrite:false})); film.position.set(SX-.15,1.55,-.14); film.rotation.x=.25; R.add(film);
  kDataPlate(body,['TRAY SEALER TS-01','40 packs/min · 400 V'],.0,1.48,.351,0,.16);
  /* checkweigher + display */
  var CW=.45; rbox(.42,.06,.42,.01,k.ss2,CW,BY-.06,0,R); rbox(.36,.42,.36,.01,k.ss,CW,.42,0,R);
  var ws=screen(160,96,function(g,t,w,h){ g.fillStyle='#0d1a14'; g.fillRect(0,0,w,h); var low=(Math.floor(t/1.6)%7)===3; g.fillStyle=low?'#ff5a4a':'#7dff9a'; g.font='700 30px '+MONO; g.fillText((low?246.1:251.8+Math.sin(t)*.6).toFixed(1)+' g',8,46); g.font='600 14px '+MONO; g.fillStyle='#bfe9df'; g.fillText(low?'REJECT':'OK  250.0 ±2 g',8,78); },6);
  var wsg=new T.Group(); wsg.position.set(CW,1.3,.3); R.add(wsg); box(.04,.5,.04,k.ss2,0,-.25,0,wsg); rbox(.3,.2,.06,.01,M(0x2a2e34),0,0,0,wsg); var wp=new T.Mesh(new T.PlaneGeometry(.26,.156),screenMat(ws)); wp.position.z=.031; wsg.add(wp);
  /* reject pusher (pneumatic) + bin; air prep unit */
  var rp=new T.Group(); rp.position.set(.95,BY+.08,.38); R.add(rp); cylZ(.035,.3,M(0xd9dee3,{metalness:.6,roughness:.3}),0,0,0,rp,16); var rod1=new T.Group(); rp.add(rod1); cylZ(.012,.25,METAL(0xe5e8eb,.2),0,0,-.2,rod1,10); rbox(.12,.08,.02,.005,k.ss2,0,0,-.33,rod1); box(.04,.12,.04,k.ss2,0,-.06,0,rp);
  rbox(.36,.3,.26,.02,PAINT(0xc8312e,.45),.95,.15,-.62,R); box(.3,.02,.35,k.ss2,.95,BY-.14,-.42,R).rotation.x=-.5;
  var frl=new T.Group(); frl.position.set(SX+.47,.95,.2); R.add(frl); [0,.07,.14].forEach(function(dz){ cyl(.025,.025,.1,M(0xdde3e8,{metalness:.5}),0,0,dz,frl,14); }); kTube(R,[[SX+.47,1.0,.34],[.95,1.0,.34],[.95,BY+.12,.34]],.006,M(0x2f8ce0),{fl:false});
  /* photo eyes */
  var pe=new T.Group(); pe.position.set(-1.05,BY+.1,.2); R.add(pe); rbox(.04,.05,.03,.005,k.yel,0,0,0,pe); var beamM=BM(0xff3b2f,{transparent:true,opacity:.6,toneMapped:false}); box(.004,.004,.4,beamM,0,0,-.2,pe); rbox(.04,.05,.03,.005,k.yel,-1.05,BY+.1,-.2,R);
  /* trays */
  var trays=[],P=3.0,N=6; for(i=0;i<N;i++){ var tg=new T.Group(); R.add(tg); rbox(.2,.05,.15,.015,M(0x1d2025,{roughness:.4}),0,.025,0,tg); var fd=new T.Mesh(new T.BoxGeometry(.17,.035,.12),M(i%2?0xd9862b:0x8bbf4a,{roughness:.6})); fd.position.y=.04; tg.add(fd); var lid=new T.Mesh(new T.PlaneGeometry(.2,.15),new T.MeshStandardMaterial({color:0xe9f2f7,transparent:true,opacity:.6,roughness:.15,depthWrite:false})); lid.rotation.x=-PI/2; lid.position.y=.052; tg.add(lid); trays.push({g:tg,lid:lid}); }
  var PX=-.05,PZ=-1.0, op=kOpPanel2(R,PX,PZ,faceTo(PX,PZ,CAM),drawOEE(),'TRIONIX','LINE PANEL · TS-01'); up.push(op.update); up.push(function(t){ ws.update(t); });
  var TR={z:-.62,y:.3}, E=[PX,.13,PZ]; kTray(R,[-1.7,TR.z],[1.3,TR.z],TR.y,.18); kBranch(R,PX,TR.z,PZ,TR.y);
  var sig=[kRun(R,[SX,2.1,0],[[SX,2.1,-.45]],TR,E,0xF2A541,-.04),kRun(R,[-1.05,BY+.1,-.22],[],TR,E,0x13A89E,0),kRun(R,[CW,.25,-.18],[],TR,E,0x7a5cff,.04),kRun(R,[1.66,BY-.08,-.5],[],TR,E,0x2f8ce0,.06)];
  iLab(R,'Tray sealer TS-01',[SX-.65,2.05,.2],'#0B2545',lp); iLab(R,'Checkweigher',[CW,1.62,.3],'#7a5cff',lp); iLab(R,'Reject pusher',[.95,1.15,.45],'#c8312e',lp); iLab(R,'Photo-eye registration',[-1.1,1.2,.3],'#13A89E',lp); iLab(R,'Film unwind',[SX-.6,2.25,-.25],'#0B2545',lp);
  iLab(R,'Heated seal tool · TIC-301',[SX+.7,1.25,.35],'#E8891E',li); iLab(R,'Servo press',[SX+.55,1.9,.2],'#0B2545',li); iLab(R,'Seal anvil',[SX+.6,.95,.4],'#0B2545',li);
  var TC=1.6, SPC=.5;
  return ind3(st,R,{cam:CAM,look:[-.15,.95,0],camIn:[SX+.45,1.45,1.35],lookIn:[SX,1.08,0],op:op,shadow:3,
    update:indRun2(st,{up:up,sig:sig,lp:lp,li:li,cuts:[{setCut:function(c){ gdM.opacity=.22*(1-c*.85); }}],extra:function(dt,t,v){ var n=Math.floor(t/TC), c=(t%TC)/TC, m=c<.22?(function(u){return u*u*(3-2*u);})(c/.22):1; btx.offset.x=-(n+m)*SPC/3.3*16;
      var hy=c<.25?.0:(c<.35?-(c-.25)/.1*.17:(c<.6?-.17:(c<.7?-.17+(c-.6)/.1*.17:0))); head.position.y=1.1+hy; var push=false;
      trays.forEach(function(tr,i){ var raw=i*SPC+(n+m)*SPC, lap=Math.floor(raw/P), x2=-1.55+(raw%P); tr.g.position.set(x2,BY+.015,0); tr.g.visible=true; tr.lid.visible=x2>SX+.05||(Math.abs(x2-SX)<.05&&c>.5); var rej=((lap*3+i)%7)===2;
        if(rej&&Math.abs(x2-.95)<.03&&m>=1){ var u2=Math.max(0,Math.min(1,(c-.3)/.25)); tr.g.position.z=-u2*.42; tr.g.position.y=BY+.015-Math.max(0,u2-.5)*.3; push=push||(c>.3&&c<.6); } else if(rej&&x2>1.0) tr.g.visible=false; if(x2>1.5) tr.g.visible=false; });
      rod1.position.z=push?-.16:0; beamM.opacity=.3+.4*Math.abs(Math.sin(t*6)); roll.rotation.z+=dt*.6; rw.rotation.z-=dt*.6; }})});
};

/* ---------- 4. DISTILLERY: tray column, kettle reboiler, condenser, reflux ---------- */
IND.distillery=function(st){
  var R=new T.Group(); st.scene.add(R); softFloor(R,3.8,{cells:18,shadow:.22}); var k=km(), up=[], lp=[], li=[], CAM=[3.25,3.0,4.75];
  var CX=-.6, CR=.28, Y0=.38, H=2.75, face=Math.atan2(CAM[0]-CX,CAM[2]);
  var Cg=new T.Group(); Cg.position.x=CX; R.add(Cg);
  var sk=kShell(Cg,{r:.3,h:Y0,y0:0,bot:'none',top:'none',m:PAINT(0x3b4a5c,.5),face:face+PI}); box(.12,.22,.04,M(0x15171a),0,.15,.31,Cg).position.set(Math.sin(face+PI)*.3,.15,Math.cos(face+PI)*.3);
  var col=kShell(Cg,{r:CR,h:H,y0:Y0,bot:'dish',top:'dish',m:k.ss,face:face}); for(var ty=Y0+.5;ty<Y0+H;ty+=.7) tor(CR+.003,.008,k.ss2,0,ty,0,Cg).rotation.x=PI/2;
  var liq=new T.MeshStandardMaterial({color:0xe8a43a,transparent:true,opacity:.8,roughness:.2,emissive:new T.Color(0x6a3a05),emissiveIntensity:.3});
  for(var i=0;i<8;i++){ var y=Y0+.28+i*.3, sg=i%2?1:-1; var tray=new T.Mesh(new T.CylinderGeometry(CR*.98,CR*.98,.01,36),k.ss2); tray.position.y=y; Cg.add(tray);
    box(.012,.2,CR*1.3,k.ss2,sg*CR*.55,y-.1,0,Cg); box(.012,.035,CR*1.3,k.ss2,-sg*CR*.5,y+.02,0,Cg); var l=new T.Mesh(new T.CylinderGeometry(CR*.95,CR*.95,.03,36),liq); l.position.y=y+.02; Cg.add(l);
    var caps=[]; for(var j=0;j<10;j++){ var a=j/10*PI*2, rr=j%2?.08:.15; caps.push([-sg*.05+Math.cos(a)*rr,y+.035,Math.sin(a)*rr]); } icyl(caps,.022,.035,k.ss2,Cg,10); }
  var bub=[]; for(i=0;i<46;i++){ var b=new T.Sprite(pulseMat(i%2?0xffffff:0xffd28a)); b.scale.setScalar(.032); Cg.add(b); bub.push({s:b,o:Math.random(),a:Math.random()*PI*2,r:Math.random()*.2}); }
  kLadder(R,CX-.42,0,.0,Y0+H-.2,-PI/2); [1.2,2.3].forEach(function(y){ var pl=new T.Group(); pl.position.set(CX,0,0); R.add(pl); });
  var mh=kNozzle(R,[CX+Math.sin(face-.9)*CR,1.4,Math.cos(face-.9)*CR],[Math.sin(face-.9),0,Math.cos(face-.9)],.09,.14); var mh2=kNozzle(R,[CX+Math.sin(face-.9)*CR,2.6,Math.cos(face-.9)*CR],[Math.sin(face-.9),0,Math.cos(face-.9)],.09,.14);
  kDataPlate(Cg,['COLUMN C-401','8 sieve trays · SS304'],Math.sin(face)*(CR+.003),1.0,Math.cos(face)*(CR+.003),face,.14);
  /* kettle reboiler E-402 (cut-away shows U-tube bundle) */
  var RBg=new T.Group(); RBg.position.set(.35,.55,.15); R.add(RBg); var rb=kHShell(RBg,{r:.22,L:.95,m:k.ss}); [-.3,.3].forEach(function(x){ box(.1,.32,.34,k.navy,x,-.39,0,RBg); }); cylX(.24,.05,k.ss2,-.5,0,0,RBg,32); var ch=sph(.2,k.ss,-.58,0,0,RBg,24,12); ch.scale.x=.45;
  var ub=[]; for(var ui=0;ui<5;ui++) for(var uj=0;uj<3;uj++) ub.push([[-.48,-.1+ui*.05,-.08+uj*.08],[.4,-.1+ui*.05,-.08+uj*.08]]); irods(ub,.012,METAL(0xc58a4a,.3),RBg,8);
  var rbl=new T.Mesh(new T.CylinderGeometry(.2,.2,.9,28,1,false,PI*.6,PI*.8),new T.MeshStandardMaterial({color:0xe8a43a,transparent:true,opacity:.0,depthWrite:false})); rbl.rotation.z=PI/2; RBg.add(rbl);
  kTube(R,[[CX,Y0-.12,0],[CX,.25,0],[.35,.25,0],[.35,.33,.15]],.035,k.ss,{fl:[true,true]}); kTube(R,[[.35,.77,.15],[.35,.95,.15],[CX+CR+.02,.95,.0]],.06,k.ss,{fl:[true,true],rb:.1});
  kTube(R,[[-.33,.55,.15],[-.33,1.05,.15],[-.33,1.05,-.85],[-.72,1.05,-.85]],.03,k.ss,{ins:true,fl:[true,false]}); kTube(R,[[-.72,1.05,-.85],[-1.5,1.05,-.85]],.03,k.ss,{fl:false}); kTube(R,[[-1.5,1.05,-.85],[-1.95,1.05,-.85]],.03,k.ss,{ins:true,fl:false}); kCVS(R,'FCV-402',.03,-1.11,1.05,-.85,'x',{up:.2,span:.36}); kBL(R,[-1.95,1.05,-.85],[-1,0,0],.03,'LP STEAM IN','#5d6670'); kTrap(R,-1.55,1.05-.05,-.85,.2);
  kTube(R,[[-.28,.4,.15],[-.28,.2,.15],[-.28,.2,.95]],.016,k.ss,{fl:[true,false]}); var trp=new T.Group(); trp.position.set(-.28,.2,.55); R.add(trp); cyl(.035,.035,.05,M(0x5d6670,{metalness:.6,roughness:.4}),0,0,0,trp,14); cylZ(.024,.06,k.ss2,0,0,0,trp,12); kBL(R,[-.28,.2,.95],[0,0,1],.016,'CONDENSATE','#5d6670');
  /* overhead vapour -> condenser -> reflux drum -> pump -> FT/FCV -> column */
  kTube(R,[[CX,Y0+H+.08,0],[CX,3.45,0],[.6,3.45,0],[.6,2.97,0]],.06,k.ss,{fl:[true,true],rb:.14});
  var Cdg=new T.Group(); Cdg.position.set(.6,2.78,0); R.add(Cdg); cylX(.16,.9,k.ss,0,0,0,Cdg,28); [-.46,.46].forEach(function(x){ cylX(.19,.04,k.ss2,x,0,0,Cdg,28); var e=sph(.16,k.ss,x*1.1,0,0,Cdg,20,10); e.scale.x=.4; });
  [[-.28,-.6],[.28,-.6]].forEach(function(q){ kBeam(R,[.6+q[0],0,-.25],[.6+q[0],2.6,-.25],.08,.06,PAINT(0x3b4a5c,.5)); kBeam(R,[.6+q[0],2.6,-.25],[.6+q[0],2.6,.25],.08,.06,PAINT(0x3b4a5c,.5)); }); box(.7,.03,.5,PAINT(0x3b4a5c,.5),.6,2.6,0,R);
  kTube(R,[[.85,2.94,0],[.85,3.2,0],[1.8,3.2,0]],.035,PAINT(0x2f8ce0,.4),{fl:[true,false]}); kTube(R,[[.35,2.62,0],[.35,2.35,.0],[1.8,2.35,0]],.035,PAINT(0x13A89E,.4),{fl:[true,false],sup:false}); kBL(R,[1.8,3.2,0],[1,0,0],.035,'CW RETURN','#1f6fb8'); kBL(R,[1.8,2.35,0],[1,0,0],.035,'CW SUPPLY','#0B7C74'); kHV(R,.035,1.5,2.35,0,0); kHV(R,.035,1.5,3.2,0,0);
  kTube(R,[[.95,2.62,0],[.95,1.66,0]],.03,k.ss,{fl:[true,true]});
  var Dg=new T.Group(); Dg.position.set(.95,1.45,0); R.add(Dg); cylX(.18,.7,k.ss,0,0,0,Dg,28); [-.35,.35].forEach(function(x){ var e=sph(.18,k.ss,x,0,0,Dg,20,12); e.scale.x=.4; box(.05,1.25,.05,k.navy,x*.8,-.8,0,Dg); box(.12,.01,.12,k.navy,x*.8,-1.44,0,Dg); });
  var lt=kLT(Dg,'LT-401',55,.15,.18,0); up.push(lt.update);
  var pu=kPump2(R,1.15,.75,PI/2,.62); var suc=kWorld(pu.group,pu.suc), dis=kWorld(pu.group,pu.dis);
  kTube(R,[[.95,1.27,0],[.95,.55,0],[suc.x,.55,0],[suc.x,suc.y,0],[suc.x,suc.y,suc.z]],.026,k.ss,{fl:[true,true],rb:.07}); kHVv(R,.026,.95,.85,0,PI/2);
  var RY=.5, RZ=1.3; kTube(R,[[dis.x,dis.y,dis.z],[dis.x,RY,dis.z],[dis.x,RY,RZ],[-1.3,RY,RZ],[-1.3,RY,-.38],[-1.3,2.85,-.38],[-.85,2.85,-.38],[-.85,2.85,-.13]],.022,k.ss,{fl:[true,true],rb:.08}); kNRV(R,.022,dis.x,dis.y+.065,dis.z,0,PI/2); kHV(R,.022,dis.x,RY,(dis.z+RZ)/2,PI/2);
  var fm=kCoriolis(R,'FT-402',.022,.85,RY,RZ,0,'kg/h',840); up.push(fm.update); kCVS(R,'FCV-401',.022,.22,RY,RZ,'x',{up:.17}); sph(.028,k.ss2,dis.x,RY,RZ,R,12,8); kTube(R,[[dis.x,RY,RZ],[1.85,RY,RZ]],.018,k.ss,{fl:false}); kHV(R,.018,1.55,RY,RZ,0); kBL(R,[1.85,RY,RZ],[1,0,0],.018,'PRODUCT TO STORAGE','#9A5F12'); [[-.6,RZ],[-1.3,.5],[-1.3,-.1]].forEach(function(q){ kPipeSupport(R,new T.Vector3(q[0],RY,q[1]),new T.Vector3(q[0]===-1.3?0:1,0,q[0]===-1.3?1:0),.022); });
  /* instruments */
  var t1=kTT(R,'TT-401',78.4,CX+Math.sin(face+.6)*(CR+.02),Y0+H-.25,Math.cos(face+.6)*(CR+.02)); t1.group.rotation.z=0; up.push(t1.update);
  var t2=kTT(R,'TT-402',98.0,CX+Math.sin(face+.6)*(CR+.02),Y0+.25,Math.cos(face+.6)*(CR+.02)); up.push(t2.update);
  var pt=kPT(R,'PT-401','bar',.12,CX-.12,Y0+H+.09,.1); up.push(pt.update);
  var PX=1.45,PZ=1.95, op=kOpPanel2(R,PX,PZ,faceTo(PX,PZ,CAM),drawTrayProfile(),'TRIONIX','DISTILLATION · C-401'); up.push(op.update);
  var TR={z:-1.15,y:.3}, E=[PX,.13,PZ]; kTray(R,[-1.95,TR.z],[1.75,TR.z],TR.y,.2); kBranch(R,PX,TR.z,PZ,TR.y);
  var t1p=t1.group.position, t2p=t2.group.position;
  var sig=[kRun(R,[t1p.x,t1p.y+.06,t1p.z],[[t1p.x,t1p.y+.06,t1p.z+.2],[CX-.55,t1p.y+.06,t1p.z+.2],[CX-.55,t1p.y,-.5]],TR,E,0x13A89E,-.05),kRun(R,[t2p.x,t2p.y+.06,t2p.z],[[t2p.x,.5,t2p.z+.3]],TR,E,0x2f8ce0,-.02),
    kRun(R,[.85,RY+.1,RZ],[[.85,RY+.24,RZ-.12]],TR,E,0x7a5cff,.02),kRun(R,[.22,RY+.16,RZ],[[.22,RY+.3,RZ-.12]],TR,E,0xF2A541,.05),kRun(R,[-1.11,1.21,-.85],[[-1.11,1.35,-.95]],TR,E,0xE8891E,-.08),kRun(R,[1.1,1.72,0],[[1.1,1.72,-.5]],TR,E,0x13A89E,.07)];
  var tA=[t1p.x,t1p.y+.1,t1p.z];
  iLab(R,'TT-401 · top temperature',[CX-.65,Y0+H-.1,.75],'#13A89E',lp,tA); iLab(R,'Condenser E-403',[1.45,3.0,.5],'#2f8ce0',lp,[.75,2.9,.1]); iLab(R,'Reflux return',[-1.75,2.35,.2],'#9A5F12',lp,[-1.3,2.2,-.38]); iLab(R,'Reflux drum D-404 · LT-401',[1.25,2.05,.55],'#0B2545',lp,[1.1,1.6,0]); iLab(R,'FCV-401 · reflux control',[-.25,1.05,1.75],'#F2A541',lp,[.22,RY+.12,RZ]); iLab(R,'FT-402 · reflux mass flow',[.95,1.15,1.8],'#7a5cff',lp,[.85,RY+.08,RZ]); iLab(R,'FCV-402 · steam to reboiler',[-1.55,1.65,-.4],'#E8891E',lp,[-1.11,1.2,-.85]); iLab(R,'Kettle reboiler E-402',[.55,1.1,.75],'#0B2545',lp,[.4,.75,.3]);
  iLab(R,'Sieve trays with downcomers',[CX+.75,2.1,.55],'#13A89E',li,[CX+.1,2.08,.1]); iLab(R,'Liquid on tray · vapour bubbling',[CX+.8,1.55,.7],'#9A5F12',li,[CX+.05,1.48,.08]); iLab(R,'Reboiler U-tube bundle',[.5,1.0,.75],'#0B2545',li,[.35,.55,.25]); iLab(R,'Reflux enters top tray',[CX-.7,2.6,.6],'#E8891E',li,[-.85,2.85,-.13]);
  var flows=[kFlow(R,[[CX,Y0+H+.12,0],[CX,3.49,0],[.6,3.49,0],[.6,3.0,0]],0xffd28a,4,.3),kFlow(R,[[dis.x,RY+.04,RZ],[-1.3,RY+.04,RZ],[-1.3,RY+.04,-.38],[-1.3,2.89,-.38],[-.85,2.89,-.38]],0xe8a43a,6,.2)];
  return ind3(st,R,{cam:CAM,look:[0,1.7,.15],camIn:[CX+Math.sin(face)*2.55,2.05,Math.cos(face)*2.55],lookIn:[CX+.25,1.65,.1],op:op,shadow:3.4,
    update:indRun2(st,{up:up,sig:sig,flows:flows,lp:lp,li:li,cuts:[col,rb],spin:[[pu.spin,14,'x']],extra:function(dt,t,v){ rbl.material.opacity=.6*v.cut; bub.forEach(function(b){ var u=(b.o+t*.18)%1; b.s.position.set(Math.cos(b.a+t)*b.r,Y0+.15+u*(H-.3),Math.sin(b.a+t)*b.r*.6+.08); }); }})});
};

/* ---------- 5. BOILER HOUSE: 3-pass package (smoke-tube) boiler ---------- */
IND.boiler=function(st){
  var R=new T.Group(); st.scene.add(R); softFloor(R,4.0,{cells:18,shadow:.22}); var k=km(), up=[], lp=[], li=[], CAM=[3.2,2.4,3.6];
  var SY=.95, SR=.62, L=2.2; var clad=new T.MeshStandardMaterial({color:0xd9dfe5,metalness:.8,roughness:.3});
  var Bg=new T.Group(); Bg.position.set(0,SY,0); R.add(Bg); var shell=kHShell(Bg,{r:SR,L:L,m:clad,headK:.06});
  var bandF=new T.Group(); Bg.add(bandF); for(var x=-.9;x<=.9;x+=.45){ var bb=tor(SR+.003,.006,METAL(0xb7bec6,.35),x,0,0,Bg,PI); bb.rotation.set(0,PI/2,-PI/2); var bf=tor(SR+.003,.006,METAL(0xb7bec6,.35),x,0,0,bandF,PI); bf.rotation.set(0,PI/2,PI/2); }
  [-.75,.75].forEach(function(x){ box(.14,SY-SR+.12,1.0,k.navy,x,(SY-SR+.12)/2,0,R); box(.24,.02,1.1,k.navy,x,.01,0,R); });
  /* inside: corrugated furnace tube + flame, 2nd & 3rd pass smoke tubes, water */
  var FTg=new T.Group(); FTg.position.set(0,-.12,0); Bg.add(FTg); var furn=kHShell(FTg,{r:.24,L:L-.05,m:METAL(0x6f7780,.45),inner:0x3a3f45,headK:.02}); var corF=new T.Group(); FTg.add(corF); for(var cx=-.95;cx<=.95;cx+=.1){ var cb=tor(.245,.012,METAL(0x6f7780,.45),cx,0,0,FTg,PI); cb.rotation.set(0,PI/2,-PI/2); var cf=tor(.245,.012,METAL(0x6f7780,.45),cx,0,0,corF,PI); cf.rotation.set(0,PI/2,PI/2); }
  var tb2=[],tb3=[],ix,iy,zz,yy; for(ix=0;ix<7;ix++) for(iy=0;iy<2;iy++){ zz=-.42+ix*.14; yy=.18+iy*.1; if(Math.abs(zz)<.2&&iy===0) continue; tb2.push([[-L/2+.05,yy-.05,zz],[L/2-.05,yy-.05,zz]]); }
  for(ix=0;ix<6;ix++) for(iy=0;iy<2;iy++){ zz=-.36+ix*.144; yy=.36+iy*.08; tb3.push([[-L/2+.05,yy,zz],[L/2-.05,yy,zz]]); }
  var tg=new T.Group(); Bg.add(tg); irods(tb2,.026,METAL(0x7f8a96,.4),tg,10); irods(tb3,.022,METAL(0x6f7983,.4),tg,10); [-L/2+.04,L/2-.04].forEach(function(xx){ var ts=new T.Mesh(new T.CircleGeometry(SR-.02,40,PI/2,PI),new T.MeshStandardMaterial({color:0x8a949e,metalness:.6,roughness:.4,side:T.DoubleSide})); ts.rotation.y=PI/2; ts.position.x=xx; tg.add(ts); });
  var wr=SR-.01, wl=.48, th1=Math.asin(wl/wr), th2=PI-th1, wsh=new T.Shape(); wsh.moveTo(wr*Math.cos(th2),wl); wsh.absarc(0,0,wr,th2,th1+2*PI,false); wsh.lineTo(wr*Math.cos(th2),wl);
  var wg=new T.ExtrudeGeometry(wsh,{depth:L-.06,bevelEnabled:false,curveSegments:32}); wg.translate(0,0,-(L-.06)/2); var wm=new T.MeshPhysicalMaterial({color:0x3a8fd6,transparent:true,opacity:0,roughness:.1,clearcoat:1,depthWrite:false}); var wat=new T.Mesh(wg,wm); wat.rotation.y=PI/2; wat.__noShadow=true; Bg.add(wat);
  var fl2=new T.Group(); FTg.add(fl2); var fx2=kFire(fl2,0,0,.16,.16,0,1.6); fl2.rotation.z=PI/2; fl2.position.x=L/2-.12;
  /* front: smoke box doors, burner, fuel train; rear door */
  var fx=L/2+.06; cylX(SR+.02,.12,k.navy,fx,SY,0,R,48); [-1,1].forEach(function(s){ var dr=new T.Mesh(new T.CylinderGeometry(SR*.92,SR*.92,.05,40,1,false,s>0?0:PI,PI),k.navy); dr.rotation.z=PI/2; dr.position.set(fx+.08,SY,0); R.add(dr); cylX(.02,.07,k.ss2,fx+.12,SY,s*SR*.75,R,8); });
  var bu=new T.Group(); bu.position.set(fx+.34,SY-.12,0); R.add(bu); rbox(.36,.42,.44,.04,PAINT(0xc8312e,.4),.05,0,0,bu); cylX(.15,.14,PAINT(0xc8312e,.4),-.18,0,0,bu,24); kMotor2(bu,.12,.32,0,.5,PAINT(0xc8312e,.4),PI/2); rbox(.14,.1,.08,.01,M(0xe7eaee),.1,-.12,.23,bu);
  var gt=[[fx+.45,.25,-.7],[fx+.45,.25,-.5],[fx+.45,SY-.25,-.5],[fx+.45,SY-.25,-.25]]; kTube(R,gt,.022,k.yel,{fl:[false,false]}); kBL(R,gt[0],[0,0,-1],.022,'FUEL GAS IN','#9A7A12'); kBV(R,'XV-503',.022,fx+.45,.25,-.62,PI/2); kBV(R,'XV-504',.022,fx+.45,.55,-.5,0);
  cylX(SR+.02,.1,k.navy,-L/2-.05,SY,0,R,48); cylX(.07,.06,k.ss2,-L/2-.13,SY-.12,0,R,16);
  /* chimney from front smoke box + O2 analyser */
  var CHX=fx-.14, chm=PAINT(0x7b858f,.5), hy0=SY+SR-.05; rbox(.36,.22,.5,.02,chm,CHX,hy0+.11,0,R); box(.4,.02,.54,PAINT(0x5d6670,.5),CHX,hy0+.225,0,R); [[-1,0],[1,0]].forEach(function(q){ box(.012,.18,.012,PAINT(0x5d6670,.5),CHX+q[0]*.181,hy0+.11,.0,R); }); cyl(.17,.23,.16,chm,CHX,hy0+.315,0,R,32); var ring=function(y){ cyl(.2,.2,.022,PAINT(0x5d6670,.5),CHX,y,0,R,36); var bl=[]; for(var i=0;i<12;i++){ var a=i/12*PI*2; bl.push([CHX+Math.cos(a)*.185,y+.016,Math.sin(a)*.185]); } icyl(bl,.006,.014,METAL(0x9aa1a8,.35),R,6); }; ring(hy0+.4); ring(hy0+.62); var dmp=new T.Group(); dmp.position.set(CHX,hy0+.52,0); R.add(dmp); cyl(.175,.175,.12,chm,0,0,0,dmp,32); cylZ(.012,.42,k.ss2,0,0,0,dmp,8); box(.03,.14,.012,k.org,0,-.04,.215,dmp).rotation.z=.5; rbox(.07,.06,.05,.008,k.act,.1,.06,.2,dmp); cyl(.165,.165,3.9-hy0-.58,chm,CHX,(3.9+hy0+.58)/2,0,R,36); [2.45,3.25].forEach(function(gy){ ring(gy); }); cyl(.04,.04,.08,k.ss2,CHX+.17,2.85,0,R,10).rotation.z=PI/2; var cap=cyl(.02,.3,.16,chm,CHX,4.05,0,R,32); [0,1,2,3].forEach(function(i){ var a=i*PI/2+PI/4; rod([CHX+Math.cos(a)*.16,3.86,Math.sin(a)*.16],[CHX+Math.cos(a)*.24,3.98,Math.sin(a)*.24],.008,k.ss2,R,6); }); cyl(.05,.05,.04,k.ss2,CHX,2.1,-.17,R,12).rotation.x=PI/2;
  var atg=new T.Group(); atg.position.set(CHX,2.1,.2); R.add(atg); cylZ(.025,.12,k.ss2,0,0,-.04,atg,10); rbox(.12,.12,.08,.01,k.org,0,0,.08,atg); var o2=screen(96,48,function(g,t,w,h){ g.fillStyle='#0d1a14'; g.fillRect(0,0,w,h); g.fillStyle='#7dff9a'; g.font='700 22px '+MONO; g.fillText('O₂ '+(3.6+Math.sin(t*.6)*.1).toFixed(1)+'%',6,32); },4); var o2p=new T.Mesh(new T.PlaneGeometry(.09,.045),screenMat(o2)); o2p.position.set(0,.01,.121); atg.add(o2p); var tp=tagPlate('AT-501'); tp.position.set(0,-.045,.121); atg.add(tp); up.push(function(t){ o2.update(t); });
  /* top mountings: MSSV, 2 safety valves, PT, gauge; level column + LT */
  kNozzle(R,[.2,SY+SR-.02,0],[0,1,0],.06,.12); kHV(R,.06,.2,SY+SR+.2,0,PI/2); kTube(R,[[.2,SY+SR+.2,-.08],[.2,SY+SR+.2,-1.0],[.2,2.3,-1.0],[-1.9,2.3,-1.0]],.06,k.ss,{ins:true,sup:true,fl:[true,false],rb:.14}); kTrap(R,-1.6,2.3-.09,-1.0,.25); var ft=kVortex(R,'FT-501',.06,-.9,2.3,-1.0,0,'t/h',2.05); kBL(R,[-1.9,2.3,-1.0],[-1,0,0],.06,'STEAM TO HEADER →','#5d6670'); up.push(ft.update);
  [[-.45,.18],[-.15,-.18]].forEach(function(q){ var sv=new T.Group(); sv.position.set(q[0],SY+SR-.01,q[1]); R.add(sv); cyl(.05,.06,.08,k.ss2,0,.04,0,sv,14); kFlange(sv,new T.Vector3(0,.08,0),new T.Vector3(0,1,0),.045); cyl(.045,.045,.2,PAINT(0xc8312e,.4),0,.19,0,sv,14); cyl(.025,.03,.08,k.ss2,0,.33,0,sv,10); rod([0,.36,0],[.15,.34,0],.01,k.ss2,sv); kTube(sv,[[.07,.12,0],[.24,.12,0],[.24,.78,0]],.026,k.ss2,{fl:[true,false]});  });
  var pt=kPT(R,'PT-501','kg/cm²',10.3,.55,SY+SR-.03,.1); up.push(pt.update); kGauge(R,.72,SY+SR+.2,.1,0,'kg/cm²');
  var lc=new T.Group(); lc.position.set(.7,SY,SR+.2); R.add(lc); cyl(.055,.055,.72,k.ss2,0,0,0,lc,18); kTube(lc,[[0,.3,0],[0,.3,-.2]],.02,k.ss2,{fl:[false,true]}); kTube(lc,[[0,-.3,0],[0,-.3,-.2]],.02,k.ss2,{fl:[false,true]}); rbox(.05,.42,.04,.01,k.ss2,.09,0,0,lc); var lvl=box(.026,.2,.045,GLOW(0x13A89E,.9),.09,-.05,0,lc); for(var e=0;e<3;e++){ cyl(.012,.012,.08,k.ss2,-.02+e*.02,.4,0,lc,8); cyl(.016,.016,.03,k.black,-.02+e*.02,.45,0,lc,10); }
  var lt=kPT(R,'LT-501','%',52.0,1.0,.3,SR+.2); up.push(lt.update); kTube(R,[[.7,SY+.3,SR+.2],[.95,SY+.3,SR+.2],[.95,.48,SR+.2]],.005,k.ss2,{fl:false}); kTube(R,[[.7,SY-.3,SR+.2],[1.05,SY-.3,SR+.2],[1.05,.48,SR+.2]],.005,k.ss2,{fl:false});
  kDataPlate(R,['BOILER B-01 · 3-PASS','2 TPH · 10.5 kg/cm²','IBR REGD.'],-.75,.3,.505,0,.2);
  /* feed water tank + pumps + FT + FCV + NRV -> shell */
  var FTk=new T.Group(); FTk.position.set(-.6,1.3,-1.45); R.add(FTk); cylX(.3,1.2,PAINT(0xe4e8ec,.35),0,0,0,FTk,32); [-.6,.6].forEach(function(x2){ var en=sph(.3,PAINT(0xe4e8ec,.35),x2,0,0,FTk,24,12); en.scale.x=.35; box(.06,1.0,.06,k.navy,x2*.8,-.6,0,FTk); box(.14,.01,.14,k.navy,x2*.8,-1.29,0,FTk); }); kLT(FTk,'LT-502',70,.2,.3,0);
  var p1=kPump2(R,-1.0,-.75,0,.58), p2=kPump2(R,-.2,-.75,0,.58); var s1=kWorld(p1.group,p1.suc), s2=kWorld(p2.group,p2.suc), d1=kWorld(p1.group,p1.dis), d2=kWorld(p2.group,p2.dis); [s1,s2].forEach(function(ss){ kHVv(R,.026,ss.x+.1,.38,-1.45,0); });
  kTube(R,[[-.6,1.0,-1.45],[-.6,.55,-1.45],[s2.x+.1,.55,-1.45],[s2.x+.1,s2.y,-1.45],[s2.x+.1,s2.y,s2.z],[s2.x,s2.y,s2.z]],.026,k.water,{fl:[true,true],rb:.06}); kTube(R,[[-.6,.55,-1.45],[s1.x+.1,.55,-1.45],[s1.x+.1,s1.y,-1.45],[s1.x+.1,s1.y,s1.z],[s1.x,s1.y,s1.z]],.026,k.water,{fl:[false,true],rb:.06});
  var FY=.82; kTube(R,[[d1.x,d1.y,d1.z],[d1.x,FY,d1.z],[.95,FY,d1.z],[.95,SY,d1.z],[.95,SY,-SR-.01]],.022,k.water,{fl:[true,false],rb:.07}); kTube(R,[[d2.x,d2.y,d2.z],[d2.x,FY,d2.z]],.022,k.water,{fl:[true,false]}); sph(.03,k.water,d2.x,FY,d2.z,R,12,8); kNozzle(R,[.95,SY,-SR+.03],[0,0,-1],.022,.05); kNRV(R,.022,.95,FY+.08,d1.z,0,PI/2);[d1,d2].forEach(function(dd){ kNRV(R,.022,dd.x,dd.y+.13,dd.z,0,PI/2); kHVv(R,.022,dd.x,dd.y+.3,dd.z,PI/2); });
  var ff=kMag(R,'FT-502',.022,.05,FY,d1.z,0,'t/h',2.0); kCVS(R,'FCV-501',.022,.52,FY,d1.z,'x',{up:.17}); up.push(ff.update);
  var PX=1.95,PZ=1.15, op=kOpPanel2(R,PX,PZ,faceTo(PX,PZ,CAM),drawCombustion(),'TRIONIX','BOILER PANEL · B-01'); up.push(op.update);
  var TR={z:-1.15,y:.3}, E=[PX,.13,PZ]; kTray(R,[-1.95,TR.z],[2.1,TR.z],TR.y,.2); kBranch(R,PX,TR.z,PZ,TR.y);
  var sig=[kRun(R,[.55,SY+SR+.15,.1],[[.55,SY+SR+.3,.1],[.55,SY+SR+.3,-.85]],TR,E,0x13A89E,-.05),kRun(R,[1.0,.4,SR+.2],[[1.3,.4,SR+.2],[1.3,.4,.0]],TR,E,0x2f8ce0,-.02),kRun(R,[.52,FY+.16,d1.z],[[.52,FY+.3,d1.z-.12]],TR,E,0xF2A541,.02),kRun(R,[.05,FY+.12,d1.z],[[.05,FY+.12,d1.z-.1]],TR,E,0x7a5cff,.0),kRun(R,[CHX,2.04,.3],[[CHX+.2,1.98,.06],[CHX+.2,hy0+.3,.06],[CHX+.34,hy0+.3,.06]],TR,E,0xE8891E,.05),kRun(R,[fx+.4,SY+.3,.2],[[fx+.7,SY+.3,.2]],TR,E,0x7a5cff,.07)];
  iLab(R,'PT-501 · steam pressure',[.85,2.05,.55],'#13A89E',lp,[.55,SY+SR+.15,.1]); iLab(R,'LT-501 · drum level (3-element)',[1.45,.95,1.1],'#2f8ce0',lp,[1.0,.45,SR+.22]); iLab(R,'FCV-501 · feed water control',[.75,1.55,-.3],'#F2A541',lp,[.52,FY+.25,d1.z]); iLab(R,'AT-501 · O₂ trim',[CHX+.6,2.5,.45],'#E8891E',lp,[CHX,2.1,.3]); iLab(R,'Stack damper',[CHX+.75,1.95,-.2],'#0B2545',lp,[CHX+.1,hy0+.58,.2]); iLab(R,'Modulating burner',[fx+.75,1.45,.4],'#c8312e',lp,[fx+.34,SY+.1,.2]); iLab(R,'FT-501 · steam flow',[-.9,2.75,-.6],'#0B2545',lp,[-.9,2.4,-1.0]); iLab(R,'Feed pumps · VFD',[-.75,.85,-.35],'#0B2545',lp,[-.6,.35,-.75]);
  iLab(R,'Corrugated furnace tube · 1st pass',[.3,1.55,.95],'#E8891E',li,[.2,SY-.12,.2]); iLab(R,'2nd pass smoke tubes',[-.35,1.75,.95],'#0B2545',li,[-.3,SY+.15,.35]); iLab(R,'3rd pass smoke tubes',[-.8,2.0,.85],'#0B2545',li,[-.6,SY+.36,.25]); iLab(R,'Water level',[-1.05,1.55,.9],'#2f8ce0',li,[-.8,SY+.48,.4]); iLab(R,'Rear reversal chamber',[-1.35,1.2,.75],'#0B2545',li,[-L/2-.02,SY,.2]);
  var flows=[kFlow(R,[[.2,SY+SR+.26,-.08],[.2,SY+SR+.26,-1.0],[.2,2.36,-1.0],[-1.9,2.36,-1.0]],0x8fc7f2,6,.25)];
  return ind3(st,R,{cam:CAM,look:[.2,1.0,-.1],camIn:[1.35,1.95,3.25],lookIn:[-.1,.95,0],op:op,shadow:3.2,
    update:indRun2(st,{up:up,sig:sig,flows:flows,lp:lp,li:li,cuts:[shell],spin:[[p1.spin,14,'x'],[p2.spin,14,'x']],extra:function(dt,t,v){ var c=v.cut; furn.setCut(c); corF.visible=c<.15; bandF.visible=c<.15; wm.opacity=.45*c; wat.visible=c>.02; FTg.visible=true; fx2(t,.25+.75*Math.max(c,.0)); lvl.scale.y=.9+.1*Math.sin(t*.8); }})});
};

/* ---------- 6. TEXTILE: HTHP soft-flow dyeing machine ---------- */
IND.textile=function(st){
  var R=new T.Group(); st.scene.add(R); softFloor(R,4.0,{cells:18,shadow:.22}); var k=km(), up=[], lp=[], li=[], CAM=[2.75,2.65,4.45], doors=[];
  var VY=1.05, VR=.52, VL=2.1; var Vg=new T.Group(); Vg.position.set(0,VY,0); R.add(Vg); var ves=kHShell(Vg,{r:VR,L:VL,m:k.ss,headK:.35});
  [-.75,0,.75].forEach(function(x){ box(.1,VY-.25,.12,k.ss2,x,(VY-.25)/2-VY,-.3,Vg); box(.1,VY-.25,.12,k.ss2,x,(VY-.25)/2-VY,.3,Vg); box(.14,.012,.16,k.ss2,x,.006-VY,-.3,Vg); box(.14,.012,.16,k.ss2,x,.006-VY,.3,Vg); });
  /* two loading doors with windows on the front (fade with the cut) */
  var fc=cnv(64,64),fx=fc.getContext('2d'); fx.fillStyle='#b2203a'; fx.fillRect(0,0,64,64); for(var i=0;i<16;i++){ fx.fillStyle=i%2?'#c8314d':'#9a1830'; fx.fillRect(0,i*4,64,2); } var ftx=new T.CanvasTexture(fc); ftx.wrapS=ftx.wrapT=T.RepeatWrapping; ftx.repeat.set(1,6); ftx.encoding=T.sRGBEncoding;
  [-.5,.5].forEach(function(dx){ var d=new T.Group(); d.position.set(dx,.08,VR+.005); ves.front.add(d); doors.push(d); cylZ(.24,.06,k.ss2,0,0,.02,d,32); tor(.24,.02,k.ss2,0,0,.05,d); var gw=new T.Mesh(new T.CircleGeometry(.17,28),new T.MeshPhysicalMaterial({color:0xcfe6f2,transparent:true,opacity:.4,roughness:.05,clearcoat:1})); gw.position.z=.056; d.add(gw); var fb=new T.Mesh(new T.CircleGeometry(.17,28),new T.MeshStandardMaterial({map:ftx,roughness:.85})); fb.position.z=.03; d.add(fb);
    for(var b=0;b<8;b++){ var a=b/8*PI*2; cylZ(.012,.06,k.ss2,Math.cos(a)*.27,Math.sin(a)*.27,.04,d,8); } box(.06,.03,.05,k.ss2,.27,0,.05,d); });
  /* winch housings + transport tubes over the top */
  var reels=[]; [-.5,.5].forEach(function(dx){ var w=new T.Group(); w.position.set(dx,VR+.12,.15); Vg.add(w); rbox(.34,.3,.36,.04,k.ss,0,.05,0,w); var rl=new T.Group(); rl.position.set(0,.06,0); w.add(rl); cylX(.11,.28,k.ss2,0,0,0,rl,8); reels.push(rl); var win=new T.Mesh(new T.CircleGeometry(.07,20),new T.MeshPhysicalMaterial({color:0xcfe6f2,transparent:true,opacity:.45,clearcoat:1})); win.position.set(0,.06,.181); w.add(win); kMotor2(w,.32,.06,0,.45,null,0);
    var tc=smooth([[dx,VR+.2,-.05],[dx,VR+.55,-.2],[dx,VR+.45,-.55],[dx,VR*.6,-VR*.95]]); var tube=new T.Mesh(new T.TubeGeometry(tc,30,.085,16,false),k.ss); Vg.add(tube); });
  /* fabric rope plaited in the vessel (inside view) */
  var fab=new T.Group(); Vg.add(fab); var rc=cnv(64,16),rx=rc.getContext('2d'); for(var ri=0;ri<64;ri++){ rx.fillStyle=(ri%8<3)?'#9a1830':((ri%8<6)?'#c8314d':'#b2203a'); rx.fillRect(ri,0,1,16); } var rtx=ctex(rc); rtx.wrapS=rtx.wrapT=T.RepeatWrapping; rtx.repeat.set(70,1); var fm=new T.MeshStandardMaterial({map:rtx,roughness:.9}); [-.5,.5].forEach(function(dx){ var pp=[]; for(var ly=0;ly<3;ly++){ for(var f=0;f<=12;f++){ var u=f/12, xx=dx+(ly%2?(.38-u*.76):(-.38+u*.76)); pp.push([xx,-VR+.12+ly*.075+Math.sin(f*1.7)*.01,(f%2?.3:-.3)*(1-ly*.12)+(ly%2?.03:0)]); } } pp.push([dx+.3,-.05,.0]); pp.push([dx+.05,.22,.12]); pp.push([dx,VR+.06,.15]); var rope=new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pp.map(V),false,'catmullrom',.25),360,.042,10,false),fm); rope.scale.set(1,.75,1); rope.position.y=-.06; fab.add(rope); var nz=new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3([V([dx,VR*.62,-VR*.93]),V([dx,VR*.2,-VR*.7]),V([dx-.15,-.15,-.35]),V([dx-.3,-.28,-.1])]),40,.04,10,false),fm); fab.add(nz); }); fab.visible=false;
  var liqM=new T.MeshPhysicalMaterial({color:0x8a3a55,transparent:true,opacity:0,roughness:.1,clearcoat:1,depthWrite:false}); var wr=VR-.01, wl=-.15, th1=Math.asin(wl/wr), th2=PI-th1, sh=new T.Shape(); sh.moveTo(wr*Math.cos(th2),wl); sh.absarc(0,0,wr,th2,th1+2*PI,false); sh.lineTo(wr*Math.cos(th2),wl); var lg=new T.ExtrudeGeometry(sh,{depth:VL-.06,bevelEnabled:false,curveSegments:28}); lg.translate(0,0,-(VL-.06)/2); var liq=new T.Mesh(lg,liqM); liq.rotation.y=PI/2; Vg.add(liq);
  /* main pump, heat exchanger (split range), addition tank on platform */
  var pu=kPump2(R,-.5,.85,0,.8); var suc=kWorld(pu.group,pu.suc), dis=kWorld(pu.group,pu.dis);
  kTube(R,[[0,VY-VR-.01,0],[0,suc.y,0],[0,suc.y,.85],[suc.x,suc.y,.85]],.06,k.ss,{fl:[true,true],rb:.12}); kHVv(R,.06,0,.37,0,0); var ys=new T.Group(); ys.position.set(0,suc.y,.5); R.add(ys); cylZ(.075,.16,k.ss2,0,0,0,ys,18); var ysb=cyl(.05,.05,.16,k.ss2,0,-.07,.05,ys,14); ysb.rotation.x=.7;
  var HX=new T.Group(); HX.position.set(-1.45,0,.55); R.add(HX); cyl(.15,.15,1.05,k.ss,0,.85,0,HX,28); [.32,1.38].forEach(function(y){ kFlange(HX,new T.Vector3(0,y,0),new T.Vector3(0,1,0),.15); }); var ht=sph(.15,k.ss,0,1.42,0,HX,24,10); ht.scale.y=.4; var hb=sph(.15,k.ss,0,.28,0,HX,24,10); hb.scale.y=-.4; box(.05,.25,.05,k.ss2,-.1,.14,0,HX); box(.05,.25,.05,k.ss2,.1,.14,0,HX);
  kTube(R,[[dis.x,dis.y,dis.z],[dis.x,.62,.85],[-1.45,.62,.85],[-1.45,.62,.71]],.05,k.ss,{fl:[true,true],rb:.1}); var JY=2.42; kTube(R,[[-1.45,1.48,.55],[-1.45,JY,.55],[-1.45,JY,-.2],[.5,JY,-.2],[.5,2.16,-.2]],.05,k.ss,{fl:[true,true],rb:.15}); kTube(R,[[-.5,JY,-.2],[-.5,2.16,-.2]],.05,k.ss,{fl:[false,true]}); sph(.06,k.ss,-.5,JY,-.2,R,14,10); [-.5,.5].forEach(function(dx){ var jn=new T.Group(); jn.position.set(dx,2.1,-.2); R.add(jn); cyl(.07,.09,.1,k.ss2,0,0,0,jn,18); kHVv(R,.05,dx,2.28,-.2,0); }); kPipeSupport(R,new T.Vector3(-1.0,JY,-.2),new T.Vector3(1,0,0),.05);
  kTube(R,[[-1.6,1.2,.55],[-1.9,1.2,.55],[-1.9,1.2,.48]],.024,k.ss,{ins:true,fl:[true,false]}); kTube(R,[[-1.9,1.2,.48],[-1.9,1.2,-.16]],.024,k.ss,{fl:false}); kTube(R,[[-1.9,1.2,-.16],[-1.9,1.2,-.5],[-2.15,1.2,-.5]],.024,k.ss,{ins:true,fl:false}); kCVS(R,'TCV-601A',.024,-1.9,1.2,.16,'z',{up:.2,span:.3}); kBL(R,[-2.15,1.2,-.5],[-1,0,0],.024,'STEAM IN','#5d6670');
  kTube(R,[[-1.6,.75,.55],[-2.05,.75,.55],[-2.05,.75,1.35]],.024,k.water,{fl:[true,false]}); kCVS(R,'TCV-601B',.024,-2.05,.75,.95,'z',{up:.18,span:.28}); kBL(R,[-2.05,.75,1.35],[0,0,1],.024,'CW IN','#0B7C74'); kTube(R,[[-1.45,.32,.55],[-1.45,.2,.55],[-1.45,.2,.95],[-1.75,.2,.95],[-1.75,.2,1.35]],.02,k.ss,{fl:[false,false],rb:.06}); kTrap(R,-1.6,.2-.02,.95,.03); kHV(R,.02,-1.75,.2,1.15,PI/2); kBL(R,[-1.75,.2,1.35],[0,0,1],.02,'COND / CW RETURN','#5d6670');
  kPlatform(R,1.2,1.85,-.45,.45,1.1,{rails:['n','s','e']}); kLadder(R,1.95,0,0,1.1,PI/2); var at=new T.Group(); at.position.set(1.5,1.12,0); R.add(at); var atk=kVessel(at,{r:.2,h:.35,legH:.12,top:'flat',legs:3}); var ash=kAgitator(at,.65,.32,'pitch');
  kTube(R,[[1.5,1.1,0],[1.5,.85,0],[VL/2+.2,.85,0],[VL/2+.05,VY-.2,0]],.02,k.ss,{fl:[true,true],rb:.06}); kBV(R,'XV-602',.02,1.25,.85,0,0); var dpm=new T.Group(); dpm.position.set(1.5,.95,.25); R.add(dpm); rbox(.14,.1,.1,.01,PAINT(0x1f5aa6,.4),0,0,0,dpm);
  /* instruments with correct tags */
  var tt=kTT(R,'TT-601',98.0,-.9,.68,.85,0); up.push(tt.update); var pt=kPT(R,'PT-601','bar',2.1,-.15,VY+VR-.03,-.2); up.push(pt.update); var lt=kPT(R,'LT-601','%',64,-VL/2-.2,.3,-.25); up.push(lt.update); kTube(R,[[-VL/2-.05,VY-.35,-.25],[-VL/2-.2,VY-.35,-.25],[-VL/2-.2,.48,-.25]],.005,k.ss2,{fl:false}); kTube(R,[[-VL/2-.05,VY+.3,-.25],[-VL/2-.28,VY+.3,-.25],[-VL/2-.28,.48,-.25]],.005,k.ss2,{fl:false});
  var dpg=new T.Group(); ves.front.add(dpg); doors.push(dpg); kDataPlate(dpg,['SOFT FLOW J-03','HTHP 140 °C · 3.5 bar','2 chambers · 300 kg'],0,-.3,VR+.006,0,.18);
  var PX=1.75,PZ=1.45, op=kOpPanel2(R,PX,PZ,faceTo(PX,PZ,CAM),drawProgramme(),'TRIONIX','DYEING · J-03'); up.push(op.update);
  var TR={z:-1.2,y:.3}, E=[PX,.13,PZ]; kTray(R,[-2.2,TR.z],[2.0,TR.z],TR.y,.2); kBranch(R,PX,TR.z,PZ,TR.y);
  var sig=[kRun(R,[-.9,.78,.85],[[-.9,.78,1.1],[-.9,.4,1.1]],TR,E,0x13A89E,-.06),kRun(R,[-1.9,1.36,.16],[[-1.75,1.5,.16],[-1.75,1.5,-.75]],TR,E,0xE8891E,-.03),kRun(R,[-2.05,.88,.95],[[-2.3,.95,.95]],TR,E,0x2f8ce0,0),kRun(R,[-.15,VY+VR+.2,-.2],[[-.15,VY+VR+.3,-.2],[-.15,VY+VR+.3,-.7]],TR,E,0x7a5cff,.03),kRun(R,[-VL/2-.2,.42,-.25],[],TR,E,0x7a5cff,.06)];
  iLab(R,'TT-601 · dye bath temperature',[-.75,1.25,1.35],'#13A89E',lp,[-.9,.82,.85]); iLab(R,'TCV-601A · steam (heating)',[-1.55,2.05,.55],'#E8891E',lp,[-1.9,1.38,.16]); iLab(R,'TCV-601B · cooling water',[-1.6,1.25,1.45],'#2f8ce0',lp,[-2.05,.9,.95]); iLab(R,'PT-601 · vessel pressure',[-.15,2.1,-.55],'#7a5cff',lp,[-.15,VY+VR+.18,-.2]); iLab(R,'LT-601 · bath level (DP)',[-VL/2-.35,.85,-.75],'#7a5cff',lp,[-VL/2-.2,.45,-.25]); iLab(R,'Heat exchanger',[-1.45,1.75,.95],'#0B2545',lp,[-1.45,1.3,.6]); iLab(R,'Main circulation pump',[.05,.9,1.3],'#0B2545',lp,[-.05,.45,.85]); iLab(R,'Addition tank · dosing',[1.5,1.95,.35],'#0B2545',lp,[1.5,1.6,0]);
  iLab(R,'Fabric rope in the chamber',[.35,1.2,.95],'#c8314d',li,[.1,VY-.25,.1]); iLab(R,'Winch reel lifts the fabric',[1.0,1.85,.8],'#0B2545',li,[.5,VY+VR+.18,.15]); iLab(R,'Dye liquor level',[-.6,1.25,.95],'#7a2440',li,[-.6,VY-.15,.3]);
  var flows=[kFlow(R,[[dis.x,.66,.85],[-1.45,.66,.85]],0xc8314d,4,.3),kFlow(R,[[-1.45,JY+.04,.55],[-1.45,JY+.04,-.2],[.5,JY+.04,-.2]],0xc8314d,4,.3)];
  return ind3(st,R,{cam:CAM,look:[-.4,1.05,.1],camIn:[.35,1.75,3.0],lookIn:[0,.95,0],op:op,shadow:3.4,
    update:indRun2(st,{up:up,sig:sig,flows:flows,lp:lp,li:li,cuts:[ves],spin:[[pu.spin,14,'x'],[ash,2,'y']],extra:function(dt,t,v){ var c=v.cut; liqM.opacity=.32*c; liq.visible=c>.02; fab.visible=c>.05; doors.forEach(function(d){ d.visible=c<.2; }); rtx.offset.x=-t*.5; reels.forEach(function(r){ r.rotation.x-=dt*2; }); }})});
};

/* ---------- 7. DAIRY: HTST pasteuriser skid (balance tank -> feed pump -> PHE regen/heating -> holding tube -> FDV -> regen/cooling) ---------- */
IND.dairy=function(st){
  var R=new T.Group(); st.scene.add(R); softFloor(R,3.9,{cells:18,shadow:.22}); var k=km(), up=[], lp=[], li=[], CAM=[2.7,2.45,4.0];
  var sq=function(a,b){ kBeam(R,a,b,.05,.05,k.ss2); }; [[-1.55,-.62],[1.55,-.62],[-1.55,.62],[1.55,.62]].forEach(function(c){ sq([c[0],.08,c[1]],[c[0],1.72,c[1]]); cyl(.03,.035,.04,M(0x22262a),c[0],.02,c[1],R,12); }); [.1,1.72].forEach(function(y){ sq([-1.55,y,-.62],[1.55,y,-.62]); sq([-1.55,y,.62],[1.55,y,.62]); sq([-1.55,y,-.62],[-1.55,y,.62]); sq([1.55,y,-.62],[1.55,y,.62]); });
  /* plate heat exchanger: frame plate (product ports) faces +x, pressure plate + end support at -x */
  var ph=new T.Group(); ph.rotation.y=PI; R.add(ph); var frm=PAINT(0x1f5aa6,.4);
  box(.08,1.0,.46,frm,-.42,.62,0,ph); rod([-.46,1.14,0],[1.02,1.14,0],.03,k.ss2,ph); rod([-.46,.18,0],[1.02,.18,0],.022,k.ss2,ph); box(.06,1.08,.1,frm,1.02,.62,0,ph); box(.16,.02,.16,frm,1.02,.01,0,ph);
  var pc=cnv(128,256),px=pc.getContext('2d'); px.fillStyle='#c7ced5'; px.fillRect(0,0,128,256); px.strokeStyle='#9aa3ad'; px.lineWidth=3; for(var yy=-128;yy<256;yy+=10){ px.beginPath(); px.moveTo(10,yy); px.lineTo(64,yy+30); px.lineTo(118,yy); px.stroke(); } px.strokeStyle='#1d2025'; px.lineWidth=7; px.strokeRect(6,6,116,244); [[24,26],[104,26],[24,230],[104,230]].forEach(function(q){ px.fillStyle='#e9edf0'; px.beginPath(); px.arc(q[0],q[1],13,0,PI*2); px.fill(); px.stroke(); }); var ptx=ctex(pc);
  var pm=new T.MeshStandardMaterial({map:ptx,metalness:.65,roughness:.32}); var plates=[], dv=[];
  for(var i=0;i<36;i++){ var pl=new T.Mesh(new T.BoxGeometry(.006,.86,.4),pm); pl.position.set(-.36+i*.021,.62,0); pl.userData.x0=pl.position.x; ph.add(pl); plates.push(pl); if(i===11||i===24){ var cp=box(.04,.92,.44,PAINT(0x9aa3ad,.4),-.36+i*.021+.012,.62,0,ph); dv.push(-.36+i*.021+.012); } }
  var folG=new T.Group(); folG.position.x=.42; ph.add(folG); box(.07,.96,.44,frm,0,.62,0,folG); kNozzle(folG,[0,1.1,.02],[0,1,0],.025,.14); kBL(folG,[0,1.24,.02],[0,1,0],.025,'CHW OUT','#0B7C74');
  var tie=[]; [[-.2,.24],[.2,.24],[-.2,-.24],[.2,-.24]].forEach(function(q){ tie.push([[-.5,.62+q[0]*2.3,q[1]],[.5,.62+q[0]*2.3,q[1]]]); }); var tieM=irods(tie,.012,METAL(0xc9ced4,.3),ph,8);
  /* product ports on the frame plate (world x=.46 face) */
  var PY1=1.0, PY0=.25, ZB=-.17, ZF=.17; [[PY1,ZB],[PY0,ZB],[PY0,ZF],[PY1,ZF]].forEach(function(q){ kNozzle(R,[.46,q[0],q[1]],[1,0,0],.03,.12); });
  var D1=-dv[0], D2=-dv[1]; kNozzle(R,[D1,1.08,.12],[0,1,0],.025,.1); kNozzle(R,[D2,1.08,.12],[0,1,0],.025,.1); kNozzle(R,[D2,1.08,-.02],[0,1,0],.025,.14); kBL(R,[D2,1.22,-.02],[0,1,0],.025,'CHW IN','#0B7C74');
  /* balance tank + feed pump (suction isolation), NRV, FT-701 (vertical, flow up) */
  var BX=-1.3, BZ=.3, BT=new T.Group(); BT.position.set(BX,0,BZ); R.add(BT); kVessel(BT,{r:.2,h:.4,legH:.7,bottom:'cone',top:'flat',legs:3}); sph(.05,M(0xf3f5f7),0,1.0,0,BT,14,10);
  kTube(R,[[BX-.1,1.12,BZ+.06],[BX-.1,1.38,BZ+.06],[-1.85,1.38,BZ+.06]],.022,k.ss,{fl:false}); kBV(R,'XV-701',.022,-1.62,1.38,BZ+.06,0); kBL(R,[-1.85,1.38,BZ+.06],[-1,0,0],.022,'RAW MILK IN','#9A5F12');
  var pu=kPump2(R,BX,-.35,-PI/2,.5); var suc=kWorld(pu.group,pu.suc), dis=kWorld(pu.group,pu.dis);
  kTube(R,[[BX,.43,BZ],[BX,suc.y,BZ],[BX,suc.y,suc.z]],.022,k.ss,{fl:[false,true],rb:.07}); kHVv(R,.022,BX,.3,BZ,PI/2);
  var RY=1.32; kTube(R,[[dis.x,dis.y,dis.z],[dis.x,RY,dis.z],[.72,RY,dis.z],[.72,PY1,dis.z],[.58,PY1,ZB]],.022,k.ss,{fl:[true,true],rb:.07}); kNRV(R,.022,dis.x,dis.y+.08,dis.z,0,PI/2); kHVv(R,.022,dis.x,dis.y+.22,dis.z,0);
  var fm=kMag(R,'FT-701',.022,dis.x,.78,dis.z,PI/2,'L/h',5000); fm.group.rotation.set(0,PI/2,PI/2); up.push(fm.update);
  /* holding tube: rising serpentine on its own stand, TT-701 at the outlet */
  var HZ=-.42, hpts=[[.58,PY0,ZB],[.75,PY0,ZB],[.75,PY0,HZ],[1.4,PY0,HZ]]; for(var hy=.45;hy<=1.26;hy+=.2){ var xa=hpts[hpts.length-1][0]; hpts.push([xa,hy,HZ]); hpts.push([xa>1?.9:1.4,hy,HZ]); } hpts.pop(); hpts.push([1.4,1.25,.06]);
  kTube(R,hpts,.022,k.ss,{fl:[false,true],rb:.1,noweld:false}); [.82,1.48].forEach(function(x){ box(.035,1.32,.035,k.ss2,x,.66,HZ-.06,R); box(.1,.01,.1,k.ss2,x,.005,HZ-.06,R); for(var y=.25;y<1.3;y+=.2) box(.08,.014,.06,k.ss2,x+(x<1?.04:-.04),y,HZ-.03,R); });
  var tt=kTT(R,'TT-701',72.4,1.4,1.25+.03,-.15,0); up.push(tt.update);
  /* flow diversion valve: inlet side, forward = bottom, divert = side back to the balance tank */
  var fdv=new T.Group(); fdv.position.set(1.4,1.16,ZF); R.add(fdv); cyl(.05,.05,.24,k.ss,0,0,0,fdv,18); kFlange(fdv,new T.Vector3(0,-.13,0),new T.Vector3(0,-1,0),.03); rbox(.1,.22,.1,.02,M(0xd9dee3,{metalness:.6,roughness:.3}),0,.25,0,fdv); cyl(.032,.032,.04,k.yel,0,.38,0,fdv,12); var tpf=tagPlate('FDV-701'); tpf.position.set(0,.25,.052); fdv.add(tpf); cylZ(.024,.08,k.ss,0,.08,-.08,fdv,12); cylX(.024,.08,k.ss,.08,-.02,0,fdv,12);
  kTube(R,[[1.4,1.03,ZF],[1.4,PY0,ZF],[.58,PY0,ZF]],.022,k.ss,{fl:[true,true],rb:.08});
  kTube(R,[[1.47,1.14,ZF],[1.64,1.14,ZF],[1.64,1.62,ZF],[1.64,1.62,-.55],[BX,1.62,-.55],[BX,1.62,BZ-.06],[BX,1.13,BZ-.06]],.02,k.ss,{fl:[true,true],rb:.07});
  kTube(R,[[.58,PY1,ZF],[.7,PY1,ZF],[.7,PY1,.85]],.022,k.ss,{fl:[true,false],rb:.07}); kHV(R,.022,.7,PY1,.62,PI/2); kBL(R,[.7,PY1,.85],[0,0,1],.022,'PASTEURISED MILK → STORAGE','#0B2545');
  /* hot water set: tank with steam injection (TCV-702), HW pump -> heating section -> back */
  var HWX=-.45, HWZ=-1.0, HW=new T.Group(); HW.position.set(HWX,0,HWZ); R.add(HW); kVessel(HW,{r:.16,h:.42,legH:.32,top:'dish',legs:3}); kNozzle(R,[HWX+.16,.42,HWZ],[1,0,0],.022,.08);
  var hp=kPump2(R,D1+.151,HWZ,PI,.42); var hs=kWorld(hp.group,hp.suc), hd=kWorld(hp.group,hp.dis);
  kTube(R,[[HWX+.24,.42,HWZ],[HWX+.36,.42,HWZ],[HWX+.36,hs.y,HWZ],[hs.x,hs.y,hs.z]],.022,PAINT(0xc8312e,.4),{fl:[true,true],rb:.05});
  kTube(R,[[hd.x,hd.y,hd.z],[hd.x,1.45,hd.z],[D1,1.45,.12],[D1,1.18,.12]],.02,PAINT(0xc8312e,.4),{fl:[true,true],rb:.07}); kTube(R,[[D2,1.18,.12],[D2,1.5,.12],[D2,1.5,HWZ],[HWX,1.5,HWZ],[HWX,.9,HWZ]],.02,PAINT(0xc8312e,.4),{fl:[true,true],rb:.07});
  var tt2=kTT(R,'TT-702',78.0,hd.x,1.45+.02,-.45,0); up.push(tt2.update);
  kTube(R,[[-1.5,.55,HWZ],[-1.3,.55,HWZ]],.018,k.ss,{ins:true,fl:false}); kTube(R,[[-1.3,.55,HWZ],[HWX-.16,.55,HWZ]],.018,k.ss,{fl:[false,true]}); kCVS(R,'TCV-702',.018,-.98,.55,HWZ,'x',{up:.16,span:.24}); kBL(R,[-1.5,.55,HWZ],[-1,0,0],.018,'STEAM IN','#5d6670');
  kDataPlate(R,['HTST-01 · 5000 L/h','72 °C / 15 s · regen 90 %'],1.55,.55,.645,0,.18);
  var PX=2.0,PZ=1.3, op=kOpPanel2(R,PX,PZ,faceTo(PX,PZ,CAM),drawPastRecord(),'TRIONIX','PASTEURISER · HTST-01'); up.push(op.update);
  var TR={z:-1.38,y:.3}, E=[PX,.13,PZ]; kTray(R,[-1.9,TR.z],[2.15,TR.z],TR.y,.2); kBranch(R,PX,TR.z,PZ,TR.y);
  var sig=[kRun(R,[1.4,1.43,-.15],[[1.4,1.55,-.15],[1.4,1.55,-.7]],TR,E,0x13A89E,-.05),kRun(R,[1.4,1.56,ZF],[[1.55,1.56,ZF-.1],[1.55,1.56,-.7]],TR,E,0xc8312e,-.02),kRun(R,[-.98,.68,HWZ],[[-.98,.8,HWZ-.12]],TR,E,0xE8891E,.02),kRun(R,[dis.x+.07,.78,dis.z],[[dis.x+.07,.62,dis.z-.12],[dis.x+.07,.62,-.75]],TR,E,0x7a5cff,.05),kRun(R,[hd.x,1.65,-.45],[[hd.x+.12,1.65,-.6]],TR,E,0x2f8ce0,.07)];
  iLab(R,'TT-701 · holding tube outlet',[1.85,1.8,.45],'#13A89E',lp,[1.4,1.4,-.15]); iLab(R,'FDV-701 · flow diversion',[1.85,1.25,.75],'#c8312e',lp,[1.4,1.3,ZF+.05]); iLab(R,'TCV-702 · steam to hot water',[-1.0,1.25,-1.4],'#E8891E',lp,[-.98,.66,HWZ]); iLab(R,'Plate heat exchanger',[.15,1.7,.85],'#0B2545',lp,[0,1.0,.2]); iLab(R,'Holding tube · 15 s',[1.5,.5,-.05],'#0B2545',lp,[1.15,.65,HZ]); iLab(R,'Balance tank',[-1.55,.75,.85],'#0B2545',lp,[BX,.85,BZ+.2]); iLab(R,'FT-701 · product flow',[-1.15,1.85,-.6],'#7a5cff',lp,[dis.x,.82,dis.z]); iLab(R,'Hot water set',[-.55,1.15,-1.35],'#c8312e',lp,[HWX,.8,HWZ]);
  iLab(R,'Chevron plates · food-grade gaskets',[-.3,1.3,.85],'#0B2545',li,[-.55,.95,.15]); iLab(R,'Pressure plate slid open',[-.7,.18,.75],'#1f5aa6',li,[-.84,.4,.2]); iLab(R,'Cooling',[-.45,.3,.55],'#2f8ce0',li,[-.4,.4,.15]); iLab(R,'Heating',[-.02,.3,.55],'#E8891E',li,[-.02,.4,.15]); iLab(R,'Regeneration',[.3,.3,.55],'#13A89E',li,[.28,.4,.15]);
  var flows=[kFlow(R,[[dis.x,RY+.04,dis.z],[.72,RY+.04,dis.z]],0xf3f5f7,4,.3),kFlow(R,[[1.4,PY0+.04,ZF],[.58,PY0+.04,ZF]],0xf3f5f7,3,.3),kFlow(R,[[hd.x,1.49,hd.z],[hd.x,1.49,.12]],0xff8a7a,3,.3)];
  return ind3(st,R,{cam:CAM,look:[0,.85,0],camIn:[.15,1.4,2.15],lookIn:[-.45,.7,0],op:op,shadow:3.3,
    update:indRun2(st,{up:up,sig:sig,flows:flows,lp:lp,li:li,spin:[[pu.spin,14,'x'],[hp.spin,14,'x']],extra:function(dt,t,v){ var c=v.cut; folG.position.x=.42+c*.42; plates.forEach(function(pl,i){ if(i>24){ var f=(i-25)/10; pl.position.x=pl.userData.x0+c*(.06+f*.36); pl.rotation.z=0; } }); tieM.visible=c<.1; }})});
};

/* ---------- 8. WATER: pressure filters -> cartridge filter -> HP pump -> 2x3 RO array in series, reject recovery control ---------- */
IND.water=function(st){
  var R=new T.Group(); st.scene.add(R); softFloor(R,4.2,{cells:18,shadow:.22}); var k=km(), up=[], lp=[], li=[], CAM=[3.0,2.75,4.9], cuts=[];
  var frp=k.frp, pvc=PAINT(0xdfe3e8,.35), hpM=k.ss;
  /* MGF + ACF: FRP vessels, multiport valves, backwash drains (cut shows media) */
  var FZ=-.65; [[-1.65,'MGF'],[-1.05,'ACF']].forEach(function(f,fi){ var g=new T.Group(); g.position.set(f[0],0,FZ); R.add(g); var sh=kShell(g,{r:.22,h:.9,y0:.25,bot:'dish',top:'dish',botK:.5,topK:.5,m:frp,face:Math.atan2(CAM[0]-f[0],CAM[2]-FZ)}); cuts.push(sh); cyl(.24,.24,.14,k.black,0,.07,0,g,28);
    sh.media=[]; [[.25,.2,0x6b6159],[.45,.15,0xb59a6a],[.6,.3,fi?0x22262a:0xd9c48f]].forEach(function(ly){ var m=new T.Mesh(new T.CylinderGeometry(.205,.205,ly[1],28),new T.MeshStandardMaterial({color:ly[2],roughness:1,transparent:true,opacity:0})); m.position.y=ly[0]+ly[1]/2; g.add(m); sh.media.push(m); });
    var dl=new T.Mesh(new T.CylinderGeometry(.02,.02,.85,10),pvc); dl.position.y=.72; g.add(dl);
    cyl(.05,.05,.12,k.ss2,0,1.27,0,g,14); rbox(.22,.13,.22,.02,M(0x30363e),0,1.38,0,g); cyl(.07,.07,.06,M(0xd9dee3),0,1.47,0,g,18); kGauge(g,.0,1.38,.112,0,'bar',.7);
    kTube(R,[[f[0],1.38,FZ-.11],[f[0],1.38,FZ-.28],[f[0],.1,FZ-.28]],.022,pvc,{fl:false,rb:.06}); });
  var drn=new T.Mesh(new T.BoxGeometry(1.0,.05,.14),M(0x6c7a8a)); drn.position.set(-1.35,.025,FZ-.28); R.add(drn);
  kTube(R,[[-2.15,1.38,FZ],[-1.76,1.38,FZ]],.024,pvc,{fl:false}); kBL(R,[-2.15,1.38,FZ],[-1,0,0],.024,'RAW WATER IN','#1f6fb8'); kTube(R,[[-1.54,1.38,FZ],[-1.16,1.38,FZ]],.024,pvc,{fl:false});
  /* ACF -> dosing quills -> cartridge filter -> HP pump suction */
  var CF=new T.Group(); CF.position.set(-.55,0,FZ); R.add(CF); var cfs=kShell(CF,{r:.1,h:.55,y0:.3,bot:'dish',top:'flat',m:k.ss,face:.6}); cuts.push(cfs); cyl(.12,.12,.04,k.ss2,0,.87,0,CF,24); cyl(.06,.06,.06,k.ss2,0,.92,0,CF,16); for(var i=0;i<3;i++) cyl(.025,.025,.5,M(0xf1ece0,{roughness:.95}),-.045+i*.045,.58,0,CF,12); box(.05,.3,.05,k.ss2,0,.15,0,CF); kGauge(CF,.0,.78,.105,0,'bar',.55);
  kTube(R,[[-.94,1.38,FZ],[-.76,1.38,FZ],[-.76,.82,FZ],[-.66,.82,FZ]],.024,pvc,{fl:[false,true],rb:.06});
  var HPX=-.3, HPZ=.1; kTube(R,[[-.44,.82,FZ],[HPX,.82,FZ],[HPX,.12,FZ],[HPX,.12,HPZ-.2]],.024,k.ss,{fl:[true,true],rb:.07});
  var quill=[[-.76,1.22,0x13A89E],[-.76,1.08,0xF2A541],[-.76,.94,0xc8312e]];
  [[-1.75,.25,0xF2A541,'ANTISCALANT'],[-1.45,.25,0xc8312e,'SMBS'],[-1.15,.25,0x13A89E,'HCl']].forEach(function(d,di){ var g=new T.Group(); g.position.set(d[0],0,d[1]); R.add(g); cyl(.12,.12,.42,M(0xf2f2ee,{roughness:.6}),0,.21,0,g,24); cyl(.125,.125,.03,PAINT(d[2],.4),0,.43,0,g,24); rbox(.12,.1,.09,.01,PAINT(d[2],.4),0,.5,0,g); cylZ(.025,.02,M(0xe7eaee),0,.52,.05,g,14);
    var q=quill[[1,2,0][di]], qx=-.76+(di-1)*.03; kTube(R,[[d[0]+.06,.5,d[1]],[d[0]+.06,.62+di*.05,d[1]],[d[0]+.06,.62+di*.05,-.32],[qx,.62+di*.05,-.32],[qx,q[1],-.32],[qx,q[1],FZ+.06]],.006,PAINT(d[2],.4),{fl:false,rb:.03}); cylZ(.012,.05,k.ss2,qx,q[1],FZ+.04,R,8); });
  /* HP pump: vertical multistage, suction back / discharge front, NRV + throttling valve */
  var hp=new T.Group(); hp.position.set(HPX,0,HPZ); hp.rotation.y=-PI/2; R.add(hp); rbox(.34,.05,.34,.01,k.ss2,0,.025,0,hp); cyl(.085,.085,.52,k.ss,0,.33,0,hp,24); for(var si=0;si<6;si++) tor(.087,.008,k.ss2,0,.12+si*.09,0,hp).rotation.x=PI/2; cyl(.1,.1,.08,k.ss2,0,.62,0,hp,24); [-1,1].forEach(function(s2){ kNozzle(hp,[s2*.08,.12,0],[s2,0,0],.035,.1); }); var cpl=cyl(.05,.05,.07,k.org,0,.68,0,hp,16); var mb=PAINT(0x2a5c94,.35); cyl(.095,.095,.03,mb,0,.735,0,hp,28); cyl(.085,.085,.3,mb,0,.9,0,hp,28); for(var fi2=0;fi2<14;fi2++){ var fa=fi2/14*PI*2; box(.012,.26,.03,mb,Math.cos(fa)*.09,.9,Math.sin(fa)*.09,hp).rotation.y=-fa; } cyl(.08,.075,.07,M(0x8a949e,{metalness:.5,roughness:.4}),0,1.085,0,hp,24); rbox(.07,.07,.08,.01,mb,0,.92,.11,hp); var hmp=kPlate('TRIONIX','HP-01',.08,.03,true); hmp.position.set(0,.98,.0); hmp.rotation.y=0; hmp.position.z=.093; hp.add(hmp);
  var RX=.9, FY=.42, H1Z=.18, X1=RX+.68, X0=RX-.68; kTube(R,[[HPX,.12,HPZ+.2],[HPX,.12,.45],[HPX,.3,.45],[HPX,.3,.62],[X0,.3,.62],[X0,.3,H1Z],[X0,.505-.085-.04,H1Z]],.024,hpM,{fl:[true,true],rb:.07}); kNRV(R,.024,HPX,.21,.45,PI/2,PI/2); kHV(R,.024,-.15,.3,.62,0,k.yel);
  /* RO array: 6 FRP pressure vessels on H-frame stands, side-port couplings in series */
  var L=1.6, rows=[.505,.805,1.105], memg=new T.Group(); R.add(memg); var cutMem=null;
  kSkid(R,RX-1.0,RX+1.0,-.45,.45,0x1f5aa6); var frm=PAINT(0x1f5aa6,.4); [RX-.45,RX+.45].forEach(function(sx){ [-.36,.36].forEach(function(z){ kBeam(R,[sx,.12,z],[sx,1.32,z],.06,.05,frm); }); rows.forEach(function(y){ kBeam(R,[sx,y-.1,-.38],[sx,y-.1,.38],.04,.05,frm); [-.18,.18].forEach(function(z){ var ub=tor(.092,.007,METAL(0xc9ced4,.3),sx,y,z,R,PI); ub.rotation.set(0,PI/2,0); }); }); kBeam(R,[sx,1.32,-.38],[sx,1.32,.38],.05,.05,frm); });
  rows.forEach(function(y,yi){ [-.18,.18].forEach(function(z){ var g=new T.Group(); g.position.set(RX,y,z); memg.add(g); var hs=kHShell(g,{r:.085,L:L,m:k.frpw,headK:.05});
      if(yi===2&&z>0){ cutMem=hs; var sp=cnv(256,256),sx2=sp.getContext('2d'); sx2.fillStyle='#e9eef2'; sx2.fillRect(0,0,256,256); sx2.strokeStyle='#7f93a6'; sx2.lineWidth=3; sx2.beginPath(); for(var a=0;a<46;a+=.08){ var rr=6+a*2.6; sx2.lineTo(128+Math.cos(a)*rr,128+Math.sin(a)*rr); } sx2.stroke(); sx2.fillStyle='#5d6670'; sx2.beginPath(); sx2.arc(128,128,10,0,PI*2); sx2.fill();
        var lc=cnv(256,64),lx=lc.getContext('2d'); lx.fillStyle='#dfe6ec'; lx.fillRect(0,0,256,64); lx.strokeStyle='#9fb0c0'; lx.lineWidth=2; for(var xx=0;xx<256;xx+=8){ lx.beginPath(); lx.moveTo(xx,0); lx.lineTo(xx+20,64); lx.stroke(); } var ltx=ctex(lc); ltx.wrapS=ltx.wrapT=T.RepeatWrapping; ltx.repeat.set(3,1);
        var el=new T.Mesh(new T.CylinderGeometry(.074,.074,1.0,32),[new T.MeshStandardMaterial({map:ltx,roughness:.7}),new T.MeshStandardMaterial({map:ctex(sp)}),new T.MeshStandardMaterial({map:ctex(sp)})]); el.rotation.z=PI/2; el.position.x=-.2; g.add(el); var el2=el.clone(); el2.position.x=.62; el2.scale.y=.32; g.add(el2); cylX(.012,1.5,PAINT(0x5d6670,.4),0,0,0,g,10); el.visible=el2.visible=false; hs.el=[el,el2]; }
      [-1,1].forEach(function(s2){ cylX(.095,.06,PAINT(0xdfe3e8,.35),s2*.78,0,0,g,28); tor(.095,.008,k.ss2,s2*.78,0,0,g).rotation.y=PI/2; }); cylX(.02,.07,pvc,-.84,0,0,g,12); cylZ(.015,.02,k.ss2,.84,0,0,g,10); }); });
  var cp=function(a,b){ kTube(R,[a,b],.02,hpM,{fl:false}); sph(.026,k.ss2,a[0],a[1],a[2],R,10,8); sph(.026,k.ss2,b[0],b[1],b[2],R,10,8); }; var d=.085;
  cp([X1,rows[0]+d,H1Z],[X1,rows[1]-d,H1Z]); cp([X0,rows[1]+d,H1Z],[X0,rows[2]-d,H1Z]); cp([X1,rows[2],H1Z-d],[X1,rows[2],-H1Z+d]); cp([X0,rows[2]-d,-H1Z],[X0,rows[1]+d,-H1Z]); cp([X1,rows[1]-d,-H1Z],[X1,rows[0]+d,-H1Z]);
  kNozzle(R,[X0,rows[0]-d,H1Z],[0,-1,0],.024,.04); kNozzle(R,[X0,rows[0]-d,-H1Z],[0,-1,0],.022,.04);
  /* reject (concentrate) -> FT-802 -> FCV-802 recovery control -> drain */
  var RJ=-.85; kTube(R,[[X0,rows[0]-d-.04,-H1Z],[X0,.22,-H1Z],[X0,.22,RJ],[2.45,.22,RJ]],.02,hpM,{fl:[true,false],rb:.06}); var f2=kMag(R,'FT-802',.02,1.15,.22,RJ,0,'m³/h',3.4); up.push(f2.update); kCVS(R,'FCV-802',.02,1.8,.22,RJ,'x',{side:-.16,span:.3}); kBL(R,[2.45,.22,RJ],[1,0,0],.02,'REJECT TO DRAIN','#5d6670');
  /* permeate: axial ports -> column headers -> over the top -> FT-801 / AT-801 -> storage */
  [-.18,.18].forEach(function(z){ rows.forEach(function(y){ kTube(R,[[RX-.88,y,z],[RX-.98,y,z]],.014,pvc,{fl:false}); }); kTube(R,[[RX-.98,rows[0],z],[RX-.98,1.25,z]],.018,pvc,{fl:false}); });
  kTube(R,[[RX-.98,1.25,-.18],[RX-.98,1.25,.18]],.018,pvc,{fl:false}); kTube(R,[[RX-.98,1.25,0],[RX-.98,1.45,0],[RX+1.05,1.45,0],[RX+1.05,.5,0],[2.5,.5,0]],.02,pvc,{fl:[false,false],rb:.07}); kBL(R,[2.5,.5,0],[1,0,0],.02,'PERMEATE TO STORAGE','#0B7C74');
  var f1=kMag(R,'FT-801',.02,RX+1.05,.95,0,PI/2,'m³/h',10.2); f1.group.rotation.set(0,PI/2,PI/2); up.push(f1.update); var at=kHead(R,'AT-801','µS/cm',18.4,.4,k.teal); at.position.set(2.25,.6,0); up.push(function(t){ at.userData.lcd.update(t); }); cyl(.012,.012,.08,k.ss2,2.25,.53,0,R,8);
  var pt=kPT(R,'PT-801','bar',12.6,HPX,.3+.03,.45-.0,0); pt.group.position.set(HPX+.0,.3,.53); up.push(pt.update); var pt2=kPT(R,'PT-802','bar',10.9,X0,.3,-H1Z,0); up.push(pt2.update);
  kDataPlate(R,['RO-01 · 2 × 3 ARRAY','10 m³/h · 75 % recovery'],RX,.06,.482,0,.18);
  var vfd=buildVFD(); vfd.group.position.set(-.85,0,.75); R.add(vfd.group); up.push(vfd.update);
  var PX=.95,PZ=1.45, op=kOpPanel2(R,PX,PZ,faceTo(PX,PZ,CAM),drawMembrane(),'TRIONIX','RO PLANT · RO-01'); up.push(op.update);
  var TR={z:-1.2,y:.3}, E=[PX,.13,PZ]; kTray(R,[-2.0,TR.z],[2.5,TR.z],TR.y,.2); kBranch(R,PX,TR.z,PZ,TR.y);
  var sig=[kRun(R,[HPX,.52,.53],[[HPX+.15,.6,.53],[HPX+.15,.6,-.3]],TR,E,0x13A89E,-.06),kRun(R,[-.85,.95,.75],[[-.85,1.15,.75],[-.42,1.15,.75]],TR,E,0xF2A541,-.03),kRun(R,[RX+1.05,1.03,.06],[[RX+1.17,1.03,.06],[RX+1.17,1.03,-.6]],TR,E,0x7a5cff,.0),kRun(R,[2.25,.56,0],[[2.25,.56,-.35]],TR,E,0x2f8ce0,.03),kRun(R,[1.8,.38,RJ],[[1.8,.5,RJ-.1]],TR,E,0xE8891E,.06)];
  iLab(R,'PT-801 · RO feed pressure',[-.75,1.15,1.1],'#13A89E',lp,[HPX,.45,.53]); iLab(R,'HP pump on VFD',[-1.25,1.45,.6],'#F2A541',lp,[HPX,.95,HPZ]); iLab(R,'FT-801 · permeate flow',[2.2,1.55,.45],'#7a5cff',lp,[RX+1.05,1.0,0]); iLab(R,'AT-801 · conductivity',[2.5,1.0,.35],'#2f8ce0',lp,[2.25,.62,0]); iLab(R,'FCV-802 · recovery control',[1.9,.8,-.35],'#E8891E',lp,[1.8,.35,RJ]); iLab(R,'RO pressure vessels · 2 × 3',[RX,1.8,.35],'#0B2545',lp,[RX,1.15,.2]); iLab(R,'Sand & carbon filters',[-1.35,1.95,-.35],'#0B2545',lp,[-1.35,1.45,FZ]); iLab(R,'Cartridge filter 5 µm',[-.45,1.35,-.3],'#0B2545',lp,[-.55,.9,FZ]); iLab(R,'Dosing · flow-paced',[-1.45,.95,.6],'#13A89E',lp,[-1.45,.52,.25]);
  iLab(R,'Spiral-wound membrane element',[RX+.35,1.65,.75],'#0B2545',li,[RX-.1,1.105,.2]); iLab(R,'Filter media layers',[-1.3,1.15,-.15],'#9A5F12',li,[-1.6,.6,FZ+.1]); iLab(R,'Filter cartridges',[-.25,.75,-.2],'#0B2545',li,[-.55,.6,FZ+.05]);
  var flows=[kFlow(R,[[HPX,.34,.62],[X0,.34,.62],[X0,.34,H1Z]],0x2f8ce0,3,.3),kFlow(R,[[RX-.98,1.49,0],[RX+1.05,1.49,0]],0x8fd3ff,4,.3),kFlow(R,[[X0,.26,RJ],[2.4,.26,RJ]],0x9aa1a8,3,.25)];
  return ind3(st,R,{cam:CAM,look:[.3,.8,0],camIn:[RX-.6,1.5,1.25],lookIn:[RX+.05,1.05,.1],op:op,shadow:3.6,
    update:indRun2(st,{up:up,sig:sig,flows:flows,lp:lp,li:li,cuts:cuts.concat([cutMem]),spin:[[cpl,20,'y']],extra:function(dt,t,v){ var c=v.cut; cuts.forEach(function(sh){ (sh.media||[]).forEach(function(m){ m.material.opacity=c; m.visible=c>.02; }); }); if(cutMem&&cutMem.el) cutMem.el.forEach(function(e){ e.visible=c>.05; }); }})});
};

/* ---------- 9. CHEMICAL: glass-lined reactor hung on a welded platform, cascade jacket temperature control ---------- */
IND.chemical=function(st){
  var R=new T.Group(); st.scene.add(R); softFloor(R,3.9,{cells:18,shadow:.22}); var k=km(), up=[], lp=[], li=[], CAM=[3.0,2.8,4.5];
  var glM=new T.MeshPhysicalMaterial({color:0x1e4f9a,roughness:.18,metalness:.1,clearcoat:1,clearcoatRoughness:.1}); var RX=-.25, face=Math.atan2(CAM[0]-RX,CAM[2]);
  /* welded platform with an opening for the reactor; lugs sit on two main beams */
  var PY=1.15, X0=-1.1, X1=.6, Z0=-.9, Z1=.9, HO=.64, sm=PAINT(0x3b4a5c,.5), rm=PAINT(0xF2C230,.45); var gt=TEX.grate.clone(); gt.needsUpdate=true; gt.repeat.set(6,6); var gmt=new T.MeshStandardMaterial({color:0x8c96a2,metalness:.6,roughness:.45,alphaMap:gt,alphaTest:.5});
  [[X0,RX-HO,Z0,Z1],[RX+HO,X1,Z0,Z1],[RX-HO,RX+HO,Z0,-HO],[RX-HO,RX+HO,HO,Z1]].forEach(function(q){ box(q[1]-q[0],.03,q[3]-q[2],gmt,(q[0]+q[1])/2,PY,(q[2]+q[3])/2,R); });
  [[X0,Z0,X1,Z0],[X0,Z1,X1,Z1],[X0,Z0,X0,Z1],[X1,Z0,X1,Z1],[RX-HO,Z0,RX-HO,Z1],[RX+HO,Z0,RX+HO,Z1]].forEach(function(e){ kBeam(R,[e[0],PY-.06,e[1]],[e[2],PY-.06,e[3]],.1,.05,sm); });
  [-.42,.42].forEach(function(z){ kBeam(R,[RX-HO,PY-.06,z],[RX+HO,PY-.06,z],.1,.05,sm); });
  [[X0,Z0],[X1,Z0],[X0,Z1],[X1,Z1],[RX-HO,Z0],[RX+HO,Z1]].forEach(function(c){ kBeam(R,[c[0],0,c[1]],[c[0],PY-.11,c[1]],.08,.06,sm); });
  [[X0,Z0,X1,Z0],[X0,Z0,X0,Z1],[X0,Z1,X1,Z1]].forEach(function(e){ var a=V([e[0],PY+.5,e[1]]), b=V([e[2],PY+.5,e[3]]); rod([a.x,a.y,a.z],[b.x,b.y,b.z],.016,rm,R,8); rod([a.x,PY+.25,a.z],[b.x,PY+.25,b.z],.012,rm,R,8); var n=Math.max(2,Math.round(a.distanceTo(b)/.6)); for(var q=0;q<=n;q++){ var pq=a.clone().lerp(b,q/n); rod([pq.x,PY,pq.z],[pq.x,PY+.5,pq.z],.016,rm,R,8); } box(a.distanceTo(b),.08,.005,rm,(a.x+b.x)/2,PY+.06,(a.z+b.z)/2,R).rotation.y=Math.abs(a.x-b.x)<1e-3?PI/2:0; });
  kLadder(R,X1+.1,.45,0,PY,PI/2);
  /* reactor with jacket */
  var Rg=new T.Group(); Rg.position.set(RX,0,0); R.add(Rg); var ves=kShell(Rg,{r:.5,h:.78,y0:.92,bot:'dish',top:'dish',m:glM,face:face,inner:0x2a62b8}); var jk=kShell(Rg,{r:.56,h:.62,y0:.94,bot:'dish',botK:.33,top:'none',m:k.ss2,face:face,inner:0x8a949e});
  [0,1,2,3].forEach(function(i){ var a=i*PI/2+PI/4; var lx=Math.cos(a)*.6, lz=Math.sin(a)*.6; var lg=box(.2,.14,.1,k.ss2,lx,PY+.1,lz,Rg); lg.rotation.y=-a; box(.16,.012,.14,k.ss2,lx,PY+.018,lz,Rg).rotation.y=-a; });
  var top=.92+.78; var sh=kAgitator(Rg,top+.13,1.1,'double'); cyl(.07,.07,.06,k.ss2,0,top+.1,0,Rg,16);
  var liq=new T.Mesh(new T.CylinderGeometry(.48,.48,.55,40),new T.MeshStandardMaterial({color:0xd9a441,transparent:true,opacity:0,roughness:.3,depthWrite:false})); liq.position.y=1.12; Rg.add(liq); var baf=cyl(.03,.03,.7,M(0xdfe6ec),.32,1.27,-.2,Rg,12);
  [[.28,.15,.06],[-.28,.15,.06],[0,-.32,.08],[.3,-.25,.04]].forEach(function(nz){ kNozzle(Rg,[nz[0],top+.12,nz[1]],[0,1,0],nz[2],.12,k.ss2); });
  kSight(R,[RX+Math.sin(face+.4)*.36,top+.12,Math.cos(face+.4)*.36],[0,1,0],.05); var rd=new T.Group(); rd.position.set(RX-.28,top+.25,.15); R.add(rd); cyl(.07,.07,.02,PAINT(0xc8312e,.4),0,.0,0,rd,18); kTube(rd,[[0,.01,0],[0,.32,0],[-.25,.32,0]],.05,k.ss,{fl:[true,false],rb:.1});
  kDataPlate(Rg,['REACTOR R-901 · GLR','2000 L · 6 bar · −20/200 °C'],Math.sin(face)*.565,1.05,Math.cos(face)*.565,face,.17);
  /* bottom outlet valve -> next stage */
  kTube(R,[[RX,.74,0],[RX,.4,0],[RX,.4,.95]],.035,k.ss,{fl:[false,false],rb:.08}); var fbv=new T.Group(); fbv.position.set(RX,.66,0); R.add(fbv); cyl(.05,.05,.08,k.ss2,0,0,0,fbv,16); rbox(.12,.08,.08,.01,k.act,.1,0,0,fbv); kBV(R,'XV-903',.035,RX,.4,.6,PI/2); kBL(R,[RX,.4,.95],[0,0,1],.035,'TO FILTER-DRYER','#0B2545');
  /* overhead vapour -> condenser (welded stand) -> receiver */
  var CXd=1.05, CZ=-.35; kTube(R,[[RX,top+.24,-.32],[RX,2.3,-.32],[CXd,2.3,-.32],[CXd,2.03,-.32]],.05,k.ss,{fl:[true,true],rb:.12});
  var cd=new T.Group(); cd.position.set(CXd,1.55,CZ+.03); R.add(cd); cyl(.12,.12,.9,k.ss,0,0,0,cd,24); [-.45,.45].forEach(function(y){ kFlange(cd,new T.Vector3(0,y,0),new T.Vector3(0,y>0?1:-1,0),.12); }); kNozzle(cd,[.12,.3,0],[1,0,0],.03,.1); kNozzle(cd,[.12,-.3,0],[1,0,0],.03,.1);
  kBeam(R,[CXd,0,CZ-.2],[CXd,1.95,CZ-.2],.08,.06,sm); [1.2,1.85].forEach(function(y){ kBeam(R,[CXd,y,CZ-.2],[CXd,y,CZ-.06],.05,.04,sm); });
  kTube(R,[[CXd+.22,1.85,CZ+.03],[1.75,1.85,CZ+.03]],.03,PAINT(0x2f8ce0,.4),{fl:[true,false]}); kTube(R,[[CXd+.22,1.25,CZ+.03],[1.75,1.25,CZ+.03]],.03,PAINT(0x13A89E,.4),{fl:[true,false]}); kBL(R,[1.75,1.85,CZ+.03],[1,0,0],.03,'CW RETURN','#1f6fb8'); kBL(R,[1.75,1.25,CZ+.03],[1,0,0],.03,'CW SUPPLY','#0B7C74');
  kTube(R,[[CXd,1.1,CZ+.03],[CXd,.82,CZ+.03],[1.38,.82,CZ+.03]],.028,k.ss,{fl:[false,true],rb:.08}); var rc=new T.Group(); rc.position.set(1.6,.72,CZ+.03); R.add(rc); cylX(.15,.42,k.ss,0,0,0,rc,24); [-.21,.21].forEach(function(x){ var e=sph(.15,k.ss,x,0,0,rc,20,10); e.scale.x=.4; kBeam(R,[1.6+x*.8,0,CZ+.03],[1.6+x*.8,.58,CZ+.03],.05,.05,k.navy); });
  kTube(R,[[1.6,.57,CZ+.03],[1.6,.3,CZ+.03],[2.0,.3,CZ+.03]],.02,k.ss,{fl:[true,false],rb:.06}); kHV(R,.02,1.82,.3,CZ+.03,0); kBL(R,[2.0,.3,CZ+.03],[1,0,0],.02,'DISTILLATE','#9A5F12');
  /* dosing vessel on load cells (welded stand) -> Coriolis -> FCV-901 station -> reactor top nozzle */
  var DX=-1.6, DZ=-.4, D=new T.Group(); D.position.set(DX,0,DZ); R.add(D); [[-.25,-.25],[.25,-.25],[-.25,.25],[.25,.25]].forEach(function(q){ kBeam(D,[q[0],0,q[1]],[q[0],1.4,q[1]],.06,.05,k.navy); }); [[-.25,-.25,.25,-.25],[-.25,.25,.25,.25],[-.25,-.25,-.25,.25],[.25,-.25,.25,.25]].forEach(function(e){ kBeam(D,[e[0],1.37,e[1]],[e[2],1.37,e[3]],.06,.05,k.navy); }); box(.56,.02,.56,k.navy,0,1.41,0,D);
  var dv=new T.Group(); dv.position.y=1.42; D.add(dv); kVessel(dv,{r:.2,h:.35,legH:.1,top:'dish',legs:3,loadcells:true});
  var DY=2.08; kTube(R,[[DX,1.48,DZ],[DX,1.3,DZ],[DX+.35,1.3,DZ],[DX+.35,DY,DZ],[RX+.3,DY,DZ],[RX+.3,DY,-.25],[RX+.3,top+.25,-.25]],.018,k.ss,{fl:[true,true],rb:.06});
  var fm=kCoriolis(R,'FT-901',.018,-1.0,DY,DZ,0,'kg/h',85); up.push(fm.update); kCVS(R,'FCV-901',.018,-.55,DY,DZ,'x',{up:.15,span:.26});
  /* jacket utilities: steam (TCV-902A) + condensate trap, cooling water (TCV-902B) + return */
  var JX=RX-.545, ZS=.16; kNozzle(R,[JX,1.45,ZS],[-1,0,0],.025,.06); kNozzle(R,[JX,1.45,-ZS],[-1,0,0],.025,.06); kNozzle(R,[JX,1.0,ZS],[-1,0,0],.025,.06); kNozzle(R,[JX,1.0,-ZS],[-1,0,0],.025,.06);
  kTube(R,[[JX-.06,1.45,ZS],[-1.25,1.45,ZS]],.025,k.ss,{fl:false}); kTube(R,[[-1.25,1.45,ZS],[-1.75,1.45,ZS]],.025,k.ss,{ins:true,fl:false}); kCVS(R,'TCV-902A',.025,-1.05,1.45,ZS,'x',{up:.17,span:.24}); kBL(R,[-1.75,1.45,ZS],[-1,0,0],.025,'STEAM IN','#5d6670');
  kTube(R,[[JX-.06,1.45,-ZS],[-1.15,1.45,-ZS],[-1.15,1.45,-.62],[-1.75,1.45,-.62]],.025,PAINT(0x2f8ce0,.4),{fl:false,rb:.07}); kBL(R,[-1.75,1.45,-.62],[-1,0,0],.025,'CW RETURN','#1f6fb8');
  kTube(R,[[JX-.06,1.0,ZS],[-1.75,1.0,ZS]],.02,k.ss,{fl:false}); kTrap(R,-1.35,1.0-.02,ZS,.04); kHV(R,.02,-1.55,1.0,ZS,0); kBL(R,[-1.75,1.0,ZS],[-1,0,0],.02,'CONDENSATE','#5d6670');
  kTube(R,[[JX-.06,1.0,-ZS],[-1.75,1.0,-ZS]],.025,PAINT(0x13A89E,.4),{fl:false}); kCVS(R,'TCV-902B',.025,-1.0,1.0,-ZS,'x',{up:.16,span:.24}); kBL(R,[-1.75,1.0,-ZS],[-1,0,0],.025,'CW SUPPLY','#0B7C74');
  /* instruments */
  var t1=kTT(Rg,'TT-901',65.0,-.12,top+.2,.3); up.push(t1.update); var t2=kTT(R,'TT-902',58.0,JX-.35,1.45+.02,-ZS); up.push(t2.update); var pt=kPT(Rg,'PT-901','bar',.4,.05,top+.2,-.42); up.push(pt.update); var lt=kLT(Rg,'LT-901',58,-.32,top+.17,.12); up.push(lt.update);
  var PX=1.45,PZ=1.15, op=kOpPanel2(R,PX,PZ,faceTo(PX,PZ,CAM),drawPID('TIC-901','Reactor temperature · cascade','°C',65,70,1),'TRIONIX','REACTOR · R-901'); up.push(op.update);
  var vfd=buildVFD(); vfd.group.position.set(.85,0,.95); R.add(vfd.group); up.push(vfd.update);
  var TR={z:-1.25,y:.3}, E=[PX,.13,PZ]; kTray(R,[-2.0,TR.z],[2.1,TR.z],TR.y,.2); kBranch(R,PX,TR.z,PZ,TR.y);
  var sig=[kRun(R,[RX-.12,top+.33,.3],[[RX-.12,top+.33,.48],[X1-.05,top+.33,.48]],TR,E,0x13A89E,-.06),kRun(R,[JX-.35,1.6,-ZS],[[JX-.35,1.75,-ZS-.12]],TR,E,0x2f8ce0,-.03),kRun(R,[-1.0,DY+.08,DZ],[[-1.0,DY+.2,DZ-.1]],TR,E,0xF2A541,.0),kRun(R,[-1.05,1.6,ZS],[[-1.05,1.75,ZS+.12],[-1.95,1.75,ZS+.12]],TR,E,0xE8891E,.03),kRun(R,[-1.0,1.15,-ZS],[[-1.0,1.08,-ZS-.12],[-1.9,1.08,-ZS-.12]],TR,E,0x13A89E,.06)];
  iLab(R,'TT-901 · reactor (master)',[RX+.85,2.4,.95],'#13A89E',lp,[RX-.12,top+.33,.3]); iLab(R,'TT-902 · jacket (slave)',[-1.15,2.05,-.75],'#2f8ce0',lp,[JX-.35,1.6,-ZS]); iLab(R,'FCV-901 · dosing',[.35,2.75,-.95],'#F2A541',lp,[-.55,DY+.15,DZ]); iLab(R,'TCV-902A · steam',[-1.35,1.95,.65],'#E8891E',lp,[-1.05,1.62,ZS]); iLab(R,'TCV-902B · cooling water',[-1.55,.6,.65],'#13A89E',lp,[-1.0,1.12,-ZS]); iLab(R,'Glass-lined reactor R-901',[RX+.95,2.05,.6],'#0B2545',lp,[RX+.3,1.5,.35]); iLab(R,'Overhead condenser',[1.45,2.45,.15],'#0B2545',lp,[CXd,1.9,CZ]); iLab(R,'Dosing vessel · load cells',[-1.75,2.45,-.2],'#0B2545',lp,[DX,1.75,DZ]);
  iLab(R,'Twin pitched-blade agitator',[RX+.85,1.6,.75],'#13A89E',li,[RX+.05,1.27,.1]); iLab(R,'Heating / cooling jacket',[RX+.95,1.05,.8],'#E8891E',li,[RX+.4,1.02,.35]); iLab(R,'Reaction mass',[RX+.8,1.35,.85],'#9A5F12',li,[RX+.2,1.17,.2]); iLab(R,'Baffle with probe',[RX+.75,1.85,.65],'#0B2545',li,[RX+.32,1.47,-.2]);
  var flows=[kFlow(R,[[DX+.35,DY+.04,DZ],[RX+.3,DY+.04,DZ]],0xF2A541,4,.25),kFlow(R,[[-1.75,1.49,ZS],[JX,1.49,ZS]],0xE8891E,3,.3)];
  return ind3(st,R,{cam:CAM,look:[-.1,1.2,0],camIn:[RX+Math.sin(face)*2.5,2.25,Math.cos(face)*2.5],lookIn:[RX,1.25,0],op:op,shadow:3.3,
    update:indRun2(st,{up:up,sig:sig,flows:flows,lp:lp,li:li,cuts:[ves,jk],spin:[[sh,1.6,'y']],extra:function(dt,t,v){ liq.material.opacity=.5*v.cut; liq.visible=v.cut>.02; }})});
};

/* =====================================================================
   SCENES
   ===================================================================== */
var SCENES={};
Object.keys(IND).forEach(function(k){SCENES['ind_'+k]=IND[k];});
SCENES.iiot=function(st){return iiotScene(st);};
function makePanel(o){ return PARTS? buildRealPanel(o) : buildPanel(o); }
function pulseOnly(parent,curve,color,n,speed){ var sm=pulseMat(color),sm2=pulseMat(0xffffff),sp=[]; for(var i=0;i<n;i++){ var a=new T.Sprite(sm);a.scale.setScalar(.06);parent.add(a);var b=new T.Sprite(sm2);b.scale.setScalar(.022);parent.add(b);sp.push([a,b]); } return {set:function(k){sm.opacity=k;sm2.opacity=k;},update:function(t){ for(var i=0;i<n;i++){ var u=((t*speed+i/n)%1+1)%1; var p=curve.getPointAt(u); sp[i][0].position.copy(p); sp[i][1].position.copy(p);} }}; }

/* ---------- network (hero + automation) ---------- */
function networkScene(st,hero){
  var R=new T.Group();st.scene.add(R);softFloor(R,9,{cells:30});
  var panel=makePanel({tag:'CP-01'});panel.group.scale.setScalar(.85);R.add(panel.group);
  var upd=[];
  function place(obj,x,z,ry){obj.position.set(x,0,z);if(ry)obj.rotation.y=ry;R.add(obj);return obj;}
  var pt=buildPT(0x2a5c94,'bar',10.4,'PT-101');place(pt.group,-2.5,1.9,.5);upd.push(pt.update);
  var pt2=buildPT(0x13606a,'°C',152.0,'TT-102');place(pt2.group,-3.3,-.3,1.1);upd.push(pt2.update);
  var fm=buildFlowmeter();place(fm.group,-1.4,3.1,.15);upd.push(fm.update);
  var cv=buildControlValve();place(cv.group,-3.0,1.0,.9);
  var vfd=buildVFD();place(vfd.group,2.0,2.2,-.5);upd.push(vfd.update);
  var ps=buildPumpSet();place(ps.group,3.1,2.8,-.6);upd.push(ps.update);
  var dk=buildDesk();place(dk.group,3.0,-.8,-1.35);upd.push(dk.update);
  var rio=buildVFD();place(rio.group,.9,-2.9,0);upd.push(rio.update);
  var rk=buildRack();place(rk.group,-1.1,-2.8,.2);upd.push(rk.update);
  var gw=buildGateway();place(gw.group,2.3,-2.7,-.4);
  var sat=buildTDRS(1.5);sat.group.position.set(-.3,4.9,-2.9);R.add(sat.group);
  var groups={a:[],f:[],e:[],o:[]};
  var COL={a:0x13A89E,f:0x7a5cff,e:0x1f7ae0,o:0xE8891E};
  function floorCable(k,to,n){var x=to[0],z=to[1];var c=cable(R,[[0,.04,.32],[x*.35,.03,z*.35+.25],[x*.75,.03,z*.8],[x,.03,z],[x,to[2]||.3,z]],COL[k],{n:n||3,r:.022});groups[k].push(c);}
  floorCable('a',[-2.5,1.9,.12]);floorCable('a',[-3.3,-.3,.12]);floorCable('a',[-1.4,3.1,.4]);floorCable('a',[-3.0,1.0,.3]);
  floorCable('f',[2.0,2.2,.3]);groups.f.push(cable(R,[[2.0,.03,2.2],[2.5,.03,2.6],[2.95,.03,2.8],[2.95,.2,2.8]],COL.f,{n:2,r:.02}));
  floorCable('e',[3.0,-.8,.74]);floorCable('e',[.9,-2.9,.3]);floorCable('e',[-1.1,-2.8,.3]);
  groups.o.push(cable(R,[[-1.1,.03,-2.5],[.2,.03,-3.1],[1.4,.03,-2.9],[2.3,.03,-2.7],[2.3,.4,-2.7]],COL.o,{n:3,r:.022}));
  var up=beam(R,0xE8891E,{n:4});var A=new T.Vector3(2.3,1.55,-2.6);
  var wr=rings(R,0x1f7ae0,[2.3,1.5,-2.6],{flat:false,face:new T.Vector3(8,3,8)});
  if(!hero){
    [['4–20 mA · HART',[-2.5,1.45,1.9],'#13A89E'],['Flow · HART',[-1.4,1.05,3.1],'#13A89E'],['Modbus RTU · VFD',[2.0,1.4,2.2],'#7a5cff'],['Profinet · SCADA',[3.0,1.7,-.8],'#1f7ae0'],['Remote I/O',[.9,1.4,-2.9],'#1f7ae0'],['Server · OPC UA',[-1.1,1.95,-2.8],'#E8891E'],['4G / LoRa gateway',[2.3,1.95,-2.2],'#E8891E']].forEach(function(l){R.add(label(l[0],{pos:l[1],border:l[2],h:.16}));});
  }
  return {
    zoom:hero?1:1.12,shadow:{size:5.5,center:[0,0,0]},
    keys:['a','f','e','o','w'],base:hero?{a:.9,f:.9,e:.9,o:.9,w:.9}:{a:.2,f:.2,e:.2,o:.2,w:.15},
    steps:hero?[{cam:[5.6,4.3,8.4],look:[-2.0,.9,0]}]:[
      {cam:[-4.6,2.6,5.6],look:[-1.9,.6,1.2],v:{a:1}},
      {cam:[5.4,2.4,5.8],look:[2.3,.6,2.2],v:{f:1}},
      {cam:[6.6,3.6,.8],look:[1.2,.7,-1.6],v:{e:1}},
      {cam:[-.4,4.8,7.2],look:[.2,1.9,-1.8],v:{o:1,e:.5}},
      {cam:[5.8,4.4,4.6],look:[1.4,1.7,-2.0],v:{w:1,o:.7}},
      {cam:[7.4,6.0,8.4],look:[0,.8,0],auto:.12,v:{a:1,f:1,e:1,o:1,w:1}}],
    update:function(dt,t,v){
      if(hero&&!REDUCE)R.rotation.y+=dt*.06;
      panel.update(t,{});upd.forEach(function(f){f(t,dt);});
      Object.keys(groups).forEach(function(k){var kk=.15+.85*v[k];groups[k].forEach(function(c){c.set(kk);c.update(t);});});
      sat.group.rotation.y=t*.2;sat.wings.rotation.x=Math.sin(t*.4)*.2;
      up.update(A,sat.group.position,t,.15+.85*Math.max(v.o,v.w));wr.update(t,.25+.75*v.w);
    }};
}
SCENES.hero=function(st){return networkScene(st,true);};
SCENES.network=function(st){return networkScene(st,false);};

/* ---------- panel story ---------- */
SCENES.panel=function(st){
  var R=new T.Group();st.scene.add(R);softFloor(R,6.5,{cells:26});
  var panel=makePanel({tag:'CP-01'});R.add(panel.group);
  var upd=[];
  var pt=buildPT(0x2a5c94,'bar',10.4,'PT-101');pt.group.position.set(-2.1,0,1.7);pt.group.rotation.y=.6;R.add(pt.group);upd.push(pt.update);
  var ps=buildPumpSet();ps.group.position.set(2.2,0,1.9);ps.group.rotation.y=-.75;R.add(ps.group);upd.push(ps.update);
  var cv=buildControlValve();cv.group.position.set(-2.1,0,-1.3);cv.group.rotation.y=.9;R.add(cv.group);
  var pt2=buildPT(0x13606a,'°C',152.0,'TT-102');pt2.group.position.set(1.9,0,-1.3);pt2.group.rotation.y=-.6;R.add(pt2.group);upd.push(pt2.update);
  var sig=[];
  [[-2.1,1.7,.08,0x13A89E],[2.2,1.9,.25,0xE8891E],[-2.1,-1.3,.25,0x13A89E],[1.9,-1.3,.08,0x7a5cff]].forEach(function(d,i){
    var x=d[0],z=d[1],ex=-.3+i*.2;
    sig.push(cable(R,[[x,d[2],z],[x,.02,z],[x*.6,.015,z*.6+.1],[ex*1.3,.015,.55],[ex,.015,.2],[ex,.015,0]],d[3],{n:3,speed:.3,r:.011,size:.1,jacket:0x2b2e33}));
  });
  (panel.fieldPaths||[]).forEach(function(c,i){ sig.push(pulseOnly(R,c,[0x13A89E,0xE8891E,0x7a5cff][i%3],2,.45)); });
  var ringM=BM(0x13A89E,{transparent:true,depthWrite:false,toneMapped:false}),ringM2=BM(0xE8891E,{transparent:true,depthWrite:false,toneMapped:false});
  var ring=new T.Mesh(new T.TorusGeometry(1.15,.012,8,120),ringM);ring.position.y=1.1;R.add(ring);
  var ring2=new T.Mesh(new T.TorusGeometry(1.3,.008,8,120),ringM2);ring2.position.y=1.1;R.add(ring2);
  var ipc=cnv(256,256),ig=ipc.getContext('2d');
  ig.fillStyle='#ffffff';ig.beginPath();ig.arc(128,128,120,0,PI*2);ig.fill();ig.strokeStyle='#13A89E';ig.lineWidth=12;ig.stroke();
  ig.fillStyle='#0B2545';ig.font='800 80px '+DISP;ig.textAlign='center';ig.fillText('IP66',128,140);ig.font='600 21px '+MONO;ig.fillStyle='#0B7C74';ig.fillText('DUST TIGHT · JETS',128,182);
  var ipm=new T.SpriteMaterial({map:ctex(ipc),transparent:true,depthTest:false,toneMapped:false});var ip=new T.Sprite(ipm);ip.scale.set(.75,.75,1);ip.position.set(1.0,2.55,.4);ip.renderOrder=20;R.add(ip);
  var N=260,pos=new Float32Array(N*3),tgt=[],ph=[];
  for(var i=0;i<N;i++){tgt.push(new T.Vector3(-.48+Math.random()*.96,.4+Math.random()*1.6,.28));ph.push(Math.random()*1.5);}
  var sg=new T.BufferGeometry();sg.setAttribute('position',new T.BufferAttribute(pos,3));
  var spm=new T.PointsMaterial({color:0x2f8ce0,size:.045,map:DOT,transparent:true,depthWrite:false,toneMapped:false});var spray=new T.Points(sg,spm);spray.frustumCulled=false;R.add(spray);
  var noz=new T.Vector3(1.75,1.55,1.95);var nz=new T.Group();nz.position.copy(noz);R.add(nz);cyl(.025,.04,.2,METAL(0xc9ced4,.25),0,0,0,nz,20).rotation.x=PI/2;nz.lookAt(0,1.1,.3);
  var rk=buildRack();rk.group.scale.setScalar(.55);rk.group.position.set(0,3.6,-.6);R.add(rk.group);upd.push(rk.update);
  cyl(.5,.5,.04,PAINT(0x0B2545,.4),0,3.58,-.6,R,48);
  var dl=label('Trionix server · Pune HQ',{pos:[0,4.65,-.6],border:'#E8891E',h:.2});R.add(dl);
  var bm=beam(R,0xE8891E,{n:5,w:.05});var a=new T.Vector3(0,panel.top,0),b=new T.Vector3(0,3.57,-.6);
  var tmp=new T.Vector3();
  return {zoom:1.0,shadow:{size:3.6,center:[0,0,0]},keys:['door','ip','sig','data'],base:{sig:.22,data:.18},
    steps:[{cam:[3.3,2.3,4.4],look:[0,1.05,0],auto:.16},
      {cam:[3.0,1.8,3.6],look:[.2,1.1,.2],v:{ip:1}},
      {cam:[.2,1.74,1.12],look:[0,1.62,.27]},
      {cam:[.62,1.6,1.7],look:[-.03,1.3,-.12],v:{door:1}},
      {cam:[.8,1.0,1.8],look:[-.03,.78,-.1],v:{door:1,sig:1}},
      {cam:[3.6,3.2,5.4],look:[0,2.1,-.3],v:{data:1}}],
    update:function(dt,t,v){
      panel.update(t,v);upd.forEach(function(f){f(t,dt);});
      sig.forEach(function(c){c.set(.12+.88*v.sig);c.update(t);});
      ring.rotation.x=PI/2+Math.sin(t*.6)*.25;ring.rotation.y=t*.4;ring2.rotation.x=PI/2+Math.cos(t*.5)*.3;ring2.rotation.y=-t*.3;
      ringM.opacity=ringM2.opacity=v.ip*.9;ring.visible=ring2.visible=v.ip>.02;ipm.opacity=v.ip;ip.visible=v.ip>.02;
      spm.opacity=v.ip*.85;spray.visible=v.ip>.02;nz.visible=v.ip>.02;
      if(spray.visible){for(var i=0;i<N;i++){var p=(t*.9+ph[i])%1.5;if(p<1){tmp.lerpVectors(noz,tgt[i],p);}else{tmp.copy(tgt[i]);tmp.y-=(p-1)*1.4;tmp.z+=.004;if(tmp.y<.12)tmp.y=.12;}pos[i*3]=tmp.x;pos[i*3+1]=tmp.y;pos[i*3+2]=tmp.z;}sg.attributes.position.needsUpdate=true;}
      bm.update(a,b,t,v.data);dl.material.opacity=.3+.7*v.data;
    }};
};

/* ---------- IIoT story ---------- */
SCENES.iiotOld=function(st){
  var R=new T.Group();st.scene.add(R);
  var gc=new T.Vector3(.2,-.2,-2.8),gr=1.8;
  var globe=new T.Group();globe.position.copy(gc);R.add(globe);
  globe.add(new T.Mesh(new T.SphereGeometry(gr,64,48),new T.MeshStandardMaterial({color:0xdfe9f2,roughness:.75,metalness:.05})));
  var pts=[],n=5200,ga=PI*(3-Math.sqrt(5));
  for(var i=0;i<n;i++){var y=1-(i/(n-1))*2,r=Math.sqrt(1-y*y),th=ga*i;var x=Math.cos(th)*r,z=Math.sin(th)*r;var lat=Math.asin(y),lon=Math.atan2(z,x);
    var m=Math.sin(3*lon)*Math.cos(2*lat)+.6*Math.sin(5*lon+1)*Math.sin(3*lat+.5)+.4*Math.cos(7*lon-2*lat);if(m>.3&&Math.abs(lat)<1.3)pts.push(x*gr*1.004,y*gr*1.004,z*gr*1.004);}
  var dg=new T.BufferGeometry();dg.setAttribute('position',new T.Float32BufferAttribute(pts,3));
  globe.add(new T.Points(dg,new T.PointsMaterial({color:0x13A89E,size:.05,map:DOT,transparent:true,depthWrite:false,toneMapped:false})));
  for(i=-2;i<=2;i++){var rr=gr*Math.cos(i*.5)*1.008;var c=new T.Mesh(new T.TorusGeometry(rr,.004,4,120),BM(0x0B2545,{transparent:true,opacity:.18}));c.rotation.x=PI/2;c.position.y=gr*Math.sin(i*.5);globe.add(c);}
  for(i=0;i<6;i++){var mer=new T.Mesh(new T.TorusGeometry(gr*1.008,.004,4,120),BM(0x0B2545,{transparent:true,opacity:.14}));mer.rotation.y=i*PI/6;globe.add(mer);}
  var orbit=new T.Mesh(new T.TorusGeometry(2.6,.006,4,160),BM(0xE8891E,{transparent:true,opacity:.35}));orbit.position.copy(gc);orbit.position.y+=2.0;orbit.rotation.x=PI/2.3;R.add(orbit);
  var plat=new T.Group();plat.position.set(-3.0,-1.6,.5);R.add(plat);softFloor(plat,2.0,{cells:14,shadow:.25});
  var panel=makePanel({tag:'IOT-01',title:'IIoT PANEL'});panel.group.scale.setScalar(.55);panel.group.position.set(-.3,0,0);panel.group.rotation.y=.35;plat.add(panel.group);
  var rk=buildRack();rk.group.scale.setScalar(.62);rk.group.position.set(.6,0,-.45);rk.group.rotation.y=.2;plat.add(rk.group);
  var loc=cable(plat,[[-.3,.03,.12],[.0,.03,.0],[.35,.03,-.2],[.6,.03,-.3],[.6,.3,-.25]],0x13A89E,{n:4,speed:.6,r:.016,size:.12});
  var ph=buildPhone();ph.group.position.set(3.0,-.4,.7);ph.group.rotation.set(-.06,-.45,0);R.add(ph.group);
  var sat=buildSatellite();sat.group.scale.setScalar(.7);R.add(sat.group);
  var up=beam(R,0xE8891E,{n:5,w:.045}),down=beam(R,0x13A89E,{n:5,w:.045});
  var lock=new T.Group();lock.position.set(3.0,.68,.7);R.add(lock);
  var lm=new T.MeshStandardMaterial({color:0xF2A541,metalness:.5,roughness:.3,transparent:true});rbox(.36,.28,.12,.03,lm,0,0,0,lock);
  var shm=new T.MeshStandardMaterial({color:0xd8dee6,metalness:.9,roughness:.2,transparent:true});var sh=new T.Mesh(new T.TorusGeometry(.12,.03,12,28,PI),shm);sh.position.y=.14;lock.add(sh);
  cylZ(.03,.13,M(0x0B2545),0,.01,.01,lock);
  var wa=['WhatsApp · ALARM Drum level LOW','WhatsApp · Report ready (Excel)','WhatsApp · ALARM FD fan trip'].map(function(s,i){var l=label(s,{border:i===1?'#13A89E':'#25D366',h:.16});R.add(l);return l;});
  var lab=[label('Web server · data log',{pos:[-2.4,-.25,0],h:.16,border:'#13A89E'}),label('Trionix panel',{pos:[-3.3,-.3,.9],h:.16})];lab.forEach(function(l){R.add(l);});
  var A=new T.Vector3(-2.4,-.5,0),S=new T.Vector3(),P=new T.Vector3(3.0,.05,.7);
  return {zoom:1.2,shadow:{size:4.5,center:[0,-1.6,0]},keys:['log','up','down','sec','alert'],base:{log:.3,up:.25,down:.25},
    steps:[{cam:[-1.0,.4,3.8],look:[-2.75,-.95,.3],v:{log:1}},
      {cam:[-.4,1.7,7.4],look:[-.5,.5,-.8],v:{up:1,log:.6}},
      {cam:[2.0,.1,2.9],look:[3.0,-.35,.7],v:{down:1,up:.5}},
      {cam:[2.1,.4,3.0],look:[3.0,0,.7],v:{sec:1,down:.6}},
      {cam:[1.9,.6,3.6],look:[3.1,.2,.7],v:{alert:1,log:.8,up:.8,down:.8}}],
    update:function(dt,t,v){
      globe.rotation.y+=dt*.05;panel.update(t,{});rk.update(t);loc.set(.2+.8*v.log);loc.update(t);
      var a=t*.2;sat.group.position.set(gc.x+Math.sin(a)*2.0,gc.y+2.85+Math.cos(a*2)*.12,gc.z+Math.cos(a)*1.2+.6);sat.group.rotation.y=a+PI/2;sat.wings.rotation.x=Math.sin(t*.5)*.25;
      S.copy(sat.group.position);S.y-=.4;
      up.update(A,S,t,v.up);down.update(S,P,t+.3,v.down);
      ph.update(t,v);ph.group.position.y=-.4+Math.sin(t*1.2)*.04;
      lock.visible=v.sec>.02;lock.scale.setScalar(.001+v.sec);lock.rotation.y=t*1.2;lm.opacity=shm.opacity=v.sec;
      wa.forEach(function(b,i){var f=((t*.22+i/3)%1);b.position.set(2.3+Math.sin(i*2)*.1,.1+f*1.5,1.1);b.material.opacity=v.alert*(f<.15?f/.15:1-(f-.15)/.85);b.visible=v.alert>.02;});
      lab[0].material.opacity=.35+.65*v.log;
    }};
};

/* ---------- boiler plant ---------- */
SCENES.boiler=function(st){
  var R=new T.Group();st.scene.add(R);softFloor(R,10.5,{cells:36,shadow:.25});
  var fades=[];
  /* materials */
  var tubeM=METAL(0xc3cbd4,.35);tubeM.emissive=new T.Color(0x7a2a00);tubeM.emissiveIntensity=.2;
  var frontTubeM=METAL(0xc3cbd4,.35);frontTubeM.emissive=new T.Color(0x7a2a00);frontTubeM.emissiveIntensity=.2;frontTubeM.transparent=true;
  var drumM=PAINT(0xD9542B,.42),orangeM=PAINT(0xE0702E,.45),steelM=METAL(0xa9b3be,.35),insM=METAL(0xd7dde3,.28);
  var structM=PAINT(0x2c3644,.6),railM=PAINT(0xF2C230,.45),concM=new T.MeshStandardMaterial({map:TEX.concrete,roughness:.95,metalness:0});
  var ductM=PAINT(0x7c8896,.45),darkM=M(0x22272d,{roughness:.5});
  function cladMat(w){var t=TEX.corr.clone();t.needsUpdate=true;t.repeat.set(Math.max(1,w*5),1);return new T.MeshStandardMaterial({color:0x56657a,metalness:.55,roughness:.42,normalMap:t,normalScale:new T.Vector2(.8,.8)});}
  function casing(cx,cy,w,h,d,key,front){var t=.05,cm=cladMat(w);
    box(w,h,t,cm,cx,cy,-d/2,R);var sm=cladMat(d);box(t,h,d,sm,cx-w/2,cy,0,R);box(t,h,d,sm,cx+w/2,cy,0,R);box(w+t,t,d+t,PAINT(0x3e4a59,.5),cx,cy+h/2,0,R);
    [-h/2+.05,h/2-.05].forEach(function(dy){box(w+.07,.05,d+.07,structM,cx,cy+dy,0,R);});
    var f=new T.Group();f.position.set(cx,cy,d/2);R.add(f);var fm=cladMat(w);fm.transparent=true;box(w+t,h,t,fm,0,0,0,f);
    for(var y=-h/2+.6;y<h/2;y+=.8)box(w+.07,.04,.03,structM,0,y,.03,f);
    if(front)front(f);
    var ms=[];f.traverse(function(o){if(o.material&&ms.indexOf(o.material)<0){o.material.transparent=true;ms.push(o.material);}});
    fades.push({ms:ms,o:f,z0:d/2,key:key});return f;}
  function hrail(a,b,p){p=p||R;var A=V(a),B=V(b),L=A.distanceTo(B),n=Math.max(1,Math.round(L/.6));rod([a[0],a[1]+1.0,a[2]],[b[0],b[1]+1.0,b[2]],.02,railM,p,10);rod([a[0],a[1]+.5,a[2]],[b[0],b[1]+.5,b[2]],.016,railM,p,10);
    for(var i=0;i<=n;i++){var P=A.clone().lerp(B,i/n);rod([P.x,P.y,P.z],[P.x,P.y+1.0,P.z],.018,railM,p,8);}box(L,.1,.01,railM,(a[0]+b[0])/2,a[1]+.05,(a[2]+b[2])/2,p).rotation.y=-Math.atan2(b[2]-a[2],b[0]-a[0]);}
  function grating(x0,x1,z0,z1,y){var w=x1-x0,d=z1-z0;var t=TEX.grate.clone();t.needsUpdate=true;t.repeat.set(w*6,d*6);
    box(w,.03,d,new T.MeshStandardMaterial({color:0x8c96a2,metalness:.6,roughness:.45,alphaMap:t,alphaTest:.5,transparent:false}),(x0+x1)/2,y,(z0+z1)/2,R);
    box(w,.08,.01,structM,(x0+x1)/2,y-.02,z0,R);box(w,.08,.01,structM,(x0+x1)/2,y-.02,z1,R);}
  function ladder(x,z,y0,y1,face){var g=new T.Group();g.position.set(x,0,z);g.rotation.y=face||0;R.add(g);
    rod([-.2,y0,0],[-.2,y1+1,0],.02,railM,g);rod([.2,y0,0],[.2,y1+1,0],.02,railM,g);
    var rungs=[];for(var y=y0+.3;y<y1;y+=.3)rungs.push([[-.2,y,0],[.2,y,0]]);irods(rungs,.012,railM,g,6);
    var cage=[];for(y=y0+2.2;y<y1+1;y+=.6){var tr=tor(.35,.012,railM,0,y,.3,g,PI);tr.rotation.x=PI/2;tr.rotation.z=PI;}
    for(var k=0;k<5;k++){var a=PI*k/4;rod([Math.cos(a)*.35,y0+2.2,.3+Math.sin(a)*.35],[Math.cos(a)*.35,y1+1,.3+Math.sin(a)*.35],.01,railM,g,6);}}
  function valve(x,y,z,r,axis,p){p=p||R;var g=new T.Group();g.position.set(x,y,z);p.add(g);if(axis==='z')g.rotation.y=PI/2;
    sph(r*1.4,steelM,0,0,0,g,16,12);cylX(r*1.5,r*.5,steelM,-r*1.3,0,0,g,20);cylX(r*1.5,r*.5,steelM,r*1.3,0,0,g,20);
    cyl(r*.7,r*.9,r*2.2,steelM,0,r*1.6,0,g,16);cyl(r*.15,r*.15,r*2,METAL(0xe5e8eb,.2),0,r*3.2,0,g,8);
    var hw=tor(r*1.3,r*.18,PAINT(0xd23b2f,.4),0,r*4.2,0,g);hw.rotation.x=PI/2;rod([-r*1.3,r*4.2,0],[r*1.3,r*4.2,0],r*.12,PAINT(0xd23b2f,.4),g,6);rod([0,r*4.2,-r*1.3],[0,r*4.2,r*1.3],r*.12,PAINT(0xd23b2f,.4),g,6);return g;}
  function gauge(x,y,z,p,ry){var c=cnv(128,128),g2=c.getContext('2d');g2.fillStyle='#fff';g2.beginPath();g2.arc(64,64,60,0,PI*2);g2.fill();g2.strokeStyle='#222';g2.lineWidth=3;for(var i=0;i<=10;i++){var a=PI*.75+i*PI*.15;g2.beginPath();g2.moveTo(64+Math.cos(a)*44,64+Math.sin(a)*44);g2.lineTo(64+Math.cos(a)*54,64+Math.sin(a)*54);g2.stroke();}
    g2.strokeStyle='#c0392b';g2.lineWidth=4;g2.beginPath();g2.moveTo(64,64);g2.lineTo(64+Math.cos(PI*1.8)*44,64+Math.sin(PI*1.8)*44);g2.stroke();g2.fillStyle='#222';g2.font='700 14px '+MONO;g2.textAlign='center';g2.fillText('kg/cm²',64,100);
    var gg=new T.Group();gg.position.set(x,y,z);gg.rotation.y=ry||0;(p||R).add(gg);cylZ(.075,.04,METAL(0xd5dade,.2),0,0,0,gg,28);var d=new T.Mesh(new T.CircleGeometry(.068,32),new T.MeshStandardMaterial({map:ctex(c),roughness:.2}));d.position.z=.021;gg.add(d);return gg;}

  /* ----- foundations & structure ----- */
  box(3.2,.12,2.2,concM,-.45,.06,0,R);box(1.3,.12,1.3,concM,1.95,.06,0,R);box(1.2,.12,1.2,concM,3.5,.06,0,R);box(1.0,.3,1.0,concM,4.95,.15,0,R);
  function column(x,z,h){box(.14,h,.014,structM,x,h/2,z-.055,R);box(.14,h,.014,structM,x,h/2,z+.055,R);box(.014,h,.11,structM,x,h/2,z,R);}
  [-2.3,-.6,1.05].forEach(function(x){[-1.15,1.15].forEach(function(z){column(x,z,4.95);});});
  [-1.15,1.15].forEach(function(z){box(3.5,.14,.12,structM,-.62,4.95,z,R);box(3.5,.1,.1,structM,-.62,3.78,z,R);rod([-2.3,.3,z],[-.6,3.6,z],.025,structM,R);rod([-.6,.3,z],[1.05,3.6,z],.025,structM,R);});
  [-2.3,-.6,1.05].forEach(function(x){box(.12,.14,2.42,structM,x,4.95,0,R);});
  /* walkway at drum level (front) + ladder */
  grating(-2.4,1.15,1.18,1.7,3.78);hrail([-2.4,3.79,1.7],[1.15,3.79,1.7]);hrail([-2.4,3.79,1.18],[-2.4,3.79,1.7]);
  ladder(1.45,1.45,0,3.78,-PI/2);

  /* ----- furnace with membrane walls ----- */
  var fx=-1.2,fw=1.6,fd=1.5,fy0=.45,fh=3.15;
  var tg=new T.CylinderGeometry(.034,.034,fh-.1,10),tubes=[],ftubes=[];
  for(var i=0;i<16;i++){var x=fx-fw/2+.05+i*.1;ftubes.push([x,fd/2-.09]);tubes.push([x,-fd/2+.09]);}
  for(i=0;i<14;i++){var z=-fd/2+.1+i*.1;tubes.push([fx-fw/2+.09,z]);tubes.push([fx+fw/2-.09,z]);}
  var im=new T.InstancedMesh(tg,tubeM,tubes.length),mt=new T.Matrix4();
  tubes.forEach(function(p,k){mt.makeTranslation(p[0],fy0+fh/2,p[1]);im.setMatrixAt(k,mt);});R.add(im);
  var fim=new T.InstancedMesh(tg,frontTubeM,ftubes.length);ftubes.forEach(function(p,k){mt.makeTranslation(p[0],fy0+fh/2,p[1]);fim.setMatrixAt(k,mt);});R.add(fim);
  var finM=METAL(0x9aa5b2,.4),ffinM=METAL(0x9aa5b2,.4);ffinM.transparent=true;
  box(fw-.08,fh-.1,.012,finM,fx,fy0+fh/2,-fd/2+.09,R);box(.012,fh-.1,fd-.1,finM,fx-fw/2+.09,fy0+fh/2,0,R);box(.012,fh-.1,fd-.1,finM,fx+fw/2-.09,fy0+fh/2,0,R);
  box(fw-.08,fh-.1,.012,ffinM,fx,fy0+fh/2,fd/2-.09,R);
  [fy0+.03,fy0+fh-.03].forEach(function(y){rod([fx-fw/2,y,fd/2-.09],[fx+fw/2,y,fd/2-.09],.065,orangeM,R);rod([fx-fw/2,y,-fd/2+.09],[fx+fw/2,y,-fd/2+.09],.065,orangeM,R);rod([fx-fw/2+.09,y,-fd/2],[fx-fw/2+.09,y,fd/2],.065,orangeM,R);});
  casing(fx,2.0,1.74,3.3,1.64,'open',function(f){
    [-.4,.4].forEach(function(dx){cylZ(.06,.06,steelM,dx,-.4,.05,f,20);var gl=new T.Mesh(new T.CircleGeometry(.04,20),GLOW(0xff7a1a,1.3));gl.position.set(dx,-.4,.081);f.add(gl);});
    rbox(.5,.45,.05,.03,PAINT(0x3a4554,.4),0,-1.2,.04,f);for(var k=0;k<12;k++){var a=k/12*PI*2;cylZ(.012,.03,steelM,Math.cos(a)*.21,-1.2+Math.sin(a)*.19,.075,f,8);}
    box(.34,.06,.06,steelM,.0,-1.2,.09,f);
  });
  /* grate + fuel bed + flames */
  var gc=cnv(64,64),gx=gc.getContext('2d');gx.fillStyle='#2a1a10';gx.fillRect(0,0,64,64);gx.fillStyle='#7a5530';for(i=0;i<4;i++)gx.fillRect(0,i*16,64,9);
  var gtx=new T.CanvasTexture(gc);gtx.wrapS=gtx.wrapT=T.RepeatWrapping;gtx.repeat.set(1,6);
  box(1.44,.08,1.34,M(0xffffff,{map:gtx,roughness:.8}),fx,fy0+.04,0,R);
  var bedM=new T.MeshStandardMaterial({color:0x3a1a0a,emissive:new T.Color(0xff5a10),emissiveIntensity:1.2,roughness:.9});box(1.3,.05,1.2,bedM,fx,fy0+.1,0,R);
  var flames=[],fl=new T.PointLight(0xff7a2a,3.5,7,2);fl.position.set(fx,1.6,0);R.add(fl);
  var fire=kFire(R,fx,0,1.25,1.15,fy0+.1,fy0+fh*.75);
  /* submerged ash conveyor */
  box(.5,.3,1.9,PAINT(0x3a4554,.5),fx,.2,1.5,R);rod([fx,.36,.6],[fx,.6,2.4],.03,steelM,R);
  /* ----- fuel feeding ----- */
  var hop=new T.Mesh(new T.CylinderGeometry(.46,.16,.6,4,1),PAINT(0x5d6b7c,.45));hop.rotation.y=PI/4;hop.position.set(-2.55,1.35,0);R.add(hop);
  rbox(.5,.18,.3,.02,PAINT(0x5d6b7c,.45),-2.25,.97,0,R);cylX(.08,.25,PAINT(0x1f5aa6,.4),-2.65,.97,0,R);box(.14,.14,.14,PAINT(0x1f5aa6,.4),-2.85,.97,0,R);
  grating(-3.1,-2.0,-.7,.7,1.7);hrail([-3.1,1.71,-.7],[-3.1,1.71,.7]);
  var Ac=new T.Vector3(-5.2,.35,0),Bc=new T.Vector3(-2.65,1.72,0),dir=Bc.clone().sub(Ac),Lc=dir.length(),ang=Math.atan2(dir.y,dir.x);
  var cg=new T.Group();cg.position.copy(Ac).add(Bc).multiplyScalar(.5);cg.rotation.z=ang;R.add(cg);
  box(Lc,.04,.46,M(0x17191c,{roughness:.9}),0,0,0,cg);[-.27,.27].forEach(function(z){box(Lc,.14,.04,PAINT(0xF2A541,.45),0,-.02,z,cg);});
  var idl=[];for(var s=-Lc/2+.15;s<Lc/2;s+=.3)idl.push([[s,-.06,-.24],[s,-.06,.24]]);irods(idl,.035,steelM,cg,14);
  [.2,.55,.9].forEach(function(u){var p=Ac.clone().lerp(Bc,u);rod([p.x,0,.22],[p.x,p.y-.08,.22],.03,structM,R);rod([p.x,0,-.22],[p.x,p.y-.08,-.22],.03,structM,R);rod([p.x,.4,.22],[p.x,.4,-.22],.02,structM,R);});
  var nrm=new T.Vector3(-Math.sin(ang),Math.cos(ang),0),chunks=[];var chM=M(0x8a5a2b,{roughness:.95});var chM2=M(0x6e4520,{roughness:.95});
  for(i=0;i<26;i++){var ss=.05+Math.random()*.05;var ch=new T.Mesh(new T.DodecahedronGeometry(ss,0),i%2?chM:chM2);ch.position.z=(Math.random()-.5)*.28;ch.rotation.set(Math.random()*3,Math.random()*3,0);R.add(ch);chunks.push(ch);}
  var heap=[];for(i=0;i<70;i++){var a2=Math.random()*PI*2,rr=Math.random()*.75;heap.push([-5.5+Math.cos(a2)*rr,.05+(.75-rr)*.5*Math.random()+.02,Math.sin(a2)*rr*.9,1+Math.random(),1+Math.random(),1+Math.random(),Math.random()*3,Math.random()*3]);}
  iboxes(heap,.09,.07,.1,M(0x7a4f28,{roughness:.95}),R);
  var hm=new T.Mesh(new T.ConeGeometry(.8,.45,24),M(0x6e4520,{roughness:1}));hm.position.set(-5.5,.22,0);R.add(hm);
  /* ----- BI-DRUM: steam drum (top) + mud drum (bottom) joined by the boiler bank; pendant superheater at furnace exit ----- */
  var dx0=.3,dy0=4.15,DR=.36,DL=1.9;
  var SDg=new T.Group(); SDg.position.set(dx0,dy0,0); SDg.rotation.y=PI/2; R.add(SDg); var SD=kHShell(SDg,{r:DR,L:DL,m:drumM,inner:0xd8c4b4,headK:.42});
  [-1,1].forEach(function(s){ var mz=s*(DL/2+DR*.42+.01); var mh=rbox(.26,.2,.05,.08,PAINT(0x3a4554,.4),dx0,dy0,mz,R); var bl=[]; for(var k2=0;k2<10;k2++){ var a=k2/10*PI*2; bl.push([dx0+Math.cos(a)*.11,dy0+Math.sin(a)*.08,mz+s*.03,0,0,1]); } icyl(bl,.011,.05,steelM,R,8); tor(.05,.01,steelM,dx0,dy0+.13,mz+s*.03,R).rotation.x=PI/2; });
  [-.62,.62].forEach(function(z){ box(.5,.16,.1,structM,dx0,dy0-DR-.02,z,R); box(.08,.28,.08,structM,dx0-.2,3.75,z,R); box(.08,.28,.08,structM,dx0+.2,3.75,z,R); });
  var MDY=.64, MR=.24; var MDg=new T.Group(); MDg.position.set(dx0,MDY,0); MDg.rotation.y=PI/2; R.add(MDg); var MD=kHShell(MDg,{r:MR,L:1.5,m:drumM,inner:0xd8c4b4,headK:.42});
  [-1,1].forEach(function(s){ var mz=s*(.75+MR*.42+.01); rbox(.18,.14,.04,.06,PAINT(0x3a4554,.4),dx0,MDY,mz,R); }); [-.5,.5].forEach(function(z){ box(.46,.28,.1,structM,dx0,.26,z,R); });
  /* boiler bank tubes: ends expanded into both drums */
  var btub=[]; for(var bxi=-2;bxi<=2;bxi++) for(var bzi=-5;bzi<=5;bzi++){ var tx=bxi*.085, tz=bzi*.115; btub.push([[dx0+tx,MDY+Math.sqrt(MR*MR-tx*tx)-.01,tz],[dx0+tx,dy0-Math.sqrt(DR*DR-tx*tx)+.01,tz]]); } irods(btub,.021,tubeM,R,10);
  box(.012,2.4,1.25,M(0x8a7f74,{roughness:.9}),dx0+.02,2.15,0,R);
  /* pendant superheater hanging in the furnace outlet */
  var shM=new T.MeshStandardMaterial({color:0x9a3b2a,emissive:new T.Color(0xff4a1a),emissiveIntensity:.6,metalness:.5,roughness:.4}), hdrM=PAINT(0xE0702E,.45);
  rod([-.74,3.84,-.62],[-.74,3.84,.62],.05,hdrM,R); rod([-.48,3.84,-.62],[-.48,3.84,.62],.05,hdrM,R); [-.62,.62].forEach(function(z){ sph(.05,hdrM,-.74,3.84,z,R,12,8); sph(.05,hdrM,-.48,3.84,z,R,12,8); });
  [-.45,-.27,-.09,.09,.27,.45].forEach(function(z){ kTube(R,[[-.74,3.82,z],[-.74,2.55,z],[-.66,2.55,z],[-.66,3.45,z],[-.58,3.45,z],[-.58,2.55,z],[-.48,2.55,z],[-.48,3.82,z]],.017,shM,{rb:.035,fl:false,seg:10}); });
  /* saturated steam: drum top -> SH inlet header */
  [-.3,.3].forEach(function(z){ kTube(R,[[dx0,dy0+DR-.01,z],[dx0,4.66,z],[-.74,4.66,z],[-.74,3.89,z]],.035,insM,{ins:true,fl:false}); });
  /* furnace risers into the drum side, downcomers to the bottom headers */
  [[-1.6,-.42],[-1.2,-.42],[-.9,.42],[-1.4,.42]].forEach(function(p){ kTube(R,[[p[0],fy0+fh+.02,p[1]],[p[0],4.3,p[1]],[dx0-DR+.02,4.3,p[1]*.9]],.045,orangeM,{fl:false,rb:.12}); });
  [-1,1].forEach(function(s){ kTube(R,[[dx0+.14,dy0-DR+.03,s*.86],[dx0+.14,.5,s*.86],[fx+fw/2-.05,.5,s*.86],[fx+fw/2-.05,.5,s*(fd/2-.09)]],.065,orangeM,{fl:false,rb:.18}); });
  /* ----- second pass = boiler bank enclosure ----- */
  casing(.3,2.0,.92,3.25,1.32,'open');
  /* ----- ducts, economiser, APH ----- */
  function duct(w,h,d,x,y,z){box(w,h,d,ductM,x,y,z,R);}
  duct(.6,.32,.52,.95,.72,0);duct(.32,2.95,.52,1.13,2.06,0);duct(.5,.32,.52,1.37,3.4,0);
  for(i=0;i<4;i++)tor(.2,.02,steelM,1.13,1.2+i*.06,0,R).rotation.x=PI/2;
  casing(1.95,2.85,.82,1.12,1.02,'aph',function(f){rbox(.3,.22,.04,.02,PAINT(0x3a4554,.4),.15,0,.03,f);});
  var ecoM=METAL(0x6f9fc4,.35);ecoM.emissive=new T.Color(0x13A89E);ecoM.emissiveIntensity=.25;
  var eco=[],fins=[];for(var r2=0;r2<6;r2++)for(var c2=0;c2<3;c2++){eco.push([[1.75+c2*.2,2.43+r2*.17,-.42],[1.75+c2*.2,2.43+r2*.17,.42]]);for(var fz=-.38;fz<.4;fz+=.04)fins.push([1.75+c2*.2,2.43+r2*.17,fz,1,1,1,0,0,0]);}
  irods(eco,.03,ecoM,R,12);iboxes(fins,.08,.08,.004,METAL(0x8fb4d0,.4),R);
  duct(.62,.12,.82,1.95,2.24,0);
  casing(1.95,1.55,.82,1.32,1.02,'aph',function(f){rbox(.3,.22,.04,.02,PAINT(0x3a4554,.4),-.15,.2,.03,f);});
  var aph=[];for(r2=0;r2<6;r2++)for(c2=0;c2<4;c2++)aph.push([[1.68+r2*.105,.95,-.33+c2*.22],[1.68+r2*.105,2.15,-.33+c2*.22]]);irods(aph,.032,METAL(0xb2bcc7,.35),R,12);
  [[1.6,.45,.42],[2.3,.45,.42],[1.6,.45,-.42],[2.3,.45,-.42]].forEach(function(p){box(.08,.9,.08,structM,p[0],p[1],p[2],R);});
  duct(.82,.28,.46,2.45,.75,0);duct(.22,1.4,.42,2.8,1.4,0);duct(.32,.22,.36,2.95,2.02,0);
  /* multicyclone */
  [[-.22,-.22],[.22,-.22],[-.22,.22],[.22,.22]].forEach(function(p){cyl(.17,.17,.8,steelM,3.5+p[0],1.85,p[1],R,24);cyl(.17,.05,.45,steelM,3.5+p[0],1.225,p[1],R,24);cyl(.06,.06,.25,steelM,3.5+p[0],2.36,p[1],R,12);});
  rbox(.9,.18,.9,.02,ductM,3.5,2.48,0,R);
  var hp=new T.Mesh(new T.CylinderGeometry(.45,.12,.5,4,1),ductM);hp.rotation.y=PI/4;hp.position.set(3.5,.75,0);R.add(hp);cyl(.1,.1,.14,PAINT(0x1f5aa6,.4),3.5,.42,0,R,16);
  [[3.05,-.45],[3.95,-.45],[3.05,.45],[3.95,.45]].forEach(function(p){box(.06,2.4,.06,structM,p[0],1.2,p[1],R);});
  duct(.6,.22,.32,3.92,2.48,0);duct(.24,1.6,.36,4.16,1.72,0);
  /* ID fan set */
  var fan=new T.Group();fan.position.set(4.16,.58,0);R.add(fan);cylZ(.42,.32,PAINT(0x56657a,.45),0,0,0,fan,40);box(.3,.34,.32,PAINT(0x56657a,.45),.3,.12,0,fan);
  cylZ(.12,.12,steelM,0,0,-.22,fan,20);
  var mot=new T.Group();mot.position.set(4.16,.4,-.95);R.add(mot);cylZ(.2,.5,PAINT(0x1f5aa6,.4),0,0,0,mot,36);cylZ(.205,.12,PAINT(0x1f5aa6,.4),0,0,-.3,mot,36);rbox(.14,.1,.14,.01,PAINT(0x1f5aa6,.4),0,.2,0,mot);box(.5,.08,.7,structM,0,-.18,-.05,R).position.set(4.16,.12,-.85);
  var coup=new T.Group();coup.position.set(4.16,.5,-.55);R.add(coup);cylZ(.09,.08,PAINT(0xF2A541,.4),0,0,0,coup,24);for(i=0;i<6;i++)cylZ(.008,.1,steelM,Math.cos(i*PI/3)*.065,Math.sin(i*PI/3)*.065,0,coup,8);
  duct(.6,.26,.34,4.65,.58,0);
  /* chimney */
  var chx=5.15;cyl(.26,.34,5.8,PAINT(0x9aa6b4,.4),chx,3.2,0,R,36);
  for(var yy=1.0;yy<6;yy+=1.1)tor(.3,.025,steelM,chx,yy,0,R).rotation.x=PI/2;
  [4.95,5.75].forEach(function(y){cyl(.31,.31,.18,PAINT(0xF2A541,.45),chx,y,0,R,36);});
  var plt=new T.Group();plt.position.set(chx,5.25,0);R.add(plt);var pr=new T.Mesh(new T.RingGeometry(.3,.75,40),new T.MeshStandardMaterial({color:0x8c96a2,metalness:.6,roughness:.45,side:T.DoubleSide}));pr.rotation.x=-PI/2;plt.add(pr);
  tor(.75,.018,railM,0,.9,0,plt).rotation.x=PI/2;tor(.75,.014,railM,0,.45,0,plt).rotation.x=PI/2;for(i=0;i<10;i++){var a3=i/10*PI*2;rod([Math.cos(a3)*.75,0,Math.sin(a3)*.75],[Math.cos(a3)*.75,.9,Math.sin(a3)*.75],.014,railM,plt,6);}
  ladder(chx+.36,0,.3,5.25,PI/2);
  var avl=sph(.06,new T.MeshStandardMaterial({color:0xff2a2a,emissive:new T.Color(0xff2a2a),emissiveIntensity:1}),chx,6.16,0,R,12,8);
  var probe=rbox(.2,.12,.12,.02,PAINT(0xF2A541,.4),chx,1.5,.36,R);
  /* FD fan + air ducts */
  var fd=new T.Group();fd.position.set(2.85,1.55,1.15);R.add(fd);cylZ(.24,.22,PAINT(0x56657a,.45),0,0,0,fd,32);var fimp=new T.Group();fimp.position.z=.12;fd.add(fimp);for(i=0;i<8;i++){var b2=box(.03,.2,.012,PAINT(0x13A89E,.4),0,0,0,fimp);b2.rotation.z=i*PI/4;b2.position.set(Math.sin(-i*PI/4)*.09,Math.cos(i*PI/4)*.09,0);}
  cylX(.14,.3,PAINT(0x1f5aa6,.4),2.5,1.55,1.15,R,24);box(.6,1.5,.08,structM,2.85,.75,1.15,R);
  var airM=PAINT(0x7c94ad,.45);pipe([[2.85,1.55,1.0],[2.85,1.55,.42],[2.37,1.55,.42]],.085,airM,R,{flanges:.4});
  pipe([[1.95,1.55,-.52],[1.95,1.55,-1.32],[-1.2,1.55,-1.32],[-1.2,.27,-1.32],[-1.2,.27,-.84]],.1,PAINT(0xb5824a,.45),R,{flanges:.7,fm:steelM});
  /* deaerator + feed pumps */
  var da=new T.Group();da.position.set(2.4,2.35,2.25);R.add(da);cylX(.3,1.4,PAINT(0xe4e8ec,.35),0,0,0,da,36);[-.7,.7].forEach(function(x){var e=sph(.3,PAINT(0xe4e8ec,.35),x,0,0,da,24,16);e.scale.x=.4;});cyl(.18,.18,.5,PAINT(0xe4e8ec,.35),-.3,.4,0,da,24);
  [[1.9,1.85],[2.9,1.85],[1.9,2.65],[2.9,2.65]].forEach(function(p){box(.08,2.05,.08,structM,p[0],1.03,p[1],R);});box(1.3,.08,1.0,structM,2.4,2.05,2.25,R);
  var fp1=buildPumpSet(0x1f5aa6),fp2=buildPumpSet(0x1f5aa6);fp1.group.scale.setScalar(.7);fp2.group.scale.setScalar(.7);fp1.group.position.set(2.05,0,2.25);fp2.group.position.set(2.85,0,2.25);fp1.group.rotation.y=fp2.group.rotation.y=-PI/2;R.add(fp1.group);R.add(fp2.group);
  pipe([[2.4,2.05,2.25],[2.4,.6,2.25],[2.05,.6,2.25]],.04,steelM,R);pipe([[2.05,.4,2.0],[2.05,.4,1.4],[2.4,.4,1.4],[2.4,3.15,1.4],[2.4,3.15,.55]],.045,PAINT(0x2f8ce0,.4),R);
  valve(2.4,1.2,1.4,.04,'z',R);
  /* steam main + header */
  kTube(R,[[-.48,3.89,-.45],[-.48,4.82,-.45],[-.48,4.82,-1.95],[.85,4.82,-1.95]],.075,insM,{ins:true,insT:.0001,fl:[true,false]}); kHV(R,.06,-.48,4.82,-.95,PI/2); cyl(.05,.05,.05,steelM,-.48,3.9,-.45,R,14);
  var bare=new T.MeshStandardMaterial({color:0x9a3b2a,emissive:new T.Color(0xff4a1a),emissiveIntensity:.2,metalness:.6,roughness:.4});rod([.85,4.82,-1.95],[1.6,4.82,-1.95],.058,bare,R);
  pipe([[1.6,4.82,-1.95],[3.75,4.82,-1.95],[3.75,1.3,-1.95]],.075,insM,R);
  rod([2.4,1.3,-1.95],[6.1,1.3,-1.95],.09,insM,R);
  [[1.6,4.82,-1.95],[.85,4.82,-1.95]].forEach(function(p){cylX(.1,.04,steelM,p[0],p[1],p[2],R,20);});
  [2.7,4.3,5.6].forEach(function(x){rod([x,1.3,-1.95],[x,.62,-1.95],.045,insM,R);rbox(.55,.55,.55,.04,PAINT(0x0B2545,.45),x,.3,-1.95,R);valve(x,1.0,-1.95,.03,'y',R);rbox(.1,.08,.08,.01,PAINT(0x2f6bd8,.4),x+.08,.7,-1.75,R);});
  [[3.75,3.0,-1.95]].forEach(function(p){valve(p[0],p[1],p[2],.05,'y',R);});
  /* control panel near boiler */
  var cp=makePanel({tag:'BLR-01',title:'BOILER PANEL'});cp.group.scale.setScalar(.55);cp.group.position.set(-3.9,0,2.2);cp.group.rotation.y=.55;R.add(cp.group);
  kTray(R,[-3.62,1.98],[-1.9,1.98],.3,.2); kTray(R,[-2.0,1.98],[-2.0,.98],.3,.2,{legs:false}); kTraySeg(R,new T.Vector3(-2.0,.32,.96),new T.Vector3(-2.0,.62,.96),.1,new T.Vector3(1,0,0)); var ccab=kCab(R,[[-3.72,.08,2.1],[-3.72,.33,2.1],[-3.72,.33,1.98],[-2.0,.33,1.98],[-2.0,.33,.96],[-2.0,.6,.96]],0x13A89E,{r:.012,n:4});
  var dbeam=beam(R,0xE8891E,{n:5,w:.045});var dA=new T.Vector3(-3.9,1.2,2.2),dB=new T.Vector3(-3.9,5.6,2.2);
  var cloud=label('Trionix server · Pune HQ',{pos:[-3.9,5.85,2.2],border:'#E8891E',h:.24});R.add(cloud);
  /* particles */
  function flow(pts,N,c0,c1,size,blend){var path=polyPath(pts);var pos=new Float32Array(N*3),col=new Float32Array(N*3);var gm=new T.BufferGeometry();gm.setAttribute('position',new T.BufferAttribute(pos,3));gm.setAttribute('color',new T.BufferAttribute(col,3));
    var mtl=new T.PointsMaterial({size:size||.13,map:DOT,vertexColors:true,transparent:true,depthWrite:false,blending:blend||T.NormalBlending,toneMapped:false});var p=new T.Points(gm,mtl);p.frustumCulled=false;R.add(p);
    var A=new T.Color(c0),B=new T.Color(c1),cc=new T.Color(),off=[];for(var i=0;i<N;i++)off.push(Math.random());
    return {set:function(k){mtl.opacity=k;p.visible=k>.02;},update:function(t,speed){if(!p.visible)return;for(var i=0;i<N;i++){var u=(off[i]+t*speed)%1;var q=path.getPointAt(u);pos[i*3]=q.x+(Math.sin(i*12.9)*.06);pos[i*3+1]=q.y+(Math.cos(i*7.1)*.06);pos[i*3+2]=q.z+(Math.sin(i*3.3)*.12);cc.copy(A).lerp(B,u);col[i*3]=cc.r;col[i*3+1]=cc.g;col[i*3+2]=cc.b;}gm.attributes.position.needsUpdate=true;gm.attributes.color.needsUpdate=true;}};}
  var flue=flow([[-1.2,.8,0],[-1.2,3.3,0],[-.25,3.45,0],[.3,3.1,0],[.3,.8,0],[.8,.7,0],[1.13,.9,0],[1.13,3.2,0],[1.6,3.4,0],[1.95,3.1,0],[1.95,2.3,0],[1.95,1.0,0],[2.4,.75,0],[2.8,.9,0],[2.8,2.0,0],[3.1,2.02,0],[3.5,1.6,0],[3.5,2.48,0],[3.92,2.48,0],[4.16,2.3,0],[4.16,.9,0],[4.4,.58,0],[chx,.58,0],[chx,6.0,0]],260,0xff6a1a,0x6f7f92,.16);
  var air=flow([[2.85,1.55,1.05],[2.85,1.55,.42],[1.95,1.55,.2],[1.95,1.55,-.52],[1.95,1.55,-1.32],[-1.2,1.55,-1.32],[-1.2,.27,-1.32],[-1.2,.27,-.4]],130,0x2f8ce0,0xE8891E,.13);
  var steam1=flow([[dx0,dy0+.45,.3],[dx0,4.66,.3],[-.74,4.66,.3],[-.74,3.9,.3],[-.74,2.6,.3],[-.48,2.6,.3],[-.48,4.82,-.45],[-.48,4.82,-1.95],[3.75,4.82,-1.95],[3.75,1.3,-1.95],[5.6,1.3,-1.95],[5.6,.6,-1.95]],120,0x8fc7f2,0x2f8ce0,.12);
  var steam2=flow([[3.75,1.3,-1.95],[2.7,1.3,-1.95],[2.7,.6,-1.95]],30,0x8fc7f2,0x2f8ce0,.12);
  var smoke=[];for(i=0;i<34;i++){var sm=new T.Sprite(new T.SpriteMaterial({map:DOT,color:0x9aa4ae,transparent:true,depthWrite:false}));R.add(sm);smoke.push(sm);}
  var puffs=[];for(i=0;i<8;i++){var pf=new T.Sprite(new T.SpriteMaterial({map:DOT,color:0xdfe8f0,transparent:true,depthWrite:false}));R.add(pf);puffs.push(pf);}
  var mk=[[3.0,4.82,-1.86],[1.22,4.82,-1.86],[4.38,.7,-1.7],[chx,1.5,.45],[-.45,.5,1.05]].map(function(p){var s=new T.Sprite(new T.SpriteMaterial({map:RING,transparent:true,depthTest:false,toneMapped:false}));s.position.copy(V(p));s.renderOrder=19;R.add(s);return s;});
  var aud=[label('Steam leak',{pos:[3.0,5.3,-1.8],border:'#E8891E',h:.24}),label('Bare pipe · insulation',{pos:[1.2,5.3,-1.8],border:'#E8891E',h:.24}),label('Steam trap survey',{pos:[4.4,1.2,-1.5],border:'#E8891E',h:.24}),label('Flue gas O₂ · CO · temp',{pos:[chx+.7,1.95,.45],border:'#E8891E',h:.24}),label('Blowdown · TDS',{pos:[-.45,1.0,1.25],border:'#E8891E',h:.24})];
  var tmp=[label('Furnace ≈ 950 °C',{pos:[-1.2,3.1,1.1],h:.24,border:'#ff6a1a'}),label('After superheater ≈ 600 °C',{pos:[.3,2.6,1.0],h:.24,border:'#ff8a3a'}),label('Economiser in ≈ 380 °C',{pos:[1.95,3.7,.8],h:.24,border:'#E8891E'}),label('APH in ≈ 250 °C',{pos:[2.25,2.0,.95],h:.24,border:'#b08a4a'}),label('Stack ≈ 150 °C',{pos:[chx+.6,2.45,.3],h:.24,border:'#6f7f92'}),label('Hot air to grate',{pos:[-.2,1.9,-1.35],h:.22,border:'#2f8ce0'})];
  aud.concat(tmp).forEach(function(l){R.add(l);});
  var fdl=label('Fuel feeding',{pos:[-4.0,1.65,.5],h:.22});R.add(fdl);
  var cbo=label('Boiler control panel',{pos:[-3.9,1.55,2.5],h:.22});R.add(cbo);
  var fanSpin=[coup,fimp],fpu=[fp1,fp2];
  /* ===== DEEP DETAIL: bi-drum internals (no cyclones), mountings, instruments ===== */
  var K=km(), deepUp=[], FD0=1.5;
  var DI=new T.Group(); DI.position.set(dx0,dy0,0); R.add(DI); var inM=METAL(0xb9c2cb,.3), inMd=new T.MeshStandardMaterial({color:0xb9c2cb,metalness:.75,roughness:.3,side:T.DoubleSide});
  var wr=DR-.012, wl=-.03, th1=Math.asin(wl/wr), th2=PI-th1, wsh=new T.Shape(); wsh.moveTo(wr*Math.cos(th2),wl); wsh.absarc(0,0,wr,th2,th1+2*PI,false); wsh.lineTo(wr*Math.cos(th2),wl);
  var wgeo=new T.ExtrudeGeometry(wsh,{depth:DL-.05,bevelEnabled:false,curveSegments:32}); wgeo.translate(0,0,-(DL-.05)/2);
  var waterM=new T.MeshPhysicalMaterial({color:0x3a8fd6,transparent:true,opacity:.55,roughness:.08,clearcoat:1,emissive:new T.Color(0x0d3a66),emissiveIntensity:.3,depthWrite:false}); var water=new T.Mesh(wgeo,waterM); water.__noShadow=true; DI.add(water);
  var nwl=new T.Mesh(new T.PlaneGeometry(DL-.1,.012),BM(0x3FD9CB,{transparent:true,opacity:.9,toneMapped:false,side:T.DoubleSide})); nwl.rotation.y=PI/2; nwl.position.set(wr*.98,wl,0); DI.add(nwl);
  /* deflector baffle on the riser side: mixture is turned down below the water line */
  var baf=new T.Mesh(new T.CylinderGeometry(wr-.045,wr-.045,DL-.15,28,1,true,4.37,1.07),inMd); baf.rotation.x=PI/2; DI.add(baf); box(.06,.008,DL-.15,inM,-.2,-.205,0,DI);
  for(var ri=0;ri<4;ri++){ var rz=[-.38,-.38,.38,.38][ri]*.9+[-.2,.2,-.2,.2][ri]; cylX(.045,.06,inM,-DR+.03,.15,rz,DI,14); }
  /* chevron steam separator box + dry plate + steam outlets to superheater */
  [-1,1].forEach(function(sx){ box(.008,.11,1.5,inM,sx*.13,.215,0,DI); }); box(.27,.008,1.5,inM,0,.16,0,DI);
  for(var ci=0;ci<12;ci++){ var cv=box(.006,.1,1.46,inM,-.115+ci*.021,.215,0,DI); cv.rotation.z=ci%2?.55:-.55; }
  box(.27,.008,1.5,inM,0,.275,0,DI); var dh=[]; for(var dzi=-.7;dzi<=.7;dzi+=.06) for(var dxi=-.1;dxi<=.1;dxi+=.05) dh.push([dxi,.28,dzi]); iboxes(dh,.012,.004,.012,M(0x15171a),DI);
  [-.3,.3].forEach(function(z){ cyl(.045,.045,.09,inM,0,.32,z,DI,14); });
  /* feed distribution, chemical dosing, continuous blowdown */
  rod([.15,-.2,-.86],[.15,-.2,.86],.022,PAINT(0x2f8ce0,.4),DI); var holes=[]; for(var hz=-.8;hz<=.8;hz+=.07) holes.push([.15,-.223,hz]); iboxes(holes,.012,.006,.012,M(0x111),DI);
  rod([-.03,-.27,-.8],[-.03,-.27,.8],.011,PAINT(0xF2A541,.4),DI); rod([.05,-.085,-.8],[.05,-.085,.8],.013,PAINT(0x13A89E,.4),DI); var sl=[]; for(hz=-.75;hz<=.75;hz+=.1) sl.push([.05,-.072,hz]); iboxes(sl,.004,.006,.03,M(0x111),DI);
  /* bank tube ends + downcomer nozzles in the drum bottom */
  var ends=[]; for(var bx2=-2;bx2<=2;bx2++) for(var bz2=-5;bz2<=5;bz2++){ var tx2=bx2*.085; ends.push([tx2,-Math.sqrt(wr*wr-tx2*tx2)+.02,bz2*.115]); } icyl(ends,.02,.04,METAL(0x9aa5b2,.35),DI,8);
  [-.86,.86].forEach(function(z){ cyl(.07,.07,.05,inM,.14,-DR+.04,z,DI,16); });
  var bubs=[]; for(ci=0;ci<40;ci++){ var bb=new T.Sprite(pulseMat(ci%3?0xffffff:0xbfe6ff)); bb.scale.setScalar(.03); DI.add(bb); bubs.push({s:bb,o:Math.random(),x:-.28+Math.random()*.14,z:(Math.random()-.5)*1.6,k:ci%3}); }
  var stm=[]; for(ci=0;ci<26;ci++){ var sb=new T.Sprite(pulseMat(0xf2f6ff)); sb.scale.setScalar(.03); DI.add(sb); stm.push({s:sb,o:Math.random(),x:(Math.random()-.5)*.4,z:(Math.random()-.5)*1.4}); }
  /* mud drum internals: blowdown pipe + tube ends */
  var MI=new T.Group(); MI.position.set(dx0,MDY,0); R.add(MI); rod([0,-.16,-.68],[0,-.16,.68],.016,PAINT(0x13A89E,.4),MI); var me=[]; for(bx2=-2;bx2<=2;bx2++) for(bz2=-5;bz2<=5;bz2++){ var tx3=bx2*.085; me.push([tx3,Math.sqrt((MR-.01)*(MR-.01)-tx3*tx3)-.02,bz2*.115]); } icyl(me,.02,.04,METAL(0x9aa5b2,.35),MI,8);
  var msl=new T.Mesh(new T.CylinderGeometry(MR-.02,MR-.02,1.4,24,1,false,PI*.75,PI*.5),new T.MeshStandardMaterial({color:0x5a4a3a,roughness:1})); msl.rotation.x=PI/2; msl.scale.set(1,1,1); MI.add(msl);
  /* drum mountings */
  [[-.12,-.45],[-.12,.45]].forEach(function(p){ var sv=new T.Group(); sv.position.set(dx0+p[0],dy0+DR-.01,p[1]); R.add(sv); cyl(.055,.065,.1,steelM,0,.05,0,sv,16); kFlange(sv,new T.Vector3(0,.1,0),new T.Vector3(0,1,0),.05); cyl(.05,.05,.22,PAINT(0xd23b2f,.4),0,.22,0,sv,16); cyl(.03,.04,.1,steelM,0,.38,0,sv,12); rod([0,.42,0],[.18,.4,0],.012,steelM,sv); cylX(.045,.12,steelM,.08,.14,0,sv,12); kTube(sv,[[.14,.14,0],[.3,.14,0],[.3,1.25,0]],.035,steelM,{fl:[true,false]}); });
  kHV(R,.022,dx0+.14,dy0+DR+.05,.72,0); cyl(.016,.016,.06,steelM,dx0+.14,dy0+DR+.01,.72,R,10);
  var gl=[]; [-.18,.18].forEach(function(gx){ var g3=new T.Group(); g3.position.set(dx0+gx,dy0,DL/2+DR*.42+.05); R.add(g3); rod([0,-.33,0],[0,.33,0],.024,steelM,g3); rod([0,.3,-.08],[0,.3,0],.018,steelM,g3); rod([0,-.3,-.08],[0,-.3,0],.018,steelM,g3); rbox(.06,.42,.05,.01,steelM,.06,0,0,g3); var lv=box(.028,.2,.052,GLOW(0x13A89E,.9),.06,-.06,.002,g3); gl.push(lv); kHV(g3,.012,0,-.4,0,PI/2); });
  var lvl=gl[0], lvl2=gl[1];
  var ec=new T.Group(); ec.position.set(dx0-.44,dy0,.98); R.add(ec); cyl(.05,.05,.62,steelM,0,0,0,ec,16); kTube(ec,[[0,.28,0],[.12,.28,0],[.12,.28,-.1]],.016,steelM,{fl:false}); kTube(ec,[[0,-.28,0],[.12,-.28,0],[.12,-.28,-.1]],.016,steelM,{fl:false}); for(ci=0;ci<3;ci++){ cyl(.011,.011,.08,steelM,-.025+ci*.025,.35,0,ec,8); cyl(.016,.016,.035,K.black,-.025+ci*.025,.4,0,ec,10); }
  var lt101=kPT(R,'LT-101','%',50.0,dx0+.55,dy0-.82,.86); deepUp.push(lt101.update); cylX(.035,.12,steelM,dx0+.55,dy0+.34,.86,R,14); kTube(R,[[dx0+.3,dy0+.22,.82],[dx0+.49,dy0+.34,.86]],.007,steelM,{fl:false}); kTube(R,[[dx0+.55,dy0+.3,.86],[dx0+.55,dy0-.6,.86]],.006,steelM,{fl:false}); kTube(R,[[dx0+.3,dy0-.22,.82],[dx0+.6,dy0-.22,.86],[dx0+.6,dy0-.62,.86]],.006,steelM,{fl:false});
  var pt101=kPT(R,'PT-101','kg/cm²',45.2,dx0-.15,dy0+DR-.02,-.72); deepUp.push(pt101.update); kGauge(R,dx0-.08,dy0+.2,DL/2+DR*.42+.06,0,'kg/cm²');
  kTube(R,[[dx0+.06,dy0-DR+.02,.82],[dx0+.06,dy0-.55,.95],[dx0+.06,dy0-.55,1.25]],.012,steelM,{fl:false}); kHV(R,.016,dx0+.06,dy0-.55,1.12,PI/2,PAINT(0x13A89E,.4));
  kTube(R,[[dx0-.12,dy0-.18,DL/2+.1],[dx0-.12,dy0-.18,1.3]],.01,steelM,{fl:false}); kHV(R,.013,dx0-.12,dy0-.18,1.22,PI/2,PAINT(0xF2A541,.4));
  /* feed water from economiser into the drum, with check + stop valves */
  kTube(R,[[1.75,3.45,-.52],[1.75,4.25,-.52],[dx0+DR-.01,4.25,-.52]],.035,PAINT(0x2f8ce0,.4),{fl:false}); kHV(R,.03,1.1,4.25,-.52,0,PAINT(0x2f8ce0,.4)); var nrv=new T.Group(); nrv.position.set(1.4,4.25,-.52); R.add(nrv); cylX(.05,.14,steelM,0,0,0,nrv,16); cyl(.04,.04,.07,steelM,0,.06,0,nrv,12);
  var ft101=kMag(R,'FT-101',.06,-.48,4.82,-1.45,PI/2,'t/h',22.4); deepUp.push(ft101.update);
  var ft102=kMag(R,'FT-102',.04,2.4,2.25,1.4,0,'t/h',22.1); ft102.group.rotation.z=PI/2; deepUp.push(ft102.update);
  kCV(R,'FCV-101',.035,2.22,.4,1.4);
  var tt104=kTT(R,'TT-104',455,-.48,3.9,.55); deepUp.push(tt104.update);
  var shv=new T.Group(); shv.position.set(-.48,3.89,.32); R.add(shv); cyl(.045,.05,.08,steelM,0,.04,0,shv,14); cyl(.04,.04,.18,PAINT(0xd23b2f,.4),0,.16,0,shv,14); kTube(shv,[[.06,.1,0],[.18,.1,0],[.18,.95,0]],.03,steelM,{fl:[true,false]});
  /* mud drum intermittent blowdown */
  kTube(R,[[dx0,MDY-MR+.01,.6],[dx0,.22,.6],[dx0,.22,1.15],[-2.08,.22,1.15],[-2.08,.22,1.75]],.03,steelM,{fl:false,rb:.1}); kHV(R,.03,dx0,.22,.85,PI/2); kHV(R,.03,dx0-.4,.22,1.15,0);
  /* headers: handholes + blowdown */
  [fy0+.03,fy0+fh-.03].forEach(function(y){ for(var hx=fx-fw/2+.15;hx<fx+fw/2;hx+=.25){ cylZ(.026,.05,steelM,hx,y,FD0/2-.09+.08,R,12); cylZ(.034,.012,steelM,hx,y,FD0/2-.09+.105,R,12); } });
  kTube(R,[[fx-fw/2,fy0+.03,FD0/2-.09],[fx-fw/2-.16,fy0+.03,FD0/2-.09],[fx-fw/2-.16,.3,FD0/2-.09],[fx-fw/2-.16,.3,1.75],[-2.08,.3,1.75]],.03,steelM,{fl:false,rb:.08}); kHV(R,.03,fx-fw/2-.16,.3,1.0,PI/2); kHV(R,.03,fx-fw/2-.16,.3,1.3,PI/2);
  var bdt=new T.Group(); bdt.position.set(-2.36,0,1.75); R.add(bdt); cyl(.28,.28,.9,PAINT(0x56657a,.45),0,.55,0,bdt,28); var bdh=sph(.28,PAINT(0x56657a,.45),0,1.0,0,bdt,24,10); bdh.scale.y=.35; [0,2.1,4.2].forEach(function(a){ box(.05,.12,.05,structM,Math.cos(a)*.2,.06,Math.sin(a)*.2,bdt); }); kTube(bdt,[[0,1.08,0],[0,2.9,0],[.15,3.05,0]],.04,steelM,{fl:[true,false]}); cyl(.06,.05,.12,steelM,.2,3.06,0,bdt,12);
  /* refractory under the water walls */
  var bc=cnv(128,64),bx3=bc.getContext('2d'); bx3.fillStyle='#8a3b22'; bx3.fillRect(0,0,128,64); bx3.fillStyle='#c9b9a2'; for(var r3=0;r3<4;r3++){ bx3.fillRect(0,r3*16,128,2); for(var c3=0;c3<5;c3++) bx3.fillRect((c3*32+(r3%2)*16)%128,r3*16,2,16); } var btex=new T.CanvasTexture(bc); btex.wrapS=btex.wrapT=T.RepeatWrapping; btex.repeat.set(4,1); btex.encoding=T.sRGBEncoding;
  var refM=new T.MeshStandardMaterial({map:btex,roughness:.95}); box(fw-.25,.36,.06,refM,fx,fy0+.28,-FD0/2+.17,R); box(.06,.36,FD0-.3,refM,fx-fw/2+.17,fy0+.28,0,R); box(.06,.36,FD0-.3,refM,fx+fw/2-.17,fy0+.28,0,R);
  /* grate drive + under-grate air zone dampers */
  var gd=new T.Group(); gd.position.set(fx+fw/2+.15,.32,.95); R.add(gd); rbox(.22,.2,.18,.02,PAINT(0x1f5aa6,.4),0,0,0,gd); kMotor2(gd,.24,0,0,.55,null,0); cylZ(.03,.5,steelM,-.1,0,-.3,gd,12);
  var dmps=[]; [-.45,0,.45].forEach(function(dx){ var dg=new T.Group(); dg.position.set(fx+dx,.24,-FD0/2-.12); R.add(dg); box(.28,.22,.1,ductM,0,0,0,dg); rbox(.1,.08,.08,.01,PAINT(0x1f5aa6,.4),0,.16,-.04,dg); var lv=new T.Group(); lv.position.set(.15,0,-.06); dg.add(lv); box(.012,.12,.012,steelM,0,.05,0,lv); dmps.push(lv); });
  /* economiser return bends + APH tube sheets */
  var mb=new T.Matrix4(), q=new T.Quaternion();
  for(var ec2=0;ec2<3;ec2++) for(var er=0;er<5;er++){ var ez=er%2?-.42:.42, bend=new T.Mesh(new T.TorusGeometry(.085,.03,8,14,PI),ecoM); mb.makeBasis(new T.Vector3(0,1,0),new T.Vector3(0,0,ez>0?1:-1),new T.Vector3(ez>0?1:-1,0,0)); q.setFromRotationMatrix(mb); bend.quaternion.copy(q); bend.position.set(1.75+ec2*.2,2.43+er*.17+.085,ez); R.add(bend); }
  box(.66,.025,.8,METAL(0x9aa5b2,.4),1.94,.95,0,R); box(.66,.025,.8,METAL(0x9aa5b2,.4),1.94,2.15,0,R);
  /* fan dampers + VFDs */
  var fdd=new T.Group(); fdd.position.set(2.85,1.55,1.4); R.add(fdd); box(.36,.36,.14,PAINT(0x56657a,.45),0,0,0,fdd); for(ci=0;ci<4;ci++){ var lou=box(.32,.012,.06,steelM,0,-.12+ci*.08,.075,fdd); lou.rotation.x=.6; } rbox(.1,.08,.08,.01,PAINT(0x1f5aa6,.4),.22,.1,0,fdd);
  rbox(.1,.08,.08,.01,PAINT(0x1f5aa6,.4),4.16,1.15,.25,R); box(.02,.14,.02,steelM,4.16,1.05,.29,R);
  var v1=buildVFD(); v1.group.position.set(4.7,0,.95); R.add(v1.group); deepUp.push(v1.update); var v2=buildVFD(); v2.group.position.set(3.35,0,1.55); R.add(v2.group); deepUp.push(v2.update);
  var pt103=kPT(R,'PT-103','mmWC',-5.2,fx-fw/2-.38,2.55,.45); deepUp.push(pt103.update); kTube(R,[[fx-fw/2-.38,2.6,.45],[fx-fw/2-.1,2.62,.45]],.006,steelM,{fl:false});
  var o2g=new T.Group(); o2g.position.set(2.8,1.75,.23); R.add(o2g); cylZ(.02,.14,steelM,0,0,-.04,o2g,10); rbox(.13,.13,.09,.012,PAINT(0xF2A541,.4),0,0,.07,o2g); var o2s=screen(96,48,function(g,t,w,h){ g.fillStyle='#0d1a14'; g.fillRect(0,0,w,h); g.fillStyle='#7dff9a'; g.font='700 20px '+MONO; g.fillText('O₂ '+(4.6+Math.sin(t*.6)*.2).toFixed(1)+'%',6,32); },4); var o2p=new T.Mesh(new T.PlaneGeometry(.1,.05),screenMat(o2s)); o2p.position.set(0,.01,.116); o2g.add(o2p); var o2t=tagPlate('AT-101'); o2t.position.set(0,-.05,.116); o2g.add(o2t); deepUp.push(function(t){ o2s.update(t); });
  var tt102=kTT(R,'TT-102',182,1.95,2.31,.32); deepUp.push(tt102.update);
  /* labels for the two new steps */
  var FZ=.35;
  var dlab=[['Chevron steam separator',[dx0+.4,dy0+.42,-.45],'#13A89E'],['Steam outlets → superheater',[dx0+.3,dy0+.72,.15],'#0B2545'],['Deflector baffle (riser side)',[dx0+.3,dy0+.1,-.95],'#13A89E'],['Normal water level',[dx0+.45,dy0-.02,.55],'#3FD9CB'],['Feed distribution pipe',[dx0+.45,dy0-.2,-.35],'#2f8ce0'],['Continuous blowdown pipe',[dx0+.45,dy0-.1,.95],'#E8891E'],['Chemical dosing pipe',[dx0+.45,dy0-.3,.3],'#F2A541'],['Bank tube ends',[dx0+.45,dy0-.42,-.75],'#0B2545'],['Safety valves ×2',[dx0+.1,dy0+.95,-.2],'#c8312e'],['Gauge glasses ×2',[dx0+.25,dy0-.5,1.0],'#13A89E']].map(function(l){ var s=label(l[0],{pos:l[1],h:.085,border:l[2]}); R.add(s); return s; });
  var ilab=[['FT-101 · main steam flow',[-.48,4.95,-1.45],[-.15,5.35,-1.45],'#0B2545'],['FT-102 · feed water flow',[2.4,2.3,1.48],[2.95,2.75,1.6],'#2f8ce0'],['FCV-101 · feed control valve',[2.22,.62,1.45],[2.6,1.1,1.75],'#F2A541'],['LT-101 · drum level',[dx0+.55,dy0-.67,.9],[dx0+1.05,dy0-.55,1.2],'#7a5cff'],['PT-101 · drum pressure',[dx0-.15,dy0+DR+.15,-.72],[dx0-.25,dy0+.95,-1.05],'#13A89E'],['TT-104 · superheated steam',[-.48,4.0,.55],[-.85,4.45,.85],'#E8891E'],['PT-103 · furnace draft',[fx-fw/2-.38,2.7,.45],[fx-fw/2-.75,3.15,.6],'#7a5cff'],['AT-101 · flue gas O₂',[2.8,1.75,.36],[3.25,2.1,.55],'#E8891E'],['TT-102 · flue gas temp.',[1.95,2.41,.36],[2.3,2.85,.6],'#b08a4a'],['Grate drive · VFD',[fx+fw/2+.15,.42,.95],[-.05,.85,1.3],'#0B2545'],['Under-grate air dampers',[fx,.36,-.87],[fx-.2,.75,-1.25],'#0B2545'],['Blowdown tank',[-2.36,1.1,1.75],[-2.6,1.55,2.0],'#0B2545'],['Mud drum · intermittent blowdown',[dx0,.42,.75],[dx0+.65,.95,1.15],'#0B2545']].map(function(l){ return leadLab(R,l[0],l[1],l[2],l[3],.22); });
  function deepUpdate(dt,t,v){ var kd=v.drum, ki=v.inst;
    SD.setCut(kd); MD.setCut(Math.max(kd,v.open*.9)); DI.visible=kd>.02; MI.visible=Math.max(kd,v.open)>.02; waterM.opacity=.55*kd; nwl.visible=kd>.02; lvl2.scale.y=.85+.15*Math.sin(t*.7+1);
    bubs.forEach(function(b){ var u=(b.o+t*.4)%1; b.s.position.set(b.x+u*.08,-.3+u*(.27+wl+.03),b.z); b.s.material.opacity=kd; });
    stm.forEach(function(b){ var u=(b.o+t*.3)%1; b.s.position.set(b.x*(1-u*.7),wl+.02+u*.3,b.z*(1-u*.4)); b.s.material.opacity=kd*(1-u); });
    dmps.forEach(function(d,i){ d.rotation.z=Math.sin(t*.5+i)*.3; }); deepUp.forEach(function(f){ f(t); });
    dlab.forEach(function(l){ l.material.opacity=kd; l.visible=kd>.02; }); ilab.forEach(function(l){ labOp(l,ki); }); }
  return {zoom:1.3,shadow:{size:7.5,center:[.2,0,0]},keys:['open','aph','flue','labels','audit','steam','data','feed','drum','inst'],base:{flue:.3,steam:.25,data:.15},
    steps:[{cam:[8.6,6.4,13.0],look:[.3,2.4,-.2],auto:.06},
      {cam:[-7.0,3.8,7.0],look:[-3.0,1.4,.3],v:{feed:1}},
      {cam:[-1.3,2.4,6.2],look:[-.7,2.0,0],v:{open:1}},
      {cam:[2.85,4.5,1.05],look:[.28,4.08,.08],v:{drum:1,steam:.5}},
      {cam:[2.9,3.2,7.8],look:[1.7,2.1,0],v:{open:.6,aph:1,flue:1,labels:1}},
      {cam:[6.6,5.2,9.2],look:[.5,2.2,.3],v:{inst:1,open:.55,data:.5,flue:.5,steam:.5}},
      {cam:[9.8,7.2,5.8],look:[2.4,2.6,-1.5],v:{audit:1,steam:1}},
      {cam:[-7.8,5.6,9.6],look:[-.6,2.4,0],v:{data:1,flue:.6,steam:.6,audit:.35}}],
    update:function(dt,t,v){
      fades.forEach(function(f){var k=v[f.key];var op=1-k*.94;f.ms.forEach(function(m){m.opacity=op;m.depthWrite=op>.95;});f.o.position.z=f.z0+k*1.6;f.o.visible=op>.04;});
      frontTubeM.opacity=1-v.open*.85;ffinM.opacity=1-v.open*.92;frontTubeM.depthWrite=ffinM.depthWrite=v.open<.05;
      var fk=.8+.2*Math.sin(t*13)+.1*Math.sin(t*29);fl.intensity=3*fk;bedM.emissiveIntensity=1+.4*fk;
      fire(t,1);
      tubeM.emissiveIntensity=.15+.12*fk*(.3+v.open);gtx.offset.y=-t*.12;
      chunks.forEach(function(c,i){var u=((t*.08+i/chunks.length)%1);c.position.x=Ac.x+dir.x*u+nrm.x*.08;c.position.y=Ac.y+dir.y*u+nrm.y*.08;c.visible=u<.98;c.rotation.x+=dt*.2;});
      fanSpin.forEach(function(s,i){s.rotation.z+=dt*(i?7:10);});fpu.forEach(function(p){p.update(t,dt);});
      flue.set(.25+.75*v.flue);flue.update(t,.07);air.set(v.aph*.95);air.update(t,.09);steam1.set(.2+.8*v.steam);steam1.update(t,.08);steam2.set(.2+.8*v.steam);steam2.update(t,.1);
      smoke.forEach(function(s,i){var u=((t*.09+i/smoke.length)%1);s.position.set(chx+u*1.6+Math.sin(t*.7+i)*.15*u,6.1+u*3.0,Math.sin(i*1.7)*.4*u);var sc=.3+u*1.9;s.scale.set(sc,sc,sc);s.material.opacity=.5*(1-u)*(u<.08?u/.08:1);});
      var ak=v.audit;
      puffs.forEach(function(p,i){var u=((t*.8+i/puffs.length)%1);p.position.set(3.0+u*.25,4.9+u*.7,-1.85+Math.sin(i)*.1);var sc=.12+u*.5;p.scale.set(sc,sc,sc);p.material.opacity=ak*.85*(1-u);p.visible=ak>.02;});
      bare.emissiveIntensity=.15+ak*(.5+.4*Math.sin(t*4));
      mk.forEach(function(m,i){var s=.38+.12*Math.sin(t*3+i);m.scale.set(s,s,1);m.material.opacity=ak;m.visible=ak>.02;});
      probe.visible=ak>.3;avl.material.emissiveIntensity=Math.floor(t*1.5)%2?1.5:.1;
      lvl.scale.y=.85+.15*Math.sin(t*.7);
      aud.forEach(function(l){l.material.opacity=ak;l.visible=ak>.02;});
      tmp.forEach(function(l){l.material.opacity=v.labels;l.visible=v.labels>.02;});
      fdl.material.opacity=v.feed;fdl.visible=v.feed>.02;cbo.material.opacity=.3+.7*v.data;
      deepUpdate(dt,t,v);
      cp.update(t,{});ccab.set(.25+.75*v.data);ccab.update(t);dbeam.update(dA,dB,t,v.data);cloud.material.opacity=.25+.75*v.data;
    }};
};

/* ---------- microcontroller story ---------- */
SCENES.mcu=function(st){
  var R=new T.Group();st.scene.add(R);softFloor(R,6,{cells:24});
  var Bd=new T.Group();R.add(Bd);Bd.position.y=.42;
  var tc=cnv(1536,1024),g=tc.getContext('2d');
  g.fillStyle='#0f3157';g.fillRect(0,0,1536,1024);
  g.strokeStyle='rgba(212,170,80,.95)';g.lineCap='round';
  var rnd=function(a,b){return a+Math.random()*(b-a);};
  for(var i=0;i<90;i++){var x=rnd(80,1450),y=rnd(80,950);g.lineWidth=rnd(3,9);g.beginPath();g.moveTo(x,y);for(var k=0;k<3;k++){if(k%2)x=rnd(80,1450);else y=rnd(80,950);g.lineTo(x,y);}g.stroke();g.fillStyle='#e0bd6a';g.beginPath();g.arc(x,y,9,0,PI*2);g.fill();g.fillStyle='#0f3157';g.beginPath();g.arc(x,y,4,0,PI*2);g.fill();}
  for(i=0;i<300;i++){g.fillStyle='#d9b45e';g.fillRect(rnd(40,1490),rnd(40,980),6,10);}
  g.fillStyle='#ffffff';g.font='700 40px '+MONO;g.fillText('TRIONIX  TX-MC1  REV A',60,990);g.font='600 26px '+MONO;['U1','U2','RL1','RL2','RL3','J1','J2','D1','C12','R7'].forEach(function(s){g.fillText(s,rnd(100,1400),rnd(100,900));});
  [[60,60],[1476,60],[60,964],[1476,964]].forEach(function(p){g.fillStyle='#e0bd6a';g.beginPath();g.arc(p[0],p[1],26,0,PI*2);g.fill();g.fillStyle='#e9eef3';g.beginPath();g.arc(p[0],p[1],14,0,PI*2);g.fill();});
  var side=M(0x0f3157,{roughness:.5});
  var pcb=new T.Mesh(new T.BoxGeometry(3,.06,2),[side,side,new T.MeshStandardMaterial({map:ctex(tc),roughness:.38,metalness:.25}),side,side,side]);Bd.add(pcb);
  var pinM=METAL(0xdfe3e7,.22),gold=METAL(0xd6b25e,.25),blk=M(0x151719,{roughness:.4});
  rbox(.46,.06,.46,.01,blk,0,.06,0,Bd);sph(.02,M(0x333),-.16,.09,-.16,Bd,10,8);
  var pins=[];for(i=0;i<16;i++){var o=-.21+i*.028;pins.push([o,.038,.255],[o,.038,-.255],[.255,.038,o,1,1,1,PI/2],[-.255,.038,o,1,1,1,PI/2]);}iboxes(pins,.012,.008,.05,pinM,Bd);
  var esp=new T.Group();esp.position.set(-1.0,.035,-.15);Bd.add(esp);box(.5,.03,.75,M(0x14243a),0,.015,0,esp);rbox(.42,.035,.46,.006,METAL(0xc9ced4,.2),0,.05,.08,esp);
  pipe([[-.2,.035,-.33],[-.1,.035,-.33],[-.1,.035,-.25],[.0,.035,-.25],[0,.035,-.33],[.1,.035,-.33],[.1,.035,-.25],[.2,.035,-.25]],.006,gold,esp);
  var relayLeds=[];
  for(i=0;i<3;i++){var rz=-.6+i*.34;rbox(.3,.26,.22,.012,M(0x2463b8,{roughness:.35}),1.05,.16,rz,Bd);var dl2=cnv(128,64),dx=dl2.getContext('2d');dx.fillStyle='#2463b8';dx.fillRect(0,0,128,64);dx.fillStyle='#fff';dx.font='700 16px '+MONO;dx.fillText('5VDC 10A',12,26);dx.fillText('250VAC',12,48);var dp=new T.Mesh(new T.PlaneGeometry(.22,.11),new T.MeshStandardMaterial({map:ctex(dl2),roughness:.4}));dp.rotation.x=-PI/2;dp.position.set(1.05,.292,rz);Bd.add(dp);
    relayLeds.push(cyl(.015,.015,.02,new T.MeshStandardMaterial({color:0xff3b2f,emissive:new T.Color(0xff3b2f),emissiveIntensity:0}),.86,.04,rz,Bd,10));}
  for(i=0;i<8;i++){var tx=-1.15+i*.24;rbox(.22,.2,.24,.01,M(0x1f9a5f,{roughness:.45}),tx,.13,-.83,Bd);[-.05,.05].forEach(function(d2){cyl(.035,.035,.02,pinM,tx+d2,.235,-.83,Bd,16);box(.05,.006,.008,M(0x666),tx+d2,.247,-.83,Bd);});}
  var reg=new T.Group();reg.position.set(-.45,.03,.55);Bd.add(reg);box(.1,.14,.03,blk,0,.1,0,reg);box(.12,.18,.02,METAL(0xb9c1ca,.3),0,.16,-.03,reg);for(i=0;i<6;i++)box(.12,.03,.08,METAL(0xb9c1ca,.3),0,.12+i*.03,-.08,reg);
  [[-.15,.55],[.55,-.42],[.62,.32],[-.62,.75]].forEach(function(p){cyl(.075,.075,.22,M(0x1a1d22,{roughness:.35}),p[0],.14,p[1],Bd,24);cyl(.072,.072,.004,METAL(0xc9ced4,.2),p[0],.252,p[1],Bd,24);});
  var smd=[];for(i=0;i<160;i++){var sxx=rnd(-1.4,1.4),szz=rnd(-.9,.9);if(Math.abs(sxx)<.35&&Math.abs(szz)<.35)continue;if(sxx<-.7&&szz<.3)continue;if(sxx>.8&&szz<.2)continue;if(szz<-.7)continue;smd.push([sxx,.04,szz,1,1,1,Math.random()>.5?PI/2:0]);}
  iboxes(smd,.04,.02,.02,M(0x2a2622,{roughness:.5}),Bd);
  var hdr=[];for(i=0;i<20;i++)hdr.push([-.95+i*.045,.06,.88]);iboxes(hdr,.04,.05,.04,blk,Bd);var hp2=[];for(i=0;i<20;i++)hp2.push([-.95+i*.045,.11,.88]);iboxes(hp2,.01,.06,.01,gold,Bd);
  rbox(.18,.08,.14,.01,METAL(0xc9ced4,.2),-1.42,.07,.4,Bd);
  var ledC=[0x13A89E,0xF2A541,0x37d67a,0xff3b2f],ledM=[];
  for(i=0;i<4;i++){var lm=new T.MeshStandardMaterial({color:ledC[i],emissive:new T.Color(ledC[i]),emissiveIntensity:1,roughness:.2});cyl(.03,.03,.05,lm,.35+i*.12,.055,.85,Bd,14);ledM.push(lm);}
  [[-.05,.45],[.55,.45],[-.05,.8],[.55,.8]].forEach(function(p){cyl(.015,.015,.32,pinM,p[0],.19,p[1],Bd,8);});
  rbox(.78,.04,.48,.01,M(0x0d0f12),.25,.36,.62,Bd);
  var ol=screen(256,128,drawOLED,12);var op=new T.Mesh(new T.PlaneGeometry(.68,.34),screenMat(ol));op.rotation.x=-PI/2;op.position.set(.25,.382,.62);Bd.add(op);
  var tr=[];
  [[[-.75,.035,-.15],[-.4,.035,-.15],[-.4,.035,0],[-.25,.035,0]],[[.25,.035,0],[.6,.035,0],[.6,.035,-.6],[.9,.035,-.6]],[[.25,.035,.1],[.7,.035,.1],[.7,.035,.14],[.9,.035,.14]],[[0,.035,-.25],[0,.035,-.55],[-.67,.035,-.55],[-.67,.035,-.7]],[[0,.035,.25],[0,.035,.45],[.15,.035,.45]],[[-1.0,.035,.22],[-1.0,.035,.4],[-1.32,.035,.4]]].forEach(function(p,i){tr.push(cable(Bd,null,i%2?0xE8891E:0x13A89E,{curve:polyPath(p),r:.007,size:.08,n:3,speed:.5,seg:40}));});
  var cover=new T.Group();R.add(cover);var cm=new T.MeshStandardMaterial({color:0xc5ced8,transparent:true,opacity:.35,metalness:.2,roughness:.25,depthWrite:false});rbox(3.2,.06,2.2,.04,cm,0,0,0,cover);[-1,1].forEach(function(s){box(3.2,.45,.04,cm,0,-.22,s*1.08,cover);box(.04,.45,2.2,cm,s*1.58,-.22,0,cover);});
  var lbl=cnv(512,128),lx=lbl.getContext('2d');lx.fillStyle='rgba(0,0,0,0)';lx.fillRect(0,0,512,128);lx.fillStyle='#0B2545';lx.font='800 54px '+DISP;lx.fillText('TRIONIX',20,70);lx.font='600 22px '+MONO;lx.fillStyle='#0B7C74';lx.fillText('TX-MC1 PROCESS CONTROLLER',22,104);
  var lp=new T.Mesh(new T.PlaneGeometry(1.2,.3),new T.MeshBasicMaterial({map:ctex(lbl),transparent:true,depthWrite:false}));lp.rotation.x=-PI/2;lp.position.set(-.7,.035,.6);cover.add(lp);
  rbox(3.2,.14,2.2,.02,PAINT(0x3a4554,.5),0,.32,0,R);
  var io=[cable(R,[[-1.15,.65,-.83],[-1.6,.4,-1.4],[-2.4,.05,-1.2],[-2.6,.05,.4],[-2.6,.25,1.2]],0x13A89E,{n:3}),cable(R,[[.53,.65,-.83],[1.2,.35,-1.5],[2.2,.05,-1.8],[2.5,.25,-1.9]],0xE8891E,{n:3}),cable(R,[[-.43,.65,-.83],[-.4,.05,-1.8],[-.6,.05,-2.4],[-.6,.35,-2.6]],0x7a5cff,{n:3})];
  var rtd=new T.Group();rtd.position.set(-2.6,0,1.25);R.add(rtd);rod([0,.25,0],[.4,.05,0],.012,pinM,rtd);cylZ(.06,.12,PAINT(0x2a5c94,.4),0,.3,0,rtd,20);cyl(.05,.05,.04,METAL(0xd5dade,.2),0,.36,0,rtd,20);
  var ps=buildPumpSet();ps.group.position.set(2.7,0,-1.95);ps.group.rotation.y=-.5;ps.group.scale.setScalar(.8);R.add(ps.group);
  var mtr=new T.Group();mtr.position.set(-.6,0,-2.65);R.add(mtr);rbox(.36,.46,.18,.015,M(0xe9ecef),0,.6,0,mtr);var ms=screen(96,48,function(g2,t,w,h){g2.fillStyle='#1a2a1e';g2.fillRect(0,0,w,h);g2.fillStyle='#8ce6c4';g2.font='700 18px '+MONO;g2.fillText((24.6+Math.sin(t)*.3).toFixed(1)+' kW',6,30);},3);var mp=new T.Mesh(new T.PlaneGeometry(.22,.11),screenMat(ms));mp.position.set(0,.66,.092);mtr.add(mp);box(.05,.4,.05,METAL(0xb7bec6,.4),0,.2,0,mtr);
  var S=new T.Group();R.add(S);
  var specs=[['pid',.96,.96,-1.35,'PID 96×96'],['temp',.48,.96,-.1,'TEMP 48×96'],['timer',.48,.48,.85,'TIMER 48×48']];var faces=[];
  specs.forEach(function(s){var gg=new T.Group();gg.position.set(s[3],0,0);S.add(gg);rbox(s[1]*.9,s[2]*.9,.85,.02,M(0x2a2f36,{roughness:.45}),0,0,-.45,gg);rbox(s[1]+.04,s[2]+.04,.06,.03,M(0x14171b,{roughness:.35}),0,0,0,gg);
    [-1,1].forEach(function(sg){box(.06,.08,.3,M(0x50565e),sg*(s[1]*.45+.03),0,-.5,gg);});
    var f=screen(s[1]>.5?256:128,s[2]>.5?256:128,ctrlFace(s[0]),10);faces.push(f);var pl=new T.Mesh(new T.PlaneGeometry(s[1],s[2]),screenMat(f));pl.position.z=.031;gg.add(pl);
    var l=label(s[4],{h:.17});l.position.set(0,s[2]/2+.22,0);gg.add(l);});
  S.position.set(0,1.3,1.6);
  var wr=rings(R,0x13A89E,[-1.0,.7,-.15],{flat:true,max:1.5});
  var cb=beam(R,0xE8891E,{n:4,w:.04});var cA=new T.Vector3(-1.0,.7,-.15),cB=new T.Vector3(-1.0,3.6,-.15);var cl=label('Trionix server · Pune HQ',{pos:[-1.0,3.85,-.15],border:'#E8891E',h:.2});R.add(cl);
  return {zoom:1.22,shadow:{size:3.6,center:[0,0,0]},keys:['explode','logic','io','std','conn'],base:{logic:.3,io:.18},
    steps:[{cam:[3.2,3.4,4.3],look:[0,.55,0],auto:.12,v:{explode:1}},
      {cam:[.9,3.7,2.5],look:[0,.35,.15],v:{explode:1,logic:1}},
      {cam:[4.3,2.7,4.9],look:[0,.35,-.3],v:{explode:1,io:1}},
      {cam:[0,1.7,6.0],look:[-.15,1.25,1.6],v:{std:1}},
      {cam:[3.6,4.0,6.4],look:[-.4,1.3,0],v:{conn:1,explode:1}}],
    update:function(dt,t,v){
      cover.position.y=.75+v.explode*1.6;cm.opacity=.35*(1-v.explode*.4);
      Bd.position.z=-v.std*1.0;
      ol.update(t);ms.update(t);ledM.forEach(function(m,i){m.emissiveIntensity=(Math.floor(t*3+i*1.3)%3)?1.3:.05;});
      relayLeds.forEach(function(l,i){l.material.emissiveIntensity=Math.sin(t*1.3+i*2)>0?1.5:0;});
      tr.forEach(function(c){c.set(.1+.9*v.logic);c.update(t);});
      io.forEach(function(c){c.set(.08+.92*v.io);c.update(t);});ps.update(t,dt*v.io);
      var s=.001+v.std;S.scale.setScalar(s);S.visible=v.std>.02;S.rotation.y=Math.sin(t*.4)*.25;faces.forEach(function(f){f.update(t);});
      wr.update(t,v.conn);cb.update(cA,cB,t,v.conn);cl.material.opacity=v.conn;cl.visible=v.conn>.02;
    }};
};

/* =====================================================================
   STAGE + STORY ENGINE
   ===================================================================== */
var stages=[];window.__stages=function(){return stages;};window.__snap=function(){stages.forEach(function(s){var st=s.api.steps[s.step];s.camPos.set(st.cam[0],st.cam[1],st.cam[2]);s.look.set(st.look[0],st.look[1],st.look[2]);s.yaw=0;s.api.keys.forEach(function(k){s.v[k]=(st.v&&st.v[k]!=null)?st.v[k]:(s.api.base[k]||0);});});};
function makeEnv(renderer){
  var pm=new T.PMREMGenerator(renderer);var sc=new T.Scene();
  var c=cnv(16,256),g=c.getContext('2d');var gr=g.createLinearGradient(0,0,0,256);gr.addColorStop(0,'#e9eef3');gr.addColorStop(.45,'#cfd8e1');gr.addColorStop(.52,'#8d98a6');gr.addColorStop(1,'#3f4854');g.fillStyle=gr;g.fillRect(0,0,16,256);
  var t=new T.CanvasTexture(c);t.encoding=T.sRGBEncoding;
  sc.add(new T.Mesh(new T.SphereGeometry(50,32,16),new T.MeshBasicMaterial({map:t,side:T.BackSide})));
  [[20,25,15,14,8],[-25,18,-10,10,10],[0,30,-25,18,6]].forEach(function(b){var m=new T.Mesh(new T.PlaneGeometry(b[3],b[4]),new T.MeshBasicMaterial({color:new T.Color(1.7,1.7,1.7),side:T.DoubleSide}));m.position.set(b[0],b[1],b[2]);m.lookAt(0,0,0);sc.add(m);});
  var rt=pm.fromScene(sc,.03);pm.dispose();return rt;
}
function Stage(el,key){
  var self=this;this.el=el;this.visible=true;this.step=0;this.yaw=0;this.drag=0;this.down=false;
  var r=this.renderer=new T.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'});
  r.setPixelRatio(Math.min(window.devicePixelRatio||1,1.75));r.outputEncoding=T.sRGBEncoding;r.setClearColor(0x000000,0);
  r.toneMapping=T.ACESFilmicToneMapping;r.toneMappingExposure=.78;r.physicallyCorrectLights=false;
  r.shadowMap.enabled=true;r.shadowMap.type=T.PCFSoftShadowMap;
  el.insertBefore(r.domElement,el.firstChild);
  this.scene=new T.Scene();var pmg=new T.PMREMGenerator(r);this.envRT=pmg.fromScene(new T.RoomEnvironment(),.04);pmg.dispose();this.scene.environment=this.envRT.texture;
  this.camera=new T.PerspectiveCamera(36,1,.1,200);
  this.scene.add(new T.HemisphereLight(0xffffff,0x8d98a6,.08));
  var kl=this.key=new T.DirectionalLight(0xfff6ea,1.0);kl.castShadow=true;kl.shadow.mapSize.set(2048,2048);kl.shadow.bias=-.0004;kl.shadow.normalBias=.02;kl.shadow.radius=4;
  this.scene.add(kl);this.scene.add(kl.target);
  var fl=new T.DirectionalLight(0xdfe9ff,.2);fl.position.set(-6,4,-5);this.scene.add(fl);
  this.api=SCENES[key](this);
  var sh=this.api.shadow||{size:5,center:[0,0,0]};var c=V(sh.center);
  kl.position.set(c.x+6,c.y+11,c.z+7);kl.target.position.copy(c);var sc=kl.shadow.camera;sc.left=-sh.size;sc.right=sh.size;sc.top=sh.size;sc.bottom=-sh.size;sc.near=.5;sc.far=40;sc.updateProjectionMatrix();
  this.scene.traverse(function(o){if((o.isMesh||o.isInstancedMesh)&&!o.__noShadow){var m=o.material;var tr=m&&!Array.isArray(m)&&(m.transparent||m.isMeshBasicMaterial);if(!tr){o.castShadow=true;o.receiveShadow=true;}}});
  this.v={};var s0=this.api.steps[0];
  this.api.keys.forEach(function(k){self.v[k]=(s0.v&&s0.v[k]!=null)?s0.v[k]:(self.api.base[k]||0);});
  this.camPos=V(s0.cam);this.look=V(s0.look);
  this.ro=new ResizeObserver(function(){self.resize();});this.ro.observe(el);this.resize();
  this.io=new IntersectionObserver(function(es){self.visible=es[0].isIntersecting;},{rootMargin:'100px'});this.io.observe(el);
  var cv=r.domElement;
  this.onDown=function(e){self.down=true;self.px=e.clientX;};
  this.onMove=function(e){if(!self.down)return;self.drag+=(e.clientX-self.px)*.008;self.px=e.clientX;};
  this.onUp=function(){self.down=false;};
  cv.addEventListener('pointerdown',this.onDown);window.addEventListener('pointermove',this.onMove);window.addEventListener('pointerup',this.onUp);window.addEventListener('pointercancel',this.onUp);
}
Stage.prototype.resize=function(){var w=this.el.clientWidth,h=this.el.clientHeight;if(!w||!h)return;this.renderer.setSize(w,h,false);this.camera.aspect=w/h;this.camera.fov=w/h<.85?52:(w/h<1.15?42:34);this.camera.updateProjectionMatrix();};
Stage.prototype.setStep=function(i){this.step=clamp(i,0,this.api.steps.length-1);};
Stage.prototype.tick=function(dt,t){
  if(!this.visible||document.hidden)return;
  var st=this.api.steps[this.step],self=this;
  this.camPos.set(damp(this.camPos.x,st.cam[0],2.2,dt),damp(this.camPos.y,st.cam[1],2.2,dt),damp(this.camPos.z,st.cam[2],2.2,dt));
  this.look.set(damp(this.look.x,st.look[0],2.4,dt),damp(this.look.y,st.look[1],2.4,dt),damp(this.look.z,st.look[2],2.4,dt));
  this.api.keys.forEach(function(k){var tg=(st.v&&st.v[k]!=null)?st.v[k]:(self.api.base[k]||0);self.v[k]=damp(self.v[k],tg,2.6,dt);});
  if(st.auto&&!REDUCE)this.yaw+=st.auto*dt;else{var tw=Math.round(this.yaw/(2*PI))*2*PI;this.yaw=damp(this.yaw,tw,3.4,dt);}
  if(!this.down)this.drag=damp(this.drag,0,.5,dt);
  var off=this.camPos.clone().sub(this.look);var z=(this.api.zoom||1)*(this.camera.aspect<1?1.18:1);off.multiplyScalar(z);off.applyAxisAngle(Y,this.yaw+this.drag);
  this.camera.position.copy(this.look).add(off);this.camera.lookAt(this.look);
  this.api.update(dt,t,this.v);
  this.renderer.render(this.scene,this.camera);
};
Stage.prototype.dispose=function(){
  this.ro.disconnect();this.io.disconnect();
  window.removeEventListener('pointermove',this.onMove);window.removeEventListener('pointerup',this.onUp);window.removeEventListener('pointercancel',this.onUp);
  this.scene.traverse(function(o){if(o.geometry&&!o.geometry.__shared)o.geometry.dispose();if(o.material){(Array.isArray(o.material)?o.material:[o.material]).forEach(function(m){if(m.__shared)return;['map','normalMap','alphaMap','bumpMap'].forEach(function(k){if(m[k]&&!m[k].__shared)m[k].dispose();});m.dispose();});}});
  this.envRT.dispose();this.renderer.dispose();if(this.renderer.forceContextLoss)this.renderer.forceContextLoss();
  this.renderer.domElement.remove();
};

var lazyIOs=[];
function lazyStage(el){ if(!HAS3D) return; var st=null; el._step=el._step||0;
  var tabs=el.querySelector('.hud-dots'), names=(el.dataset.tabs||'').split('|').filter(Boolean);
  if(tabs&&names.length){ tabs.innerHTML=''; names.forEach(function(n,i){ var b=document.createElement('button'); b.type='button'; b.className='tab'; b.textContent=n; b.setAttribute('aria-pressed',i===el._step?'true':'false');
    b.addEventListener('click',function(){ el._step=i; [].forEach.call(tabs.children,function(c,j){ c.setAttribute('aria-pressed',j===i?'true':'false'); }); if(st) st.setStep(i); }); tabs.appendChild(b); }); }
  var io=new IntersectionObserver(function(es){ var vis=es[es.length-1].isIntersecting;
    if(vis&&!st){ try{ st=new Stage(el,el.dataset.stage); st.setStep(el._step); stages.push(st); }catch(e){ console.error(e); } }
    else if(!vis&&st){ st.dispose(); var i=stages.indexOf(st); if(i>=0) stages.splice(i,1); st=null; } },{rootMargin:'300px 0px'});
  io.observe(el); lazyIOs.push(io); }
var stories=[];
function bindStory(stage,stepsEl,stageEl){
  var steps=[].slice.call(stepsEl.querySelectorAll('.step'));
  var dots=stageEl.querySelector('.hud-dots'),title=stageEl.querySelector('.hud-title');
  dots.innerHTML='';
  steps.forEach(function(s,i){var b=document.createElement('button');b.type='button';b.textContent=i+1;b.setAttribute('aria-label','Go to '+s.dataset.title);
    b.addEventListener('click',function(){var y=s.getBoundingClientRect().top+window.scrollY-window.innerHeight*.3;window.scrollTo({top:y,behavior:REDUCE?'auto':'smooth'});});dots.appendChild(b);});
  stories.push({stage:stage,steps:steps,dots:[].slice.call(dots.children),title:title,cur:-1});
}
function updateStories(){
  var mid=window.innerHeight*(window.innerWidth<=900?.62:.5);
  stories.forEach(function(s){var best=0;s.steps.forEach(function(el,i){var r=el.getBoundingClientRect();if(r.top<mid)best=i;});
    if(best!==s.cur){s.cur=best;if(s.stage)s.stage.setStep(best);s.steps.forEach(function(el,i){el.classList.toggle('is-active',i===best);});s.dots.forEach(function(d,i){d.setAttribute('aria-current',i===best?'true':'false');});s.title.textContent=s.steps[best].dataset.title;}});
}
var ticking=false;
window.addEventListener('scroll',function(){if(!ticking){ticking=true;requestAnimationFrame(function(){ticking=false;updateStories();});}},{passive:true});
window.addEventListener('resize',updateStories);

var PAGES=['home','panels','automation','iiot','boilers','controllers','contact'];
var current=null;
function route(){
  var h=(location.hash||'').slice(1);if(PAGES.indexOf(h)<0)h=(window.TRX_P2P&&TRX_P2P[(location.pathname.replace(/\.html$/,'').replace(/\/index$/,'/').replace(/(.)\/$/,'$1'))])||'home';
  if(h===current)return;var first=current===null;current=h;
  lazyIOs.forEach(function(o){o.disconnect();});lazyIOs=[];
  stages.forEach(function(s){s.dispose();});stages=[];stories=[];
  document.querySelectorAll('.page').forEach(function(p){p.hidden=p.dataset.page!==h;});
  document.querySelectorAll('.links a').forEach(function(a){if(a.dataset.p===h)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
  if(!first)window.scrollTo(0,0);
  var page=document.querySelector('.page[data-page="'+h+'"]');
  var mk=function(){ if(current!==h) return; page.querySelectorAll('[data-stage]').forEach(function(el){
    if(el.hasAttribute('data-lazy')){lazyStage(el);return;}
    var stage=null;
    if(HAS3D){try{stage=new Stage(el,el.dataset.stage);stages.push(stage);}catch(e){console.error(e);document.documentElement.classList.add('no3d');}}
    if(el.dataset.story){bindStory(stage,document.getElementById(el.dataset.story),el);}
  });
  updateStories(); };
  if(HAS3D&&page.querySelector('[data-stage]')) Promise.all([loadParts(),loadSat()]).then(mk); else mk();
}
var last=performance.now();
function loop(now){requestAnimationFrame(loop);var dt=Math.min(.05,(now-last)/1000);last=now;var t=now/1000;for(var i=0;i<stages.length;i++)stages[i].tick(dt,t);}
function start(){if(HAS3D)initShared();window.addEventListener('hashchange',route);window.addEventListener('popstate',route);route();requestAnimationFrame(loop);}
var started=false;function go(){if(started)return;started=true;start();}
if(document.fonts&&document.fonts.ready){document.fonts.ready.then(go);setTimeout(go,1800);}else go();
})();

