import { Metadata } from 'next'
import experienceData from '@/data/experience.json'

export const metadata: Metadata = {
  title: 'Experience | Jashandeep Kaur',
  description: 'Professional experience including full-stack development internships and AI/ML projects.',
}

export default function ExperiencePage() {
  const { experience, certifications, skills_summary } = experienceData

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="max-w-6xl mx-auto px-6 py-20">
        
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Experience
          </h1>
          <p className="text-xl text-blue-200 max-w-3xl mx-auto">
            My professional journey in full-stack development and AI engineering
          </p>
        </div>

        {/* Skills Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
          <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-lg rounded-xl p-6 border border-white/20 text-center">
            <div className="text-4xl font-bold text-white mb-2">{skills_summary.years_experience}</div>
            <div className="text-blue-200 text-sm">Years Experience</div>
          </div>
          <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-lg rounded-xl p-6 border border-white/20 text-center">
            <div className="text-4xl font-bold text-white mb-2">{skills_summary.projects_completed}</div>
            <div className="text-blue-200 text-sm">Projects Completed</div>
          </div>
          <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-lg rounded-xl p-6 border border-white/20 text-center">
            <div className="text-4xl font-bold text-white mb-2">{skills_summary.technologies_mastered}</div>
            <div className="text-blue-200 text-sm">Technologies</div>
          </div>
          <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-lg rounded-xl p-6 border border-white/20 text-center">
            <div className="text-4xl font-bold text-white mb-2">{skills_summary.production_deployments}</div>
            <div className="text-blue-200 text-sm">Live Deployments</div>
          </div>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical Line */}
          <div className="absolute left-8 md:left-1/2 transform md:-translate-x-1/2 top-0 bottom-0 w-0.5 bg-blue-500/30"></div>

          {experience.map((exp, idx) => (
            <div key={exp.id} className={`relative mb-12 ${idx % 2 === 0 ? 'md:pr-1/2 md:text-right' : 'md:pl-1/2'}`}>
              
              {/* Timeline Dot */}
              <div className="absolute left-8 md:left-1/2 transform md:-translate-x-1/2 -translate-y-1 w-4 h-4 bg-blue-500 rounded-full border-4 border-slate-900"></div>

              {/* Experience Card */}
              <div className={`ml-20 md:ml-0 ${idx % 2 === 0 ? 'md:mr-12' : 'md:ml-12'}`}>
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 hover:border-blue-400/50 transition-all">
                  
                  {/* Header */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-3 py-1 bg-blue-500/20 text-blue-300 text-sm rounded-full border border-blue-400/30">
                        {exp.type}
                      </span>
                      <span className="text-blue-300 text-sm">{exp.duration}</span>
                    </div>
                    <h3 className="text-2xl font-bold text-white mt-4 mb-2">{exp.position}</h3>
                    <p className="text-blue-200 text-lg">{exp.company}</p>
                    <p className="text-blue-300 text-sm mt-1">{exp.location}</p>
                  </div>

                  {/* Description */}
                  <p className="text-blue-100 mb-6">{exp.description}</p>

                  {/* Responsibilities */}
                  {exp.responsibilities && exp.responsibilities.length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-white font-semibold mb-3">Key Responsibilities:</h4>
                      <ul className="space-y-2">
                        {exp.responsibilities.map((resp, idx) => (
                          <li key={idx} className="text-blue-100 flex items-start">
                            <span className="text-blue-400 mr-2 mt-1">▸</span>
                            <span>{resp}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Achievements */}
                  {exp.achievements && exp.achievements.length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-white font-semibold mb-3">Achievements:</h4>
                      <ul className="space-y-2">
                        {exp.achievements.map((achievement, idx) => (
                          <li key={idx} className="text-blue-100 flex items-start">
                            <span className="text-yellow-400 mr-2">✓</span>
                            <span>{achievement}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Highlights */}
                  {exp.highlights && exp.highlights.length > 0 && (
                    <div className="grid md:grid-cols-3 gap-4 mt-6">
                      {exp.highlights.map((highlight, idx) => (
                        <div key={idx} className="bg-blue-500/10 rounded-lg p-4 border border-blue-400/20">
                          <h5 className="text-blue-300 font-semibold text-sm mb-2">{highlight.title}</h5>
                          <p className="text-blue-100 text-xs">{highlight.description}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Technologies */}
                  <div className="mt-6">
                    <div className="flex flex-wrap gap-2">
                      {exp.technologies.slice(0, 8).map((tech, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-slate-800/50 text-blue-200 text-xs rounded border border-blue-500/20"
                        >
                          {tech}
                        </span>
                      ))}
                      {exp.technologies.length > 8 && (
                        <span className="px-3 py-1 text-blue-300 text-xs">
                          +{exp.technologies.length - 8} more
                        </span>
                      )}
                    </div>
                  </div>

                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Certifications */}
        <div className="mt-16">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">🏆 Certifications</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {certifications.map((cert, idx) => (
              <div key={idx} className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
                <h3 className="text-xl font-bold text-white mb-2">{cert.name}</h3>
                <p className="text-blue-200 mb-2">{cert.issuer}</p>
                <p className="text-blue-300 text-sm mb-3">{cert.date}</p>
                <p className="text-blue-100 text-sm">{cert.description}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </main>
  )
}
