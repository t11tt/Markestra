import assert from "node:assert/strict";
import { PrismaClient } from "@prisma/client";
const db=new PrismaClient();
const email=`smoke-${Date.now()}@markestra.local`;
let cookie="";
async function api(path,method="GET",body) {
  const res=await fetch(`http://localhost:3000${path}`,{method,headers:{"Content-Type":"application/json",Cookie:cookie},body:body===undefined?undefined:JSON.stringify(body)});
  if(res.headers.get("set-cookie")) cookie=res.headers.get("set-cookie").split(";")[0];
  return {status:res.status,body:await res.json()};
}
try {
  assert.equal((await api("/api/auth/signup","POST",{email,password:"smoke-test-only",shopName:"库存验收临时店"})).status,201);
  const state=(await api("/api/state")).body;
  const product=(await api("/api/products","POST",{name:"库存验收商品",description:"临时测试",price:28,stock:3})).body;
  const orderBody={slug:state.shopSlug,customerName:"验收测试",phone:"12345678",fulfillment:"pickup",items:[{productId:product.id,qty:2}]};
  const results=await Promise.all([api("/api/shop/orders","POST",orderBody),api("/api/shop/orders","POST",orderBody)]);
  assert.equal(results.filter(r=>r.status===201).length,1,"only one concurrent order may reserve the last stock");
  let stock=await db.product.findUniqueOrThrow({where:{id:product.id}});assert.equal(stock.stock,1);
  const order=results.find(r=>r.status===201).body;
  const cancels=await Promise.all([api(`/api/orders/${order.id}`,"PATCH",{status:"cancelled"}),api(`/api/orders/${order.id}`,"PATCH",{status:"cancelled"})]);
  assert(cancels.some(r=>r.status===200));
  stock=await db.product.findUniqueOrThrow({where:{id:product.id}});assert.equal(stock.stock,3,"cancellation restores stock exactly once");
  assert.equal((await api(`/api/orders/${order.id}`,"PATCH",{status:"preparing"})).status,409);
  assert.equal((await api("/api/shop/orders","POST",{...orderBody,items:[{productId:product.id,qty:NaN}]})).status,400);
  assert.equal((await api(`/api/products/${product.id}`,"PATCH",{stock:-1})).status,400);
  const outsider=(await db.workspace.findFirst({where:{slug:"shiguang"},include:{products:true}})).products[0];
  assert.equal((await api(`/api/products/${outsider.id}`,"PATCH",{stock:0})).status,404);
  console.log("PASS: concurrent stock reservation, rollback, cancellation idempotence, terminal states, invalid quantities, stock validation, workspace isolation");
} finally {
  const user=await db.user.findUnique({where:{email}});
  if(user) await db.workspace.delete({where:{id:user.workspaceId}});
  await db.$disconnect();
}
