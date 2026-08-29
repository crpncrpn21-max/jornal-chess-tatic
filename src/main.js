 import { createClient } from '@supabase/supabase-js';
const url=import.meta.env.VITE_SUPABASE_URL;
const key=import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase=createClient(url,key);
const list=document.querySelector('#news-list');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
async function load(){
 const {data,error}=await supabase.from('jonarl chess tatic').select('id,titulo,conteudo,imagem,data').order('data',{ascending:false});
 if(error){console.error(error);list.innerHTML='<div class="empty">Não foi possível carregar as notícias. Vamos verificar a conexão.</div>';return}
 if(!data.length){list.innerHTML='<div class="empty">Ainda não há notícias publicadas.</div>';return}
 list.innerHTML=data.map(n=>`<article class="card"><small>${n.data?new Date(n.data).toLocaleDateString('pt-BR'):''}</small><h3>${esc(n.titulo)}</h3><p>${esc(n.conteudo)}</p></article>`).join('');
}
load();
