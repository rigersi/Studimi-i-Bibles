// Gentle animated details for the illustrated journey.
import * as THREE from './three.module.min.js';

export function mountJourney(root) {
  const canvas=root.querySelector('canvas'), reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  let renderer;
  try {renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'low-power'});} catch(_){root.classList.add('journey-fallback');return ()=>{};}
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.4));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.setClearColor(0,0);renderer.autoClear=false;
  const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(42,1,.1,100);
  let disposed=false,visible=true,width=0,progress=root._journeyProgress||0,frame=0,lastFrame=0;
  // Gentle drifting lights give the environment depth in every chapter.
  let seed=17;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
  const particles=[];for(let i=0;i<180;i++)particles.push(random()*2-1,random()*2-1,random());
  const dustGeometry=new THREE.BufferGeometry();dustGeometry.setAttribute('position',new THREE.Float32BufferAttribute(particles,3));
  const dustUniforms={time:{value:0},progress:{value:progress},scale:{value:Math.min(devicePixelRatio||1,1.4)}};
  const dustMaterial=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,uniforms:dustUniforms,
    vertexShader:`uniform float time,progress,scale;varying float glow;void main(){float t=time*.035;vec3 p=position;p.x+=sin(time*.35+p.z*31.)*.018;p.y=mod(p.y+t*(.14+p.z*.12)+1.,2.)-1.;gl_Position=vec4(p.xy,0.,1.);gl_PointSize=(1.2+p.z*2.4)*scale;glow=.18+.38*p.z;}`,
    fragmentShader:`uniform float progress;varying float glow;void main(){float radius=length(gl_PointCoord-vec2(.5));float a=(1.-smoothstep(.08,.5,radius))*glow;vec3 amber=vec3(1.,.70,.35),blue=vec3(.44,.72,1.);vec3 color=mix(amber,blue,smoothstep(.45,.62,progress)*(1.-smoothstep(.80,.96,progress)));gl_FragColor=vec4(color,a);}`});
  const dust=new THREE.Points(dustGeometry,dustMaterial);dust.frustumCulled=false;scene.add(dust);
  const resize=()=>{const r=canvas.getBoundingClientRect();if(!r.width||!r.height)return;width=r.width;renderer.setSize(r.width,r.height,false);camera.aspect=r.width/r.height;camera.updateProjectionMatrix()};
  const update=e=>{progress=e.detail;if(visible)draw()};
  const draw=()=>{if(disposed||!width)return;renderer.clear();
    // Leave the cross-reference image unobstructed rather than drawing extra lines or particles over it.
    dust.visible=progress<.76;dustUniforms.progress.value=progress;dustUniforms.time.value=reduce?0:performance.now()*.001;camera.position.set(0,1.3,16);camera.lookAt(0,1,0);renderer.render(scene,camera)};
  const tick=time=>{if(disposed||!visible||reduce)return;if(!time||time-lastFrame>=33){draw();lastFrame=time||0}frame=requestAnimationFrame(tick)};
  const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible){resize();draw();if(!reduce){cancelAnimationFrame(frame);tick()}}else cancelAnimationFrame(frame)},{rootMargin:'150px'});observer.observe(root);
  const lose=event=>{event.preventDefault();root.classList.add('journey-fallback');visible=false;cancelAnimationFrame(frame)};canvas.addEventListener('webglcontextlost',lose);addEventListener('resize',resize);root.addEventListener('journeyprogress',update);resize();draw();
  return ()=>{disposed=true;cancelAnimationFrame(frame);observer.disconnect();dustMaterial.dispose();removeEventListener('resize',resize);canvas.removeEventListener('webglcontextlost',lose);root.removeEventListener('journeyprogress',update);scene.traverse(o=>{if(o.geometry)o.geometry.dispose()});renderer.dispose()};
}
