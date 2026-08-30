export interface Invoice {
  id: string;
  merchantId: string;
  vendorName: string;
  invoiceNumber: string;
  phone: string;
  taxNumber: string;
  vendorEmail: string;
  items: InvoiceItem[];
  totalAmount: number;
  discount: number;
  tax: number;
  finalAmount: number;
  paymentMethod: 'cash' | 'transfer' | 'credit';
  dueDate?: Date;
  vendorDebt: number;
  status: 'draft' | 'confirmed' | 'paid';
  createdAt: Date;
  updatedAt: Date;
}

export interface InvoiceItem {
  id: string;
  productName: string;
  price: number;
  quantity: number;
  barcode: string;
  totalPrice: number;
}

export interface Vendor {
  id: string;
  merchantId: string;
  name: string;
  phone: string;
  taxNumber: string;
  email: string;
  totalDebit: number;
  totalCredit: number;
  balance: number;
  invoices: Invoice[];
}

export interface ExpenseLog {
  id: string;
  merchantId: string;
  amount: number;
  category: string;
  description: string;
  createdAt: Date;
}
