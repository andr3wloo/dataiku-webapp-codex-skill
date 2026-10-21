/* Opt-in paired-sidebar layout. Load before the shared starter app.js. */
(function(root){
  'use strict';
  function clampWidths(available,left,right,centerMin=360){
    const budget=Math.max(0,available-centerMin);
    let l=left ? Math.max(200,Math.min(400,left)):0;
    let r=right ? Math.max(280,Math.min(520,right)):0;
    if(l+r>budget){const extra=l+r-budget;const dl=Math.min(Math.max(0,l-200),extra);l-=dl;r=Math.max(right?280:0,r-(extra-dl));}
    return {left:l,right:r};
  }
  const api={clampWidths};
  if(typeof module!=='undefined'&&module.exports){module.exports=api;return;}
  api.mount=function({config,onAgentChange}){
    const $=id=>document.getElementById(id), app=$('standard-app'), workspace=$('workspace');
    const opts={filterWidth:248,agentWidth:320,centerMin:360,breakpoint:1000,...config.panels};
    const widths={left:opts.filterWidth,right:opts.agentWidth};
    let filters=true,agent=false,narrow=false,modal=null,drag=null;
    const panel=which=>$(which==='left'?'filter-panel':'agent-drawer');
    const trigger=which=>$(which==='left'?'filter-toggle':'agent-toggle');
    function sync(){
      const visible=clampWidths(workspace.clientWidth,filters?widths.left:0,agent?widths.right:0,opts.centerMin);
      app.style.setProperty('--filter-track',visible.left+'px');app.style.setProperty('--agent-track',visible.right+'px');
      for(const [which,open] of [['left',filters],['right',agent]]){
        const el=panel(which);el.hidden=!open;el.inert=!open;trigger(which).setAttribute('aria-expanded',String(open));
        const handle=$(which==='left'?'filter-resizer':'agent-resizer');
        const value=which==='left'?visible.left:visible.right;
        handle.setAttribute('aria-valuenow',String(Math.round(value)));
        const other=which==='left'?visible.right:visible.left;
        handle.setAttribute('aria-valuemax',String(Math.max(which==='left'?200:280,Math.min(which==='left'?400:520,workspace.clientWidth-opts.centerMin-other))));
        el.removeAttribute('role');el.removeAttribute('aria-modal');
      }
      modal=narrow?(agent?'right':filters?'left':null):null;
      if(modal){panel(modal).setAttribute('role','dialog');panel(modal).setAttribute('aria-modal','true');}
      $('dashboard').inert=Boolean(modal);app.querySelector('.toolbar').inert=Boolean(modal);app.querySelector('.masthead').inert=Boolean(modal);$('panel-scrim').hidden=!modal;
      onAgentChange(agent);
    }
    function setPanel(which,open,focus=true){
      if(which==='left')filters=open;else agent=open;
      if(narrow&&open){if(which==='left')agent=false;else filters=false;}
      sync();
      if(focus)(open?$(which==='left'?'filter-close':'agent-close'):trigger(which)).focus();
    }
    function responsive(){
      if(!app.clientWidth)return;
      const next=app.clientWidth<Math.max(opts.breakpoint,opts.centerMin+200+280+16);
      if(next!==narrow){const focused=panel('left').contains(document.activeElement)?'left':panel('right').contains(document.activeElement)?'right':null;narrow=next;app.classList.toggle('narrow',narrow);if(narrow){finish();filters=false;agent=false;}sync();if(focused&&!modal)trigger(focused).focus();}
      else sync();
    }
    function finish(event){
      if(!drag)return;
      const {handle,id}=drag;drag=null;app.classList.remove('resizing');
      if(handle.hasPointerCapture(id))handle.releasePointerCapture(id);
    }
    for(const which of ['left','right']){
      const handle=$(which==='left'?'filter-resizer':'agent-resizer');
      function resize(value){
        const other=which==='left'?(agent?widths.right:0):(filters?widths.left:0);
        const max=Math.max(which==='left'?200:280,Math.min(which==='left'?400:520,workspace.clientWidth-opts.centerMin-other));
        widths[which]=Math.max(which==='left'?200:280,Math.min(max,value));sync();
      }
      handle.onpointerdown=event=>{if(event.button!==0||narrow)return;event.preventDefault();drag={handle,id:event.pointerId,which,x:event.clientX,width:panel(which).getBoundingClientRect().width};handle.setPointerCapture(event.pointerId);app.classList.add('resizing');};
      handle.onpointermove=event=>{if(!drag||drag.handle!==handle||drag.id!==event.pointerId)return;resize(drag.width+(event.clientX-drag.x)*(which==='left'?1:-1));};
      handle.onpointerup=finish;handle.onpointercancel=finish;handle.onlostpointercapture=finish;
      handle.onkeydown=event=>{const step=event.shiftKey?40:10;const current=panel(which).getBoundingClientRect().width;let target;if(event.key==='ArrowLeft')target=current+(which==='left'?-step:step);if(event.key==='ArrowRight')target=current+(which==='left'?step:-step);if(event.key==='Home')target=which==='left'?200:280;if(event.key==='End')target=Number(handle.getAttribute('aria-valuemax'));if(target!==undefined){event.preventDefault();resize(target);}};
    }
    $('filter-toggle').onclick=()=>setPanel('left',!filters);$('filter-close').onclick=()=>setPanel('left',false);
    $('panel-scrim').onclick=()=>{if(modal)setPanel(modal,false);};
    document.addEventListener('keydown',event=>{
      if(event.key==='Escape'&&(modal||filters)&&!agent){event.preventDefault();setPanel(modal||'left',false);}
      if(event.key==='Tab'&&modal){const els=[...panel(modal).querySelectorAll('button:not([disabled]),select,textarea,a[href],[tabindex="0"]')].filter(el=>!el.hidden&&el.getClientRects().length);if(!els.length)return;const first=els[0],last=els[els.length-1];if(event.shiftKey&&(document.activeElement===first||!panel(modal).contains(document.activeElement))){event.preventDefault();last.focus();}else if(!event.shiftKey&&(document.activeElement===last||!panel(modal).contains(document.activeElement))){event.preventDefault();first.focus();}}
    });
    app.querySelector('.skip-link').onclick=event=>{event.preventDefault();if(!modal)$('dashboard').focus();};
    const observer=new ResizeObserver(responsive);observer.observe(app);responsive();
    if(config.agent.enabled&&opts.agentInitiallyOpen&&!narrow)setPanel('right',true,false);
    return {setAgent:open=>setPanel('right',open),destroy:()=>{finish();observer.disconnect();}};
  };
  root.StandardPanelLayout=api;
})(typeof window==='undefined'?globalThis:window);
