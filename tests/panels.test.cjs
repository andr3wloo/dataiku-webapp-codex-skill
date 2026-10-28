const {test}=require('node:test');
const assert=require('node:assert/strict');
const {clampWidths}=require('../assets/starter/app.js');
test('paired panels retain usable center space and clamp oversized widths',()=>{
  for(const width of [1000,1100,1365,1920]){
    for(const left of [0,100,248,1000])for(const right of [0,100,320,1000]){
      const result=clampWidths(width,left,right,360);
      assert.ok(result.left+result.right<=width-360);
      assert.ok(!left||result.left>=200);assert.ok(!right||result.right>=280);
      assert.ok(result.left<=400&&result.right<=520);
    }
  }
});
