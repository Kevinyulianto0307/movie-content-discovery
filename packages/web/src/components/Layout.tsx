import { Link, Outlet } from 'react-router-dom';

// App shell: header + routed page content.
export function Layout() {
  return (
    <>
      <header className="app-header">
        <div className="container">
          <Link to="/">
            <h1>Movie Content Discovery</h1>
          </Link>
          <div className="subtitle">
            ~45,000 movies · search, browse, and explore similar titles
          </div>
        </div>
      </header>
      <main className="container">
        <Outlet />
      </main>
    </>
  );
}
