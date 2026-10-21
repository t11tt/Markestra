import assert from 'node:assert/strict';
import fs from 'node:fs';
const base='http://localhost:3000';
const login=await fetch(base+'/api/auth/demo',{method:'POST'});const cookie=login.headers.get('set-cookie').split(';')[0];
async function api(path,method='GET',body){const res=await fetch(base+path,{method,headers:{Cookie:cookie,'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});return {status:res.status,data:await res.json()};}
const ids=['mist-garden','ember-night','tropical-noon','citrus-breeze','butter-studio'];
const state=(await api('/api/state')).data;
let campaign=state.campaigns.find(c=>c.name==='五套背景 · 茶席演示（AI 配图）');
if(!campaign){const created=await api('/api/campaigns','POST',{name:'五套背景 · 茶席演示（AI 配图）',type:'new_product',goal:'to_store',productName:'双人茶点',productDetail:'两杯龙井冷萃与一份桂花糕。',price:68,startDate:'2026-10-21',endDate:'2026-11-21',channels:['xiaohongshu','moments','douyin'],category:'下午茶',offer:'双人茶点套餐',intent:'适合朋友小聚的温暖茶席',image:'data:image/png;base64,'+fs.readFileSync('public/demo/tea-editorial.png').toString('base64')});assert.equal(created.status,201);campaign=created.data;}
for(const id of ids){const res=await api(`/api/campaigns/${campaign.id}`,'PATCH',{posterStyle:id});assert.equal(res.status,200);assert.equal(res.data.posterStyle,id);const saved=(await api('/api/state')).data.campaigns.find(c=>c.id===campaign.id);assert.equal(saved.posterStyle,id);}
assert.equal((await api(`/api/campaigns/${campaign.id}`,'PATCH',{posterStyle:'../../invalid'})).status,400);
const first=await api(`/api/campaigns/${campaign.id}/generate`,'POST',{});assert.equal(first.status,200,first.data.error);assert(ids.includes(first.data.campaign.posterStyle));
const second=await api(`/api/campaigns/${campaign.id}/generate`,'POST',{channel:'xiaohongshu'});assert.equal(second.status,200,second.data.error);assert(ids.includes(second.data.campaign.posterStyle));assert.notEqual(first.data.campaign.posterStyle,second.data.campaign.posterStyle);
await api(`/api/campaigns/${campaign.id}`,'PATCH',{posterStyle:'mist-garden'});
console.log(JSON.stringify({result:'PASS: five templates save and reload; invalid style rejected; full and channel generation select different backgrounds',first:first.data.campaign.posterStyle,second:second.data.campaign.posterStyle,id:campaign.id,url:base+`/campaigns/view?id=${campaign.id}`},null,2));
