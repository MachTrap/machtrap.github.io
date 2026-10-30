#version 300 es
precision highp float;
out vec4 color;
uniform vec2 resolution;
uniform vec2 viewportOrigin;
uniform vec3 accent;
uniform vec3 background;
uniform float sceneTime;
uniform vec4 timelineA; // assembly, detail, completion, reset
uniform vec4 timelineB; // editor reveal, signal progress (-1 inactive), navigation, unused
uniform vec3 codeState; // outgoing document, incoming document, crossfade
uniform vec3 inspection; // tilt x, tilt y, pulse age
uniform mat3 phoneRotation;
uniform mat3 editorRotation;
uniform sampler2D glyphAtlas;
uniform sampler2D codeGrid;
uniform float atlasReady;
uniform int localeIndex;
const vec3 IVORY=vec3(.906,.902,.85);
float box(vec2 p,vec2 b,float r){vec2 d=abs(p)-b+r;return length(max(d,0.))+min(max(d.x,d.y),0.)-r;}
float coverage(float distance,float pixel){return 1.-smoothstep(-pixel,pixel,distance);}
float rounded(vec2 p,vec2 center,vec2 halfSize,float radius,float pixel){return coverage(box(p-center,halfSize,radius),pixel);}
float line(vec2 p,vec2 a,vec2 b){vec2 q=p-a,v=b-a;return length(q-v*clamp(dot(q,v)/dot(v,v),0.,1.));}
float label(vec2 p,vec2 origin,float height,int id,float ratio){
 vec2 q=(p-origin)/vec2(height*6.4*ratio,height);
 if(atlasReady<.5||q.x<0.||q.y<0.||q.x>1.||q.y>1.)return 0.;
 int index=id+localeIndex*16;
 vec2 tile=vec2(float(index%4)*256.,192.+float(index/4)*40.);
 return textureLod(glyphAtlas,(tile+q*vec2(256.,40.))/vec2(1024.,512.),0.).a;
}
float character(int code,vec2 q){
 if(atlasReady<.5||code<33||code>126)return 0.;
 int index=code-32;vec2 tile=vec2(float(index%16)*32.,float(index/16)*32.);
 return textureLod(glyphAtlas,(tile+q*vec2(16.,32.))/vec2(1024.,512.),0.).a;
}
vec2 project(vec3 p){return p.xy*3.6/(5.-p.z);}
vec3 plane(vec2 p,vec3 center,mat3 rotation){
 vec3 origin=vec3(0,0,5),ray=normalize(vec3(p,-3.6));
 vec3 normal=rotation[2];float t=dot(center-origin,normal)/dot(ray,normal);
 return transpose(rotation)*(origin+ray*t-center);
}
vec3 documentLayer(vec2 q,vec2 halfSize,int group,float reveal,bool portrait){
 float columns=portrait?max(25.,halfSize.x/halfSize.y*16.):34.;
 float cellWidth=halfSize.x*1.76/columns,cellHeight=cellWidth*2.;
 vec2 grid=vec2((q.x-.105)*halfSize.x*2./cellWidth,(q.y-.23)*halfSize.y*2./cellHeight);
 ivec2 cell=ivec2(floor(grid));vec2 local=fract(grid);
 if(cell.y<0||cell.y>=8||cell.x<0||cell.x>=38)return vec3(0.);
 int row=group*8+cell.y;
 int code=int(textureLod(codeGrid,(vec2(float(cell.x),float(row))+.5)/vec2(40.,24.),0.).r*255.+.5);
 // The same fixed-slot, left-to-right decode language as the footer links.
 // Whitespace stays intact; only unresolved glyphs cycle at 55 ms intervals.
 int rowLength=int(textureLod(codeGrid,(vec2(39.,float(row))+.5)/vec2(40.,24.),0.).r*255.+.5);
 float start=cell.y<=5?float(cell.y)*.125:.74;
 float progress=clamp((reveal-start)/.30,0.,1.);
 float appear=smoothstep(0.,.15,progress)*(cell.y>=6?.6:1.);
 float threshold=.18+float(cell.x)/float(max(1,rowLength-1))*.65;
 bool resolved=progress>=threshold||code==32;
 int displayed=code;
 if(!resolved){
  int frame=int(floor(sceneTime/.055));
  int noise=(frame*7+cell.x*13+cell.y*17+group*11)%47;
  const int symbols[11]=int[11](95,60,62,47,92,91,93,123,125,43,42);
  displayed=noise<26?65+noise:noise<36?48+noise-26:symbols[noise-36];
 }
 float ink=character(displayed,local)*appear;
 bool punctuation=code==40||code==41||code==123||code==125||code==47;
 vec3 settledTint=cell.y==0?accent:punctuation?accent*.6:cell.y==7?IVORY*.35:IVORY*.8;
 vec3 tint=resolved?settledTint:accent*.85;
 vec3 result=tint*ink;
 int cursorRow=min(4,int(floor(reveal*5.)));
 int length=int(textureLod(codeGrid,(vec2(39.,float(group*8+cursorRow))+.5)/vec2(40.,24.),0.).r*255.+.5);
 if(cell.y==cursorRow){
  result+=accent*.045;
  if(cell.x==length)result+=accent*step(local.x,.10)*step(.12,local.y)*step(local.y,.86)*(.75+.25*sin(sceneTime*3.));
 }
 // A small gutter: deliberate line marks rather than random pseudo-digits.
 return result;
}
vec3 editorSurface(vec2 p,vec2 halfSize,bool portrait){
 float pixel=max(.0008,length(fwidth(p))*.65);
 vec2 q=(p/halfSize+1.)*.5;q.y=1.-q.y;
 float body=box(p,halfSize,.035);
 vec3 base=background+vec3(.022,.032,.026);
 base+=accent*exp(-length(q-vec2(.05,.05))*3.)*.025;
 float chrome=step(q.y,.14);
 base+=vec3(.012)*chrome;
 float edge=exp(-abs(body)*150.);base+=mix(accent,IVORY,.5)*edge*.22;
 float rule=1.-smoothstep(.0005,.0025,abs(q.y-.14));base+=IVORY*rule*.09;
 float tabLine=step(q.x,.4)*(1.-smoothstep(.0004,.002,abs(q.y-.143)));base+=accent*tabLine*.55;
 base+=IVORY*.55*label(q,vec2(.065,.044),portrait?.085:.065,12,halfSize.y/halfSize.x);
 base+=accent*rounded(p,vec2(-halfSize.x*.93,halfSize.y*.91),vec2(.009),.004,pixel)*.6;
 if(q.y>.18&&q.y<.91){
  float blend=codeState.z;
  vec3 oldDoc=documentLayer(q+vec2(0.,blend*.02),halfSize,int(codeState.x),codeState.x==codeState.y?timelineB.x:1.,portrait);
  vec3 newDoc=documentLayer(q-vec2(0.,(1.-blend)*.02),halfSize,int(codeState.y),timelineB.x,portrait);
  base+=mix(oldDoc,newDoc,blend);
  float rail=1.-smoothstep(.0004,.0017,abs(q.x-.075));base+=accent*rail*.08;
 }
 float status=step(.955,q.y);base=mix(base,background+accent*.035,status);
 base+=accent*.6*step(q.x,timelineB.x*.38)*step(.955,q.y)*step(q.y,.958);
 float stage=codeState.y;
 base+=IVORY*.35*label(q,vec2(.065,.963),.032,9+int(stage),halfSize.y/halfSize.x);
 // Broad controlled reflection, never an animated scanline field.
 float shine=exp(-pow((q.x*.5+q.y*.2-.1-sin(sceneTime*.13)*.06)*7.,2.));
 return base+IVORY*shine*.012;
}
float ring(vec2 p,vec2 center,float radius,float progress,float pixel){
 vec2 d=p-center;float a=atan(d.x,-d.y);if(a<0.)a+=6.283185;
 float mask=1.-smoothstep(pixel,pixel*2.,abs(length(d)-radius)-.004);
 return mask*(.12+.88*(1.-smoothstep(progress*6.283,progress*6.283+.05,a)));
}
vec3 application(vec2 s,float pixel){
 float assembly=timelineA.x,detail=timelineA.y,complete=timelineA.z,ratio=2.28/1.04;
 vec3 col=background+vec3(.018,.027,.022);
 col+=accent*exp(-length(s-vec2(.1,.1))*3.)*.035;
 float dashboard=1.-detail*.9;
 col+=IVORY*label(s,vec2(.17,.09),.062,5,ratio)*detail;
 vec2 back=vec2(s.x,s.y*ratio);
 float arrow=min(line(back,vec2(.12,.12*ratio),vec2(.09,.135*ratio)),line(back,vec2(.09,.135*ratio),vec2(.12,.15*ratio)));
 col+=accent*exp(-arrow*350.)*detail*.7;
 float ready=.3+.7*smoothstep(.08,.30,assembly);
 col+=IVORY*label(s,vec2(.09,.09),.071,0,ratio)*ready*(1.-detail);
 col+=IVORY*.37*label(s,vec2(.09,.16),.035,8,ratio)*ready*(1.-detail);
 vec2 physical=s*vec2(1.04,2.28);
 float summary=smoothstep(.20,.50,assembly)*dashboard;
 col+=accent*ring(physical,vec2(.25,.29)*vec2(1.04,2.28),.165,.666+.334*complete,pixel)*summary*.8;
 float oldStatus=1.-smoothstep(.80,.92,complete),newStatus=smoothstep(.92,1.,complete);
 float count=label(s,vec2(.16,.271),.048,14,ratio)*oldStatus+label(s,vec2(.16,.271),.048,15,ratio)*newStatus;
 col+=IVORY*count*summary;
 col+=IVORY*.7*label(s,vec2(.48,.25),.048,1,ratio)*summary;
 col+=accent*.8*(label(s,vec2(.48,.305),.039,6,ratio)*oldStatus+label(s,vec2(.48,.305),.039,7,ratio)*newStatus)*summary;
 // The first and last tasks stay on the dashboard; the active middle card is shared with detail.
 for(int i=0;i<3;i++){
  if(i==1)continue;
  float y=.43+float(i)*.135;
  float appear=smoothstep(.35+float(i)*.09,.62+float(i)*.09,assembly)*dashboard;
  float card=rounded(s,vec2(.5,y+.055),vec2(.42,.055),.018,pixel);
  col=mix(col,background+accent*.045,card*appear);
  col+=IVORY*.75*label(s,vec2(.22,y+.025),.045,i+2,ratio)*appear;
  vec2 center=vec2(.15,(y+.055)*ratio);
  float check=line(vec2(s.x,s.y*ratio),center+vec2(-.016,0.),center+vec2(-.003,.014));
  check=min(check,line(vec2(s.x,s.y*ratio),center+vec2(-.003,.014),center+vec2(.025,-.018)));
  col+=accent*exp(-check*300.)*.7*appear;
 }
 float selected=smoothstep(.40,.72,assembly);
 vec2 top=mix(vec2(.08,.565),vec2(.08,.285),detail),size=mix(vec2(.84,.11),vec2(.84,.48),detail);
 float surface=rounded(s,top+size*.5,size*.5,.018,pixel);
 col=mix(col,background+accent*(.06+detail*.025),surface*selected);
 float border=abs(box(s-top-size*.5,size*.5,.018));
 col+=accent*exp(-border*600.)*.18*selected;
 vec2 heading=mix(vec2(.22,.59),vec2(.15,.335),detail);
 col+=IVORY*label(s,heading,mix(.045,.056,detail),3,ratio)*selected;
 float icon=1.-smoothstep(pixel,pixel*2.,abs(length((s-vec2(.15,.62))*vec2(1.,ratio))-.022));
 col+=accent*icon*(.6-complete*.4)*(1.-detail)*selected;
 vec2 checkCenter=vec2(.15,.62*ratio),cp=vec2(s.x,s.y*ratio);
 float check=min(line(cp,checkCenter+vec2(-.014,0.),checkCenter+vec2(-.002,.012)),line(cp,checkCenter+vec2(-.002,.012),checkCenter+vec2(.022,-.016)));
 col+=accent*exp(-check*350.)*.7*complete*(1.-detail)*selected;
 col+=IVORY*.8*label(s,vec2(.15,.425),.037,8,ratio)*detail;
 float bar=rounded(s,vec2(.5,.573),vec2(.35,.006),.006,pixel);
 col+=accent*bar*.12*detail;
 float fill=rounded(s,vec2(.15+.35*(.12+.88*complete),.573),vec2(.35*(.12+.88*complete),.006),.006,pixel);
 col+=accent*fill*.75*detail;
 col+=accent*(label(s,vec2(.15,.62),.046,6,ratio)*oldStatus+label(s,vec2(.15,.62),.046,7,ratio)*newStatus)*detail;
 // Three restrained navigation glyphs, tied to the final polish stage.
 for(int i=0;i<3;i++){
  vec2 p=vec2(s.x,s.y*ratio),c=vec2(.23+float(i)*.27,.905*ratio);
  float d=i==0?abs(box(p-c,vec2(.025),.006)):i==1?abs(length(p-c)-.027):min(line(p,c+vec2(-.025,-.02),c+vec2(.025,-.02)),line(p,c+vec2(-.025,.02),c+vec2(.025,.02)));
  col+=accent*exp(-d*330.)*(i==0?.65:.25)*smoothstep(.4,.8,assembly);
 }
 col+=accent*.05*exp(-pow((s.x-.5)*8.,2.))*timelineB.z*step(.86,s.y);
 return col;
}
vec3 phoneSurface(vec2 p){
 float pixel=max(.0007,length(fwidth(p))*.65);
 float body=box(p,vec2(.56,1.18),.125),screen=box(p,vec2(.521,1.14),.092);
 float bevel=clamp((body-screen)/.045,0.,1.);
 float light=.35+.65*smoothstep(-1.1,.8,p.x*.7+p.y*.55+inspection.y*.5);
 vec3 col=vec3(.085,.105,.095)+IVORY*light*.15;
 col+=mix(accent,IVORY,.6)*exp(-abs(body)*150.)*.6;
 col+=accent*exp(-abs(screen)*120.)*.12;
 if(screen<0.){
  vec2 s=vec2(p.x,-p.y)/vec2(1.042,2.28)+.5;
  col=application(s,pixel);
  float reflection=exp(-pow((s.x*.8+s.y*.3-.19-sin(sceneTime*.18)*.10)*10.,2.));
  col+=IVORY*reflection*.028;
  col=mix(col,vec3(.004),rounded(p,vec2(0.,1.045),vec2(.13,.026),.024,pixel));
  col+=IVORY*.34*rounded(p,vec2(0.,-1.078),vec2(.13,.0025),.002,pixel);
  col+=IVORY*.35*rounded(p,vec2(-.35,1.02),vec2(.055,.002),.002,pixel);
  col+=IVORY*.35*rounded(p,vec2(.35,1.02),vec2(.04,.002),.002,pixel);
 }
 return col;
}
vec2 curve(vec2 a,vec2 b,float t){vec2 control=(a+b)*.5+vec2(0.,.15);return mix(mix(a,control,t),mix(control,b,t),t);}
void main(){
 vec2 uv=(gl_FragCoord.xy-viewportOrigin)/resolution;
 float aspect=resolution.x/resolution.y;bool portrait=aspect<1.35;
 float compositionScale=portrait?1.:min(1.,aspect/2.);
 vec2 p=(uv*2.-1.)*vec2(aspect,1.)/compositionScale;
 vec3 col=background;
 col+=accent*exp(-dot(p-vec2(portrait?0.:.9,.1),p-vec2(portrait?0.:.9,.1))*.65)*.026;
 vec3 editorCenter=portrait?vec3(0.,-.87,-.1):vec3(-1.02,.035,-.12);
 vec2 editorHalf=portrait?vec2(aspect/.72*.88,.35):vec2(1.47,.92);
 float deviceScale=portrait?min(.7,.58+aspect*.18):1.;
 vec3 phoneCenter=portrait?vec3(0.,.47,.12):vec3(1.56,.015,.15);
 vec3 editorPoint=plane(p,editorCenter,editorRotation);
 vec3 phonePoint=plane(p,phoneCenter,phoneRotation)/deviceScale;
 float editorDistance=box(editorPoint.xy,editorHalf,.035),phoneDistance=box(phonePoint.xy,vec2(.56,1.18),.125);
 float pixel=max(.0008,1.3/resolution.y);
 // Contact shadows, low-volume light and physically offset device edge.
 col-=vec3(.015)*exp(-max(0.,box(editorPoint.xy-vec2(.03,-.06),editorHalf,.05))*12.);
 col+=accent*exp(-abs(phoneDistance)*12.)*.012;
 vec3 behind=plane(p,phoneCenter-vec3(.025,.015,.07),phoneRotation)/deviceScale;
 float side=box(behind.xy,vec2(.56,1.18),.125);
 col=mix(col,vec3(.07,.09,.08),coverage(side,pixel));
 if(editorDistance<pixel){col=mix(col,editorSurface(editorPoint.xy,editorHalf,portrait),coverage(editorDistance,pixel));}
 // The transfer follows the active editor group and its matching app component.
 vec3 source=editorCenter+editorRotation*vec3(editorHalf.x,.05-editorHalf.y*.15*codeState.y,0.);
 float targetY=codeState.y<.5?.5:codeState.y<1.5?-.1:-.9;
 vec3 destination=phoneCenter+phoneRotation*vec3((portrait?.52:-.52)*deviceScale,targetY*deviceScale,0.);
 vec2 a=project(source),b=project(destination);
 float wire=10.;vec2 previous=a;
 for(int i=1;i<=5;i++){vec2 next=curve(a,b,float(i)/5.);wire=min(wire,line(p,previous,next));previous=next;}
 col+=accent*exp(-wire*120.)*.045;
 float signal=inspection.z<.9?inspection.z/.9:timelineB.y;
 if(signal>=0.&&signal<=1.){
  vec2 light=curve(a,b,signal);float d=length(p-light),envelope=sin(signal*3.14159);
  col+=mix(accent,IVORY,.6)*exp(-d*d*1800.)*envelope*.65;
  col+=accent*exp(-d*d*130.)*envelope*.12;
 }
 if(phoneDistance<pixel){col=mix(col,phoneSurface(phonePoint.xy),coverage(phoneDistance,pixel));}
 color=vec4(max(col,background*.75),1.);
}
