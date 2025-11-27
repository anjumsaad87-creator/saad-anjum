import React from 'react';
import { LucideIcon } from 'lucide-react';
import * as LucideIcons from 'lucide-react';

export const Icon = ({ name, size = 24, className = "" }: { name: string, size?: number, className?: string }) => {
    // @ts-ignore
    const IconComp = LucideIcons[name.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('')];
    if (!IconComp) return null;
    return <IconComp size={size} className={className} />;
};

export const Card: React.FC<{ children?: React.ReactNode; className?: string }> = ({ children, className = "" }) => (
    <div className={"bg-white rounded-xl shadow-md p-4 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 " + className}>
        {children}
    </div>
);

export const Button = ({ children, variant = "primary", className = "", ...props }: any) => {
    const base = "px-4 py-2 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition shadow-sm active:scale-95";
    const variants: any = {
        primary: "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200 dark:shadow-none",
        success: "bg-green-600 hover:bg-green-700 text-white shadow-green-200 dark:shadow-none",
        danger: "bg-red-500 hover:bg-red-600 text-white shadow-red-200 dark:shadow-none",
        outline: "border border-gray-300 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700",
    };
    return <button className={base + " " + variants[variant] + " " + className} {...props}>{children}</button>;
};

export const ToastContainer = ({ toast }: { toast: any }) => {
    if (!toast) return null;
    return (
        <div className="fixed bottom-20 left-0 right-0 flex justify-center z-[150] pointer-events-none">
            <div className={`animate-slide-up px-6 py-3 rounded-full shadow-2xl font-medium text-sm flex items-center gap-2 ${toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-gray-800 text-white dark:bg-white dark:text-gray-900'}`}>
                {toast.type === 'error' ? <Icon name="alert-circle" size={20} /> : <Icon name="check-circle" size={20} className="text-green-400" />}
                {toast.message}
            </div>
        </div>
    );
};

export const ConfirmModal = ({ isOpen, title, message, onConfirm, onCancel }: any) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/60 z-[120] flex items-center justify-center px-4 animate-fade-in">
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-sm w-full p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3 text-red-600 mb-4">
                    <div className="bg-red-100 dark:bg-red-900/30 p-2 rounded-full"><Icon name="alert-triangle" size={24} /></div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{title}</h3>
                </div>
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-6 whitespace-pre-wrap leading-relaxed">{message}</p>
                <div className="flex gap-3">
                    <Button variant="outline" className="flex-1" onClick={onCancel}>Cancel</Button>
                    <Button variant="danger" className="flex-1" onClick={onConfirm}>Confirm</Button>
                </div>
            </div>
        </div>
    );
};

export const WhatsAppModal = ({ isOpen, customerName, saleDetails, total, balance, onCancel }: any) => {
    if (!isOpen) return null;
    const handleSend = () => {
        const text = `*Xfinitive Water Solutions*%0A--------------------------------%0AHello ${customerName},%0A%0A*Transaction Alert:*%0A${saleDetails}%0A%0A*Amount: ${total}*%0A*Current Balance: ${balance}*%0A%0AThank you for your business!`;
        window.open(`https://wa.me/?text=${text}`, '_blank');
        onCancel();
    };
    return (
        <div className="fixed inset-0 bg-black/60 z-[130] flex items-center justify-center px-4 animate-fade-in">
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-sm w-full p-6 border dark:border-gray-700">
                <h3 className="text-lg font-bold text-green-600 mb-2 flex items-center gap-2"><Icon name="message-circle" /> WhatsApp Notification</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">Send transaction details to <b>{customerName}</b> via WhatsApp?</p>
                <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={onCancel}>Skip</Button>
                    <Button className="flex-1 bg-green-600 hover:bg-green-700 text-white" onClick={handleSend}>Send Message</Button>
                </div>
            </div>
        </div>
    );
};