import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError } from '../../firebase';
import { MenuItem, Category } from '../../types';
import { Card, Button, Input, cn } from '../../components/ui';
import { Store, Package, X, ArrowLeft, Save, AlertTriangle } from 'lucide-react';
import { motion } from 'motion/react';
import { ConfirmModal } from '../../components/ConfirmModal';

export default function AdminMenuEdit({ menuItems, categories }: { menuItems: MenuItem[], categories: Category[] }) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [editingItem, setEditingItem] = useState<Partial<MenuItem>>({
    name: '',
    description: '',
    price: 0,
    categoryIds: [],
    available: true,
    imageUrl: '',
    costPrice: 0
  });

  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  useEffect(() => {
    const itemToEdit = menuItems.find(item => item.id === id);
    if (itemToEdit) {
      setEditingItem({
        ...itemToEdit,
        description: itemToEdit.description || '',
        costPrice: itemToEdit.costPrice || 0,
        imageUrl: itemToEdit.imageUrl || ''
      });
    }
  }, [id, menuItems]);

  const handleUpdate = async () => {
    if (!id) return;
    if (!editingItem.name || !editingItem.price || editingItem.costPrice === undefined || !editingItem.categoryIds?.length) {
       setAlertMessage("Nama, harga jual, harga modal, dan minimal 1 kategori harus diisi!");
       setAlertOpen(true);
       return;
    }
    try {
      await updateDoc(doc(db, 'menu_items', id), {
        name: editingItem.name,
        description: editingItem.description || '',
        price: Number(editingItem.price) || 0,
        costPrice: Number(editingItem.costPrice) || 0,
        categoryIds: editingItem.categoryIds,
        imageUrl: editingItem.imageUrl || '',
        available: editingItem.available
      });
      navigate('/admin/menu');
    } catch (err) {
      handleFirestoreError(err, 'update', `menu_items/${id}`);
    }
  };

  if (!menuItems.find(item => item.id === id)) {
    return (
      <div className="p-12 text-center bg-stone-50 rounded-[32px] border border-dashed border-stone-200">
         <p className="text-stone-400 font-bold">Memuat data menu...</p>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-4">
        <Button variant="ghost" size="icon" className="bg-white rounded-full shadow-sm" onClick={() => navigate('/admin/menu')}>
          <ArrowLeft size={20} />
        </Button>
        <h2 className="text-2xl font-black text-gray-800 italic uppercase">Edit Menu</h2>
      </div>

      <Card className="p-6 sm:p-8 bg-white border-2 border-sharas-secondary/30 shadow-xl shadow-sharas-primary/5 rounded-[32px]">
         <div className="space-y-5">
            <div className="space-y-1">
               <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 block">Nama Menu</label>
               <Input 
                 placeholder="Cth: Signature Drink" 
                 className="h-12 bg-stone-50 border-none font-bold" 
                 value={editingItem.name} 
                 onChange={e => setEditingItem({...editingItem, name: e.target.value})} 
               />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 block">Harga Jual (Rp)</label>
                  <Input 
                    placeholder="Cth: 25000" 
                    type="number" 
                    className="h-12 bg-stone-50 border-none font-bold" 
                    value={editingItem.price || ''} 
                    onChange={e => setEditingItem({...editingItem, price: Number(e.target.value)})} 
                  />
               </div>
               <div className="space-y-1">
                  <label className="text-[10px] font-black text-sharas-primary uppercase tracking-widest ml-2 block">Harga Modal (Rp)</label>
                  <Input 
                    placeholder="Cth: 15000" 
                    type="number" 
                    className="h-12 bg-stone-50 border-none font-bold text-sharas-primary" 
                    value={editingItem.costPrice || ''} 
                    onChange={e => setEditingItem({...editingItem, costPrice: Number(e.target.value)})} 
                  />
               </div>
            </div>
            <div className="space-y-1">
               <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 block">Kategori</label>
               <div className="flex flex-wrap gap-2">
                  {categories.map(cat => (
                     <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                           const current = editingItem.categoryIds || [];
                           const next = current.includes(cat.id) ? current.filter(catId => catId !== cat.id) : [...current, cat.id];
                           setEditingItem({...editingItem, categoryIds: next});
                        }}
                        className={cn(
                           "px-4 py-2 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all",
                           editingItem.categoryIds?.includes(cat.id) ? "bg-sharas-primary text-white shadow-md shadow-sharas-primary/20" : "bg-stone-100 text-stone-500 hover:bg-stone-200"
                        )}
                     >
                        {cat.name}
                     </button>
                  ))}
               </div>
            </div>
            <div className="space-y-1">
               <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 block">Deskripsi</label>
               <textarea 
                  placeholder="Jelaskan sedikit tentang menu ini..." 
                  className="w-full min-h-[80px] border-none bg-stone-50 rounded-2xl p-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-sharas-primary"
                  value={editingItem.description}
                  onChange={e => setEditingItem({...editingItem, description: e.target.value})}
               />
            </div>
            <div className="space-y-1">
               <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 block">URL Gambar</label>
               <Input 
                 placeholder="https://..." 
                 className="h-12 bg-stone-50 border-none text-xs" 
                 value={editingItem.imageUrl} 
                 onChange={e => setEditingItem({...editingItem, imageUrl: e.target.value})} 
               />
            </div>

            <div className="space-y-1">
               <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 block">Status Ketersediaan</label>
               <Button 
                 variant={editingItem.available ? 'outline' : 'ghost'} 
                 className={cn("w-full h-12 rounded-xl font-black uppercase tracking-widest transition-colors", 
                   editingItem.available 
                     ? "bg-green-50 text-green-600 border-green-200 hover:bg-green-100" 
                     : "bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
                 )} 
                 onClick={() => setEditingItem({...editingItem, available: !editingItem.available})}
               >
                  {editingItem.available ? 'Tersedia ✅' : 'Habis / Nonaktif ❌'}
               </Button>
            </div>

            <div className="pt-6 border-t border-stone-100 flex gap-3">
              <Button 
                variant="outline" 
                className="flex-1 h-14 text-base rounded-2xl font-bold text-stone-500 hover:text-stone-700" 
                onClick={() => navigate('/admin/menu')}
              >
                Batal
              </Button>
              <Button 
                className="flex-1 h-14 text-base rounded-2xl font-black bg-sharas-primary hover:bg-sharas-accent text-white shadow-lg shadow-sharas-primary/20" 
                onClick={handleUpdate}
              >
                <Save className="mr-2" size={20} /> Simpan
              </Button>
            </div>
         </div>
      </Card>

      <ConfirmModal 
        isOpen={alertOpen}
        onClose={() => setAlertOpen(false)}
        onConfirm={() => setAlertOpen(false)}
        title="Data Tidak Lengkap"
        message={alertMessage}
        confirmText="Siap, Saya Cek Lagi"
        showCancel={false}
        variant="warning"
        icon={<AlertTriangle size={28} />}
      />
    </motion.div>
  );
}
