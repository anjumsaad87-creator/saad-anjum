import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { db } from '../firebaseConfig';
import { Customer, Product, Transaction, Stats, ToastData } from '../types';
import { getBusinessDateKey } from '../utils';

interface AppContextType {
  customers: Customer[];
  products: Product[];
  transactions: Transaction[];
  reversedTransactions: Transaction[];
  stats: Stats;
  darkMode: boolean;
  setDarkMode: (v: boolean) => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
  recordSale: (data: any) => void;
  recordCollection: (customer: Customer, amount: number) => void;
  recordExpense: (amount: number, category: string) => void;
  reverseTransaction: (tx: Transaction) => void;
  addCustomer: (name: string, phone: string, address: string, initialBalance?: number) => void;
  deleteCustomer: (c: Customer, isBadDebt: boolean) => void;
  addProduct: (name: string, price: string | number) => void;
  deleteProduct: (id: string) => void;
  updateSchedule: (cid: string, schedule: any) => void;
  importCustomers: (dataRows: any[]) => number;
  toast: ToastData | null;
}

const AppContext = createContext<AppContextType | null>(null);

export const useAppStore = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useAppStore must be used within AppProvider");
  return context;
};

export const AppProvider = ({ children }: React.PropsWithChildren<{}>) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [reversedTransactions, setReversedTransactions] = useState<Transaction[]>([]);
  const [darkMode, setDarkModeState] = useState(() => {
    try { return localStorage.getItem("wm_dark_mode") === "true"; } catch (e) { return false; }
  });
  const [toast, setToast] = useState<ToastData | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const setDarkMode = (val: boolean) => {
    setDarkModeState(val);
    if (val) {
      document.documentElement.classList.add("dark");
      document.body.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
      document.body.classList.remove("dark");
    }
    try { localStorage.setItem("wm_dark_mode", String(val)); } catch (e) { }
  };

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      document.body.classList.add("dark");
    }
  }, []);

  useEffect(() => {
    const unsubC = db.collection("customers").onSnapshot(snap => setCustomers(snap.docs.map(d => ({ id: d.id, ...d.data() } as Customer))));
    const unsubP = db.collection("products").onSnapshot(snap => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Product));
      if (list.length === 0) {
        const DEFAULT_PRODUCTS = [{ name: "19 Litre Bottle", price: 100 }, { name: "Small Bottle 0.5L", price: 20 }, { name: "Medium Bottle 1.5L", price: 40 }, { name: "Big Bottle 5L", price: 70 }];
        DEFAULT_PRODUCTS.forEach(p => db.collection("products").add(p));
      } else setProducts(list);
    });
    const unsubT = db.collection("transactions").onSnapshot(snap => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Transaction));
      setTransactions(list);
    });
    const unsubR = db.collection("reversals").onSnapshot(snap => { setReversedTransactions(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction))); });
    return () => { unsubC(); unsubP(); unsubT(); unsubR(); };
  }, []);

  const addCustomer = (name: string, phone: string, address: string, initialBalance = 0) => {
    db.collection("customers").add({ name, phone, address, balance: initialBalance });
  };

  const updateSchedule = (cid: string, schedule: any) => db.collection("customers").doc(cid).update({ schedule });

  const importCustomers = (dataRows: any[]) => {
    let addedCount = 0;
    dataRows.forEach(row => {
      const name = row[0]?.replace(/^"|"$/g, '').trim();
      const phone = row[1]?.replace(/^"|"$/g, '').trim();
      const address = row[2]?.replace(/^"|"$/g, '').trim();
      const balance = parseFloat(row[3]?.replace(/^"|"$/g, '')) || 0;
      if (name) { db.collection("customers").add({ name, phone, address, balance, schedule: {} }); addedCount++; }
    });
    return addedCount;
  };

  const recordSale = (data: any) => {
    try {
      const { saleType, customerId, totalAmount, amount } = data;
      let desc = data.description || "Sale";
      const finalAmt = Number(amount || totalAmount || 0);

      if (finalAmt <= 0) {
        console.warn("Skipping zero amount sale");
        return;
      }

      if (saleType === "credit" && customerId) {
        const c = customers.find(x => x.id === customerId);
        if (c && !desc.includes(c.name)) desc = `Credit Sale (${c.name}): ` + desc;
      } else if (saleType === 'cash' && !desc.includes("Cash")) {
        desc = "Cash Sale: " + desc;
      }

      const txData = {
        ...data,
        productId: data.product?.id || data.productId, // Ensure productId is correctly saved
        quantity: Number(data.quantity) || 0, // Ensure quantity is strictly a number
        paymentMethod: saleType, 
        amount: finalAmt,
        description: desc,
        type: 'sale',
        date: new Date().toISOString()
      };

      delete txData.totalAmount;
      if (txData.customerId === undefined) txData.customerId = null;

      db.collection("transactions").add(txData);

      if (customerId) {
        const cRef = db.collection("customers").doc(customerId);
        cRef.get().then((d: any) => { if (d.exists) cRef.update({ balance: (Number(d.data().balance) || 0) + finalAmt }); });
      }
    } catch (e) { console.error("Record Sale Error:", e); showToast("Error recording sale. Check internet.", "error"); }
  };

  const recordCollection = (customer: Customer, amount: number) => {
    db.collection("transactions").add({ type: "collection", amount, description: "Payment from " + customer.name, date: new Date().toISOString(), customerId: customer.id });
    db.collection("customers").doc(customer.id).update({ balance: customer.balance - amount });
  };

  const recordExpense = (amount: number, category: string) => {
    db.collection("transactions").add({ type: "expense", amount, category, description: "Expense: " + category, date: new Date().toISOString() });
  };

  const deleteCustomer = (c: Customer, isBadDebt: boolean) => {
    if (isBadDebt) recordExpense(c.balance, 'Bad Debt');
    db.collection("customers").doc(c.id).delete();
  };

  const addProduct = (name: string, price: string | number) => db.collection("products").add({ name, price: parseFloat(String(price)) });
  const deleteProduct = (id: string) => db.collection("products").doc(id).delete();

  const reverseTransaction = (tx: Transaction) => {
    db.collection("transactions").doc(tx.id).update({ isDeleted: true, description: tx.description + " [VOID]" });
    if (tx.customerId && !tx.isDeleted) {
      const cRef = db.collection("customers").doc(tx.customerId);
      cRef.get().then((d: any) => {
        if (d.exists) {
          const bal = d.data().balance || 0;
          if (tx.type === "sale") cRef.update({ balance: bal - tx.amount });
          if (tx.type === "collection") cRef.update({ balance: bal + tx.amount });
        }
      });
    }
    showToast("Transaction Voided", "success");
  };

  const stats = useMemo(() => {
    const dayStats: Record<string, any> = {}, monthStats: Record<string, any> = {}, customerHistory: Record<string, any> = {};
    let collectionAllTime = 0; let expensesAllTime = 0; let badDebtAllTime = 0;

    transactions.filter(t => !t.isDeleted).forEach(t => {
      const d = new Date(t.date);
      if (isNaN(d.getTime())) return;
      const dKey = getBusinessDateKey(d); const mKey = dKey.substring(0, 7);

      if (!dayStats[dKey]) dayStats[dKey] = { collection: 0, bottles: 0, variantMap: {} };
      if (!monthStats[mKey]) monthStats[mKey] = { collection: 0, expenses: 0, badDebt: 0, cashExpenses: 0 };

      const amt = Number(t.amount) || 0;

      // Logic Update: Check paymentMethod OR saleType for compatibility
      const isCashSale = t.type === 'sale' && (t.paymentMethod === 'cash' || (t as any).saleType === 'cash');

      if (t.type === 'collection' || isCashSale) {
        collectionAllTime += amt;
        dayStats[dKey].collection += amt;
        monthStats[mKey].collection += amt;
      }
      if (t.type === 'expense') {
        if (t.category === 'Bad Debt') {
          badDebtAllTime += amt;
          monthStats[mKey].badDebt += amt;
        } else {
          expensesAllTime += amt;
          monthStats[mKey].cashExpenses += amt;
          monthStats[mKey].expenses += amt;
        }
      }
      if (t.type === 'sale') {
        // SAFETY FIX: Ensure qty is parsed as a number to avoid string concatenation bugs
        const qty = Number(t.quantity) || 0;
        dayStats[dKey].bottles += qty;
        
        if (t.customerId) {
          if (!customerHistory[t.customerId]) customerHistory[t.customerId] = {};
          const pname = t.description.match(/x\s(.*?)\s\+/)?.[1] || t.description.split('x')[1] || "Item";
          customerHistory[t.customerId][pname] = (customerHistory[t.customerId][pname] || 0) + qty;
        }
        
        // Fix Top Variant Logic: Check productId AND nested product.id (legacy)
        const pId = t.productId || (t as any).product?.id;
        if (pId) {
          // Try to get name from current product list, fallback to transaction snapshot if available
          const vName = products.find(p => p.id === pId)?.name || (t as any).product?.name || "Unknown";
          
          if (!dayStats[dKey].variantMap[pId]) dayStats[dKey].variantMap[pId] = { name: vName, count: 0, revenue: 0 };
          dayStats[dKey].variantMap[pId].count += qty;
          dayStats[dKey].variantMap[pId].revenue += amt;
        }
      }
    });
    const totalReceivable = customers.reduce((s, c) => s + (Number(c.balance) || 0), 0);
    const lifetimeNet = collectionAllTime - (expensesAllTime + badDebtAllTime);

    return { lifetimeNet, totalReceivable, dayStats, monthStats, customerHistory };
  }, [transactions, customers, products]);

  return (
    <AppContext.Provider value={{ customers, products, transactions, reversedTransactions, stats, darkMode, setDarkMode, showToast, recordSale, recordCollection, recordExpense, reverseTransaction, addCustomer, deleteCustomer, addProduct, deleteProduct, updateSchedule, importCustomers, toast }}>
      {children}
    </AppContext.Provider>
  );
};