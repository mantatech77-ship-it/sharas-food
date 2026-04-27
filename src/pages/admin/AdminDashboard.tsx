import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { auth, db, handleFirestoreError, googleProvider } from '../../firebase';
import { collection, query, orderBy, onSnapshot, getDoc, doc, setDoc, addDoc, updateDoc, deleteDoc, serverTimestamp, getDocs, writeBatch } from 'firebase/firestore';
import { onAuthStateChanged, signOut, signInWithPopup, User } from 'firebase/auth';
import { MenuItem, Order, Category, OrderStatus } from '../../types';
import { Button, Input, Card, cn } from '../../components/ui';
import { 
  ClipboardList, 
  Store, 
  Tag, 
  Settings, 
  LogOut, 
  Plus, 
  Trash2, 
  Edit,
  XCircle,
  Truck,
  Calendar,
  ChefHat,
  Leaf,
  ArrowLeft,
  Package,
  Search,
  CheckCircle2,
  Bell
} from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { motion, AnimatePresence } from 'motion/react';

// Sub-components for each tab
import AdminOrders from './AdminOrders';
import AdminOrderDetail from './AdminOrderDetail';
import AdminMenu from './AdminMenu';
import AdminMenuEdit from './AdminMenuEdit';
import AdminCategories from './AdminCategories';
import AdminSettings from './AdminSettings';
import AdminProductionRecap from './AdminProductionRecap';
import AdminReports from './AdminReports';

