import React, { useState } from 'react';
import { useAppStore } from '../context/AppContext';
import { formatCurrency } from '../utils';
import { Card, Button } from '../components/UI';

export const SettingsPage = () => {
    const { products, addProduct, deleteProduct } = useAppStore();
    const [name, setName] = useState(""); 
    const [price, setPrice] = useState("");
    const [keywords, setKeywords] = useState("");
    
    const handleAdd = () => {
        if(!name.trim() || !price) {
            alert("Name and Price are required!");
            return;
        }
        addProduct(name, price, keywords);
        setName("");
        setPrice("");
        setKeywords("");
    };
    
    return (
      <div className="pb-20 space-y-4 animate-fade-in">
         <h2 className="text-2xl font-bold dark:text-white">Settings</h2>
         <Card>
           {products.map(p => ( 
             <div key={p.id} className="flex justify-between border-b py-3 items-center">
                 <div>
                     <span className="font-bold text-lg dark:text-white block">{p.name}</span>
                     {p.keywords && (
                        <span className="inline-block bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded font-bold mt-1">
                            Voice Code: {p.keywords}
                        </span>
                     )}
                 </div>
                 <div className="flex gap-2 items-center">
                     <b className="dark:text-white text-lg mr-2">{formatCurrency(p.price)}</b>
                     <button onClick={()=>deleteProduct(p.id)} className="p-2 text-red-500 hover:bg-red-50 rounded transition">🗑️</button>
                 </div>
             </div> 
           ))}
           <div className="flex flex-col gap-3 mt-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border dark:border-gray-700">
               <h3 className="font-bold text-sm text-gray-500 uppercase">Add New Product</h3>
               <div className="flex gap-2">
                   <input placeholder="Product Name" value={name} onChange={e=>setName(e.target.value)} className="border p-2 flex-1 rounded dark:bg-gray-800 dark:text-white font-medium"/>
                   <input placeholder="Price" type="number" value={price} onChange={e=>setPrice(e.target.value)} className="border p-2 w-24 rounded dark:bg-gray-800 dark:text-white font-medium"/>
               </div>
               <div className="flex gap-2">
                    <input placeholder="Voice Code (e.g. 19, 1)" value={keywords} onChange={e=>setKeywords(e.target.value)} className="border p-2 flex-1 rounded dark:bg-gray-800 dark:text-white font-medium"/>
                    <Button onClick={handleAdd} className="w-24 bg-green-600 hover:bg-green-700">Add</Button>
               </div>
           </div>
         </Card>
      </div>
    );
};