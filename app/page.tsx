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
      </div>
    </main>
  );
}
