/// <reference types="vite/client" />
import React, { useState, useEffect } from 'react';
import { Card, Button } from '../../components/ui';
import { Settings, LogOut, FileWarning, AlertTriangle, Check, X, Store, Clock, Save, User as UserIcon, Mail, ShieldCheck, Truck } from 'lucide-react';
import { auth, db } from '../../firebase';
import { signOut } from 'firebase/auth';
import { collection, getDocs, writeBatch, doc, serverTimestamp, getDoc, setDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { ConfirmModal } from '../../components/ConfirmModal';

export default function AdminSettings() {
  const navigate = useNavigate();
  const user = auth.currentUser;
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deliveryEstimate, setDeliveryEstimate] = useState('Dibuat dengan cinta, dinikmati besok lusa!');
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  const isDev = import.meta.env.DEV;

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, 'settings', 'app');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setDeliveryEstimate(docSnap.data().deliveryEstimate);
        }
      } catch (err) {
        console.error('Error fetching settings:', err);
      }
    };
    fetchSettings();
  }, []);

  const saveSettings = async () => {
    setIsSaving(true);
    setStatusMessage(null);
    try {
      await setDoc(doc(db, 'settings', 'app'), {
        deliveryEstimate,
        updatedAt: serverTimestamp()
      });
      setStatusMessage({ type: 'success', text: 'Pengaturan toko berhasil diperbarui!' });
      setTimeout(() => setStatusMessage(null), 3500);
    } catch (err) {
      console.error(err);
      setStatusMessage({ type: 'error', text: 'Gagal menyimpan pengaturan.' });
      setTimeout(() => setStatusMessage(null), 5000);
    } finally {
      setIsSaving(false);
    }
  };

  const seedDummyData = async () => {
    setLoading(true);
    setStatusMessage(null);
    try {
      const batch = writeBatch(db);

      // 1. Clear existing
      const collectionsToClear = ['menu_items', 'categories', 'orders'];
      for (const colName of collectionsToClear) {
        const snapshot = await getDocs(collection(db, colName));
        snapshot.forEach((d) => {
          batch.delete(doc(db, colName, d.id));
        });
      }

      // 2. Seed Categories
      const catRefs = [
        doc(collection(db, 'categories')),
        doc(collection(db, 'categories')),
        doc(collection(db, 'categories'))
      ];
      
      const catsBody = [
        { name: 'Makanan Utama', order: 0, createdAt: serverTimestamp() },
        { name: 'Minuman', order: 1, createdAt: serverTimestamp() },
        { name: 'Camilan & Dessert', order: 2, createdAt: serverTimestamp() }
      ];

      catsBody.forEach((cat, i) => {
        batch.set(catRefs[i], cat);
      });

      // 3. Seed Menu Items
      const menuData = [
        // Makanan Utama (Category 0)
        {
          name: 'Nasi Goreng Spesial',
          description: 'Nasi goreng dengan telur mata sapi, sosis, suwiran ayam, dan kerupuk udang renyah.',
          price: 25000,
          costPrice: 15000,
          categoryIds: [catRefs[0].id],
          available: true,
          imageUrl: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&q=80&w=800'
        },
        {
          name: 'Ayam Bakar Madu',
          description: 'Ayam bakar legit dengan olesan bumbu madu gurih manis, dilengkapi lalapan dan sambal terasi.',
          price: 35000,
          costPrice: 20000,
          categoryIds: [catRefs[0].id],
          available: true,
          imageUrl: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?auto=format&fit=crop&q=80&w=800'
        },
        {
          name: 'Rendang Daging Sapi',
          description: 'Daging sapi empuk yang dimasak perlahan dengan santan kental dan rempah-rempah khas Padang.',
          price: 45000,
          costPrice: 30000,
          categoryIds: [catRefs[0].id],
          available: true,
          imageUrl: 'https://images.unsplash.com/photo-1667084535311-654cfaff38f9?auto=format&fit=crop&q=80&w=800'
        },
        {
          name: 'Sate Ayam Madura',
          description: 'Sepuluh tusuk sate ayam dengan baluran bumbu kacang kental, irisan bawang merah, dan kecap manis.',
          price: 30000,
          costPrice: 18000,
          categoryIds: [catRefs[0].id],
          available: true,
          imageUrl: 'https://images.unsplash.com/photo-1628294895950-9805252327bc?auto=format&fit=crop&q=80&w=800'
        },
        {
          name: 'Mie Goreng Jawa',
          description: 'Mie goreng manis gurih khas Jawa dengan tambahan sayuran segar, telur orak-arik, dan taburan bawang goreng.',
          price: 22000,
          categoryIds: [catRefs[0].id],
          available: true,
          imageUrl: 'https://images.unsplash.com/photo-1612929633738-8fe01f7481ba?auto=format&fit=crop&q=80&w=800'
        },
        {
          name: 'Soto Ayam Lamongan',
          description: 'Soto kuah kuning segar dengan koya kerupuk udang, suwiran ayam kampung, telur rebus, dan bihun.',
          price: 27000,
          costPrice: 15000,
          categoryIds: [catRefs[0].id],
          available: true,
          imageUrl: 'https://images.unsplash.com/photo-1548684611-3bfb12d59ae1?auto=format&fit=crop&q=80&w=800'
        },
        {
          name: 'Gado-Gado Betawi',
          description: 'Sayuran rebus segar, tahu, tempe, dan telur yang disiram dengan saus kacang gurih legit.',
          price: 20000,
          categoryIds: [catRefs[0].id],
          available: true,
          imageUrl: 'https://images.unsplash.com/photo-1622359426999-786dca6fe3f4?auto=format&fit=crop&q=80&w=800'
        },
        {
          name: 'Ikan Bakar Jimbaran',
          description: 'Ikan gurame bakar dengan bumbu khas Bali yang pedas manis, disajikan hangat dengan sambal matah.',
          price: 55000,
          costPrice: 35000,
          categoryIds: [catRefs[0].id],
          available: true,
          imageUrl: 'https://images.unsplash.com/photo-1549488344-c1fbdb4d0ae1?auto=format&fit=crop&q=80&w=800'
        },
        {
          name: 'Nasi Kuning Komplit',
          description: 'Porsi lengkap nasi kuning dengan lauk ayam goreng, telur iris, kering tempe, dan sambal yang menggugah selera.',
          price: 32000,
          costPrice: 18000,
          categoryIds: [catRefs[0].id],
          available: true,
          imageUrl: 'https://images.unsplash.com/photo-1564834724105-918b73d1b9e0?auto=format&fit=crop&q=80&w=800'
        },
        {
          name: 'Bakso Urat Malang',
          description: 'Suguhan bakso sapi urat besar, bakso halus, tahu bakso, dan pangsit goreng dengan kuah kaldu sapi hangat.',
          price: 28000,
          costPrice: 15000,
          categoryIds: [catRefs[0].id],
          available: true,
          imageUrl: 'https://images.unsplash.com/photo-1599818815197-013063cbcefa?auto=format&fit=crop&q=80&w=800'
        },

        // Minuman (Category 1)
        {
          name: 'Es Teh Manis Melati',
          description: 'Teh melati segar dengan gula pasir murni dan es batu kristal pendingin dahaga.',
          price: 5000,
          costPrice: 1500,
          categoryIds: [catRefs[1].id],
          available: true,
          imageUrl: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&q=80&w=800'
        },
        {
          name: 'Es Jeruk Peras',
          description: 'Kesegaran perasan jeruk asli dengan sedikit simpelsirup manis.',
          price: 10000,
          categoryIds: [catRefs[1].id],
          available: true,
          imageUrl: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?auto=format&fit=crop&q=80&w=800'
        },
        {
          name: 'Kopi Susu Gula Aren',
          description: 'Espresso campuran arabika dengan susu creamy dan manisnya gula aren lokal.',
          price: 18000,
          categoryIds: [catRefs[1].id],
          available: true,
          imageUrl: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&q=80&w=800'
        },
        {
          name: 'Jus Alpukat Mentega',
          description: 'Alpukat mentega murni diblender halus dengan kental manis cokelat.',
          price: 15000,
          categoryIds: [catRefs[1].id],
          available: true,
          imageUrl: 'https://images.unsplash.com/photo-1605380512807-fca835df2b6b?auto=format&fit=crop&q=80&w=800'
        },
        {
          name: 'Es Cendol Dawet',
          description: 'Minuman tradisional dawet hijau dengan kuah santan gurih dan siraman gula merah kental.',
          price: 12000,
          categoryIds: [catRefs[1].id],
          available: true,
          imageUrl: 'https://images.unsplash.com/photo-1634560759086-6ecbef9978de?auto=format&fit=crop&q=80&w=800'
        },
        {
          name: 'Es Kelapa Muda Jeruk',
          description: 'Daging kelapa muda yang dipadukan dengan kesegaran air kelapa dan perasan jeruk nipis.',
          price: 15000,
          categoryIds: [catRefs[1].id],
          available: true,
          imageUrl: 'https://images.unsplash.com/photo-1523362628745-0c100150b504?auto=format&fit=crop&q=80&w=800'
        },
        {
          name: 'Wedang Jahe Susu',
          description: 'Minuman hangat sari jahe emprit yang dicampur dengan susu evaporasi manis.',
          price: 12000,
          categoryIds: [catRefs[1].id],
          available: true,
          imageUrl: 'https://images.unsplash.com/photo-1542601600647-3a722a90a105?auto=format&fit=crop&q=80&w=800'
        },
        {
          name: 'Teh Tarik Klasik',
          description: 'Racikan teh hitam dan susu yang ditarik hingga berbusa tebal, hangat dan klasik.',
          price: 14000,
          categoryIds: [catRefs[1].id],
          available: true,
          imageUrl: 'https://plus.unsplash.com/premium_photo-1691866468759-4592ba6cd3dc?auto=format&fit=crop&q=80&w=800'
        },
        {
          name: 'Matcha Latte Dingin',
          description: 'Perpaduan bubuk matcha Jepang organik dengan fresh milk premium, creamy dan nikmat.',
          price: 22000,
          categoryIds: [catRefs[1].id],
          available: true,
          imageUrl: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&q=80&w=800'
        },
        {
          name: 'Lemon Tea Beku',
          description: 'Teh hitam ringan dengan campuran perasan lemon asli dan irisan lemon bundar.',
          price: 12000,
          categoryIds: [catRefs[1].id],
          available: true,
          imageUrl: 'https://images.unsplash.com/photo-1499638848455-9008bc59eebd?auto=format&fit=crop&q=80&w=800'
        },

        // Camilan & Dessert (Category 2)
        {
          name: 'Pisang Goreng Keju',
          description: 'Pisang kepok wangi digoreng krispi dengan limpahan parutan keju cheddar dan meises coklat.',
          price: 15000,
          categoryIds: [catRefs[2].id],
          available: true,
          imageUrl: 'https://images.unsplash.com/photo-1596797038530-2c395c07337a?auto=format&fit=crop&q=80&w=800'
        },
        {
          name: 'Tahu Walik Krispi',
          description: 'Tahu pong yang dibalik dan diisi adonan bakso ayam renyah, disajikan dengan petis.',
          price: 12000,
          categoryIds: [catRefs[2].id],
          available: true,
          imageUrl: 'https://images.unsplash.com/photo-1621582236162-81766a50e90c?auto=format&fit=crop&q=80&w=800'
        },
        {
          name: 'Tempe Mendoan Hangat',
          description: 'Lembaran tempe yang digoreng garing setengah matang dengan adonan rempah, lengkap dengan sambal kecap.',
          price: 10000,
          categoryIds: [catRefs[2].id],
          available: true,
          imageUrl: 'https://images.unsplash.com/photo-1632733711679-529326f6db12?auto=format&fit=crop&q=80&w=800'
        },
        {
          name: 'Roti Bakar Nutella',
          description: 'Roti gandum tebal panggang dengan isi olesan nutella yang meleleh dan taburan kacang keju.',
          price: 20000,
          categoryIds: [catRefs[2].id],
          available: true,
          imageUrl: 'https://images.unsplash.com/photo-1525424579978-4395a1ee3aeb?auto=format&fit=crop&q=80&w=800'
        },
        {
          name: 'Es Krim Sundae Vanilla',
          description: 'Dua scoop es krim rasa vanilla lembut, disiram dengan sirup stroberi dan ceri kaleng.',
          price: 18000,
          categoryIds: [catRefs[2].id],
          available: true,
          imageUrl: 'https://images.unsplash.com/photo-1563805042-7684c8a9e9ce?auto=format&fit=crop&q=80&w=800'
        },
        {
          name: 'Kentang Goreng Keju',
          description: 'French fries potongan tebal yang disajikan panas dengan taburan bumbu balado keju.',
          price: 15000,
          categoryIds: [catRefs[2].id],
          available: true,
          imageUrl: 'https://images.unsplash.com/photo-1585109649139-366815a0d713?auto=format&fit=crop&q=80&w=800'
        },
        {
          name: 'Martabak Manis Mini',
          description: 'Martabak aneka topping mini yang empuk manis. Satu porsi isi 4 bulatan.',
          price: 25000,
          categoryIds: [catRefs[2].id],
          available: true,
          imageUrl: 'https://images.unsplash.com/photo-1627911674486-d249aa3b2bd6?auto=format&fit=crop&q=80&w=800'
        },
        {
          name: 'Klepon Pandan Legit',
          description: 'Jajanan pasar berbentuk bola ketan rasa pandan dengan isi gula merah lumer.',
          price: 8000,
          costPrice: 3000,
          categoryIds: [catRefs[2].id],
          available: true,
          imageUrl: 'https://images.unsplash.com/photo-1596791986427-02492fdf1cc6?auto=format&fit=crop&q=80&w=800'
        },
        {
          name: 'Dimsum Udang Kukus',
          description: 'Siomay dimsum berdaging udang padat dengan saus cocolan pedas manis.',
          price: 22000,
          categoryIds: [catRefs[2].id],
          available: true,
          imageUrl: 'https://images.unsplash.com/photo-1563227812-0ea4c22e6cc8?auto=format&fit=crop&q=80&w=800'
        },
        {
          name: 'Singkong Keju Merekah',
          description: 'Potongan singkong yang direbus lalu digoreng merekah pulen, ditaburi keju parut.',
          price: 14000,
          categoryIds: [catRefs[2].id],
          available: true,
          imageUrl: 'https://images.unsplash.com/photo-1605697660295-d2d46e3ca91d?auto=format&fit=crop&q=80&w=800'
        }
      ];

      menuData.forEach((item) => {
        batch.set(doc(collection(db, 'menu_items')), item);
      });

      await batch.commit();
      setStatusMessage({ type: 'success', text: 'Data berhasil di-reset dan di-seed! Memperbarui tampilan...' });
      setIsResetModalOpen(false);
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err) {
      console.error(err);
      setStatusMessage({ type: 'error', text: 'Gagal me-reset data.' });
      setIsResetModalOpen(false);
      setTimeout(() => setStatusMessage(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto space-y-8 pb-12">
       
       {/* Admin Profile Section */}
       <Card className="p-0 overflow-hidden bg-white border-none shadow-sm rounded-[32px]">
          <div className="bg-sharas-primary p-8 text-white">
             <div className="flex items-center gap-6">
                <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-[28px] flex items-center justify-center border-2 border-white/30 shrink-0">
                   {user?.photoURL ? (
                     <img src={user.photoURL} alt="admin" className="w-full h-full object-cover rounded-[26px]" />
                   ) : (
                     <UserIcon size={32} className="text-white" />
                   )}
                </div>
                <div>
                   <h2 className="text-2xl font-black italic uppercase tracking-tight">{user?.displayName || 'Administrator'}</h2>
                   <div className="flex items-center gap-2 text-white/80 font-bold text-sm">
                      <ShieldCheck size={14} />
                      <span className="uppercase tracking-widest text-[10px]">Akses Admin Terverifikasi</span>
                   </div>
                </div>
             </div>
          </div>
          <div className="p-8 space-y-4">
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-stone-50 p-4 rounded-2xl border border-stone-100">
                   <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                      <Mail size={12} /> Email Terdaftar
                   </p>
                   <p className="text-sm font-bold text-stone-800">{user?.email}</p>
                </div>
                <div className="bg-stone-50 p-4 rounded-2xl border border-stone-100">
                   <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                      <Clock size={12} /> Login Terakhir
                   </p>
                   <p className="text-sm font-bold text-stone-800">
                      {user?.metadata?.lastSignInTime ? new Date(user.metadata.lastSignInTime).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                   </p>
                </div>
             </div>
             <Button 
                variant="outline" 
                className="w-full border-stone-200 text-stone-500 hover:text-red-500 hover:bg-red-50 hover:border-red-100 rounded-2xl h-12"
                onClick={() => signOut(auth)}
             >
                <LogOut size={16} className="mr-2" /> Logout dari Akun Admin
             </Button>
          </div>
       </Card>

       {/* Application Settings Section */}
       <Card className="p-8 bg-white border-none shadow-sm rounded-[32px]">
          <div className="flex items-center justify-between mb-8">
             <h3 className="text-xl font-black text-gray-800 italic uppercase tracking-tight flex items-center gap-3">
                <div className="w-10 h-10 bg-stone-100 rounded-2xl flex items-center justify-center text-stone-400">
                   <Settings size={20} />
                </div>
                Pengaturan Aplikasi
             </h3>
             <Button 
                onClick={saveSettings}
                disabled={isSaving}
                className="rounded-2xl h-11 px-6 shadow-lg shadow-sharas-primary/10"
             >
                {isSaving ? <span className="animate-spin mr-2 text-lg">◌</span> : <Save size={16} className="mr-2" />}
                <span className="text-xs">Simpan</span>
             </Button>
          </div>

          <div className="space-y-8">
             <div className="grid grid-cols-1 gap-6">
                <div className="space-y-3">
                   <div className="flex items-center justify-between">
                      <label className="text-xs font-black text-stone-500 uppercase tracking-widest flex items-center gap-2">
                         <Truck size={14} className="text-sharas-primary" /> Estimasi Pengiriman
                      </label>
                      <span className="text-[10px] font-bold text-stone-400 italic bg-stone-100 px-2 py-0.5 rounded-full">Muncul di Header Toko</span>
                   </div>
                   <div className="relative">
                      <input
                        type="text"
                        value={deliveryEstimate}
                        onChange={(e) => setDeliveryEstimate(e.target.value)}
                        placeholder="Contoh: Dibuat dengan cinta, dinikmati besok lusa!"
                        className="w-full bg-stone-50 border-2 border-stone-100 rounded-2xl px-5 h-14 font-bold text-stone-800 focus:border-sharas-primary focus:bg-white focus:outline-none transition-all placeholder:text-stone-300"
                      />
                   </div>
                   <p className="text-[10px] font-bold text-stone-400 leading-relaxed italic px-2">
                      Gunakan teks yang menarik untuk memberi tahu pelanggan kapan pesanan mereka akan sampai.
                   </p>
                </div>
             </div>

             {/* Development Utilities */}
             {isDev && (
               <div className="pt-6 border-t border-stone-100">
                  <div className="bg-red-50 p-6 rounded-[28px] border border-red-100">
                     <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                       <div className="space-y-1">
                          <h4 className="flex items-center gap-2 font-black text-red-700 tracking-tight uppercase italic text-sm">
                             <AlertTriangle size={18} /> Mode Developer: Reset Database
                          </h4>
                          <p className="text-[11px] font-bold text-red-500/70 leading-relaxed max-w-md uppercase tracking-wider">
                             Menghapus semua data & mengisi dengan data contoh. Hanya tersedia di mode development.
                          </p>
                       </div>
                        <Button 
                          variant="danger" 
                          className="rounded-[20px] h-12 px-6 shrink-0 shadow-lg shadow-red-200 text-xs" 
                          onClick={() => setIsResetModalOpen(true)}
                          disabled={loading}
                        >
                          <FileWarning size={16} className="mr-2" /> 
                          Reset & Seed
                        </Button>
                     </div>
                  </div>
               </div>
             )}
          </div>
       </Card>

       {/* Store View Shortut */}
       <div className="pt-2">
          <Button 
            variant="outline" 
            className="w-full bg-white text-sharas-primary hover:bg-sharas-light border-2 border-sharas-secondary/10 rounded-[30px] h-16 font-black shadow-sm" 
            onClick={() => navigate('/')}
          >
            <Store size={20} className="mr-3" /> 
            <span className="uppercase tracking-tight italic">Pratinjau Toko (Customer View)</span>
          </Button>
       </div>

       <ConfirmModal 
         isOpen={isResetModalOpen}
         onClose={() => setIsResetModalOpen(false)}
         onConfirm={seedDummyData}
         title="RESET DATABASE?"
         message="Tindakan ini akan menghapus SEMUA menu, kategori, dan pesanan yang ada. Data tidak bisa dikembalikan. Lanjutkan?"
         confirmText="Ya, Reset"
       />

       {/* Floating Toast Notification */}
       <AnimatePresence>
         {statusMessage && (
           <motion.div
             initial={{ opacity: 0, y: 50, scale: 0.9 }}
             animate={{ opacity: 1, y: 0, scale: 1 }}
             exit={{ opacity: 0, scale: 0.9, y: 20 }}
             className="fixed bottom-24 md:bottom-8 left-1/2 -translate-x-1/2 z-[60] w-[90%] max-w-md"
           >
             <div className={`flex items-center gap-3 p-4 rounded-3xl shadow-2xl border-2 ${
               statusMessage.type === 'success' 
                 ? 'bg-green-50 border-green-100 text-green-800' 
                 : 'bg-red-50 border-red-100 text-red-800'
             }`}>
               <div className={`p-2 rounded-2xl ${
                 statusMessage.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
               }`}>
                 {statusMessage.type === 'success' ? <Check size={20} /> : <X size={20} />}
               </div>
               <div className="flex-1">
                 <p className="text-sm font-black leading-tight tracking-tight uppercase italic">{statusMessage.type === 'success' ? 'Berhasil!' : 'Oops!'}</p>
                 <p className="text-xs font-bold opacity-80">{statusMessage.text}</p>
               </div>
               <button onClick={() => setStatusMessage(null)} className="p-1 hover:bg-black/5 rounded-full transition-colors">
                  <X size={16} />
               </button>
             </div>
           </motion.div>
         )}
       </AnimatePresence>
    </motion.div>
  );
}

