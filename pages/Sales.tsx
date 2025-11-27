import React, { useState } from 'react';
import { useAppStore } from '../context/AppContext';
import { formatCurrency, speak } from '../utils';
import { Card, Button, WhatsAppModal } from '../components/UI';
import { VoiceButton } from '../components/VoiceButton';

export const NewSale = () => {
    const { products, customers, recordSale, showToast } = useAppStore();
    const [saleType, setSaleType] = useState("cash");
    const [productId, setProductId] = useState(products[0]?.id || "");
    const [qty, setQty] = useState(1);
    const [isDelivery, setIsDelivery] = useState(false);
    const [deliveryCharge, setDeliveryCharge] = useState("");
    const [custSearch, setCustSearch] = useState("");
    const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
    const [showCustList, setShowCustList] = useState(false);
    const [waModal, setWaModal] = useState<any>(null);

    const product = products.find(p => p.id === productId) || products[0];
    const total = (product?.price || 0) * qty + (isDelivery ? Number(deliveryCharge) : 0);

    const handleVoice = (q: any, variantKey: any, del: any, addrWord: any) => {
       const p = products.find(x => x.name.includes(String(variantKey)));
       if (!p) {
           showToast(`Variant "${variantKey}" not found`, "error");
           speak("Product not found");
           return;
       }

       const delAmt = Number(del) || 0;
       const t = (p.price * Number(q)) + delAmt;
       const desc = `${q}x ${p.name}` + (delAmt > 0 ? ` (+ Rs.${delAmt} Del)` : "");

       if (saleType === "credit") {
           // addrWord is the identity (e.g. "C204")
           if (!addrWord) {
               showToast("Address identity required for credit", "error");
               return;
           }

           const searchKey = String(addrWord).toLowerCase();
           const found = customers.find(c => {
              const cAddrClean = c.address.replace(/\s+/g, '').toLowerCase();
              return cAddrClean.startsWith(searchKey);
           });

           if (found) {
               setSelectedCustomer(found); setCustSearch(found.name);
               setProductId(p.id);
               
               recordSale({ 
                   saleType: "credit", 
                   product: p, 
                   quantity: q, 
                   isDelivery: delAmt>0, 
                   deliveryCharge: delAmt, 
                   customerId: found.id, 
                   amount: t, 
                   description: `Voice Credit: ${desc}` 
               });
               
               setWaModal({ customerName: found.name, saleDetails: desc, total: formatCurrency(t), balance: formatCurrency((found.balance||0)+t) });
               speak(`Credit recorded for ${found.name}`);
           } else { 
               showToast(`Address "${addrWord}" not found`, "error"); 
               speak("Customer not found");
           }
       } else {
           // Cash
           recordSale({ 
               saleType: "cash", 
               product: p, 
               quantity: q, 
               isDelivery: delAmt>0, 
               deliveryCharge: delAmt, 
               customerId: null, 
               amount: t, 
               description: `Voice Cash: ${desc}` 
           });
           showToast("Sale Recorded", "success");
           speak("Cash sale recorded");
       }
    };

    return (
        <div className="pb-20 animate-fade-in max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold dark:text-white mb-4">New Sale</h2>
            <Card className="border-t-4 border-green-500">
                <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded mb-4">
                    <button onClick={()=>setSaleType("cash")} className={`flex-1 py-2 rounded font-bold ${saleType==="cash"?"bg-white shadow text-green-600":"text-gray-500"}`}>Cash</button>
                    <button onClick={()=>setSaleType("credit")} className={`flex-1 py-2 rounded font-bold ${saleType==="credit"?"bg-white shadow text-indigo-600":"text-gray-500"}`}>Credit</button>
                </div>
                {saleType === "credit" && (
                    <div className="mb-4 relative">
                        <label className="block text-xs dark:text-white mb-1">Customer</label>
                        <input className="w-full p-3 border rounded dark:bg-gray-800 dark:text-white" placeholder="Search..." value={custSearch} onChange={e=>{setCustSearch(e.target.value); setShowCustList(true);}} />
                        {showCustList && <div className="absolute z-20 w-full bg-white border shadow-xl max-h-48 overflow-y-auto">{customers.filter(c=>c.name.toLowerCase().includes(custSearch.toLowerCase())).map(c=>(<div key={c.id} onClick={()=>{setSelectedCustomer(c); setCustSearch(c.name); setShowCustList(false)}} className="p-3 hover:bg-gray-100">{c.name}</div>))}</div>}
                    </div>
                )}
                <div className="grid grid-cols-2 gap-4 mb-4">
                     <div><label className="block text-sm font-medium mb-1 dark:text-gray-300">Product</label><select className="w-full p-3 border rounded-lg dark:bg-gray-800 dark:text-white" value={productId} onChange={e=>setProductId(e.target.value)}>{products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
                     <div><label className="block text-sm font-medium mb-1 dark:text-gray-300">Qty</label><div className="flex"><button onClick={()=>setQty(q=>q>1?q-1:1)} className="p-3 bg-gray-200 dark:bg-gray-700 rounded-l">-</button><input type="number" className="w-full text-center border-y dark:bg-gray-800 dark:text-white" value={qty} onChange={e=>setQty(Math.max(1, Number(e.target.value)||1))} /><button onClick={()=>setQty(q=>q+1)} className="p-3 bg-gray-200 dark:bg-gray-700 rounded-r">+</button></div></div>
                </div>
                <div className="mb-6 bg-orange-50 dark:bg-orange-900/20 p-3 rounded flex items-center justify-between"><label className="flex items-center gap-2 cursor-pointer dark:text-white"><input type="checkbox" checked={isDelivery} onChange={e=>setIsDelivery(e.target.checked)} className="w-4 h-4" />Delivery?</label>{isDelivery && <input type="number" placeholder="Amt" className="w-20 p-2 border rounded dark:bg-gray-800 dark:text-white" value={deliveryCharge} onChange={e=>setDeliveryCharge(e.target.value)} />}</div>
                <Button onClick={()=>{
                    if(saleType==="credit" && !selectedCustomer) return alert("Select Customer");
                    recordSale({saleType, product, quantity: qty, isDelivery, deliveryCharge, customerId: selectedCustomer?.id, amount: total, description: `${qty}x ${product.name}`});
                    if(saleType==="credit") setWaModal({ customerName: selectedCustomer.name, saleDetails: `${qty}x ${product.name}`, total: formatCurrency(total), balance: formatCurrency((selectedCustomer.balance||0)+total) });
                    else showToast("Sale Recorded", "success");
                }} className="w-full mt-4">Confirm {formatCurrency(total)}</Button>
            </Card>
            <VoiceButton mode={saleType} onCommand={handleVoice} showToast={showToast} />
            <WhatsAppModal isOpen={!!waModal} {...waModal} onCancel={()=>setWaModal(null)} />
        </div>
    )
};