// Robo Arm camera link: laptop webcam -> phone, peer-to-peer (WebRTC).
// Signaling travels through the same public MQTT relay as the arm, encrypted
// with a key derived from the private arm link, so only link holders can watch.
(() => {
'use strict';
const BROKER='wss://broker.emqx.io:8084/mqtt';
const ICE=[{urls:['stun:stun.l.google.com:19302','stun:stun1.l.google.com:19302']},{urls:'stun:stun.cloudflare.com:3478'}];
const enc=new TextEncoder(),dec=new TextDecoder();
const hex=h=>new Uint8Array(h.match(/../g).map(x=>parseInt(x,16)));
const b64=u=>btoa(String.fromCharCode(...u)),unb64=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
const rid=()=>[...crypto.getRandomValues(new Uint8Array(6))].map(x=>x.toString(16).padStart(2,'0')).join('');

async function aesKey(keyHex){
  const k=hex(keyHex),seed=new Uint8Array(9+k.length);seed.set(enc.encode('rarm-cam|'));seed.set(k,9);
  return crypto.subtle.importKey('raw',await crypto.subtle.digest('SHA-256',seed),'AES-GCM',false,['encrypt','decrypt']);
}
async function seal(key,obj){const iv=crypto.getRandomValues(new Uint8Array(12));const ct=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv},key,enc.encode(JSON.stringify(obj))));return b64(iv)+'.'+b64(ct);}
async function sealBytes(key,bytes){const iv=crypto.getRandomValues(new Uint8Array(12));const ct=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv},key,bytes));const o=new Uint8Array(12+ct.length);o.set(iv);o.set(ct,12);return o;}
async function openBytes(key,b){return new Uint8Array(await crypto.subtle.decrypt({name:'AES-GCM',iv:b.slice(0,12)},key,b.slice(12)));}
async function open(key,text){const [a,b]=text.split('.');return JSON.parse(dec.decode(await crypto.subtle.decrypt({name:'AES-GCM',iv:unb64(a)},key,unb64(b))));}

// Minimal MQTT 3.1.1 over WebSocket: connect, subscribe one topic, publish, keepalive, auto-reconnect.
function relay(topic,onText,onUp,onBytes){
  const st={ws:null,up:false,buf:new Uint8Array(0),ping:0,closed:false};
  const mstr=t=>{const b=enc.encode(t);return [b.length>>8,b.length&255,...b];};
  const pkt=(type,body)=>{const len=[];let n=body.length;do{let d=n%128;n=Math.floor(n/128);if(n>0)d|=128;len.push(d);}while(n>0);const o=new Uint8Array(1+len.length+body.length);o[0]=type;o.set(len,1);o.set(body,1+len.length);return o;};
  function parse(){
    while(st.buf.length>=2){
      let mul=1,len=0,i=1,d;
      do{if(i>=st.buf.length)return;d=st.buf[i++];len+=(d&127)*mul;mul*=128;}while(d&128);
      if(st.buf.length<i+len)return;
      const b0=st.buf[0],type=b0>>4,body=st.buf.slice(i,i+len);st.buf=st.buf.slice(i+len);
      if(type===2){st.up=true;st.ws.send(pkt(0x82,[0,1,...mstr(topic),0]));if(st.extra)st.ws.send(pkt(0x82,[0,2,...mstr(st.extra),0]));clearInterval(st.ping);st.ping=setInterval(()=>{try{st.ws.send(new Uint8Array([0xC0,0]));}catch{}},20000);onUp&&onUp(true);}
      else if(type===3){const tl=(body[0]<<8)|body[1],t=dec.decode(body.slice(2,2+tl)),start=2+tl+(((b0>>1)&3)?2:0);try{if(t===topic)onText(dec.decode(body.slice(start)));else if(onBytes)onBytes(t,body.slice(start));}catch{}}
    }
  }
  function connect(){
    if(st.closed)return;
    const ws=new WebSocket(BROKER,['mqtt']);ws.binaryType='arraybuffer';st.ws=ws;st.buf=new Uint8Array(0);
    ws.onopen=()=>ws.send(pkt(0x10,[...mstr('MQTT'),4,2,0,30,...mstr('rarm-cam-'+rid())]));
    ws.onmessage=e=>{const a=new Uint8Array(e.data),b=new Uint8Array(st.buf.length+a.length);b.set(st.buf);b.set(a,st.buf.length);st.buf=b;parse();};
    const down=()=>{if(st.ws!==ws)return;st.ws=null;st.up=false;clearInterval(st.ping);onUp&&onUp(false);setTimeout(connect,2000);};
    ws.onclose=down;ws.onerror=down;
  }
  connect();
  return {
    send(text){if(st.up&&st.ws)st.ws.send(pkt(0x30,[...mstr(topic),...enc.encode(text)]));return st.up;},
    sendBytes(t,bytes){if(!st.up||!st.ws||st.ws.bufferedAmount>400000)return false;const h=mstr(t),m=new Uint8Array(h.length+bytes.length);m.set(h);m.set(bytes,h.length);st.ws.send(pkt(0x30,m));return true;},
    subscribe(t){st.extra=t;if(st.up&&st.ws)st.ws.send(pkt(0x82,[0,2,...mstr(t),0]));},
    get up(){return st.up;},
    close(){st.closed=true;try{st.ws&&st.ws.close();}catch{}}
  };
}
function iceDone(pc,ms=2500){
  if(pc.iceGatheringState==='complete')return Promise.resolve();
  return new Promise(ok=>{const t=setTimeout(ok,ms);pc.addEventListener('icegatheringstatechange',()=>{if(pc.iceGatheringState==='complete'){clearTimeout(t);ok();}});});
}

