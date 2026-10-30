#version 300 es
precision highp float;
out vec4 color;
uniform vec2 resolution;
uniform float time;
uniform float effectTime;
uniform mat3 objectMatrix;
uniform vec3 accent;
uniform vec3 background;
uniform vec2 pointer;
uniform float energy;
uniform float hold;
uniform vec3 ripple;
uniform float scroll;
uniform float entrance;
uniform float visibility;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float surface(vec3 world){
 vec3 p=objectMatrix*world;
 float theta=atan(p.z,p.x);
 float radius=.93+.045*sin(theta*3.+time*.16);
 vec2 q=vec2(length(p.xz)-radius,p.y+.025*sin(theta*2.+time*.15));
 return length(q)-(.29+.025*cos(theta*3.-time*.12));
}
vec3 environment(vec3 r){
 float key=pow(max(0.,dot(r,normalize(vec3(-.6,.75,1.)))),24.);
 float strip=pow(max(0.,dot(r,normalize(vec3(.8,.3,-.6)))),12.);
 float fill=pow(max(0.,dot(r,normalize(vec3(-.4,-.5,-.7)))),5.);
 return accent*.055+vec3(.94,.93,.85)*key*1.3+accent*strip*.7+vec3(.28,.33,.43)*fill*.25;
}
void main(){
 vec2 uv=gl_FragCoord.xy/resolution;float aspect=resolution.x/resolution.y;
 bool portrait=aspect<1.;
 vec2 p=(2.*gl_FragCoord.xy-resolution)/resolution.y;
 p-=vec2(portrait?.02:aspect*.25,portrait?.27:.12);
 p.y+=scroll*.1;p*=(portrait?1.8:1.)*(1.+min(scroll,1.4)*.12);
 vec3 origin=vec3(0,0,4.6),ray=normalize(vec3(p,-2.6)),point=origin;
 float travel=0.,nearest=1.;bool hit=false;
 float b=dot(origin,ray),disc=b*b-(dot(origin,origin)-2.25);
 if(disc>=0.){
  float root=sqrt(disc);travel=max(0.,-b-root);float end=-b+root;
  for(int i=0;i<72;i++){
   point=origin+ray*travel;float distance=surface(point);nearest=min(nearest,abs(distance));
   if(distance<.0008){hit=true;break;}travel+=distance*.65;if(travel>end)break;
  }
 }
 vec3 result=background+accent*exp(-dot(p,p)*1.5)*.012;
 gl_FragDepth=1.;
 if(hit){
  gl_FragDepth=clamp((4.6-point.z)/12.,0.,1.);
  vec2 e=vec2(.0025,0.);
  vec3 n=normalize(vec3(surface(point+e.xyy)-surface(point-e.xyy),surface(point+e.yxy)-surface(point-e.yxy),surface(point+e.yyx)-surface(point-e.yyx)));
  float facing=max(0.,dot(n,-ray)),fresnel=pow(1.-facing,3.);
  vec3 local=objectMatrix*point;
  float theta=atan(local.z,local.x),phi=atan(local.y,length(local.xz)-.93),t=effectTime;
  vec2 screenPoint=uv*2.-1.,brush=mix(pointer,ripple.xy,hold);
  vec2 brushDelta=(screenPoint-brush)*vec2(aspect,1.);
  float proximity=exp(-dot(brushDelta,brushDelta)*5.);
  float wave=exp(-pow((length((screenPoint-ripple.xy)*vec2(aspect,1.))-ripple.z*.65)*7.,2.))*exp(-ripple.z*1.4);
  float activity=clamp(energy*2.+hold*.55+wave*.7,0.,1.6);
  float field=sin(theta*2.+sin(phi*2.-t*.35)*1.15+t*.28)+sin(phi*3.-theta*1.-t*.22)*.48;
  float current=exp(-abs(field)*2.8),crest=exp(-field*field*55.);
  vec3 pearl=.5+.5*cos(vec3(.2,2.1,4.4)+facing*4.+field*.6+t*.08);
  float diffuse=max(0.,dot(n,normalize(vec3(-.5,.9,1.2))));
  vec3 metal=mix(accent*.23,pearl*.4,.18)*(.3+diffuse*.5)+environment(reflect(ray,n))*(.65+fresnel*.5);
  vec3 whiteMint=mix(accent,vec3(.9,1.,.95),.65);
  vec3 liquid=metal+accent*current*(.34+activity*.48)+whiteMint*crest*(.38+proximity*activity*.9);
  liquid+=pearl*pow(current,3.)*.085;
  result=liquid;
  result+=whiteMint*(proximity*hold*.16+wave*.23+energy*fresnel*.4);
 }else{
  // Analytic silhouette halo; the material and particle pass provide the bright cores.
  result+=accent*exp(-nearest*35.)*(.10+energy*.13);
 }
 vec2 cells=uv*vec2(aspect*10.,10.),d=abs(fract(cells)-.5);
 float mark=(1.-smoothstep(.004,.013,d.x))*step(d.y,.025)+(1.-smoothstep(.004,.013,d.y))*step(d.x,.025);
 result+=accent*mark*step(.9,hash(floor(cells)))*.025;
 result+=(hash(gl_FragCoord.xy)-.5)*.0015;
 result=mix(background,result,visibility*smoothstep(0.,.9,1.-entrance));
 color=vec4(result,1.);
}
