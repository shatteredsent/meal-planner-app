/** Cookbook sharing rules, tested against the deployed rules. */
const path = require('path');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');
initializeApp({ credential: cert(require(path.resolve('new-service-account.json'))) });
const db = getFirestore(); const auth = getAuth();

const PROJECT='family-meal-planner-b1421';
const API_KEY='AIzaSyB8tWZrDuDkyJs-gxMSuoeLIcwKjpuCNe4';
const BASE=`https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents`;
const NL=String.fromCharCode(10);
const A='ZZFAMA', B='ZZFAMB', C='ZZFAMC', CB='ZZCOOK';
let pass=0, fail=0;
function check(l,s,e){const ok=e==='allow'?s<300:s>=400;console.log(`  ${ok?'PASS':'FAIL'}  ${l}  (expected ${e}, http ${s})`);ok?pass++:fail++;}
async function tok(uid){const c=await auth.createCustomToken(uid);
  const r=await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${API_KEY}`,
   {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token:c,returnSecureToken:true})});
  return (await r.json()).idToken;}
const req=async(m,u,t,b)=>(await fetch(u,{method:m,headers:{Authorization:`Bearer ${t}`,'Content-Type':'application/json'},body:b?JSON.stringify(b):undefined})).status;
const strs=(...v)=>({arrayValue:{values:v.map(s=>({stringValue:s}))}});

(async()=>{
  for(const u of ['zz-a','zz-b','zz-c']) { try{await auth.createUser({uid:u});}catch{} }
  await db.collection('families').doc(A).set({name:'A',members:['zz-a'],cookbookId:CB});
  await db.collection('families').doc(B).set({name:'B',members:['zz-b'],cookbookId:CB});
  await db.collection('families').doc(C).set({name:'C',members:['zz-c']});
  await db.collection('users').doc('zz-a').set({familyId:A});
  await db.collection('users').doc('zz-b').set({familyId:B});
  await db.collection('users').doc('zz-c').set({familyId:C});
  await db.collection('cookbooks').doc(CB).set({name:'Shared',families:[A,B]});
  await db.collection('cookbooks').doc(CB).collection('recipes').doc('r1').set({name:'Adobo'});

  const a=await tok('zz-a'), b=await tok('zz-b'), c=await tok('zz-c');

  console.log(NL+'=== families ON the cookbook ===');
  check('A reads shared recipe', await req('GET',`${BASE}/cookbooks/${CB}/recipes/r1`,a),'allow');
  check('B reads shared recipe', await req('GET',`${BASE}/cookbooks/${CB}/recipes/r1`,b),'allow');
  check('B lists shared recipes', await req('GET',`${BASE}/cookbooks/${CB}/recipes`,b),'allow');
  check('B adds a recipe',       await req('PATCH',`${BASE}/cookbooks/${CB}/recipes/r2`,b,{fields:{name:{stringValue:'Jambalaya'}}}),'allow');
  check('A sees B’s recipe',     await req('GET',`${BASE}/cookbooks/${CB}/recipes/r2`,a),'allow');
  check('A deletes a recipe',    await req('DELETE',`${BASE}/cookbooks/${CB}/recipes/r2`,a),'allow');
  check('A reads cookbook doc',  await req('GET',`${BASE}/cookbooks/${CB}`,a),'allow');

  console.log(NL+'=== a family NOT on the cookbook ===');
  check('C reads shared recipe',  await req('GET',`${BASE}/cookbooks/${CB}/recipes/r1`,c),'deny');
  check('C lists shared recipes', await req('GET',`${BASE}/cookbooks/${CB}/recipes`,c),'deny');
  check('C writes a recipe',      await req('PATCH',`${BASE}/cookbooks/${CB}/recipes/evil`,c,{fields:{name:{stringValue:'x'}}}),'deny');
  check('C reads cookbook doc',   await req('GET',`${BASE}/cookbooks/${CB}`,c),'deny');
  check('C renames the cookbook', await req('PATCH',`${BASE}/cookbooks/${CB}?updateMask.fieldPaths=name`,c,{fields:{name:{stringValue:'Stolen'}}}),'deny');
  check('C deletes the cookbook', await req('DELETE',`${BASE}/cookbooks/${CB}`,c),'deny');

  console.log(NL+'=== the forged claim: users/{uid}.familyId is self-written ===');
  // C lies about which family they are in, naming a family that IS on the cookbook.
  await req('PATCH',`${BASE}/users/zz-c`,c,{fields:{familyId:{stringValue:A}}});
  check('C claims to be in family A', await req('GET',`${BASE}/users/zz-c`,c),'allow');
  check('  -> still cannot read the recipe', await req('GET',`${BASE}/cookbooks/${CB}/recipes/r1`,c),'deny');
  check('  -> still cannot read family A',   await req('GET',`${BASE}/families/${A}`,c),'deny');
  check('  -> still cannot write a recipe',  await req('PATCH',`${BASE}/cookbooks/${CB}/recipes/evil2`,c,{fields:{name:{stringValue:'x'}}}),'deny');
  await db.collection('users').doc('zz-c').set({familyId:C});

  console.log(NL+'=== joining by cookbook code ===');
  check('C appends only its own family', await req('PATCH',`${BASE}/cookbooks/${CB}?updateMask.fieldPaths=families`,c,{fields:{families:strs(A,B,C)}}),'allow');
  check('C now reads the recipe',        await req('GET',`${BASE}/cookbooks/${CB}/recipes/r1`,c),'allow');

  console.log(NL+'=== join clause cannot be abused ===');
  await db.collection('cookbooks').doc(CB).set({name:'Shared',families:[A,B]});
  check('C cannot add a family that is not its own', await req('PATCH',`${BASE}/cookbooks/${CB}?updateMask.fieldPaths=families`,c,{fields:{families:strs(A,B,'zz-someone-else')}}),'deny');
  check('C cannot drop existing families',           await req('PATCH',`${BASE}/cookbooks/${CB}?updateMask.fieldPaths=families`,c,{fields:{families:strs(C)}}),'deny');
  check('C cannot rename while joining',             await req('PATCH',`${BASE}/cookbooks/${CB}?updateMask.fieldPaths=families,name`,c,{fields:{families:strs(A,B,C),name:{stringValue:'Stolen'}}}),'deny');

  console.log(NL+'=== plans stay private even when the cookbook is shared ===');
  await db.collection('families').doc(A).collection('weeks').doc('w').set({meals:{}});
  check('B reads A’s week', await req('GET',`${BASE}/families/${A}/weeks/w`,b),'deny');
  check('B reads A’s family doc', await req('GET',`${BASE}/families/${A}`,b),'deny');

  for(const f of [A,B,C]){for(const s of ['weeks','recipes']){const d=await db.collection('families').doc(f).collection(s).get();for(const x of d.docs)await x.ref.delete();}await db.collection('families').doc(f).delete();}
  const rs=await db.collection('cookbooks').doc(CB).collection('recipes').get();for(const x of rs.docs)await x.ref.delete();
  await db.collection('cookbooks').doc(CB).delete();
  for(const u of ['zz-a','zz-b','zz-c']){await db.collection('users').doc(u).delete().catch(()=>{});await auth.deleteUser(u).catch(()=>{});}
  console.log(NL+`${pass} passed, ${fail} failed`);
  process.exit(fail?1:0);
})().catch(e=>{console.error(e);process.exit(1);});
