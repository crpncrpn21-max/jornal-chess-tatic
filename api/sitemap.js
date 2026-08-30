import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
  );

  const { data, error } = await supabase
    .from('noticias')
    .select('id,data')
    .order('data', { ascending: false });

  if (error) {
    res.status(500).send('Erro ao gerar sitemap');
    return;
  }

  const urls = [
    `
      <url>
        <loc>https://jornal-chess-tatic.vercel.app/</loc>
      </url>
    `
  ];

  for (const noticia of data || []) {
    urls.push(`
      <url>
        <loc>https://jornal-chess-tatic.vercel.app/?noticia=${encodeURIComponent(noticia.id)}</loc>
        ${noticia.data ? `<lastmod>${new Date(noticia.data).toISOString()}</lastmod>` : ''}
      </url>
    `);
  }

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;

  res.setHeader('Content-Type', 'application/xml');
  res.status(200).send(sitemap);
}
