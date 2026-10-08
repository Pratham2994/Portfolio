import { useParams } from 'react-router';

import { getProject } from '~/content';
import { NotOnWall } from '~/project/NotOnWall';
import { ProjectPage } from '~/project/ProjectPage';

export function meta({ params }: { params: { slug?: string } }) {
  const project = params.slug ? getProject(params.slug) : undefined;
  if (!project) return [{ title: 'Not on the wall — Pratham Panchal' }];
  return [{ title: `${project.title} — Pratham Panchal` }, { name: 'description', content: project.tagline }];
}

export default function Work() {
  const { slug } = useParams();
  const project = slug ? getProject(slug) : undefined;
  return project ? <ProjectPage key={project.slug} project={project} /> : <NotOnWall />;
}
