#version 300 es
precision highp float;
in vec2 local;
in float alpha;
in float seed;
uniform vec3 accent;
uniform float visibility;
out vec4 color;
void main(){
 float core=exp(-dot(local,local)*25.);
 float halo=exp(-dot(local,local)*5.);
 vec3 tint=mix(accent,vec3(.92,1.,.96),.45);
 color=vec4(tint,(core*.9+halo*.2)*alpha*visibility);
}
