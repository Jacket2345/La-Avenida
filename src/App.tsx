import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, Clock, Phone, Navigation, Instagram, Menu, X, ChevronRight, Star, MessageSquare } from 'lucide-react';
import { Routes, Route, Link } from 'react-router-dom';
import AdminPanel from './components/AdminPanel';
import { db, auth } from './firebase';
import { collection, onSnapshot, addDoc, getDocs } from 'firebase/firestore';

interface Review {
  id: string | number;
  author: string;
  rating: number;
  comment: string;
}

interface MenuItem {
  id: string;
  category: string;
  name: string;
  description: string;
  img: string;
  reviews: Review[];
}

export const initialMenuItems: MenuItem[] = [
  {
    id: "m1", category: "Desayunos", name: "Pancakes Especiales", 
    description: "Esponjosos pancakes servidos con huevos al gusto, tocino crujiente, y fresas frescas.", 
    img: "https://images.unsplash.com/photo-1551782450-a2132b4ba21d?auto=format&fit=crop&q=80&w=800",
    reviews: [{ id: 1, author: "María G.", rating: 5, comment: "Excelente desayuno, la porción es perfecta." }]
  },
  {
    id: "m2", category: "Picaderas", name: "Picadera Mixta", 
    description: "Surtido de carnes fritas, tostones de la casa, papas fritas y nuestra salsa especial. Ideal para compartir.", 
    img: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&q=80&w=800",
    reviews: [{ id: 2, author: "José P.", rating: 4, comment: "Muy buena carne, excelente fritura." }]
  },
  {
    id: "m3", category: "Picaderas", name: "Chicharrón con Tostones", 
    description: "Cerdo crujiente al estilo dominicano, acompañado de tostones recién hechos.", 
    img: "https://images.unsplash.com/photo-1604908177453-7462950a6a3b?auto=format&fit=crop&q=80&w=800",
    reviews: []
  },
  {
    id: "m9", category: "Picaderas", name: "Empanadas Artesanales", 
    description: "Deliciosas empanadas fritas crujientes, ideales para compartir.", 
    img: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&q=80&w=800",
    reviews: []
  },
  {
    id: "m4", category: "Platos Principales", name: "Salmón a las Hierbas", 
    description: "Filete de salmón fresco sazonado, acompañado de vegetales asados.", 
    img: "https://images.unsplash.com/photo-1485921325833-c519f76c4927?auto=format&fit=crop&q=80&w=800",
    reviews: [{ id: 3, author: "Laura F.", rating: 5, comment: "El salmón estaba en su punto, riquísimo." }]
  },
  {
    id: "m5", category: "Platos Principales", name: "Pescado Frito", 
    description: "Pescado frito servido con crujientes papas fritas, tostones y su limón.", 
    img: "https://images.unsplash.com/photo-1544025162-811cce4bce36?auto=format&fit=crop&q=80&w=800",
    reviews: []
  },
  {
    id: "m6", category: "Platos Principales", name: "Club Sandwich Clásico", 
    description: "Delicioso sandwich en tres capas con pollo, jamón, queso y papas fritas.", 
    img: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&q=80&w=800",
    reviews: []
  },
  {
    id: "m10", category: "Platos Principales", name: "Tacos de la Casa", 
    description: "Tacos elaborados con ingredientes frescos, servidos con papas fritas.", 
    img: "https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?auto=format&fit=crop&q=80&w=800",
    reviews: []
  },
  {
    id: "m7", category: "Bebidas", name: "Mojito La Avenida", 
    description: "Clásico mojito refrescante, hecho con hierbabuena fresca, azúcar y ron.", 
    img: "https://images.unsplash.com/photo-1551538827-9c037cb4f32a?auto=format&fit=crop&q=80&w=800",
    reviews: [{ id: 4, author: "Carlos M.", rating: 5, comment: "El mejor mojito de Bonao!" }]
  },
  {
    id: "m8", category: "Bebidas", name: "Cócteles Tropicales", 
    description: "Elaborados por nuestros mixólogos, llenos de colorido y frescura.", 
    img: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&q=80&w=800",
    reviews: []
  },
  {
    id: "m11", category: "Bebidas", name: "Cervezas Nacionales e Importadas", 
    description: "Cervezas bien frías, la mejor opción para acompañar tus platos.", 
    img: "https://images.unsplash.com/photo-1614316104085-f55a12d3d9d3?auto=format&fit=crop&q=80&w=800",
    reviews: []
  }
];

