
import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false } }
);

type Option = { key: string; text: string };
type Question = { no: number; text: string; options: Option[] };

const questions: Question[] = [
  { no:1, text:"Em uma ocorrência com risco ativo no local, qual deve ser a prioridade da equipe hospitalar?", options:[
    {key:"a",text:"Entrar imediatamente para iniciar o atendimento."},
    {key:"b",text:"Respeitar a segurança da cena e aguardar a liberação da ocorrência."},
    {key:"c",text:"Pedir que a vítima caminhe até a ambulância."},
    {key:"d",text:"Ignorar a equipe de segurança e priorizar velocidade."}]},
  { no:2, text:"Ao encontrar um paciente inconsciente em RP, qual conduta é mais adequada?", options:[
    {key:"a",text:"Avaliar a situação dentro do protocolo de RP e iniciar o atendimento de forma organizada."},
    {key:"b",text:"Encerrar a ocorrência sem avaliação."},
    {key:"c",text:"Mover o paciente imediatamente sem observar a cena."},
    {key:"d",text:"Aguardar o paciente falar antes de qualquer RP."}]},
  { no:3, text:"Informações médicas obtidas durante um atendimento devem ser:", options:[
    {key:"a",text:"Divulgadas para qualquer pessoa que perguntar."},
    {key:"b",text:"Usadas para gerar vantagem OOC."},
    {key:"c",text:"Tratadas com discrição e usadas somente quando necessário ao RP."},
    {key:"d",text:"Publicadas no chat geral."}]},
  { no:4, text:"Em uma ocorrência com múltiplas vítimas, a equipe deve:", options:[
    {key:"a",text:"Atender primeiro quem falar mais alto."},
    {key:"b",text:"Organizar prioridades de atendimento conforme gravidade e segurança da cena."},
    {key:"c",text:"Atender por ordem de chegada dos veículos."},
    {key:"d",text:"Levar todos ao hospital sem qualquer triagem."}]},
  { no:5, text:"Um profissional do hospital deve priorizar:", options:[
    {key:"a",text:"RP sério, comunicação clara e respeito às regras da cidade."},
    {key:"b",text:"Ganhar discussões com outros jogadores."},
    {key:"c",text:"Evitar qualquer interação longa."},
    {key:"d",text:"Resolver ocorrências sempre sozinho."}]},
  { no:6, text:"Durante o transporte de um paciente, qual postura é mais adequada?", options:[
    {key:"a",text:"Dirigir sem comunicação para chegar mais rápido."},
    {key:"b",text:"Manter comunicação com a equipe e conduzir o RP de forma coerente."},
    {key:"c",text:"Encerrar o RP até chegar ao hospital."},
    {key:"d",text:"Deixar o paciente decidir todos os procedimentos."}]},
  { no:7, text:"Diante de comportamento provocativo de um paciente, o profissional deve:", options:[
    {key:"a",text:"Responder com a mesma agressividade."},
    {key:"b",text:"Abandonar o atendimento imediatamente."},
    {key:"c",text:"Manter postura profissional e evitar escalar conflito desnecessariamente."},
    {key:"d",text:"Usar informações OOC para pressionar o paciente."}]},
  { no:8, text:"Sobre o uso de informações fora do personagem (OOC):", options:[
    {key:"a",text:"É permitido se ajudar a equipe do hospital."},
    {key:"b",text:"Não se deve usar informações OOC para obter vantagem no RP."},
    {key:"c",text:"Pode ser usado sempre que não houver testemunhas."},
    {key:"d",text:"É obrigatório em ocorrências policiais."}]},
  { no:9, text:"Em um atendimento envolvendo a polícia, o hospital deve:", options:[
    {key:"a",text:"Cooperar com a ocorrência sem ultrapassar os limites do papel hospitalar."},
    {key:"b",text:"Assumir o comando da ocorrência policial."},
    {key:"c",text:"Ignorar qualquer orientação de segurança."},
    {key:"d",text:"Interrogar suspeitos durante o atendimento."}]},
  { no:10, text:"Se houver dúvida sobre um procedimento interno, o mais adequado é:", options:[
    {key:"a",text:"Improvisar para não perder tempo."},
    {key:"b",text:"Perguntar no chat geral da cidade."},
    {key:"c",text:"Consultar a liderança ou o protocolo do hospital antes de improvisar."},
    {key:"d",text:"Copiar qualquer procedimento visto em outro servidor."}]},
  { no:11, text:"Durante o plantão, espera-se que o profissional:", options:[
    {key:"a",text:"Permaneça disponível, comunique ausências e cumpra as responsabilidades do cargo."},
    {key:"b",text:"Fique indisponível sem avisar sempre que desejar."},
    {key:"c",text:"Priorize atividades pessoais mesmo durante chamados."},
    {key:"d",text:"Atenda somente amigos."}]},
  { no:12, text:"A principal função do hospital dentro do RP é:", options:[
    {key:"a",text:"Criar atendimento coerente, imersivo e colaborativo para todos os envolvidos."},
    {key:"b",text:"Apenas reviver jogadores o mais rápido possível."},
    {key:"c",text:"Substituir funções policiais."},
    {key:"d",text:"Impedir que ocorrências durem muito tempo."}]},
];

