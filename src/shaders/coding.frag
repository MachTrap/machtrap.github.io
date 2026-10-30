#version 300 es
precision highp float;
out vec4 color;
uniform vec2 resolution;
uniform vec2 viewportOrigin;
uniform vec3 accent;
uniform vec3 background;
uniform float phase;
// Original procedural reinterpretation of w3tcDf's editor / phone composition.
// Everything in the scene is shaded geometry; no source text or reference assets.
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float box(vec2 p,vec2 b,float r){vec2 q=abs(p)-b+r;return min(max(q.x,q.y),0.)+length(max(q,0.))-r;}
float maskBox(vec2 p,vec2 b,float r,float aa){return 1.-smoothstep(-aa,aa,box(p,b,r));}
const int alphabet[26]=int[26](10090902,7968663,14749982,7969175,15800095,1120031,7479847,15798545,10067961,10345401,6920598,1145239,9795991,7898654,6710895,6920601,6723993,10484121,10053273,15803535,4329764,2394178,12862028,3286051,6684672,921088);
float glyph(vec2 cell,vec2 uv){
 int index=int(floor(hash(cell)*26.));
 vec2 ink=uv*vec2(5.,7.);ivec2 pixel=ivec2(floor(ink));
 if(pixel.x>=4 || pixel.y>=6)return 0.;
 int shift=pixel.x+pixel.y*4;
 float bit=float((alphabet[index]>>shift)&1);
 vec2 edge=min(fract(ink),1.-fract(ink));
 return bit*smoothstep(0.,.12,min(edge.x,edge.y));
}
vec3 editor(vec2 uv,vec2 dimensions){
 vec2 q=vec2(uv.x,1.-uv.y);
 vec3 ivory=vec3(.83,.84,.78),muted=mix(ivory,background,.62);
 vec3 col=background+vec3(.011,.016,.012);
 float aa=1./dimensions.y;
 // Title chrome, quiet mint selection, activity rail, and a compact status bar.
 if(q.y<.075){
  col+=vec3(.014);
  for(int i=0;i<3;i++)col+=ivory*.22*(1.-smoothstep(.004,.007,length((q-vec2(.035+float(i)*.024,.036))*vec2(dimensions.x/dimensions.y,1.))));
  col=mix(col,ivory*.09,maskBox(q-vec2(.57,.037),vec2(.17,.014),.004,aa));
  return col;
 }
 if(q.y>.965)return mix(background,accent,.09)+accent*.32*step(q.x,.23)*step(q.y,.969);
 if(q.x<.065){
  col+=vec3(.008);
  for(int i=0;i<4;i++){float y=.15+float(i)*.12;float icon=abs(box(q-vec2(.032,y),vec2(.012,.016),.002));col+=muted*(1.-smoothstep(.001,.003,icon))*.5;}
  return col;
 }
 if(q.y<.15){
  float tab=floor((q.x-.065)/.26);
  col+=tab<1.?vec3(.009):vec3(.003);
  col+=accent*step(tab,0.)*step(q.y,.079)*.8;
  float labels=step(abs(q.y-.112),.002)*step(fract((q.x-.065)/.26),.7)*step(.12,fract((q.x-.065)/.26));
  return col+muted*labels*.7;
 }
 vec2 area=vec2((q.x-.065)/.935,(q.y-.15)/.815);
 float rows=dimensions.y<350.?18.:34.;
 float cols=max(28.,dimensions.x/dimensions.y*rows*1.8);
 float scroll=floor(phase*.65);
 vec2 grid=area*vec2(cols,rows),cell=floor(grid),local=fract(grid);
 float row=cell.y+scroll;
 float indent=floor(1.+2.5*(.5+.5*sin(row*.49)));
 float lineLength=9.+hash(vec2(row,8.))*max(8.,cols-17.);
 float cursorRow=floor(rows*.72),cursorX=indent+5.+mod(phase*8.,max(8.,cols-12.));
 if(cell.y==cursorRow)col+=accent*.035;
 if(cell.x<3.){
  col+=vec3(.004);
  float digit=glyph(vec2(row,floor(cell.x)),local)*step(1.,cell.x);
  return col+muted*digit*.35;
 }
 float x=cell.x-3.;
 if(x<indent){
  col+=accent*.065*step(abs(local.x-.5),.035)*step(.5,x);
  return col;
 }
 bool written=cell.y<cursorRow || (cell.y==cursorRow && x<cursorX);
 if(written && x<lineLength && hash(vec2(row,3.))>.08){
  float word=floor((x-indent)/5.);
  vec3 ink=mix(ivory,accent,step(.55,hash(vec2(row,word)))*.65);
  if(word<1.)ink=mix(accent,vec3(.62,.72,.77),hash(vec2(row,1.))*.65);
  float space=step(.17,hash(vec2(row,floor(x/3.))));
  col+=ink*glyph(vec2(row,x),local)*space*.7;
 }
 if(cell.y==cursorRow && abs(x-cursorX)<.18)col+=accent*.8;
 return col;
}
vec3 phone(vec2 uv,vec2 dimensions){
 vec2 p=(uv-.5)*vec2(dimensions.x/dimensions.y,1.)*2.05;
 p.y-=sin(phase*.3)*.012;
 float aa=2./dimensions.y;
 vec3 col=background+accent*exp(-dot(p,p)*1.1)*.025;
 float body=box(p,vec2(.39,.78),.085);
 float screen=box(p,vec2(.365,.752),.065);
 float rim=exp(-abs(body)*180.);
 col+=mix(accent,vec3(.83,.84,.78),.65)*rim*(.25+.55*smoothstep(-.5,.5,p.x+p.y));
 col+=accent*exp(-abs(body)*22.)*.014;
 if(body<0.){
  col=vec3(.065,.075,.065)+vec3(.025)*smoothstep(-.5,.5,p.x+p.y);
  if(screen<0.){
   vec2 s=(p+vec2(.365,.752))/vec2(.73,1.504);
   col=background+vec3(.016,.022,.018);
   if(s.y>.86){
    col+=accent*.065;
    float title=maskBox(s-vec2(.33,.89),vec2(.20,.007),.003,aa);
    col+=vec3(.7,.74,.68)*title*.55;
    float status=step(abs(s.y-.967),.0025)*(step(s.x,.2)+step(.83,s.x));
    col+=vec3(.55)*status;
   }else if(s.y>.08){
    // A feed scrolls in short, eased bursts, as in the reference composition.
    float cycle=phase/3.2,burst=smoothstep(.62,.96,fract(cycle));
    float feed=(.86-s.y)+(floor(cycle)+burst)*.29;
    float row=floor(feed/.17);vec2 tile=vec2(s.x,fract(feed/.17));
    float avatar=maskBox(tile-vec2(.15,.48),vec2(.075,.28),.025,aa);
    float seed=hash(vec2(row,5.));
    col+=mix(accent,vec3(.65,.72,.77),seed*.6)*avatar*.23;
    float line=maskBox(tile-vec2(.59,.35),vec2(.27,.025),.012,aa);
    float sub=maskBox(tile-vec2(.5,.61),vec2(.18,.016),.01,aa);
    col+=vec3(.7,.73,.67)*line*.42+accent*sub*.12;
    col+=vec3(.08)*step(tile.y,.006);
   }else{
    for(int i=0;i<3;i++){float icon=maskBox(s-vec2(.2+float(i)*.3,.049),vec2(.022,.009),.005,aa);col+=accent*icon*(i==0?.5:.13);}
   }
   float notch=maskBox(p-vec2(0.,.702),vec2(.083,.018),.017,aa);
   col=mix(col,vec3(.003),notch);
   col+=vec3(.32)*maskBox(p-vec2(0.,-.721),vec2(.09,.002),.002,aa);
  }
 }
 return col;
}
void main(){
 vec2 uv=(gl_FragCoord.xy-viewportOrigin)/resolution;
 bool portrait=resolution.x/resolution.y<1.1;
 vec3 col;
 if(portrait){
  if(uv.y>.43)col=phone(vec2(uv.x,(uv.y-.43)/.57),resolution*vec2(1.,.57));
  else col=editor(vec2(uv.x,uv.y/.43),resolution*vec2(1.,.43));
  col+=accent*.12*(1.-smoothstep(0.,.0015,abs(uv.y-.43)));
 }else{
  if(uv.x<.57)col=editor(vec2(uv.x/.57,uv.y),resolution*vec2(.57,1.));
  else col=phone(vec2((uv.x-.57)/.43,uv.y),resolution*vec2(.43,1.));
  col+=accent*.12*(1.-smoothstep(0.,.0015,abs(uv.x-.57)));
 }
 col+=(hash(gl_FragCoord.xy)-.5)*.0015;
 color=vec4(col,1.);
}
