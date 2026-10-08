import { HOME, pageMeta } from '~/lib/meta';

export function meta() {
  return pageMeta({ ...HOME, path: '/', image: 'home' });
}

export default function Index() {
  return null;
}
