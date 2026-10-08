declare module 'virtual:content' {
  import type { Desk, Pieces, Project, TimelineItem, You } from '~/content/schema';

  const data: { projects: Project[]; desk: Desk; timeline: TimelineItem[]; you: You; pieces: Pieces };
  export default data;
}
