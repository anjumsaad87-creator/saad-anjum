import React, { useState, useMemo } from 'react';
import { useAppStore } from '../context/AppContext';
import { Card, Button, Icon } from '../components/UI';
import { generateBusinessInsights } from '../services/geminiService';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { formatCurrency, getBusinessDateKey } from '../utils';

export const ReportsPage = () => {
    const { stats, transactions } = useAppStore();
    const [insight, setInsight] = useState("");
    const [loadingInsight, setLoadingInsight] = useState(false);
    
    // Default to current month
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
    const lastDay = today.toISOString().split('T')[0];

    const [startDate, setStartDate] = useState(firstDay);
    const [endDate, setEndDate] = useState(lastDay);

    // Calculate Filtered Stats
    const filteredData = useMemo(() => {
        let income = 0;
        let expenses = 0;
        let bottles = 0;
        const start = new Date(startDate);
        const end = new Date(endDate);
        // Set end date to end of day
        end.setHours(23, 59, 59, 999);

        const filteredTx = transactions.filter(t => {
            const d = new Date(t.date);
            return !t.isDeleted && d >= start && d <= end;
        });

        filteredTx.forEach(t => {
            const amt = Number(t.amount) || 0;
            const isCashSale = t.type === 'sale' && (t.paymentMethod === 'cash' || (t as any).saleType === 'cash');
            
            if (t.type === 'collection' || isCashSale) {
                income += amt;
            }
            if (t.type === 'expense') {
                expenses += amt;
            }
            if (t.type === 'sale') {
                bottles += (t.quantity || 0);
            }
        });

        return { income, expenses, bottles, filteredTx };
    }, [transactions, startDate, endDate]);

    const handleGenerateInsight = async () => {
        setLoadingInsight(true);
        const result = await generateBusinessInsights(stats, transactions);
        setInsight(result);
        setLoadingInsight(false);
    };

    const generatePDF = () => {
        // @ts-ignore
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        doc.setFontSize(20);
        doc.text("Business Report", 14, 22);
        
        doc.setFontSize(10);
        doc.text(`Period: ${startDate} to ${endDate}`, 14, 30);
        doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 35);

        doc.setFontSize(12);
        doc.text("Summary", 14, 45);
        doc.text(`Total Income: ${formatCurrency(filteredData.income)}`, 14, 52);
        doc.text(`Total Expenses: ${formatCurrency(filteredData.expenses)}`, 14, 59);
        doc.text(`Net Profit: ${formatCurrency(filteredData.income - filteredData.expenses)}`, 14, 66);
        doc.text(`Bottles Sold: ${filteredData.bottles}`, 14, 73);

        const tableBody = filteredData.filteredTx.map(t => [
            new Date(t.date).toLocaleDateString(),
            t.description,
            t.type.toUpperCase(),
            formatCurrency(t.amount)
        ]);

        // @ts-ignore
        doc.autoTable({
            startY: 80,
            head: [['Date', 'Description', 'Type', 'Amount']],
            body: tableBody,
        });

        doc.save(`report_${startDate}_${endDate}.pdf`);
    };

    // Prepare chart data for the selected range (grouped by day)
    const chartData = useMemo(() => {
         const dataMap: Record<string, any> = {};
         filteredData.filteredTx.forEach(t => {
             const key = getBusinessDateKey(new Date(t.date));
             if(!dataMap[key]) dataMap[key] = { name: key, Income: 0, Expense: 0 };
             
             const amt = Number(t.amount) || 0;
             const isCashSale = t.type === 'sale' && (t.paymentMethod === 'cash' || (t as any).saleType === 'cash');

             if(t.type === 'collection' || isCashSale) dataMap[key].Income += amt;
             if(t.type === 'expense') dataMap[key].Expense += amt;
         });
         return Object.values(dataMap).sort((a:any, b:any) => a.name.localeCompare(b.name));
    }, [filteredData]);

    return (
        <div className="space-y-6 pb-20 animate-fade-in">
             <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold dark:text-white flex items-center gap-2"><Icon name="pie-chart" /> Analytics</h2>
                <Button onClick={generatePDF} variant="outline" className="text-xs"><Icon name="download" size={16}/> PDF</Button>
             </div>

             {/* Date Filter */}
             <Card className="flex flex-col md:flex-row gap-4 items-center bg-blue-50 dark:bg-gray-800 border-blue-200">
                 <div className="flex items-center gap-2 w-full md:w-auto">
                     <span className="text-sm font-bold">From:</span>
                     <input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} className="p-2 rounded border w-full" />
                 </div>
                 <div className="flex items-center gap-2 w-full md:w-auto">
                     <span className="text-sm font-bold">To:</span>
                     <input type="date" value={endDate} onChange={e=>setEndDate(e.target.value)} className="p-2 rounded border w-full" />
                 </div>
             </Card>

             <div className="grid grid-cols-3 gap-3">
                 <div className="bg-green-100 p-3 rounded-lg border border-green-300">
                     <p className="text-xs text-green-800 font-bold uppercase">Income</p>
                     <p className="text-lg font-bold text-green-700">{formatCurrency(filteredData.income)}</p>
                 </div>
                 <div className="bg-red-100 p-3 rounded-lg border border-red-300">
                     <p className="text-xs text-red-800 font-bold uppercase">Expense</p>
                     <p className="text-lg font-bold text-red-700">{formatCurrency(filteredData.expenses)}</p>
                 </div>
                 <div className="bg-blue-100 p-3 rounded-lg border border-blue-300">
                     <p className="text-xs text-blue-800 font-bold uppercase">Bottles</p>
                     <p className="text-lg font-bold text-blue-700">{filteredData.bottles}</p>
                 </div>
             </div>

             {/* Gemini AI Section */}
             <Card className="border-l-4 border-indigo-500">
                 <div className="flex justify-between items-center mb-4">
                     <h3 className="font-bold text-lg flex items-center gap-2"><Icon name="sparkles" className="text-yellow-500"/> AI Advisor</h3>
                     <Button onClick={handleGenerateInsight} disabled={loadingInsight} className="text-xs">
                         {loadingInsight ? '...' : 'Ask AI'}
                     </Button>
                 </div>
                 {insight ? (
                     <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg text-sm whitespace-pre-wrap leading-relaxed border dark:border-gray-600">
                         {insight}
                     </div>
                 ) : (
                     <p className="text-gray-500 text-sm">Tap "Ask AI" for insights.</p>
                 )}
             </Card>

             {/* Charts Section */}
             <Card>
                 <h3 className="font-bold mb-4 dark:text-gray-200">Trends ({startDate} - {endDate})</h3>
                 <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                            <XAxis dataKey="name" fontSize={10} />
                            <YAxis fontSize={10} />
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#1f2937', color: '#fff', border: 'none' }} 
                                itemStyle={{ color: '#fff' }}
                            />
                            <Bar dataKey="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="Expense" fill="#ef4444" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                 </div>
             </Card>
        </div>
    );
};