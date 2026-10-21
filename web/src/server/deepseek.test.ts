import assert from "node:assert/strict";
import { it } from "node:test";
import { callDeepSeek } from "./deepseek";

it("sends facts through the server API and parses JSON", async () => {
  process.env.DEEPSEEK_API_KEY = "unit-test-secret";
  const result = await callDeepSeek({price:28}, ["xiaohongshu"], async (url, init) => {
    assert.equal(url, "https://api.deepseek.com/chat/completions");
    assert.equal((init?.headers as Record<string,string>).Authorization,"Bearer unit-test-secret");
    const body=JSON.parse(String(init?.body));
    assert.equal(body.response_format.type,"json_object");
    assert.equal(JSON.parse(body.messages[1].content).facts.price,28);
    return Response.json({choices:[{message:{content:'{"contents":[]}'}}]});
  });
  assert.deepEqual(result,{contents:[]});
});

it("does not expose an upstream error body and does not silently use demo content", async () => {
  process.env.DEEPSEEK_API_KEY="unit-test-secret";
  await assert.rejects(callDeepSeek({},[],async()=>new Response("unit-test-secret",{status:401})), (error:Error)=>error.message.includes("401") && !error.message.includes("unit-test-secret"));
  await assert.rejects(callDeepSeek({},[],async()=>Response.json({choices:[{finish_reason:"length",message:{content:"{"}}]})),/输出不完整/);
});
