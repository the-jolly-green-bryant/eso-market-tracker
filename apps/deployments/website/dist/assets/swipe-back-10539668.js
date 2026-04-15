import{c as D}from"./index-41927c0c.js";import{createGesture as M}from"./index2-0460b2e7.js";/*!
 * (C) Ionic http://ionicframework.com - MIT License
 */const m=e=>e&&e.dir!==""?e.dir.toLowerCase()==="rtl":(document==null?void 0:document.dir.toLowerCase())==="rtl";/*!
 * (C) Ionic http://ionicframework.com - MIT License
 */const k=(e,h,g,p,w)=>{const c=e.ownerDocument.defaultView;let o=m(e);const f=t=>{const{startX:n}=t;return o?n>=c.innerWidth-50:n<=50},a=t=>o?-t.deltaX:t.deltaX,v=t=>o?-t.velocityX:t.velocityX;return M({el:e,gestureName:"goback-swipe",gesturePriority:40,threshold:10,canStart:t=>(o=m(e),f(t)&&h()),onStart:g,onMove:t=>{const n=a(t)/c.innerWidth;p(n)},onEnd:t=>{const r=a(t),n=c.innerWidth,s=r/n,i=v(t),X=n/2,d=i>=0&&(i>.2||r>X),u=(d?1-s:s)*n;let l=0;if(u>5){const y=u/Math.abs(i);l=Math.min(y,540)}w(d,s<=0?.01:D(0,s,.9999),l)}})};export{k as createSwipeBackGesture};
