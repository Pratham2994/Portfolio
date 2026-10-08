import { index, layout, route, type RouteConfig } from '@react-router/dev/routes';

export default [
  layout('routes/home.tsx', [index('routes/index.tsx'), route('work/:slug', 'routes/work.tsx')]),
] satisfies RouteConfig;