// Laptop side: answer every phone that asks, sending the webcam stream.
async function send(id,keyHex,stream,onStatus=()=>{}){
  const key=await aesKey(keyHex),peers=new Map(),photoUntil=new Map();let viewers=0;
  const photoViewers=()=>{const now=Date.now();for(const [k,t] of photoUntil)if(t<now)photoUntil.delete(k);return photoUntil.size;};
  const count=()=>{viewers=[...peers.values()].filter(p=>p.connectionState==='connected').length+photoViewers();onStatus({relay:R.up,viewers});};
  const vid=document.createElement('video');vid.muted=true;vid.playsInline=true;vid.srcObject=stream;vid.play().catch(()=>{});
  const cv=document.createElement('canvas');let busy=false;
  setInterval(async()=>{
    if(busy||!photoViewers()||!R.up||!vid.videoWidth)return;busy=true;
    try{const w=640,h=Math.round(640*vid.videoHeight/vid.videoWidth);cv.width=w;cv.height=h;cv.getContext('2d').drawImage(vid,0,0,w,h);
      const blob=await new Promise(ok=>cv.toBlob(ok,'image/jpeg',0.55));
      R.sendBytes(`rarm1/${id}/j`,await sealBytes(key,new Uint8Array(await blob.arrayBuffer())));}catch{}
    busy=false;
  },150);
  const R=relay(`rarm1/${id}/v`,async text=>{
    let m;try{m=await open(key,text);}catch{return;}
    if(m.t==='photo'&&m.from){photoUntil.set(m.from,Date.now()+12000);count();return;}
    if(m.t!=='offer'||!m.from||!m.sdp)return;
    const old=peers.get(m.from);if(old){try{old.close();}catch{}peers.delete(m.from);}
    if(peers.size>=4){const [k,p]=peers.entries().next().value;try{p.close();}catch{}peers.delete(k);}
    const pc=new RTCPeerConnection({iceServers:ICE});peers.set(m.from,pc);
    for(const tr of stream.getTracks())pc.addTrack(tr,stream);
    pc.onconnectionstatechange=()=>{if(['failed','closed'].includes(pc.connectionState)&&peers.get(m.from)===pc){peers.delete(m.from);try{pc.close();}catch{}}count();};
    try{
      await pc.setRemoteDescription({type:'offer',sdp:m.sdp});
      for(const s of pc.getSenders()){if(s.track&&s.track.kind==='video'){const p=s.getParameters();p.encodings=p.encodings&&p.encodings.length?p.encodings:[{}];p.encodings[0].maxBitrate=900000;try{await s.setParameters(p);}catch{}}}
      await pc.setLocalDescription(await pc.createAnswer());await iceDone(pc);
      R.send(await seal(key,{t:'answer',to:m.from,sdp:pc.localDescription.sdp}));
    }catch(e){peers.delete(m.from);try{pc.close();}catch{}}
    count();
  },async up=>{onStatus({relay:up,viewers});if(up)R.send(await seal(key,{t:'hello'}));});
  setInterval(count,3000);
  return {stop(){R.close();for(const p of peers.values())try{p.close();}catch{};peers.clear();}};
}

