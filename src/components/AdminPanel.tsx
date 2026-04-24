import React, { useState, useEffect } from 'react';
import { collection, addDoc, doc, setDoc, deleteDoc, updateDoc, getDocs, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Link } from 'react-router-dom';
import { ChevronLeft, Lock } from 'lucide-react';
import { motion } from 'motion/react';

import { initialMenuItems } from '../App';

const AdminPanel = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Form State
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Desayunos");
  const [description, setDescription] = useState("");
  const [img, setImg] = useState("");

  const fetchMenu = async () => {
    setLoading(true);
    let querySnapshot = await getDocs(collection(db, "menu"));
    
    // Auto-populate firestore with initial items if empty
    if (querySnapshot.empty) {
       for (const item of initialMenuItems) {
          const payload = {
            name: item.name,
            category: item.category,
            description: item.description,
            img: item.img,
            createdAt: Date.now(),
            updatedAt: Date.now()
          };
          await addDoc(collection(db, "menu"), payload);
       }
       querySnapshot = await getDocs(collection(db, "menu"));
    }

    const items = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    setMenuItems(items);
    setLoading(false);
  };

  useEffect(() => {
    if (isAdmin) {
      fetchMenu();
    }
  }, [isAdmin]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === "LaAvenida.admin" && password === "Avenida0646") {
      setIsAdmin(true);
      setLoginError("");
    } else {
      setLoginError("Credenciales incorrectas.");
    }
  };

  const handleLogout = () => {
    setIsAdmin(false);
    setUsername("");
    setPassword("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const now = Date.now();
      const payload: any = {
        name,
        category,
        description,
        img,
        updatedAt: now,
      };

      if (editId) {
        // We cannot modify createdAt
        await updateDoc(doc(db, "menu", editId), payload);
      } else {
        payload.createdAt = now;
        await addDoc(collection(db, "menu"), payload);
      }
      
      // Reset
      setEditId(null);
      setName("");
      setDescription("");
      setImg("");
      fetchMenu();
    } catch (err: any) {
      console.error(err);
      alert("Error saving item: " + err.message);
    }
  };

  const editItem = (item: any) => {
    setEditId(item.id);
    setName(item.name);
    setCategory(item.category);
    setDescription(item.description);
    setImg(item.img);
  };

  const deleteItem = async (id: string) => {
    if (confirm("¿Borrar este plato?")) {
      await deleteDoc(doc(db, "menu", id));
      fetchMenu();
    }
  };

  const loadInitialItems = async () => {
    if (confirm("¿Estás seguro de que quieres cargar los platos por defecto? Esto puede crear duplicados.")) {
       setLoading(true);
       for (const item of initialMenuItems) {
          const payload = {
            name: item.name,
            category: item.category,
            description: item.description,
            img: item.img,
            createdAt: Date.now(),
            updatedAt: Date.now()
          };
          await addDoc(collection(db, "menu"), payload);
       }
       fetchMenu();
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-dark flex flex-col items-center justify-center relative overflow-hidden px-4">
         <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-gold/10 to-transparent pointer-events-none"></div>
         <Link to="/" className="absolute top-8 left-8 text-white/50 hover:text-gold transition-colors flex items-center gap-2 font-sans text-xs uppercase tracking-widest">
            <ChevronLeft size={16} /> Volver
         </Link>
         
         <motion.div 
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           className="w-full max-w-md bg-darker p-8 sm:p-12 rounded-3xl border border-white/5 shadow-2xl relative z-10"
         >
            <div className="w-16 h-16 bg-gold/10 text-gold rounded-full flex items-center justify-center mx-auto mb-6">
               <Lock size={28} />
            </div>
            <h1 className="text-3xl font-serif text-center mb-2 text-white">Panel de Control</h1>
            <p className="text-center text-white/40 font-sans text-sm mb-8">Ingresa tus credenciales para administrar el menú.</p>
            
            <form onSubmit={handleLogin} className="space-y-6">
               <div>
                  <label className="block text-white/60 text-xs uppercase tracking-widest mb-2 font-sans">Usuario</label>
                  <input 
                    type="text" 
                    required
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    className="w-full bg-dark border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-gold transition-colors font-sans"
                    placeholder="LaAvenida.admin"
                  />
               </div>
               <div>
                  <label className="block text-white/60 text-xs uppercase tracking-widest mb-2 font-sans">Contraseña</label>
                  <input 
                    type="password" 
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full bg-dark border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-gold transition-colors font-sans"
                    placeholder="••••••••••"
                  />
               </div>
               {loginError && <p className="text-red-400 text-sm font-sans">{loginError}</p>}
               <button 
                 type="submit"
                 className="w-full bg-gold text-dark py-4 rounded-xl font-sans text-sm uppercase tracking-widest hover:bg-gold-light transition-colors font-semibold"
               >
                 Acceder
               </button>
            </form>
         </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark text-white p-6 md:p-10">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
          <div>
             <h1 className="text-4xl font-serif text-gold mb-2">Administración</h1>
             <p className="font-sans text-white/50 text-sm">Añade, edita o elimina platos del menú</p>
          </div>
          <div className="flex gap-4">
             <button onClick={loadInitialItems} className="border border-gold/50 text-gold px-6 py-2.5 rounded-full hover:bg-gold hover:text-dark transition-colors font-sans text-xs uppercase tracking-widest hidden md:block">
               Cargar Platos por Defecto
             </button>
             <Link to="/" className="border border-white/20 px-6 py-2.5 rounded-full hover:bg-white/5 transition-colors font-sans text-xs uppercase tracking-widest">
               Ver Sitio
             </Link>
             <button onClick={handleLogout} className="bg-white/10 px-6 py-2.5 rounded-full hover:bg-white/20 transition-colors font-sans text-xs uppercase tracking-widest">
               Cerrar Sesión
             </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Form */}
          <div className="lg:col-span-4 bg-darker p-8 rounded-3xl border border-white/5 h-fit">
            <h2 className="text-2xl font-serif mb-6">{editId ? 'Editar Plato' : 'Añadir Nuevo Plato'}</h2>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs uppercase tracking-widest text-white/50 mb-2 font-sans">Nombre del Plato</label>
                <input required value={name} onChange={e=>setName(e.target.value)} className="w-full bg-dark border border-white/10 p-3 rounded-xl focus:border-gold outline-none transition-colors" />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-white/50 mb-2 font-sans">Categoría</label>
                <select value={category} onChange={e=>setCategory(e.target.value)} className="w-full bg-dark border border-white/10 p-3 rounded-xl focus:border-gold outline-none transition-colors">
                  <option>Desayunos</option>
                  <option>Picaderas</option>
                  <option>Platos Principales</option>
                  <option>Bebidas</option>
                </select>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-white/50 mb-2 font-sans">Descripción</label>
                <textarea required value={description} onChange={e=>setDescription(e.target.value)} className="w-full bg-dark border border-white/10 p-3 rounded-xl h-24 focus:border-gold outline-none transition-colors resize-none"></textarea>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-white/50 mb-2 font-sans">URL Fotografía</label>
                <input required value={img} onChange={e=>setImg(e.target.value)} className="w-full bg-dark border border-white/10 p-3 rounded-xl focus:border-gold outline-none transition-colors mb-2" placeholder="https://..." />
                {img && <div className="h-24 w-full rounded-lg overflow-hidden shrink-0"><img src={img} alt="Preview" className="w-full h-full object-cover" /></div>}
              </div>
              <div className="flex gap-3 pt-4">
                 <button type="submit" className="flex-1 bg-gold text-dark py-3 rounded-xl font-sans uppercase text-xs tracking-widest font-semibold hover:bg-gold-light transition-colors">
                   {editId ? 'Actualizar' : 'Publicar Plato'}
                 </button>
                 {editId && <button type="button" onClick={() => {setEditId(null); setName(''); setDescription(''); setImg('');}} className="px-6 border border-white/20 rounded-xl hover:bg-white/5 font-sans text-xs uppercase tracking-widest">Cancelar</button>}
              </div>
            </form>
          </div>

          {/* List */}
          <div className="lg:col-span-8 flex flex-col">
            <h2 className="text-2xl font-serif mb-6">Platos Actuales</h2>
            {loading ? (
               <p className="text-white/50 font-sans">Cargando...</p>
            ) : (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {menuItems.map(item => (
                   <div key={item.id} className="bg-darker border border-white/5 p-4 rounded-2xl flex gap-4 group hover:border-gold/30 transition-colors">
                     <div className="w-32 h-32 shrink-0 overflow-hidden rounded-xl relative">
                       <img src={item.img} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                       <span className="absolute top-2 left-2 bg-dark/80 text-white/80 text-[10px] uppercase tracking-widest px-2 py-1 rounded-md backdrop-blur-sm border border-white/10">{item.category}</span>
                     </div>
                     <div className="flex flex-col flex-1 py-1">
                       <h3 className="font-serif text-xl">{item.name}</h3>
                       <p className="text-white/40 text-xs mt-2 line-clamp-3 font-sans leading-relaxed">{item.description}</p>
                       <div className="flex gap-4 mt-auto pt-4">
                         <button onClick={() => editItem(item)} className="text-white/60 text-xs uppercase tracking-widest hover:text-gold transition-colors font-sans">Editar</button>
                         <button onClick={() => deleteItem(item.id)} className="text-white/40 text-xs uppercase tracking-widest hover:text-red-400 transition-colors font-sans">Borrar</button>
                       </div>
                     </div>
                   </div>
                 ))}
                 {menuItems.length === 0 && (
                   <p className="text-white/40 font-sans col-span-2">No hay platos en el menú. Añade uno desde el panel izquierdo.</p>
                 )}
               </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
