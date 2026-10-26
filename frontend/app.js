'use strict';
const reduced=matchMedia('(prefers-reduced-motion: reduce)'),finePointer=matchMedia('(hover: hover) and (pointer: fine)');
let paused=reduced.matches;
const motionButton=document.getElementById('motion-toggle');
function setMotion(value){paused=value;document.body.classList.toggle('motion-paused',paused);motionButton.setAttribute('aria-pressed',String(paused));motionButton.textContent=paused?'Enable animations':'Pause animations';if(paused)document.querySelectorAll('.magnetic,.tilt').forEach(el=>el.style.transform='');}
setMotion(paused);motionButton.addEventListener('click',()=>setMotion(!paused));reduced.addEventListener('change',e=>setMotion(e.matches));setTimeout(()=>document.querySelector('.loader')?.remove(),1900);
const menu=document.querySelector('.menu-button'),nav=document.getElementById('nav');
function closeMenu(){nav.classList.remove('open');menu.setAttribute('aria-expanded','false');}
menu.addEventListener('click',()=>{const open=nav.classList.toggle('open');menu.setAttribute('aria-expanded',String(open));});nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',closeMenu));document.addEventListener('keydown',e=>{if(e.key==='Escape'&&nav.classList.contains('open')){closeMenu();menu.focus();}});document.addEventListener('click',e=>{if(!e.target.closest('header'))closeMenu();});
if('IntersectionObserver' in window){document.documentElement.classList.add('js-motion');const reveals=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('visible');reveals.unobserve(entry.target);}}),{threshold:.08});document.querySelectorAll('.reveal').forEach(el=>reveals.observe(el));const stats=new IntersectionObserver(entries=>entries.forEach(entry=>{if(!entry.isIntersecting)return;stats.unobserve(entry.target);if(paused)return;const start=performance.now(),counters=entry.target.querySelectorAll('[data-count]');function tick(now){const t=paused?1:Math.min((now-start)/1100,1);counters.forEach(el=>el.textContent=Math.round(Number(el.dataset.count)*(1-Math.pow(1-t,3))));if(t<1)requestAnimationFrame(tick);}requestAnimationFrame(tick);}),{threshold:.4});stats.observe(document.querySelector('.stats'));const sections=new IntersectionObserver(entries=>entries.forEach(entry=>{if(!entry.isIntersecting)return;nav.querySelectorAll('a:not(.button)').forEach(a=>{if(a.getAttribute('href')==='#'+entry.target.id)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});}),{rootMargin:'-15% 0px -55% 0px',threshold:0});document.querySelectorAll('main>section[id]').forEach(el=>sections.observe(el));}
let pending=false;function updateScroll(){const max=document.documentElement.scrollHeight-innerHeight;document.querySelector('.scroll-progress').style.width=(max>0?scrollY/max*100:0)+'%';pending=false;}addEventListener('scroll',()=>{if(!pending){requestAnimationFrame(updateScroll);pending=true;}},{passive:true});updateScroll();document.querySelectorAll('.magnetic,.tilt').forEach(el=>{el.addEventListener('pointermove',e=>{if(paused||!finePointer.matches)return;const r=el.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;el.style.transform=el.classList.contains('tilt')?`perspective(1200px) rotateX(${-y*3}deg) rotateY(${x*3}deg)`:`translate(${x*7}px,${y*7}px)`;});el.addEventListener('pointerleave',()=>el.style.transform='');el.addEventListener('focusout',()=>el.style.transform='');});document.querySelectorAll('img').forEach(img=>img.addEventListener('error',()=>{img.classList.add('image-failed');img.parentElement.style.backgroundColor='#d8ddc9';}));
const now=new Date(),parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now),part=t=>parts.find(p=>p.type===t).value;
const today=`${part('year')}-${part('month')}-${part('day')}`;
const dateInput=document.getElementById('date');dateInput.min=today;
const latest=new Date(today+'T00:00:00Z');latest.setUTCFullYear(latest.getUTCFullYear()+1);dateInput.max=latest.toISOString().slice(0,10);
document.getElementById('year').textContent=now.getFullYear();
const form=document.getElementById('appointment-form'),status=document.getElementById('form-status'),ready=document.getElementById('whatsapp-ready'),submit=form.querySelector('button[type="submit"]');
let requestKey=crypto.randomUUID(),submitting=false,submitted=false;
form.addEventListener('input',()=>{if(submitting)return;requestKey=crypto.randomUUID();submitted=false;submit.disabled=false;ready.hidden=true;ready.removeAttribute('href');status.textContent='';});
form.addEventListener('submit',e=>{
e.preventDefault();const name=document.getElementById('name');name.setCustomValidity(name.value.trim()?'':'Please enter your name.');if(!form.reportValidity())return;
const data=new FormData(form);ready.href='https://wa.me/919821816677?text='+encodeURIComponent('Hello Ayushman Ayurvedic Center, I would like to enquire about an appointment.\nName: '+String(data.get('name')).trim()+'\nPhone: '+data.get('phone')+'\nService: '+data.get('service')+'\nPreferred date: '+(data.get('date')||'Please advise'));
ready.hidden=false;ready.textContent='Review & send on WhatsApp ↗';status.textContent='Your message is ready. Open WhatsApp below to review and send it to the clinic. Your appointment is confirmed only after the clinic replies.';ready.focus();
});
document.getElementById('name').addEventListener('input',e=>e.target.setCustomValidity(''));
document.getElementById('load-map').addEventListener('click',()=>{const iframe=document.createElement('iframe');iframe.title='Google Map of Ganjam Street, Kakinada; use directions for the clinic address';iframe.src='https://maps.google.com/maps?q='+encodeURIComponent('D. No. 25-6-24, Ganjam Street, Kakinada, Andhra Pradesh')+'&z=16&output=embed';iframe.loading='lazy';iframe.referrerPolicy='no-referrer-when-downgrade';iframe.allowFullscreen=true;document.getElementById('map-shell').replaceChildren(iframe);iframe.focus();});

