import React, { useState } from 'react';
import { useAppStore } from '../context/AppContext';
import { formatCurrency } from '../utils';
import { Icon, ConfirmModal } from '../components/UI';

export const HistoryPage = () => {
   const { transactions, reverseTransaction } = useAppStore();
   const history = [...transactions].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 50);
   const [reverseModal, setReverseModal] = useState<any>({ open: false, tx: null });
   const confirmReverse = () => { if(reverseModal.tx) { reverseTransaction(reverseModal.tx); setReverseModal({ open: false, tx: null }); } };

   return (
     <div className="pb-20 animate-fade-in">
       <h2 className="text-2xl font-bold dark:text-white mb-4">History</h2>
       <div className="space-y-2">
         {history.map(t => (
           <div key={t.id} className="bg-white dark:bg-gray-900 p-3 rounded shadow flex justify-between items-center group">
              <div>
                <p className="font-bold text-sm dark:text-white">{t.description}</p>
                <p className="text-xs text-gray-500">{new Date(t.date).toLocaleString()}</p>
              </div>
              <div className="flex items-center gap-3">
                 <span className={`font-bold text-sm ${t.type==='expense'?'text-red-500':'text-green-600'}`}>
                    {t.type==='expense'?'-':'+'}{formatCurrency(t.amount)}
                 </span>
                 {!t.isDeleted && (
                    <button onClick={()=>setReverseModal({ open: true, tx: t })} className="text-red-400 hover:text-red-600 p-2 bg-red-50 dark:bg-red-900/20 rounded-full">
                        <Icon name="trash-2" size={18} />
                    </button>
                 )}
                 {t.isDeleted && <span className="text-xs text-red-600 font-bold">VOIDED</span>}
              </div>
           </div>
         ))}
       </div>
       <ConfirmModal isOpen={reverseModal.open} title="Reverse Transaction?" message="Are you sure you want to delete and reverse this transaction? This will undo its effect on balances and reports." onCancel={()=>setReverseModal({open:false, tx:null})} onConfirm={confirmReverse} />
     </div>
   )
};