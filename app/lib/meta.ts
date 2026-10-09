import { you } from '~/content';
import type { Project } from '~/content/schema';

export const SITE = 'https://prathampanchal.dev';
const NAME = 'Pratham Panchal';

type Page = { title: string; description: string; path: string; image: string; schema?: object[] };

/** The tags every page needs for the browser tab, search results and link previews. */
export function pageMeta({ title, description, path, image, schema = [] }: Page) {
  const url = SITE + path;
  const picture = `${SITE}/og/${image}.png`;
  return [
    { title },
    { name: 'description', content: description },
    { name: 'author', content: NAME },
    { tagName: 'link', rel: 'canonical', href: url },
    { property: 'og:type', content: 'website' },
    { property: 'og:site_name', content: NAME },
    { property: 'og:locale', content: 'en_IN' },
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    { property: 'og:url', content: url },
    { property: 'og:image', content: picture },
    { property: 'og:image:width', content: '1200' },
    { property: 'og:image:height', content: '630' },
    { property: 'og:image:alt', content: title },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: title },
    { name: 'twitter:description', content: description },
    { name: 'twitter:image', content: picture },
    // Structured data: tells a search engine what this page is about, in a form it can read.
    ...schema.map((item) => ({ 'script:ld+json': { '@context': 'https://schema.org', ...item } })),
  ];
}

const person = {
  '@type': 'Person',
  '@id': `${SITE}/#me`,
  name: NAME,
  url: SITE,
  image: `${SITE}/og/home.png`,
  jobTitle: 'Software Engineer',
  worksFor: { '@type': 'Organization', name: 'Barclays' },
  alumniOf: { '@type': 'CollegeOrUniversity', name: 'K. J. Somaiya College of Engineering' },
  address: { '@type': 'PostalAddress', addressLocality: 'Pune', addressCountry: 'IN' },
  knowsAbout: ['Python', 'C++', 'JavaScript', 'TypeScript', 'Rust', 'Developer tools', 'Local LLMs'],
  sameAs: [you.github, you.linkedin],
};

export const HOME = {
  title: `${NAME} — Software Engineer`,
  description:
    'Software engineer in Pune, India. I build tools because the one I had almost did the job: Scrub, Neat, OmniCompiler, Prats-Deck and more.',
  schema: [person, { '@type': 'WebSite', '@id': `${SITE}/#site`, name: NAME, url: SITE, author: { '@id': `${SITE}/#me` } }],
};

/** A project page, described as source code with an author, plus its place under the home page. */
export function projectSchema(project: Project): object[] {
  const url = `${SITE}/work/${project.slug}`;
  return [
    {
      '@type': 'SoftwareSourceCode',
      name: project.title,
      description: project.tagline,
      url,
      codeRepository: project.links.repo,
      programmingLanguage: project.stack,
      author: { '@id': `${SITE}/#me`, '@type': 'Person', name: NAME, url: SITE },
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: NAME, item: SITE },
        { '@type': 'ListItem', position: 2, name: project.title, item: url },
      ],
    },
  ];
}
