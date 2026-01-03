import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";

export interface Transaction {
  id: string;
  customerId: string;
  description: string;
  amount: number;
  date: string; // ISO string
  type: "credit" | "payment";
}

export interface Customer {
  id: string;
  name: string;
  nickname?: string;
  phone?: string;
  createdAt: string;
}

export interface QuickItem {
  id: string;
  name: string;
  price: number;
}

export interface StoreData {
  customers: Customer[];
  transactions: Transaction[];
  quickItems: QuickItem[];
}

const STORAGE_KEY = "bar_caderneta_v2"; // Bumped version for new schema

export const useStore = () => {
  const [data, setData] = useState<StoreData>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);

    // Default quick items
    const defaultQuickItems: QuickItem[] = [
      { id: "1", name: "Cerveja 600", price: 8 },
      { id: "2", name: "Dose", price: 0.5 },
      { id: "3", name: "Cerveja Lata", price: 3.5 },
      { id: "4", name: "Cigarro", price: 5 },
    ];

    return { customers: [], transactions: [], quickItems: defaultQuickItems };
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  const addCustomer = (customer: Omit<Customer, "id" | "createdAt">) => {
    const newCustomer: Customer = {
      ...customer,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
    };
    setData((prev) => ({
      ...prev,
      customers: [...prev.customers, newCustomer],
    }));
    return newCustomer;
  };

  const deleteCustomer = (id: string) => {
    setData((prev) => ({
      ...prev,
      customers: prev.customers.filter((c) => c.id !== id),
      transactions: prev.transactions.filter((t) => t.customerId !== id),
    }));
  };

  const addTransaction = (transaction: Omit<Transaction, "id" | "date">) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: uuidv4(),
      date: new Date().toISOString(),
    };
    setData((prev) => ({
      ...prev,
      transactions: [...prev.transactions, newTransaction],
    }));
  };

  const deleteTransaction = (id: string) => {
    setData((prev) => ({
      ...prev,
      transactions: prev.transactions.filter((t) => t.id !== id),
    }));
  };

  const addQuickItem = (item: Omit<QuickItem, "id">) => {
    setData((prev) => ({
      ...prev,
      quickItems: [...prev.quickItems, { ...item, id: uuidv4() }],
    }));
  };

  const updateQuickItem = (id: string, updates: Omit<QuickItem, "id">) => {
    setData((prev) => ({
      ...prev,
      quickItems: prev.quickItems.map((item) =>
        item.id === id ? { ...item, ...updates } : item
      ),
    }));
  };

  const deleteQuickItem = (id: string) => {
    setData((prev) => ({
      ...prev,
      quickItems: prev.quickItems.filter((item) => item.id !== id),
    }));
  };

  const getCustomerBalance = (customerId: string) => {
    return data.transactions
      .filter((t) => t.customerId === customerId)
      .reduce((acc, t) => {
        return t.type === "credit" ? acc + t.amount : acc - t.amount;
      }, 0);
  };

  const getLastTransactionDate = (customerId: string) => {
    const customerTransactions = data.transactions.filter(
      (t) => t.customerId === customerId && t.type === "credit"
    );

    if (customerTransactions.length === 0) return null;

    // Sort by date descending
    return customerTransactions.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )[0].date;
  };

  const exportData = () => {
    const dataStr = JSON.stringify(data);
    const dataUri =
      "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
    const exportFileDefaultName = `backup_bar_${new Date().toLocaleDateString()}.json`;

    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();
  };

  const importData = (jsonData: string) => {
    try {
      const parsed = JSON.parse(jsonData);
      if (parsed.customers && parsed.transactions) {
        setData(parsed);
        return true;
      }
      return false;
    } catch (e) {
      console.error("Invalid JSON", e);
      return false;
    }
  };

  return {
    customers: data.customers,
    transactions: data.transactions,
    quickItems: data.quickItems,
    addCustomer,
    deleteCustomer,
    addTransaction,
    deleteTransaction,
    addQuickItem,
    updateQuickItem,
    deleteQuickItem,
    getCustomerBalance,
    getLastTransactionDate,
    exportData,
    importData,
  };
};
