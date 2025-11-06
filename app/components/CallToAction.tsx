import Link from 'next/link'

export default function CallToAction() {
  return (
    <section className="py-20 px-6">
      <div className="max-w-4xl mx-auto">
        
        <div className="bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-blue-500/20 backdrop-blur-lg rounded-3xl p-12 md:p-16 border border-white/20 text-center">
          
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Let&apos;s Work Together
          </h2>
          
          <p className="text-xl text-blue-200 mb-10 max-w-2xl mx-auto">
            I&apos;m currently open to new opportunities. Whether you have a project in mind or just want to connect, I&apos;d love to hear from you!
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all transform hover:scale-105 shadow-lg shadow-blue-500/50"
            >
              Get In Touch
            </Link>
            
            <a
              href="https://github.com/Jasha9"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white font-semibold rounded-lg transition-all border border-white/20 hover:border-white/40"
            >
              View GitHub Profile
            </a>
          </div>

        </div>

      </div>
    </section>
  )
}
