import { Outlet } from 'react-router';

export default function Home() {
  return (
    <main>
      <h1 className="sr-only">Pratham Panchal</h1>
      <Outlet />
    </main>
  );
}
