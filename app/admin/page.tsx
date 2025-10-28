import AdminUpload from '../components/AdminUpload'

export default function AdminPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 p-8">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            ⚙️ Digital Twin Admin
          </h1>
          <p className="text-xl text-gray-600">
            Manage your digital twin data
          </p>
        </header>
        
        <AdminUpload />
      </div>
    </main>
  )
}