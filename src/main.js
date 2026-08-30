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
const logoutButton = document.querySelector('#logout-button');

let loggedIn = false;

function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, function (char) {
    if (char === '&') return '&amp;';
    if (char === '<') return '&lt;';
    if (char === '>') return '&gt;';
    if (char === '"') return '&quot;';
    if (char === "'") return '&#039;';
    return char;
  });
}

function atualizarInterface() {
  if (loggedIn) {
    if (publishArea) publishArea.style.display = 'block';
    if (loginForm) loginForm.style.display = 'none';
  } else {
    if (publishArea) publishArea.style.display = 'none';
    if (loginForm) loginForm.style.display = 'block';
  }
}

function configurarBotoesExcluir() {
  document.querySelectorAll('.delete-news').forEach(function (button) {
    button.addEventListener('click', async function () {
      if (!loggedIn) {
        alert('Faça login para excluir notícias.');
        return;
      }

      const id = button.dataset.id;

      if (!confirm('Tem certeza que deseja excluir esta notícia?')) {
        return;
      }

      button.disabled = true;
      button.textContent = 'Excluindo...';

      const result = await supabase
        .from('noticias')
        .delete()
        .eq('id', id);

      if (result.error) {
        console.error(result.error);
        alert('Erro ao excluir: ' + result.error.message);
        button.disabled = false;
        button.textContent = 'Excluir notícia';
        return;
      }

      await load();
    });
  });
}

async function load() {
  if (!list) return;

  const params = new URLSearchParams(window.location.search);
  const noticiaId = params.get('noticia');

  if (noticiaId) {
    const result = await supabase
      .from('noticias')
      .select('id,titulo,conteudo,imagem,data')
      .eq('id', noticiaId)
      .single();

    if (result.error || !result.data) {
      list.innerHTML = '<div class="empty">Notícia não encontrada.</div>';
      return;
    }

    const noticia = result.data;

    document.title = noticia.titulo + ' | Jornal Chess Tatic';

    const meta = document.querySelector('meta[name="description"]');

    if (meta) {
      meta.content = noticia.conteudo
        ? String(noticia.conteudo).substring(0, 155)
        : 'Notícia do Jornal Chess Tatic sobre o mundo do xadrez.';
    }

    let html = '';

    html += '<article class="card">';

    if (noticia.data) {
      html += '<small>';
      html += esc(new Date(noticia.data).toLocaleDateString('pt-BR'));
      html += '</small>';
    }

    html += '<h2>';
    html += esc(noticia.titulo);
    html += '</h2>';

    if (noticia.imagem) {
      html += '<img src="';
      html += esc(noticia.imagem);
      html += '" alt="';
      html += esc(noticia.titulo);
      html += '">';
    }

    html += '<p>';
    html += esc(noticia.conteudo).replace(/\n/g, '<br>');
    html += '</p>';

    if (loggedIn) {
      html += '<button class="delete-news" data-id="';
      html += esc(noticia.id);
      html += '" type="button">Excluir notícia</button>';
    }

    html += '<br><br>';
    html += '<a href="/">← Voltar para as notícias</a>';
    html += '</article>';

    list.innerHTML = html;

    configurarBotoesExcluir();

    return;
  }

  const result = await supabase
    .from('noticias')
    .select('id,titulo,conteudo,imagem,data')
    .order('data', { ascending: false });

  if (result.error) {
    console.error(result.error);

    list.innerHTML =
      '<div class="empty">Não foi possível carregar as notícias.</div>';

    return;
  }

  const noticias = result.data || [];

  if (noticias.length === 0) {
    list.innerHTML =
      '<div class="empty">Ainda não há notícias publicadas.</div>';

    return;
  }

  list.innerHTML = noticias.map(function (n) {
    let html = '';

    html += '<article class="card">';

    if (n.data) {
      html += '<small>';
      html += esc(new Date(n.data).toLocaleDateString('pt-BR'));
      html += '</small>';
    }

    html += '<h3>';
    html += esc(n.titulo);
    html += '</h3>';

    html += '<p>';
    html += esc(n.conteudo).replace(/\n/g, '<br>');
    html += '</p>';

    if (n.imagem) {
      html += '<img src="';
      html += esc(n.imagem);
      html += '" alt="';
      html += esc(n.titulo);
      html += '">';
    }

    html += '<a href="?noticia=';
    html += encodeURIComponent(n.id);
    html += '">Ler notícia completa →</a>';

    if (loggedIn) {
      html += '<br><br>';
      html += '<button class="delete-news" data-id="';
      html += esc(n.id);
      html += '" type="button">Excluir notícia</button>';
    }

    html += '</article>';

    return html;
  }).join('');

  configurarBotoesExcluir();
}

