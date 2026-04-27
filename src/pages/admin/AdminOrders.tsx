import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Order, OrderStatus } from '../../types';
import { Card, cn } from '../../components/ui';
import { 
  Clock, 
  Truck, 
  ClipboardList, 
  Package,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronRight
} from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';

export default function AdminOrders({ orders }: { orders: Order[] }) {
  const [activeTab, setActiveTab] = useState<'incoming' | 'active' | 'past'>('incoming');
  const navigate = useNavigate();

  const incomingOrders = orders.filter(o => o.status === 'pending');
  const activeOrders = orders.filter(o => o.status === 'confirmed');
  const pastOrders = orders.filter(o => ['completed', 'cancelled'].includes(o.status));

  const getStatusConfig = (status: OrderStatus) => {
    switch (status) {
      case 'pending': return { 
        color: 'text-orange-600', 
        bg: 'bg-orange-50', 
        border: 'border-orange-200',
        accent: 'bg-orange-500',
        icon: AlertCircle, 
        label: 'Pesanan Baru',
        pulse: true 
      };
      case 'confirmed': return { 
        color: 'text-blue-600', 
        bg: 'bg-blue-50', 
        border: 'border-blue-200',
        accent: 'bg-blue-500',
        icon: Clock, 
        label: 'Diproses' 
      };
      case 'completed': return { 
        color: 'text-green-600', 
        bg: 'bg-green-50', 
        border: 'border-green-200',
        accent: 'bg-green-500',
        icon: CheckCircle2, 
        label: 'Selesai' 
      };
      case 'cancelled': return { 
        color: 'text-red-600', 
        bg: 'bg-red-50', 
        border: 'border-red-200',
        accent: 'bg-red-500',
        icon: XCircle, 
        label: 'Batal' 
      };
    }
  };

  const OrderRow: React.FC<{ order: Order }> = ({ order }) => {
    const config = getStatusConfig(order.status);
    const StatusIcon = config.icon;

    return (
      <Card 
        onClick={() => navigate(`/admin/orders/${order.id}`)}
        className={cn(
          "mb-3 overflow-hidden rounded-[24px] border-2 transition-all duration-300 p-0 relative group cursor-pointer",
          "border-stone-50 hover:border-sharas-secondary hover:shadow-lg hover:scale-[1.01] active:scale-[0.99]"
        )}
      >
        {/* Status Side Accent */}
        <div className={cn("absolute left-0 top-0 bottom-0 w-1.5 transition-all group-hover:w-2", config.accent)} />
        
        <div className="flex items-center justify-between p-4 sm:p-5 select-none pl-6 bg-white">
          <div className="flex items-center gap-4 min-w-0 flex-1">
            <div className={cn(
              "flex shrink-0 w-10 h-10 rounded-full items-center justify-center relative", 
              config.bg, config.border, "border"
            )}>
              <StatusIcon size={20} className={config.color} />
              {config.pulse && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
                </span>
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-gray-800 tracking-tight truncate">
                  {order.customerName}
                </h3>
                <span className="text-[10px] font-mono text-stone-400 font-bold hidden sm:inline">#{order.id.slice(0, 8)}</span>
              </div>
              <div className="flex items-center gap-3 mt-0.5">
                <span className="text-[10px] sm:text-xs font-bold text-stone-500 flex items-center gap-1">
                  <Package size={12} className="shrink-0" /> {order.items.length} item
                </span>
                <span className="text-[10px] sm:text-xs font-bold text-stone-400 flex items-center gap-1">
                  <Clock size={12} className="shrink-0" /> {order.createdAt?.toDate ? format(order.createdAt.toDate(), 'HH:mm') : '-'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-6 shrink-0">
            <div className="text-right hidden sm:block">
              <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest leading-none mb-1">Total</p>
              <p className="text-sm sm:text-base font-black text-sharas-primary">
                Rp {order.totalPrice.toLocaleString('id-ID')}
              </p>
            </div>
            <div className={cn(
              "px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 border shadow-sm",
              config.bg, config.color, config.border
            )}>
              <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", config.accent)} />
              {config.label}
            </div>
            <ChevronRight className="text-stone-300 group-hover:text-sharas-primary transition-colors" size={20} />
          </div>
        </div>
      </Card>
    );
  };

  const TabButton = ({ id, label, count, active }: { id: any, label: string, count: number, active: boolean }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={cn(
        "shrink-0 px-4 py-3 rounded-2xl text-xs sm:text-sm font-black uppercase tracking-widest transition-all relative overflow-hidden whitespace-nowrap",
        active ? "bg-stone-800 text-white shadow-lg" : "bg-stone-100 text-stone-500 hover:bg-stone-200"
      )}
    >
      <span className="flex items-center justify-center gap-2">
        {label}
        {count > 0 && (
          <span className={cn(
            "w-5 h-5 shrink-0 rounded-full flex items-center justify-center text-[10px] leading-none",
            active ? "bg-sharas-primary text-white" : "bg-stone-300 text-stone-600"
          )}>
            {count}
          </span>
        )}
      </span>
    </button>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
       <div className="flex overflow-x-auto no-scrollbar gap-2 p-1.5 bg-stone-50 rounded-[28px] border border-stone-100 sticky top-4 z-40 shadow-xl shadow-stone-900/[0.02] backdrop-blur-md">
          <TabButton 
            id="incoming" 
            label="Baru" 
            count={incomingOrders.length} 
            active={activeTab === 'incoming'} 
          />
          <TabButton 
            id="active" 
            label="Proses" 
            count={activeOrders.length} 
            active={activeTab === 'active'} 
          />
          <TabButton 
            id="past" 
            label="Riwayat" 
            count={pastOrders.length} 
            active={activeTab === 'past'} 
          />
       </div>

       <div className="min-h-[400px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'incoming' && (
                <div className="space-y-1">
                  {incomingOrders.length === 0 ? (
                    <EmptyState message="Tidak ada pesanan baru" />
                  ) : incomingOrders.map(o => <OrderRow key={o.id} order={o} />)}
                </div>
              )}

              {activeTab === 'active' && (
                <div className="space-y-1">
                   {activeOrders.length === 0 ? (
                    <EmptyState message="Tidak ada pesanan aktif" icon={<Truck size={32} />} />
                   ) : activeOrders.map(o => <OrderRow key={o.id} order={o} />)}
                </div>
              )}

              {activeTab === 'past' && (
                <div className="space-y-1">
                  {pastOrders.length === 0 ? (
                    <EmptyState message="Belum ada riwayat" icon={<ClipboardList size={32} />} />
                  ) : pastOrders.map(o => <OrderRow key={o.id} order={o} />)}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
       </div>
    </motion.div>
  );
}

const EmptyState = ({ message, icon }: { message: string, icon?: React.ReactNode }) => (
  <div className="p-16 text-center animate-in fade-in zoom-in-95 duration-500">
    <div className="w-20 h-20 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-dashed border-stone-200 text-stone-300">
      {icon || <AlertCircle size={32} />}
    </div>
    <h3 className="text-stone-700 font-black text-lg uppercase tracking-widest">{message}</h3>
    <p className="text-stone-400 font-bold text-xs mt-1">Status akan otomatis terupdate saat ada aksi.</p>
  </div>
);
