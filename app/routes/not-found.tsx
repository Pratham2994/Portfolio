import { NotOnWall } from '~/project/NotOnWall';

export function meta() {
  return [{ title: 'Not on the wall - Pratham Panchal' }, { name: 'robots', content: 'noindex' }];
}

export default function NotFound() {
  return <NotOnWall />;
}
