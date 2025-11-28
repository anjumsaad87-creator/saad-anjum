import React, { useState } from 'react';
import { useAppStore } from '../context/AppContext';
import { getBusinessDateKey, formatCurrency, speak, findMatchingCustomer, findProductByKeyword, formatDateTime, getCurrentDayNamePKT } from '../utils';
import { Icon, Button } from '../components/UI';
import { StatBox } from '../components/StatBox';
import { VoiceButton } from '../components/VoiceButton';

const ReversalsModal = ({ onClose }: { onClose: () => void }) => {
    const { reversedTransactions } = useAppStore();
    return (
        <div className="fixed inset-0 bg-black/60 z-[120] flex items-center justify-center px-4 animate-fade-in">
             <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-lg w-full p-6 border dark:border-gray-700 h-3/4 flex flex-col">
                 <h3 className="text-xl font-bold mb-4 dark:text-white">Reversed Transactions</h3>
                 <div className="flex-1 overflow-y-auto space-y-2">
                     {reversedTransactions.map(t => (
                         <div key={t.id} className="p-2 border rounded dark:border-gray-700">
                             <p className="text-sm font-bold text-red-500">{t.description}</p>
                             <p className="text-xs text-gray-500">{formatDateTime(t.date)} | {formatCurrency(t.amount)}</p>
                         </div>
                     ))}
                     {reversedTransactions.length === 0 && <p className="text-center text-gray-500">No reversals.</p>}
                 </div>
                 <Button onClick={onClose} className="mt-4">Close</Button>
             </div>
        </div>
    );
};