let slideIndex=0,slideshowPaused=false;
const slides=[...document.querySelectorAll('.slide')],dots=[...document.querySelectorAll('.dots button')];
function showSlide(i){slideIndex=(i+slides.length)%slides.length;slides.forEach((s,n)=>{s.classList.toggle('active',n===slideIndex);s.setAttribute('aria-hidden',String(n!==slideIndex));});dots.forEach((d,n)=>{d.classList.toggle('active',n===slideIndex);d.setAttribute('aria-pressed',String(n===slideIndex));});document.querySelector('.slide-count').textContent=String(slideIndex+1).padStart(2,'0')+' / 03';}
document.getElementById('slide-prev').onclick=()=>showSlide(slideIndex-1);
document.getElementById('slide-next').onclick=()=>showSlide(slideIndex+1);
dots.forEach((d,i)=>d.onclick=()=>showSlide(i));
const pauseControl=document.getElementById('carousel-pause');
pauseControl.onclick=()=>{slideshowPaused=!slideshowPaused;pauseControl.textContent=slideshowPaused?'▶':'Ⅱ';pauseControl.setAttribute('aria-label',slideshowPaused?'Play slideshow':'Pause slideshow');};
setInterval(()=>{if(!paused&&!slideshowPaused&&!document.hidden&&!document.querySelector('.carousel').matches(':hover,:focus-within'))showSlide(slideIndex+1);},5500);showSlide(0);
const lightbox=document.getElementById('lightbox');
const galleryItems=[...document.querySelectorAll('.gallery-item')];let galleryIndex=0;
function showGalleryImage(index){galleryIndex=(index+galleryItems.length)%galleryItems.length;const item=galleryItems[galleryIndex],img=item.querySelector('img');lightbox.querySelector('img').src=item.dataset.full;lightbox.querySelector('img').alt=img.alt;lightbox.querySelector('p').textContent=item.dataset.caption;document.getElementById('lightbox-count').textContent=(galleryIndex+1)+' / '+galleryItems.length;}
galleryItems.forEach((item,index)=>item.onclick=()=>{showGalleryImage(index);lightbox.showModal();});
document.getElementById('lightbox-close').onclick=()=>lightbox.close();
document.getElementById('lightbox-prev').onclick=()=>showGalleryImage(galleryIndex-1);
document.getElementById('lightbox-next').onclick=()=>showGalleryImage(galleryIndex+1);
lightbox.addEventListener('keydown',e=>{if(e.key==='ArrowRight'){e.preventDefault();showGalleryImage(galleryIndex+1);}if(e.key==='ArrowLeft'){e.preventDefault();showGalleryImage(galleryIndex-1);}});
lightbox.addEventListener('click',e=>{if(e.target===lightbox){const r=lightbox.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)lightbox.close();}});

const heroVideo=document.getElementById('hero-video');
function syncHeroVideo(){if(!heroVideo)return;if(paused||document.hidden)heroVideo.pause();else if(heroVideo.currentSrc)heroVideo.play().catch(()=>{});}
motionButton.addEventListener('click',syncHeroVideo);reduced.addEventListener('change',syncHeroVideo);document.addEventListener('visibilitychange',syncHeroVideo);syncHeroVideo();

// Locally served GSAP: motion preferences and the page's pause control are respected.
let scrollMotion;
function configureScrollMotion(){
 if(!window.gsap||!window.ScrollTrigger)return;
 if(scrollMotion){scrollMotion.revert();scrollMotion=null;}
 document.documentElement.classList.add('gsap-ready');
 if(paused)return;
 gsap.registerPlugin(ScrollTrigger);
 scrollMotion=gsap.context(()=>{
  gsap.fromTo('.hero-content > *',{autoAlpha:0,y:20},{autoAlpha:1,y:0,duration:.85,stagger:.10,ease:'power3.out',delay:.12});
  document.querySelectorAll('.reveal,.gallery-item').forEach(el=>{
   gsap.fromTo(el,{autoAlpha:0,y:28},{autoAlpha:1,y:0,duration:.75,ease:'power3.out',scrollTrigger:{trigger:el,start:'top 92%',once:true}});
  });
 });
}
motionButton.addEventListener('click',configureScrollMotion);
reduced.addEventListener('change',configureScrollMotion);
configureScrollMotion();
const glassHeader=document.querySelector('header');
function updateGlassHeader(){glassHeader.classList.toggle('is-scrolled',window.scrollY>40);}
window.addEventListener('scroll',updateGlassHeader,{passive:true});updateGlassHeader();
