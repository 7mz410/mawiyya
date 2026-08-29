"use client";
import {useEffect,useRef,useState} from "react";
import "./warriors.css";
import "./map.css";

type Kind="rider"|"spearman"|"archer"|"worker";
type Unit={id:number;x:number;y:number;tx:number;ty:number;team:"player"|"enemy";kind:Kind;hp:number};
const freshArmy=():Unit[]=>[
 {id:1,x:190,y:390,tx:190,ty:390,team:"player",kind:"rider",hp:100},{id:2,x:225,y:420,tx:225,ty:420,team:"player",kind:"spearman",hp:100},{id:3,x:160,y:430,tx:160,ty:430,team:"player",kind:"archer",hp:100},{id:4,x:115,y:420,tx:115,ty:420,team:"player",kind:"worker",hp:70},
 {id:11,x:990,y:185,tx:990,ty:185,team:"enemy",kind:"rider",hp:100},{id:12,x:1040,y:225,tx:1040,ty:225,team:"enemy",kind:"spearman",hp:100},{id:13,x:950,y:245,tx:950,ty:245,team:"enemy",kind:"archer",hp:100}
];

export default function Home(){
 const canvas=useRef<HTMLCanvasElement>(null),units=useRef(freshArmy()),houses=useRef<{x:number;y:number;built:number}[]>([]),selectedRef=useRef<number[]>([]),mining=useRef<"idle"|"mine"|"camp">("idle"),lastGold=useRef(0);
 const[screen,setScreen]=useState<"login"|"lobby"|"game">("login"),[name,setName]=useState(""),[room,setRoom]=useState("SYRIA-378"),[wood,setWood]=useState(420),[food,setFood]=useState(510),[gold,setGold]=useState(260),[pop,setPop]=useState(4),[cap,setCap]=useState(10),[selected,setSelected]=useState<number[]>([]),[chosen,setChosen]=useState("Desert Lancer"),[message,setMessage]=useState("Select warriors, then click the terrain to move.");
 useEffect(()=>{selectedRef.current=selected},[selected]);

 useEffect(()=>{
  if(screen!=="game")return;
  const c=canvas.current!,ctx=c.getContext("2d")!,bg=new Image();bg.src="/battlefield.png";let raf=0,frame=0;
  const loop=()=>{
   frame++; if(bg.complete)ctx.drawImage(bg,0,0,1200,720);else{ctx.fillStyle="#806440";ctx.fillRect(0,0,1200,720)}
   ctx.fillStyle="#d8ae35";for(let i=0;i<8;i++){ctx.beginPath();ctx.arc(330+(i%4)*13,205+Math.floor(i/4)*10,4+i%2,0,7);ctx.fill()}ctx.fillStyle="#241b11cc";ctx.fillRect(305,232,104,24);ctx.fillStyle="#f2cf55";ctx.font="bold 11px Arial";ctx.fillText("GOLD VEIN",323,248);
   houses.current.forEach(h=>{h.built=Math.min(100,h.built+.12);drawHouse(ctx,h.x,h.y,h.built)});
   const worker=units.current.find(u=>u.kind==="worker"&&u.team==="player");
   if(worker&&mining.current!=="idle"){
    const target=mining.current==="mine"?{x:355,y:225}:{x:135,y:410};worker.tx=target.x;worker.ty=target.y;
    if(Math.hypot(worker.x-target.x,worker.y-target.y)<6){
     if(mining.current==="mine"){mining.current="camp";setMessage("Worker loaded 25 gold. Returning to camp.")}
     else if(frame-lastGold.current>20){lastGold.current=frame;setGold(v=>v+25);mining.current="mine";setMessage("25 gold delivered. Worker returning to the mine.")}
    }
   }
   units.current.forEach(u=>{const dx=u.tx-u.x,dy=u.ty-u.y,d=Math.hypot(dx,dy);if(d>2){u.x+=dx/d*(u.kind==="rider"?1.55:1.05);u.y+=dy/d*(u.kind==="rider"?1.55:1.05)}});
   units.current.forEach(u=>{const foe=units.current.find(v=>v.team!==u.team&&Math.hypot(v.x-u.x,v.y-u.y)<34);if(foe&&frame%22===0&&u.kind!=="worker")foe.hp-=7});units.current=units.current.filter(u=>u.hp>0);
   units.current.forEach(u=>{const fighting=units.current.some(v=>v.team!==u.team&&Math.hypot(v.x-u.x,v.y-u.y)<36);drawUnit(ctx,u,selectedRef.current.includes(u.id),u.kind==="worker"&&mining.current==="camp",fighting,frame)});
   ctx.fillStyle="#0a1311e8";ctx.fillRect(1010,575,170,125);ctx.strokeStyle="#cfb16b";ctx.strokeRect(1010,575,170,125);units.current.forEach(u=>{ctx.fillStyle=u.team==="player"?"#53ced1":"#e45b4e";ctx.fillRect(1010+u.x/1200*170-2,575+u.y/720*125-2,5,5)});
   raf=requestAnimationFrame(loop);
  };loop();return()=>cancelAnimationFrame(raf)
 },[screen]);

 const click=(e:React.MouseEvent<HTMLCanvasElement>)=>{const c=e.currentTarget,r=c.getBoundingClientRect(),x=(e.clientX-r.left)*1200/r.width,y=(e.clientY-r.top)*720/r.height,hit=units.current.find(u=>u.team==="player"&&Math.hypot(u.x-x,u.y-y)<28);if(hit){setSelected([hit.id]);setMessage(`${hit.kind} selected.`);return}if(selected.length){units.current.forEach(u=>{if(selected.includes(u.id)){u.tx=x;u.ty=y}});setMessage("Unit moving to your command.")}};
 const train=(kind:Exclude<Kind,"worker">)=>{if(pop>=cap){setMessage("Build a worker house to increase population capacity.");return}if(food<80||gold<40){setMessage("Not enough food or gold.");return}setFood(v=>v-80);setGold(v=>v-40);units.current.push({id:Date.now(),x:135,y:375,tx:180,ty:400,team:"player",kind,hp:100});setPop(v=>v+1);setMessage(`${kind} trained.`)};
 const trainWorker=()=>{if(pop>=cap){setMessage("Population full. Build another house.");return}if(food<50){setMessage("You need 50 food for a worker.");return}setFood(v=>v-50);units.current.push({id:Date.now(),x:145,y:430,tx:190,ty:440,team:"player",kind:"worker",hp:70});setPop(v=>v+1);setMessage("New worker trained.")};
 const buildHouse=()=>{if(wood<150){setMessage("You need 150 wood to build a worker house.");return}setWood(v=>v-150);const n=houses.current.length;houses.current.push({x:230+n*85,y:520+(n%2)*75,built:0});setCap(v=>v+5);setMessage("Worker house construction started. Population capacity +5.")};
 const startMining=()=>{const w=units.current.find(u=>u.kind==="worker");if(!w)return;setSelected([w.id]);mining.current="mine";setMessage("Worker sent to the gold vein. Each delivery adds 25 gold.")};

 return <main className="shell"><header><div className="brand"><span className="sigil">M</span><div><b>MAWIYYA</b><small>DESERT CROWN</small></div></div><div className="online"><i/>1,248 COMMANDERS ONLINE</div></header>
 {screen==="login"&&<section className="gate"><div className="portrait"><img src="/mawiyya.png" alt="Queen Mawiyya"/><div className="portraitText"><span>378 CE · TANUKHID CONFEDERATION</span><h1>THE DESERT<br/>REMEMBERS</h1><p>Command Queen Mawiyya’s riders across the Syrian frontier. Gather resources. Rally the tribes. Break the imperial line.</p></div></div><form onSubmit={e=>{e.preventDefault();if(name.trim())setScreen("lobby")}}><p className="eyebrow">COMMANDER ACCESS</p><h2>Enter the frontier</h2><label>COMMANDER NAME<input value={name} onChange={e=>setName(e.target.value)} required/></label><label>REGION<select><option>Europe · West</option><option>Middle East</option></select></label><button>ENTER WAR ROOM</button></form></section>}
 {screen==="lobby"&&<section className="lobby"><div><p className="eyebrow">MULTIPLAYER SKIRMISH</p><h1>Choose your warband</h1><div className="warband"><div className="warbandArt"/><div className="warbandCopy"><span className="eyebrow">TANUKHID CONFEDERATION</span><h3>Warriors of the frontier</h3><p>Fast desert fighters with mobile workers who mine and deliver gold.</p></div></div><div className="roster">{[{n:"Desert Lancer",r:"CAVALRY",s:"Fast charge · 120 HP"},{n:"Palmyrene Archer",r:"RANGED",s:"Long range · 75 HP"},{n:"Shield Spearman",r:"INFANTRY",s:"Anti-cavalry · 110 HP"}].map((p,i)=><button key={p.n} className={chosen===p.n?"fighter active":"fighter"} onClick={()=>setChosen(p.n)}><span className={`crop crop${i+1}`}/><small>{p.r}</small><b>{p.n}</b><em>{p.s}</em></button>)}</div></div><aside><span className="status">ROOM READY</span><h2>{room}</h2><div className="chosen"><small>FIRST DEPLOYMENT</small><b>{chosen}</b><span>Elite unit joins Mawiyya</span></div><div className="slot"><b>01</b><span>{name}<small>MAWIYYA · TANUKHIDS</small></span><i>READY</i></div><div className="slot enemy"><b>02</b><span>Imperial Eagle<small>ROMAN FOEDERATI · AI</small></span><i>HARD</i></div><label>ROOM CODE<input value={room} onChange={e=>setRoom(e.target.value.toUpperCase())}/></label><button onClick={()=>{units.current=freshArmy();setScreen("game")}}>START SKIRMISH</button></aside></section>}
 {screen==="game"&&<section className="game"><div className="resourceBar"><span>WOOD <b>{wood}</b></span><span>FOOD <b>{food}</b></span><span className="goldCount">GOLD <b>{gold}</b></span><span>POPULATION <b>{pop}/{cap}</b></span><button onClick={()=>setScreen("lobby")}>LEAVE MATCH</button></div><div className="battle bigMap"><canvas ref={canvas} width={1200} height={720} onClick={click}/><div className="mission"><small>BUILD · GATHER · CONQUER</small><b>Build houses and expand the warband</b></div></div><div className="command"><div className="heroMini"><img src="/mawiyya.png" alt="Mawiyya"/><div><small>COMMANDER</small><b>QUEEN MAWIYYA</b><span>Desert cavalry move 15% faster</span></div></div><div className="orders"><button className="mineOrder" onClick={startMining}><b>◆</b><span>Collect Gold<small>WORKER ORDER</small></span></button><button onClick={buildHouse}><b>⌂</b><span>Build House<small>150 WOOD · +5 CAP</small></span></button><button onClick={trainWorker}><b>♟</b><span>Train Worker<small>50 FOOD</small></span></button>{(["spearman","archer","rider"] as const).map((k,i)=><button key={k} onClick={()=>train(k)}><b>{["⚔","➶","♞"][i]}</b><span>{k}<small>80F · 40G</small></span></button>)}</div><div className="log">{message}</div></div></section>}</main>
}

