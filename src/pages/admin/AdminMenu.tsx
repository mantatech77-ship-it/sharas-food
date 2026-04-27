import React, { useState } from 'react';
import { addDoc, collection, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError } from '../../firebase';
import { MenuItem, Category } from '../../types';
import { Card, Button, Input, cn } from '../../components/ui';
import { Store, Plus, Trash2, Package, Search, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { ConfirmModal } from '../../components/ConfirmModal';

export default function AdminMenu({ menuItems, categories }: { menuItems: MenuItem[], categories: Category[] }) {
  const navigate = useNavigate();
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [newMenuItem, setNewMenuItem] = useState<Partial<MenuItem>>({
    name: '',
    description: '',
    price: 0,
    categoryIds: [],
    available: true,
    imageUrl: '',
    costPrice: 0
  });

  const addMenuItem = async () => {
    if (!newMenuItem.name || !newMenuItem.price || newMenuItem.costPrice === undefined || !newMenuItem.categoryIds?.length) {
       setFormError("Nama, harga, harga modal, dan minimal 1 kategori harus diisi!");
       return;
    }
    setFormError(null);
    try {
      await addDoc(collection(db, 'menu_items'), {
        ...newMenuItem,
        price: Number(newMenuItem.price),
        costPrice: Number(newMenuItem.costPrice),
        available: true,
        categoryIds: newMenuItem.categoryIds
      });
      setNewMenuItem({ name: '', description: '', price: 0, costPrice: 0, categoryIds: [], available: true, imageUrl: '' });
      setShowAddForm(false);
    } catch (err) {
      handleFirestoreError(err, 'create', 'menu_items');
    }
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      await deleteDoc(doc(db, 'menu_items', itemToDelete));
      setItemToDelete(null);
      setIsDeleteModalOpen(false);
    } catch (err) {
      handleFirestoreError(err, 'delete', `menu_items/${itemToDelete}`);
    }
  };

  const deleteMenuItem = (id: string) => {
    setItemToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const toggleMenuItem = async (item: MenuItem) => {
    try {
      await updateDoc(doc(db, 'menu_items', item.id), { available: !item.available });
    } catch (err) {
      handleFirestoreError(err, 'update', `menu_items/${item.id}`);
    }
  };

  const filteredItems = menuItems.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
   <>
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
       {!showAddForm ? (
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
              <Input 
                placeholder="Cari menu..." 
                className="pl-12 h-14 bg-white shadow-sm border-2 border-stone-100 rounded-2xl"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button 
              className="h-14 px-8 bg-sharas-primary text-white hover:bg-sharas-accent border-none rounded-2xl flex gap-2 font-black uppercase tracking-widest whitespace-nowrap"
              onClick={() => setShowAddForm(true)}
            >
              <Plus size={20} /> Tambah Menu
            </Button>
          </div>
       ) : (
          <Card className="p-6 sm:p-8 bg-white border-2 border-sharas-secondary/30 shadow-xl shadow-sharas-primary/5 rounded-[32px] relative">
             <Button variant="ghost" size="icon" className="absolute top-4 right-4 bg-stone-100 rounded-full" onClick={() => setShowAddForm(false)}>
                <X size={16} />
             </Button>
             <h3 className="text-xl font-black text-gray-800 italic uppercase tracking-tight flex items-center gap-2 mb-6">
                Tambah Menu
             </h3>
             {formError && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }} 
                  animate={{ opacity: 1, x: 0 }}
                  className="p-3 bg-red-50 text-red-500 text-[10px] font-black uppercase tracking-widest rounded-xl mb-4 border border-red-100 flex items-center gap-2"
                >
                  <X size={14} className="shrink-0" /> {formError}
                </motion.div>
             )}
             <div className="space-y-4">
                <div className="space-y-1">
                   <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider ml-2 block">Nama Menu</label>
                   <Input placeholder="Cth: Nasi Goreng Spesial" className="h-12 bg-stone-50 border-none px-4" value={newMenuItem.name} onChange={e => setNewMenuItem({...newMenuItem, name: e.target.value})} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                   <div className="space-y-1">
                      <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider ml-2 block">Harga Jual (Rp)</label>
                      <Input placeholder="Cth: 25000" type="number" className="h-12 bg-stone-50 border-none px-4" value={newMenuItem.price || ''} onChange={e => setNewMenuItem({...newMenuItem, price: Number(e.target.value)})} />
                   </div>
                   <div className="space-y-1">
                      <label className="text-[11px] font-bold text-sharas-primary uppercase tracking-wider ml-2 block">Harga Modal (Rp)</label>
                      <Input placeholder="Cth: 15000" type="number" className="h-12 bg-stone-50 border-none px-4 font-bold text-sharas-primary" value={newMenuItem.costPrice || ''} onChange={e => setNewMenuItem({...newMenuItem, costPrice: Number(e.target.value)})} />
                   </div>
                </div>
                <div className="space-y-1">
                   <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider ml-2 block">Kategori</label>
                   <div className="flex flex-wrap gap-2">
                      {categories.map(cat => (
                         <button
                            key={cat.id}
                            type="button"
                            onClick={() => {
                               const current = newMenuItem.categoryIds || [];
                               const next = current.includes(cat.id) ? current.filter(id => id !== cat.id) : [...current, cat.id];
                               setNewMenuItem({...newMenuItem, categoryIds: next});
                            }}
                            className={cn(
                               "px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all",
                               newMenuItem.categoryIds?.includes(cat.id) ? "bg-sharas-primary text-white" : "bg-stone-100 text-stone-500 hover:bg-stone-200"
                            )}
                         >
                            {cat.name}
                         </button>
                      ))}
                   </div>
                </div>
                <div className="space-y-1">
                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 block">Deskripsi (Opsional)</label>
                   <textarea 
                      placeholder="Jelaskan sedikit tentang menu ini..." 
                      className="w-full min-h-[80px] border-none bg-stone-50 rounded-2xl p-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-sharas-primary"
                      value={newMenuItem.description}
                      onChange={e => setNewMenuItem({...newMenuItem, description: e.target.value})}
                   />
                </div>
                <div className="space-y-1">
                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 block">URL Gambar (Opsional)</label>
                   <Input placeholder="https://..." className="h-12 bg-stone-50 border-none text-xs" value={newMenuItem.imageUrl} onChange={e => setNewMenuItem({...newMenuItem, imageUrl: e.target.value})} />
                </div>
                <Button className="w-full h-14 text-base sm:text-lg rounded-2xl mt-4" onClick={addMenuItem}>Simpan Menu Ke Daftar</Button>
             </div>
          </Card>
       )}

       {menuItems.length === 0 && !showAddForm ? (
          <div className="p-12 text-center bg-stone-50 rounded-[32px] border border-dashed border-stone-200">
             <Store size={48} className="mx-auto text-stone-300 mb-4" />
             <p className="text-stone-400 font-bold">Belum ada menu. Yuk, tambah menu pertamamu!</p>
          </div>
       ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
             {filteredItems.map(item => (
                <Card 
                  key={item.id} 
                  className={cn(
                    "p-4 bg-white border-2 border-transparent hover:border-sharas-secondary/50 shadow-sm rounded-[24px] flex gap-4 cursor-pointer group active:scale-[0.98] transition-all",
                    !item.available && "opacity-75 grayscale-[0.5]"
                  )}
                  onClick={() => navigate(`/admin/menu/edit/${item.id}`)}
                >
                   <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-sharas-light overflow-hidden shrink-0 flex items-center justify-center group-hover:scale-105 transition-transform">
                      {item.imageUrl ? <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" /> : <Package className="w-8 h-8 text-sharas-secondary" />}
                   </div>
                   <div className="flex-1 flex flex-col min-w-0">
                      <div className="flex justify-between items-start gap-2 mb-1">
                         <h4 className="font-black text-gray-800 text-sm sm:text-base leading-tight truncate px-1">{item.name}</h4>
                         <Button 
                            variant="danger" 
                            size="icon" 
                            className="h-9 w-9 shrink-0 rounded-xl shadow-lg shadow-red-100 hover:scale-110 active:scale-90 transition-all ml-1" 
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteMenuItem(item.id);
                            }}
                          >
                            <Trash2 size={16} />
                         </Button>
                      </div>
                      <p className="text-xs font-bold text-sharas-primary mb-2 px-1">Rp {item.price.toLocaleString('id-ID')}</p>
                      
                      <div className="flex flex-wrap gap-1 mb-3 px-1">
                         {item.categoryIds.map(catId => {
                            const catName = categories.find(c => c.id === catId)?.name;
                            return catName ? (
                               <span key={catId} className="text-[10px] bg-stone-100 text-stone-500 px-1.5 py-0.5 rounded font-bold tracking-wider uppercase truncate max-w-[80px]">
                                  {catName}
                               </span>
                            ) : null;
                         })}
                      </div>

                      <div className="mt-auto pt-2 border-t border-stone-50">
                         <Button 
                           variant={item.available ? 'outline' : 'ghost'} 
                           className={cn(
                             "w-full h-8 text-[11px] rounded-xl font-bold uppercase tracking-wider border", 
                             !item.available && "bg-red-50 text-red-600 hover:bg-red-100 border-red-100"
                           )} 
                           onClick={(e) => {
                             e.stopPropagation();
                             toggleMenuItem(item);
                           }}
                         >
                            {item.available ? 'Tersedia ✅' : 'Habis / Nonaktif ❌'}
                         </Button>
                      </div>
                   </div>
                </Card>
             ))}
             {filteredItems.length === 0 && searchTerm && (
                <div className="col-span-full p-12 text-center">
                  <Search size={40} className="mx-auto text-stone-200 mb-4" />
                  <p className="text-stone-400 font-bold uppercase tracking-widest text-xs">Menu tidak ditemukan</p>
                </div>
             )}
          </div>
       )}
    </motion.div>

    <ConfirmModal 
      isOpen={isDeleteModalOpen}
      onClose={() => setIsDeleteModalOpen(false)}
      onConfirm={confirmDelete}
      title="Hapus Menu?"
      message="Data yang dihapus tidak bisa dikembalikan lagi. Yakin ingin menghapus menu ini?"
    />
   </>
  );
}
