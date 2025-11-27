import React, { useState, useRef } from 'react';
import { useAppStore } from '../context/AppContext';
import { exportToCSV, formatCurrency } from '../utils';
import { DAYS_OF_WEEK } from '../constants';
import { Card, Button, Icon, ConfirmModal, WhatsAppModal } from '../components/UI';

const ScheduleEditor = ({ c, onBack }: any) => {
    const [sched, setSched] = useState(c.schedule || {});
    const { products, updateSchedule } = useAppStore();
    const handleSave = () => { updateSchedule(c.id, sched); onBack(); };
    return (
        <div className="animate-fade-in">
            <h3 className="font-bold dark:text-white mb-4">Weekly Schedule: {c.name}</h3>
            {DAYS_OF_WEEK.map(d => (
                <div key={d} className="flex gap-2 mb-2 items-center">
                    <span className="w-24 text-sm dark:text-white">{d}</span>
                    <input placeholder="Qty" className="w-16 p-1 border rounded" value={sched[d]?.qty||""} onChange={e=>setSched({...sched, [d]: {...(sched[d]||{}), qty: e.target.value}})} />
                    <select className="w-32 p-1 border rounded" value={sched[d]?.variant||""} onChange={e=>setSched({...sched, [d]: {...(sched[d]||{}), variant: e.target.value}})}>
                        <option value="">Select</option>
                        {products.map(p=><option key={p.id} value={p.name}>{p.name}</option>)}
                    </select>
                    <input placeholder="Del" className="w-16 p-1 border rounded" value={sched[d]?.delivery||""} onChange={e=>setSched({...sched, [d]: {...(sched[d]||{}), delivery: e.target.value}})} />
                </div>
            ))}
            <Button onClick={handleSave}>Save Schedule</Button>
            <Button variant="outline" onClick={onBack} className="mt-2">Back</Button>
        </div>
    )
};

export const Customers = () => {
    const { customers, recordCollection, addCustomer, deleteCustomer, stats, importCustomers } = useAppStore();
    const [viewMode, setViewMode] = useState("list"); 
    const [selectedC, setSelectedC] = useState<any>(null);
    const [search, setSearch] = useState("");
    const [showAdd, setShowAdd] = useState(false);
    const [formData, setFormData] = useState({name:"", phone:"", address:""});
    const [collectModal, setCollectModal] = useState<any>({open:false, customer:null, amount:""});
    const [deleteModal, setDeleteModal] = useState<any>({ open: false, customer: null, isBadDebt: false });
    const [waModal, setWaModal] = useState<any>(null);
    const importInputRef = useRef<any>(null);

    const handleExport = () => { const data = [['Name', 'Phone', 'Address', 'Balance'], ...customers.map(c => [c.name, c.phone, c.address, c.balance])]; exportToCSV('customers_list.csv', data); };
    const handleFileChange = (e: any) => {
       const file = e.target.files[0]; if(!file) return;
       const reader = new FileReader();
       reader.onload = (evt: any) => { const text = evt.target.result; const dataRows = text.split(/\r?\n/).slice(1).map((r: string)=>r.split(',')); importCustomers(dataRows); };
       reader.readAsText(file);
    };
    
    const handleCollectionConfirm = () => {
       if(collectModal.customer) {
           const amt = parseFloat(collectModal.amount);
           if(amt > 0) {
               recordCollection(collectModal.customer, amt);
               const newBal = (collectModal.customer.balance || 0) - amt;
               setWaModal({ customerName: collectModal.customer.name, saleDetails: "Payment Received", total: formatCurrency(amt), balance: formatCurrency(newBal) });
               setCollectModal({open:false, customer:null, amount:""});
           }
       }
    };

    if (viewMode === "schedule") return <ScheduleEditor c={selectedC} onBack={()=>setViewMode("list")} />;

    return (
        <div className="pb-20 space-y-4 animate-fade-in">
            <div className="flex gap-2">
               <input className="flex-1 p-2 border rounded" placeholder="Search..." value={search} onChange={e=>setSearch(e.target.value)} />
               <Button onClick={handleExport} variant="outline"><Icon name="download"/></Button>
               <input type="file" ref={importInputRef} className="hidden" onChange={handleFileChange}/><Button onClick={()=>importInputRef.current.click()} variant="outline"><Icon name="upload"/></Button>
            </div>
            <Button onClick={()=>setShowAdd(!showAdd)} className="w-full">{showAdd?"Cancel":"Add Customer"}</Button>
            {showAdd && <Card><div className="grid gap-2"><input placeholder="Name" value={formData.name} onChange={e=>setFormData({...formData, name:e.target.value})} className="border p-2 rounded"/><input placeholder="Phone" value={formData.phone} onChange={e=>setFormData({...formData, phone:e.target.value})} className="border p-2 rounded"/><input placeholder="Address" value={formData.address} onChange={e=>setFormData({...formData, address:e.target.value})} className="border p-2 rounded"/><Button onClick={()=>{addCustomer(formData.name, formData.phone, formData.address); setShowAdd(false);}}>Save</Button></div></Card>}
            
            {customers.filter(c=>c.name.toLowerCase().includes(search.toLowerCase())).map(c => {
               const history = stats.customerHistory && stats.customerHistory[c.id] ? Object.entries(stats.customerHistory[c.id]).map(([k,v])=>`${v}x ${k}`).join(', ') : "No History";
               return (
                <Card key={c.id}>
                    <div className="flex justify-between">
                        <div>
                            <h3 className="font-bold">{c.name}</h3>
                            <p className="text-xs text-gray-500">{c.address}</p>
                            <p className="text-[10px] text-indigo-500">History: {history}</p>
                        </div>
                        <div className="text-right">
                            <p className="font-bold text-red-500">{formatCurrency(c.balance)}</p>
                            <div className="flex gap-1">
                                <button onClick={()=>{setSelectedC(c); setViewMode("schedule")}} className="p-1">📅</button>
                                <button onClick={()=>setCollectModal({open:true, customer:c, amount:""})} className="p-1">💵</button>
                                <button onClick={()=>setDeleteModal({open:true, customer:c, isBadDebt: c.balance>0})} className="p-1">🗑️</button>
                            </div>
                        </div>
                    </div>
                </Card>
            )})}
            {collectModal.open && <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50"><div className="bg-white p-6 rounded"><h3 className="font-bold mb-4">Collect from {collectModal.customer.name}</h3><input type="number" value={collectModal.amount} onChange={e=>setCollectModal({...collectModal, amount:e.target.value})} className="border p-2 w-full mb-4" placeholder="Amount" /><div className="flex gap-2"><Button onClick={handleCollectionConfirm}>Confirm</Button><Button variant="outline" onClick={()=>setCollectModal({open:false, customer:null})}>Cancel</Button></div></div></div>}
            
            <WhatsAppModal isOpen={!!waModal} {...waModal} onCancel={()=>setWaModal(null)} />
            <ConfirmModal isOpen={deleteModal.open} title="Delete?" message={deleteModal.isBadDebt?"Balance will be Bad Debt.":"Confirm delete?"} onConfirm={()=>{deleteCustomer(deleteModal.customer, deleteModal.isBadDebt); setDeleteModal({open:false, customer:null})}} onCancel={()=>setDeleteModal({open:false, customer:null})} />
        </div>
    )
};