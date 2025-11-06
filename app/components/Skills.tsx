import aboutData from '@/data/about.json'

export default function Skills() {
  const { skills } = aboutData

  return (
    <section className="py-20 px-6">
      <div className="max-w-6xl mx-auto">
        
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Technical Skills
          </h2>
          <p className="text-xl text-blue-200">
            Technologies and tools I work with
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {Object.entries(skills).map(([category, skillList]) => (
            <div 
              key={category}
              className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 hover:border-blue-400/50 transition-all hover:transform hover:scale-105"
            >
              <h3 className="text-2xl font-bold text-blue-300 mb-6 capitalize">
                {category === 'aiml' ? 'AI/ML' : category}
              </h3>
              <div className="flex flex-wrap gap-2">
                {(skillList as string[]).map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-2 bg-blue-500/20 text-blue-100 rounded-lg text-sm border border-blue-400/30"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}
