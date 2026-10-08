declare module 'virtual:content' {
  import type { DeskItem, Project, TimelineItem, You } from '~/content/schema';

  const data: { projects: Project[]; desk: DeskItem[]; timeline: TimelineItem[]; you: You };
  export default data;
}