export default function AdminDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // States for data
  const [orders, setOrders] = useState<Order[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        try {
          const adminDoc = await getDoc(doc(db, 'admins', u.uid));
          setIsAdmin(adminDoc.exists());
        } catch (err) {
          console.error("Admin check failed:", err);
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      const qOrders = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
      const unsubscribeOrders = onSnapshot(qOrders, (snapshot) => {
        const o = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Order));
        setOrders(o);
      }, (err) => handleFirestoreError(err, 'list', 'orders'));

      const qAllMenu = query(collection(db, 'menu_items'));
      const unsubscribeAllMenu = onSnapshot(qAllMenu, (snapshot) => {
         const items = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as MenuItem));
         setMenuItems(items);
      }, (err) => handleFirestoreError(err, 'list', 'menu_items'));

      const qCat = query(collection(db, 'categories'), orderBy('order', 'asc'));
      const unsubscribeCat = onSnapshot(qCat, (snapshot) => {
        const cats = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Category));
        setCategories(cats);
      }, (err) => handleFirestoreError(err, 'list', 'categories'));

      return () => {
        unsubscribeOrders();
        unsubscribeAllMenu();
        unsubscribeCat();
      };
    }
  }, [isAdmin]);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error(err);
    }
  };

  const ALLOWED_ADMIN_EMAILS = ['mantatech77@gmail.com', 'bimantarasc@gmail.com'];

  const bootstrapAdmin = async () => {
    if (user && user.email && ALLOWED_ADMIN_EMAILS.includes(user.email)) {
      try {
         await setDoc(doc(db, 'admins', user.uid), { email: user.email });
         setIsAdmin(true);
      } catch (err) {
         handleFirestoreError(err, 'create', `admins/${user.uid}`);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-stone-50">
        <motion.div 
          animate={{ opacity: [0.4, 1, 0.4], scale: [0.95, 1, 0.95] }} 
          transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
        >
          <Leaf className="h-16 w-16 text-sharas-primary fill-sharas-primary/10" />
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col pt-12 items-center px-4">
         <div className="flex items-center gap-2 mb-8" onClick={() => navigate('/')} role="button">
            <ArrowLeft className="text-stone-400" />
            <span className="text-stone-500 font-bold uppercase tracking-widest text-sm">Kembali ke Home</span>
         </div>
         <Card className="p-8 sm:p-12 text-center space-y-6 w-full max-w-sm rounded-[32px] shadow-sm">
            <div className="mx-auto w-24 h-24 bg-sharas-light rounded-full flex items-center justify-center text-sharas-primary mb-2">
               <Settings size={40} />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-gray-800 italic uppercase">Admin Area</h2>
              <p className="text-stone-500 font-medium text-sm">Silakan login untuk mengakses dashboard pengelola.</p>
            </div>
            <Button onClick={handleLogin} size="lg" className="w-full rounded-2xl h-14 bg-sharas-primary hover:bg-sharas-accent text-white">Login via Google</Button>
         </Card>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col pt-12 items-center px-4">
         <div className="flex items-center gap-2 mb-8" onClick={() => navigate('/')} role="button">
            <ArrowLeft className="text-stone-400" />
            <span className="text-stone-500 font-bold uppercase tracking-widest text-sm">Kembali ke Home</span>
         </div>
         <Card className="p-8 sm:p-12 text-center space-y-6 w-full max-w-sm rounded-[32px] border-sharas-secondary/30">
            <div className="mx-auto w-24 h-24 bg-red-50 rounded-full flex items-center justify-center text-red-500 mb-2">
               <XCircle size={40} />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-gray-800 italic uppercase">Akses Ditolak</h3>
              <p className="text-stone-600 font-medium text-sm">Akun ini tidak memiliki akses admin.</p>
            </div>
            {user.email && ALLOWED_ADMIN_EMAILS.includes(user.email) && (
              <Button onClick={bootstrapAdmin} size="lg" className="w-full rounded-2xl bg-sharas-primary hover:bg-sharas-accent text-white">Jadikan Saya Admin</Button>
            )}
            <div className="pt-4 border-t border-stone-100">
              <Button variant="outline" className="w-full rounded-2xl h-14 border-stone-200 text-stone-600" onClick={() => signOut(auth)}>
                <LogOut size={18} className="mr-2" /> Ganti Akun
              </Button>
            </div>
         </Card>
      </div>
    );
  }

  const currentTab = location.pathname.split('/').pop() || 'orders';

  return (
    <div className="min-h-screen bg-stone-50 pb-24 md:pb-0 font-sans flex flex-col md:flex-row">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-stone-200 sticky top-0 h-screen">
        <div className="p-6 border-b border-stone-100 flex items-center justify-center cursor-pointer" onClick={() => navigate('/')}>
           <div className="flex items-center">
              <span className="font-cursive text-2xl lowercase text-sharas-primary tracking-tight leading-none mb-1">sharas admin</span>
              <div className="flex items-end ml-1">
                 <svg width="16" height="16" viewBox="0 0 24 24" className="rotate-[15deg] fill-sharas-primary translate-y-[2px]">
                   <path d="M12 3C12 3 16 7 16 13C16 19 12 23 12 23C12 23 8 19 8 13C8 7 12 3 12 3Z" />
                 </svg>
                 <svg width="12" height="12" viewBox="0 0 24 24" className="rotate-[40deg] ml-[-6px] fill-sharas-accent">
                   <path d="M12 3C12 3 16 7 16 13C16 19 12 23 12 23C12 23 8 19 8 13C8 7 12 3 12 3Z" />
                 </svg>
              </div>
           </div>
        </div>
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <NavItem to="/admin/orders" icon={<ClipboardList size={20} />} label="Pesanan" active={currentTab === 'orders' || currentTab === 'admin'} badge={orders.filter(o => o.status === 'pending').length} />
          <NavItem to="/admin/recap" icon={<ChefHat size={20} />} label="Rekap Produksi" active={currentTab === 'recap'} />
          <NavItem to="/admin/reports" icon={<Calendar size={20} />} label="Laporan" active={currentTab === 'reports'} />
          <NavItem to="/admin/menu" icon={<Store size={20} />} label="Kelola Menu" active={currentTab === 'menu' || location.pathname.includes('/admin/menu/')} />
          <NavItem to="/admin/categories" icon={<Tag size={20} />} label="Kategori" active={currentTab === 'categories'} />
          <NavItem to="/admin/settings" icon={<Settings size={20} />} label="Profil & Pengaturan" active={currentTab === 'settings'} />
        </nav>
        <div className="p-4 border-t border-stone-100">
           <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-stone-200 rounded-full overflow-hidden shrink-0">
                 {user.photoURL ? <img src={user.photoURL} alt="user" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-stone-300" />}
              </div>
              <div className="overflow-hidden">
                 <p className="text-xs font-bold text-stone-800 truncate">{user.displayName || 'Admin'}</p>
                 <p className="text-[11px] text-stone-500 font-bold truncate">{user.email}</p>
              </div>
           </div>
           <Button variant="ghost" className="w-full justify-start text-stone-500 hover:text-red-600 hover:bg-red-50 rounded-xl" onClick={() => signOut(auth)}>
             <LogOut size={16} className="mr-2" /> Logout
           </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 overflow-x-hidden">
         {/* Mobile Header */}
          <div className="md:hidden flex items-center justify-between mb-6 bg-white p-4 rounded-3xl shadow-sm border border-stone-100">
            <div className="flex items-center gap-4">
               <div className="flex items-center">
                  <span className="font-cursive text-xl lowercase text-sharas-primary leading-none mb-1">sharas</span>
                  <div className="flex items-end ml-0.5">
                     <svg width="14" height="14" viewBox="0 0 24 24" className="rotate-[15deg] fill-sharas-primary translate-y-[1px]">
                       <path d="M12 3C12 3 16 7 16 13C16 19 12 23 12 23C12 23 8 19 8 13C8 7 12 3 12 3Z" />
                     </svg>
                     <svg width="10" height="10" viewBox="0 0 24 24" className="rotate-[40deg] ml-[-4px] fill-sharas-accent">
                       <path d="M12 3C12 3 16 7 16 13C16 19 12 23 12 23C12 23 8 19 8 13C8 7 12 3 12 3Z" />
                     </svg>
                  </div>
               </div>
               <div>
                  <h1 className="text-[10px] font-black text-stone-400 uppercase leading-none mb-0.5 tracking-widest">Admin Panel</h1>
                  <p className="text-xs font-bold text-gray-800 leading-none">Halo, {user.displayName?.split(' ')[0] || 'Admin'}</p>
               </div>
            </div>
            {currentTab === 'orders' && orders.filter(o => o.status === 'pending').length > 0 && (
               <div className="bg-red-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full animate-bounce shadow-lg shadow-red-200">
                 {orders.filter(o => o.status === 'pending').length} Baru
               </div>
            )}
         </div>

         <AnimatePresence mode="wait">
            <Routes>
               <Route path="/" element={<Navigate to="orders" replace />} />
               <Route path="orders" element={<AdminOrders orders={orders} />} />
               <Route path="orders/:id" element={<AdminOrderDetail />} />
               <Route path="recap" element={<AdminProductionRecap orders={orders} />} />
               <Route path="reports" element={<AdminReports orders={orders} />} />
               <Route path="menu" element={<AdminMenu menuItems={menuItems} categories={categories} />} />
               <Route path="menu/edit/:id" element={<AdminMenuEdit menuItems={menuItems} categories={categories} />} />
               <Route path="categories" element={<AdminCategories categories={categories} />} />
               <Route path="settings" element={<AdminSettings />} />
            </Routes>
         </AnimatePresence>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-stone-200 pb-safe z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
         <div className="flex px-2 py-2 items-center justify-around h-16">
            <MobileNavItem to="/admin/orders" icon={<ClipboardList size={24} />} label="Pesanan" active={currentTab === 'orders' || currentTab === 'admin'} badge={orders.filter(o => o.status === 'pending').length} />
            <MobileNavItem to="/admin/recap" icon={<ChefHat size={24} />} label="Rekap" active={currentTab === 'recap'} />
            <MobileNavItem to="/admin/reports" icon={<Calendar size={24} />} label="Laporan" active={currentTab === 'reports'} />
            <MobileNavItem to="/admin/menu" icon={<Store size={24} />} label="Menu" active={currentTab === 'menu' || location.pathname.includes('/admin/menu/')} />
            <MobileNavItem to="/admin/settings" icon={<Settings size={24} />} label="Profil" active={currentTab === 'settings'} />
         </div>
      </nav>
    </div>
  );
}

function NavItem({ to, icon, label, active, badge }: { to: string, icon: React.ReactNode, label: string, active: boolean, badge?: number }) {
  const navigate = useNavigate();
  return (
    <button 
      onClick={() => navigate(to)}
      className={cn(
        "w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all duration-200",
        active ? "bg-sharas-light text-sharas-primary font-bold" : "text-stone-500 hover:bg-stone-50 hover:text-stone-900 font-medium"
      )}
    >
      <div className="flex items-center gap-3">
         {icon}
         <span className="text-sm">{label}</span>
      </div>
      {badge ? (
        <div className="bg-red-500 text-white min-w-[20px] h-5 px-1.5 flex items-center justify-center rounded-full text-[11px] font-bold">
          {badge}
        </div>
      ) : null}
    </button>
  );
}

function MobileNavItem({ to, icon, label, active, badge }: { to: string, icon: React.ReactNode, label: string, active: boolean, badge?: number }) {
  const navigate = useNavigate();
  return (
    <button 
      onClick={() => navigate(to)}
      className="relative flex-1 flex flex-col items-center justify-center gap-1 h-full select-none"
    >
      <div className={cn(
         "transition-all duration-300 p-1.5 rounded-full",
         active ? "bg-sharas-light text-sharas-primary -translate-y-1" : "text-stone-400"
      )}>
         {icon}
         {badge ? (
           <div className="absolute top-1 right-[20%] lg:right-[30%] bg-red-500 text-white min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full text-[9px] font-black border-2 border-white">
             {badge}
           </div>
         ) : null}
      </div>
      <span className={cn(
         "text-[11px] transition-all duration-300",
         active ? "font-bold text-sharas-primary" : "font-semibold text-stone-400"
      )}>
        {label}
      </span>
    </button>
  );
}
