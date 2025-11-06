import { Metadata } from 'next'
import aboutData from '@/data/about.json'
import Image from 'next/image'

export const metadata: Metadata = {
  title: 'About | Jashandeep Kaur',
  description: 'Learn more about Jashandeep Kaur - AI & Web Developer specializing in RAG systems, Next.js, and full-stack development.',
}

export default function AboutPage() {
  const { name, title, bio, education, skills, interests, professionalGoals } = aboutData

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="max-w-6xl mx-auto px-6 py-20">
        
        {/* Header Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            About Me
          </h1>
          <p className="text-xl text-blue-200 max-w-3xl mx-auto">
            {title} passionate about building intelligent systems
          </p>
        </div>

        {/* Bio Section */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 md:p-12 mb-12 border border-white/20">
          <h2 className="text-3xl font-bold text-white mb-6">👋 Introduction</h2>
          <p className="text-lg text-blue-100 leading-relaxed mb-6">
            {bio}
          </p>
        </div>

        {/* Education Section */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 md:p-12 mb-12 border border-white/20">
          <h2 className="text-3xl font-bold text-white mb-8">🎓 Education</h2>
          <div className="space-y-4">
            <div className="border-l-4 border-blue-400 pl-6">
              <h3 className="text-2xl font-semibold text-white mb-2">{education.degree}</h3>
              <p className="text-blue-200 text-lg mb-1">{education.university}</p>
              <p className="text-blue-300 mb-1">Major: {education.major}</p>
              <p className="text-blue-300 mb-4">{education.location} • Graduating {education.graduationYear}</p>
              <div className="mt-4">
                <h4 className="text-white font-semibold mb-2">Key Achievements:</h4>
                <ul className="space-y-2">
                  {education.achievements.map((achievement, idx) => (
                    <li key={idx} className="text-blue-100 flex items-start">
                      <span className="text-blue-400 mr-2">✓</span>
                      {achievement}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Skills Section */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 md:p-12 mb-12 border border-white/20">
          <h2 className="text-3xl font-bold text-white mb-8">💻 Technical Skills</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {Object.entries(skills).map(([category, skillList]) => (
              <div key={category}>
                <h3 className="text-xl font-semibold text-blue-300 mb-4 capitalize">
                  {category === 'aiml' ? 'AI/ML' : category}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {(skillList as string[]).map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-4 py-2 bg-blue-500/20 text-blue-100 rounded-lg text-sm border border-blue-400/30 hover:bg-blue-500/30 transition-colors"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Interests Section */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 md:p-12 mb-12 border border-white/20">
          <h2 className="text-3xl font-bold text-white mb-6">🎯 Interests</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {interests.map((interest, idx) => (
              <div key={idx} className="flex items-center space-x-3">
                <span className="text-blue-400 text-xl">▸</span>
                <span className="text-blue-100">{interest}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Professional Goals */}
        <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-lg rounded-2xl p-8 md:p-12 border border-white/20">
          <h2 className="text-3xl font-bold text-white mb-6">🚀 Professional Goals</h2>
          <ul className="space-y-4">
            {professionalGoals.map((goal, idx) => (
              <li key={idx} className="flex items-start space-x-3">
                <span className="text-2xl">✨</span>
                <span className="text-blue-100 text-lg">{goal}</span>
              </li>
            ))}
          </ul>
        </div>

      </div>
    </main>
  )
}
