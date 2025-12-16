import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, Image as ImageIcon, MapPin, Calendar, X, 
  Filter, ChevronDown, SlidersHorizontal, ArrowUpRight,
  BookOpen, Landmark, RotateCcw, ShieldAlert
} from 'lucide-react';

// --- CONEXÃO FIREBASE ---
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, getDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBcJGFgJqhMUSbBjOAJcUXXT2Cptl8sFDo",
  authDomain: "nugepsistema.firebaseapp.com",
  projectId: "nugepsistema",
  storageBucket: "nugepsistema.firebasestorage.app",
  messagingSenderId: "324001063842",
  appId: "1:324001063842:web:1fb9c00ed1b7dcedff08fb",
  measurementId: "G-J3SHPEQ9S1"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const appId = 'nugep-oficial'; 

export default function PublicGallery() {
  // --- ESTADOS ---
  const [artifacts, setArtifacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  
  // Estado de Configuração de Privacidade (Padrão: tudo oculto por segurança)
  const [viewSettings, setViewSettings] = useState({
    showLocation: false,
    showProvenance: false,
    showRegNumber: false,
    showCondition: false,
    showAcquisition: false
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({ type: '', location: '', year: '', status: '' });
  const [sortBy, setSortBy] = useState('title');
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // --- BUSCA DE DADOS E CONFIGURAÇÕES ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Busca as Configurações de Privacidade do Admin
        // Caminho: artifacts -> ID -> public -> settings -> visibility
        const settingsRef = doc(db, 'artifacts', appId, 'public', 'data', 'settings_visibility');
        const settingsSnap = await getDoc(settingsRef);
        
        if (settingsSnap.exists()) {
          setViewSettings(settingsSnap.data());
        }

        // 2. Busca o Acervo
        const itemsRef = collection(db, 'artifacts', appId, 'public', 'data', 'collection_items');
        const snapshot = await getDocs(itemsRef);
        const loadedItems = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setArtifacts(loadedItems);
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // --- LÓGICA DE FILTROS (Mantida) ---
  const filterOptions = useMemo(() => {
    const types = [...new Set(artifacts.map(a => a.type).filter(Boolean))].sort();
    // Só mostra locais no filtro se a configuração permitir visualizar locais
    const locations = viewSettings.showLocation 
      ? [...new Set(artifacts.map(a => a.location).filter(Boolean))].sort()
      : [];
    const years = [...new Set(artifacts.map(a => a.year).filter(Boolean))].sort((a,b) => b - a);
    return { types, locations, years };
  }, [artifacts, viewSettings.showLocation]);

  const filteredAndSortedArtifacts = useMemo(() => {
    return artifacts
      .filter(art => {
        if (art.status === 'Arquivado') return false;

        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = 
          art.title?.toLowerCase().includes(searchLower) ||
          art.artist?.toLowerCase().includes(searchLower) ||
          (viewSettings.showRegNumber && art.regNumber?.toLowerCase().includes(searchLower)); // Só busca por registro se estiver visível

        const matchesType = filters.type ? art.type === filters.type : true;
        const matchesLocation = filters.location ? art.location === filters.location : true;
        const matchesYear = filters.year ? art.year.toString() === filters.year : true;

        return matchesSearch && matchesType && matchesLocation && matchesYear;
      })
      .sort((a, b) => {
        if (sortBy === 'year_desc') return (b.year || 0) - (a.year || 0);
        if (sortBy === 'year_asc') return (a.year || 0) - (b.year || 0);
        return a.title?.localeCompare(b.title);
      });
  }, [artifacts, searchTerm, filters, sortBy, viewSettings]);

  const clearFilters = () => {
    setFilters({ type: '', location: '', year: '', status: '' });
    setSearchTerm('');
    setSortBy('title');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="w-12 h-12 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
        <p className="text-slate-500 font-medium animate-pulse">Sincronizando com o museu...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col">
      
      {/* HEADER HERO */}
      <header className="bg-slate-900 text-white pt-10 pb-20 px-6 relative overflow-hidden shadow-xl">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        <div className="max-w-7xl mx-auto relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-indigo-500/20 p-2 rounded-lg backdrop-blur-sm border border-indigo-500/30">
                <Landmark className="text-indigo-400" size={24} />
              </div>
              <span className="text-indigo-300 uppercase tracking-widest text-xs font-bold">Patrimônio Digital</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-2 bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              Acervo NUGEP
            </h1>
            <p className="text-slate-400 max-w-xl text-lg">Coleção pública para consulta e pesquisa.</p>
          </div>
        </div>
      </header>

      {/* SEARCH BAR */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full -mt-8 relative z-20">
        <div className="bg-white rounded-xl shadow-lg border border-slate-100 p-2 md:p-4 flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20}/>
            <input 
              type="text" 
              placeholder="Busque por título, artista..." 
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <button className="md:hidden w-full flex items-center justify-center gap-2 py-3 bg-slate-100 rounded-lg font-bold text-slate-700" onClick={() => setShowMobileFilters(!showMobileFilters)}>
            <SlidersHorizontal size={18} /> Filtros
          </button>

          <div className="hidden md:flex items-center gap-3">
             <div className="h-8 w-px bg-slate-200 mx-2"></div>
             <div className="relative group">
               <select className="appearance-none bg-transparent pl-3 pr-8 py-2 font-medium text-slate-700 cursor-pointer focus:outline-none hover:text-indigo-600" value={filters.type} onChange={(e) => setFilters({...filters, type: e.target.value})}>
                 <option value="">Todos os Tipos</option>
                 {filterOptions.types.map(t => <option key={t} value={t}>{t}</option>)}
               </select>
               <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
             </div>
             <div className="relative group">
               <select className="appearance-none bg-transparent pl-3 pr-8 py-2 font-medium text-slate-700 cursor-pointer focus:outline-none hover:text-indigo-600" value={filters.year} onChange={(e) => setFilters({...filters, year: e.target.value})}>
                 <option value="">Qualquer Ano</option>
                 {filterOptions.years.map(y => <option key={y} value={y}>{y}</option>)}
               </select>
               <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
             </div>
          </div>
        </div>

        {showMobileFilters && (
          <div className="md:hidden mt-2 bg-white rounded-xl shadow-lg border border-slate-100 p-4 space-y-4">
            {/* Mobile filters implementation... */}
            <button onClick={clearFilters} className="w-full py-2 text-red-500 text-sm font-bold border border-red-100 rounded-lg hover:bg-red-50">Limpar Filtros</button>
          </div>
        )}
      </div>

      {/* MAIN CONTENT */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-8 flex gap-8">
        
        {/* SIDEBAR FILTERS (Condicional: Só mostra Local se permitido) */}
        <aside className="hidden lg:block w-64 space-y-8 sticky top-8 h-fit">
          {viewSettings.showLocation && filterOptions.locations.length > 0 && (
            <div>
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Filter size={18} className="text-indigo-600"/> Localização</h3>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input type="radio" name="loc" className="accent-indigo-600" checked={filters.location === ''} onChange={() => setFilters({...filters, location: ''})} />
                  <span className="text-sm text-slate-600 group-hover:text-indigo-600">Todos os locais</span>
                </label>
                {filterOptions.locations.map(loc => (
                  <label key={loc} className="flex items-center gap-2 cursor-pointer group">
                    <input type="radio" name="loc" className="accent-indigo-600" checked={filters.location === loc} onChange={() => setFilters({...filters, location: loc})} />
                    <span className="text-sm truncate text-slate-600 group-hover:text-indigo-600">{loc}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
          <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
            <h4 className="text-xs font-bold text-indigo-800 uppercase mb-2 flex items-center gap-1"><ShieldAlert size={12}/> Política de Dados</h4>
            <p className="text-xs text-indigo-600 leading-relaxed">
              Exibindo versão pública do acervo. Informações sensíveis ou administrativas podem estar ocultas conforme diretrizes da instituição.
            </p>
          </div>
          {(filters.type || filters.location || filters.year || searchTerm) && (
             <button onClick={clearFilters} className="flex items-center gap-2 text-sm text-red-500 hover:text-red-700 font-medium group"><RotateCcw size={14}/> Resetar Filtros</button>
          )}
        </aside>

        {/* GRID RESULTS */}
        <div className="flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredAndSortedArtifacts.map((art) => (
              <div key={art.id} onClick={() => setSelectedItem(art)} className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-slate-100 cursor-pointer flex flex-col">
                <div className="aspect-[4/3] bg-slate-100 relative overflow-hidden">
                  {art.image ? (
                    <img src={art.image} alt={art.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 bg-slate-50"><ImageIcon size={40} className="mb-2 opacity-50"/><span className="text-xs uppercase font-bold tracking-widest opacity-50">Sem Imagem</span></div>
                  )}
                  <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-indigo-900 shadow-sm border border-white/50">{art.type}</div>
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <div className="mb-auto">
                    <h3 className="font-bold text-lg text-slate-800 leading-snug mb-1 group-hover:text-indigo-700 transition-colors line-clamp-2">{art.title}</h3>
                    <p className="text-sm text-slate-500 font-serif italic mb-3">{art.artist || "Artista Desconhecido"}, {art.year || "S/D"}</p>
                  </div>
                  <div className="pt-4 mt-2 border-t border-slate-50 flex items-center justify-between text-xs text-slate-400">
                    {/* Renderização Condicional da Localização no Card */}
                    {viewSettings.showLocation ? (
                       <span className="flex items-center gap-1"><MapPin size={12}/> {art.location === 'Externo' ? 'Empréstimo' : art.location}</span>
                    ) : (
                       <span className="flex items-center gap-1"><Landmark size={12}/> Acervo Nugep</span>
                    )}
                    {viewSettings.showRegNumber && <span className="font-mono opacity-60">#{art.regNumber}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
          {filteredAndSortedArtifacts.length === 0 && (
            <div className="text-center py-24 bg-white rounded-xl border border-dashed border-slate-300">
              <BookOpen size={48} className="mx-auto text-slate-300 mb-4" />
              <h3 className="text-lg font-bold text-slate-700 mb-1">Nenhum resultado encontrado</h3>
              <p className="text-slate-500 mb-6">Tente ajustar seus filtros.</p>
              <button onClick={clearFilters} className="text-indigo-600 font-bold hover:underline">Limpar busca</button>
            </div>
          )}
        </div>
      </main>

      <footer className="bg-white border-t border-slate-200 py-8 mt-auto text-center">
        <p className="text-sm text-slate-500 font-serif italic">© 2025 NUGEP - Núcleo de Gestão de Patrimônio.</p>
      </footer>

      {/* MODAL DETALHES */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" style={{zIndex: 9999}}>
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setSelectedItem(null)}></div>
          <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden shadow-2xl relative z-10 flex flex-col md:flex-row animate-in fade-in zoom-in-95 duration-200">
            <button onClick={() => setSelectedItem(null)} className="absolute top-4 right-4 z-20 p-2 bg-white/80 hover:bg-white rounded-full text-slate-800 transition-colors shadow-sm"><X size={24} /></button>
            <div className="w-full md:w-1/2 bg-slate-100 flex items-center justify-center p-8 relative group overflow-hidden">
               {selectedItem.image ? <img src={selectedItem.image} alt={selectedItem.title} className="max-w-full max-h-[60vh] md:max-h-[80vh] shadow-2xl object-contain" /> : <ImageIcon size={64} className="opacity-50 text-slate-400"/>}
            </div>
            <div className="w-full md:w-1/2 overflow-y-auto bg-white p-8 md:p-10">
              <div className="mb-8">
                 <div className="flex gap-2 mb-3">
                   <span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">{selectedItem.type}</span>
                   {/* Só mostra 'Em Exposição' se a localização for pública */}
                   {viewSettings.showLocation && selectedItem.status === 'Exposto' && <span className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">Em Exposição</span>}
                 </div>
                 <h2 className="text-3xl md:text-4xl font-bold text-slate-900 leading-tight mb-2">{selectedItem.title}</h2>
                 <p className="text-xl text-slate-500 font-serif italic">{selectedItem.artist}</p>
              </div>

              <div className="space-y-8">
                <div>
                   <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 border-b pb-1">Ficha Técnica</h3>
                   <div className="grid grid-cols-2 gap-4">
                      <div><span className="block text-xs text-slate-400 uppercase">Ano</span><span className="text-slate-800 font-medium">{selectedItem.year || "Não datado"}</span></div>
                      <div><span className="block text-xs text-slate-400 uppercase">Técnica</span><span className="text-slate-800 font-medium">{selectedItem.customFields?.find(f => f.label === 'Material')?.value || selectedItem.type}</span></div>
                      
                      {/* --- CAMPOS PROTEGIDOS PELA CONFIGURAÇÃO --- */}
                      
                      {viewSettings.showLocation && (
                        <div><span className="block text-xs text-slate-400 uppercase">Localização</span><span className="text-slate-800 font-medium">{selectedItem.location}</span></div>
                      )}
                      
                      {viewSettings.showRegNumber && (
                        <div><span className="block text-xs text-slate-400 uppercase">Registro</span><span className="font-mono text-slate-600 text-sm bg-slate-100 px-2 py-0.5 rounded w-fit">{selectedItem.regNumber}</span></div>
                      )}

                      {viewSettings.showCondition && (
                        <div><span className="block text-xs text-slate-400 uppercase">Estado</span><span className="text-slate-800 font-medium">{selectedItem.condition}</span></div>
                      )}
                   </div>
                </div>

                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 border-b pb-1">Descrição</h3>
                  <p className="text-slate-700 leading-relaxed text-sm md:text-base">{selectedItem.description || "Descrição não disponível."}</p>
                </div>

                {/* PROVENIÊNCIA PROTEGIDA */}
                {viewSettings.showProvenance && selectedItem.provenance && (
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                    <h4 className="text-xs font-bold text-slate-500 uppercase mb-1">Histórico / Procedência</h4>
                    <p className="text-sm text-slate-600 italic">{selectedItem.provenance}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
