// The surrounding imagery is illustrated; these cross-reference arcs are real 3D geometry.
import * as THREE from './three.module.min.js';

export function mountJourney(root) {
  const canvas=root.querySelector('canvas'), reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  let renderer;
  try {renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'low-power'});} catch(_){root.classList.add('journey-fallback');return ()=>{};}
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.4));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.setClearColor(0,0);renderer.autoClear=false;
  const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(42,1,.1,100),arcs=new THREE.Group();scene.add(arcs);
  let disposed=false,visible=true,width=0,progress=root._journeyProgress||0,px=0,py=0,arcMaterial=null,frame=0,lastFrame=0;
  // Animated image patches: the original picture remains a fallback underneath.
  const loader=new THREE.TextureLoader(),textures=[];let texturesReady=0;
  const loadTexture=url=>{const texture=loader.load(url,()=>{texturesReady++;if(!disposed)draw()},undefined,()=>{});texture.colorSpace=THREE.SRGBColorSpace;textures.push(texture);return texture};
  const desktopOne=loadTexture('assets/desk-view.webp'),desktopTwo=loadTexture(document.documentElement.lang==='en'?'assets/desk-close-en.webp':'assets/desk-close-sq.webp'),portraitOne=loadTexture('assets/desk-portrait.webp'),portraitTwo=loadTexture(document.documentElement.lang==='en'?'assets/close-portrait-en.webp':'assets/close-portrait-sq.webp');
  const fxUniforms={imageOne:{value:desktopOne},imageTwo:{value:desktopTwo},size:{value:new THREE.Vector2(1,1)},time:{value:0},progress:{value:progress},mobile:{value:0}};
  const fxScene=new THREE.Scene(),fxCamera=new THREE.OrthographicCamera(-1,1,1,-1,0,1);
  const fxMaterial=new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:fxUniforms,
    vertexShader:`varying vec2 uv0;void main(){uv0=uv;gl_Position=vec4(position.xy,0.,1.);}`,
    fragmentShader:`
      uniform sampler2D imageOne,imageTwo;uniform vec2 size;uniform float time,progress,mobile;varying vec2 uv0;
      float window1(float x,float lo,float hi,float edge){return smoothstep(lo,lo+edge,x)*(1.-smoothstep(hi-edge,hi,x));}
      vec2 mapuv(float ratio,float zoom){vec2 uv=(uv0-.5)/zoom+.5;float viewRatio=size.x/size.y;
        float sx=min(1.,viewRatio/ratio),sy=min(1.,ratio/viewRatio);return (uv-.5)*vec2(sx,sy)+.5;}
      void main(){float w0=1.-smoothstep(.08,.29,progress);float w1=smoothstep(.08,.29,progress)*(1.-smoothstep(.42,.59,progress));
        vec2 a=mapuv(mobile>.5?2./3.:1.5,1.+min(progress,.34)*.32),b=mapuv(mobile>.5?2./3.:1376./768.,1.+clamp(progress-.25,0.,.28)*.28);
        float grass=mobile>.5?window1(a.y,.42,.53,.025)*window1(a.x,.0,.7,.06):window1(a.y,.40,.61,.08)*window1(a.x,.0,.80,.08),water=mobile>.5?window1(a.x,.80,.88,.02)*window1(a.y,.32,.63,.04):window1(a.x,.73,.80,.018)*window1(a.y,.48,.67,.035),sky=window1(a.y,.76,1.,.07);
        vec2 distorted=a;distorted.x+=grass*sin(time*1.7+a.x*65.+a.y*17.)*.004;distorted.y+=water*sin(time*2.7+a.y*55.)*.003;distorted.x+=sky*sin(time*.18+a.y*9.)*.0017;
        float closeGrass=0.;vec2 bd=b;bd.x+=closeGrass*sin(time*1.7+b.x*75.)*.002;
        float mask0=max(max(grass,water),sky)*w0,mask1=closeGrass*w1,alpha=max(mask0,mask1);
        if(alpha<.001||a.x<0.||a.x>1.||a.y<0.||a.y>1.)discard;
        vec4 col0=texture2D(imageOne,distorted),col1=texture2D(imageTwo,bd);vec3 color=mix(col0.rgb,col1.rgb,mask1/max(mask0+mask1,.001));
        gl_FragColor=vec4(color,alpha);
        #include <colorspace_fragment>
      }`});
  const fxGeometry=new THREE.PlaneGeometry(2,2),fxPlane=new THREE.Mesh(fxGeometry,fxMaterial);fxPlane.frustumCulled=false;fxScene.add(fxPlane);
  fetch('assets/crossref-visualization.json').then(r=>{if(!r.ok)throw Error('reference data');return r.json()}).then(data=>{
    if(disposed)return;const positions=[],colors=[];
    for(const [a,b] of data){if(!Number.isFinite(a)||!Number.isFinite(b))continue;const start=a*12-6,end=b*12-6,height=Math.max(.15,Math.abs(start-end)*.44),depth=(a-.5)*2.4,color=new THREE.Color().setHSL(.56+a*.32,.72,.68);
      const point=t=>[start+(end-start)*t,-1.7+Math.sin(Math.PI*t)*height,depth+Math.sin(Math.PI*t)*.4];
      for(let i=0;i<28;i++){positions.push(...point(i/28),...point((i+1)/28));colors.push(color.r,color.g,color.b,color.r,color.g,color.b)}
    }
    const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
    arcMaterial=new THREE.LineBasicMaterial({vertexColors:true,transparent:true,opacity:.5,depthWrite:false});arcs.add(new THREE.LineSegments(geometry,arcMaterial));draw();
  }).catch(()=>{});
  // Gentle drifting lights give the environment depth in every chapter.
  let seed=17;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
  const particles=[];for(let i=0;i<180;i++)particles.push(random()*2-1,random()*2-1,random());
  const dustGeometry=new THREE.BufferGeometry();dustGeometry.setAttribute('position',new THREE.Float32BufferAttribute(particles,3));
  const dustUniforms={time:{value:0},progress:{value:progress},scale:{value:Math.min(devicePixelRatio||1,1.4)}};
  const dustMaterial=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,uniforms:dustUniforms,
    vertexShader:`uniform float time,progress,scale;varying float glow;void main(){float t=time*.035;vec3 p=position;p.x+=sin(time*.35+p.z*31.)*.018;p.y=mod(p.y+t*(.14+p.z*.12)+1.,2.)-1.;gl_Position=vec4(p.xy,0.,1.);gl_PointSize=(1.2+p.z*2.4)*scale;glow=.18+.38*p.z;}`,
    fragmentShader:`uniform float progress;varying float glow;void main(){float radius=length(gl_PointCoord-vec2(.5));float a=(1.-smoothstep(.08,.5,radius))*glow;vec3 amber=vec3(1.,.70,.35),blue=vec3(.44,.72,1.);vec3 color=mix(amber,blue,smoothstep(.45,.62,progress)*(1.-smoothstep(.80,.96,progress)));gl_FragColor=vec4(color,a);}`});
  const dust=new THREE.Points(dustGeometry,dustMaterial);dust.frustumCulled=false;scene.add(dust);
  const resize=()=>{const r=canvas.getBoundingClientRect();if(!r.width||!r.height)return;width=r.width;renderer.setSize(r.width,r.height,false);fxUniforms.size.value.set(r.width,r.height);fxUniforms.mobile.value=r.width<=640?1:0;fxUniforms.imageOne.value=r.width<=640?portraitOne:desktopOne;fxUniforms.imageTwo.value=r.width<=640?portraitTwo:desktopTwo;camera.aspect=r.width/r.height;camera.updateProjectionMatrix()};
  const update=e=>{progress=e.detail;if(visible)draw()};
  const move=e=>{if(reduce)return;const r=root.getBoundingClientRect();px=(e.clientX-r.left)/Math.max(r.width,1)-.5;py=(e.clientY-r.top)/Math.max(r.height,1)-.5;if(visible)draw()};
  const draw=()=>{if(disposed||!width)return;const mobile=width<=640,arcOpacity=Math.max(0,Math.min(1,(progress-.43)*8,(.91-progress)*8));canvas.style.opacity='1';fxUniforms.progress.value=progress;fxUniforms.time.value=reduce?0:performance.now()*.001;renderer.clear();if(progress<.59&&texturesReady===4)renderer.render(fxScene,fxCamera);
    arcs.visible=arcOpacity>0;if(arcMaterial)arcMaterial.opacity=.5*arcOpacity;arcs.position.x=mobile?0:1.5;arcs.rotation.y=(progress-.65)*.75+px*.12+(reduce?0:Math.sin(performance.now()*.00025)*.025);arcs.rotation.x=py*.04;dustUniforms.progress.value=progress;dustUniforms.time.value=reduce?0:performance.now()*.001;camera.position.set(0,1.3,mobile?16:14-(progress-.5)*4);camera.lookAt(0,1,0);renderer.render(scene,camera)};
  const tick=time=>{if(disposed||!visible||reduce)return;if(!time||time-lastFrame>=33){draw();lastFrame=time||0}frame=requestAnimationFrame(tick)};
  const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible){resize();draw();if(!reduce){cancelAnimationFrame(frame);tick()}}else cancelAnimationFrame(frame)},{rootMargin:'150px'});observer.observe(root);
  const lose=event=>{event.preventDefault();root.classList.add('journey-fallback');visible=false;cancelAnimationFrame(frame)};canvas.addEventListener('webglcontextlost',lose);addEventListener('resize',resize);root.addEventListener('journeyprogress',update);root.addEventListener('pointermove',move,{passive:true});resize();draw();
  return ()=>{disposed=true;cancelAnimationFrame(frame);observer.disconnect();fxGeometry.dispose();fxMaterial.dispose();dustMaterial.dispose();textures.forEach(t=>t.dispose());removeEventListener('resize',resize);canvas.removeEventListener('webglcontextlost',lose);root.removeEventListener('journeyprogress',update);root.removeEventListener('pointermove',move);scene.traverse(o=>{if(o.geometry)o.geometry.dispose()});if(arcMaterial)arcMaterial.dispose();renderer.dispose()};
}
