/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CategoryType } from '../../types/accessibility';

const CATEGORIES: CategoryType[] = [
  'Shopping',
  'Dining & Cafe',
  'Healthcare',
  'Education',
  'Public Space',
  'Hotel & Lodging',
  'Service',
  'Other',
];

interface PlaceInfoFieldsProps {
  name: string;
  onNameChange: (val: string) => void;
  category: CategoryType;
  onCategoryChange: (cat: CategoryType) => void;
  address: string;
  onAddressChange: (val: string) => void;
}

export const PlaceInfoFields: React.FC<PlaceInfoFieldsProps> = ({
  name,
  onNameChange,
  category,
  onCategoryChange,
  address,
  onAddressChange,
}) => {
  return (
    <div className="space-y-3">
      <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
        2. Place Information
      </label>

      <div>
        <label className="block text-xs font-medium text-slate-700 mb-1">
          Place Name <span className="text-rose-500">*</span>
        </label>
        <input
          type="text"
          required
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="e.g. Barangay Hall, Riverside Cafe, Clinic"
          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm bg-white"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Category <span className="text-rose-500">*</span>
          </label>
          <select
            value={category}
            onChange={(e) => onCategoryChange(e.target.value as CategoryType)}
            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm bg-white font-medium text-slate-800"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Street Address or Landmark
          </label>
          <input
            type="text"
            value={address}
            onChange={(e) => onAddressChange(e.target.value)}
            placeholder="Street address, barangay, city"
            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm bg-white"
          />
        </div>
      </div>
    </div>
  );
};

