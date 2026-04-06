import { WifiIcon } from '@heroicons/react/24/outline';

export default function NoInternetPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="text-center max-w-sm">
        <div className="flex justify-center mb-6">
          <div className="rounded-full bg-slate-100 p-6">
            <WifiIcon className="h-12 w-12 text-slate-400" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-3">
          No Internet Connection
        </h1>
        <p className="text-slate-500 mb-8 leading-relaxed">
          JMS Tax requires an active internet connection. Please check your
          network settings and try again.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
