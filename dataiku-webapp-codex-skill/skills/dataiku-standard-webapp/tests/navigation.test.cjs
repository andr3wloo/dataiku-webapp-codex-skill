const {test}=require('node:test');
const assert=require('node:assert/strict');
const {parseFragment,bind}=require('../assets/starter/navigation.js');
const pages={overview:['metrics','queue'],details:['trace','evidence']};
function harness(hash=''){
 const events={},windowEvents={},routes=[];
 const win={location:{hash},addEventListener:(k,fn)=>windowEvents[k]=fn,removeEventListener:k=>delete windowEvents[k]};
 const local={focus:()=>local.focused=true,scrollIntoView:()=>local.scrolled=true};
 const doc={defaultView:win,contains:()=>true,getElementById:id=>id==='main'?local:null,
 addEventListener:(k,fn)=>events[k]=fn,removeEventListener:k=>delete events[k]};
 const controller=bind({document:doc,pages,defaultPage:'overview',onRoute:route=>routes.push(route)});
 function click(fragment){const event={button:0,preventDefault(){this.prevented=true},stopPropagation(){this.stopped=true},
 target:{closest:()=>({getAttribute:()=>fragment,get href(){throw new Error('Must not resolve against DSS base URL')}})}};events.click(event);return event}
 return {win,routes,events,windowEvents,click,controller,local};
}
test('fragment catalog validates initial, unknown, malformed, and subsection routes',()=>{
 assert.deepEqual(parseFragment('#details/evidence',pages,'overview'),{page:'details',section:'evidence'});
 for(const hash of ['#outside/evidence','#details/nope','#details/trace/extra']){
 const p=parseFragment(hash,pages,'overview');assert.equal(p.section,null);
 }
 assert.equal(parseFragment('#outside',pages,'overview').page,'overview');
});
test('DSS base URL cannot redirect known fragment links; browser history and repeat route',()=>{
 const h=harness('#overview');assert.equal(h.routes[0].reason,'initial');
 const click=h.click('#details/evidence');assert.equal(click.prevented,true);assert.equal(click.stopped,true);
 assert.equal(h.win.location.hash,'#details/evidence');h.windowEvents.hashchange();
 assert.deepEqual(h.routes.at(-1),{page:'details',section:'evidence',reason:'history'});
 h.click('#details/evidence');assert.equal(h.routes.at(-1).reason,'repeat');
 h.win.location.hash='#overview/queue';h.windowEvents.hashchange();assert.equal(h.routes.at(-1).section,'queue');
 h.controller.destroy();assert.deepEqual(h.events,{});assert.deepEqual(h.windowEvents,{});
});
test('local skip target works without base navigation or changing the current page route',()=>{
 const h=harness('#details');const event=h.click('#main');assert.equal(event.prevented,true);
 assert.equal(h.local.focused,true);assert.equal(h.local.scrolled,true);assert.equal(h.win.location.hash,'#details');
 assert.equal(h.click('https://example.com/').prevented,undefined);
});
