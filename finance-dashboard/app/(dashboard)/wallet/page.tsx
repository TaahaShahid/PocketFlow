'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFinanceStore } from '../../../hooks/useFinanceStore';
import { useWallets } from '@/context/WalletContext';
import { Card as WalletCard, CardType } from '../../../types';
import { Button } from '@/components/ui/button';
import { Plus, CreditCard, Edit3, Trash2, ShieldCheck, AlertTriangle, Loader2, X, Calendar, User, Layers } from 'lucide-react';

export default function WalletPage() {
  const { wallets: cards, addWallet: addCard, editWallet: editCard, removeWallet: deleteCard, loading } = useWallets();
  const { addToast } = useFinanceStore();

  // Modal States
  const [isOpen, setIsOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editingCard, setEditingCard] = useState<WalletCard | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    cardNumber: '',
    cardHolderName: '',
    expiryDate: '',
    cardType: 'visa' as CardType,
    nickname: '',
    balance: ''
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleOpenAdd = () => {
    setFormData({
      cardNumber: '',
      cardHolderName: '',
      expiryDate: '',
      cardType: 'visa',
      nickname: '',
      balance: ''
    });
    setFormErrors({});
    setIsEdit(false);
    setIsOpen(true);
  };

  const handleOpenEdit = (c: WalletCard) => {
    setEditingCard(c);
    setFormData({
      cardNumber: c.cardNumber,
      cardHolderName: c.cardHolderName,
      expiryDate: c.expiryDate,
      cardType: c.cardType,
      nickname: c.nickname || '',
      balance: c.balance.toString()
    });
    setFormErrors({});
    setIsEdit(true);
    setIsOpen(true);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    const balVal = parseFloat(formData.balance);

    if (isNaN(balVal) || balVal < 0) {
      errors.balance = 'Balance must be zero or a positive number';
    }

    if (!formData.cardHolderName.trim()) {
      errors.cardHolderName = 'Cardholder name is required';
    }

    const rawNumber = formData.cardNumber.replace(/\s+/g, '');
    const isMaskedFormat = /^\*+\d{4}$/.test(rawNumber);
    const isRaw16Digits = /^\d{16}$/.test(rawNumber);

    if (!isMaskedFormat && !isRaw16Digits) {
      errors.cardNumber = 'Enter a 16-digit card number or **** 1234 format';
    }

    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(formData.expiryDate)) {
      errors.expiryDate = 'Expiry date must be in MM/YY format';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      addToast('Please complete card details correctly', 'error');
      return;
    }

    const rawNumber = formData.cardNumber.replace(/\s+/g, '');
    let finalCardNumber = rawNumber;
    if (rawNumber.length === 16) {
      finalCardNumber = `**** ${rawNumber.substring(12)}`;
    }

    const payload = {
      cardNumber: finalCardNumber,
      cardHolderName: formData.cardHolderName.trim(),
      expiryDate: formData.expiryDate.trim(),
      cardType: formData.cardType,
      nickname: formData.nickname.trim() ? formData.nickname.trim() : null,
      balance: parseFloat(formData.balance)
    };

    if (isEdit && editingCard) {
      editCard(editingCard.id, payload);
      addToast('Card details updated successfully', 'success');
    } else {
      addCard(payload);
      addToast('New wallet registered successfully', 'success');
    }

    setIsOpen(false);
  };

  const handleDeleteCard = (id: string) => {
    deleteCard(id);
    addToast('Card removed from wallet', 'success');
    setDeleteConfirmId(null);
  };

  const getCardTheme = (type: CardType) => {
    switch (type) {
      case 'visa':
        return 'bg-gradient-to-br from-indigo-700 via-indigo-900 to-slate-900 text-white shadow-xl shadow-indigo-950/20';
      case 'mastercard':
        return 'bg-gradient-to-br from-red-800 via-orange-950 to-neutral-900 text-white shadow-xl shadow-orange-950/20';
      case 'amex':
        return 'bg-gradient-to-br from-teal-700 via-teal-900 to-slate-950 text-white shadow-xl shadow-teal-950/20';
      default:
        return 'bg-gradient-to-br from-slate-700 via-slate-800 to-zinc-950 text-white shadow-xl shadow-slate-800/20';
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(val);
  };

  const totalBalance = cards.reduce((sum, c) => sum + c.balance, 0);

  return (
    <div className="space-y-6 pb-20">
      {/* Wallet Info header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">Wallet & Cards</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage your payment profiles, debit/credit cards, and check balances.
          </p>
        </div>
        <Button
          onClick={handleOpenAdd}
          className="rounded-xl shadow-lg shadow-primary/10 self-start sm:self-auto"
        >
          <Plus className="h-4.5 w-4.5" />
          <span>Add New Card</span>
        </Button>
      </div>

      {/* Total Balance Overview */}
      <div className="p-6 rounded-3xl border border-border bg-card/45 backdrop-blur-xl shadow-2xl flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-primary/10 text-primary rounded-2xl border border-primary/15">
            <CreditCard className="h-7 w-7" />
          </div>
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total Wallet Balance</p>
            <h3 className="text-3xl font-extrabold text-foreground mt-1 tracking-tight">
              {formatCurrency(totalBalance)}
            </h3>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/10 px-3.5 py-2 rounded-xl self-start sm:self-auto">
          <ShieldCheck className="h-4.5 w-4.5" />
          <span>Strictly Masked Data Compliance (PCI-DSS)</span>
        </div>
      </div>

      {/* Cards List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((c) => (
          <div
            key={c.id}
            className={`rounded-3xl p-6 flex flex-col justify-between h-56 shadow-xl relative overflow-hidden group transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl ${getCardTheme(c.cardType)}`}
          >
            {/* Card Background Mesh overlay */}
            <div className="absolute inset-0 bg-white/[0.03] bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent pointer-events-none" />

            {/* Top row */}
            <div className="flex justify-between items-start z-10">
              <div>
                <p className="text-xs text-white/70 font-semibold tracking-wide uppercase">
                  {c.nickname || 'General Wallet'}
                </p>
                <h4 className="text-xl font-bold tracking-wide mt-1">
                  {formatCurrency(c.balance)}
                </h4>
              </div>
              <span className="text-sm font-black italic tracking-wider uppercase text-white/90">
                {c.cardType}
              </span>
            </div>

            {/* Middle row: Card chip and symbol */}
            <div className="flex items-center justify-between z-10">
              {/* Chip illustration */}
              <div className="w-10 h-7.5 rounded bg-amber-400/80 border border-amber-300/45 relative overflow-hidden flex items-center justify-center">
                <div className="absolute inset-x-2.5 inset-y-1.5 border border-amber-600/30 rounded-sm grid grid-cols-3 gap-0.5">
                  <div className="border-r border-b border-amber-600/30" />
                  <div className="border-r border-b border-amber-600/30" />
                  <div className="border-b border-amber-600/30" />
                  <div className="border-r border-amber-600/30" />
                  <div className="border-r border-amber-600/30" />
                  <div className="border-amber-600/30" />
                </div>
              </div>

              <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleOpenEdit(c)}
                  className="p-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-white transition-colors"
                  title="Edit Card"
                >
                  <Edit3 className="h-4.5 w-4.5" />
                </button>
                <button
                  onClick={() => setDeleteConfirmId(c.id)}
                  className="p-1.5 bg-white/20 hover:bg-rose-500 rounded-lg text-white transition-colors"
                  title="Delete Card"
                >
                  <Trash2 className="h-4.5 w-4.5" />
                </button>
              </div>
            </div>

            {/* Bottom row: Card Number and details */}
            <div className="flex justify-between items-end z-10 font-mono">
              <div>
                <p className="text-[10px] text-white/60 font-semibold uppercase tracking-wider">Card Number</p>
                <p className="text-base font-semibold tracking-widest mt-0.5 text-white/95">
                  {c.cardNumber}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-white/60 font-semibold uppercase tracking-wider">Expiry</p>
                <p className="text-xs font-semibold mt-0.5 text-white/95">
                  {c.expiryDate}
                </p>
              </div>
            </div>
          </div>
        ))}

        {/* Empty Wallet Card State */}
        {cards.length === 0 && (
          <div className="col-span-full text-center py-16 border border-border bg-card/45 rounded-3xl p-6 shadow-2xl">
            <div className="w-16 h-16 bg-muted/15 border border-border rounded-2xl flex items-center justify-center mx-auto mb-4 text-muted-foreground">
              <CreditCard className="h-8 w-8" />
            </div>
            <h3 className="text-base font-bold text-foreground">Add your first wallet.</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
              Please register a debit/credit card to start logging and categorizing transactions.
            </p>
            <Button
              onClick={handleOpenAdd}
              className="mt-4 rounded-xl shadow-md"
            >
              Add First Card
            </Button>
          </div>
        )}
      </div>

      {/* Add / Edit Dialog */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-card/95 border border-border text-foreground rounded-3xl shadow-2xl p-6 relative w-full max-w-lg overflow-hidden z-10"
            >
              <div className="flex items-center justify-between mb-6 border-b border-border pb-4">
                <h2 className="text-xl font-bold tracking-tight">
                  {isEdit ? "Edit Card Details" : "Register New Card"}
                </h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded-lg hover:bg-muted/10 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="overflow-y-auto max-h-[70vh] pr-1">
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Nickname */}
                  <div>
                    <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                      Card Nickname
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Main Checking Account"
                      value={formData.nickname}
                      onChange={(e) =>
                        setFormData((f) => ({ ...f, nickname: e.target.value }))
                      }
                      className="w-full h-10 px-3 border border-border bg-muted/10 rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-transparent transition-all"
                    />
                  </div>

                  {/* Cardholder */}
                  <div>
                    <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1">
                      <User className="w-3.5 h-3.5" /> Cardholder Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Jane Doe"
                      value={formData.cardHolderName}
                      onChange={(e) =>
                        setFormData((f) => ({
                          ...f,
                          cardHolderName: e.target.value,
                        }))
                      }
                      className={`w-full h-10 px-3 border rounded-xl text-sm bg-muted/10 text-foreground border-border focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-transparent transition-all
                      ${formErrors.cardHolderName ? "border-rose-500 ring-2 ring-rose-500/20" : ""}`}
                    />
                    {formErrors.cardHolderName && (
                      <p className="text-rose-500 text-xs mt-1 font-medium">
                        {formErrors.cardHolderName}
                      </p>
                    )}
                  </div>

                  {/* Card Number */}
                  <div>
                    <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1">
                      <CreditCard className="w-3.5 h-3.5" /> Card Number (16-digits)
                    </label>
                    <input
                      type="text"
                      maxLength={16}
                      placeholder="1234567812345678"
                      value={formData.cardNumber}
                      disabled={isEdit}
                      onChange={(e) =>
                        setFormData((f) => ({
                          ...f,
                          cardNumber: e.target.value,
                        }))
                      }
                      className={`w-full h-10 px-3 border rounded-xl text-sm bg-muted/10 text-foreground border-border focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-transparent transition-all disabled:opacity-50
                      ${formErrors.cardNumber ? "border-rose-500 ring-2 ring-rose-500/20" : ""}`}
                    />
                    <p className="text-[10px] text-muted-foreground mt-1 font-semibold">
                      PCI Compliance: Numbers are masked automatically upon submit.
                    </p>
                    {formErrors.cardNumber && (
                      <p className="text-rose-500 text-xs mt-1 font-medium">
                        {formErrors.cardNumber}
                      </p>
                    )}
                  </div>

                  {/* Expiry & Network */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" /> Expiry Date
                      </label>
                      <input
                        type="text"
                        maxLength={5}
                        placeholder="MM/YY"
                        value={formData.expiryDate}
                        onChange={(e) =>
                          setFormData((f) => ({
                            ...f,
                            expiryDate: e.target.value,
                          }))
                        }
                        className={`w-full h-10 px-3 border rounded-xl text-sm bg-muted/10 text-foreground border-border focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-transparent transition-all
                        ${formErrors.expiryDate ? "border-rose-500 ring-2 ring-rose-500/20" : ""}`}
                      />
                      {formErrors.expiryDate && (
                        <p className="text-rose-500 text-xs mt-1 font-medium">
                          {formErrors.expiryDate}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1">
                        <Layers className="w-3.5 h-3.5" /> Network
                      </label>
                      <select
                        value={formData.cardType}
                        onChange={(e) =>
                          setFormData((f) => ({
                            ...f,
                            cardType: e.target.value as CardType,
                          }))
                        }
                        className="w-full h-10 px-3 border border-border bg-muted/10 rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-transparent transition-all cursor-pointer"
                      >
                        <option value="visa" className="bg-card">Visa</option>
                        <option value="mastercard" className="bg-card">Mastercard</option>
                        <option value="amex" className="bg-card">Amex</option>
                        <option value="other" className="bg-card">Other</option>
                      </select>
                    </div>
                  </div>

                  {/* Balance */}
                  <div>
                    <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5" /> Starting Balance ($)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.balance}
                      onChange={(e) =>
                        setFormData((f) => ({
                          ...f,
                          balance: e.target.value,
                        }))
                      }
                      className={`w-full h-10 px-3 border rounded-xl text-sm bg-muted/10 text-foreground border-border focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-transparent transition-all
                      ${formErrors.balance ? "border-rose-500 ring-2 ring-rose-500/20" : ""}`}
                    />
                    {formErrors.balance && (
                      <p className="text-rose-500 text-xs mt-1 font-medium">
                        {formErrors.balance}
                      </p>
                    )}
                  </div>

                  {/* Compliance Note */}
                  <div className="p-3 bg-amber-500/10 border border-amber-500/10 text-[11px] text-amber-500 rounded-xl flex items-start gap-2 font-bold">
                    <AlertTriangle className="h-4.5 w-4.5 flex-shrink-0 mt-0.5" />
                    <span>
                      Security rule: CVV, PIN codes, or full magnetic tracks are never
                      captured or saved.
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end gap-2 pt-4 border-t border-border">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setIsOpen(false)}
                      className="rounded-xl"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="rounded-xl shadow-md"
                    >
                      Save Card
                    </Button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirm */}
      <AnimatePresence>
        {deleteConfirmId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteConfirmId(null)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-card/95 border border-border text-foreground rounded-3xl shadow-2xl p-6 relative w-full max-w-md z-10"
            >
              <div className="flex items-center gap-3 text-destructive">
                <div className="p-2 bg-destructive/10 rounded-xl">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold">Delete Card?</h3>
              </div>

              <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
                Are you sure you want to delete this payment card? Transactions linked
                to this card will lose their wallet association. This action is
                permanent.
              </p>

              <div className="flex justify-end gap-2 pt-6 border-t border-border mt-6">
                <Button
                  onClick={() => setDeleteConfirmId(null)}
                  variant="ghost"
                  className="rounded-xl text-muted-foreground"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => handleDeleteCard(deleteConfirmId)}
                  variant="destructive"
                  className="rounded-xl shadow-md"
                >
                  Remove Card
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
