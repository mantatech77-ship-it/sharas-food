import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError } from '../../firebase';
import { Order, OrderStatus } from '../../types';
import { Card, Button, cn } from '../../components/ui';
import { 
  Clock, 
  ArrowLeft,
  Calendar, 
  Loader2, 
  Phone, 
  Package,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Copy,
  Check,
  Edit2,
  Save,
  Trash,
  Plus,
  Minus,
  ExternalLink,
  ClipboardList
} from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { motion } from 'motion/react';
import { ConfirmModal } from '../../components/ConfirmModal';

export default function AdminOrderDetail() {
  const { id: orderId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [confirmOpen, setConfirmOpen] = useState(false);

  // Edit states
  const [isEditing, setIsEditing] = useState(false);
  const [tempItems, setTempItems] = useState<any[]>([]);
  const [tempName, setTempName] = useState('');
  const [tempPhone, setTempPhone] = useState('');
  const [tempDeliveryDate, setTempDeliveryDate] = useState('');

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const fetchOrder = async () => {
    if (!orderId) return;
    setLoading(true);
    try {
      const orderDoc = await getDoc(doc(db, 'orders', orderId));
      if (orderDoc.exists()) {
        const orderData = { id: orderDoc.id, ...orderDoc.data() } as Order;
        setOrder(orderData);
        initializeEdit(orderData);
      } else {
        console.error("Order not found");
      }
    } catch (err) {
      handleFirestoreError(err, 'get', `orders/${orderId}`);
    } finally {
      setLoading(false);
    }
  };

  const initializeEdit = (orderData: Order) => {
    setTempItems([...orderData.items]);
    setTempName(orderData.customerName);
    setTempPhone(orderData.phoneNumber);
    setTempDeliveryDate(orderData.deliveryDate || '');
  };

  const saveOrderItems = async () => {
    if (!orderId) return;
    setUpdatingId(orderId);
    try {
      const newTotal = tempItems.reduce((sum, it) => sum + (it.price * it.quantity), 0);
      await updateDoc(doc(db, 'orders', orderId), {
        customerName: tempName,
        phoneNumber: tempPhone,
        deliveryDate: tempDeliveryDate,
        items: tempItems,
        totalPrice: newTotal,
        updatedAt: serverTimestamp()
      });
      setIsEditing(false);
      // Update local state instead of re-fetching for better UX
      setOrder(prev => prev ? {
        ...prev,
        customerName: tempName,
        phoneNumber: tempPhone,
        deliveryDate: tempDeliveryDate,
        items: tempItems,
        totalPrice: newTotal
      } : null);
    } catch (err) {
      handleFirestoreError(err, 'update', `orders/${orderId}`);
    } finally {
      setUpdatingId(null);
    }
  };

  const updateOrderStatus = async (status: OrderStatus) => {
    if (!orderId) return;
    setUpdatingId(orderId);
    try {
      const updateData: any = { 
        status,
        updatedAt: serverTimestamp()
      };

      if (status === 'completed') {
        updateData.deliveryDate = format(new Date(), 'dd MMM yyyy, HH:mm', { locale: id });
      }

      await updateDoc(doc(db, 'orders', orderId), updateData);
      setOrder(prev => prev ? { ...prev, status, deliveryDate: updateData.deliveryDate || prev.deliveryDate } : null);
    } catch (err: any) {
      console.error("Error updating order:", err);
      handleFirestoreError(err, 'update', `orders/${orderId}`);
    } finally {
      setUpdatingId(null);
    }
  };

  const updateTempQty = (itemId: string, delta: number) => {
    setTempItems(prev => prev.map(it => {
      if (it.itemId === itemId) {
        return { ...it, quantity: Math.max(1, it.quantity + delta) };
      }
      return it;
    }));
  };

  const removeTempItem = (itemId: string) => {
    setTempItems(prev => prev.filter(it => it.itemId !== itemId));
  };

  const getStatusConfig = (status: OrderStatus) => {
    switch (status) {
      case 'pending': return { 
        color: 'text-orange-600', 
        bg: 'bg-orange-50', 
        border: 'border-orange-200',
        accent: 'bg-orange-500',
        icon: AlertCircle, 
        label: 'Pesanan Baru'
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

  const generateWAUrl = () => {
    if (!order) return '#';
    let phoneStr = order.phoneNumber.replace(/\D/g, '');
    if (phoneStr.startsWith('0')) {
      phoneStr = '62' + phoneStr.substring(1);
    }
    
    let text = `Halo Kak ${order.customerName},\n\nTerima kasih telah memesan di toko kami! Berikut adalah rincian tagihan (ID: #${order.id.slice(0, 8)}):\n\n`;
    order.items.forEach(it => {
      text += `- ${it.name} (${it.quantity}x) = Rp ${(it.price * it.quantity).toLocaleString('id-ID')}\n`;
    });
    text += `\n*TOTAL: Rp ${order.totalPrice.toLocaleString('id-ID')}*\n\n`;
    text += `Mohon segera lakukan pembayaran sesuai nominal di atas, dan kirimkan bukti transfer ke pesan ini. Jika ada pertanyaan, silakan balas chat ini ya.\n\nTerima kasih!`;

    return `https://wa.me/${phoneStr}?text=${encodeURIComponent(text)}`;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin text-sharas-primary mb-4" size={32} />
        <p className="text-stone-500 font-bold uppercase tracking-widest text-xs">Memuat Detail Pesanan...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-8 text-center bg-white rounded-3xl border-2 border-dashed border-stone-200">
        <XCircle className="mx-auto text-stone-300 mb-4" size={48} />
        <h2 className="text-xl font-black text-stone-700 uppercase tracking-widest">Pesanan Tidak Ditemukan</h2>
        <Button onClick={() => navigate('/admin/orders')} className="mt-4 bg-stone-100 text-stone-600 hover:bg-stone-200">Kembali ke Daftar</Button>
      </div>
    );
  }

  const config = getStatusConfig(order.status);
  const StatusIcon = config.icon;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-4xl mx-auto pb-12">
      <div className="flex items-center justify-between">
        <button 
          onClick={() => navigate('/admin/orders')}
          className="flex items-center gap-2 text-stone-500 hover:text-stone-800 transition-colors group"
        >
          <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center group-hover:bg-stone-200 transition-all">
            <ArrowLeft size={18} />
          </div>
          <span className="font-black uppercase tracking-widest text-xs">Kembali ke Daftar</span>
        </button>

        <div className={cn(
          "px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-2 border shadow-sm",
          config.bg, config.color, config.border
        )}>
          <StatusIcon size={16} />
          {config.label}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6 md:p-8 rounded-[32px] border-stone-200/60 shadow-sm relative overflow-hidden">
            <div className={cn("absolute left-0 top-0 bottom-0 w-2", config.accent)} />
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
              <div>
                <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1 leading-none">Order ID</p>
                <div 
                  className="flex items-center gap-2 text-lg font-mono font-bold text-stone-800 group cursor-pointer hover:text-sharas-primary transition-colors"
                  onClick={() => {
                    navigator.clipboard.writeText(order.id);
                    setCopiedId(order.id);
                    setTimeout(() => setCopiedId(null), 2000);
                  }}
                >
                  #{order.id.slice(0, 8)}
                  <span className="text-stone-300 text-[10px] font-mono select-none">({order.id})</span>
                  <span className={cn(
                    "p-1.5 rounded-lg transition-all",
                    copiedId ? "bg-green-100 text-green-700 opacity-100" : "bg-stone-50 text-stone-400 opacity-0 group-hover:opacity-100"
                  )}>
                    {copiedId ? <Check size={14} /> : <Copy size={14} />}
                  </span>
                </div>
              </div>
              <div className="text-left md:text-right">
                <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1 leading-none">Total Bayar</p>
                <p className="text-3xl font-black text-sharas-primary tracking-tight">
                  Rp {order.totalPrice.toLocaleString('id-ID')}
                </p>
              </div>
            </div>

            <div className="bg-stone-50 rounded-[24px] p-6 border border-stone-100">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-[11px] font-black text-stone-500 uppercase tracking-widest">Detail Pesanan</h3>
                {!isEditing && (['pending', 'confirmed'].includes(order.status)) && (
                  <Button variant="ghost" size="sm" className="h-8 text-[10px] font-black uppercase tracking-widest text-sharas-primary hover:bg-sharas-light" onClick={() => setIsEditing(true)}>
                    <Edit2 size={14} className="mr-2" /> Edit Pesanan
                  </Button>
                )}
              </div>

              <div className="space-y-4">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-stone-200">
                      <th className="pb-3 text-[10px] font-black text-stone-400 uppercase tracking-widest">Menu</th>
                      <th className="pb-3 text-[10px] font-black text-stone-400 uppercase tracking-widest text-center">Jumlah</th>
                      <th className="pb-3 text-[10px] font-black text-stone-400 uppercase tracking-widest text-right">Subtotal</th>
                      {isEditing && <th className="pb-3 text-[10px] font-black text-stone-400 uppercase tracking-widest text-right">Hapus</th>}
                    </tr>
                  </thead>
                  <tbody className="text-sm font-bold">
                    {isEditing ? (
                      tempItems.map((it, idx) => (
                        <tr key={idx} className="border-t border-stone-100/50">
                          <td className="py-4 text-stone-700">{it.name}</td>
                          <td className="py-4 text-stone-500 text-center">
                             <div className="flex items-center justify-center gap-3">
                                <button onClick={() => updateTempQty(it.itemId, -1)} className="p-1.5 bg-white border border-stone-200 rounded-lg hover:text-sharas-primary shadow-sm"><Minus size={14}/></button>
                                <span className="w-6 text-center text-stone-800">{it.quantity}</span>
                                <button onClick={() => updateTempQty(it.itemId, 1)} className="p-1.5 bg-white border border-stone-200 rounded-lg hover:text-sharas-primary shadow-sm"><Plus size={14}/></button>
                             </div>
                          </td>
                          <td className="py-4 text-stone-700 text-right font-mono">Rp {(it.price * it.quantity).toLocaleString('id-ID')}</td>
                          <td className="py-4 text-right">
                             <button onClick={() => removeTempItem(it.itemId)} className="p-2 text-red-500 hover:bg-red-50 rounded-xl"><Trash size={16}/></button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      order.items.map((it, idx) => (
                        <tr key={idx} className="border-t border-stone-100/50">
                          <td className="py-4 text-stone-700 font-bold">{it.name}</td>
                          <td className="py-4 text-stone-500 text-center">{it.quantity}x</td>
                          <td className="py-4 text-stone-700 text-right font-mono">Rp {(it.price * it.quantity).toLocaleString('id-ID')}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {isEditing && (
                <div className="flex gap-3 mt-8 pt-6 border-t border-stone-200">
                   <Button variant="ghost" className="flex-1 rounded-2xl font-bold h-12" onClick={() => { setIsEditing(false); initializeEdit(order); }}>Batal</Button>
                   <Button className="flex-1 rounded-2xl font-black bg-sharas-primary text-white h-12 shadow-lg shadow-sharas-primary/20" onClick={saveOrderItems} disabled={updatingId === order.id}>
                      {updatingId === order.id ? <Loader2 className="animate-spin mr-2" size={18}/> : <Save size={18} className="mr-2"/>}
                      Simpan Perubahan
                   </Button>
                </div>
              )}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6 rounded-[32px] border-stone-200/60 shadow-sm space-y-6">
            <h3 className="text-[11px] font-black text-stone-500 uppercase tracking-widest flex items-center gap-2">
              <ClipboardList size={14} className="text-sharas-primary" /> Informasi Pelanggan
            </h3>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Nama Lengkap</p>
                {isEditing ? (
                  <input 
                    className="w-full text-sm font-bold bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 focus:border-sharas-primary outline-none"
                    value={tempName}
                    onChange={e => setTempName(e.target.value)}
                  />
                ) : (
                  <p className="text-sm font-bold text-stone-800">{order.customerName}</p>
                )}
              </div>

              <div className="space-y-2">
                <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Nomor WhatsApp</p>
                {isEditing ? (
                  <input 
                    className="w-full text-sm font-bold bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 focus:border-sharas-primary outline-none"
                    value={tempPhone}
                    onChange={e => setTempPhone(e.target.value)}
                  />
                ) : (
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-stone-800">{order.phoneNumber}</p>
                    <a 
                      href={`https://wa.me/${order.phoneNumber.replace(/\D/g, '')}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-2 bg-green-50 text-green-600 rounded-xl hover:bg-green-100 transition-colors"
                    >
                      <ExternalLink size={14} />
                    </a>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Rencana Pengiriman</p>
                {isEditing ? (
                  <input 
                    className="w-full text-sm font-bold bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 focus:border-sharas-primary outline-none"
                    value={tempDeliveryDate}
                    onChange={e => setTempDeliveryDate(e.target.value)}
                    placeholder="Contoh: Besok Siang"
                  />
                ) : (
                  <div className="flex items-center gap-2 text-sm font-bold text-stone-800">
                    <Calendar size={14} className="text-sharas-accent" />
                    {order.deliveryDate || '-'}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Waktu Pemesanan</p>
                <div className="flex items-center gap-2 text-sm font-bold text-stone-500">
                  <Clock size={14} />
                  {order.createdAt?.toDate ? format(order.createdAt.toDate(), 'dd MMM yyyy, HH:mm', { locale: id }) : '-'}
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-stone-100 space-y-3">
              <Button
                variant="outline"
                className="w-full rounded-[20px] h-12 border-green-200 text-green-700 hover:bg-green-50 hover:text-green-800 flex items-center justify-center gap-2 font-bold"
                onClick={() => window.open(generateWAUrl(), '_blank')}
              >
                <Phone size={16} /> Kirim e-Invoice via WA
              </Button>
            </div>
          </Card>

          <Card className="p-6 rounded-[32px] border-stone-200/60 shadow-sm space-y-6">
            <h3 className="text-[11px] font-black text-stone-500 uppercase tracking-widest">Status Pesanan</h3>
            
            <div className="flex flex-col gap-3">
              {order.status === 'pending' && (
                <>
                  <Button 
                    className="w-full bg-sharas-primary hover:bg-sharas-accent shadow-lg shadow-sharas-primary/10 h-14 rounded-2xl font-black uppercase tracking-widest" 
                    onClick={() => updateOrderStatus('confirmed')}
                    disabled={updatingId === order.id}
                  >
                    {updatingId === order.id ? <Loader2 className="animate-spin mr-2" size={20} /> : <CheckCircle2 className="mr-2" size={20} />}
                    Konfirmasi Pesanan
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="w-full text-red-500 hover:bg-red-50 h-12 rounded-2xl font-bold" 
                    onClick={() => setConfirmOpen(true)}
                    disabled={updatingId === order.id}
                  >
                    Tolak / Batalkan
                  </Button>
                </>
              )}

              {order.status === 'confirmed' && (
                <Button 
                  className="w-full bg-green-500 hover:bg-green-600 shadow-lg shadow-green-100 h-14 rounded-2xl font-black uppercase tracking-widest" 
                  onClick={() => updateOrderStatus('completed')}
                  disabled={updatingId === order.id}
                >
                  {updatingId === order.id ? <Loader2 className="animate-spin mr-2" size={20} /> : <CheckCircle2 className="mr-2" size={20} />}
                  Tandai Selesai
                </Button>
              )}

              {['completed', 'cancelled'].includes(order.status) && (
                <div className={cn(
                  "flex items-center justify-center gap-3 p-5 rounded-2xl border font-bold text-sm uppercase tracking-widest text-center",
                  order.status === 'completed' ? "bg-green-50 border-green-100 text-green-600" : "bg-red-50 border-red-100 text-red-600"
                )}>
                  {order.status === 'completed' ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
                  Pesanan Telah {order.status === 'completed' ? 'Selesai' : 'Batal'}
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => updateOrderStatus('cancelled')}
        title="Batalkan Pesanan"
        message="Apakah Anda yakin ingin membatalkan pesanan ini? Tindakan ini tidak dapat dibatalkan."
        confirmText="Ya, Batalkan"
        cancelText="Tidak, Kembali"
        variant="danger"
      />
    </motion.div>
  );
}
