import React, { useState, useEffect } from 'react';
import { Search, Image as ImageIcon, MapPin, Calendar, ExternalLink, Loader2, X } from 'lucide-react';

// --- 1. CONEXÃO: Usamos a mesma configuração do seu sistema original ---
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, collection, getDocs, query, where 
} from 'firebase/firestore';

// Configuração copiada do seu App.jsx original
const firebaseConfig = {
  apiKey: "AIzaSyBcJGFgJqhMUSbBjOAJcUXXT2Cptl8sFDo",
  authDomain: "nugepsistema.firebaseapp.com",
  projectId: "nugepsistema",
  storageBucket: "nugepsistema.firebasestorage.app",
  messagingSenderId: "324001063842",
  appId: "1:324001063842:web:1fb9c00ed1b7dcedff08fb",
  measurementId: "G-J3SHPEQ9S1"
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ID do ambiente (Deve ser igual ao do sistema de gestão)
const appId = 'nugep-oficial'; 

export default function PublicGallery() {
  const [artifacts, setArtifacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);

  // --- 2. BUSCA DE DADOS ---
  useEffect(() => {
    const fetchPublicCollection = async () => {
      try {
        // Conectamos na mesma coleção que o sistema de gestão usa
        const itemsRef = collection(db, 'artifacts', appId, 'public', 'data', 'collection_items');
        
        // Buscamos tudo (num sistema real maior, usaríamos paginação)
        const snapshot = await getDocs(itemsRef);
        
        const loadedItems = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setArtifacts(loadedItems);
      } catch (error) {
        console.error("Erro ao carregar acervo público:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPublicCollection();
  }, []);

  // --- 3. FILTRAGEM (Lógica de Busca) ---
  const filteredArtifacts = artifacts.filter(art => {
    // Filtro de Segurança: Talvez você não queira mostrar itens "Em Restauração"
    const isPublicReady = art.status !== 'Arquivado'; 
    
    // Filtro da Busca do Usuário
    const matchesSearch = 
      art.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      art.artist?.toLowerCase().includes(searchTerm.toLowerCase());

    return isPublicReady && matchesSearch;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 gap-2">
        <Loader2 className="animate-spin" /> Carregando Acervo Digital...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      
      {/* Cabeçalho Público */}
      <header className="bg-slate-900 text-white py-12 px-6 text-center">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Acervo Digital NUGEP</h1>
        <p className="text-slate-400 max-w-2xl mx-auto">Explore nossa coleção de obras de arte, documentos históricos e artefatos preservados.</p>
        
        {/* Barra de Busca */}
        <div className="max-w-md mx-auto mt-8 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20}/>
          <input 
            type="text" 
            placeholder="Pesquisar por título ou artista..." 
            className="w-full pl-12 pr-4 py-3 rounded-full text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/30 shadow-lg"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </header>

      {/* Grid de Obras */}
      <main className="max-w-7xl mx-auto p-6 md:p-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {filteredArtifacts.map((art) => (
            <div 
              key={art.id} 
              onClick={() => setSelectedItem(art)}
              className="bg-white rounded-xl shadow-sm hover:shadow-xl transition-all cursor-pointer group overflow-hidden border border-slate-100"
            >
              {/* Imagem (Thumbnail) */}
              <div className="h-48 bg-slate-100 overflow-hidden relative">
                {art.image ? (
                  <img src={art.image} alt={art.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300">
                    <ImageIcon size={40} />
                  </div>
                )}
                <div className="absolute top-2 right-2 bg-black/60 text-white text-[10px] font-bold px-2 py-1 rounded backdrop-blur-sm uppercase">
                  {art.type}
                </div>
              </div>
              
              {/* Informações Básicas */}
              <div className="p-5">
                <h3 className="font-bold text-lg text-slate-800 leading-tight mb-1 group-hover:text-blue-700 transition-colors">
                  {art.title}
                </h3>
                <p className="text-sm text-slate-500 font-serif italic mb-3">
                  {art.artist}, {art.year}
                </p>
                <div className="flex items-center gap-2 text-xs text-slate-400 mt-2 border-t pt-3">
                  <MapPin size={12}/> {art.status === 'Exposto' ? `Em Exposição: ${art.location}` : 'Acervo Reserva'}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredArtifacts.length === 0 && (
          <div className="text-center py-20 text-slate-400">
            <p className="text-lg">Nenhuma obra encontrada para "{searchTerm}".</p>
          </div>
        )}
      </main>

      {/* Modal de Detalhes (Visualização Pública) */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setSelectedItem(null)}>
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedItem(null)} className="absolute top-4 right-4 p-2 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors">
              <X size={20} />
            </button>

            <div className="grid md:grid-cols-2">
              <div className="bg-slate-100 min-h-[300px] md:min-h-full flex items-center justify-center p-8">
                {selectedItem.image ? (
                  <img src={selectedItem.image} alt={selectedItem.title} className="max-w-full max-h-[70vh] shadow-2xl rounded" />
                ) : (
                  <ImageIcon size={64} className="text-slate-300" />
                )}
              </div>

              <div className="p-8 md:p-12 space-y-6">
                <div>
                  <h2 className="text-3xl font-bold text-slate-900 mb-2">{selectedItem.title}</h2>
                  <p className="text-xl text-slate-500 font-serif italic">{selectedItem.artist}</p>
                </div>

                <div className="flex gap-4 text-sm">
                   <div className="bg-slate-50 px-3 py-2 rounded border border-slate-100">
                     <span className="block text-[10px] font-bold uppercase text-slate-400">Ano</span>
                     {selectedItem.year}
                   </div>
                   <div className="bg-slate-50 px-3 py-2 rounded border border-slate-100">
                     <span className="block text-[10px] font-bold uppercase text-slate-400">Técnica/Tipo</span>
                     {selectedItem.type}
                   </div>
                </div>

                <div>
                  <h4 className="font-bold text-sm uppercase text-slate-400 mb-2">Sobre a Obra</h4>
                  <p className="text-slate-700 leading-relaxed">
                    {selectedItem.description || "Nenhuma descrição disponível para esta obra."}
                  </p>
                </div>

                {/* Exemplo de metadados públicos seguros */}
                <div className="pt-6 border-t border-slate-100">
                  <h4 className="font-bold text-xs uppercase text-slate-400 mb-2">Dados de Catálogo</h4>
                  <p className="text-xs text-slate-500 font-mono">Registro: {selectedItem.regNumber}</p>
                  <p className="text-xs text-slate-500 mt-1">Status: {selectedItem.status}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
