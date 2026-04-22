/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from './lib/supabase';
import { 
  Calendar, 
  MapPin, 
  Ticket, 
  Search, 
  Menu, 
  X, 
  ChevronRight, 
  ChevronLeft,
  ArrowRight,
  User,
  Star,
  Settings,
  Image as ImageIcon,
  Target,
  Users,
  Check,
  Edit2,
  Plus,
  Minus,
  CreditCard,
  Wallet,
  Eye,
  EyeOff,
  Globe
} from 'lucide-react';

// Recipes and Design from SKILL.md
// This app uses Recipe 4: Dark Luxury / Travel + Recipe 12: Luxury / Prestige

// Updated Featured Events data with user provided events
const INITIAL_EVENTS = [
  {
    id: 1,
    title1: "Neo Classic",
    title2: "Night",
    date: "18 OCT 2026",
    venue: "Opera de Bali",
    price: 65,
    bannerImage: "https://picsum.photos/seed/opera/1200/800",
    badge: "Exclusive",
    dateTime: "Dom 18 Octubre | 07:00 PM - 11:00 PM",
    artists: "Symphonic Orchestra",
    category: "Classic",
    isVisible: true
  },
  {
    id: 2,
    title1: "Underground",
    title2: "Series",
    date: "22 OCT 2026",
    venue: "The Vault Club",
    price: 40,
    bannerImage: "https://picsum.photos/seed/vault/1200/800",
    badge: "Underground",
    dateTime: "Jue 22 Octubre | 11:00 PM - 05:00 AM",
    artists: "Experimental DJs",
    category: "Electronic",
    isVisible: true
  },
  {
    id: 3,
    title1: "Jazz on",
    title2: "the Beach",
    date: "05 NOV 2026",
    venue: "Blue Lagoon",
    price: 55,
    bannerImage: "https://picsum.photos/seed/jazz/1200/800",
    badge: "Live Music",
    dateTime: "Jue 05 Noviembre | 06:00 PM - 10:00 PM",
    artists: "The Jazz Quartet",
    category: "Jazz",
    isVisible: true
  },
  {
    id: 4,
    title1: "Winter",
    title2: "Gala 2026",
    date: "12 NOV 2026",
    venue: "Palacio Real",
    price: 150,
    bannerImage: "https://picsum.photos/seed/palace/1200/800",
    badge: "Luxury",
    dateTime: "Jue 12 Noviembre | 08:00 PM - 02:00 AM",
    artists: "Various Artists",
    category: "Gala",
    isVisible: true
  }
];

