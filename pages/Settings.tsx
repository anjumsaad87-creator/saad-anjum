import React, { useState } from 'react';
import { useAppStore } from '../context/AppContext';
import { formatCurrency } from '../utils';
import { Card, Button } from '../components/UI';

export const SettingsPage = () => {
    const { products, addProduct, deleteProduct } = useAppStore();
    const [name, setName] = useState(""); 
    const [price, setPrice] = useState("");
    
    return (
      <div className="pb-20 space-y-4 animate-fade-in">
         <h2 className="text-2xl font-bold dark:text-white">Settings</h2>
         <Card>
           {products.map(p => ( <div key={p.id} className="flex justify-between border-b py-2"><span>{p.name}</span><div className="flex gap-2"><b>{formatCurrency(p.price)}</b><button onClick={()=>deleteProduct(p.id)}>🗑️</button></div></div> ))}
           <div className="flex gap-2 mt-4"><input placeholder="Name" value={name} onChange={e=>setName(e.target.value)} className="border p-2 flex-1"/><input placeholder="Price" value={price} onChange={e=>setPrice(e.target.value)} className="border p-2 w-20"/><Button onClick={()=>{addProduct(name, price); setName(""); setPrice("")}}>Add</Button></div>
         </Card>
      </div>
    );
};