const H2 = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
  <h2 className={`font-serif font-light text-4xl md:text-5xl lg:text-6xl text-white ${className}`}>
    {children}
  </h2>
);

function Home() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [activeCategory, setActiveCategory] = useState("Todos");
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedItemForReview, setSelectedItemForReview] = useState<MenuItem | null>(null);
  const [newReview, setNewReview] = useState({ author: '', rating: 5, comment: '' });

  // Sync menu from firestore
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'menu'), async (snap) => {
      const items: MenuItem[] = [];
      for (const docSnap of snap.docs) {
        const data = docSnap.data();
        let reviews: Review[] = [];
        try {
          const revSnap = await getDocs(collection(db, `menu/${docSnap.id}/reviews`));
          reviews = revSnap.docs.map(r => ({ id: r.id, ...r.data() } as Review));
        } catch (e) {}

        items.push({
          id: docSnap.id,
          category: data.category,
          name: data.name,
          description: data.description,
          img: data.img,
          reviews
        });
      }
      setMenuItems(items.length > 0 ? items : initialMenuItems);
    });
    return () => unsub();
  }, []);
  
  const categories = ["Todos", "Desayunos", "Picaderas", "Platos Principales", "Bebidas"];
  
  const filteredMenu = activeCategory === "Todos" 
    ? menuItems 
    : menuItems.filter(item => item.category === activeCategory);

  const getAverageRating = (reviews: Review[]) => {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, rev) => acc + rev.rating, 0);
    return (sum / reviews.length).toFixed(1);
  };

  const handleAddReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemForReview || !newReview.author || !newReview.comment) return;
    
    try {
      await addDoc(collection(db, `menu/${selectedItemForReview.id}/reviews`), {
        author: newReview.author,
        rating: newReview.rating,
        comment: newReview.comment,
        createdAt: Date.now()
      });
      // The onSnapshot listener will pick this up eventually or we can manually update local state for fast UI changes.
      setNewReview({ author: '', rating: 5, comment: '' });
      // Update selected item directly so modal updates instantly
      setSelectedItemForReview(prev => prev ? {
        ...prev,
        reviews: [...prev.reviews, { id: Date.now().toString(), ...newReview }]
      } : null);
    } catch (e) {
      console.error(e);
      alert("Error al enviar la reseña.");
    }
  };

  const openReviewModal = (item: MenuItem) => {
    setSelectedItemForReview(item);
    setShowReviewModal(true);
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const smoothTransition = { duration: 1.2, ease: [0.22, 1, 0.36, 1] };
  const springTransition = { type: "spring", damping: 30, stiffness: 200 };

  const fadeIn = {
    initial: { opacity: 0, y: 30 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-100px" },
    transition: smoothTransition
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const staggerItem = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: smoothTransition }
  };

  const schedule = [
    { day: "Lunes", hours: "8 a.m. – 12 a.m." },
    { day: "Martes", hours: "6 a.m. – 2 a.m." },
    { day: "Miércoles", hours: "6 a.m. – 2 a.m." },
    { day: "Jueves", hours: "6 a.m. – 2 a.m." },
    { day: "Viernes", hours: "6 a.m. – 3 a.m." },
    { day: "Sábado", hours: "6 a.m. – 3 a.m." },
    { day: "Domingo", hours: "6 a.m. – 2 a.m." },
  ];

  return (
    <div className="min-h-screen bg-dark text-light selection:bg-gold selection:text-dark">
      {/* Navbar segment */}
      <nav 
        className={`fixed w-full z-50 transition-all duration-500 ${
          isScrolled || mobileMenuOpen ? 'bg-darker/95 backdrop-blur-md py-4 border-b border-white/5' : 'bg-transparent py-6'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="text-xl md:text-2xl font-serif tracking-widest text-white uppercase">
            La Avenida <span className="text-gold hidden sm:inline">&</span> Club
          </div>
          
          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-10">
            <a href="/#experiencia" className="text-sm font-sans uppercase tracking-[0.15em] text-white/70 hover:text-gold transition-colors relative group">
              La Experiencia
              <span className="absolute -bottom-2 left-1/2 w-0 h-[1px] bg-gold -translate-x-1/2 group-hover:w-full transition-all duration-300"></span>
            </a>
            <a href="/#menu" className="text-sm font-sans uppercase tracking-[0.15em] text-white/70 hover:text-gold transition-colors relative group">
              Menú
              <span className="absolute -bottom-2 left-1/2 w-0 h-[1px] bg-gold -translate-x-1/2 group-hover:w-full transition-all duration-300"></span>
            </a>
            <a href="/#horarios" className="text-sm font-sans uppercase tracking-[0.15em] text-white/70 hover:text-gold transition-colors relative group">
              Horarios
              <span className="absolute -bottom-2 left-1/2 w-0 h-[1px] bg-gold -translate-x-1/2 group-hover:w-full transition-all duration-300"></span>
            </a>
            <a href="/#contacto" className="text-sm font-sans uppercase tracking-[0.15em] text-white/70 hover:text-gold transition-colors relative group">
              Contacto
              <span className="absolute -bottom-2 left-1/2 w-0 h-[1px] bg-gold -translate-x-1/2 group-hover:w-full transition-all duration-300"></span>
            </a>
            <Link to="/admin" className="text-sm font-sans uppercase tracking-[0.15em] text-white/30 hover:text-gold transition-colors ml-4">Admin</Link>
            <a 
              href="tel:+18095252585" 
              className="border border-gold text-gold px-6 py-2.5 rounded-full text-xs font-sans uppercase tracking-[0.2em] hover:bg-gold hover:text-dark transition-all duration-300 shadow-[0_0_15px_rgba(212,175,55,0.1)] hover:shadow-[0_0_20px_rgba(212,175,55,0.3)] bg-gold/5"
            >
              Reservar
            </a>
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            className="md:hidden text-white" 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </nav>

      {/* Mobile Nav Overlay */}
      <AnimatePresence mode="wait">
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
            animate={{ opacity: 1, backdropFilter: "blur(12px)" }}
            exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-40 bg-darker/80 pt-24 px-6 md:hidden flex flex-col"
          >
            <motion.div 
              initial="hidden"
              animate="show"
              variants={staggerContainer}
              className="flex flex-col gap-6 text-2xl font-serif mt-10"
            >
              <motion.a variants={staggerItem} href="/#experiencia" onClick={() => setMobileMenuOpen(false)} className="text-white/80 hover:text-gold flex items-center justify-between border-b border-white/10 pb-4 group">
                La Experiencia <ChevronRight size={20} className="text-gold group-hover:translate-x-1 transition-transform"/>
              </motion.a>
              <motion.a variants={staggerItem} href="/#menu" onClick={() => setMobileMenuOpen(false)} className="text-white/80 hover:text-gold flex items-center justify-between border-b border-white/10 pb-4 group">
                Menú <ChevronRight size={20} className="text-gold group-hover:translate-x-1 transition-transform"/>
              </motion.a>
              <motion.a variants={staggerItem} href="/#horarios" onClick={() => setMobileMenuOpen(false)} className="text-white/80 hover:text-gold flex items-center justify-between border-b border-white/10 pb-4 group">
                Horarios <ChevronRight size={20} className="text-gold group-hover:translate-x-1 transition-transform"/>
              </motion.a>
              <motion.a variants={staggerItem} href="/#contacto" onClick={() => setMobileMenuOpen(false)} className="text-white/80 hover:text-gold flex items-center justify-between border-b border-white/10 pb-4 group">
                Contacto <ChevronRight size={20} className="text-gold group-hover:translate-x-1 transition-transform"/>
              </motion.a>
              <motion.div variants={staggerItem}>
                <Link to="/admin" onClick={() => setMobileMenuOpen(false)} className="text-white/80 hover:text-gold flex items-center justify-between border-b border-white/10 pb-4 group">
                  Admin <ChevronRight size={20} className="text-gold group-hover:translate-x-1 transition-transform"/>
                </Link>
              </motion.div>
              <motion.a variants={staggerItem} href="tel:+18095252585" className="text-gold mt-4 font-sans tracking-widest text-lg uppercase flex items-center gap-3">
                <Phone size={18} /> +1(809)525-2585
              </motion.a>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <header className="relative h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1549488344-1f9b8d2bd1f3?auto=format&fit=crop&q=80&w=2070" 
            alt="Terraza elegante y luces nocturnas" 
            className="w-full h-full object-cover scale-105 transform hover:scale-110 transition-transform duration-[20s]"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-dark/80 via-darker/70 to-dark"></div>
          
          {/* Animated decorative orb */}
          <motion.div 
            animate={{ 
              opacity: [0.1, 0.3, 0.1],
              scale: [1, 1.2, 1],
              x: [0, 50, 0],
              y: [0, -50, 0]
            }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-gold/10 rounded-full blur-[100px] pointer-events-none mix-blend-screen"
          />
        </div>
        
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto mt-20">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="show"
          >
            <motion.div variants={staggerItem} className="inline-flex items-center gap-4 mb-6 sm:mb-8 border border-white/10 px-6 py-2 rounded-full backdrop-blur-sm bg-white/5 mx-auto">
              <div className="w-2 h-2 rounded-full bg-gold animate-pulse"></div>
              <span className="text-white/80 text-[10px] sm:text-xs font-sans uppercase tracking-[0.4em] font-medium">Bonao, República Dominicana</span>
            </motion.div>
            <motion.h1 variants={staggerItem} className="text-6xl sm:text-7xl md:text-8xl lg:text-[10rem] font-serif text-white leading-[0.8] tracking-tight mb-8 drop-shadow-2xl">
              La <br/> <span className="italic font-light text-white/90">Avenida</span>
            </motion.h1>
            <motion.p variants={staggerItem} className="text-gold font-serif text-2xl sm:text-4xl italic font-light mb-12 max-w-2xl mx-auto drop-shadow-lg">
              Terrace & Club
            </motion.p>
            <motion.div variants={staggerItem}>
              <a 
                href="#contacto"
                className="inline-flex items-center gap-3 px-10 py-5 bg-gold text-dark border border-gold hover:bg-gold-light transition-all duration-300 rounded-full font-sans uppercase tracking-widest text-xs font-semibold overflow-hidden group"
              >
                <span className="relative z-10 flex items-center gap-2">Ubicación y Horarios <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" /></span>
              </a>
            </motion.div>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 1 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <div className="w-[1px] h-16 bg-white/20 relative overflow-hidden">
            <motion.div 
              animate={{ y: [0, 64] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
              className="absolute top-0 left-0 w-full h-1/2 bg-gold"
            ></motion.div>
          </div>
        </motion.div>
      </header>

      {/* Intro / Experiencia */}
      <section id="experiencia" className="py-24 md:py-40 px-6 relative bg-dark overflow-hidden">
        {/* Background glow */}
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-gold/5 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col lg:flex-row gap-16 lg:gap-24 items-center">
            <motion.div {...fadeIn} className="flex-1 space-y-10">
              <div className="flex items-center gap-4">
                <div className="h-[1px] w-12 bg-gold"></div>
                <span className="uppercase text-gold font-sans tracking-[0.2em] text-xs font-semibold">El Ambiente</span>
              </div>
              <H2 className="leading-[1.1]">La mezcla perfecta entre <span className="italic text-white/70">elegancia</span> y vida nocturna.</H2>
              <p className="font-sans text-white/50 leading-relaxed font-light text-lg">
                Sumérgete en una atmósfera vibrante donde el buen gusto se encuentra con la mejor atención. Con nuestra espectacular área de terraza bajo nuestros distintivos paraguas coloridos y un entorno de club premium, La Avenida Terrace & Club es el punto de encuentro definitivo en Bonao.
              </p>
              
              <div className="pt-6 grid grid-cols-2 gap-10 border-t border-white/5">
                <div className="group hidden sm:block">
                  <div className="text-4xl font-serif text-white mb-2 group-hover:text-gold transition-colors">01.</div>
                  <h4 className="text-white/90 font-sans tracking-widest uppercase text-xs mb-2">Diseño y Confort</h4>
                  <p className="text-white/40 text-sm font-light">Espacios creados para tu comodidad total.</p>
                </div>
                <div className="group hidden sm:block">
                  <div className="text-4xl font-serif text-white mb-2 group-hover:text-gold transition-colors">02.</div>
                  <h4 className="text-white/90 font-sans tracking-widest uppercase text-xs mb-2">Exclusividad</h4>
                  <p className="text-white/40 text-sm font-light">Atención personalizada y ambiente premium.</p>
                </div>
              </div>
            </motion.div>
            <motion.div {...fadeIn} className="flex-1 w-full grid grid-cols-2 gap-4 relative">
              
              {/* Floating element decorative */}
              <div className="absolute -top-10 -left-10 w-32 h-32 bg-gold/10 rounded-full blur-[40px] z-0"></div>

              <div className="flex flex-col gap-4 mt-16 relative z-10 group">
                <div className="aspect-[4/5] overflow-hidden rounded-tr-[50px] rounded-bl-[50px] border border-white/10 relative">
                  <div className="absolute inset-0 bg-dark/20 group-hover:bg-transparent transition-colors z-10 duration-500"></div>
                  <img 
                    src="https://images.unsplash.com/photo-1558442074-cecaea95b8d2?auto=format&fit=crop&q=80&w=1000" 
                    alt="Paraguas coloridos en la terraza"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[10s]"
                  />
                  <div className="absolute bottom-6 left-6 z-20">
                    <span className="bg-dark/80 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 text-white font-serif text-sm">Terraza al Aire Libre</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-4 relative z-10 group">
                 <div className="aspect-[4/5] overflow-hidden rounded-tl-[50px] rounded-br-[50px] border border-white/10 relative">
                  <div className="absolute inset-0 bg-dark/20 group-hover:bg-transparent transition-colors z-10 duration-500"></div>
                  <img 
                    src="https://images.unsplash.com/photo-1572116469696-31de0f17cb6d?auto=format&fit=crop&q=80&w=1500" 
                    alt="Ambiente del club"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[10s]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-darker/90 via-transparent to-transparent flex items-end p-6 z-20">
                    <span className="text-gold font-serif text-2xl drop-shadow-xl inline-flex items-center gap-2">Vida Nocturna <Star size={16} className="fill-gold" /></span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Menú Section */}
      <section id="menu" className="py-24 md:py-36 px-6 relative bg-darker border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <motion.div {...fadeIn} className="text-center max-w-2xl mx-auto mb-16 space-y-6">
            <div className="flex justify-center items-center gap-4">
              <div className="h-[1px] w-12 bg-gold"></div>
              <span className="uppercase text-gold font-sans tracking-[0.2em] text-xs">Exquisitez</span>
              <div className="h-[1px] w-12 bg-gold"></div>
            </div>
            <H2>Nuestro Menú</H2>
            <p className="font-sans text-white/50 font-light">
              Desde desayunos hasta mixología de autor. Diseñamos cada detalle de nuestro menú para brindar una experiencia sensorial inolvidable.
            </p>
          </motion.div>

          <div className="flex flex-wrap justify-center gap-4 mb-16">
             {categories.map((cat) => (
                <button 
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`relative px-6 py-2 rounded-full font-sans text-sm uppercase tracking-widest transition-all duration-300 ${
                    activeCategory === cat 
                      ? 'text-dark' 
                      : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white border border-white/10'
                  }`}
                >
                  {activeCategory === cat && (
                    <motion.div
                      layoutId="activeCategory"
                      transition={springTransition}
                      className="absolute inset-0 bg-gold rounded-full"
                    />
                  )}
                  <span className="relative z-10">{cat}</span>
                </button>
             ))}
          </div>

          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8"
          >
            <AnimatePresence mode="popLayout">
              {filteredMenu.map((item, i) => {
                const avgRating = getAverageRating(item.reviews);
                
                return (
                <motion.div 
                  key={item.id}
                  layout
                  variants={staggerItem}
                  initial="hidden"
                  animate="show"
                  exit={{ opacity: 0, scale: 0.9, transition: smoothTransition }}
                  className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden hover:border-gold/30 transition-colors flex flex-col group"
                >
                  <div className="aspect-[4/3] overflow-hidden relative">
                    <img 
                      src={item.img} 
                      alt={item.name} 
                      className="w-full h-full object-cover transform hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-dark/90 to-transparent"></div>
                    <div className="absolute top-4 left-4 bg-dark/60 backdrop-blur-md px-3 py-1 rounded-sm border border-white/10 text-white/90 text-[10px] font-sans uppercase tracking-[0.2em]">
                       {item.category}
                    </div>
                  </div>
                  
                  <div className="p-6 md:p-8 flex-1 flex flex-col -mt-12 relative z-10">
                    <div className="flex justify-between items-start mb-2">
                       <h3 className="font-serif text-2xl md:text-3xl text-white drop-shadow-md">{item.name}</h3>
                    </div>
                    
                    <div className="flex items-center gap-5 mb-5 border-b border-white/5 pb-4">
                       <div className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-full border border-white/5">
                          <Star className={`w-3.5 h-3.5 ${avgRating > 0 ? 'text-gold fill-gold' : 'text-white/20'}`} />
                          <span className="text-white/90 text-sm font-sans font-medium">{avgRating > 0 ? avgRating : 'Nuevo'}</span>
                       </div>
                       <button 
                         onClick={() => openReviewModal(item)}
                         className="flex items-center gap-1.5 text-white/40 hover:text-gold transition-colors text-sm font-sans"
                       >
                          <MessageSquare className="w-4 h-4" /> 
                          {item.reviews.length} reseñas
                       </button>
                    </div>

                    <p className="font-sans text-white/60 text-sm font-light leading-relaxed flex-1">{item.description}</p>
                    
                    <button 
                      onClick={() => openReviewModal(item)}
                      className="mt-6 w-full py-3.5 bg-white/[0.03] hover:bg-gold hover:text-dark rounded-xl font-sans text-[11px] uppercase tracking-[0.2em] font-semibold text-white/90 transition-all duration-300 flex items-center justify-center gap-2 group"
                    >
                      <Star size={14} className="group-hover:fill-dark transition-colors" /> Valorar Plato
                    </button>
                  </div>
                </motion.div>
              )})}
              {filteredMenu.length === 0 && (
                <motion.p variants={staggerItem} className="text-white/40 font-sans col-span-full py-20 text-center uppercase tracking-widest">
                  No hay platos en esta categoría.
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </section>

      {/* Review Modal */}
      <AnimatePresence>
         {showReviewModal && selectedItemForReview && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-darker/90 backdrop-blur-sm flex items-center justify-center px-4"
            >
               <motion.div 
                 initial={{ y: 50, scale: 0.95, opacity: 0 }}
                 animate={{ y: 0, scale: 1, opacity: 1 }}
                 exit={{ y: 20, scale: 0.95, opacity: 0 }}
                 transition={{ type: "spring", damping: 25, stiffness: 250 }}
                 className="bg-dark border border-white/10 rounded-2xl p-6 md:p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto"
               >
                  <div className="flex justify-between items-center mb-6">
                     <h3 className="font-serif text-3xl text-white">{selectedItemForReview.name}</h3>
                     <button onClick={() => setShowReviewModal(false)} className="text-white/50 hover:text-white">
                        <X size={24} />
                     </button>
                  </div>
                  
                  <div className="space-y-6 mb-8">
                     <h4 className="font-sans text-sm uppercase tracking-widest text-gold border-b border-white/10 pb-2">Reseñas ({selectedItemForReview.reviews.length})</h4>
                     
                     {selectedItemForReview.reviews.length === 0 ? (
                        <p className="text-white/40 font-light italic">Se el primero en dejar una reseña.</p>
                     ) : (
                        <div className="space-y-4">
                           {selectedItemForReview.reviews.map(review => (
                              <div key={review.id} className="bg-white/[0.02] p-4 rounded-xl border border-white/5">
                                 <div className="flex justify-between mb-2">
                                    <span className="font-sans text-white/90 font-medium">{review.author}</span>
                                    <div className="flex">
                                       {[...Array(5)].map((_, i) => (
                                          <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'text-gold fill-gold' : 'text-white/20'}`} />
                                       ))}
                                    </div>
                                 </div>
                                 <p className="text-white/60 font-light text-sm">{review.comment}</p>
                              </div>
                           ))}
                        </div>
                     )}
                  </div>

                  <form onSubmit={handleAddReview} className="space-y-4 border-t border-white/10 pt-6">
                     <h4 className="font-sans text-sm uppercase tracking-widest text-gold mb-4">Deja tu Valoración</h4>
                     
                     <div>
                        <label className="block text-white/60 text-xs uppercase tracking-widest mb-2 font-sans">Tu Nombre</label>
                        <input 
                          type="text" 
                          required
                          value={newReview.author}
                          onChange={(e) => setNewReview({...newReview, author: e.target.value})}
                          className="w-full bg-darker border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gold transition-colors font-sans"
                          placeholder="Ej. Juan Pérez"
                        />
                     </div>

                     <div>
                        <label className="block text-white/60 text-xs uppercase tracking-widest mb-2 font-sans">Puntuación</label>
                        <div className="flex gap-2">
                           {[1, 2, 3, 4, 5].map(num => (
                              <button 
                                key={num}
                                type="button"
                                onClick={() => setNewReview({...newReview, rating: num})}
                              >
                                 <Star className={`w-8 h-8 ${num <= newReview.rating ? 'text-gold fill-gold' : 'text-white/20 hover:text-gold/50'} transition-colors`} />
                              </button>
                           ))}
                        </div>
                     </div>

                     <div>
                        <label className="block text-white/60 text-xs uppercase tracking-widest mb-2 font-sans">Comentario</label>
                        <textarea 
                          required
                          value={newReview.comment}
                          onChange={(e) => setNewReview({...newReview, comment: e.target.value})}
                          className="w-full bg-darker border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gold transition-colors font-sans min-h-[100px] resize-none"
                          placeholder="¿Qué te pareció este plato?"
                        />
                     </div>

                     <button 
                       type="submit"
                       className="w-full bg-gold text-dark py-4 rounded-lg font-sans text-sm uppercase tracking-widest hover:bg-gold-light transition-colors font-semibold"
                     >
                        Publicar Reseña
                     </button>
                  </form>
               </motion.div>
            </motion.div>
         )}
      </AnimatePresence>

      {/* Horarios & Ubicación */}
      <section id="horarios" className="py-24 border-t border-white/5 bg-dark relative overflow-hidden">
        {/* Abstract background elements */}
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-white/[0.02] to-transparent pointer-events-none"></div>
        
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24">
            
            {/* Horarios */}
            <motion.div {...fadeIn}>
              <div className="flex items-center gap-4 mb-10">
                <Clock className="text-gold" size={24} strokeWidth={1} />
                <H2 className="text-3xl md:text-4xl">Horarios</H2>
              </div>
              
              <div className="flex flex-col gap-4">
                {schedule.map((slot, index) => (
                  <div key={index} className="flex justify-between items-end border-b border-white/10 pb-4 group">
                    <span className="font-sans uppercase text-sm tracking-widest text-white/80 group-hover:text-gold transition-colors">{slot.day}</span>
                    <span className="font-serif text-xl tracking-wide text-white/60 group-hover:text-white transition-colors">{slot.hours}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Contacto & Address */}
            <motion.div {...fadeIn} id="contacto" className="flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-4 mb-10">
                  <MapPin className="text-gold" size={24} strokeWidth={1} />
                  <H2 className="text-3xl md:text-4xl">Ubicación</H2>
                </div>
                
                <div className="bg-white/[0.02] border border-white/5 p-8 sm:p-10 rounded-2xl space-y-8">
                  <div>
                    <h5 className="font-sans text-xs uppercase tracking-[0.2em] text-white/40 mb-3">Dirección</h5>
                    <p className="font-serif text-2xl text-white/90 leading-relaxed">
                      Av Libertad 86<br/>
                      <span className="text-gold italic">Bonao 42000</span>
                    </p>
                    <div className="mt-4 flex items-center gap-2">
                      <span className="bg-gold/10 text-gold text-xs font-mono py-1 px-3 rounded">WHQX+RJ</span>
                      <span className="text-white/40 text-xs font-sans uppercase tracking-widest">Plus Code</span>
                    </div>
                  </div>

                  <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>

                  <div>
                    <h5 className="font-sans text-xs uppercase tracking-[0.2em] text-white/40 mb-3">Teléfono / Reservas</h5>
                    <a href="tel:+18095252585" className="group flex items-center gap-4 hover:text-gold transition-colors">
                      <div className="w-12 h-12 rounded-full border border-white/10 group-hover:border-gold/50 flex items-center justify-center transition-all bg-dark">
                        <Phone size={18} className="text-gold" />
                      </div>
                      <span className="font-serif text-2xl">+1 (809) 525-2585</span>
                    </a>
                  </div>
                </div>
              </div>

              <div className="mt-10">
                <a 
                  href="https://www.google.com/maps/place/La+Avenida+Terrace+%26+Club/@18.9396184,-70.4008955,16z/data=!4m10!1m2!2m1!1sRestaurantes!3m6!1s0x8eafdf4a45250bf1:0xcb5d07a76aa80202!8m2!3d18.9396184!4d-70.4008955!15sCgxSZXN0YXVyYW50ZXNaDiIMcmVzdGF1cmFudGVzkgEKcmVzdGF1cmFudJoBJENoZERTVWhOTUc5blMwVkpRMEZuU1VReWEyUlFPWFJSUlJBQuABAPoBBAgAECI!16s%2Fg%2F11jq7rt3sf?entry=ttu&g_ep=EgoyMDI2MDQyMS4wIKXMDSoASAFQAw%3D%3D" 
                  target="_blank" 
                  rel="noreferrer"
                  className="font-sans text-xs uppercase tracking-[0.2em] flex items-center gap-3 text-gold hover:text-white transition-colors p-4 border border-gold/20 hover:border-white/40 rounded-full justify-center"
                >
                  <Navigation size={14} />
                  Abrir en Google Maps
                </a>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/5 text-center px-6">
        <div className="font-serif text-2xl uppercase tracking-[0.3em] text-white/80 mb-6">La Avenida</div>
        <div className="flex justify-center gap-6 mb-8 text-white/40">
          <a href="https://www.instagram.com/laavenidabarbonao/" target="_blank" rel="noopener noreferrer" className="hover:text-gold transition-colors"><Instagram size={20} /></a>
        </div>
        <p className="font-sans text-xs text-white/30 uppercase tracking-[0.1em]">
          © {new Date().getFullYear()} La Avenida Terrace & Club. Av Libertad 86, Bonao. Todos los derechos reservados.
        </p>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/admin" element={<AdminPanel />} />
    </Routes>
  );
}