function drawUnit(c:CanvasRenderingContext2D,u:Unit,s:boolean,carrying:boolean,fighting:boolean,frame:number){
 const friendly=u.team==="player",col=friendly?"#254f55":"#7f2824";c.save();c.shadowColor="#000b";c.shadowBlur=8;c.shadowOffsetY=5;
 if(s){c.strokeStyle="#f4d46d";c.lineWidth=2;c.beginPath();c.ellipse(u.x,u.y+12,22,10,0,0,7);c.stroke()}
 if(u.kind==="rider"){c.fillStyle=u.team==="player"?"#6b4b32":"#392a24";c.beginPath();c.ellipse(u.x,u.y+8,25,12,0,0,7);c.fill();c.beginPath();c.moveTo(u.x+18,u.y+3);c.lineTo(u.x+27,u.y-7);c.lineTo(u.x+30,u.y+7);c.fill();c.strokeStyle="#281b14";c.lineWidth=3;for(const lx of [-14,-3,10,20]){c.beginPath();c.moveTo(u.x+lx,u.y+14);c.lineTo(u.x+lx+(frame%12<6?3:-2),u.y+28);c.stroke()}c.fillStyle=col;c.fillRect(u.x-5,u.y-14,11,22)}else{c.fillStyle=col;c.beginPath();c.moveTo(u.x,u.y-11);c.lineTo(u.x-11,u.y+18);c.lineTo(u.x+11,u.y+18);c.fill()}
 c.fillStyle=u.kind==="archer"?"#8f6547":"#9b6d4a";c.beginPath();c.arc(u.x,u.y-16,6,0,7);c.fill();const swing=fighting?Math.sin(frame*.35)*16:0;c.strokeStyle=u.kind==="archer"?"#5b351d":"#d8c18e";c.lineWidth=2;c.beginPath();c.moveTo(u.x+5,u.y);c.lineTo(u.x+14+Math.cos(swing)*8,u.y-22+swing);c.stroke();if(fighting){c.strokeStyle="#f0c568aa";c.beginPath();c.arc(u.x+8,u.y-5,18,-1.2+swing/30,.4+swing/30);c.stroke()}if(u.kind==="worker"){c.fillStyle="#8b6336";c.fillRect(u.x-13,u.y+3,9,12);c.strokeStyle="#302218";c.beginPath();c.moveTo(u.x+5,u.y-3);c.lineTo(u.x+15,u.y-12);c.stroke()}if(carrying){c.fillStyle="#f1c941";c.beginPath();c.arc(u.x-10,u.y,6,0,7);c.fill()}c.restore();c.fillStyle="#111";c.fillRect(u.x-15,u.y-29,30,3);c.fillStyle="#64cc76";c.fillRect(u.x-15,u.y-29,30*u.hp/100,3)
}

function drawHouse(c:CanvasRenderingContext2D,x:number,y:number,built:number){const h=50*built/100;c.save();c.fillStyle="#0006";c.beginPath();c.ellipse(x,y+25,43,17,0,0,7);c.fill();c.fillStyle="#b49366";c.fillRect(x-34,y+22-h,68,h);c.fillStyle="#6d3d2b";c.beginPath();c.moveTo(x-43,y+22-h);c.lineTo(x,y-12-h);c.lineTo(x+43,y+22-h);c.fill();c.fillStyle="#2b2017";c.fillRect(x-8,y+5,16,17);if(built<100){c.strokeStyle="#e4cb8a";c.strokeRect(x-40,y-42,80,68);c.fillStyle="#f0d36b";c.fillRect(x-40,y-50,80*built/100,5)}c.restore()}
