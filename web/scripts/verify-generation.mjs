import fs from "node:fs";
const base='http://localhost:3000';
const login=await fetch(base+'/api/auth/demo',{method:'POST'}); const cookie=login.headers.get('set-cookie').split(';')[0];
const headers={'Content-Type':'application/json',Cookie:cookie};
const created=await fetch(base+'/api/campaigns',{method:'POST',headers,body:JSON.stringify({name:'DeepSeek · 秋日茶席（AI 示例配图）',image:'data:image/png;base64,'+fs.readFileSync('public/demo/tea-editorial.png').toString('base64'),type:'new_product',goal:'to_store',productName:'秋日双人茶点',productDetail:'两杯龙井冷萃与一份桂花糕，适合两位朋友的午后茶歇。',price:68,startDate:'2026-10-21',endDate:'2026-11-21',channels:['xiaohongshu','moments','douyin'],category:'下午茶',offer:'双人茶点套餐',intent:'自然、温暖，吸引附近的年轻人到店'})});
const campaign=await created.json(); if(!created.ok)throw Error(JSON.stringify(campaign));
console.log('campaign',campaign.id);
const result=await fetch(base+`/api/campaigns/${campaign.id}/generate`,{method:'POST',headers,body:'{}'});const data=await result.json();
console.log(JSON.stringify({status:result.status,model:data.model,error:data.error,channels:data.campaign?.contents.map(c=>({channel:c.channel,title:c.title})),url:base+`/campaigns/view?id=${campaign.id}`},null,2));
