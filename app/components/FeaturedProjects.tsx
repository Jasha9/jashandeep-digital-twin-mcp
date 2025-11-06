import Link from 'next/link'
import projectsData from '@/data/projects.json'
import ProjectCard from './ProjectCard'

export default function FeaturedProjects() {
  const featuredProjects = projectsData.projects.filter(p => p.featured).slice(0, 3)

  return (
    <section className="py-20 px-6">
      <div className="max-w-7xl mx-auto">
        
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Featured Projects
          </h2>
          <p className="text-xl text-blue-200">
            Some of my recent work in AI, web development, and cybersecurity
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {featuredProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>

        <div className="text-center">
          <Link
            href="/projects"
            className="inline-block px-8 py-4 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white font-semibold rounded-lg transition-all border border-white/20 hover:border-white/40"
          >
            View All Projects →
          </Link>
        </div>

      </div>
    </section>
  )
}
