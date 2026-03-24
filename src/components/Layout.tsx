import { Outlet } from 'react-router-dom';

export default function Layout() {
  return (
    <div className="min-h-screen bg-[#171717] text-[#fafafa]">
      <Outlet />
    </div>
  );
}
