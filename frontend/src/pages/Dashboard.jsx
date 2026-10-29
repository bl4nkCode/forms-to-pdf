
import { Link } from 'react-router-dom'
import GoogleConnection from '../components/GoogleConnection'
import { useAuth } from '../context/AuthContext'

function DocumentIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-6 w-6"
      aria-hidden="true"
    >
      <path d="M13.5 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9.5z" />
      <path d="M13 3v7h7" />
      <path d="M8 14h8M8 17.5h5" />
    </svg>
  )
}

function ExportIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-6 w-6"
      aria-hidden="true"
    >
      <path d="M12 3v11" />
      <path d="m8 10 4 4 4-4" />
      <path d="M5 16v3a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-3" />
    </svg>
  )
}

function ArrowIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const firstName = user?.name?.trim().split(/\s+/)[0] || 'there'

  return (
    <div className="space-y-8 sm:space-y-10">
      {/* Welcome section */}
      <section className="relative overflow-hidden rounded-3xl border border-[#e6e6d9] bg-[#eeefe5] p-6 sm:p-9 lg:p-10">
        <div className="pointer-events-none absolute -right-12 -top-16 h-52 w-52 rounded-full border border-[#d9dfcf] sm:h-64 sm:w-64" />
        <div className="pointer-events-none absolute -right-1 -top-5 h-36 w-36 rounded-full border border-[#d9dfcf] sm:h-44 sm:w-44" />

        <div className="relative z-10 max-w-2xl">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#d8dfd1] bg-[#f8f8f1] px-3 py-1.5 text-xs font-medium text-[#536b56]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#718a70]" />
            YOUR DOCUMENT WORKSPACE
          </div>

          <h1 className="text-3xl font-semibold leading-tight tracking-tight text-[#30372f] sm:text-4xl lg:text-5xl">
            Good to see you, {firstName}.
          </h1>

          <p className="mt-4 max-w-lg text-sm leading-7 text-[#73786d] sm:text-base">
            Bring your Google Forms into one place and turn forms, responses,
            and summaries into ready-to-download PDFs.
          </p>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link
              to="/forms"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#536b56] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#435846]"
            >
              Browse my forms
              <ArrowIcon />
            </Link>

            <Link
              to="/exports"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#d6dacd] bg-[#f8f8f1] px-5 py-3 text-sm font-medium text-[#4d594b] transition hover:bg-white"
            >
              View export history
            </Link>
          </div>
        </div>

        <div className="pointer-events-none absolute bottom-5 right-7 hidden rotate-6 sm:block lg:bottom-8 lg:right-12">
          <div className="flex h-24 w-20 flex-col items-center justify-center rounded-xl border border-[#d7dece] bg-[#fafaf5] text-[#657b60] shadow-sm lg:h-28 lg:w-24">
            <DocumentIcon />
            <span className="mt-2 text-[10px] font-semibold tracking-widest">
              PDF
            </span>
            <div className="mt-2 h-1 w-9 rounded-full bg-[#dce4d5]" />
            <div className="mt-1.5 h-1 w-6 rounded-full bg-[#e7eadf]" />
          </div>
        </div>
      </section>

      {/* Quick access */}
      <section>
        <div className="mb-4">
          <h2 className="text-lg font-semibold tracking-tight text-[#343a32]">
            Quick access
          </h2>
          <p className="mt-1 text-sm text-[#898b80]">
            Pick up where you want to work.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Link
            to="/forms"
            className="group rounded-2xl border border-[#e7e5db] bg-[#fffefa] p-5 transition duration-200 hover:-translate-y-0.5 hover:border-[#cbd7c6] hover:shadow-sm sm:p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#eaf0e6] text-[#536b56]">
                <DocumentIcon />
              </div>
              <span className="text-[#9b9d91] transition group-hover:translate-x-1 group-hover:text-[#536b56]">
                <ArrowIcon />
              </span>
            </div>

            <h3 className="mt-5 text-base font-semibold text-[#343a32]">
              My forms
            </h3>
            <p className="mt-2 text-sm leading-6 text-[#85877d]">
              Browse forms from your Google Drive or import one using its link.
            </p>
            <p className="mt-4 text-xs font-semibold text-[#536b56]">
              OPEN FORMS
            </p>
          </Link>

          <Link
            to="/exports"
            className="group rounded-2xl border border-[#e7e5db] bg-[#fffefa] p-5 transition duration-200 hover:-translate-y-0.5 hover:border-[#cbd7c6] hover:shadow-sm sm:p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#f1eee3] text-[#77704e]">
                <ExportIcon />
              </div>
              <span className="text-[#9b9d91] transition group-hover:translate-x-1 group-hover:text-[#536b56]">
                <ArrowIcon />
              </span>
            </div>

            <h3 className="mt-5 text-base font-semibold text-[#343a32]">
              PDF exports
            </h3>
            <p className="mt-2 text-sm leading-6 text-[#85877d]">
              Download completed PDFs and review the status of previous exports.
            </p>
            <p className="mt-4 text-xs font-semibold text-[#77704e]">
              VIEW EXPORTS
            </p>
          </Link>
        </div>
      </section>

      {/* Google connection */}
      <section>
        <div className="mb-4">
          <h2 className="text-lg font-semibold tracking-tight text-[#343a32]">
            Connected services
          </h2>
          <p className="mt-1 text-sm text-[#898b80]">
            Manage your Google Forms connection.
          </p>
        </div>

        <div className="rounded-2xl border border-[#e7e5db] bg-[#fffefa] p-4 sm:p-6">
          <GoogleConnection />
        </div>
      </section>
    </div>
  )
}