const correct: Record<number,string> = {1:"b",2:"a",3:"c",4:"b",5:"a",6:"b",7:"c",8:"b",9:"a",10:"c",11:"a",12:"a"};

const essayQuestions = [
  { no:13, text:"Descreva como você agiria em uma ocorrência com vítima grave, polícia presente e local ainda não totalmente seguro." },
  { no:14, text:"Como você lidaria com um paciente que se recusa a colaborar e começa a provocar a equipe?" },
  { no:15, text:"Explique o que significa, para você, fazer um RP hospitalar sério e de qualidade." },
];

function json(data: unknown, status=200) {
  return new Response(JSON.stringify(data), { status, headers: { ...cors, "Content-Type":"application/json" } });
}
function clean(s: unknown, max=500) {
  return String(s ?? "").trim().replace(/[<>]/g, "").slice(0,max);
}
function normalizeDiscord(s: string) { return s.trim().toLowerCase(); }
function protocol() {
  const bytes = crypto.getRandomValues(new Uint8Array(5));
  return "HP-" + Array.from(bytes).map(b=>b.toString(16).padStart(2,"0")).join("").toUpperCase();
}
function shuffle<T>(arr:T[]) {
  const a=[...arr];
  for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; }
  return a;
}
async function sha256(s:string) {
  const d=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(s));
  return Array.from(new Uint8Array(d)).map(b=>b.toString(16).padStart(2,"0")).join("");
}
async function pbkdf2(password:string,salt:string) {
  const key=await crypto.subtle.importKey("raw",new TextEncoder().encode(password),"PBKDF2",false,["deriveBits"]);
  const bits=await crypto.subtle.deriveBits({name:"PBKDF2",hash:"SHA-256",salt:new TextEncoder().encode(salt),iterations:210000},key,256);
  return Array.from(new Uint8Array(bits)).map(b=>b.toString(16).padStart(2,"0")).join("");
}
function randomToken(n=32) {
  const b=crypto.getRandomValues(new Uint8Array(n));
  return Array.from(b).map(x=>x.toString(16).padStart(2,"0")).join("");
}
async function adminFromReq(req:Request) {
  const auth=req.headers.get("authorization")||"";
  if(!auth.startsWith("Bearer ")) return null;
  const raw=auth.slice(7);
  const tokenHash=await sha256(raw);
  const {data:s}=await supabase.from("admin_sessions").select("id,admin_id,expires_at").eq("token_hash",tokenHash).gt("expires_at",new Date().toISOString()).maybeSingle();
  if(!s) return null;
  return {adminId:s.admin_id,sessionId:s.id};
}
async function audit(candidate_id:string|null,admin_id:string|null,action:string,details:any={}) {
  await supabase.from("audit_logs").insert({candidate_id,admin_id,action,details});
}

