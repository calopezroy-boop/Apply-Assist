import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer,collectJobs,generateDraft} from '../server.mjs';
import {cleanUrl,mergeJobs,eligibility,validateBackup,draftPrompt} from '../public/core.js';

test('dedupe keeps user status/draft across sources and strips tracking',()=>{
 const a={id:'one',title:'Operations Assistant',company:'Acme',location:'Remote',url:'https://example.com/job/1?utm_source=linkedin',status:'Applied',intro:'My saved draft',source:'LinkedIn'};
 const b={title:'Operations Assistant',company:'ACME',location:'Remote',url:'https://other.com/listing/2',source:'Indeed'};
 const r=mergeJobs([a],[b]);assert.equal(r.jobs.length,1);assert.equal(r.duplicates,1);assert.equal(r.jobs[0].status,'Applied');assert.equal(r.jobs[0].intro,a.intro);assert.deepEqual(r.jobs[0].sources,['LinkedIn','Indeed']);
 assert.equal(cleanUrl('https://example.com/job/1?utm_campaign=x'),'https://example.com/job/1');
 assert.equal(cleanUrl('javascript:alert(1)'),'');assert.equal(cleanUrl('https://user:password@example.com'),'');
 const unknown=mergeJobs([],[{title:'VA',url:'https://a.com/1'},{title:'VA',url:'https://a.com/2'}]);assert.equal(unknown.jobs.length,2);
});
test('location flags never equate remote with Philippine eligibility',()=>{
 assert.ok(eligibility({description:'Remote, US residents only. Full-time.'}).includes('Location restriction'));
 assert.ok(eligibility({description:'Remote role'}).includes('PH eligibility unconfirmed'));
 assert.ok(eligibility({description:'Full-time remote Philippines'}).includes('PH / global mentioned'));
});
test('backup validation rejects malformed input and unsafe URLs',()=>{
 assert.throws(()=>validateBackup({version:1,resume:[],jobs:[]}));
 assert.throws(()=>validateBackup({version:1,resume:'ok',jobs:[{}]}));
 const r=validateBackup({version:1,resume:'ok',jobs:[{title:'VA',url:'javascript:alert(1)',status:'hacked'}]});assert.equal(r.jobs[0].url,'');assert.equal(r.jobs[0].status,'New');
});
test('search normalizes structured and indexed results and reports partial failures',async()=>{
 const fetcher=async url=>{const u=new URL(url);if(u.searchParams.get('engine')==='google_jobs')return {ok:true,json:async()=>({jobs_results:[{title:'Operations VA',company_name:'Acme',description:'Full-time Philippines',apply_options:[{link:'https://example.com/job/1'}],detected_extensions:{salary:'$800/month',posted_at:'1 day ago'}}]})};if(u.searchParams.get('q').includes('linkedin'))return {ok:false,status:429};return {ok:true,json:async()=>({organic_results:[{title:'Order Assistant',link:'https://www.onlinejobs.ph/jobseekers/job/example-1',snippet:'Full-time remote role'},{title:'Wrong',link:'https://example.com/profile'}]})};};
 const r=await collectJobs({query:'operations',sources:['Google Jobs','LinkedIn','OnlineJobs.ph']},{SERPAPI_API_KEY:'fake'},fetcher);assert.equal(r.jobs.length,2);assert.equal(r.jobs[0].salary,'$800/month');assert.equal(r.jobs[1].description,'');assert.match(r.reports[1].error,/429/);
 await assert.rejects(()=>collectJobs({query:'x',sources:['Google Jobs']},{},fetcher),/SERPAPI_API_KEY/);
});
test('draft request keeps credentials server-side and supplies factual constraints',async()=>{
 const input={resume:'Verified inventory and order processing experience. '.repeat(4),job:{title:'VA',description:'Manage inventory and customer orders. '.repeat(5)}};
 let captured;
 const r=await generateDraft(input,{GEMINI_API_KEY:'secret',GEMINI_MODEL:'test-model'},async(url,opts)=>{captured={url,opts};return {ok:true,json:async()=>({candidates:[{finishReason:'STOP',content:{parts:[{text:'Subject: VA application\nA factual draft.'}]}}]})};});
 assert.match(r.text,/factual/);assert.ok(!captured.url.includes('secret'));assert.equal(captured.opts.headers['x-goog-api-key'],'secret');assert.match(captured.opts.body,/Do not invent/);assert.match(draftPrompt(input.resume,input.job),/untrusted/);
 await assert.rejects(()=>generateDraft({...input,job:{description:'short'}},{GEMINI_API_KEY:'x'}),/full job description/);
});
test('HTTP protects resume/API, blocks cross-origin writes and private files',async t=>{
 const server=createServer({NODE_ENV:'production',APP_PASSWORD:'a-long-private-password'});await new Promise(r=>server.listen(0,'127.0.0.1',r));t.after(()=>server.close());const base=`http://127.0.0.1:${server.address().port}`;
 assert.equal((await fetch(base+'/health')).status,200);assert.equal((await fetch(base+'/api/resume')).status,401);
 assert.equal((await fetch(base+'/resume.txt')).status,404);assert.equal((await fetch(base+'/.env')).status,404);
 const headers={Authorization:'Bearer a-long-private-password'};const conf=await(await fetch(base+'/api/config',{headers})).json();assert.equal(conf.searchReady,false);assert.ok(!JSON.stringify(conf).includes('private-password'));
 assert.equal((await fetch(base+'/api/search',{method:'POST',headers:{...headers,Origin:'https://evil.example','Content-Type':'application/json'},body:'{}'})).status,403);
 assert.throws(()=>createServer({NODE_ENV:'production'}),/APP_PASSWORD/);
});