// Phone side: ask the laptop for video and keep retrying until it plays.
async function view(id,keyHex,video,onStatus=()=>{},img=null){
  const key=await aesKey(keyHex),me=rid();let pc=null,asked=0,live=false,retry=0,tries=0,photo=false,photoAt=0,photoAsk=0,url='';
  function startPhoto(){
    if(photo||!img)return;photo=true;R.subscribe(`rarm1/${id}/j`);
    const askP=async()=>{if(!live)R.send(await seal(key,{t:'photo',from:me}));};askP();photoAsk=setInterval(askP,4000);
    setInterval(()=>{if(photo&&!live&&photoAt&&Date.now()-photoAt>5000){photoAt=0;status('waiting');}},1000);
  }
  async function onFrame(t,b){
    if(live||!photo||t!==`rarm1/${id}/j`)return;
    let jpg;try{jpg=await openBytes(key,b);}catch{return;}
    const u=URL.createObjectURL(new Blob([jpg],{type:'image/jpeg'}));img.onload=()=>{if(url)URL.revokeObjectURL(url);url=u;};img.src=u;
    if(!photoAt)status('live-photo');photoAt=Date.now();
  }
  const status=s=>onStatus(s);
  async function ask(){
    if(!R.up)return;
    if(pc){try{pc.close();}catch{}}
    live=false;pc=new RTCPeerConnection({iceServers:ICE});const mine=pc;
    pc.addTransceiver('video',{direction:'recvonly'});pc.addTransceiver('audio',{direction:'recvonly'});
    pc.ontrack=e=>{if(video.srcObject!==e.streams[0]){video.srcObject=e.streams[0];video.play().catch(()=>{});}};
    pc.onconnectionstatechange=()=>{if(mine!==pc)return;const s=pc.connectionState;
      if(s==='connected'){live=true;status('live');}
      else if(s==='failed'||s==='disconnected'||s==='closed'){live=false;status('lost');schedule(2500);}};
    await pc.setLocalDescription(await pc.createOffer());await iceDone(pc);
    asked=Date.now();if(!(photo&&photoAt))status('asking');if(++tries>=2)startPhoto();
    R.send(await seal(key,{t:'offer',from:me,sdp:pc.localDescription.sdp}));
    schedule(9000,true);
  }
  function schedule(ms,onlyIfNotLive=false){clearTimeout(retry);if(photo&&ms<20000)ms=Math.max(ms,30000);retry=setTimeout(()=>{if(onlyIfNotLive&&live)return;if(!live&&!(photo&&photoAt))status('waiting');ask();},ms);}
  const R=relay(`rarm1/${id}/v`,async text=>{
    let m;try{m=await open(key,text);}catch{return;}
    if(m.t==='hello'&&!live){schedule(300);}
    else if(m.t==='answer'&&m.to===me&&pc&&pc.signalingState==='have-local-offer'){try{await pc.setRemoteDescription({type:'answer',sdp:m.sdp});if(!(photo&&photoAt))status('connecting');}catch{}}
  },up=>{if(up&&!live)schedule(200);else if(!up&&!live)status('waiting');},onFrame);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden&&!live)schedule(200);});
  return {get live(){return live;}};
}
// The controller uses the arm camera only. This firmware sends 320x240 (or 160x120 fallback)
// authenticated JPEGs on the shared photo topic; the legacy sender uses 640px.
async function viewArm(id,keyHex,img,onStatus=()=>{}){
  const key=await aesKey(keyHex),me=rid(),photoTopic=`rarm1/${id}/j`;
  let latest=0,seq=0,displayed=0,current='';
  async function onFrame(topic,bytes){
    if(topic!==photoTopic)return;
    const order=++seq;
    let blob,bitmap;
    try{
      const jpg=await openBytes(key,bytes);
      blob=new Blob([jpg],{type:'image/jpeg'});
      bitmap=await createImageBitmap(blob);
      if(bitmap.width<160||bitmap.width>352||bitmap.height<90||bitmap.height>288||order<=displayed)return;
    }catch{return;}
    finally{if(bitmap)bitmap.close();}
    displayed=order;
    const next=URL.createObjectURL(blob),previous=current;
    current=next;img.src=next;
    if(previous)URL.revokeObjectURL(previous);
    const first=!latest;
    latest=Date.now();
    if(first)onStatus('live-arm');
  }
  const ask=async()=>{if(R.up&&!document.hidden)R.send(await seal(key,{t:'photo',from:me}));};
  const R=relay(`rarm1/${id}/v`,()=>{},up=>{if(up){if(!latest)onStatus('waiting');ask().catch(()=>{});}},onFrame);
  R.subscribe(photoTopic);
  const poll=()=>ask().catch(()=>{});
  setInterval(poll,4000);
  document.addEventListener('visibilitychange',poll);
  setInterval(()=>{
    if(latest&&Date.now()-latest>5000){
      latest=0;
      img.removeAttribute('src');
      if(current)URL.revokeObjectURL(current);
      current='';
      onStatus('waiting');
    }
  },1000);
}
window.CamLink={send,view,viewArm};
})();
