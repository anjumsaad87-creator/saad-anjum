import React, { useState } from 'react';
import { useAppStore } from '../context/AppContext';
import { getBusinessDateKey, formatCurrency } from '../utils';
import { DAYS_OF_WEEK } from '../constants';
import { Button, WhatsAppModal, Icon } from '../components/UI';

export const TasksPage = () => {
    const { customers, recordSale, transactions, products, showToast } = useAppStore();
    const [searchTerm, setSearchTerm] = useState("");
    const [waModal, setWaModal] = useState<any>(null);
    const [selectedIds, setSelectedIds] = useState(new Set()); 
    
    const today = new Date();
    const dayName = DAYS_OF_WEEK[today.getDay()];
    const dateKey = getBusinessDateKey();
    const tasks = customers.filter(c => c.schedule?.[dayName]);
    const sortedTasks = tasks.sort((a,b) => a.name.localeCompare(b.name));
    const filtered = sortedTasks.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const isDone = (cid: string) => transactions.some(t => {
        const d = new Date(t.date);
        return !t.isDeleted && t.type==='sale' && t.customerId === cid && !isNaN(d.getTime()) && getBusinessDateKey(d) === dateKey;
    });

    const toggleSelect = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) newSet.delete(id); else newSet.add(id);
        setSelectedIds(newSet);
    };
    
    const handleSelectAll = () => {
        if (selectedIds.size === filtered.length) setSelectedIds(new Set());
        else setSelectedIds(new Set(filtered.map(c => c.id)));
    };

    const handleSingleDone = (c: any) => {
        if(isDone(c.id)) return;
        const sched = c.schedule[dayName];
        const p = products.find(x => x.name === sched.variant) || {id: 'unknown', price: 0, name: sched.variant || 'Water'};
        const total = (Number(p.price || 0) * Number(sched.qty)) + Number(sched.delivery);
        
        recordSale({
           saleType: "credit", 
           product: p, 
           quantity: Number(sched.qty), 
           isDelivery: Number(sched.delivery)>0, 
           deliveryCharge: Number(sched.delivery),
           customerId: c.id, 
           amount: total, 
           description: `Scheduled: ${sched.qty}x ${sched.variant}` 
        });
        showToast(`Task Done: ${c.name}`, "success");
    };

    const handleBatchDone = () => {
        filtered.forEach(c => {
            if(selectedIds.has(c.id) && !isDone(c.id)) {
                handleSingleDone(c);
            }
        });
        setSelectedIds(new Set());
    };

    return (
       <div className="pb-20 animate-fade-in">
          <div className="flex justify-between items-center mb-4"><h2 className="text-xl font-bold dark:text-white">Daily Tasks ({dayName})</h2><Button size="sm" onClick={handleBatchDone} disabled={selectedIds.size===0}>Submit Selected ({selectedIds.size})</Button></div>
          <input className="w-full p-2 border rounded mb-4 dark:bg-gray-800 dark:text-white" placeholder="Search customer..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} />
          
          <div className="flex items-center gap-2 mb-2 px-3">
              <input type="checkbox" className="big-checkbox" checked={selectedIds.size === filtered.length && filtered.length > 0} onChange={handleSelectAll} />
              <span className="text-sm font-bold dark:text-white">Select All</span>
          </div>

          <div className="space-y-2">
             {filtered.map(c => {
                const done = isDone(c.id); const sched = c.schedule![dayName];
                return (
                   <div key={c.id} className={`p-3 rounded border flex justify-between items-center ${done ? "bg-green-50 border-green-200" : "bg-white dark:bg-gray-900 dark:border-gray-700"}`}>
                      <div className="flex items-center gap-3">
                         {!done && <input type="checkbox" className="big-checkbox" checked={selectedIds.has(c.id)} onChange={()=>toggleSelect(c.id)} />}
                         <div><p className="font-bold dark:text-white">{c.name}</p><p className="text-xs text-gray-500">{sched.qty}x {sched.variant} {Number(sched.delivery)>0 ? `+${sched.delivery} Del` : ''}</p></div>
                      </div>
                      <div className="flex gap-2">
                         {done ? <span className="text-green-600 font-bold text-xl">✅</span> : 
                            <button onClick={()=>handleSingleDone(c)} className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-bold rounded shadow">DO</button>
                         }
                      </div>
                   </div>
                )
             })}
             {filtered.length===0 && <p className="text-gray-500 text-center">No tasks for {dayName}</p>}
          </div>
          <WhatsAppModal isOpen={!!waModal} {...waModal} onCancel={()=>setWaModal(null)} />
       </div>
    )
};