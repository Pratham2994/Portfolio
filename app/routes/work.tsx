import { useParams } from 'react-router';

import { getProject } from '~/content';
import { pageMeta, projectSchema } from '~/lib/meta';
import { NotOnWall } from '~/project/NotOnWall';
import { ProjectPage } from '~/project/ProjectPage';

export function meta({ params }: { params: { slug?: string } }) {
  const project = params.slug ? getProject(params.slug) : undefined;
  if (!project) return [{ title: 'Not on the wall - Pratham Panchal' }, { name: 'robots', content: 'noindex' }];
  return pageMeta({
    title: `${project.title} - Pratham Panchal`,
    description: `${project.tagline} ${project.sectors[0].body}`,
    path: `/work/${project.slug}`,
    image: project.slug,
    schema: projectSchema(project),
  });
}

export default function Work() {
  const { slug } = useParams();
  const project = slug ? getProject(slug) : undefined;
  return project ? <ProjectPage key={project.slug} project={project} /> : <NotOnWall />;
}
