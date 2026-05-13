import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import { useUIStore } from '../../store'
import clsx from 'clsx'

export default function AppLayout({ title, subtitle }) {
  const { sidebarOpen } = useUIStore()

  return (
    <div className="min-h-screen bg-stone-100">
      <Sidebar />
      <div className={clsx(
        'transition-all duration-300',
        sidebarOpen ? 'ml-60' : 'ml-14'
      )}>
        <Header title={title} subtitle={subtitle} />
        <main className="pt-14 min-h-screen">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
