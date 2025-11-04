export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="max-w-2xl text-center">
        <h1 className="text-4xl font-bold mb-4">Living with the Rebbe</h1>
        <h2 className="text-2xl text-gray-600 mb-8">Admin Tool</h2>
        <p className="text-lg text-gray-700 mb-4">
          This is an admin-only tool for scraping and publishing newsletters to ChabadUniverse.
        </p>
        <p className="text-sm text-gray-500">
          This application runs exclusively as an iframe within ChabadUniverse/Valu Social.
        </p>
        <div className="mt-8 p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800 font-semibold">
            Status: Planning/Documentation Phase
          </p>
          <p className="text-sm text-yellow-700 mt-2">
            No implementation yet. Ready for development.
          </p>
        </div>

        {/* Sample Newsletter Section */}
        <div className="mt-12 p-8 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl border border-blue-200">
          <h3 className="text-xl font-semibold text-blue-900 mb-3">View Sample Newsletter</h3>
          <p className="text-sm text-blue-700 mb-6">
            Explore a sample &quot;Living with the Rebbe&quot; newsletter to see the format and
            content we&apos;ll be processing.
          </p>
          <a
            href="/samples/5785/yom_kippur.html"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200 shadow-md hover:shadow-lg"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            View Yom Kippur 5785 Sample
          </a>
          <p className="text-xs text-blue-600 mt-4">Opens in a new tab</p>
        </div>
      </div>
    </main>
  );
}
