import { index, layout, type RouteConfig } from '@react-router/dev/routes';

export default [layout('routes/home.tsx', [index('routes/index.tsx')])] satisfies RouteConfig;