Deno.serve(async (req:Request) => {
  if(req.method==="OPTIONS") return new Response("ok",{headers:cors});
  if(req.method!=="POST") return json({error:"Método não permitido"},405);
  let body:any={};
  try { body=await req.json(); } catch { return json({error:"JSON inválido"},400); }
  const action=clean(body.action,80);

  if(action==="questions") {
    return json({
      objective: questions.map(q=>({no:q.no,text:q.text,options:shuffle(q.options)})),
      essay: essayQuestions
    });
  }

  if(action==="submit_exam") {
    const rp_name=clean(body.rp_name,100);
    const city_id=Number(body.city_id);
    const character_age=Number(body.character_age);
    const phone=clean(body.phone,40);
    const discord=clean(body.discord,100);
    const consent=body.consent===true;
    const obj=Array.isArray(body.objective_answers)?body.objective_answers:[];
    const essays=Array.isArray(body.essay_answers)?body.essay_answers:[];

    if(!rp_name || !Number.isInteger(city_id) || city_id<=0 || !Number.isInteger(character_age) || character_age<16 || character_age>100 || !phone || !discord || !consent)
      return json({error:"Preencha corretamente todos os campos obrigatórios."},400);
    if(obj.length!==12 || essays.length!==3) return json({error:"A prova precisa ter 12 respostas objetivas e 3 discursivas."},400);

    const normalized=normalizeDiscord(discord);
    const {data:existing}=await supabase.from("candidates").select("id,city_id,discord,status").eq("active",true).or(`city_id.eq.${city_id},discord.ilike.${normalized}`).limit(1);
    if(existing && existing.length) return json({error:"Já existe uma candidatura ativa vinculada a este ID da cidade ou Discord."},409);

    const seen=new Set<number>(); let score=0;
    const normalizedObj:any[]=[];
    for(const a of obj){
      const no=Number(a.question_no); const selected=clean(a.selected_key,5);
      if(no<1||no>12||seen.has(no)||!["a","b","c","d"].includes(selected)) return json({error:"Respostas objetivas inválidas."},400);
      seen.add(no); const ok=correct[no]===selected; if(ok) score++;
      normalizedObj.push({question_no:no,selected_key:selected,is_correct:ok});
    }
    const essayMap=new Map<number,string>();
    for(const e of essays){
      const no=Number(e.question_no); const answer=clean(e.answer,1200);
      if(no<13||no>15||!answer) return json({error:"Respostas discursivas inválidas ou vazias."},400);
      essayMap.set(no,answer);
    }
    if(essayMap.size!==3) return json({error:"Responda as três questões discursivas."},400);

    let proto=protocol();
    for(let i=0;i<3;i++){
      const {data:cand,error}=await supabase.from("candidates").insert({
        rp_name,city_id,character_age,phone,discord:normalized,protocol:proto,objective_score:score
      }).select("id,protocol,submitted_at,status").single();
      if(error){
        if(String(error.message).includes("duplicate")||String(error.code)==="23505"){
          if(i<2){proto=protocol();continue;}
          return json({error:"Já existe uma candidatura ativa com estes dados."},409);
        }
        return json({error:"Não foi possível enviar a prova."},500);
      }
      await supabase.from("objective_answers").insert(normalizedObj.map(a=>({...a,candidate_id:cand.id})));
      await supabase.from("essay_answers").insert(Array.from(essayMap.entries()).map(([question_no,answer])=>({candidate_id:cand.id,question_no,answer})));
      await audit(cand.id,null,"PROVA_ENVIADA",{objective_score:score});
      return json({ok:true,protocol:cand.protocol,status:"EM_ANALISE",city_id,discord:normalized,submitted_at:cand.submitted_at});
    }
  }

  if(action==="lookup_result") {
    const city_id=Number(body.city_id); const discord=normalizeDiscord(clean(body.discord,100)); const proto=clean(body.protocol,50);
    if(!Number.isInteger(city_id)||city_id<=0||!discord) return json({error:"Informe ID da cidade e Discord."},400);
    let q=supabase.from("candidates").select("rp_name,city_id,discord,protocol,status,objective_score,essay_score,total_score,admin_message,submitted_at").eq("city_id",city_id).ilike("discord",discord).order("submitted_at",{ascending:false}).limit(1);
    if(proto) q=q.eq("protocol",proto);
    const {data,error}=await q.maybeSingle();
    if(error||!data) return json({error:"Resultado não encontrado. Confira ID, Discord e protocolo."},404);
    return json({result:data});
  }

  if(action==="admin_init_status") {
    const {count}=await supabase.from("admin_users").select("*",{count:"exact",head:true});
    return json({needs_setup:(count||0)===0});
  }

  if(action==="admin_init") {
    const {count}=await supabase.from("admin_users").select("*",{count:"exact",head:true});
    if((count||0)>0) return json({error:"O administrador mestre já foi criado."},403);
    const username=clean(body.username,60).toLowerCase(); const password=String(body.password||"");
    if(username.length<3||password.length<10) return json({error:"Usuário deve ter ao menos 3 caracteres e senha ao menos 10."},400);
    const salt=randomToken(16); const password_hash=await pbkdf2(password,salt);
    const {data,error}=await supabase.from("admin_users").insert({username,salt,password_hash}).select("id").single();
    if(error) return json({error:"Não foi possível criar o administrador."},500);
    await audit(null,data.id,"ADMIN_MESTRE_CRIADO",{username});
    return json({ok:true});
  }

  if(action==="admin_login") {
    const username=clean(body.username,60).toLowerCase(); const password=String(body.password||"");
    const {data:u}=await supabase.from("admin_users").select("id,salt,password_hash").eq("username",username).maybeSingle();
    if(!u) return json({error:"Usuário ou senha inválidos."},401);
    const hash=await pbkdf2(password,u.salt);
    if(hash!==u.password_hash) return json({error:"Usuário ou senha inválidos."},401);
    await supabase.from("admin_sessions").delete().lt("expires_at",new Date().toISOString());
    const token=randomToken(32); const token_hash=await sha256(token); const expires=new Date(Date.now()+8*60*60*1000).toISOString();
    await supabase.from("admin_sessions").insert({admin_id:u.id,token_hash,expires_at:expires});
    await audit(null,u.id,"ADMIN_LOGIN",{});
    return json({ok:true,token,expires_at:expires});
  }

  const admin=await adminFromReq(req);
  if(!admin) return json({error:"Sessão administrativa inválida ou expirada."},401);

  if(action==="admin_logout") {
    await supabase.from("admin_sessions").delete().eq("id",admin.sessionId);
    return json({ok:true});
  }

  if(action==="admin_dashboard") {
    const {data:rows}=await supabase.from("candidates").select("id,rp_name,city_id,discord,phone,protocol,status,objective_score,essay_score,total_score,submitted_at,active").order("submitted_at",{ascending:false});
    const list=rows||[];
    const total=list.length, em=list.filter(x=>x.status==="EM_ANALISE").length, ap=list.filter(x=>x.status==="APROVADO").length, nap=list.filter(x=>x.status==="NAO_APROVADO").length;
    const avg=total?Number((list.reduce((s,x)=>s+(x.objective_score||0),0)/total).toFixed(2)):0;
    return json({stats:{total,em_analise:em,aprovados:ap,nao_aprovados:nap,media_objetiva:avg},candidates:list});
  }

  if(action==="admin_candidate") {
    const id=clean(body.id,80);
    const {data:c,error}=await supabase.from("candidates").select("*").eq("id",id).maybeSingle();
    if(error||!c) return json({error:"Candidato não encontrado."},404);
    const {data:o}=await supabase.from("objective_answers").select("question_no,selected_key,is_correct").eq("candidate_id",id).order("question_no");
    const {data:e}=await supabase.from("essay_answers").select("question_no,answer").eq("candidate_id",id).order("question_no");
    return json({candidate:c,objective:o||[],essays:e||[],questions:questions.map(q=>({no:q.no,text:q.text,options:q.options})),essay_questions:essayQuestions});
  }

  if(action==="admin_update") {
    const id=clean(body.id,80); const status=clean(body.status,30);
    if(!["EM_ANALISE","APROVADO","NAO_APROVADO"].includes(status)) return json({error:"Status inválido."},400);
    const essay_score=body.essay_score===null||body.essay_score===""?null:Number(body.essay_score);
    if(essay_score!==null && (isNaN(essay_score)||essay_score<0||essay_score>10)) return json({error:"Nota discursiva deve ser de 0 a 10."},400);
    const admin_message=clean(body.admin_message,1500);
    const {data:c}=await supabase.from("candidates").select("objective_score").eq("id",id).maybeSingle();
    if(!c) return json({error:"Candidato não encontrado."},404);
    const objectivePart=Number(((c.objective_score/12)*6).toFixed(2));
    const essayPart=essay_score===null?null:Number(((essay_score/10)*4).toFixed(2));
    const total_score=essayPart===null?null:Number((objectivePart+essayPart).toFixed(2));
    const {error}=await supabase.from("candidates").update({status,essay_score,total_score,admin_message}).eq("id",id);
    if(error) return json({error:"Não foi possível atualizar."},500);
    await audit(id,admin.adminId,"RESULTADO_ATUALIZADO",{status,essay_score,total_score});
    return json({ok:true,total_score});
  }

  if(action==="admin_release_retake") {
    const id=clean(body.id,80);
    const {error}=await supabase.from("candidates").update({active:false,retake_allowed:true}).eq("id",id);
    if(error) return json({error:"Não foi possível liberar nova tentativa."},500);
    await audit(id,admin.adminId,"NOVA_TENTATIVA_LIBERADA",{});
    return json({ok:true});
  }

  return json({error:"Ação inválida."},400);
});
