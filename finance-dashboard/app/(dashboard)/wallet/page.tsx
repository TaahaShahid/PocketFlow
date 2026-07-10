'use client';

import React, { useState } from 'react';
import { useFinanceStore } from '../../../hooks/useFinanceStore';
import { Card, CardType } from '../../../types';
import { Plus, CreditCard, Edit3, Trash2, ShieldCheck, AlertTriangle } from 'lucide-react';

export default function WalletPage() {
  const { cards, addCard, editCard, deleteCard, addToast } = useFinanceStore();

  // Modal States
  const [isOpen, setIsOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editingCard, setEditingCard] = useState<Card | null>(null);
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

  const handleOpenEdit = (c: Card) => {
    setEditingCard(c);
    setFormData({
      cardNumber: c.cardNumber, // masked card number
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

    // Masked Card Number Validation (e.g. **** 1234 or a 16-digit card number)
    const rawNumber = formData.cardNumber.replace(/\s+/g, '');
    const isMaskedFormat = /^\*+\d{4}$/.test(rawNumber);
    const isRaw16Digits = /^\d{16}$/.test(rawNumber);

    if (!isMaskedFormat && !isRaw16Digits) {
      errors.cardNumber = 'Enter a 16-digit card number or **** 1234 format';
    }

    // Expiry Date Validation (MM/YY)
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

    // Process card number to store only masked (last 4 digits)
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

  // Card themes helper
  const getCardTheme = (type: CardType) => {
    switch (type) {
      case 'visa':
        return 'bg-gradient-to-br from-indigo-700 via-indigo-900 to-slate-900 text-white shadow-indigo-900/20';
      case 'mastercard':
        return 'bg-gradient-to-br from-red-800 via-orange-950 to-neutral-900 text-white shadow-orange-950/20';
      case 'amex':
        return 'bg-gradient-to-br from-teal-700 via-teal-900 to-slate-950 text-white shadow-teal-900/20';
      default:
        return 'bg-gradient-to-br from-slate-700 via-slate-800 to-zinc-950 text-white shadow-slate-800/20';
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
    <div className="space-y-6">

      {/* Wallet Info header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">Wallet & Cards</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage your payment profiles, debit/credit cards, and check balances.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center justify-center gap-2 h-11 px-5 text-sm font-semibold text-white bg-jm-dark-blue rounded-xl hover:bg-jm-light-blue transition-all shadow-md cursor-pointer self-start sm:self-auto"
        >
          <Plus className="h-4.5 w-4.5" />
          <span>Add New Card</span>
        </button>
      </div>

      {/* Total Balance Overview */}
      <div className="p-6 rounded-2xl bg-white dark:bg-jm-navy border border-slate-100 dark:border-jm-dark-blue shadow-sm flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-jm-dark-blue/10 dark:bg-jm-light-blue/20 text-jm-dark-blue dark:text-jm-light-blue rounded-2xl">
            <CreditCard className="h-7 w-7" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Wallet Balance</p>
            <h3 className="text-3xl font-extrabold text-slate-800 dark:text-white mt-1 tracking-tight">
              {formatCurrency(totalBalance)}
            </h3>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 dark:text-emerald-400 px-3.5 py-2 rounded-xl self-start sm:self-auto">
          <ShieldCheck className="h-4 w-4" />
          <span>Strictly Masked Data Compliance (PCI-DSS)</span>
        </div>
      </div>

      {/* Cards List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((c) => (
          <div
            key={c.id}
            className={`rounded-2xl p-6 flex flex-col justify-between h-56 shadow-xl relative overflow-hidden group transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl ${getCardTheme(c.cardType)}`}
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
              <div className="w-10 h-7.5 rounded bg-amber-400/80 border border-amber-300/40 relative overflow-hidden flex items-center justify-center">
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
                <p className="text-base font-medium tracking-widest mt-1 text-white/90">
                  {c.cardNumber}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-white/60 font-semibold uppercase tracking-wider">Expiry</p>
                <p className="text-xs font-semibold mt-1 text-white/90">
                  {c.expiryDate}
                </p>
              </div>
            </div>

          </div>
        ))}

        {/* Empty Wallet Card State */}
        {cards.length === 0 && (
          <div className="col-span-full text-center py-16 bg-white dark:bg-jm-navy border border-slate-100 dark:border-jm-dark-blue rounded-2xl p-6 shadow-sm">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-400">
              <CreditCard className="h-8 w-8" />
            </div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Add your first wallet.</h3>
            <p className="text-sm text-slate-400 dark:text-slate-500 mt-1 max-w-sm mx-auto">
              Please register a debit/credit card to start logging and categorizing transactions.
            </p>
            <button
              onClick={handleOpenAdd}
              className="mt-4 px-5 py-2 text-xs font-bold text-white bg-jm-dark-blue hover:bg-jm-light-blue rounded-xl shadow-md"
            >
              Add First Card
            </button>
          </div>
        )}
      </div>

      {/* Add / Edit Dialog */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-jm-navy border border-slate-200 dark:border-jm-dark-blue rounded-2xl shadow-xl p-6">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4">
              {isEdit ? 'Edit Card Details' : 'Register New Card'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Nickname / Alias */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Card Nickname</label>
                <input
                  type="text"
                  placeholder="e.g. Main Checking Account"
                  value={formData.nickname}
                  onChange={(e) => setFormData(f => ({ ...f, nickname: e.target.value }))}
                  className="w-full h-11 px-3.5 border border-slate-200 dark:border-jm-dark-blue/80 bg-slate-50 dark:bg-slate-900 rounded-xl text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-jm-dark-blue"
                />
              </div>

              {/* Cardholder Name */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Cardholder Name</label>
                <input
                  type="text"
                  placeholder="e.g. Jane Doe"
                  value={formData.cardHolderName}
                  onChange={(e) => setFormData(f => ({ ...f, cardHolderName: e.target.value }))}
                  className={`w-full h-11 px-3.5 border rounded-xl text-sm bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-jm-dark-blue/80 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-jm-dark-blue ${formErrors.cardHolderName ? 'border-rose-500 ring-2 ring-rose-500/20' : ''
                    }`}
                />
                {formErrors.cardHolderName && <p className="text-rose-500 text-xs mt-1 font-medium">{formErrors.cardHolderName}</p>}
              </div>

              {/* Card Number */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Card Number (16-digits)</label>
                <input
                  type="text"
                  maxLength={16}
                  placeholder="1234567812345678"
                  value={formData.cardNumber}
                  disabled={isEdit}
                  onChange={(e) => setFormData(f => ({ ...f, cardNumber: e.target.value }))}
                  className={`w-full h-11 px-3.5 border rounded-xl text-sm bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-jm-dark-blue/80 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-jm-dark-blue disabled:opacity-50 ${formErrors.cardNumber ? 'border-rose-500 ring-2 ring-rose-500/20' : ''
                    }`}
                />
                <p className="text-[10px] text-slate-400 mt-1 font-medium">PCI Compliance: Numbers are masked automatically upon submit.</p>
                {formErrors.cardNumber && <p className="text-rose-500 text-xs mt-1 font-medium">{formErrors.cardNumber}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Expiry Date */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Expiry Date</label>
                  <input
                    type="text"
                    maxLength={5}
                    placeholder="MM/YY"
                    value={formData.expiryDate}
                    onChange={(e) => setFormData(f => ({ ...f, expiryDate: e.target.value }))}
                    className={`w-full h-11 px-3.5 border rounded-xl text-sm bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-jm-dark-blue/80 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-jm-dark-blue ${formErrors.expiryDate ? 'border-rose-500 ring-2 ring-rose-500/20' : ''
                      }`}
                  />
                  {formErrors.expiryDate && <p className="text-rose-500 text-xs mt-1 font-medium">{formErrors.expiryDate}</p>}
                </div>

                {/* Card Type */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Network</label>
                  <select
                    value={formData.cardType}
                    onChange={(e) => setFormData(f => ({ ...f, cardType: e.target.value as CardType }))}
                    className="w-full h-11 px-3.5 border border-slate-200 dark:border-jm-dark-blue/80 bg-slate-50 dark:bg-slate-900 rounded-xl text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-jm-dark-blue"
                  >
                    <option value="visa">Visa</option>
                    <option value="mastercard">Mastercard</option>
                    <option value="amex">Amex</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              {/* Initial Balance */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Starting Balance ($)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.balance}
                  onChange={(e) => setFormData(f => ({ ...f, balance: e.target.value }))}
                  className={`w-full h-11 px-3.5 border rounded-xl text-sm bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-jm-dark-blue/80 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-jm-dark-blue ${formErrors.balance ? 'border-rose-500 ring-2 ring-rose-500/20' : ''
                    }`}
                />
                {formErrors.balance && <p className="text-rose-500 text-xs mt-1 font-medium">{formErrors.balance}</p>}
              </div>

              {/* Compliance note */}
              <div className="p-3 bg-amber-50 dark:bg-amber-950/20 text-[11px] text-amber-700 dark:text-amber-400 rounded-xl flex items-start gap-2 font-medium">
                <AlertTriangle className="h-4.5 w-4.5 flex-shrink-0 mt-0.5" />
                <span>Security rule: CVV, PIN codes, or full magnetic tracks are never captured or saved.</span>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-sm font-semibold rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-semibold text-white bg-jm-dark-blue rounded-xl hover:bg-jm-light-blue shadow-md"
                >
                  Save Card
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-jm-navy border border-slate-200 dark:border-jm-dark-blue rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-3 text-rose-500">
              <div className="p-2 bg-rose-50 dark:bg-rose-950/20 rounded-xl">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">Delete Card?</h3>
            </div>

            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Are you sure you want to delete this payment card? Transactions linked to this card will lose their wallet association. This action is permanent.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 text-xs font-semibold rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteCard(deleteConfirmId)}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-500 hover:bg-rose-600 rounded-lg shadow-sm"
              >
                Remove Card
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