export const Dashboard = ({ setView }: any) => {
    const { stats, transactions, products, customers, recordSale, showToast } = useAppStore();
    const [date, setDate] = useState(getBusinessDateKey()); // Use PKT Date Key
    const [showReverseModal, setShowReverseModal] = useState(false);
    
    // Get Day Name strictly in PKT
    const dayName = getCurrentDayNamePKT();
    
    const tasksToday = customers.filter(c => c.schedule?.[dayName]);
    const doneCount = tasksToday.filter(c => {
        const txDateKey = getBusinessDateKey();
        return transactions.some(t => {
            const d = new Date(t.date);
            return !t.isDeleted && t.type==='sale' && t.customerId === c.id && !isNaN(d.getTime()) && getBusinessDateKey(d) === txDateKey;
        });
    }).length;
    const pendingTasks = tasksToday.length - doneCount;

    const dStats = stats.dayStats[date] || { collection: 0, bottles: 0, variantMap: {} };
    const mKey = date.substring(0,7);
    const mStats = stats.monthStats[mKey] || { collection: 0, expenses: 0, badDebt: 0, cashExpenses: 0 };
    const netInc = mStats.collection - mStats.expenses;

    let topVar: any = null; let max = -1;
    Object.values(dStats.variantMap).forEach((v: any) => { if(v.count > max) { max=v.count; topVar=v; }});

   const handleVoiceCommand = (qty: any, variantKey: any, delivery: any, addrWord: any) => {
      // Find Product (Name OR Keywords)
      const p = findProductByKeyword(products, String(variantKey));
      
      if (!p) {
          showToast(`Variant "${variantKey}" not found.`, "error");
          speak("Product not found");
          return;
      }

      // Ensure delivery is number
      const delAmt = Number(delivery) || 0;
      const total = (p.price * Number(qty)) + delAmt;
      const descDetails = `${qty}x ${p.name}` + (delAmt > 0 ? ` (+ Rs.${delAmt} Del)` : "");

      if (addrWord) {
          // CREDIT MODE
          // Search customer by Address ID (Strict)
          const found = findMatchingCustomer(customers, String(addrWord));

          if (found) {
              recordSale({ 
                  saleType: "credit", 
                  product: p, 
                  quantity: qty, 
                  isDelivery: delAmt > 0, 
                  deliveryCharge: delAmt, 
                  customerId: found.id, 
                  amount: total, 
                  description: `Voice Credit: ${descDetails}` 
              });
              showToast(`Credit: ${qty}x ${p.name} to ${found.name}`, "success");
              speak(`Credit sale recorded for ${found.name}`);
          } else { 
              showToast(`Customer ID "${addrWord}" not found`, "error"); 
              speak("Customer not found");
          }
      } else {
          // CASH MODE
          recordSale({ 
              saleType: "cash", 
              product: p, 
              quantity: qty, 
              isDelivery: delAmt > 0, 
              deliveryCharge: delAmt, 
              customerId: null, 
              amount: total, 
              description: `Voice Cash: ${descDetails}` 
          });
          showToast(`Cash: ${qty}x ${p.name}`, "success");
          speak(`Cash sale recorded. Total ${total}`);
      }
   };

    return (
       <div className="space-y-4 animate-fade-in pb-20">
          <div className="flex justify-between items-center">
             <h2 className="text-xl font-bold dark:text-white flex items-center gap-2"><span>📊</span> Dashboard</h2>
             <div className="flex gap-2 items-center">
                <button onClick={()=>setShowReverseModal(true)} className="p-2 bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-200 rounded-lg text-xs font-bold border border-red-200 dark:border-red-800">Reversals</button>
                <button onClick={()=>setView("reports")} className="p-2 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-200 rounded-lg text-xs font-bold border border-blue-200 dark:border-blue-800">Reports</button>
                <button onClick={()=>setView("tasks")} className={`p-2 rounded-lg text-xs font-bold flex items-center gap-1 border ${pendingTasks===0 ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
                   <Icon name="clipboard-list" size={16} /> Task: {pendingTasks}
                </button>
             </div>
          </div>
          
          <div className="flex flex-col md:flex-row justify-center items-center gap-4 mb-6 bg-white dark:bg-gray-800 p-3 rounded-xl shadow-sm border dark:border-gray-700">
              <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-900 p-3 rounded-lg border dark:border-gray-700 shadow-sm w-full md:w-auto justify-center">
                  <Icon name="calendar" size={18} className="text-indigo-500"/>
                  <input type="date" className="bg-transparent border-none text-sm font-bold text-gray-700 dark:text-gray-200 focus:outline-none" value={date} onChange={e=>setDate(e.target.value)} />
              </div>
              
              <VoiceButton inline={true} onCommand={handleVoiceCommand} showToast={showToast} mode="auto" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <StatBox 
                title={`Daily Collection (${date})`} 
                value={formatCurrency(dStats.collection)} 
                subtext="Cash In" 
                colorBg="bg-emerald-50 dark:bg-emerald-950/40" 
                colorText="text-emerald-600" 
                icon={<Icon name="sun"/>}
                className="!border-2 !border-emerald-500 dark:!border-emerald-500 shadow-lg"
             />
             
             <StatBox 
                 title={`Bottles Sold (${date})`}
                 value={dStats.bottles} 
                 subtext="Top Sold Variant"
                 colorBg="bg-cyan-50 dark:bg-cyan-950/40" 
                 colorText="text-cyan-600" 
                 icon={<Icon name="package"/>} 
                 className="!border-2 !border-cyan-500 dark:!border-cyan-500 shadow-lg"
                 extraContent={
                     <div className="mt-2 pt-2 border-t border-cyan-200 dark:border-cyan-800">
                         {topVar ? (
                             <>
                                 <div className="flex justify-between items-end">
                                     <p className="text-sm font-bold text-gray-800 dark:text-gray-100">{topVar.name}</p>
                                     <p className="text-xs font-bold text-cyan-600">{topVar.count}x</p>
                                 </div>
                                 <p className="text-[10px] text-gray-500 dark:text-gray-400 text-right">{formatCurrency(topVar.revenue)}</p>
                             </>
                         ) : (
                             <p className="text-[10px] text-gray-400 italic">None</p>
                         )}
                     </div>
                 } 
             />
             
             <StatBox 
                title="Monthly Collection" 
                value={formatCurrency(mStats.collection)} 
                subtext="Total Inflow" 
                colorBg="bg-blue-50 dark:bg-blue-950/40" 
                colorText="text-blue-600" 
                icon={<Icon name="calendar"/>}
                className="!border-2 !border-blue-500 dark:!border-blue-500 shadow-lg"
             />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
             <StatBox size="small" title="Expenses (Monthly)" value={formatCurrency(mStats.expenses)} colorBg="bg-red-50 dark:bg-red-900/20" colorText="text-red-600" icon={<Icon name="trending-down"/>} />
             <StatBox size="small" title="Monthly Net Income" value={formatCurrency(netInc)} colorBg={netInc>=0?"bg-indigo-50 dark:bg-indigo-900/20":"bg-red-50"} colorText={netInc>=0?"text-indigo-600":"text-red-600"} icon={<Icon name="trending-up"/>} />
             <StatBox size="small" title="Lifetime Income" value={formatCurrency(stats.lifetimeNet)} colorBg="bg-violet-50 dark:bg-violet-900/20" colorText="text-violet-600" icon={<Icon name="wallet"/>} />
             <StatBox size="small" title="Receivables" value={formatCurrency(stats.totalReceivable)} colorBg="bg-orange-50 dark:bg-orange-900/20" colorText="text-orange-600" icon={<Icon name="users"/>} />
          </div>

          <div className="grid grid-cols-3 gap-3 mt-4">
             <Button onClick={()=>setView('sale')} className="h-20 flex-col bg-gradient-to-br from-indigo-500 to-blue-600 text-xs md:text-sm"><span>➕</span> Sale</Button>
             <Button onClick={()=>setView('customers')} className="h-20 flex-col bg-gradient-to-br from-purple-500 to-pink-600 text-xs md:text-sm"><span>👥</span> Collect</Button>
             <Button onClick={()=>setView('expenses')} className="h-20 flex-col bg-gradient-to-br from-red-500 to-orange-600 text-xs md:text-sm"><span>📉</span> Expense</Button>
          </div>
          
          {showReverseModal && <ReversalsModal onClose={()=>setShowReverseModal(false)} />}
       </div>
    );
};