import React from 'react';
import { Order } from '../../types';
import { Card } from '../../components/ui';
import { ChefHat, Package, ClipboardCheck } from 'lucide-react';
import { motion } from 'motion/react';

export default function AdminProductionRecap({ orders }: { orders: Order[] }) {
  const activeOrders = orders.filter(o => ['pending', 'confirmed'].includes(o.status));
  
  const itemSummary: { [key: string]: { name: string, quantity: number } } = {};
  
  activeOrders.forEach(order => {
    order.items.forEach(item => {
      if (itemSummary[item.itemId]) {
        itemSummary[item.itemId].quantity += item.quantity;
      } else {
        itemSummary[item.itemId] = {
          name: item.name,
          quantity: item.quantity
        };
      }
    });
  });

  const summaryList = Object.values(itemSummary).sort((a, b) => b.quantity - a.quantity);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-4">
        <div>
           <h2 className="text-2xl font-black text-gray-800 italic uppercase flex items-center gap-2">
             <ChefHat className="text-sharas-primary" /> Rekap Produksi
           </h2>
           <p className="text-stone-500 font-bold text-xs uppercase tracking-widest mt-1">
             Total belanja produksi untuk {activeOrders.length} pesanan aktif
           </p>
        </div>
      </div>

      {summaryList.length === 0 ? (
        <Card className="p-16 text-center bg-stone-50 border-2 border-dashed border-stone-200 rounded-[32px]">
           <Package size={48} className="mx-auto text-stone-200 mb-4" />
           <p className="text-stone-400 font-bold">Tidak ada barang yang perlu diproduksi saat ini.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-6 bg-white border-2 border-sharas-secondary/20 rounded-[32px] shadow-sm">
             <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
               <ClipboardCheck size={16} /> Daftar Belanja Produksi
             </h3>
             <div className="space-y-4">
               {summaryList.map((item, idx) => (
                 <div key={idx} className="flex items-center justify-between py-3 border-b border-stone-50 last:border-0">
                    <span className="font-bold text-stone-700">{item.name}</span>
                    <div className="flex items-center gap-2">
                       <span className="text-xs font-black text-stone-400 uppercase tracking-widest">Total:</span>
                       <span className="bg-sharas-primary text-white w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg shadow-lg shadow-sharas-primary/20">
                          {item.quantity}
                       </span>
                    </div>
                 </div>
               ))}
             </div>
          </Card>
          
          <div className="space-y-4">
             <Card className="p-6 bg-stone-900 text-white rounded-[32px] border-none shadow-xl shadow-stone-900/10">
                <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">Status Produksi</p>
                <div className="flex justify-between items-end">
                   <div>
                      <h4 className="text-3xl font-black italic uppercase leading-none">Siap Rekap</h4>
                      <p className="text-stone-400 text-xs font-bold mt-2">Gunakan daftar ini untuk memesan ke supplier / bagian produksi.</p>
                   </div>
                   <ChefHat size={40} className="text-sharas-primary opacity-50" />
                </div>
             </Card>
             
             <div className="bg-sharas-light p-6 rounded-[32px] border-2 border-sharas-secondary/30">
                <h4 className="font-black text-sharas-primary uppercase tracking-widest text-xs mb-3">Tips Rekap</h4>
                <ul className="space-y-2 text-xs font-bold text-stone-600">
                   <li className="flex gap-2"><span>✅</span> <span>Cek total kuantitas sebelum memesan.</span></li>
                   <li className="flex gap-2"><span>✅</span> <span>Konfirmasi ulang pesanan 'Pending' jika perlu stok pasti.</span></li>
                   <li className="flex gap-2"><span>✅</span> <span>Gunakan data ini untuk meminimalisir kesalahan rekap manual.</span></li>
                </ul>
             </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
