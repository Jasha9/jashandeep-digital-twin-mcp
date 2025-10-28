import DigitalTwinChat from './components/DigitalTwinChat'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🤖 Digital Twin MCP Server
          </h1>
          <p className="text-xl text-gray-600">
            Powered by Upstash Vector & Groq AI
          </p>
          <div className="mt-4 text-sm text-gray-500">
            <a href="/admin" className="text-blue-600 hover:text-blue-800 underline">
              Go to Admin Panel
            </a>
          </div>
        </header>
        
        <DigitalTwinChat />
        
        <div className="mt-12 text-center">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              💡 About This Digital Twin
            </h3>
            <div className="text-sm text-gray-600 space-y-2">
              <p>
                This AI-powered digital twin uses <strong>Retrieval-Augmented Generation (RAG)</strong> 
                to provide personalized responses about my background, experience, and goals.
              </p>
              <p>
                Ask me about my work experience, technical skills, projects, education, 
                or career aspirations - I&apos;ll respond as if I&apos;m speaking about myself!
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
