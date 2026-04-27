import React from 'react';
import { Order } from '../../types';
import { 
  Card,
  cn
} from '../../components/ui';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShoppingBag, 
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Calculator
} from 'lucide-react';
import { motion } from 'motion/react';

export default function AdminReports({ orders }: { orders: Order[] }) {
  const completedOrders = orders.filter(o => o.status === 'completed');
  
  let totalRevenue = 0;
  let totalCost = 0;
  
  completedOrders.forEach(order => {
    totalRevenue += order.totalPrice;
    order.items.forEach(item => {
      // Use item.costPrice if available (captured at order time), else assume 0
      totalCost += (item.costPrice || 0) * item.quantity;
    });
  });

  const totalProfit = totalRevenue - totalCost;
  const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 pb-10">
      <div className="border-b border-stone-200 pb-4">
         <h2 className="text-2xl font-black text-gray-800 italic uppercase flex items-center gap-2">
           <Calculator className="text-sharas-primary" /> Laporan Untung/Rugi
         </h2>
         <p className="text-stone-500 font-bold text-xs uppercase tracking-widest mt-1">
           Analisa keuangan dari {completedOrders.length} pesanan yang telah selesai
         </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
         <StatCard 
            title="Total Pendapatan" 
            value={`Rp ${totalRevenue.toLocaleString('id-ID')}`} 
            icon={<TrendingUp className="text-green-500" />}
            color="border-green-100"
            trend={<span className="text-green-600 font-black flex items-center">Revenue <ArrowUpRight size={14}/></span>}
         />
         <StatCard 
            title="Total Modal (HPP)" 
            value={`Rp ${totalCost.toLocaleString('id-ID')}`} 
            icon={<TrendingDown className="text-red-400" />}
            color="border-red-50"
            trend={<span className="text-stone-400 font-bold flex items-center">Cost <ArrowDownRight size={14}/></span>}
         />
         <StatCard 
            title="Total Keuntungan" 
            value={`Rp ${totalProfit.toLocaleString('id-ID')}`} 
            icon={<DollarSign className="text-sharas-primary" />}
            color="border-sharas-secondary/30"
            trend={<span className="text-sharas-primary font-black uppercase tracking-widest text-[10px]">{profitMargin.toFixed(1)}% Margin</span>}
         />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <Card className="p-8 bg-white border-2 border-stone-100 rounded-[32px] shadow-sm">
            <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
               <ShoppingBag size={16} /> Performa Penjualan
            </h3>
            <div className="space-y-6">
               <div className="flex justify-between items-end">
                  <div>
                     <p className="text-xs font-bold text-stone-400 uppercase tracking-widest">Pesanan Selesai</p>
                     <p className="text-4xl font-black italic uppercase text-stone-800">{completedOrders.length}</p>
                  </div>
                  <div className="text-right">
                     <p className="text-xs font-bold text-stone-400 uppercase tracking-widest">Rata-rata / Order</p>
                     <p className="text-xl font-black text-sharas-primary">
                        Rp {completedOrders.length > 0 ? (totalRevenue / completedOrders.length).toLocaleString('id-ID') : '0'}
                     </p>
                  </div>
               </div>
               
               <div className="pt-6 border-t border-stone-50">
                  <h4 className="font-black text-stone-700 text-xs uppercase tracking-widest mb-4">Informasi Tambahan</h4>
                  <div className="grid grid-cols-2 gap-4">
                     <div className="p-4 bg-stone-50 rounded-2xl">
                        <p className="text-[10px] font-black text-stone-400 uppercase mb-1">Status Keuangan</p>
                        <p className={totalProfit >= 0 ? "text-green-600 font-black uppercase italic" : "text-red-500 font-black uppercase italic"}>
                           {totalProfit >= 0 ? 'Surplus' : 'Defisit'}
                        </p>
                     </div>
                     <div className="p-4 bg-sharas-light rounded-2xl">
                        <p className="text-[10px] font-black text-sharas-primary uppercase mb-1">Efisiensi</p>
                        <p className="text-sharas-primary font-black uppercase italic">
                           {profitMargin > 30 ? 'Sangat Baik' : profitMargin > 15 ? 'Baik' : 'Perlu Evaluasi'}
                        </p>
                     </div>
                  </div>
               </div>
            </div>
         </Card>

         <Card className="p-8 bg-stone-900 text-white rounded-[32px] border-none shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
               <PieChart size={160} />
            </div>
            <div className="relative z-10 h-full flex flex-col">
               <h3 className="text-xs font-black text-stone-400 uppercase tracking-widest mb-auto">Quick Tip</h3>
               <div className="mt-20">
                  <h4 className="text-2xl font-black italic uppercase leading-tight mb-4">Pastikan "Harga Modal" Terisi Benar</h4>
                  <p className="text-stone-400 text-sm font-medium leading-relaxed">
                     Laporan keuntungan hanya akan akurat jika anda mengisi field <strong>Harga Modal</strong> pada setiap menu. Keuntungan dihitung dari (Harga Jual - Harga Modal) untuk setiap item yang terjual.
                  </p>
               </div>
               <div className="mt-8 pt-8 border-t border-white/10 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-sharas-primary flex items-center justify-center">
                     <TrendingUp size={16} className="text-white" />
                  </div>
                  <p className="text-stone-300 text-xs font-bold uppercase tracking-widest italic">Tingkatkan profit dengan kontrol margin!</p>
               </div>
            </div>
         </Card>
      </div>
    </motion.div>
  );
}

function StatCard({ title, value, icon, trend, color }: { title: string, value: string, icon: React.ReactNode, trend?: React.ReactNode, color?: string }) {
   return (
      <Card className={cn("p-6 bg-white border-2 rounded-[32px] shadow-sm hover:shadow-md transition-shadow", color || "border-stone-100")}>
         <div className="flex items-start justify-between mb-4">
            <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">{title}</p>
            <div className="p-2 bg-stone-50 rounded-xl">
               {icon}
            </div>
         </div>
         <div className="space-y-1">
            <h4 className="text-xl sm:text-2xl font-black text-stone-800">{value}</h4>
            <div className="text-xs">
               {trend}
            </div>
         </div>
      </Card>
   );
}
