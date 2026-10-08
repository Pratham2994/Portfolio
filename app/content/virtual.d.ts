declare module 'virtual:content' {
  import type { DeskItem, Pieces, Project, TimelineItem, You } from '~/content/schema';

  const data: { projects: Project[]; desk: DeskItem[]; timeline: TimelineItem[]; you: You; pieces: Pieces };
  export default data;
}
