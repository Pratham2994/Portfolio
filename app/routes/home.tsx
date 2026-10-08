import { Outlet } from 'react-router';

import { Wall } from '~/wall/Wall';

export default function Home() {
  return (
    <>
      <main>
        <h1 className="sr-only">Pratham Panchal</h1>
        <Wall />
      </main>
      <Outlet />
    </>
  );
}
