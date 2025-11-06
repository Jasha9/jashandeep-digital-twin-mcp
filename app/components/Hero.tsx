'use client'

import Link from 'next/link'
import aboutData from '@/data/about.json'

export default function Hero() {
  const skills = ['Next.js', 'Groq AI', 'Upstash Vector', 'RAG Systems', 'Full-Stack Developer']
  
  const openChat = () => {
    // Find and click the chatbot button
    const chatButton = document.querySelector('[aria-label="Toggle chat"]') as HTMLButtonElement
    if (chatButton) {
      chatButton.click()
    }
  }
  
  return (
    <section className="relative min-h-screen flex items-center justify-center px-6 py-20">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 max-w-5xl mx-auto text-center">
        
        {/* Greeting */}
        <div className="mb-8 animate-fadeIn">
          <span className="text-5xl md:text-6xl mb-4 block">👋</span>
          <h2 className="text-2xl md:text-3xl text-blue-200 mb-2">Hi, I&apos;m</h2>
          <h1 className="text-6xl md:text-8xl font-bold text-white mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400">
            {aboutData.name}
          </h1>
        </div>

        {/* Animated Skills */}
        <div className="mb-8">
          <div className="flex flex-wrap justify-center gap-3 mb-6">
            {skills.map((skill, idx) => (
              <span
                key={idx}
                className="px-4 py-2 bg-blue-500/20 backdrop-blur-sm text-blue-100 rounded-full text-sm md:text-base border border-blue-400/30 hover:border-blue-400/60 transition-all hover:scale-105"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                {skill}
              </span>
            ))}
          </div>
        </div>

        {/* Tagline */}
        <p className="text-xl md:text-2xl text-blue-200 mb-12 max-w-3xl mx-auto leading-relaxed">
          {aboutData.tagline}
        </p>

        {/* Call to Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button
            onClick={openChat}
            className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-lg transition-all transform hover:scale-105 shadow-lg shadow-blue-500/50 flex items-center gap-2"
          >
            <span>Chat with My Digital Twin</span>
            <span className="text-2xl">🤖</span>
          </button>
          
          <Link
            href="/projects"
            className="px-8 py-4 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white font-semibold rounded-lg transition-all border border-white/20 hover:border-white/40"
          >
            View My Projects
          </Link>
        </div>

        {/* Quick Stats */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
            <div className="text-3xl font-bold text-white mb-1">85%+</div>
            <div className="text-blue-200 text-sm">Recruiter Satisfaction</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
            <div className="text-3xl font-bold text-white mb-1">10+</div>
            <div className="text-blue-200 text-sm">Projects Completed</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
            <div className="text-3xl font-bold text-white mb-1">50+</div>
            <div className="text-blue-200 text-sm">Technologies</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
            <div className="text-3xl font-bold text-white mb-1">99.9%</div>
            <div className="text-blue-200 text-sm">System Uptime</div>
          </div>
        </div>

      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </div>
    </section>
  )
}
