import React, { useState } from 'react';
import { useAppStore } from '../context/AppContext';
import { Card, Button, Icon } from '../components/UI';
import { generateBusinessInsights } from '../services/geminiService';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line } from 'recharts';

export const ReportsPage = () => {
    const { stats, transactions } = useAppStore();
    const [insight, setInsight] = useState("");
    const [loadingInsight, setLoadingInsight] = useState(false);

    const handleGenerateInsight = async () => {
        setLoadingInsight(true);
        const result = await generateBusinessInsights(stats, transactions);
        setInsight(result);
        setLoadingInsight(false);
    };

    // Prepare chart data
    const chartData = Object.entries(stats.monthStats)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .slice(-6) // Last 6 months
        .map(([key, val]: any) => ({
            name: key,
            Income: val.collection,
            Expense: val.expenses
        }));

    return (
        <div className="space-y-6 pb-20 animate-fade-in">
             <h2 className="text-2xl font-bold dark:text-white flex items-center gap-2"><Icon name="pie-chart" /> Analytics & AI</h2>

             {/* Gemini AI Section */}
             <Card className="border-l-4 border-indigo-500">
                 <div className="flex justify-between items-center mb-4">
                     <h3 className="font-bold text-lg flex items-center gap-2"><Icon name="sparkles" className="text-yellow-500"/> AI Business Advisor</h3>
                     <Button onClick={handleGenerateInsight} disabled={loadingInsight} className="text-xs">
                         {loadingInsight ? 'Analyzing...' : 'Ask AI'}
                     </Button>
                 </div>
                 {insight ? (
                     <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg text-sm whitespace-pre-wrap leading-relaxed border dark:border-gray-600">
                         {insight}
                     </div>
                 ) : (
                     <p className="text-gray-500 text-sm">Tap "Ask AI" to get personalized business recommendations based on your transaction history.</p>
                 )}
             </Card>

             {/* Charts Section */}
             <Card>
                 <h3 className="font-bold mb-4 dark:text-gray-200">Financial Overview (Last 6 Months)</h3>
                 <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                            <XAxis dataKey="name" fontSize={12} />
                            <YAxis fontSize={12} />
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