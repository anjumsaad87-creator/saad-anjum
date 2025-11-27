import React, { useState } from 'react';
import { useAppStore } from './context/AppContext';
import { Icon, ToastContainer } from './components/UI';
import { Dashboard } from './pages/Dashboard';
import { TasksPage } from './pages/Tasks';
import { NewSale } from './pages/Sales';
import { Customers } from './pages/Customers';
import { Expenses } from './pages/Expenses';
import { HistoryPage } from './pages/History';
import { SettingsPage } from './pages/Settings';
import { ReportsPage } from './pages/Reports';

const App = () => {
    const { darkMode, setDarkMode, toast } = useAppStore();
    const [view, setView] = useState("dashboard");

    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-950 text-gray-900 dark:text-gray-100 font-sans">
         <header className="bg-indigo-700 text-white p-4 shadow-lg sticky top-0 z-40">
           <div className="flex justify-between items-center max-w-4xl mx-auto">
             <div className="flex items-center gap-2 cursor-pointer" onClick={()=>setView('dashboard')}>
               <Icon name="droplet" className="text-blue-300" />
               <div>
                 <h1 className="font-bold leading-none">Xfinitive AI</h1>
                 <p className="text-[10px] text-indigo-200 tracking-widest uppercase">Water Manager</p>
               </div>
             </div>
             <button onClick={()=>setDarkMode(!darkMode)} className="p-2 bg-indigo-600 rounded-full">
               {darkMode ? <Icon name="sun" size={16} /> : <Icon name="moon" size={16} />}
             </button>
           </div>
         </header>

         <main className="p-4 max-w-4xl mx-auto">
           {view === 'dashboard' && <Dashboard setView={setView} />}
           {view === 'tasks' && <TasksPage />}
           {view === 'sale' && <NewSale />}
           {view === 'customers' && <Customers />}
           {view === 'expenses' && <Expenses />}
           {view === 'history' && <HistoryPage />}
           {view === 'settings' && <SettingsPage />}
           {view === 'reports' && <ReportsPage />}
         </main>

         <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t dark:border-gray-800 flex justify-around p-2 z-40 pb-safe">
           {[
             { id: "dashboard", icon: "layout-dashboard", label: "Dash" }, 
             { id: "sale", icon: "plus-circle", label: "Sale" }, 
             { id: "customers", icon: "users", label: "Clients" }, 
             { id: "expenses", icon: "trending-down", label: "Exp" }, 
             { id: "history", icon: "history", label: "History" }, 
             { id: "settings", icon: "settings", label: "Config" }
           ].map(item => (
             <button 
               key={item.id} 
               onClick={() => setView(item.id)} 
               className={`flex flex-col items-center p-2 rounded-lg transition ${view === item.id ? "text-indigo-600 dark:text-indigo-400" : "text-gray-600 dark:text-gray-400"}`}
             >
               <Icon name={item.icon} size={20} />
               <span className="text-[10px] mt-1 font-bold">{item.label}</span>
             </button>
           ))}
         </nav>
         
         <ToastContainer toast={toast} />
      </div>
    );
};

export default App;