import { Metadata } from 'next'
import projectsData from '@/data/projects.json'
import ProjectCard from '../components/ProjectCard'

export const metadata: Metadata = {
  title: 'Projects | Jashandeep Kaur',
  description: 'Explore my portfolio of AI, web development, and cybersecurity projects including Digital Twin MCP Server, Food RAG Explorer, and more.',
}

export default function ProjectsPage() {
  const { projects } = projectsData
  const featuredProjects = projects.filter(p => p.featured)
  const otherProjects = projects.filter(p => !p.featured)

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="max-w-7xl mx-auto px-6 py-20">
        
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            My Projects
          </h1>
          <p className="text-xl text-blue-200 max-w-3xl mx-auto">
            A showcase of AI systems, web applications, and cybersecurity tools I&apos;ve built
          </p>
        </div>

        {/* Featured Projects */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-white mb-8 flex items-center">
            <span className="text-yellow-400 mr-3">⭐</span>
            Featured Projects
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        </div>

        {/* Other Projects */}
        {otherProjects.length > 0 && (
          <div>
            <h2 className="text-3xl font-bold text-white mb-8">Other Projects</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {otherProjects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          </div>
        )}

        {/* Call to Action */}
        <div className="mt-16 text-center bg-white/10 backdrop-blur-lg rounded-2xl p-12 border border-white/20">
          <h3 className="text-2xl font-bold text-white mb-4">
            Want to see more?
          </h3>
          <p className="text-blue-200 mb-6">
            Check out my GitHub for additional projects and open-source contributions
          </p>
          <a
            href="https://github.com/Jasha9"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
          >
            Visit My GitHub
          </a>
        </div>

      </div>
    </main>
  )
}
