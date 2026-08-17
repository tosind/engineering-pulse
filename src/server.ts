import { config } from './config';
import { getStoredReviews, getReviewEvents, seedDatabase } from './db/database';
import { pullRequests, developers, getPullRequest } from './data/mockTeam';
import { ReviewPipeline } from './orchestration/reviewPipeline';
import { computeTeamMetrics } from './analytics/metrics';
import { generateManagerBrief } from './manager/managerBrief';

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const url = require('node:url');
const pipeline = new ReviewPipeline();
seedDatabase(false);

function json(res:any,status:number,data:any){res.writeHead(status,{'Content-Type':'application/json'});res.end(JSON.stringify(data,null,2));}
function readBody(req:any):Promise<any>{return new Promise((resolve,reject)=>{let d='';req.on('data',(c:any)=>d+=c);req.on('end',()=>{try{resolve(d?JSON.parse(d):{});}catch(e){reject(e);}});req.on('error',reject);});}
function serveFile(res:any,file:string,type:string){const p=path.join(process.cwd(),'public',file);if(!fs.existsSync(p)){res.writeHead(404);return res.end('Not found');}res.writeHead(200,{'Content-Type':type});res.end(fs.readFileSync(p));}

const server=http.createServer(async(req:any,res:any)=>{
  try{
    const parsed=url.parse(req.url||'',true); const pathname=parsed.pathname||'/';
    if(req.method==='GET'&&pathname==='/api/health') return json(res,200,{ok:true,mode:config.demoMode?'demo':'live-openrouter',models:config.models});
    if(req.method==='GET'&&pathname==='/api/team') return json(res,200,{developers,metrics:computeTeamMetrics(getStoredReviews())});
    if(req.method==='GET'&&pathname==='/api/prs') return json(res,200,getStoredReviews());
    if(req.method==='GET'&&pathname==='/api/brief') { const m=computeTeamMetrics(getStoredReviews()); return json(res,200,generateManagerBrief(m)); }
    if(req.method==='GET'&&pathname==='/api/events') return json(res,200,getReviewEvents());
    if(req.method==='POST'&&pathname==='/api/reviews/run-all'){const r=await pipeline.runAll();return json(res,200,{processed:r.length,metrics:computeTeamMetrics(r)});}
    if(req.method==='POST'&&pathname==='/api/reviews/run'){const body=await readBody(req);const pr=getPullRequest(body.prId);if(!pr)return json(res,404,{error:'Unknown PR'});return json(res,200,await pipeline.run(pr));}
    if(req.method==='GET'&&pathname==='/') return serveFile(res,'index.html','text/html; charset=utf-8');
    if(req.method==='GET'&&pathname==='/app.js') return serveFile(res,'app.js','text/javascript; charset=utf-8');
    if(req.method==='GET'&&pathname==='/styles.css') return serveFile(res,'styles.css','text/css; charset=utf-8');
    return json(res,404,{error:'Not found'});
  }catch(error:any){console.error(error);return json(res,500,{error:error.message||'Internal error'});}
});
server.listen(config.port,()=>console.log(`Engineering Pulse running at http://localhost:${config.port} (${config.demoMode?'demo':'live OpenRouter'} mode)`));
