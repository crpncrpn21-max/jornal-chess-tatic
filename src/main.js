import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(url, key);

const list = document.querySelector('#news-list');
const loginForm = document.querySelector('#login-form');
const publishArea = document.querySelector('#publish-area');
const loginMessage = document.querySelector('#login-message');
const newsForm = document.querySelector('#news-form');
const newsMessage = document.querySelector('#news-message');

const esc = s => String(s ?? '').replace(
  /[&<>"']/g,
  c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }[c])
);

async function load() {
  const params = new URLSearchParams(window.location.search);
  const noticiaId = params.get('noticia');

  // Se estiver abrindo uma notícia específica
  if (noticiaId) {
    const { data: noticia, error } = await supabase
      .from('noticias')
      .select('id,titulo,conteudo,imagem,data')
      .eq('id', noticiaId)
      .single();

    if (error || !noticia) {
      list.innerHTML = '<div class="empty">Notícia não encontrada.</div>';
      return;
    }

    // SEO da notícia
    document.title = `${noticia.titulo} | Jornal Chess Tatic`;

    let metaDescription = document.querySelector('meta[name="description"]');

    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.name = 'description';
      document.head.appendChild(metaDescription);
    }

    metaDescription.content = noticia.conteudo
      ? noticia.conteudo.substring(0, 155)
      : 'Notícia do Jornal Chess Tatic sobre o mundo do xadrez.';

    list.innerHTML = `
      <article class="card">
        <small>${noticia.data ? new Date(noticia.data).toLocaleDateString('pt-BR') : ''}</small>
        <h2>${esc(noticia.titulo)}</h2>
        ${noticia.imagem ? `<img src="${esc(noticia.imagem)}" alt="${esc(noticia.titulo)}">` : ''}
        <p>${esc(noticia.conteudo)}</p>
        <a href="/">← Voltar para as notícias</a>
      </article>
    `;

    return;
  }

  // Página inicial com todas as notícias
  const { data, error } = await supabase
    .from('noticias')
    .select('id,titulo,conteudo,imagem,data')
    .order('data', { ascending: false });

  if (error) {
    console.error(error);
    list.innerHTML = '<div class="empty">Não foi possível carregar as notícias. Vamos verificar a conexão.</div>';
    return;
  }

  if (!data.length) {
    list.innerHTML = '<div class="empty">Ainda não há notícias publicadas.</div>';
    return;
  }

  list.innerHTML = data.map(n => `
    <article class="card">
      <small>${n.data ? new Date(n.data).toLocaleDateString('pt-BR') : ''}</small>
      <h3>${esc(n.titulo)}</h3>
      <p>${esc(n.conteudo)}</p>
      ${n.imagem ? `<img src="${esc(n.imagem)}" alt="${esc(n.titulo)}">` : ''}
      <a href="?noticia=${encodeURIComponent(n.id)}">Ler notícia completa →</a>
    </article>
  `).join('');
}

async function checkLogin() {
  const { data } = await supabase.auth.getSession();

  if (data.session && publishArea) {
    publishArea.style.display = 'block';

    if (loginForm) {
      loginForm.style.display = 'none';
    }

    if (loginMessage) {
      loginMessage.textContent = 'Login realizado com sucesso!';
    }
  }
}

if (loginForm) {
  loginForm.addEventListener('submit', async e => {
    e.preventDefault();

    const email = document.querySelector('#login-email').value;
    const password = document.querySelector('#login-password').value;

    loginMessage.textContent = 'Entrando...';

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.error(error);
      loginMessage.textContent = 'E-mail ou senha incorretos.';
      return;
    }

    loginMessage.textContent = 'Login realizado com sucesso!';

    publishArea.style.display = 'block';
    loginForm.style.display = 'none';
  });
}

if (newsForm) {
  newsForm.addEventListener('submit', async e => {
    e.preventDefault();

    const titulo = document.querySelector('#news-title').value.trim();
    const conteudo = document.querySelector('#news-content').value.trim();
    const imagem = document.querySelector('#news-image').value.trim();

    newsMessage.textContent = 'Publicando...';

    const { error } = await supabase
      .from('noticias')
      .insert({
        titulo,
        conteudo,
        imagem: imagem || null
      });

    if (error) {
      console.error(error);
      newsMessage.textContent = 'Erro ao publicar a notícia.';
      return;
    }

    newsMessage.textContent = 'Notícia publicada com sucesso! 🎉';

    newsForm.reset();
    await load();
  });
}

load();
checkLogin(); 