export default function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'yape'>('yape');
  const [customerData, setCustomerData] = useState({ name: '', email: '', whatsapp: '' });
  const [adminTab, setAdminTab] = useState<'brand' | 'event' | 'payment' | 'tickets' | 'events_list' | 'seo' | 'users' | 'orders'>('events_list');
  const [isLoading, setIsLoading] = useState(true);
  const [supabaseStatus, setSupabaseStatus] = useState<{ connected: boolean; error: string | null }>({ connected: false, error: null });
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  
  // Events Management State
  const [events, setEvents] = useState(INITIAL_EVENTS);
  const [currentEventId, setCurrentEventId] = useState<number>(1); 
  const [editingEventId, setEditingEventId] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('Todos');
  const sliderRef = React.useRef<HTMLDivElement>(null);

  const scrollSlider = (direction: 'left' | 'right') => {
    if (sliderRef.current) {
      const scrollAmount = sliderRef.current.offsetWidth * 0.8;
      sliderRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const categories = ['Todos', ...Array.from(new Set(events.map(e => e.category)))];
  const filteredEvents = activeCategory === 'Todos' 
    ? events.filter(e => e.isVisible) 
    : events.filter(e => e.isVisible && e.category === activeCategory);

  const eventData = events.find(e => e.id === currentEventId) || events[0];

  // Ticket States
  const [ticketTypes, setTicketTypes] = useState([
    { id: 'free', name: 'FREEPASS', desc: 'Acceso básico', price: 0 },
    { id: 'super-vip', name: 'SUPER VIP', desc: 'Acceso premium exclusivo', price: 70 },
    { id: 'vip', name: 'VIP', desc: 'Acceso preferencial', price: 50 }
  ]);

  const [brandData, setBrandData] = useState({
    name: "Bali",
    logoUrl: "https://i.ibb.co/XZZMPkyL/logo.png",
    useLogo: true
  });

  const [yapeData, setYapeData] = useState({
    number: "999 000 111",
    holder: "BALI EVENTOS SAC",
    qrUrl: ""
  });

  const [seoData, setSeoData] = useState({
    title: "Bali Club Lima - Eventos y Entradas",
    description: "La plataforma líder en eventos culturales y de entretenimiento en Bali. Compra tus entradas para los mejores festivales, conciertos y rituales.",
    keywords: "bali, eventos, entradas, festivales, conciertos, uluwatu, música, cultura",
    ogImage: "https://picsum.photos/seed/bali-og/1200/630"
  });

  const [adminUsers, setAdminUsers] = useState<{ id: string | number; username: string; password?: string }[]>([]);

  // SEO Effect
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setIsLoading(true);
    setSupabaseStatus({ connected: false, error: null });
    try {
      // Test connection and fetch events
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .order('id', { ascending: true });
      
      if (eventsError) {
        setSupabaseStatus({ connected: false, error: eventsError.message });
        throw eventsError;
      }
      
      setSupabaseStatus({ connected: true, error: null });
      if (eventsData && eventsData.length > 0) {
        const formattedEvents = eventsData.map(e => ({
          ...e,
          bannerImage: e.banner_image,
          dateTime: e.date_time,
          date: e.event_date,
          isVisible: e.is_visible
        }));
        setEvents(formattedEvents);
        setCurrentEventId(formattedEvents[0].id);
      }

      // Fetch Ticket Types
      const { data: ticketsData, error: ticketsError } = await supabase
        .from('ticket_types')
        .select('*');
      
      if (ticketsError) throw ticketsError;
      if (ticketsData && ticketsData.length > 0) {
        const formattedTickets = ticketsData.map(t => ({
          ...t,
          desc: t.description || ''
        }));
        setTicketTypes(formattedTickets);
        // Initialize quantities
        const initialQtys: Record<string, number> = {};
        ticketsData.forEach(t => initialQtys[t.id] = t.id === 'free' ? 1 : 0);
        setTicketQuantities(initialQtys);
      }

      // Fetch Settings
      const { data: settingsData, error: settingsError } = await supabase
        .from('site_settings')
        .select('*');
      
      if (settingsError) throw settingsError;
      if (settingsData) {
        settingsData.forEach(setting => {
          if (setting.id === 'brand') setBrandData(setting.data);
          if (setting.id === 'yape') setYapeData(setting.data);
          if (setting.id === 'seo') setSeoData(setting.data);
        });
      }

      // Fetch Admin Users
      const { data: usersData, error: usersError } = await supabase
        .from('admin_users')
        .select('*');
      
      if (!usersError && usersData) {
        setAdminUsers(usersData);
      }

      // Fetch Orders
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (!ordersError && ordersData) {
        setOrders(ordersData);
      }

    } catch (error) {
      console.error('Error fetching data from Supabase:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveEvent = async (id: number, updates: any) => {
    try {
      const dbUpdates = {
        title1: updates.title1,
        title2: updates.title2,
        event_date: updates.date,
        venue: updates.venue,
        price: updates.price,
        banner_image: updates.bannerImage,
        badge: updates.badge,
        date_time: updates.dateTime,
        artists: updates.artists,
        category: updates.category,
        is_visible: updates.isVisible,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('events')
        .update(dbUpdates)
        .eq('id', id);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error saving event:', error);
    }
  };

  const saveSettings = async (type: 'brand' | 'yape' | 'seo', data: any) => {
    try {
      const { error } = await supabase
        .from('site_settings')
        .upsert({ id: type, data, updated_at: new Date().toISOString() });
      if (error) throw error;
    } catch (error) {
      console.error(`Error saving ${type} settings:`, error);
    }
  };

  const saveTicketType = async (id: string, updates: any) => {
    try {
      const { error } = await supabase
        .from('ticket_types')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    } catch (error) {
      console.error('Error saving ticket type:', error);
    }
  };

  // SEO Effect
  useEffect(() => {
    document.title = seoData.title;
    
    // Meta Description
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', seoData.description);

    // Meta Keywords
    let metaKey = document.querySelector('meta[name="keywords"]');
    if (!metaKey) {
      metaKey = document.createElement('meta');
      metaKey.setAttribute('name', 'keywords');
      document.head.appendChild(metaKey);
    }
    metaKey.setAttribute('content', seoData.keywords);

    // OG Tags
    const ogTags = [
      { property: 'og:title', content: seoData.title },
      { property: 'og:description', content: seoData.description },
      { property: 'og:image', content: seoData.ogImage },
      { property: 'og:type', content: 'website' }
    ];

    ogTags.forEach(tag => {
      let element = document.querySelector(`meta[property="${tag.property}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute('property', tag.property);
        document.head.appendChild(element);
      }
      element.setAttribute('content', tag.content);
    });
  }, [seoData]);

  const [ticketQuantities, setTicketQuantities] = useState<Record<string, number>>({
    'free': 1,
    'super-vip': 0,
    'vip': 0
  });

  // Login Form State
  const [loginForm, setLoginForm] = useState({ user: '', pass: '' });
  const [loginError, setLoginError] = useState(false);

  const handleAdminToggle = () => {
    if (!isAuthenticated) {
      setIsLoginModalOpen(true);
    } else {
      setIsAdminMode(!isAdminMode);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Try matching database users first, fallback to hardcoded for first run safety
    const foundUser = adminUsers.find(u => u.username === loginForm.user && u.password === loginForm.pass);
    const isHardcodedMaster = loginForm.user === 'Julio' && loginForm.pass === 'Vilca';

    if (foundUser || isHardcodedMaster) {
      setIsAuthenticated(true);
      setIsAdminMode(true);
      setIsLoginModalOpen(false);
      setLoginError(false);
    } else {
      setLoginError(true);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setIsAdminMode(false);
    setLoginForm({ user: '', pass: '' });
  };

  const handleSaveChanges = async () => {
    if (!supabaseStatus.connected) {
      alert("No hay conexión con la base de datos para guardar los cambios.");
      return;
    }

    setIsSaving(true);
    try {
      // 1. Save all events
      const eventUpdates = events.map(e => ({
        id: e.id,
        title1: e.title1,
        title2: e.title2,
        event_date: e.date,
        venue: e.venue,
        price: e.price,
        banner_image: e.bannerImage,
        badge: e.badge,
        date_time: e.dateTime,
        artists: e.artists,
        category: e.category,
        is_visible: e.isVisible,
        updated_at: new Date().toISOString()
      }));

      const { error: eventsError } = await supabase
        .from('events')
        .upsert(eventUpdates);
      
      if (eventsError) throw eventsError;

      // 2. Save settings
      const settingsToSave = [
        { id: 'brand', data: brandData },
        { id: 'yape', data: yapeData },
        { id: 'seo', data: seoData }
      ];

      for (const setting of settingsToSave) {
        const { error } = await supabase
          .from('site_settings')
          .upsert({ id: setting.id, data: setting.data, updated_at: new Date().toISOString() });
        if (error) throw error;
      }

      // 3. Save ticket types
      const ticketUpdates = ticketTypes.map(t => ({
        id: t.id,
        name: t.name,
        description: (t as any).desc || t.description, // Handle both local 'desc' and DB 'description'
        price: t.price
      }));

      const { error: ticketsError } = await supabase
        .from('ticket_types')
        .upsert(ticketUpdates);
      
      if (ticketsError) throw ticketsError;

      // 4. Save Admin Users
      if (adminUsers.length > 0) {
        const { error: usersError } = await supabase
          .from('admin_users')
          .upsert(adminUsers);
        if (usersError) throw usersError;
      }

      setHasUnsavedChanges(false);
      alert("¡Todos los cambios han sido guardados en la base de datos!");
    } catch (error: any) {
      console.error('Error saving all changes:', error);
      const errorMessage = error?.message || "Error desconocido";
      
      if (errorMessage.includes('row-level security') || errorMessage.includes('permission denied')) {
        alert(`Error de Permisos: La base de datos rechazó los cambios. \n\nEsto suele ser por las políticas RLS. Asegúrate de actualizar tus políticas en Supabase para permitir escritura segura.`);
      } else {
        alert(`Hubo un error al guardar los cambios: ${errorMessage}`);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const updateField = (field: string, value: string) => {
    setEvents(prev => prev.map(e => e.id === currentEventId ? { ...e, [field]: value } : e));
    setHasUnsavedChanges(true);
  };

  const handleAddEvent = async () => {
    const newId = Math.max(0, ...events.map(e => e.id)) + 1;
    const newEventTemplate = {
      title1: "Nuevo",
      title2: "Evento",
      event_date: "01 JAN 2026",
      venue: "Lugar del Evento",
      price: 0,
      banner_image: "https://picsum.photos/seed/new-event/1200/800",
      badge: "Próximamente",
      date_time: "Sáb 1 Enero | 08:00 PM",
      artists: "Artistas por confirmar",
      category: "General",
      is_visible: true
    };

    // UI Feedback immediate
    const localNewEvent = {
      ...newEventTemplate,
      id: newId,
      bannerImage: newEventTemplate.banner_image,
      dateTime: newEventTemplate.date_time,
      date: newEventTemplate.event_date,
      isVisible: newEventTemplate.is_visible
    };

    try {
      if (supabaseStatus.connected) {
        const { data, error } = await supabase
          .from('events')
          .insert([newEventTemplate])
          .select();

        if (error) throw error;
        if (data) {
          const createdEvent = {
            ...data[0],
            bannerImage: data[0].banner_image,
            dateTime: data[0].date_time,
            date: data[0].event_date,
            isVisible: data[0].is_visible
          };
          setEvents(prev => [...prev, createdEvent]);
          setCurrentEventId(createdEvent.id);
          setAdminTab('event');
          return;
        }
      }
      
      // Fallback for unconnected state or if insert fails but we want to allow demoing
      setEvents(prev => [...prev, localNewEvent]);
      setCurrentEventId(newId);
      setAdminTab('event');
      if (!supabaseStatus.connected) {
        console.warn('Evento añadido localmente (DB no conectada)');
      }

    } catch (error) {
      console.error('Error creating event:', error);
      // Even on error, let the user see the new event locally for the current session
      setEvents(prev => [...prev, localNewEvent]);
      setCurrentEventId(newId);
      setAdminTab('event');
      alert("Se añadió localmente, pero hubo un error al guardar en la base de datos.");
    }
  };

  const handleToggleVisibility = (id: number) => {
    setEvents(prev => prev.map(e => e.id === id ? { ...e, isVisible: !e.isVisible } : e));
    setHasUnsavedChanges(true);
  };

  const handleDeleteEvent = async (id: number) => {
    if (events.length <= 1) return;
    if (!confirm("¿Estás seguro de que deseas eliminar este evento permanentemente?")) return;
    
    try {
      if (supabaseStatus.connected) {
        const { error } = await supabase.from('events').delete().eq('id', id);
        if (error) throw error;
      }
      
      const newEvents = events.filter(e => e.id !== id);
      setEvents(newEvents);
      if (currentEventId === id) {
        setCurrentEventId(newEvents[0].id);
      }
      setHasUnsavedChanges(true);
    } catch (error) {
      console.error('Error deleting event:', error);
      alert("Error al eliminar el evento de la base de datos.");
    }
  };

  const updateQuantity = (id: string, delta: number) => {
    setTicketQuantities(prev => ({
      ...prev,
      [id]: Math.max(0, prev[id] + delta)
    }));
  };

  const updateTicketType = (id: string, field: string, value: string | number) => {
    setTicketTypes(prev => prev.map(t => t.id === id ? { ...t, [field]: value } : t));
    setHasUnsavedChanges(true);
  };

  const handleAddTicketType = () => {
    const newId = `ticket-${Date.now()}`;
    const newTicket = {
      id: newId,
      name: 'NUEVA ENTRADA',
      desc: 'Descripción de la entrada',
      price: 0
    };
    setTicketTypes(prev => [...prev, newTicket]);
    setTicketQuantities(prev => ({ ...prev, [newId]: 0 }));
    setHasUnsavedChanges(true);
  };

  const handleDeleteTicketType = async (id: string) => {
    if (ticketTypes.length <= 1) {
      alert("Debes tener al menos un tipo de entrada.");
      return;
    }
    
    // Si el ID no empieza por 'ticket-', probablemente ya está en la DB
    if (!id.startsWith('ticket-')) {
      try {
        const { error } = await supabase.from('ticket_types').delete().eq('id', id);
        if (error) throw error;
      } catch (error) {
        console.error('Error deleting ticket type from DB:', error);
        alert("Error al eliminar de la base de datos.");
        return;
      }
    }

    setTicketTypes(prev => prev.filter(t => t.id !== id));
    setHasUnsavedChanges(true);
  };

  const updateBrand = (field: string, value: string | boolean) => {
    const newData = { ...brandData, [field]: value };
    setBrandData(newData);
    setHasUnsavedChanges(true);
  };

  const updateYape = (field: string, value: string) => {
    const newData = { ...yapeData, [field]: value };
    setYapeData(newData);
    setHasUnsavedChanges(true);
  };

  const updateSeo = (field: string, value: string) => {
    const newData = { ...seoData, [field]: value };
    setSeoData(newData);
    setHasUnsavedChanges(true);
  };

  const handleAddUser = () => {
    const newUser = {
      id: Date.now(),
      username: 'Nuevo Usuario',
      password: 'password123'
    };
    setAdminUsers(prev => [...prev, newUser]);
    setHasUnsavedChanges(true);
  };

  const handleDeleteUser = async (id: string | number) => {
    // Si el ID es numérico largo (Timestamp), es local y no está en la DB todavía
    if (typeof id === 'string' || (typeof id === 'number' && id < 1000000000000)) {
      try {
        const { error } = await supabase.from('admin_users').delete().eq('id', id);
        if (error) throw error;
      } catch (error) {
        console.error('Error deleting user from DB:', error);
      }
    }
    setAdminUsers(prev => prev.filter(u => u.id !== id));
    setHasUnsavedChanges(true);
  };

  const handleUpdateUser = (id: string | number, field: string, value: string) => {
    setAdminUsers(prev => prev.map(u => u.id === id ? { ...u, [field]: value } : u));
    setHasUnsavedChanges(true);
  };

  const handleDeleteOrder = async (id: string) => {
    if (!confirm("¿Eliminar este pedido permanentemente?")) return;
    try {
      if (supabaseStatus.connected) {
        const { error } = await supabase.from('orders').delete().eq('id', id);
        if (error) throw error;
      }
      setOrders(prev => prev.filter(o => o.id !== id));
    } catch (error) {
      console.error('Error deleting order:', error);
    }
  };

  const handlePurchase = async () => {
    if (!customerData.name || !customerData.email || !customerData.whatsapp) {
      alert("Por favor completa tus datos de contacto.");
      return;
    }

    try {
      const purchaseData = {
        event_id: currentEventId,
        customer_name: customerData.name,
        customer_email: customerData.email,
        customer_whatsapp: customerData.whatsapp,
        tickets: Object.entries(ticketQuantities)
          .filter(([_, qty]) => (qty as number) > 0)
          .map(([id, qty]) => ({ id, qty, name: ticketTypes.find(t => t.id === id)?.name })),
        total_price: totalPrice,
        payment_method: paymentMethod,
        payment_status: paymentMethod === 'yape' ? 'pending' : 'completed'
      };

      const { data, error } = await supabase
        .from('orders')
        .insert([purchaseData])
        .select();

      if (error) throw error;
      
      alert(paymentMethod === 'yape' ? "¡Pedido registrado! Envía la captura de tu Yape para confirmar." : "¡Compra exitosa! Revisa tu correo para tus entradas.");
      setIsPaymentModalOpen(false);
      // Reset quantities
      const resetQtys: Record<string, number> = {};
      ticketTypes.forEach(t => resetQtys[t.id] = 0);
      setTicketQuantities(resetQtys);
      
    } catch (error) {
      console.error('Error processing purchase:', error);
      alert("Hubo un error al procesar tu compra. Por favor intenta de nuevo.");
    }
  };

  const totalTickets = (Object.values(ticketQuantities) as number[]).reduce((a: number, b: number) => a + b, 0);
  const totalPrice = Object.entries(ticketQuantities).reduce((acc: number, [id, qty]) => {
    const ticket = ticketTypes.find(t => t.id === id);
    const quantity = qty as number;
    return acc + (ticket ? ticket.price * quantity : 0);
  }, 0);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-6">
        <div className="w-16 h-16 border-4 border-accent/20 border-t-accent rounded-full animate-spin" />
        <div className="text-accent text-[10px] font-black uppercase tracking-[0.5em] animate-pulse">Cargando Bali Premium...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent">
      {/* Navigation - Immersive Style */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/10 bg-black/40 backdrop-blur-xl">
        <div className="max-w-[1400px] mx-auto px-4 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {brandData.useLogo && brandData.logoUrl ? (
              <img 
                src={brandData.logoUrl} 
                alt={brandData.name} 
                className="h-10 w-auto object-contain"
                referrerPolicy="no-referrer"
              />
            ) : (
              <span className={`text-2xl font-black tracking-[0.2em] uppercase text-accent ${isAdminMode ? 'cursor-text hover:bg-white/5 px-2 rounded' : ''}`}>
                {brandData.name}
              </span>
            )}
          </div>

          <div className="hidden md:flex items-center gap-8 text-[12px] font-semibold uppercase tracking-widest text-white/60">
            <a href="#" className="text-white border-b-2 border-accent pb-1">Explorar</a>
            <a href="#" className="hover:text-white transition-colors">Festivales</a>
            <a href="#" className="hover:text-white transition-colors">Conciertos</a>
            <a href="#" className="hover:text-white transition-colors">Mis Entradas</a>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden sm:flex items-center gap-3 text-[12px] opacity-80 uppercase tracking-widest">
              {isAuthenticated && (
                <button 
                  onClick={handleLogout}
                  className="text-[10px] font-bold text-white/40 hover:text-white transition-colors border-r border-white/10 pr-3"
                >
                  Salir
                </button>
              )}
              <button 
                onClick={handleAdminToggle}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full border transition-all ${
                  isAdminMode 
                  ? 'bg-accent text-black border-accent font-bold shadow-[0_0_15px_rgba(212,175,55,0.3)]' 
                  : 'bg-white/5 border-white/10 hover:bg-white/10'
                }`}
              >
                <Settings size={12} className={isAdminMode ? 'animate-spin-slow' : ''} />
                {isAdminMode ? 'Personalizando' : 'Acceso'}
              </button>
            </div>
            <button 
              onClick={() => setIsMenuOpen(true)}
              className="md:hidden text-white"
            >
              <Menu size={24} />
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-[1400px] mx-auto px-4 lg:px-8 pt-16 md:pt-20 pb-12">
        {/* Admin Panel Overlay */}
        <AnimatePresence>
          {isAdminMode && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 overflow-hidden bg-white/5 border border-white/10 rounded-[20px] p-4 backdrop-blur-md"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-accent/20 flex items-center justify-center text-accent">
                    <Settings size={16} className="animate-spin-slow" />
                  </div>
                  <div>
                    <h3 className="text-md font-bold tracking-tight text-white focus:outline-none">Panel de Administración</h3>
                    <p className="text-[9px] text-white/40 uppercase tracking-[0.1em] font-black">Gestiona tu marca, pagos y detalles del evento</p>
                  </div>
                </div>
                
                {/* Supabase Status Indicator */}
                <div className="flex items-center gap-4">
                  <div className={`flex items-center gap-2 px-3 py-1 rounded-full border text-[10px] font-bold uppercase tracking-widest ${
                    supabaseStatus.connected 
                    ? 'bg-green-500/10 border-green-500/30 text-green-400' 
                    : 'bg-red-500/10 border-red-500/30 text-red-400'
                  }`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${supabaseStatus.connected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
                    {supabaseStatus.connected ? 'DB Conectada' : 'DB Desconectada'}
                  </div>
                  <button 
                    onClick={() => setIsAdminMode(false)}
                    className="px-6 py-2 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-2 group"
                  >
                    Cerrar Editor
                  </button>
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-4 bg-black/20 rounded-[20px] border border-white/5 p-1.5 overflow-hidden">
                {/* Admin Sidebar Navigation */}
                <div className="w-full md:w-56 flex flex-wrap md:flex-col gap-1 p-1.5 border-b md:border-b-0 md:border-r border-white/5">
                  {[
                    { id: 'events_list', label: 'Gestión Eventos', icon: Calendar },
                    { id: 'event', label: 'Editor Detalle', icon: ImageIcon },
                    { id: 'brand', label: 'Identidad', icon: Star },
                    { id: 'payment', label: 'Pagos / Yape', icon: Wallet },
                    { id: 'tickets', label: 'Entradas', icon: Ticket },
                    { id: 'orders', label: 'Ventas / Pedidos', icon: Target },
                    { id: 'users', label: 'Gestión Usuarios', icon: Users },
                    { id: 'seo', label: 'SEO / Meta', icon: Globe },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setAdminTab(tab.id as any)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all ${
                        adminTab === tab.id 
                        ? 'bg-accent text-black shadow-[0_10px_20px_rgba(212,175,55,0.2)]' 
                        : 'text-white/40 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <tab.icon size={14} />
                      <span className="hidden sm:inline">{tab.label}</span>
                    </button>
                  ))}
                </div>

                {/* Admin Tab Content */}
                <div className="flex-1 p-6">
                  {adminTab === 'events_list' && (
                    <motion.div 
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="space-y-6"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-4 bg-accent rounded-full" />
                          <span className="text-[10px] font-black text-white uppercase tracking-widest">Listado de Eventos Próximos</span>
                        </div>
                        <button 
                          onClick={handleAddEvent}
                          className="flex items-center gap-2 bg-accent text-black px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-accent-dark transition-all"
                        >
                          <Plus size={14} />
                          Nuevo Evento
                        </button>
                      </div>

                      <div className="grid grid-cols-1 gap-3 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
                        {!supabaseStatus.connected && (
                          <div className="p-6 bg-red-500/5 border border-red-500/20 rounded-2xl">
                            <p className="text-red-400 text-xs font-bold uppercase tracking-widest mb-2">Error de conexión</p>
                            <p className="text-white/40 text-[10px] leading-relaxed">
                              No se pudo conectar con Supabase. Verifica tus credenciales (URL y Anon Key) en los secretos de AI Studio y asegúrate de haber ejecutado el script SQL en el editor de Supabase.
                              <br /><br />
                              Error: {supabaseStatus.error || 'Desconocido'}
                            </p>
                            <button 
                              onClick={fetchInitialData}
                              className="mt-4 text-accent text-[10px] font-bold uppercase hover:underline"
                            >
                              Reintentar conexión
                            </button>
                          </div>
                        )}
                        {events.map((event) => (
                          <motion.div 
                            key={event.id}
                            whileHover={{ scale: 1.01 }}
                            className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                              currentEventId === event.id 
                              ? 'bg-accent/10 border-accent/30' 
                              : 'bg-white/5 border-white/5 hover:bg-white/10'
                            }`}
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-xl overflow-hidden bg-black/40">
                                <img src={event.bannerImage} alt="" className="w-full h-full object-cover" />
                              </div>
                              <div>
                                <h4 className={`text-[12px] font-bold ${event.isVisible ? 'text-white' : 'text-white/20 line-through'}`}>{event.title1} {event.title2}</h4>
                                <p className="text-[9px] text-white/40 uppercase tracking-widest font-black">{event.venue} • {event.date}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={() => handleToggleVisibility(event.id)}
                                className={`p-2 rounded-lg transition-all ${event.isVisible ? 'bg-accent/20 text-accent' : 'bg-white/5 text-white/40'}`}
                                title={event.isVisible ? 'Ocultar evento de la web' : 'Mostrar evento en la web'}
                              >
                                {event.isVisible ? <Eye size={14} /> : <EyeOff size={14} />}
                              </button>
                              <button 
                                onClick={() => {
                                  setCurrentEventId(event.id);
                                  setAdminTab('event');
                                }}
                                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all"
                                title="Editar detalles"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button 
                                onClick={() => handleDeleteEvent(event.id)}
                                className="p-2 rounded-lg bg-white/5 hover:bg-red-500/20 text-white/40 hover:text-red-400 transition-all"
                                title="Eliminar evento"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                  {adminTab === 'brand' && (
                    <motion.div 
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="space-y-6"
                    >
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-1.5 h-4 bg-accent rounded-full" />
                        <span className="text-[10px] font-black text-white uppercase tracking-widest">Identidad Visual</span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="group">
                          <label className="text-[9px] text-white/30 uppercase font-bold ml-1 mb-2 block group-focus-within:text-accent transition-colors">Nombre de Marca</label>
                          <input 
                            type="text" 
                            value={brandData.name}
                            onChange={(e) => updateBrand('name', e.target.value)}
                            className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-4 text-xs text-white focus:border-accent/40 outline-none transition-all"
                            placeholder="Nombre de tu empresa"
                          />
                        </div>
                        
                        <div>
                          <div className="flex items-center justify-between mb-2 px-1">
                            <label className="text-[9px] text-white/30 uppercase font-bold group-focus-within:text-accent transition-colors">Logo (URL)</label>
                            <div className="flex items-center gap-2">
                              <span className="text-[8px] text-white/20 font-bold uppercase py-0.5 px-2 bg-white/5 rounded border border-white/5">Ref: 400x160px</span>
                              <button 
                                onClick={() => updateBrand('useLogo', !brandData.useLogo)}
                                className={`text-[9px] font-bold px-3 py-1.5 rounded-md transition-all uppercase tracking-tighter ${
                                  brandData.useLogo ? 'bg-accent text-black font-black' : 'bg-white/5 text-white/40'
                                }`}
                              >
                                {brandData.useLogo ? 'Imagen Activa' : 'Usar Texto'}
                              </button>
                            </div>
                          </div>
                          <input 
                            type="text" 
                            value={brandData.logoUrl}
                            onChange={(e) => updateBrand('logoUrl', e.target.value)}
                            className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-4 text-xs text-white focus:border-accent/40 outline-none transition-all placeholder:text-white/10"
                            placeholder="https://tu-logo.com/imagen.png"
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {adminTab === 'event' && (
                    <motion.div 
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="space-y-6"
                    >
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-1.5 h-4 bg-accent rounded-full" />
                        <span className="text-[10px] font-black text-white uppercase tracking-widest">Configuración del Evento</span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        <div className="flex flex-col gap-2">
                          <div className="flex justify-between items-center ml-1">
                            <label className="text-[10px] uppercase tracking-widest opacity-40 font-bold">URL del Banner</label>
                            <span className="text-[8px] text-white/20 font-bold py-0.5 px-2 bg-white/5 rounded border border-white/5">Ref: 1200x800px</span>
                          </div>
                          <input 
                            type="text" 
                            value={eventData.bannerImage}
                            onChange={(e) => updateField('bannerImage', e.target.value)}
                            className="bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-xs focus:border-accent outline-none transition-all"
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="text-[10px] uppercase tracking-widest opacity-40 font-bold ml-1">Etiqueta</label>
                          <input 
                            type="text" 
                            value={eventData.badge}
                            onChange={(e) => updateField('badge', e.target.value)}
                            className="bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-xs focus:border-accent outline-none transition-all"
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="text-[10px] uppercase tracking-widest opacity-40 font-bold ml-1">Lugar</label>
                          <input 
                            type="text" 
                            value={eventData.venue}
                            onChange={(e) => updateField('venue', e.target.value)}
                            className="bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-xs focus:border-accent outline-none transition-all"
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="text-[10px] uppercase tracking-widest opacity-40 font-bold ml-1">Fecha Corta</label>
                          <input 
                            type="text" 
                            value={eventData.date}
                            onChange={(e) => updateField('date', e.target.value)}
                            className="bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-xs focus:border-accent outline-none transition-all"
                            placeholder="Ej: 24 MAY 2026"
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="text-[10px] uppercase tracking-widest opacity-40 font-bold ml-1">Categoría</label>
                          <input 
                            type="text" 
                            value={eventData.category}
                            onChange={(e) => updateField('category', e.target.value)}
                            className="bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-xs focus:border-accent outline-none transition-all"
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="text-[10px] uppercase tracking-widest opacity-40 font-bold ml-1">Precio Sugerido (S/)</label>
                          <input 
                            type="number" 
                            value={eventData.price}
                            onChange={(e) => setEvents(prev => prev.map(ev => ev.id === currentEventId ? { ...ev, price: parseFloat(e.target.value) || 0 } : ev))}
                            className="bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-xs focus:border-accent outline-none transition-all"
                          />
                        </div>
                        <div className="flex flex-col gap-2 md:col-span-2">
                          <label className="text-[10px] uppercase tracking-widest opacity-40 font-bold ml-1">Título del Evento</label>
                          <div className="flex gap-2">
                            <input 
                              type="text" 
                              value={eventData.title1}
                              onChange={(e) => updateField('title1', e.target.value)}
                              className="flex-1 bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-xs focus:border-accent outline-none transition-all"
                            />
                            <input 
                              type="text" 
                              value={eventData.title2}
                              onChange={(e) => updateField('title2', e.target.value)}
                              className="flex-1 bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-xs focus:border-accent font-bold outline-none transition-all"
                            />
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 lg:col-span-3">
                          <label className="text-[10px] uppercase tracking-widest opacity-40 font-bold ml-1">Fecha, Hora y Lineup</label>
                          <div className="flex flex-col sm:flex-row gap-2">
                            <input 
                              type="text" 
                              value={eventData.dateTime}
                              onChange={(e) => updateField('dateTime', e.target.value)}
                              className="flex-1 bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-xs focus:border-accent outline-none transition-all"
                            />
                            <input 
                              type="text" 
                              value={eventData.artists}
                              onChange={(e) => updateField('artists', e.target.value)}
                              className="flex-[1.5] bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-xs focus:border-accent outline-none transition-all"
                            />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {adminTab === 'payment' && (
                    <motion.div 
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="space-y-6"
                    >
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-1.5 h-4 bg-[#742284] rounded-full" />
                        <span className="text-[10px] font-black text-white uppercase tracking-widest">Configuración de Pagos</span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="group">
                          <label className="text-[9px] text-white/30 uppercase font-bold ml-1 mb-2 block group-focus-within:text-[#742284] transition-colors">Número Yape</label>
                          <input 
                            type="text" 
                            value={yapeData.number}
                            onChange={(e) => updateYape('number', e.target.value)}
                            className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-4 text-xs text-white focus:border-[#742284]/40 outline-none transition-all"
                          />
                        </div>
                        <div className="group">
                          <label className="text-[9px] text-white/30 uppercase font-bold ml-1 mb-2 block group-focus-within:text-[#742284] transition-colors">Titular de Cuenta</label>
                          <input 
                            type="text" 
                            value={yapeData.holder}
                            onChange={(e) => updateYape('holder', e.target.value)}
                            className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-4 text-xs text-white focus:border-[#742284]/40 outline-none transition-all"
                          />
                        </div>
                        <div className="group md:col-span-2">
                          <div className="flex justify-between items-center ml-1 mb-2">
                            <label className="text-[9px] text-white/30 uppercase font-bold group-focus-within:text-[#742284] transition-colors">URL Imagen QR</label>
                            <span className="text-[8px] text-white/20 font-bold py-0.5 px-2 bg-white/5 rounded border border-white/5">Ref: 500x500px (1:1)</span>
                          </div>
                          <input 
                            type="text" 
                            value={yapeData.qrUrl}
                            onChange={(e) => updateYape('qrUrl', e.target.value)}
                            className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-4 text-xs text-white focus:border-[#742284]/40 outline-none transition-all"
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {adminTab === 'tickets' && (
                    <motion.div 
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="space-y-6"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-4 bg-accent rounded-full" />
                          <span className="text-[10px] font-black text-white uppercase tracking-widest">Gestión de Entradas</span>
                        </div>
                        <button 
                          onClick={handleAddTicketType}
                          className="flex items-center gap-2 bg-accent text-black px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-accent-dark transition-all"
                        >
                          <Plus size={14} />
                          Agregar Tipo de Entrada
                        </button>
                      </div>
                      
                      <div className="space-y-4">
                        {ticketTypes.map((ticket) => (
                          <motion.div 
                            key={ticket.id} 
                            whileHover={{ scale: 1.01, backgroundColor: "rgba(255, 255, 255, 0.08)" }}
                            className="grid grid-cols-1 md:grid-cols-[1fr_2fr_120px_40px] gap-4 bg-white/5 p-4 rounded-2xl border border-white/10 items-center transition-colors group"
                          >
                            <input 
                              type="text" 
                              value={ticket.name}
                              onChange={(e) => updateTicketType(ticket.id, 'name', e.target.value)}
                              className="bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-[11px] font-bold text-accent uppercase outline-none focus:border-accent"
                            />
                            <input 
                              type="text" 
                              value={ticket.desc}
                              onChange={(e) => updateTicketType(ticket.id, 'desc', e.target.value)}
                              className="bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-[11px] text-white/60 outline-none focus:border-accent"
                            />
                            <div className="flex items-center gap-2 px-2 bg-black/20 rounded-xl border border-white/10">
                              <span className="text-[9px] font-bold text-white/20">S/</span>
                              <input 
                                type="number" 
                                value={ticket.price}
                                onChange={(e) => updateTicketType(ticket.id, 'price', parseFloat(e.target.value) || 0)}
                                className="w-full bg-transparent text-[11px] font-bold text-white outline-none py-2"
                              />
                            </div>
                            <button 
                              onClick={() => handleDeleteTicketType(ticket.id)}
                              className="p-2.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center"
                              title="Eliminar tipo de entrada"
                            >
                              <X size={14} />
                            </button>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {adminTab === 'orders' && (
                    <motion.div 
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="space-y-6"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-4 bg-accent rounded-full" />
                          <span className="text-[10px] font-black text-white uppercase tracking-widest">Listado de Ventas / Pedidos</span>
                        </div>
                        <button 
                          onClick={() => fetchInitialData()}
                          className="text-[10px] font-bold text-accent hover:underline uppercase tracking-widest"
                        >
                          Actualizar Lista
                        </button>
                      </div>
                      
                      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                        {orders.length === 0 ? (
                          <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/10">
                            <Target size={40} className="mx-auto mb-4 opacity-20" />
                            <p className="text-[11px] uppercase font-black text-white/30 tracking-widest">No hay pedidos registrados todavía</p>
                          </div>
                        ) : (
                          orders.map((order) => (
                            <motion.div 
                              key={order.id}
                              whileHover={{ scale: 1.005, backgroundColor: "rgba(255, 255, 255, 0.08)" }}
                              className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all"
                            >
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-[12px] font-bold text-white">{order.customer_name}</span>
                                  <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${order.payment_method === 'yape' ? 'bg-[#742284]/20 text-[#742284]' : 'bg-green-500/20 text-green-400'}`}>
                                    {order.payment_method}
                                  </span>
                                </div>
                                <div className="text-[10px] text-white/40 flex flex-wrap gap-x-4">
                                  <span>{order.customer_email}</span>
                                  <span>{order.customer_whatsapp}</span>
                                  <span className="text-accent/60">{new Date(order.created_at).toLocaleString()}</span>
                                </div>
                              </div>

                              <div className="flex items-center gap-6">
                                <div className="text-right">
                                  <div className="text-[12px] font-black text-accent">S/ {order.total_price.toFixed(2)}</div>
                                  <div className="text-[9px] text-white/40 uppercase font-black">
                                    {order.tickets.map((t: any) => `${t.qty}x ${t.name}`).join(', ')}
                                  </div>
                                </div>
                                <button 
                                  onClick={() => handleDeleteOrder(order.id)}
                                  className="p-2.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm"
                                  title="Eliminar pedido"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            </motion.div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}

                  {adminTab === 'users' && (
                    <motion.div 
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="space-y-6"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-4 bg-accent rounded-full" />
                          <span className="text-[10px] font-black text-white uppercase tracking-widest">Usuarios Administradores</span>
                        </div>
                        <button 
                          onClick={handleAddUser}
                          className="flex items-center gap-2 bg-accent text-black px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-accent-dark transition-all"
                        >
                          <Plus size={14} />
                          Agregar Administrador
                        </button>
                      </div>
                      
                      <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                        {adminUsers.length === 0 ? (
                          <div className="text-center py-10 bg-white/5 rounded-2xl border border-white/5">
                            <Users size={32} className="mx-auto mb-3 opacity-20" />
                            <p className="text-[10px] uppercase font-bold text-white/30 tracking-widest">No hay usuarios adicionales registrados</p>
                          </div>
                        ) : (
                          adminUsers.map((user) => (
                            <motion.div 
                              key={user.id} 
                              whileHover={{ scale: 1.01, backgroundColor: "rgba(255, 255, 255, 0.08)" }}
                              className="grid grid-cols-1 md:grid-cols-[1fr_1fr_40px] gap-4 bg-white/5 p-4 rounded-2xl border border-white/10 items-center transition-colors group"
                            >
                              <div className="flex flex-col gap-1">
                                <label className="text-[8px] uppercase font-black text-white/30 tracking-widest ml-1">Usuario</label>
                                <div className="relative">
                                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={12} />
                                  <input 
                                    type="text" 
                                    value={user.username}
                                    onChange={(e) => handleUpdateUser(user.id, 'username', e.target.value)}
                                    className="w-full bg-black/20 border border-white/10 rounded-[10px] py-2.5 pl-9 pr-3 text-[11px] font-bold text-white outline-none focus:border-accent transition-all"
                                  />
                                </div>
                              </div>
                              <div className="flex flex-col gap-1">
                                <label className="text-[8px] uppercase font-black text-white/30 tracking-widest ml-1">Contraseña</label>
                                <div className="relative">
                                  <Edit2 className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={12} />
                                  <input 
                                    type="text" 
                                    value={user.password}
                                    onChange={(e) => handleUpdateUser(user.id, 'password', e.target.value)}
                                    className="w-full bg-black/20 border border-white/10 rounded-[10px] py-2.5 pl-9 pr-3 text-[11px] font-bold text-white outline-none focus:border-accent transition-all"
                                  />
                                </div>
                              </div>
                              <button 
                                onClick={() => handleDeleteUser(user.id)}
                                className="p-2.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all self-end md:self-center"
                                title="Eliminar usuario"
                              >
                                <X size={14} />
                              </button>
                            </motion.div>
                          ))
                        )}
                        <div className="p-4 bg-accent/5 border border-accent/10 rounded-2xl">
                          <p className="text-[9px] text-accent font-bold uppercase tracking-[0.2em] leading-relaxed">
                            ⚠️ Nota: Los usuarios registrados aquí tendrán acceso total al panel de administración. El usuario maestro 'Julio' siempre tiene acceso como respaldo.
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {adminTab === 'seo' && (
                    <motion.div 
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="space-y-6"
                    >
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-1.5 h-4 bg-accent rounded-full" />
                        <span className="text-[10px] font-black text-white uppercase tracking-widest">Configuración SEO y Metadatos</span>
                      </div>
                      
                      <div className="space-y-6">
                        <div className="group">
                          <label className="text-[9px] text-white/30 uppercase font-bold ml-1 mb-2 block group-focus-within:text-accent transition-colors">Título del Sitio (Meta Title)</label>
                          <input 
                            type="text" 
                            value={seoData.title}
                            onChange={(e) => updateSeo('title', e.target.value)}
                            className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-4 text-xs text-white focus:border-accent/40 outline-none transition-all"
                            placeholder="Nombre de tu marca - Descriptivo"
                          />
                        </div>

                        <div className="group">
                          <label className="text-[9px] text-white/30 uppercase font-bold ml-1 mb-2 block group-focus-within:text-accent transition-colors">Descripción Corta (Meta Description)</label>
                          <textarea 
                            value={seoData.description}
                            onChange={(e) => updateSeo('description', e.target.value)}
                            className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-4 text-xs text-white focus:border-accent/40 outline-none transition-all min-h-[100px] resize-none"
                            placeholder="Resume lo que ofrece tu sitio para los buscadores..."
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="group">
                            <label className="text-[9px] text-white/30 uppercase font-bold ml-1 mb-2 block group-focus-within:text-accent transition-colors">Palabras Clave (Keywords)</label>
                            <input 
                              type="text" 
                              value={seoData.keywords}
                              onChange={(e) => updateSeo('keywords', e.target.value)}
                              className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-4 text-xs text-white focus:border-accent/40 outline-none transition-all"
                              placeholder="separadas por comas..."
                            />
                          </div>
                          <div className="group">
                            <div className="flex justify-between items-center ml-1 mb-2">
                              <label className="text-[9px] text-white/30 uppercase font-bold group-focus-within:text-accent transition-colors">Imagen Compartir (OG Image URL)</label>
                              <span className="text-[8px] text-white/20 font-bold py-0.5 px-2 bg-white/5 rounded border border-white/5">Ref: 1200x630px</span>
                            </div>
                            <input 
                              type="text" 
                              value={seoData.ogImage}
                              onChange={(e) => updateSeo('ogImage', e.target.value)}
                              className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-4 text-xs text-white focus:border-accent/40 outline-none transition-all"
                              placeholder="URL de la imagen para redes sociales"
                            />
                          </div>
                        </div>

                        <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                          <h4 className="text-[10px] font-bold text-accent uppercase tracking-widest mb-3 flex items-center gap-2">
                             <Search size={12} />
                             Vista Previa Google
                          </h4>
                          <div className="space-y-1">
                            <div className="text-[#8ab4f8] text-lg hover:underline cursor-pointer truncate">{seoData.title}</div>
                            <div className="text-[#34a853] text-[13px]">{window.location.origin}</div>
                            <div className="text-white/60 text-[13px] line-clamp-2">{seoData.description}</div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between pt-6 border-t border-white/5 mt-6">
                <button 
                  onClick={() => {
                    const original = INITIAL_EVENTS.find(e => e.id === currentEventId);
                    if (original) {
                      setEvents(prev => prev.map(e => e.id === currentEventId ? { ...original } : e));
                    }
                  }}
                  className="text-[10px] uppercase tracking-widest font-bold text-white/40 hover:text-white transition-colors"
                >
                  Restaurar Evento Original
                </button>
                <div className="flex items-center gap-6">
                  {hasUnsavedChanges && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-[9px] font-black text-accent uppercase tracking-[0.2em] animate-pulse"
                    >
                      Tienes cambios sin guardar
                    </motion.div>
                  )}
                  <button 
                    onClick={handleSaveChanges}
                    disabled={!hasUnsavedChanges || isSaving}
                    className={`flex items-center gap-2 px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${
                      hasUnsavedChanges 
                      ? 'bg-accent text-black shadow-[0_10px_20px_rgba(212,175,55,0.3)] hover:scale-[1.02]' 
                      : 'bg-white/5 text-white/20 border border-white/5'
                    }`}
                  >
                    {isSaving ? (
                      <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                    ) : (
                      <Check size={14} />
                    )}
                    {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-4 lg:gap-6 min-h-fit lg:min-h-[500px]">
          {/* Featured Card */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="group relative rounded-[32px] bg-[#111] overflow-hidden shadow-2xl border border-white/5 p-5 md:p-6 lg:p-8 flex flex-col justify-end min-h-[380px] md:min-h-[420px] lg:min-h-full"
          >
            <div className="absolute inset-0 z-0">
              <img 
                src={eventData.bannerImage} 
                alt={eventData.title2} 
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
            </div>

            <div className="relative z-10">
              {isAdminMode && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-2 mb-4 bg-accent/20 border border-accent/30 px-3 py-1 rounded-[4px] w-fit"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-tighter text-accent">Modo Edición Activado</span>
                </motion.div>
              )}
              <span className="bg-accent text-black px-3 py-1 rounded-[4px] text-[10px] font-black uppercase mb-4 inline-block tracking-tighter">
                {eventData.badge}
              </span>
              <h1 className="text-4xl md:text-5xl lg:text-7xl font-light leading-[1.1] mb-8 tracking-tight">
                {eventData.title1} <br className="hidden md:block" /> <span className="font-bold">{eventData.title2}</span>
              </h1>
              <div className="flex flex-wrap gap-6 text-sm text-white/50">
                <span className="flex items-center gap-2"><MapPin size={14} className="text-accent" /> {eventData.venue}</span>
                <span className="flex items-center gap-2">
                  <Calendar size={14} className="text-accent" /> 
                  {eventData.dateTime}
                </span>
                <span className="flex items-center gap-2"><Star size={14} className="text-accent" /> {eventData.artists}</span>
              </div>
            </div>
          </motion.div>

          {/* Booking Panel */}
          <motion.aside 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-surface border border-border rounded-[24px] p-5 backdrop-blur-[20px] flex flex-col gap-5 h-full"
          >
            <div>
              <h2 className="text-[18px] font-bold tracking-tight">Gestión de Entradas</h2>
              <p className="text-[11px] text-white/40 mt-1 uppercase tracking-widest font-black leading-relaxed">
                Selecciona tipo de entrada para <br/>
                <span className="text-accent">{eventData.title1} {eventData.title2}</span>
              </p>
            </div>

            <div className="flex flex-col gap-3">
              {ticketTypes.map((ticket) => (
                <motion.div 
                  key={ticket.id}
                  whileHover={{ backgroundColor: "rgba(255, 255, 255, 0.08)", scale: 1.02 }}
                  className={`p-3 border rounded-[14px] bg-white/5 transition-all cursor-default ${
                    ticketQuantities[ticket.id] > 0 
                    ? 'border-accent/40 bg-accent/5' 
                    : 'border-white/5 hover:border-white/20'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      {isAdminMode ? (
                        <div className="flex flex-col gap-1">
                          <input 
                            type="text"
                            value={ticket.name}
                            onChange={(e) => updateTicketType(ticket.id, 'name', e.target.value)}
                            className="bg-white/10 border border-white/20 rounded px-2 py-0.5 text-[14px] font-bold text-white outline-none focus:border-accent"
                          />
                          <input 
                            type="text"
                            value={ticket.desc}
                            onChange={(e) => updateTicketType(ticket.id, 'desc', e.target.value)}
                            className="bg-white/10 border border-white/20 rounded px-2 py-0.5 text-[10px] text-white/60 outline-none focus:border-accent"
                          />
                        </div>
                      ) : (
                        <>
                          <h4 className="text-[14px] font-bold tracking-tight">{ticket.name}</h4>
                          <p className="text-[10px] text-white/40 mt-0.5">{ticket.desc}</p>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-3">
                    {isAdminMode ? (
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] uppercase font-bold opacity-30">Precio (S/):</span>
                        <input 
                          type="number"
                          value={ticket.price}
                          onChange={(e) => updateTicketType(ticket.id, 'price', parseFloat(e.target.value) || 0)}
                          className="w-16 bg-white/10 border border-white/20 rounded px-2 py-0.5 text-[13px] font-bold text-accent outline-none focus:border-accent"
                        />
                      </div>
                    ) : (
                      <div className="text-[15px] font-black text-accent tracking-tight">
                        {ticket.price === 0 ? 'Gratis' : `S/ ${ticket.price.toFixed(2)}`}
                      </div>
                    )}
                    
                    <div className="flex items-center gap-1.5 bg-black/40 rounded-full px-1 py-0.5 border border-white/10">
                      <button 
                        onClick={() => updateQuantity(ticket.id, -1)}
                        className="w-5 h-5 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors disabled:opacity-20"
                        disabled={ticketQuantities[ticket.id] <= 0}
                      >
                        <Minus size={10} />
                      </button>
                      <span className="w-4 text-center font-bold text-[11px]">{ticketQuantities[ticket.id]}</span>
                      <button 
                        onClick={() => updateQuantity(ticket.id, 1)}
                        className="w-5 h-5 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
                      >
                        <Plus size={10} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="mt-auto border-t border-white/10 pt-4">
              <div className="flex justify-between items-end mb-4">
                <div>
                  <span className="text-[10px] uppercase tracking-widest opacity-40 font-bold block mb-0.5">Subtotal</span>
                  <span className="text-[11px] font-medium opacity-60">
                    {totalTickets} {totalTickets === 1 ? 'Entrada' : 'Entradas'} seleccionadas
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[20px] font-black text-accent tracking-tighter">
                    {totalPrice === 0 ? 'Gratis' : `S/ ${totalPrice.toFixed(2)}`}
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setIsPaymentModalOpen(true)}
                disabled={totalTickets === 0}
                className="w-full bg-accent text-black py-3 rounded-[10px] font-black text-[11px] uppercase tracking-[0.2em] hover:bg-accent-dark transition-all disabled:opacity-20 disabled:grayscale"
              >
                Continuar con la compra
              </button>
              <p className="text-[9px] text-center text-white/30 uppercase tracking-[0.1em] mt-3">
                🔞 Apto solo para mayores de 18 años. Se requiere DNI físico.
              </p>
            </div>
          </motion.aside>
        </div>

        {/* Floating Responsive Checkout Bar (Mobile/Tablet) */}
        <AnimatePresence>
          {totalTickets > 0 && !isPaymentModalOpen && !isLoginModalOpen && !isAdminMode && (
            <motion.div 
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="fixed bottom-4 left-4 right-4 z-[80] lg:hidden"
            >
              <div className="relative group max-w-md mx-auto">
                <div className="absolute -inset-0.5 bg-accent/20 rounded-[22px] blur opacity-40"></div>
                <div className="relative bg-black/80 border border-white/10 rounded-[20px] p-1.5 pr-1.5 shadow-2xl backdrop-blur-xl flex items-center justify-between gap-4">
                  <div className="pl-5 flex flex-col justify-center">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <div className="w-1 h-3 bg-accent rounded-full opacity-70" />
                      <span className="text-[9px] font-black text-white/40 uppercase tracking-[0.1em]">{totalTickets} {totalTickets === 1 ? 'entrada' : 'entradas'}</span>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-[18px] font-black text-accent tracking-tighter">
                        {totalPrice === 0 ? 'Gratis' : `S/ ${totalPrice.toFixed(2)}`}
                      </span>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsPaymentModalOpen(true)}
                    className="bg-accent text-black px-8 py-3.5 rounded-[16px] font-black text-[11px] uppercase tracking-[0.15em] shadow-[0_10px_20px_rgba(212,175,55,0.3)] active:scale-95 transition-all hover:bg-accent-dark"
                  >
                    Continuar
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Login Modal */}
        <AnimatePresence>
          {isLoginModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center px-6">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsLoginModalOpen(false)}
                className="absolute inset-0 bg-black/80 backdrop-blur-md"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative bg-[#111] border border-white/10 p-8 rounded-[24px] w-full max-w-sm shadow-[0_30px_60px_rgba(0,0,0,0.8)]"
              >
                <div className="text-center mb-8">
                  <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center text-accent mx-auto mb-4">
                    <User size={24} />
                  </div>
                  <h3 className="text-xl font-bold">Acceso Administrativo</h3>
                  <p className="text-[10px] text-white/40 uppercase tracking-widest mt-2">Introduce tus credenciales de acceso</p>
                </div>

                <form onSubmit={handleLogin} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase tracking-widest font-bold opacity-40 ml-1">Usuario</label>
                    <input 
                      autoFocus
                      type="text" 
                      value={loginForm.user}
                      onChange={(e) => setLoginForm(prev => ({ ...prev, user: e.target.value }))}
                      className="bg-white/5 border border-white/10 rounded-[12px] py-3 px-4 text-sm outline-none focus:border-accent transition-all"
                      placeholder="Nombre de usuario"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase tracking-widest font-bold opacity-40 ml-1">Contraseña</label>
                    <input 
                      type="password" 
                      value={loginForm.pass}
                      onChange={(e) => setLoginForm(prev => ({ ...prev, pass: e.target.value }))}
                      className="bg-white/5 border border-white/10 rounded-[12px] py-3 px-4 text-sm outline-none focus:border-accent transition-all"
                      placeholder="••••••••"
                    />
                  </div>

                  {loginError && (
                    <motion.p 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="text-[10px] text-red-500 font-bold uppercase tracking-widest text-center"
                    >
                      Usuario o contraseña incorrectos
                    </motion.p>
                  )}

                  <button 
                    type="submit"
                    className="w-full bg-accent text-black py-4 rounded-[12px] font-bold text-[12px] uppercase tracking-[0.2em] mt-2 hover:bg-accent-dark transition-colors"
                  >
                    Iniciar Sesión
                  </button>
                  <button 
                    type="button"
                    onClick={() => setIsLoginModalOpen(false)}
                    className="text-[10px] text-white/40 uppercase tracking-widest font-bold mt-2 hover:text-white transition-colors"
                  >
                    Cancelar
                  </button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Payment Modal */}
        <AnimatePresence>
          {isPaymentModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center px-6">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsPaymentModalOpen(false)}
                className="absolute inset-0 bg-black/90 backdrop-blur-xl"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative bg-[#0a0a0a] border border-white/10 p-0 rounded-[28px] w-full max-w-md shadow-[0_40px_80px_rgba(0,0,0,0.9)] overflow-y-auto max-h-[95vh] no-scrollbar"
              >
                {/* Header */}
                <div className="bg-white/[0.03] p-5 border-b border-white/5 relative">
                  <button 
                    onClick={() => setIsPaymentModalOpen(false)}
                    className="absolute right-5 top-5 w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
                  >
                    <X size={18} />
                  </button>
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-accent/20 rounded-xl text-accent">
                      <Wallet size={20} />
                    </div>
                    <div>
                      <h3 className="text-xl font-black tracking-tight text-white">Método de Pago</h3>
                      <p className="text-[9px] text-white/40 uppercase tracking-[0.15em] font-black">Selecciona cómo deseas pagar</p>
                    </div>
                  </div>
                </div>

                {/* Body */}
                <div className="p-5">
                  {/* Customer Info Form */}
                  <div className="mb-5 space-y-3">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-1 h-3 bg-accent rounded-full" />
                      <span className="text-[9px] font-black text-white/40 uppercase tracking-[0.15em]">Tus Datos de Contacto</span>
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                      <div className="space-y-1 flex flex-col">
                        <label className="text-[8px] uppercase tracking-widest font-black text-white/30 ml-1">Nombre Completo</label>
                        <input 
                          type="text" 
                          value={customerData.name}
                          onChange={(e) => setCustomerData(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Tu nombre completo"
                          className="w-full bg-white/[0.03] border border-white/5 rounded-lg py-2.5 px-3.5 text-xs text-white outline-none focus:border-accent/40 focus:bg-white/[0.05] transition-all"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1 flex flex-col">
                          <label className="text-[8px] uppercase tracking-widest font-black text-white/30 ml-1">Email</label>
                          <input 
                            type="email" 
                            value={customerData.email}
                            onChange={(e) => setCustomerData(prev => ({ ...prev, email: e.target.value }))}
                            placeholder="tu@email.com"
                            className="w-full bg-white/[0.03] border border-white/5 rounded-lg py-2.5 px-3.5 text-xs text-white outline-none focus:border-accent/40 focus:bg-white/[0.05] transition-all"
                          />
                        </div>
                        <div className="space-y-1 flex flex-col">
                          <label className="text-[8px] uppercase tracking-widest font-black text-white/30 ml-1">WhatsApp</label>
                          <input 
                            type="tel" 
                            value={customerData.whatsapp}
                            onChange={(e) => setCustomerData(prev => ({ ...prev, whatsapp: e.target.value }))}
                            placeholder="+51 9..."
                            className="w-full bg-white/[0.03] border border-white/5 rounded-lg py-2.5 px-3.5 text-xs text-white outline-none focus:border-accent/40 focus:bg-white/[0.05] transition-all"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-1 h-3 bg-accent rounded-full" />
                    <span className="text-[9px] font-black text-white/40 uppercase tracking-[0.15em]">Selecciona Método de Pago</span>
                  </div>

                  {/* Selector */}
                  <div className="flex gap-3 mb-5">
                    <button 
                      onClick={() => setPaymentMethod('card')}
                      className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
                        paymentMethod === 'card' 
                        ? 'bg-accent/10 border-accent text-accent' 
                        : 'bg-white/5 border-white/10 text-white/40'
                      }`}
                    >
                      <CreditCard size={20} />
                      <span className="text-[10px] font-black uppercase tracking-widest">Tarjeta</span>
                    </button>
                    <button 
                      onClick={() => setPaymentMethod('yape')}
                      className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
                        paymentMethod === 'yape' 
                        ? 'bg-[#742284]/10 border-[#742284] text-[#742284]' 
                        : 'bg-white/5 border-white/10 text-white/40'
                      }`}
                    >
                      <div className="w-5 h-5 rounded-md bg-[#742284] flex items-center justify-center text-white font-black text-[8px]">Y</div>
                      <span className="text-[10px] font-black uppercase tracking-widest">Yape</span>
                    </button>
                  </div>

                  {paymentMethod === 'card' ? (
                    <motion.div 
                      key="card-form"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="space-y-3"
                    >
                      <div className="space-y-1.5">
                        <label className="text-[9px] uppercase tracking-widest font-bold opacity-40 ml-1">Número de Tarjeta</label>
                        <div className="relative">
                          <CreditCard className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/20" size={14} />
                          <input 
                            type="text" 
                            className="w-full bg-black/40 border border-white/10 rounded-lg py-3 pl-10 pr-4 text-xs outline-none focus:border-accent transition-all"
                            placeholder="0000 0000 0000 0000"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label className="text-[9px] uppercase tracking-widest font-bold opacity-40 ml-1">Vencimiento</label>
                          <input 
                            type="text" 
                            className="w-full bg-black/40 border border-white/10 rounded-lg py-3 px-4 text-xs outline-none focus:border-accent transition-all"
                            placeholder="MM/YY"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[9px] uppercase tracking-widest font-bold opacity-40 ml-1">CVV</label>
                          <input 
                            type="text" 
                            className="w-full bg-black/40 border border-white/10 rounded-lg py-3 px-4 text-xs outline-none focus:border-accent transition-all"
                            placeholder="***"
                          />
                        </div>
                      </div>
                      <button 
                        onClick={handlePurchase}
                        className="w-full bg-accent text-black py-3.5 rounded-lg font-black text-[11px] uppercase tracking-[0.15em] mt-1 shadow-[0_10px_20px_rgba(212,175,55,0.2)] hover:scale-[1.01] active:scale-[0.99] transition-all"
                      >
                        Continuar Pago • S/ {totalPrice.toFixed(2)}
                      </button>
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="yape-form"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="text-center space-y-4 bg-white/[0.02] p-5 rounded-[20px] border border-white/5"
                    >
                      <div className="w-32 h-32 bg-white rounded-2xl mx-auto p-2.5 flex items-center justify-center overflow-hidden">
                        {yapeData.qrUrl ? (
                          <img 
                            src={yapeData.qrUrl} 
                            alt="Yape QR" 
                            className="w-full h-full object-contain"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          /* Placeholder QR */
                          <div className="w-full h-full border-4 border-dashed border-black/10 rounded-xl flex flex-col items-center justify-center text-black/20 gap-1">
                            <div className="text-2xl text-[#742284] font-black">QR</div>
                            <p className="text-[7px] font-black uppercase tracking-tighter text-[#742284]">Escanea</p>
                          </div>
                        )}
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] text-white/50">O envía el pago al número:</p>
                        <p className="text-xl font-black text-white tracking-widest">{yapeData.number}</p>
                        <p className="text-[9px] text-accent font-bold uppercase tracking-widest">Titular: {yapeData.holder}</p>
                      </div>
                      <button 
                        onClick={() => {
                          handlePurchase();
                        }}
                        className="w-full bg-[#742284] text-white py-3.5 rounded-lg font-black text-[10px] uppercase tracking-[0.15em] mt-1 hover:bg-[#8e29a1] transition-all"
                      >
                        Ya yapeé • S/ {totalPrice.toFixed(2)}
                      </button>
                    </motion.div>
                  )}
                </div>

                {/* Footer Info */}
                <div className="p-5 pt-0 flex items-center justify-center gap-2 opacity-30">
                  <Check size={12} />
                  <span className="text-[8px] uppercase font-bold tracking-[0.15em]">Pago 100% seguro y encriptado</span>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
        
        {/* Upcoming Events Section (Moved and Refined) */}
        <section className="mt-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-5">
            <div>
              <span className="text-accent text-[9px] font-black uppercase tracking-[0.4em] mb-1.5 block">Descubre Experiencias</span>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-light tracking-tighter">Próximos <span className="font-serif italic font-normal text-white/90">Eventos</span></h2>
            </div>
            
            {/* Slider Controls */}
            <div className="flex items-center gap-3">
              <button 
                onClick={() => scrollSlider('left')}
                className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:border-white transition-all bg-white/5"
              >
                <ChevronLeft size={24} />
              </button>
              <button 
                onClick={() => scrollSlider('right')}
                className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:border-white transition-all bg-white/5"
              >
                <ChevronRight size={24} />
              </button>
              
              <div className="h-[1px] w-12 bg-white/10 self-center hidden md:block" />

              {/* Category Filters (Opciones) */}
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-6 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-all ${
                      activeCategory === cat 
                      ? 'bg-accent border-accent text-black shadow-[0_10px_20px_rgba(212,175,55,0.2)]' 
                      : 'bg-white/5 border-white/10 text-white/40 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div 
            ref={sliderRef}
            className="flex gap-4 md:gap-6 overflow-x-auto pb-6 snap-x snap-mandatory no-scrollbar"
            style={{ 
              scrollbarWidth: 'none', 
              msOverflowStyle: 'none',
              scrollPadding: '0 2rem'
            }}
          >
            <AnimatePresence mode="popLayout">
              {filteredEvents.map((event) => (
                <motion.div 
                  key={event.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  whileHover={{ y: -8 }}
                  className={`flex-none w-[240px] md:w-[280px] lg:w-[306px] snap-start group relative aspect-[4/5.2] rounded-[32px] overflow-hidden border transition-all cursor-pointer ${
                    currentEventId === event.id ? 'border-accent shadow-[0_20px_50px_rgba(212,175,55,0.1)]' : 'border-white/5 shadow-2xl'
                  }`}
                  onClick={() => {
                    setCurrentEventId(event.id);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  <img 
                    src={event.bannerImage} 
                    alt={event.title2}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                  
                  <div className="absolute top-6 left-6 flex flex-col gap-2">
                    <span className="text-[9px] font-black uppercase tracking-widest text-accent bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-accent/20 w-fit">
                      {event.badge}
                    </span>
                  </div>

                  <div className="absolute bottom-0 left-0 p-8 w-full">
                    <p className="text-[10px] font-bold text-accent uppercase tracking-[0.2em] mb-2">{event.date}</p>
                    <h3 className="text-2xl font-light leading-tight mb-6">
                      {event.title1} <br /><span className="font-bold">{event.title2}</span>
                    </h3>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-[9px] uppercase font-bold text-white/30 tracking-widest">Desde</span>
                        <span className="text-lg font-black text-white">S/ {event.price}</span>
                      </div>
                      <motion.div 
                        whileHover={{ scale: 1.1 }}
                        className="w-12 h-12 rounded-2xl bg-white text-black flex items-center justify-center shadow-xl group-hover:bg-accent transition-colors"
                      >
                        <ArrowRight size={20} />
                      </motion.div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/5 py-10 px-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center text-[10px] uppercase tracking-[0.2em] text-white/20">
          <span>&copy; 2026 BALI PREMIUM. ALL RIGHTS RESERVED.</span>
          <div className="flex gap-8 mt-4 md:mt-0">
            <a href="#" className="hover:text-white">Privacy</a>
            <a href="#" className="hover:text-white">Terms</a>
            <a href="#" className="hover:text-white">Support</a>
          </div>
        </div>
      </footer>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-[100] bg-[#050505] p-10 flex flex-col"
          >
            <div className="flex justify-between items-center mb-16">
              <span className="text-2xl font-black tracking-widest text-accent">Bali</span>
              <button onClick={() => setIsMenuOpen(false)}><X size={32} /></button>
            </div>
            <div className="flex flex-col gap-10">
              <a href="#" className="text-4xl font-light hover:text-accent">Explorar</a>
              <a href="#" className="text-4xl font-light hover:text-accent">Festivales</a>
              <a href="#" className="text-4xl font-light hover:text-accent">Conciertos</a>
              <a href="#" className="text-4xl font-light hover:text-accent">Mis Entradas</a>
            </div>
            <div className="mt-auto pt-10 border-t border-white/5 flex items-center justify-between">
               <span className="text-xs uppercase tracking-widest opacity-60">Julian R.</span>
               <button className="bg-accent text-black px-8 py-3 rounded-xl font-bold uppercase text-xs">Logout</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
