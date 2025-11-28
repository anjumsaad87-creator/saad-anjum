import React, { useState, useMemo } from 'react';
import { useAppStore } from '../context/AppContext';
import { formatCurrency, formatDateTime, getTodayDatePKT } from '../utils';
import { Icon, ConfirmModal, Button, Card } from '../components/UI';

export const HistoryPage = () => {
   const { transactions, reverseTransaction } = useAppStore();
   
   // Default to current month based on PKT
   const todayStr = getTodayDatePKT();
   const firstDay = todayStr.substring(0, 8) + '01'; 
   const lastDay = todayStr;

   const [startDate, setStartDate] = useState(firstDay);
   const [endDate, setEndDate] = useState(lastDay);
   
   const [reverseModal, setReverseModal] = useState<any>({ open: false, tx: null });

   const filteredHistory = useMemo(() => {
       const start = new Date(startDate);
       const end = new Date(endDate);
       end.setHours(23, 59, 59, 999);

       return transactions.filter(t => {
           const d = new Date(t.date);
           return d >= start && d <= end;
       }).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
   }, [transactions, startDate, endDate]);

   const confirmReverse = () => { if(reverseModal.tx) { reverseTransaction(reverseModal.tx); setReverseModal({ open: false, tx: null }); } };

   const downloadPDF = () => {
       // @ts-ignore
       const { jsPDF } = window.jspdf;
       const doc = new jsPDF();

       doc.text("Transaction History", 14, 20);
       doc.setFontSize(10);
       doc.text(`From ${startDate} to ${endDate}`, 14, 26);
       doc.text(`Generated: ${formatDateTime(new Date().toISOString())}`, 14, 31);

       const rows = filteredHistory.map(t => [
           formatDateTime(t.date),
           t.description,
           t.type,
           formatCurrency(t.amount),
           t.isDeleted ? 'VOID' : 'Active'
       ]);

       // @ts-ignore
       doc.autoTable({
           startY: 40,
           head: [['Date (PKT)', 'Description', 'Type', 'Amount', 'Status']],
           body: rows,
       });

       doc.save(`history_${startDate}_${endDate}.pdf`);
   };

   return (
     <div className="pb-20 animate-fade-in">
       <div className="flex justify-between items-center mb-4">
           <h2 className="text-2xl font-bold dark:text-white">History</h2>
           <Button variant="outline" onClick={downloadPDF} size="sm"><Icon name="download" size={16}/> PDF</Button>
       </div>

       {/* Date Filter */}
       <Card className="flex flex-col md:flex-row gap-4 items-center mb-4 bg-gray-50 dark:bg-gray-800">
            <div className="flex items-center gap-2 w-full md:w-auto">
                <span className="text-sm font-bold">From:</span>
                <input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} className="p-2 rounded border w-full" />
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
                <span className="text-sm font-bold">To:</span>
                <input type="date" value={endDate} onChange={e=>setEndDate(e.target.value)} className="p-2 rounded border w-full" />
            </div>
       </Card>

       <div className="space-y-2">
         {filteredHistory.map(t => (
           <div key={t.id} className="bg-white dark:bg-gray-900 p-3 rounded shadow flex justify-between items-center group">
              <div>
                <p className="font-bold text-sm dark:text-white">{t.description}</p>
                <p className="text-xs text-gray-500">{formatDateTime(t.date)}</p>
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
         {filteredHistory.length === 0 && <p className="text-center text-gray-500 mt-6">No transactions found in this period.</p>}
       </div>
       <ConfirmModal isOpen={reverseModal.open} title="Reverse Transaction?" message="Are you sure you want to delete and reverse this transaction? This will undo its effect on balances and reports." onCancel={()=>setReverseModal({open:false, tx:null})} onConfirm={confirmReverse} />
     </div>
   )
};