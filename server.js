import http from 'node:http';
import { createHash } from 'node:crypto';
const EMAIL = '23f3001363@ds.study.iitm.ac.in';
const PORT = Number(process.env.PORT || 3000);
function reply(res, status, body) {
  res.writeHead(status, {'Content-Type':'application/json','Cache-Control':'no-store'});
  res.end(JSON.stringify(body));
}
async function body(req) {
  let s=''; for await (const c of req) { s+=c; if(s.length>1_000_000) throw Error('large'); }
  return JSON.parse(s || '{}');
}
http.createServer(async (req,res) => {
  if(req.url==='/health') { res.writeHead(200,{'Content-Type':'text/plain'}); return res.end('ok'); }
  if(req.url!='/mcp') { res.writeHead(404); return res.end('Not found'); }
  if(req.method!=='POST') { res.writeHead(405,{'Allow':'POST'}); return res.end(); }
  try {
    const m=await body(req);
    if(typeof m.method==='string' && m.method.startsWith('notifications/')) { res.writeHead(202); return res.end(); }
    if(m.jsonrpc!=='2.0' || !('id' in m)) return reply(res,400,{jsonrpc:'2.0',id:m.id??null,error:{code:-32600,message:'Invalid Request'}});
    let result;
    switch(m.method) {
      case 'initialize': result={protocolVersion:m.params?.protocolVersion||'2025-03-26',capabilities:{tools:{}},serverInfo:{name:'exam-challenge-mcp',version:'1.0.0'}}; break;
      case 'ping': result={}; break;
      case 'tools/list': result={tools:[{name:'solve_challenge',description:'Returns the SHA-256 challenge response for this HTTP call.',inputSchema:{type:'object',properties:{}}}]}; break;
      case 'tools/call': {
        if(m.params?.name!=='solve_challenge') return reply(res,200,{jsonrpc:'2.0',id:m.id,error:{code:-32602,message:'Unknown tool'}});
        // Per-call HTTP header only. Never read the challenge from the JSON body.
        const challenge=req.headers['x-exam-challenge'];
        if(typeof challenge!=='string'||!/^[0-9a-f]{32}$/.test(challenge)) return reply(res,200,{jsonrpc:'2.0',id:m.id,error:{code:-32602,message:'Missing or invalid X-Exam-Challenge header'}});
        const text=createHash('sha256').update(`${challenge}:${EMAIL}`,'utf8').digest('hex').slice(0,16);
        result={content:[{type:'text',text}]}; break;
      }
      default: return reply(res,200,{jsonrpc:'2.0',id:m.id,error:{code:-32601,message:'Method not found'}});
    }
    reply(res,200,{jsonrpc:'2.0',id:m.id,result});
  } catch { reply(res,400,{jsonrpc:'2.0',id:null,error:{code:-32700,message:'Parse error'}}); }
}).listen(PORT,'0.0.0.0',()=>console.log(`MCP listening on ${PORT}/mcp`));
