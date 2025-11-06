interface Project {
  id: string
  name: string
  tagline: string
  description: string
  technologies: string[]
  github?: string
  liveDemo?: string
  status: string
  category: string
  featured?: boolean
  metrics?: {
    [key: string]: string
  }
}

interface ProjectCardProps {
  project: Project
}

export default function ProjectCard({ project }: ProjectCardProps) {
  const statusColors = {
    'Production': 'bg-green-500/20 text-green-300 border-green-400/30',
    'In Development': 'bg-yellow-500/20 text-yellow-300 border-yellow-400/30',
    'Completed': 'bg-blue-500/20 text-blue-300 border-blue-400/30',
  }

  const categoryIcons: { [key: string]: string } = {
    'AI/ML': '🤖',
    'Cybersecurity': '🔒',
    'Web Development': '🌐',
    'Education': '📚'
  }

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:border-blue-400/50 transition-all transform hover:scale-105 hover:shadow-xl hover:shadow-blue-500/20 flex flex-col h-full">
      
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-start justify-between mb-3">
          <span className="text-3xl">{categoryIcons[project.category] || '💻'}</span>
          <span className={`px-3 py-1 rounded-full text-xs border ${statusColors[project.status as keyof typeof statusColors] || statusColors.Completed}`}>
            {project.status}
          </span>
        </div>
        <h3 className="text-2xl font-bold text-white mb-2">{project.name}</h3>
        <p className="text-blue-300 text-sm italic mb-3">{project.tagline}</p>
      </div>

      {/* Description */}
      <p className="text-blue-100 mb-4 flex-grow">
        {project.description}
      </p>

      {/* Metrics (if available) */}
      {project.metrics && Object.keys(project.metrics).length > 0 && (
        <div className="mb-4 p-3 bg-blue-500/10 rounded-lg border border-blue-400/20">
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(project.metrics).slice(0, 2).map(([key, value]) => (
              <div key={key} className="text-center">
                <div className="text-white font-semibold text-sm">{value}</div>
                <div className="text-blue-300 text-xs capitalize">{key.replace(/_/g, ' ')}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Technologies */}
      <div className="mb-4">
        <div className="flex flex-wrap gap-2">
          {project.technologies.slice(0, 4).map((tech, idx) => (
            <span
              key={idx}
              className="px-2 py-1 bg-slate-800/50 text-blue-200 text-xs rounded border border-blue-500/20"
            >
              {tech}
            </span>
          ))}
          {project.technologies.length > 4 && (
            <span className="px-2 py-1 text-blue-300 text-xs">
              +{project.technologies.length - 4}
            </span>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 mt-auto pt-4 border-t border-white/10">
        {project.github && (
          <a
            href={project.github}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 px-4 py-2 bg-slate-800/50 hover:bg-slate-800/70 text-blue-200 hover:text-white text-center rounded-lg transition-colors text-sm font-medium border border-blue-500/20 hover:border-blue-400/40"
          >
            GitHub
          </a>
        )}
        {project.liveDemo && (
          <a
            href={project.liveDemo}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-center rounded-lg transition-colors text-sm font-medium"
          >
            Live Demo
          </a>
        )}
      </div>

    </div>
  )
}
