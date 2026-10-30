#version 300 es
precision highp float;
layout(location=0) in vec2 corner;
layout(location=1) in vec3 origin;
layout(location=2) in vec3 velocity;
layout(location=3) in vec4 life;
uniform float effectTime;
uniform vec2 resolution;
uniform float scroll;
out vec2 local;
out float alpha;
out float seed;
vec3 projectPoint(vec3 p){
 float aspect=resolution.x/resolution.y;bool portrait=aspect<1.;
 float zoom=(1.+min(scroll,1.4)*.12)*(portrait?1.8:1.);
 vec2 screen=p.xy*2.6/(4.6-p.z)/zoom;
 screen.y-=scroll*.1;screen+=vec2(portrait?.02:aspect*.25,portrait?.27:.12);
 return vec3(screen.x/aspect,screen.y,(4.6-p.z)/12.);
}
void main(){
 float age=effectTime-life.x;float t=clamp(age/life.y,0.,1.);
 vec3 p=origin+velocity*age+vec3(0.,.035*age*age,0.);
 vec3 projected=projectPoint(p),ahead=projectPoint(p+velocity*.08);
 vec2 direction=normalize((ahead.xy-projected.xy)*resolution+vec2(.00001));
 vec2 side=vec2(-direction.y,direction.x);
 float extent=(4.+life.z*300.)*(.65+.35*sin(life.w*10.));
 vec2 offset=(direction*corner.x+side*corner.y)*extent/resolution;
 gl_Position=vec4(projected.xy+offset,projected.z*2.-1.,1.);
 if(age<0.||age>life.y)gl_Position=vec4(3.,3.,3.,1.);
 local=corner;alpha=smoothstep(0.,.06,age)*(1.-smoothstep(.12,1.,t));seed=life.w;
}
