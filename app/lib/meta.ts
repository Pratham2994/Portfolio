export const SITE = 'https://prathampanchal.dev';

type Page = { title: string; description: string; path: string; image: string };

/** The tags every page needs for the browser tab, search results and link previews. */
export function pageMeta({ title, description, path, image }: Page) {
  const url = SITE + path;
  const picture = `${SITE}/og/${image}.png`;
  return [
    { title },
    { name: 'description', content: description },
    { tagName: 'link', rel: 'canonical', href: url },
    { property: 'og:type', content: 'website' },
    { property: 'og:site_name', content: 'Pratham Panchal' },
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    { property: 'og:url', content: url },
    { property: 'og:image', content: picture },
    { property: 'og:image:width', content: '1200' },
    { property: 'og:image:height', content: '630' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ];
}

export const HOME = {
  title: 'Pratham Panchal',
  description: 'Software engineer. Most of my code exists because a tool almost did what I needed.',
};