async function checkLogin() {
  const result = await supabase.auth.getSession();

  if (result.error) {
    console.error(result.error);
    loggedIn = false;
  } else {
    loggedIn = !!result.data.session;
  }

  atualizarInterface();
}

if (loginForm) {
  loginForm.addEventListener('submit', async function (e) {
    e.preventDefault();

    const emailElement = document.querySelector('#login-email');
    const passwordElement = document.querySelector('#login-password');

    const email = emailElement ? emailElement.value.trim() : '';
    const password = passwordElement ? passwordElement.value : '';

    if (loginMessage) {
      loginMessage.textContent = 'Entrando...';
    }

    const result = await supabase.auth.signInWithPassword({
      email: email,
      password: password
    });

    if (result.error) {
      console.error(result.error);

      if (loginMessage) {
        loginMessage.textContent = 'E-mail ou senha incorretos.';
      }

      return;
    }

    loggedIn = true;

    atualizarInterface();

    if (loginMessage) {
      loginMessage.textContent = 'Login realizado com sucesso!';
    }

    await load();
  });
}

if (newsForm) {
  newsForm.addEventListener('submit', async function (e) {
    e.preventDefault();

    if (!loggedIn) {
      if (newsMessage) {
        newsMessage.textContent = 'Faça login para publicar.';
      }

      return;
    }

    const titleElement = document.querySelector('#news-title');
    const contentElement = document.querySelector('#news-content');
    const imageElement = document.querySelector('#news-image');

    const titulo = titleElement ? titleElement.value.trim() : '';
    const conteudo = contentElement ? contentElement.value.trim() : '';
    const imagem = imageElement ? imageElement.value.trim() : '';

    if (!titulo || !conteudo) {
      if (newsMessage) {
        newsMessage.textContent = 'Preencha o título e o conteúdo.';
      }

      return;
    }

    if (newsMessage) {
      newsMessage.textContent = 'Publicando...';
    }

    const result = await supabase
      .from('noticias')
      .insert({
        titulo: titulo,
        conteudo: conteudo,
        imagem: imagem || null
      });

    if (result.error) {
      console.error(result.error);

      if (newsMessage) {
        newsMessage.textContent =
          'Erro ao publicar: ' + result.error.message;
      }

      return;
    }

    if (newsMessage) {
      newsMessage.textContent = 'Notícia publicada com sucesso!';
    }

    newsForm.reset();

    await load();
  });
}

if (logoutButton) {
  logoutButton.addEventListener('click', async function () {
    logoutButton.disabled = true;
    logoutButton.textContent = 'Saindo...';

    const result = await supabase.auth.signOut();

    if (result.error) {
      console.error(result.error);

      logoutButton.disabled = false;
      logoutButton.textContent = 'Sair do administrador';

      alert('Não foi possível sair. Tente novamente.');

      return;
    }

    loggedIn = false;

    atualizarInterface();

    if (loginMessage) {
      loginMessage.textContent = 'Você saiu do administrador.';
    }

    await load();

    window.location.hash = 'inicio';
  });
}

supabase.auth.onAuthStateChange(function (_event, session) {
  loggedIn = !!session;

  atualizarInterface();

  load();
});

async function iniciar() {
  await checkLogin();
  await load();
}

iniciar();
