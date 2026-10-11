import test from "node:test";
import assert from "node:assert/strict";
import { issueRecoveryResponse, redeemRecoveryIdentity } from "../lib/recovery-service";
import { newRecoveryCode, recoveryDigest } from "../lib/recovery";
const participantId = "00000000-0000-4000-8000-000000000001";
const poolId = "00000000-0000-4000-8000-000000000002";
const body = { participantId, poolId, identityVerified: true };
const request = (value: unknown = body) => new Request("https://pool.example/api/admin/recovery", { method: "POST", body: JSON.stringify(value) });

test("issuance requires authorization, exact identity confirmation and an available durable budget", async () => {
  let writes = 0;
  const deps = { allow: async () => true, rpc: async () => { writes++; return { error: null }; } };
  const unauthorized = await issueRecoveryResponse(request(), async () => false, deps);
  assert.equal(unauthorized.status, 401);
  for (const value of [{...body,identityVerified:false},{...body,identityVerified:"true"},{...body,poolId:"invalid"},null]) {
    const response = await issueRecoveryResponse(request(value), async () => true, deps);
    assert.equal(response.status,400); assert.equal(response.headers.get("cache-control"),"no-store");
  }
  assert.equal((await issueRecoveryResponse(request(), async () => true, {...deps,allow:async () => false})).status,429);
  assert.equal(writes,0);
});

test("issuance exposes a code only to the authenticated response, hashes database input and never caches errors", async () => {
  let stored: Record<string,string> = {};
  const response = await issueRecoveryResponse(request(),async () => true,{
    allow:async scope => {assert.equal(scope,"recovery-issue");return true;},
    rpc:async (name,args) => {assert.equal(name,"issue_participant_recovery");stored=args;return {error:null};},
  });
  assert.equal(response.status,200); assert.equal(response.headers.get("cache-control"),"no-store");
  const result=await response.json();
  assert.match(result.code,/^[A-Za-z0-9_-]{43}$/); assert.equal(result.expiresInMinutes,30);
  assert.deepEqual(stored,{p_participant_id:participantId,p_pool_id:poolId,p_token_digest:recoveryDigest(result.code)});
  for (const rpc of [async () => ({error:{message:"private database detail"}}),async () => {throw new Error("private database detail");}]) {
    const failed=await issueRecoveryResponse(request(),async () => true,{allow:async () => true,rpc});
    assert.equal(failed.headers.get("cache-control"),"no-store");
    assert.equal((await failed.text()).includes("private database detail"),false);
  }
});

test("redemption fails generically and before consuming codes when signing configuration or the budget is unavailable", async () => {
  let writes=0;
  const code=newRecoveryCode();
  const deps={allow:async () => true,rpc:async () => {writes++;return {data:[],error:null};}};
  delete process.env.SESSION_SECRET;
  assert.equal(await redeemRecoveryIdentity(code,deps),null);
  process.env.SESSION_SECRET="synthetic-handler-session-secret-at-least-32";
  assert.equal(await redeemRecoveryIdentity(code,{...deps,allow:async () => false}),null);
  assert.equal(await redeemRecoveryIdentity("bad",deps),null); assert.equal(writes,0);
  for (const data of [null,{},[],[{participant_id:"bad"}], [{participant_id:participantId,pool_id:poolId,session_version:-1}]]) {
    assert.equal(await redeemRecoveryIdentity(code,{...deps,rpc:async () => ({data,error:null})}),null);
  }
  assert.equal(await redeemRecoveryIdentity(code,{...deps,rpc:async () => {throw new Error("private detail");}}),null);
  const member=await redeemRecoveryIdentity(code,{allow:async scope => {assert.equal(scope,"recovery");return true;},
    rpc:async (name,args) => {assert.equal(name,"redeem_participant_recovery");assert.deepEqual(args,{p_token_digest:recoveryDigest(code)});
      return {data:[{participant_id:participantId,pool_id:poolId,session_version:3,display_name:"x".repeat(3000)}],error:null};}});
  assert.deepEqual(member,{participantId,poolId,sessionVersion:3});
});
