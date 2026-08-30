 ```javascript
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
    const entities = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };

    return entities[char];
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
      console.error('Erro ao carregar notícia:', result.error);
      list.innerHTML =
        '<div class="empty">Notícia não encontrada.</div>';
      return;
    }

    const noticia = result.data;

    document.title = esc(noticia.titulo) + ' | Jornal Chess Tatic';

    let metaDescription = document.querySelector(
      'meta[name="description"]'
    );

    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.name = 'description';
      document.head.appendChild(metaDescription);
    }

    metaDescription.content = noticia.conteudo
      ? String(noticia.conteudo).substring(0, 155)
      : 'Notícia do Jornal Chess Tatic sobre o mundo do xadrez.';

    let html = '<article class="card">';

    if (noticia.data) {
      html += '<small>' +
        new Date(noticia.data).toLocaleDateString('pt-BR') +
        '</small>';
    }

    html += '<h2>' + esc(noticia.titulo) + '</h2>';

    if (noticia.imagem) {
      html += '<img src="' +
        esc(noticia.imagem) +
        '" alt="' +
        esc(noticia.titulo) +
        '">';
    }

    html += '<p>' + esc(noticia.conteudo) + '</p>';

    if (loggedIn) {
      html += '<button class="delete-news" data-id="' +
        esc(noticia.id) +
        '">Excluir notícia</button>';
    }

    html += '<br><br>';
    html += '<a href="/">← Voltar para as notícias</a>';
    html += '</article>';

    list.innerHTML = html;

    document.querySelectorAll('.delete-news').forEach(function (button) {
      button.addEventListener('click', function () {
        deleteNews(button.dataset.id);
      });
    });

    return;
  }

  const result = await supabase
    .from('noticias')
    .select('id,titulo,conteudo,imagem,data')
    .order('data', { ascending: false });

  if (result.error) {
    console.error('Erro ao carregar notícias:', result.error);
    list.innerHTML =
      '<div class="empty">Não foi possível carregar as notícias.</div>';
    return;
  }

  const data = result.data;

  if (!data || data.length === 0) {
    list.innerHTML =
      '<div class="empty">Ainda não há notícias publicadas.</div>';
    return;
  }

  list.innerHTML = data.map(function (n) {
    let html = '<article class="card">';

    if (n.data) {
      html += '<small>' +
        new Date(n.data).toLocaleDateString('pt-BR') +
        '</small>';
    }

    html += '<h3>' + esc(n.titulo) + '</h3>';
    html += '<p>' + esc(n.conteudo) + '</p>';

    if (n.imagem) {
      html += '<img src="' +
        esc(n.imagem) +
        '" alt="' +
        esc(n.titulo) +
        '">';
    }

    html += '<a href="?noticia=' +
      encodeURIComponent(n.id) +
      '">Ler notícia completa →</a>';

    if (loggedIn) {
      html += '<br><br>';
      html += '<button class="delete-news" data-id="' +
        esc(n.id) +
        '">Excluir notícia</button>';
    }

    html += '</article>';

    return html;
  }).join('');

  document.querySelectorAll('.delete-news').forEach(function (button) {
    button.addEventListener('click', function () {
      deleteNews(button.dataset.id);
    });
  });
}

async function deleteNews(id) {
  const confirmed = confirm(
    'Tem certeza que deseja excluir esta notícia?'
  );

  if (!confirmed) return;

  const result = await supabase
    .from('noticias')
    .delete()
    .eq('id', id);

  if (result.error) {
    console.error('Erro ao excluir:', result.error);
    alert(
      'Não foi possível excluir a notícia.\n\n' +
      result.error.message
    );
    return;
  }

  alert('Notícia excluída com sucesso!');
  await load();
}

async function checkLogin() {
  const result = await supabase.auth.getSession();
  const session = result.data.session;

  loggedIn = !!session;

  if (session) {
    if (publishArea) publishArea.style.display = 'block';
    if (loginForm) loginForm.style.display = 'none';

    if (loginMessage) {
      loginMessage.textContent = 'Login realizado com sucesso!';
    }
  } else {
    if (publishArea) publishArea.style.display = 'none';
    if (loginForm) loginForm.style.display = 'block';
  }
}

if (loginForm) {
  loginForm.addEventListener('submit', async function (e) {
    e.preventDefault();

    const emailElement = document.querySelector('#login-email');
    const passwordElement = document.querySelector('#login-password');

    const email = emailElement ? emailElement.value.trim() : '';
    const password = passwordElement ? passwordElement.value : '';

    if (!email || !password) {
      if (loginMessage) {
        loginMessage.textContent =
          'Digite o e-mail e a senha.';
      }
      return;
    }

    if (loginMessage) {
      loginMessage.textContent = 'Entrando...';
    }

    const result = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (result.error) {
      console.error('Erro no login:', result.error);

      if (loginMessage) {
        loginMessage.textContent =
          'E-mail ou senha incorretos.';
      }

      return;
    }

    loggedIn = true;

    if (loginMessage) {
      loginMessage.textContent =
        'Login realizado com sucesso! 🎉';
    }

    if (publishArea) publishArea.style.display = 'block';
    if (loginForm) loginForm.style.display = 'none';

    await load();
  });
}

if (newsForm) {
  newsForm.addEventListener('submit', async function (e) {
    e.preventDefault();

    const titleElement = document.querySelector('#news-title');
    const contentElement = document.querySelector('#news-content');
    const imageElement = document.querySelector('#news-image');

    const titulo = titleElement
      ? titleElement.value.trim()
      : '';

    const conteudo = contentElement
      ? contentElement.value.trim()
      : '';

    const imagem = imageElement
      ? imageElement.value.trim()
      : '';

    if (!titulo || !conteudo) {
      if (newsMessage) {
        newsMessage.textContent =
          'Preencha o título e o conteúdo da notícia.';
      }
      return;
    }

    if (!loggedIn) {
      if (newsMessage) {
        newsMessage.textContent =
          'Você precisa estar logado para publicar.';
      }
      return;
    }

    if (newsMessage) {
      newsMessage.textContent = 'Publicando...';
    }

    const { data: sessionData } =
      await supabase.auth.getSession();

    if (!sessionData.session) {
      loggedIn = false;

      if (newsMessage) {
        newsMessage.textContent =
          'Sua sessão expirou. Faça login novamente.';
      }

      await checkLogin();
      return;
    }

    const result = await supabase
      .from('noticias')
      .insert({
        titulo: titulo,
        conteudo: conteudo,
        imagem: imagem || null
      })
      .select()
      .single();

    if (result.error) {
      console.error('ERRO AO PUBLICAR:', result.error);

      if (newsMessage) {
        newsMessage.textContent =
          'Erro ao publicar: ' +
          result.error.message;
      }

      return;
    }

    console.log('Notícia publicada:', result.data);

    if (newsMessage) {
      newsMessage.textContent =
        'Notícia publicada com sucesso! 🎉';
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
      console.error('Erro ao sair:', result.error);

      logoutButton.disabled = false;
      logoutButton.textContent = 'Sair do administrador';

      alert('Não foi possível sair. Tente novamente.');
      return;
    }

    loggedIn = false;

    if (publishArea) publishArea.style.display = 'none';
    if (loginForm) loginForm.style.display = 'block';

    if (loginMessage) {
      loginMessage.textContent =
        'Você saiu do administrador.';
    }

    await load();

    window.location.hash = 'inicio';
  });
}

supabase.auth.onAuthStateChange(function (_event, session) {
  loggedIn = !!session;

  if (session) {
    if (publishArea) publishArea.style.display = 'block';
    if (loginForm) loginForm.style.display = 'none';
  } else {
    if (publishArea) publishArea.style.display = 'none';
    if (loginForm) loginForm.style.display = 'block';
  }
});

checkLogin().then(function () {
  return load();
});
```
