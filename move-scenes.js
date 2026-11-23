/* 32×32 hand-drawn scenes. Objects move independently of their surroundings. */
window.paintMoveScene=(()=>{
 const C={ink:'#152137',white:'#fff2cd',gold:'#ffd255',sun:'#ffac49',orange:'#ff7945',pink:'#ff78ac',rose:'#ed517c',
  purple:'#a994ff',blue:'#63b6ff',ice:'#a1f1ff',mint:'#61eaaa',green:'#75e447',grass:'#36a464',
  steel:'#96b4cc',wood:'#b47550',cream:'#ffcca0',floor:'#34445c',deep:'#16233c'};
 const {ink,white,gold,sun,orange,pink,rose,purple,blue,ice,mint,green,grass,steel,wood,cream,floor,deep}=C;
 const sin=(f,n=16)=>Math.sin(f*Math.PI*2/n), cos=(f,n=16)=>sin(f+n/4,n);
 const wave=(f,a=1,n=16)=>Math.round(sin(f,n)*a), swing=(f,a=1,n=16)=>Math.round(cos(f,n)*a);
 const R=Math.round;
 function pencil(ctx){
  const rect=(x,y,w,h,c)=>{ctx.fillStyle=c;ctx.fillRect(R(x),R(y),w,h);};
  const line=(x0,y0,x1,y1,c,w=1)=>{
   x0=R(x0);y0=R(y0);x1=R(x1);y1=R(y1);
   const dx=Math.abs(x1-x0),dy=-Math.abs(y1-y0),sx=x0<x1?1:-1,sy=y0<y1?1:-1;
   let e=dx+dy;
   for(;;){rect(x0-Math.floor(w/2),y0-Math.floor(w/2),w,w,c);if(x0===x1&&y0===y1)break;const a=2*e;if(a>=dy){e+=dy;x0+=sx;}if(a<=dx){e+=dx;y0+=sy;}}
  };
  const oval=(x,y,rx,ry,c)=>{
   x=R(x);y=R(y);
   for(let j=-ry;j<=ry;j++){const a=Math.floor(rx*Math.sqrt(Math.max(0,1-j*j/(ry*ry))));rect(x-a,y+j,2*a+1,1,c);}
  };
  const star=(x,y,c,s=2)=>{line(x-s,y,x+s,y,c);line(x,y-s,x,y+s,c);rect(x,y,1,1,white);};
  const shadow=(x=16,y=28,w=11)=>oval(x,y,w,1,'#0b1729');
  const ground=(y=25,c=floor)=>{rect(1,y,30,31-y,c);rect(1,y,30,1,'#506482');};
  const sky=(f=0)=>{for(const [i,x,y] of [[0,4,5],[1,11,9],[2,25,5],[3,28,13],[4,6,21],[5,21,19]])rect(x,y,1,1,(f+i*3)%16<4?white:'#576793');};
  const bubble=(x,y)=>{rect(x,y,2,1,ice);rect(x,y+1,1,1,blue);};
  const note=(x,y,c=pink)=>{rect(x-2,y+3,3,2,c);rect(x,y-1,1,5,c);rect(x,y-1,3,1,c);};
  const face=(x,y,look=0,c=cream)=>{
   oval(x,y,7,7,wood);oval(x,y-1,7,6,c);rect(x-4+look,y-2,2,2,ink);rect(x+2+look,y-2,2,2,ink);
   rect(x-2,y+2,5,1,rose);rect(x-1,y+3,3,1,rose);
  };
  const cube=(x,y,c=gold)=>{rect(x,y,6,6,ink);rect(x+1,y+1,4,4,c);rect(x+1,y+1,4,1,white);};
  return {rect,line,oval,star,shadow,ground,sky,bubble,note,face,cube};
 }
 const scenes={
  'Home':({rect:r,line:l,ground:g,oval:o,star:s},f)=>{
   g(26,'#31675c');r(5,23,10,4,steel);r(21,22,7,4,grass);r(22,21,5,1,mint);
   const k=Math.min(f,10),x=24-Math.round((10-k)*.7),y=19-Math.round((10-k)*.9);
   const ex=12+Math.round((10-k)*.45),ey=9+Math.round(k*.55);
   l(10,23,ex,ey,blue,4);l(ex,ey,x,y,purple,3);o(ex,ey,2,2,ice);
   r(x-2,y,5,2,cream);r(x-2,y+2,1,2,cream);r(x+2,y+2,1,2,cream);
   if(f>=10)s(26,13,mint,2);
  },
  'Wave hello':({line:l,oval:o,rect:r,star:s},f)=>{
   const x=16+wave(f,6),y=10+swing(f,2);l(15,27,x,y+3,blue,5);o(x,y+1,4,4,cream);
   for(let i=-3;i<=3;i+=2)l(x+i,y+1,x+i+wave(f,1),y-5+Math.abs(i)-1,cream,2);
   r(x-5,y+1,2,3,cream);if(f%4<2)s(x<16?25:6,9,gold,2);
  },
  'Nod yes':({face,rect:r,line:l},f)=>{
   const y=13+wave(f,3);r(10,23,12,5,grass);face(15,y);l(21,23,24,26,mint,2);l(24,26,29,19,mint,2);
  },
  'Shake no':({face,rect:r,line:l},f)=>{
   const x=14+wave(f,4);r(8,23,12,5,'#694f91');face(x,14,Math.sign(wave(f)));l(23,21,28,26,pink,2);l(28,21,23,26,pink,2);
  },
  'Look around':({oval:o,rect:r,star:s},f)=>{
   const x=wave(f,3);o(10,15,7,5,ice);o(22,15,7,5,ice);o(10+x,15,3,4,blue);o(22+x,15,3,4,blue);
   r(10+x,13,2,4,ink);r(22+x,13,2,4,ink);s(x<0?5:26,7,gold,1);
  },
  'Radar scan':({oval:o,line:l,rect:r},f)=>{
   o(16,16,13,13,'#285650');o(16,16,12,12,'#142a32');o(16,16,8,8,'#2a554b');o(16,16,7,7,'#142a32');
   l(16,4,16,28,'#355e50');l(4,16,28,16,'#355e50');
   for(let i=-2;i<=0;i++)l(16,16,16+wave(f+i,11),16+swing(f+i,11),i?'#4a8063':mint);
   for(const [x,y,s] of [[11,9,10],[24,12,3],[18,23,7]])r(x,y,2,2,(f+s)%16<5?gold:'#4c9c66');
  },
  'Claw snap':({oval:o,rect:r,line:l,star:s},f)=>{
   const a=[6,6,5,4,3,2,1,1,1,2,3,4,5,6,6,6][f];o(16,24,5,4,rose);r(14,20,5,5,orange);
   for(const d of [-1,1]){l(16+d*2,21,16+d*7,14,orange,3);l(16+d*7,14,16+d*a,8,pink,3);l(16+d*a,8,16+d*a,5,cream);}
   if(a<3)s(16,6,gold,2);
  },
  'Pick and place':({rect:r,line:l,cube,ground:g},f)=>{
   g(27);r(2,26,9,2,blue);r(21,26,9,2,mint);r(4,4,24,2,steel);
   const x=f<4?7:f<11?7+R((f-4)*2.6):24;
   const y=f<4?9+f*3:f<7?18-(f-4)*3:f<11?11:f<14?11+(f-11)*4:19;
   r(x-1,5,3,y-4,steel);l(x-3,y,x+3,y,blue,2);l(x-3,y,x-3,y+4,blue);l(x+3,y,x+3,y+4,blue);
   cube(f<3?4:f>=14?21:x-3,f<3||f>=14?20:y+2,gold);
  },
  'Excavator dig':({rect:r,line:l,oval:o,ground:g},f)=>{
   g(26,'#76513d');r(3,23,12,4,ink);o(7,24,2,2,steel);o(12,24,2,2,steel);r(5,17,10,6,gold);r(7,14,6,5,blue);
   const x=23+wave(f,3),y=18+swing(f,5);l(13,19,19,10,gold,3);l(19,10,x,y,gold,3);
   r(x-1,y,5,3,orange);r(x,y+2,3,2,wood);if(f>11)r(x+4,26-(f%3),2,2,sun);
  },
  'Dance':({rect:r,line:l,oval:o,note,shadow},f)=>{
   const x=16+wave(f,3),y=14-Math.abs(wave(f,3));shadow();o(x,y-5,4,4,pink);r(x-3,y,7,7,purple);r(x-2,y-6,4,1,ink);
   l(x-3,y+2,x-8,y+wave(f,4),ice,2);l(x+3,y+2,x+8,y-wave(f,4),ice,2);l(x-2,y+6,x-5+wave(f,2),26,blue,2);l(x+2,y+6,x+5-wave(f,2),26,blue,2);
   note(5,7+f%5,gold);note(27,6+(f+3)%5,mint);
  },
  'Disco spin':({oval:o,line:l,rect:r,star:s},f)=>{
   l(16,2,16,6,steel);o(16,15,9,9,'#956dd4');
   for(let y=8;y<23;y+=3)for(let x=9;x<24;x+=3)if((x-16)**2+(y-15)**2<71)
    r(x,y,2,2,[ice,pink,blue,purple,gold][(x+y+Math.floor(f/2))%5]);
   for(const [x,y,k] of [[5,8,0],[25,6,1],[27,24,3],[7,23,4]])s(x,y,[ice,pink,gold,mint,purple][(k+(f>>2))%5],f%4<2?2:1);
  },
  'Stretch':({rect:r,line:l,oval:o},f)=>{
   const d=4+Math.abs(wave(f,6));o(16,8,4,4,gold);r(13,12,7,10,purple);
   l(14,14,16-d,13-d/2,mint,2);l(18,14,16+d,13-d/2,mint,2);
   l(14,21,16-d,25,blue,2);l(18,21,16+d,25,blue,2);
   r(15-d,12-d/2,3,2,white);r(16+d,12-d/2,3,2,white);
  },
  'Bow':({oval:o,line:l,rect:r,shadow},f)=>{
   const b=Math.max(0,wave(f-2,8));shadow();r(11,19,9,6,purple);l(13,24,11,28,purple,2);l(18,24,19,28,purple,2);
   l(16,21,16+b,13+b/2,blue,6);o(16+b,10+b/2,4,4,cream);r(13+b,7+b/2,7,2,gold);
   l(15,18,13+b,22,ice,2);
  },
  'Screwdriver':({rect:r,line:l},f)=>{
   r(7,24,18,5,floor);r(11,22,10,2,steel);r(14,17,4,5,steel);
   for(let y=17;y<22;y+=2)l(14,y,17,y-1,ink);
   r(15,11,2,9,ice);r(12,4,8,9,orange);r(13+Math.abs(wave(f,5)),5,2,6,gold);
   r(14,22+Math.max(0,wave(f,2)),4,1,white);
  },
  'Pour a drink':({rect:r,line:l,oval:o},f)=>{
   r(5,27,23,2,wood);r(21,18,7,9,ice);r(22,19,5,7,deep);r(22,26-Math.min(f,6),5,1+Math.min(f,6),sun);
   l(6,8,8,15,steel,4);l(8,15,16,12,blue,5);l(15,12,19,11,ice,2);o(7,9,3,2,blue);
   for(let k=0;k<3;k++){const q=(f+k*3)%8;l(19+q/2,12+q,20+q/2,13+q,sun);}
  },
  'Stir the pot':({rect:r,line:l,oval:o},f)=>{
   r(4,27,24,2,wood);r(5,19,4,3,steel);r(23,19,4,3,steel);
   r(8,17,16,8,'#98456c');r(10,24,12,2,rose);r(10,20,2,3,pink);o(16,17,8,3,pink);o(16,17,7,2,'#613141');
   const x=16+wave(f,5),y=17+swing(f,1);o(x,y,3,1,sun);l(x,y,16+wave(f,4),6+swing(f,2),cream,2);
   r(15+wave(f,4),5+swing(f,2),3,2,sun);r(9,19,14,1,pink);
   for(let j=0;j<3;j++){const t=(f+5*j)%16;if(t<12){const h=12-Math.floor(t/2),s=8+j*7+wave(t,1);r(s,h,1,2,t<7?white:'#94677e');}}
  },
  'Draw a circle':({rect:r,line:l,star:s},f)=>{
   r(5,5,22,23,'#293b59');r(7,7,18,19,'#d5e6e4');
   for(let i=0;i<=f;i++)l(16+wave(i,6),16+swing(i,6),16+wave(i+1,6),16+swing(i+1,6),grass);
   const x=16+wave(f+1,6),y=16+swing(f+1,6);l(x,y,x+5,y-6,rose,2);s(x,y,gold,1);
  },
  'Figure eight':({line:l,star:s},f)=>{
   const xy=i=>[16+wave(i,9),16+wave(i,6,8)];
   for(let i=0;i<16;i++)l(...xy(i),...xy(i+1),i<f?purple:'#3c4068',2);
   s(...xy(f),ice,2);
  },
  'Hammer':({rect:r,line:l,star:s},f)=>{
   r(6,25,21,4,wood);r(17,22+(f>8?2:0),3,3,steel);
   const y=f<8?5+f*2:20-(f-8)*2; l(6,23,15,y,cream,3);l(11,y,21,y,steel,5);l(12,y-2,20,y-2,ice,2);
   if(f>6&&f<10){s(23,21,gold,2);s(26,17,orange,1);}
  },
  'Swim':({oval:o,rect:r,line:l,bubble},f)=>{
   r(1,8,30,22,'#1b4865');const x=16+wave(f,5),y=16+swing(f,3),d=f>4&&f<13?-1:1;
   o(x,y,6,4,gold);l(x-d*5,y,x-d*10,y+wave(f,4,8),orange,3);r(x+d*3,y-1,2,2,ink);r(x-1,y-1,2,3,sun);
   for(let i=0;i<3;i++)bubble(26-i*3,18-(f+i*4)%12);
   l(3,29,4+wave(f,1),24,mint,2);l(28,29,27+wave(f,1),25,grass,2);
  },
  'Peek-a-boo':({oval:o,rect:r,star:s},f)=>{
   const y=20-Math.max(0,wave(f-2,10));o(16,y,7,7,ice);r(10,y+1,13,6,ice);
   r(12,y-2,2,3,deep);r(18,y-2,2,3,deep);r(15,y+2,2,2,purple);
   r(4,20,24,8,'#703e86');r(3,19,26,2,pink);r(7,23,18,1,'#ab65b7');if(y<13)s(25,9,gold,2);
  },
  'Rocket launch':({oval:o,rect:r,line:l,star:s,sky},f)=>{
   sky(f);const y=f<4?15:15-R((f-4)*.8);const tail=3+(f%3);
   l(12,y+7,10,y+12,rose,3);l(20,y+7,22,y+12,rose,3);o(16,y+3,4,7,white);o(16,y-2,3,2,rose);
   o(16,y+2,2,2,blue);r(14,y+9,5,2,steel);l(16,y+11,16,y+11+tail,orange,3);r(16,y+11+tail,1,2,gold);
   if(f>=5)s(6,27-f%4,cream,1);
  },
  'Sleepy':({oval:o,rect:r,line:l,star:s,sky},f)=>{
   sky(f);o(23,8,5,5,gold);o(25,6,4,4,deep);r(4,20,24,7,purple);r(4,17,8,4,ice);o(10,17,4,3,cream);
   l(8,17,11,17,ink);r(14,18-(f>7?1:0),12,5,blue);l(14,21,25,21,ice);
   s(13+(f>>2),12-(f>>2),white,1);
  },
  'Twinkle Twinkle':({sky,star:s},f)=>{
   sky(f);s(16,14,gold,4+Math.abs(wave(f,2)));s(8,21,blue,1+(f%8<4?1:0));s(24,8,pink,1+(f%8>=4?1:0));s(23,23,ice,2);
  },
  'Baa Baa Black Sheep':({oval:o,rect:r,line:l,ground:g},f)=>{
   g(26,'#396150');const x=16+wave(f,4),y=17-Math.abs(wave(f,2));
   for(const dx of [-5,3])l(x+dx,y+3,x+dx+wave(f,2,8),25,ink,2);
   o(x,y,9,5,'#5d597b');o(x-3,y-2,4,4,'#797292');o(x+3,y-2,4,4,'#696184');o(x+8,y,4,4,ink);r(x+9,y-1,1,1,white);
   r(6,24,1,2,green);r(24,25,1,2,gold);
  },
  'Johny Johny Yes Papa':({face,rect:r},f)=>{
   const a=f<8;face(9,15+(a?wave(f,2,8):0),1);face(23,13+(a?0:wave(f,2,8)),-1,sun);
   r(6,24,8,4,blue);r(19,22,9,6,purple);
   if(a)r(8,17+wave(f,2,8),3,2,ink);else r(22,15+wave(f,2,8),3,2,ink);
   r(14,4,3,2,a?pink:blue);r(18,4,3,2,a?pink:blue);
  },
  'Row Your Boat':({rect:r,line:l,oval:o},f)=>{
   r(1,19,30,11,'#204f78');for(let i=0;i<4;i++)r(3+(i*8+f)%24,22+i%2*4,4,1,ice);
   const x=16+wave(f,3),y=19+swing(f,1);l(x-9,y,x+9,y,wood,3);l(x-5,y+3,x+5,y+3,orange,2);
   o(x,y-8,2,2,cream);l(x,y-4,x,y-1,pink,2);l(x,y-3,x+6+wave(f,3),y+4,sun,2);
   r(x+6+wave(f,3),y+4,3,1,ice);
  },
  'Wheels on the Bus':({rect:r,oval:o,line:l},f)=>{
   r(1,23,30,7,floor);for(let i=0;i<4;i++)r(2+(i*8+16-f)%26,27,4,1,white);
   const y=10+(f%8<4?0:1);r(4,y,23,11,gold);r(5,y+1,22,4,blue);r(10,y+1,2,4,gold);r(17,y+1,2,4,gold);
   for(const x of [9,23]){o(x,y+11,3,3,ink);l(x-wave(f,2,8),y+11-swing(f,2,8),x+wave(f,2,8),y+11+swing(f,2,8),steel);}
   r(25,y+7,2,2,white);
  },
  'Happy Birthday':({rect:r,oval:o,star:s},f)=>{
   r(6,20,20,7,rose);r(6,20,20,2,pink);r(8,16,16,5,cream);r(8,16,16,2,pink);
   for(const [i,x] of [11,16,21].entries()){r(x,11,2,5,i===1?mint:blue);o(x+wave(f+i,1,8),9,1,2,gold);}
   for(const [i,x,c] of [[0,7,ice],[1,26,pink],[2,24,mint]])s(x,4+(f+i*4)%10,c,1);
  },
  'Jingle Bells':({line:l,oval:o,rect:r,note},f)=>{
   const a=wave(f,4);l(16,4,16+a,10,gold,2);o(16+a,16,6,6,gold);l(9+a,21,23+a,21,sun,3);
   o(16+a+wave(f,2),23,2,2,orange);note(6,7+(f>>2),mint);note(27,6+((f+8)%16>>2),ice);
   r(13+a,13,2,4,white);
  },
  'Ode to Joy':({line:l,note,rect:r,star:s},f)=>{
   for(let y=10;y<22;y+=3)l(3,y,28,y,'#675786');
   for(let j=0;j<5;j++){const x=4+(j*6+16-f)%25,y=18-[0,2,4,5,7][j];note(x,y,[pink,gold,mint,blue,purple][j]);}
   s(16,5,gold,1+Math.abs(wave(f,1)));r(5,26,22,1,purple);
  },
  'Für Elise':({rect:r,note},f)=>{
   r(3,11,26,15,'#534575');const k=[4,3,4,3,4,1,3,2][f>>1];
   for(let i=0;i<7;i++){r(5+i*3,14,2,10,i===k?pink:white);if(i!==2&&i!==6)r(6+i*3,14,2,5,ink);}
   note(8+((f*2)%17),7-((f>>1)%4),k===4?gold:mint);
  },
  'Mountain King':({rect:r,line:l,sky,star:s},f)=>{
   sky(f);for(let i=0;i<13;i++){l(3+i,26,3+i,26-i,'#435d91');l(28-i,26,28-i,26-i,'#395082');}
   r(11,24,10,3,ink);const y=25-Math.min(f,10);r(12,y-6,9,5,sun);l(12,y-6,11,y-10,gold,2);l(16,y-6,16,y-11,gold,2);l(20,y-6,21,y-10,gold,2);r(14,y-5,5,1,white);
   if(f>8)s(25,9,gold,1);
  }
 };
 return (name,ctx,f)=>{
  const paint=scenes[name];if(!paint)return false;
  // Clip to the inset so a moving prop never overwrites the scene frame.
  ctx.save();ctx.beginPath();ctx.rect(1,1,30,30);ctx.clip();
  paint(pencil(ctx),f%16);ctx.restore();return true;
 };
})();
