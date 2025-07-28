'use client'

im  <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Produtos de Energia Solar
        </h1>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Mock Product Cards */}
          {[1, 2, 3, 4, 5, 6].map((id) => (
            <div key={id} className="bg-white rounded-lg shadow-md p-6">
              <div className="h-48 bg-gray-200 rounded-lg mb-4 flex items-center justify-center">
                <span className="text-gray-500">Produto {id}</span>
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Painel Solar {id}00W
              </h3>
              
              <p className="text-gray-600 text-sm mb-4">
                Painel solar monocristalino de alta eficiência
              </p>
              
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-orange-600">
                  R$ {(id * 500).toLocaleString()}
                </span>
                <button className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600">
                  Ver Detalhes
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}