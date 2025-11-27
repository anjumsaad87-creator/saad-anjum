import React, { useState, useRef } from 'react';
import { useAppStore } from '../context/AppContext';
import { formatCurrency } from '../utils';
import { Card, Button } from '../components/UI';

export const Expenses = () => {
   const { recordExpense, showToast, transactions } = useAppStore();
   const [amt, setAmt] = useState("");
   const [cat, setCat] = useState("Rent");
   const [customCat, setCustomCat] = useState("");
   const amountRef = useRef(null);
   const CATS = ["Rent", "Electricity", "Maintenance", "Fuel", "Salary", "Other"];
   
   const handleSubmit = () => {
      const finalCat = cat === "Other" ? customCat : cat;
      if (!finalCat || !amt) return;
      recordExpense(Number(amt), finalCat);
      setAmt("");
      setCustomCat("");
      showToast("Expense Recorded", "success");
   };
   
   const now = new Date();
   const monthlyList = transactions.filter(t => { const d = new Date(t.date); return t.type === 'expense' && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); }).reverse();

   return (
      <div className="pb-20 animate-fade-in space-y-6">
         <h2 className="text-2xl font-bold dark:text-white">Expenses</h2>
         <Card>
            <label className="block text-sm font-medium mb-2 dark:text-gray-300">Expense Type</label>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {CATS.map(c => (
                <button 
                  key={c}
                  onClick={() => setCat(c)}
                  className={`p-2 text-xs rounded border ${cat === c ? "bg-red-100 border-red-500 text-red-700 font-bold" : "bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300"}`}
                >
                  {c}
                </button>
              ))}
            </div>
            {cat === "Other" && (
              <input 
                type="text" 
                className="w-full p-2 border rounded mb-4 dark:bg-gray-800 dark:text-white" 
                placeholder="Enter Custom Category"
                value={customCat}
                onChange={e => setCustomCat(e.target.value)}
              />
            )}
            <label className="block text-sm font-medium mb-1 dark:text-gray-300">Amount</label>
            <input 
              ref={amountRef}
              type="number" 
              className="w-full p-3 border mb-4 text-xl font-bold dark:bg-gray-800 dark:text-white" 
              placeholder="0.00" 
              value={amt} 
              onChange={e=>setAmt(e.target.value)} 
            />
            <Button variant="danger" className="w-full py-3" onClick={handleSubmit}>Record Expense</Button>
         </Card>

         <div>
           <h3 className="font-bold text-gray-600 dark:text-gray-300 mb-2">This Month's Expenses</h3>
           <div className="space-y-2">
             {monthlyList.map(t => (
               <div key={t.id} className="flex justify-between bg-white dark:bg-gray-900 p-3 rounded shadow-sm border dark:border-gray-800">
                 <span className="text-gray-800 dark:text-gray-200">{t.category || "Expense"}</span>
                 <span className="font-bold text-red-500">{formatCurrency(t.amount)}</span>
               </div>
             ))}
             {monthlyList.length === 0 && <p className="text-sm text-gray-400">No expenses yet.</p>}
           </div>
         </div>
      </div>
   )
};