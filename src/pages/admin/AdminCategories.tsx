import React, { useState } from 'react';
import { addDoc, collection, deleteDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError } from '../../firebase';
import { Category } from '../../types';
import { Card, Button, Input } from '../../components/ui';
import { Tag, Plus, Trash2, Edit2, X, Check } from 'lucide-react';
import { motion } from 'motion/react';
import { ConfirmModal } from '../../components/ConfirmModal';

export default function AdminCategories({ categories }: { categories: Category[] }) {
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);

  const addCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    try {
      await addDoc(collection(db, 'categories'), {
        name: newCategoryName.trim(),
        order: categories.length,
        createdAt: serverTimestamp()
      });
      setNewCategoryName('');
    } catch (err) {
      handleFirestoreError(err, 'create', 'categories');
    }
  };

  const updateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory || !newCategoryName.trim()) return;
    try {
      await updateDoc(doc(db, 'categories', editingCategory.id), {
        name: newCategoryName.trim()
      });
      setEditingCategory(null);
      setNewCategoryName('');
    } catch (err) {
      handleFirestoreError(err, 'update', `categories/${editingCategory.id}`);
    }
  };

  const deleteCategory = async () => {
    if (!categoryToDelete) return;
    try {
      await deleteDoc(doc(db, 'categories', categoryToDelete));
      setCategoryToDelete(null);
    } catch (err) {
      handleFirestoreError(err, 'delete', `categories/${categoryToDelete}`);
    }
  };

  const confirmDelete = (id: string) => {
    setCategoryToDelete(id);
    setIsDeleteModalOpen(true);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-2xl mx-auto">
       <Card className="p-6 sm:p-8 bg-white border-none shadow-sm rounded-[32px] mb-8">
          <h3 className="text-xl font-black text-gray-800 italic uppercase tracking-tight flex items-center gap-2 mb-6">
             {editingCategory ? 'Edit Kategori' : 'Tambah Kategori Baru'}
          </h3>
          <form onSubmit={editingCategory ? updateCategory : addCategory} className="flex flex-col sm:flex-row gap-3">
             <div className="flex-1">
                <Input 
                   placeholder="Contoh: Promo, Minuman, Snack..." 
                   className="h-14 bg-stone-50 border-none font-bold" 
                   value={newCategoryName} 
                   onChange={e => setNewCategoryName(e.target.value)} 
                   autoFocus={!!editingCategory}
                />
             </div>
             <div className="flex gap-2">
                <Button type="submit" className="h-14 px-6 rounded-2xl flex-1 sm:flex-none">
                   {editingCategory ? <Check size={20} /> : <Plus size={20} />} 
                   <span className="ml-2 font-bold uppercase tracking-wider text-xs">
                      {editingCategory ? 'Simpan' : 'Tambah'}
                   </span>
                </Button>
                {editingCategory && (
                   <Button type="button" variant="ghost" className="h-14 w-14 rounded-2xl bg-stone-100 text-stone-500 shrink-0" onClick={() => {setEditingCategory(null); setNewCategoryName('');}}>
                      <X size={20} />
                   </Button>
                )}
             </div>
          </form>
       </Card>

       <div className="space-y-2">
          {categories.map(cat => (
             <Card key={cat.id} className="p-4 sm:p-5 bg-white border-none shadow-sm rounded-[24px] flex items-center justify-between group">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-full bg-sharas-light flex items-center justify-center text-sharas-primary">
                      <Tag size={16} />
                   </div>
                   <span className="font-bold text-gray-800 uppercase tracking-wider text-sm sm:text-base">{cat.name}</span>
                </div>
                <div className="flex gap-1">
                   <Button 
                     variant="ghost" 
                     size="icon" 
                     className="h-10 w-10 text-stone-400 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-colors"
                     onClick={() => {
                        setEditingCategory(cat); 
                        setNewCategoryName(cat.name);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                     }}
                   >
                      <Edit2 size={16} />
                   </Button>
                   <Button 
                     variant="ghost" 
                     size="icon" 
                     className="h-10 w-10 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                     onClick={() => confirmDelete(cat.id)}
                   >
                      <Trash2 size={16} />
                   </Button>
                </div>
             </Card>
          ))}
          {categories.length === 0 && (
             <div className="text-center p-8 bg-stone-50 rounded-[32px] border border-dashed border-stone-200">
               <span className="text-stone-400 font-bold block mb-2">Belum ada kategori.</span>
               <span className="text-[11px] text-stone-400 font-bold uppercase tracking-wider">Kategori berguna untuk mengelompokkan menu agar rapi.</span>
             </div>
          )}
       </div>

       <ConfirmModal 
         isOpen={isDeleteModalOpen}
         onClose={() => setIsDeleteModalOpen(false)}
         onConfirm={deleteCategory}
         title="Hapus Kategori?"
         message="Menu yang menggunakan kategori ini mungkin tidak akan tampil dengan benar jika tidak diupdate. Tindakan ini tidak dapat dibatalkan."
       />
    </motion.div>
  );
}
