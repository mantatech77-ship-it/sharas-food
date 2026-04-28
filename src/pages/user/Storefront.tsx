import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { 
  collection, 
  query, 
  onSnapshot, 
  addDoc,
  serverTimestamp, 
  doc,
  getDoc,
  orderBy
} from 'firebase/firestore';
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  Leaf, 
  ArrowLeft,
  CheckCircle2,
  Truck,
  Bell,
  Clock,
  Search,
  ChevronLeft,
  X,
  Copy,
  Check,
  Coffee,
  RotateCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';

import { db, handleFirestoreError } from '../../firebase';
import { MenuItem, Order, OrderItem, Category } from '../../types';
import { Button, Input, Card, cn } from '../../components/ui';
import { ConfirmModal } from '../../components/ConfirmModal';

export default function Storefront() {
  const navigate = useNavigate();
  const location = useLocation();

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [activeCategoryId, setActiveCategoryId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [deliveryEstimate, setDeliveryEstimate] = useState('Dibuat dengan cinta, dinikmati besok lusa!');
  
  const [isScrolled, setIsScrolled] = useState(false);
  const [logoClicks, setLogoClicks] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 60);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeCategoryId]);

  const handleLogoClick = () => {
    setLogoClicks(prev => prev + 1);
  };

  useEffect(() => {
    if (logoClicks >= 3) {
      navigate('/admin');
      setLogoClicks(0);
    }
    
    if (logoClicks > 0) {
      const timer = setTimeout(() => setLogoClicks(0), 2000);
      return () => clearTimeout(timer);
    }
  }, [logoClicks, navigate]);

  // Modals
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  // Checkout Form
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: ''
  });

  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  const [lastOrderId, setLastOrderId] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [trackedOrder, setTrackedOrder] = useState<Order | null>(null);
  const [trackOrderIdInput, setTrackOrderIdInput] = useState('');

  useEffect(() => {
    const unsubscribeMenu = onSnapshot(collection(db, 'menu_items'), (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MenuItem)).filter(i => i.available);
      setMenuItems(items);
      setLoading(false);
    }, (err) => handleFirestoreError(err, 'list', 'menu_items'));

    const qCat = query(collection(db, 'categories'), orderBy('order', 'asc'));
    const unsubscribeCat = onSnapshot(qCat, (snapshot) => {
      const cats = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
      setCategories(cats);
    }, (err) => handleFirestoreError(err, 'list', 'categories'));

    const unsubscribeSettings = onSnapshot(doc(db, 'settings', 'app'), (docSnap) => {
      if (docSnap.exists()) {
        setDeliveryEstimate(docSnap.data().deliveryEstimate);
      }
    }, (err) => handleFirestoreError(err, 'get', 'settings/app'));

    return () => {
      unsubscribeMenu();
      unsubscribeCat();
      unsubscribeSettings();
    };
  }, []);

  useEffect(() => {
    // Determine which order ID to track based on route/state
    let orderIdToTrack = null;
    if (location.pathname === '/order-success' && lastOrderId) {
      orderIdToTrack = lastOrderId;
    } else if (location.pathname === '/track-order' && trackedOrder?.id) {
      orderIdToTrack = trackedOrder.id;
    }

    if (!orderIdToTrack) return;

    const unsubscribeOrder = onSnapshot(doc(db, 'orders', orderIdToTrack), (docSnap) => {
      if (docSnap.exists()) {
        const orderData = { id: docSnap.id, ...docSnap.data() } as Order;
        setTrackedOrder(orderData);
      }
    }, (err) => handleFirestoreError(err, 'get', `orders/${orderIdToTrack}`));
    
    return () => unsubscribeOrder();
  }, [location.pathname, lastOrderId, trackedOrder?.id]);

  const addToCart = (item: MenuItem, quantity: number = 1) => {
    setCart(prev => {
      const existing = prev.find(i => i.itemId === item.id);
      if (existing) {
        return prev.map(i => i.itemId === item.id ? { ...i, quantity: i.quantity + quantity } : i);
      }
      return [...prev, { itemId: item.id, name: item.name, price: item.price, costPrice: item.costPrice || 0, quantity, discount: 0 }];
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => prev.filter(i => i.itemId !== itemId));
  };

  const updateQuantity = (itemId: string, delta: number) => {
    setCart(prev => prev.map(i => {
      if (i.itemId === itemId) {
        const newQty = Math.max(1, i.quantity + delta);
        return { ...i, quantity: newQty };
      }
      return i;
    }));
  };

  const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const placeOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerInfo.name || !customerInfo.phone || cart.length === 0) return;

    try {
      const orderData = {
        customerName: customerInfo.name,
        phoneNumber: customerInfo.phone,
        items: cart,
        totalPrice,
        status: 'pending',
        createdAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'orders'), orderData);
      setLastOrderId(docRef.id);
      setTrackedOrder({ id: docRef.id, ...orderData, createdAt: { toDate: () => new Date() } } as Order);
      setCart([]);
      navigate('/order-success');
    } catch (err) {
      handleFirestoreError(err, 'create', 'orders');
    }
  };

  const trackOrderLookup = async () => {
    if (!trackOrderIdInput) return;
    try {
       const docSnap = await getDoc(doc(db, 'orders', trackOrderIdInput.trim()));
       if (docSnap.exists()) {
         const orderData = { id: docSnap.id, ...docSnap.data() } as Order;
         setTrackedOrder(orderData);
       } else {
         setAlertMessage('Order ID tidak ditemukan. Harap cek kembali kode pesanan Anda.');
         setAlertOpen(true);
         setTrackedOrder(null);
       }
    } catch (err) {
       handleFirestoreError(err, 'get', `orders/${trackOrderIdInput}`);
    }
  };

  const copyOrderId = (id: string) => {
    navigator.clipboard.writeText(id);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-sharas-light/30">
        <motion.div 
          animate={{ opacity: [0.4, 1, 0.4], scale: [0.95, 1, 0.95] }} 
          transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
        >
          <Leaf className="h-16 w-16 text-sharas-primary fill-sharas-primary/10" />
        </motion.div>
      </div>
    );
  }

  const filteredItems = menuItems.filter(item => {
    const matchesCategory = activeCategoryId === 'all' || item.categoryIds.includes(activeCategoryId);
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-sharas-light/30 font-sans pb-24 md:pb-0 text-stone-800">
      
      {/* Menu / Home Content */}
      {location.pathname === '/' && (
        <React.Fragment>
          {/* Top Branding Section (Scrolls away) */}
          <div className="bg-white px-4 py-4 md:px-8 border-b border-stone-50">
            <div className="max-w-5xl mx-auto flex items-center justify-between">
              <div 
                className="flex items-center gap-2 cursor-pointer select-none group" 
                onClick={handleLogoClick}
              >
                <div className="flex items-center">
                  <span className="font-cursive text-3xl lowercase text-sharas-primary tracking-tight leading-none mb-1">sharas</span>
                  <div className="flex items-end ml-1">
                    <svg width="20" height="20" viewBox="0 0 24 24" className="rotate-[15deg] fill-sharas-primary translate-y-[2px]">
                      <path d="M12 3C12 3 16 7 16 13C16 19 12 23 12 23C12 23 8 19 8 13C8 7 12 3 12 3Z" />
                    </svg>
                    <svg width="16" height="16" viewBox="0 0 24 24" className="rotate-[40deg] ml-[-8px] fill-sharas-accent">
                      <path d="M12 3C12 3 16 7 16 13C16 19 12 23 12 23C12 23 8 19 8 13C8 7 12 3 12 3Z" />
                    </svg>
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => navigate('/track-order')} className="text-stone-500 bg-stone-100 hover:bg-sharas-light rounded-full h-10 w-10">
                <Clock size={20} />
              </Button>
            </div>
          </div>

          {/* Sticky Header (Search & Search Filters) */}
          <header className={cn(
            "bg-white sticky top-0 z-30 transition-all duration-300 border-b border-sharas-light/50",
            isScrolled ? "shadow-md py-2" : "py-4"
          )}>
            <div className="max-w-5xl mx-auto px-4 md:px-8 flex flex-col gap-3">
              <div className={cn(
                "flex flex-col gap-3 transition-all duration-300",
                isScrolled && "gap-2"
              )}>
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input 
                    type="text" 
                    placeholder="Mau minum apa hari ini?" 
                    className={cn(
                      "w-full bg-stone-100 text-stone-800 placeholder:text-stone-400 rounded-full pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-sharas-primary transition-all font-medium",
                      isScrolled ? "py-2" : "py-3"
                    )}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                {/* Categories */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
                  <button
                    className={cn(
                      "whitespace-nowrap rounded-full text-xs font-bold transition-all",
                      isScrolled ? "px-4 py-1.5" : "px-5 py-2.5",
                      activeCategoryId === 'all' 
                        ? "bg-sharas-primary text-white shadow-md" 
                        : "bg-white text-stone-600 border border-stone-200 hover:border-sharas-secondary"
                    )}
                    onClick={() => setActiveCategoryId('all')}
                  >
                    Semua
                  </button>
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      className={cn(
                        "whitespace-nowrap rounded-full text-xs font-bold transition-all",
                        isScrolled ? "px-4 py-1.5" : "px-5 py-2.5",
                        activeCategoryId === cat.id 
                          ? "bg-sharas-primary text-white shadow-md" 
                          : "bg-white text-stone-600 border border-stone-200 hover:border-sharas-secondary"
                      )}
                      onClick={() => setActiveCategoryId(cat.id)}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </header>

          {/* Menu Items List */}
          <main className="max-w-5xl mx-auto px-4 md:px-8 py-6">
            <div className="flex items-center text-sm font-medium text-sharas-primary bg-sharas-light p-3 rounded-2xl mb-6">
              <Truck className="mr-2" size={18} />
              <span>{deliveryEstimate}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {filteredItems.map(item => (
                <div 
                  key={item.id} 
                  className="bg-white rounded-[24px] p-3 shadow-sm border border-stone-100 flex flex-row sm:flex-col gap-4 cursor-pointer hover:shadow-md transition-shadow group"
                  onClick={() => setSelectedItem(item)}
                >
                  <div className="relative w-28 h-28 sm:w-full sm:h-48 shrink-0 bg-stone-50 rounded-2xl overflow-hidden flex items-center justify-center">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" />
                    ) : (
                      <Coffee className="text-stone-200 w-10 h-10" />
                    )}
                    {cart.find(c => c.itemId === item.id) && (
                      <div className="absolute top-2 right-2 bg-sharas-primary text-white text-xs font-black min-w-[24px] h-6 flex items-center justify-center rounded-full border-2 border-white shadow-sm px-1.5">
                        {cart.find(c => c.itemId === item.id)?.quantity}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 flex flex-col justify-center sm:justify-start">
                    <h3 className="text-base sm:text-lg font-bold text-stone-900 line-clamp-2 leading-tight">{item.name}</h3>
                    <p className="text-xs text-stone-400 line-clamp-2 sm:line-clamp-3 mt-1 font-medium">{item.description}</p>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="font-black text-stone-900 pt-0 sm:pt-2">Rp {item.price.toLocaleString('id-ID')}</span>
                      <button 
                        className="bg-sharas-light text-sharas-primary hover:bg-sharas-secondary hover:text-white p-2 rounded-full transition-colors hidden sm:flex"
                        onClick={(e) => { e.stopPropagation(); addToCart(item); }}
                      >
                        <Plus size={20} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredItems.length === 0 && (
              <div className="text-center py-20">
                <p className="text-gray-400 font-medium">Menu tidak ditemukan</p>
              </div>
            )}
          </main>
        </React.Fragment>
      )}

      {/* Item Detail Modal/Sheet */}
      <AnimatePresence>
        {selectedItem && (
          <React.Fragment>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-50 md:flex md:items-center md:justify-center backdrop-blur-sm"
              onClick={() => setSelectedItem(null)}
            >
              <motion.div 
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="absolute bottom-0 w-full bg-white rounded-t-[32px] md:relative md:w-[480px] md:h-[600px] md:rounded-[32px] flex flex-col overflow-hidden max-h-[90vh]"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="relative w-full h-64 md:h-72 bg-gray-100 shrink-0">
                  {selectedItem.imageUrl ? (
                    <img src={selectedItem.imageUrl} alt={selectedItem.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      <Coffee size={64} />
                    </div>
                  )}
                  <button 
                    onClick={() => setSelectedItem(null)}
                    className="absolute top-4 right-4 bg-white/80 backdrop-blur p-2 rounded-full shadow-sm text-gray-700 hover:bg-white"
                  >
                    <X size={20} />
                  </button>
                </div>
                
                <div className="p-6 md:p-8 flex-1 overflow-y-auto">
                  <div className="flex flex-wrap gap-2 mb-3">
                    {selectedItem.categoryIds.map(catId => {
                      const cat = categories.find(c => c.id === catId);
                      return cat ? (
                         <span key={catId} className="bg-sharas-light text-sharas-primary text-[11px] font-bold uppercase tracking-wider px-2 py-1 rounded-md">
                           {cat.name}
                         </span>
                      ) : null;
                    })}
                  </div>
                  <h2 className="text-2xl font-black text-stone-900 mb-2">{selectedItem.name}</h2>
                  <p className="text-lg font-black text-sharas-primary mb-6">Rp {selectedItem.price.toLocaleString('id-ID')}</p>
                  <div className="prose prose-sm text-stone-600 pb-20 md:pb-0">
                    <p>{selectedItem.description}</p>
                  </div>
                </div>

                <div className="p-4 md:p-6 pb-8 md:pb-6 bg-white border-t border-stone-100 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)]">
                  <button 
                    className="w-full bg-sharas-primary hover:bg-sharas-accent text-white font-black py-4 rounded-2xl text-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                    onClick={() => {
                      addToCart(selectedItem);
                      setSelectedItem(null);
                    }}
                  >
                    <Plus size={20} />
                    Tambah ke Keranjang
                  </button>
                </div>
              </motion.div>
            </motion.div>
          </React.Fragment>
        )}
      </AnimatePresence>

      {/* Floating Bottom Cart Indicator (GoFood Style) */}
      {location.pathname === '/' && totalItems > 0 && (
        <motion.div 
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="fixed bottom-4 left-0 w-full px-4 z-40"
        >
          <div 
            onClick={() => navigate('/cart')}
            className="max-w-5xl mx-auto bg-stone-900 hover:bg-black text-white rounded-[24px] p-4 flex items-center justify-between cursor-pointer shadow-2xl transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="relative bg-white/20 p-2.5 rounded-xl">
                 <ShoppingCart size={20} className="text-white" />
                 <span className="absolute -top-2 -right-2 bg-sharas-accent text-white text-[11px] font-bold w-5 h-5 flex items-center justify-center rounded-full shadow-sm">
                   {totalItems}
                 </span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-stone-300 font-bold uppercase tracking-wider">Total Belanja</span>
                <span className="text-sm font-black whitespace-nowrap">Rp {totalPrice.toLocaleString('id-ID')}</span>
              </div>
            </div>
            <div className="flex items-center font-bold text-sm bg-white/10 px-4 py-2 rounded-xl">
              Checkout <ChevronLeft size={16} className="rotate-180 ml-1" />
            </div>
          </div>
        </motion.div>
      )}

      {/* Cart Page */}
      {location.pathname === '/cart' && (
        <div className="max-w-2xl mx-auto bg-white min-h-screen md:min-h-0 md:my-8 md:rounded-[32px] md:shadow-xl overflow-hidden pb-32">
          <div className="sticky top-0 bg-white z-20 px-4 py-4 flex items-center gap-4 border-b border-gray-100">
            <button onClick={() => navigate('/')} className="bg-gray-50 hover:bg-gray-100 p-2 rounded-full transition-colors">
              <ArrowLeft size={20} className="text-gray-700" />
            </button>
            <h1 className="text-lg font-black text-gray-900 my-0 py-0 leading-none">Keranjang Pesanan</h1>
          </div>

          {cart.length === 0 ? (
            <div className="px-6 py-20 flex flex-col items-center justify-center text-center">
              <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 mb-6">
                <ShoppingCart size={48} />
              </div>
              <h2 className="text-xl font-black text-gray-900 mb-2">Keranjang Kosong</h2>
              <p className="text-sm text-gray-500 mb-8">Keranjangmu masih kosong nih, yuk isi dulu!</p>
              <button 
                onClick={() => navigate('/')} 
                className="bg-sharas-primary text-white font-bold px-8 py-3 rounded-full hover:bg-sharas-accent"
              >
                Order Sekarang
              </button>
            </div>
          ) : (
            <div className="p-4 md:p-8">
              <div className="space-y-6">
                 {/* Order Items */}
                 <div className="space-y-4">
                   {cart.map((item) => (
                     <div key={item.itemId} className="flex items-start justify-between gap-4 py-4 border-b border-gray-100">
                       <div className="flex-1">
                          <h4 className="font-bold text-gray-900 leading-tight mb-1">{item.name}</h4>
                          <h5 className="font-black text-sharas-primary text-sm">Rp {item.price.toLocaleString('id-ID')}</h5>
                       </div>
                       <div className="flex items-center gap-3">
                          <div className="flex items-center bg-gray-50 border border-gray-200 rounded-full">
                             <button 
                               onClick={() => {
                                 if (item.quantity === 1) {
                                   setItemToDelete(item.itemId);
                                 } else {
                                   updateQuantity(item.itemId, -1);
                                 }
                               }}
                               className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-sharas-primary transition-colors"
                             >
                               {item.quantity === 1 ? <Trash2 size={14} className="text-red-400" /> : <Minus size={14} />}
                             </button>
                             <span className="w-6 text-center text-sm font-black text-gray-900">{item.quantity}</span>
                             <button 
                               onClick={() => updateQuantity(item.itemId, 1)}
                               className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-sharas-primary transition-colors"
                             >
                               <Plus size={14} />
                             </button>
                          </div>
                       </div>
                     </div>
                   ))}
                   
                   <button 
                      onClick={() => navigate('/')}
                      className="text-sharas-primary font-bold text-sm flex items-center mt-2 hover:text-sharas-accent"
                   >
                     <Plus size={16} className="mr-1" /> Tambah pesanan lainnya
                   </button>
                 </div>

                 {/* Checkout Form */}
                 <div className="pt-6">
                    <h3 className="font-black text-lg text-gray-900 mb-4">Detail Pengiriman</h3>
                    <form id="checkout-form" onSubmit={placeOrder} className="space-y-4">
                      <div>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1 mb-1 block">Nama Lengkap</label>
                        <input 
                          type="text" 
                          required 
                          value={customerInfo.name}
                          onChange={e => setCustomerInfo({...customerInfo, name: e.target.value})}
                          placeholder="Masukkan nama anda" 
                          className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm font-medium border border-gray-200 focus:outline-none focus:border-sharas-primary focus:bg-white transition-all"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1 mb-1 block">No WhatsApp</label>
                        <input 
                          type="tel" 
                          required 
                          value={customerInfo.phone}
                          onChange={e => setCustomerInfo({...customerInfo, phone: e.target.value})}
                          placeholder="Cth: 081234567890" 
                          className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm font-medium border border-gray-200 focus:outline-none focus:border-sharas-primary focus:bg-white transition-all"
                        />
                      </div>
                    </form>
                 </div>
              </div>
            </div>
          )}

          {/* Sticky Checkout Bar */}
          {cart.length > 0 && (
            <div className="fixed md:absolute bottom-0 left-0 w-full bg-white border-t border-gray-100 p-4 pb-6 md:pb-4 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)]">
               <div className="flex items-center justify-between mb-3 text-sm">
                 <span className="font-bold text-gray-500">Total Pembayaran</span>
                 <span className="font-black text-lg text-gray-900">Rp {totalPrice.toLocaleString('id-ID')}</span>
               </div>
               <button 
                 type="submit"
                 form="checkout-form"
                 className="w-full bg-sharas-primary hover:bg-sharas-accent text-white font-black py-4 rounded-2xl text-[15px] transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
               >
                 PESAN SEKARANG
               </button>
            </div>
          )}
        </div>
      )}

      {/* Order Success */}
      {location.pathname === '/order-success' && (
        <div className="min-h-screen bg-sharas-primary flex items-center justify-center p-4">
           <motion.div 
             initial={{ scale: 0.9, opacity: 0 }}
             animate={{ scale: 1, opacity: 1 }}
             className="bg-white max-w-sm w-full rounded-[32px] p-8 text-center shadow-2xl relative overflow-hidden"
           >
             <div className="w-20 h-20 bg-green-100 rounded-full text-green-500 flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 size={40} />
             </div>
             <h2 className="text-2xl font-black text-stone-900 mb-2 leading-tight">YAY!<br/>Pesanan Berhasil</h2>
             <p className="text-sm font-medium text-stone-500 mb-6">Pesananmu sudah masuk dan akan segera kami proses.</p>
             
             <div 
               className="bg-sharas-light p-4 rounded-2xl border border-sharas-secondary/20 mb-6 cursor-pointer hover:bg-sharas-secondary/5 transition-colors relative group"
               onClick={() => lastOrderId && copyOrderId(lastOrderId)}
               title="Klik untuk salin"
             >
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Copy size={14} className="text-sharas-primary" />
                </div>
                <p className="text-[11px] font-bold text-stone-400 uppercase tracking-wider mb-1">ID Pesanan Anda (Klik untuk Salin)</p>
                <div className="font-mono font-black text-lg text-stone-900 select-all user-select-all flex items-center justify-center relative">
                  {lastOrderId}
                  <AnimatePresence>
                    {isCopied && (
                      <motion.span 
                        initial={{ opacity: 0, scale: 0.5, y: 5 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                        className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-green-600 bg-white border border-green-100 shadow-sm px-3 py-1 rounded-full flex items-center gap-1 whitespace-nowrap z-10"
                      >
                        <Check size={10} /> Copied!
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
                <p className="text-xs text-sharas-primary font-bold mt-2">Simpan ID ini untuk melacak status!</p>
             </div>

             <div className="space-y-3">
               <button 
                 onClick={() => {
                   if (lastOrderId) setTrackOrderIdInput(lastOrderId);
                   navigate('/track-order');
                 }}
                 className="w-full bg-stone-900 hover:bg-black text-white font-bold py-3.5 rounded-xl transition-all"
               >
                 Lacak Pesanan
               </button>
               <button 
                 onClick={() => navigate('/')}
                 className="w-full bg-white hover:bg-stone-50 text-stone-600 font-bold py-3.5 rounded-xl border border-stone-200 transition-all"
               >
                 Kembali ke Beranda
               </button>
             </div>
           </motion.div>
        </div>
      )}

      {/* Track Order */}
      {location.pathname === '/track-order' && (
         <div className="min-h-screen bg-[#fafafa]">
           <header className="bg-white sticky top-0 z-30 shadow-sm px-4 py-4 flex items-center gap-4">
             <button onClick={() => navigate('/')} className="bg-gray-50 hover:bg-gray-100 p-2 rounded-full transition-colors">
               <ArrowLeft size={20} className="text-gray-700" />
             </button>
             <h1 className="text-lg font-black text-gray-900 my-0 py-0">Lacak Pesanan</h1>
           </header>

           <div className="max-w-xl mx-auto p-4 md:p-8">
             <div className="bg-white rounded-[24px] p-6 shadow-sm border border-stone-100 mb-6">
                <label className="text-xs font-bold text-stone-500 uppercase tracking-widest ml-1 mb-2 block">Cek dengan ID Pesanan</label>
                <div className="flex flex-col sm:flex-row gap-2">
                   <input 
                     type="text"
                     value={trackOrderIdInput}
                     onChange={e => setTrackOrderIdInput(e.target.value)}
                     className="w-full sm:flex-1 bg-stone-50 rounded-xl px-4 py-3 text-sm font-medium border border-stone-200 focus:outline-none focus:border-sharas-primary focus:bg-white font-mono"
                     placeholder="ID: xXxYyY123"
                   />
                   <div className="flex gap-2 w-full sm:w-auto">
                    <button 
                      onClick={trackOrderLookup}
                      className="flex-1 sm:flex-none bg-sharas-primary hover:bg-sharas-accent text-white font-bold px-6 py-3 rounded-xl transition-all"
                    >
                      Cek
                    </button>
                    {(trackOrderIdInput || trackedOrder) && (
                       <button 
                         onClick={() => {
                           setTrackOrderIdInput('');
                           setTrackedOrder(null);
                         }}
                         className="bg-stone-100 hover:bg-stone-200 text-stone-600 font-bold p-3 rounded-xl transition-all flex items-center justify-center shrink-0"
                         title="Reset Pencarian"
                       >
                         <RotateCcw size={20} />
                       </button>
                     )}
                   </div>
                </div>
             </div>

             {trackedOrder && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-[24px] p-6 sm:p-8 shadow-sm border border-gray-100"
                >
                  <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-100">
                    <div>
                       <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Status Saat Ini</h3>
                       <h2 className="text-xl font-black text-gray-900 capitalize">
                          {trackedOrder.status === 'pending' && 'Menunggu Konfirmasi'}
                          {trackedOrder.status === 'confirmed' && 'Sedang Diproses'}
                          {trackedOrder.status === 'completed' && 'Selesai'}
                          {trackedOrder.status === 'cancelled' && 'Dibatalkan'}
                       </h2>
                    </div>
                    <div className={cn(
                       "w-12 h-12 flex items-center justify-center rounded-2xl",
                       trackedOrder.status === 'pending' && "bg-sharas-light text-sharas-primary",
                       trackedOrder.status === 'confirmed' && "bg-blue-100 text-blue-600",
                       trackedOrder.status === 'completed' && "bg-green-100 text-green-600",
                       trackedOrder.status === 'cancelled' && "bg-red-100 text-red-600",
                    )}>
                       {trackedOrder.status === 'pending' && <Clock size={24} />}
                       {trackedOrder.status === 'confirmed' && <Coffee size={24} />}
                       {trackedOrder.status === 'completed' && <CheckCircle2 size={24} />}
                       {trackedOrder.status === 'cancelled' && <X size={24} />}
                    </div>
                  </div>

                  <div className="relative pl-6 space-y-8">
                     <div className="absolute left-[11px] top-2 bottom-8 w-0.5 bg-gray-100"></div>
                     
                     <div className="relative">
                        <div className={cn(
                           "absolute -left-[30px] w-4 h-4 rounded-full border-4 border-white mt-1 uppercase",
                           ['pending', 'confirmed', 'completed'].includes(trackedOrder.status) ? "bg-sharas-primary" : "bg-gray-200"
                        )}></div>
                        <h4 className="text-sm font-bold text-gray-900 mb-1 leading-tight">Order Terkirim</h4>
                        <p className="text-xs font-medium text-gray-500">Kami sudah menerima orderanmu. Jangan kemana-mana!</p>
                     </div>

                     <div className="relative">
                        <div className={cn(
                           "absolute -left-[30px] w-4 h-4 rounded-full border-4 border-white mt-1 uppercase",
                           ['confirmed', 'completed'].includes(trackedOrder.status) ? "bg-sharas-primary" : "bg-gray-200"
                        )}></div>
                        <h4 className="text-sm font-bold text-gray-900 mb-1 leading-tight">Sedang Disiapkan</h4>
                        <p className="text-xs font-medium text-gray-500">Pesananmu lagi kami siapkan dengan sepenuh hati.</p>
                     </div>

                     <div className="relative">
                        <div className={cn(
                           "absolute -left-[30px] w-4 h-4 rounded-full border-4 border-white mt-1 uppercase",
                           ['completed'].includes(trackedOrder.status) ? "bg-green-500" : "bg-gray-200"
                        )}></div>
                        <h4 className="text-sm font-bold text-gray-900 mb-1 leading-tight">Selesai / Dikirim</h4>
                        <p className="text-xs font-medium text-gray-500">Pesanan telah selesai! Siap untuk kamu santap.</p>
                     </div>
                  </div>

                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white rounded-[24px] p-6 sm:p-8 shadow-sm border border-gray-100 overflow-hidden"
                  >
                    <h3 className="text-sm font-black text-gray-900 mb-4 flex items-center gap-2">
                       <Truck size={18} className="text-sharas-primary" />
                       Info Pesanan
                    </h3>
                    
                    <div className="space-y-4">
                       <div className="grid grid-cols-2 gap-4 pb-4 border-b border-gray-50">
                          <div>
                             <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Nama Pemesan</p>
                             <p className="text-sm font-bold text-gray-800">{trackedOrder.customerName}</p>
                          </div>
                          <div>
                             <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">No WhatsApp</p>
                             <p className="text-sm font-bold text-gray-800">{trackedOrder.phoneNumber}</p>
                          </div>
                       </div>

                       <div className="space-y-3">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Item Pesanan</p>
                          {trackedOrder.items.map((item, idx) => (
                             <div key={idx} className="flex justify-between items-start text-sm">
                                <div className="flex items-center gap-2">
                                   <span className="bg-gray-100 text-gray-600 text-[10px] font-black w-5 h-5 flex items-center justify-center rounded shrink-0">
                                      {item.quantity}x
                                   </span>
                                   <div>
                                      <span className="font-medium text-gray-700">{item.name}</span>
                                      {item.discount ? (
                                        <p className="text-[10px] text-green-600 font-bold uppercase mt-0.5">Diskon: -Rp {item.discount.toLocaleString('id-ID')}</p>
                                      ) : null}
                                   </div>
                                </div>
                                <span className="font-bold text-gray-900">Rp {((item.price * item.quantity) - (item.discount || 0)).toLocaleString('id-ID')}</span>
                             </div>
                          ))}
                       </div>

                       <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
                          <span className="text-sm font-bold text-gray-500">Total Transaksi</span>
                          <span className="text-lg font-black text-sharas-primary">Rp {trackedOrder.totalPrice.toLocaleString('id-ID')}</span>
                       </div>
                    </div>
                  </motion.div>
                </motion.div>
             )}
           </div>
         </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal 
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={() => {
          if (itemToDelete) {
            removeFromCart(itemToDelete);
            setItemToDelete(null);
          }
        }}
        title="Hapus Item?"
        message="Apakah kamu yakin ingin menghapus item ini dari keranjang?"
        confirmText="Hapus"
        cancelText="Batal"
      />

      <ConfirmModal 
        isOpen={alertOpen}
        onClose={() => setAlertOpen(false)}
        onConfirm={() => setAlertOpen(false)}
        title="Info"
        message={alertMessage}
        confirmText="OK"
        showCancel={false}
        variant="primary"
      />
    </div>
  );
}
