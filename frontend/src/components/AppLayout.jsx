
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const navigation = [
  {
    name: 'Overview',
    path: '/dashboard',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
        <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
        <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
        <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
        <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
      </svg>
    ),
  },
  {
    name: 'My forms',
    path: '/forms',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
        <path d="M13.5 3.5H6a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10z" />
        <path d="M13 3.5V10h7" />
        <path d="M8 14h8M8 17.5h8" />
      </svg>
    ),
  },
  {
    name: 'Export history',
    path: '/exports',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
        <path d="M12 3.5v11" />
        <path d="m8 10.5 4 4 4-4" />
        <path d="M5 16.5v3a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-3" />
      </svg>
    ),
  },
]

function BrandMark() {
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#536b56] text-white shadow-sm">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5"
        aria-hidden="true"
      >
        <path d="M7 3.5h7l5 5V20a1 1 0 0 1-1 1H7a2 2 0 0 1-2-2V5.5a2 2 0 0 1 2-2Z" />
        <path d="M14 3.5V9h5" />
        <path d="M8.5 13h7M8.5 16.5h7" />
      </svg>
    </div>
  )
}

function NavigationLinks({ mobile = false }) {
  return (
    <nav
      aria-label="Main navigation"
      className={mobile ? 'grid grid-cols-3 gap-2' : 'space-y-1.5'}
    >
      {navigation.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) =>
            [
              'flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors duration-200',
              mobile ? 'justify-center text-center' : '',
              isActive
                ? 'bg-[#e7eee5] text-[#405844]'
                : 'text-[#777970] hover:bg-[#f2f1eb] hover:text-[#353a33]',
            ].join(' ')
          }
        >
          <span className="h-5 w-5 shrink-0">
            {item.icon}
          </span>
          <span className={mobile ? 'text-xs sm:text-sm' : ''}>
            {item.name}
          </span>
        </NavLink>
      ))}
    </nav>
  )
}

export default function AppLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await logout()
    } finally {
      navigate('/login')
    }
  }

  const displayName = user?.name || 'User'
  const initials = displayName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()

  return (
    <div className="min-h-screen bg-[#f8f7f2] text-[#30372f]">
      <div className="flex min-h-screen">
        {/* Desktop sidebar */}
        <aside className="hidden w-64 shrink-0 flex-col border-r border-[#e8e6dc] bg-[#fffefa] px-5 py-6 md:flex">
          <NavLink
            to="/dashboard"
            className="mb-10 flex items-center gap-3 rounded-xl"
            aria-label="BALID home"
          >
            <BrandMark />
            <div>
              <p className="text-xl font-semibold tracking-tight text-[#30372f]">
                BALID
              </p>
              <p className="text-[11px] tracking-wide text-[#898a80]">
                FORMS & DOCUMENTS
              </p>
            </div>
          </NavLink>

          <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9a9b91]">
            Workspace
          </p>

          <NavigationLinks />

          <div className="mt-auto pt-8">
            <div className="rounded-2xl border border-[#e8e6dc] bg-[#f8f7f2] p-4">
              <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-[#e4ebe0] text-[#536b56]">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  className="h-4 w-4"
                  aria-hidden="true"
                >
                  <path d="M12 3.5 19 7v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V7z" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
              </div>
              <p className="text-sm font-medium text-[#3b443a]">
                Your workspace
              </p>
              <p className="mt-1 text-xs leading-5 text-[#85877c]">
                Manage forms and turn them into downloadable PDFs.
              </p>
            </div>

            <p className="mt-5 px-1 text-[11px] text-[#a1a197]">
              BALID · Forms made simpler
            </p>
          </div>
        </aside>

        {/* Main workspace */}
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-[#e8e6dc] bg-[#fffefa]/95 backdrop-blur">
            <div className="flex h-[72px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-10">
              {/* Mobile brand */}
              <NavLink
                to="/dashboard"
                className="flex items-center gap-2.5 md:hidden"
                aria-label="BALID home"
              >
                <BrandMark />
                <span className="text-lg font-semibold tracking-tight">
                  BALID
                </span>
              </NavLink>

              <div className="hidden md:block">
                <p className="text-xs text-[#929389]">
                  Your workspace
                </p>
                <p className="mt-0.5 text-sm font-medium text-[#454b42]">
                  Forms and PDF exports
                </p>
              </div>

              <div className="ml-auto flex items-center gap-3 sm:gap-4">
                <div className="hidden text-right sm:block">
                  <p className="max-w-44 truncate text-sm font-medium text-[#373d35]">
                    {displayName}
                  </p>
                  <p className="text-xs text-[#929389]">
                    Workspace account
                  </p>
                </div>

                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#dce4d8] bg-[#e9efe6] text-sm font-semibold text-[#4c654f]"
                  aria-label={`Signed in as ${displayName}`}
                  title={displayName}
                >
                  {initials || 'U'}
                </div>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-xl border border-[#e3e1d7] px-3 py-2 text-xs font-medium text-[#65685e] transition hover:border-[#c9d4c5] hover:bg-[#f2f4ed] hover:text-[#405844] sm:px-4 sm:text-sm"
                >
                  Log out
                </button>
              </div>
            </div>
          </header>

          {/* Mobile navigation */}
          <div className="border-b border-[#e8e6dc] bg-[#fffefa] px-3 py-3 md:hidden">
            <NavigationLinks mobile />
          </div>

          <main className="w-full flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10">
            <div className="mx-auto w-full max-w-7xl">
              <Outlet />
            </div>
          </main>

          <footer className="border-t border-[#e8e6dc] px-4 py-4 text-center text-xs text-[#999a90] sm:px-6 lg:px-10">
            BALID <span className="mx-1">·</span>
          </footer>
        </div>
      </div>
    </div>
  )
}
