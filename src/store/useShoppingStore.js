// src/store/useShoppingStore.js
import { create } from 'zustand';
import { nanoid } from 'nanoid';

// Predefined categories for common items in both English and Hindi
const itemCategories = {
  'milk': 'Dairy',
  'doodh': 'Dairy',
  'eggs': 'Dairy',
  'ande': 'Dairy',
  'cheese': 'Dairy',
  'paneer': 'Dairy',
  'yogurt': 'Dairy',
  'dahi': 'Dairy',
  'bread': 'Bakery',
  'pav': 'Bakery',
  'apples': 'Produce',
  'seb': 'Produce',
  'bananas': 'Produce',
  'kele': 'Produce',
  'oranges': 'Produce',
  'santre': 'Produce',
  'carrots': 'Produce',
  'gajar': 'Produce',
  'potato chips': 'Snacks',
  'aaloo chips': 'Snacks',
  'cookies': 'Snacks',
  'biscuits': 'Snacks',
  'soda': 'Beverages',
  'thandai': 'Beverages',
  'water': 'Beverages',
  'paani': 'Beverages',
};

const getCategory = (itemName) => {
  const normalizedName = itemName.toLowerCase();
  return itemCategories[normalizedName] || 'Uncategorized';
};

const hindiToEnglish = {
    'doodh': 'milk',
    'ande': 'eggs',
    'paneer': 'cheese',
    'dahi': 'yogurt',
    'pav': 'bread',
    'seb': 'apples',
    'kele': 'bananas',
    'santre': 'oranges',
    'gajar': 'carrots',
    'aaloo chips': 'potato chips',
    'biscuits': 'cookies',
    'thandai': 'soda',
    'paani': 'water',
};

const normalizeItemName = (name) => {
  const lowerName = name.toLowerCase();
  return hindiToEnglish[lowerName] || lowerName;
};


export const useShoppingStore = create((set) => ({
  list: [],
  addToList: (item, quantity = 1) => set((state) => {
    const normalizedItem = normalizeItemName(item);
    const existingItem = state.list.find(listItem => listItem.name.toLowerCase() === normalizedItem);
    const category = getCategory(normalizedItem);

    if (existingItem) {
      return {
        list: state.list.map(listItem => 
          listItem.name.toLowerCase() === normalizedItem ? 
          { ...listItem, quantity: listItem.quantity + quantity } : listItem
        )
      };
    } else {
      return {
        list: [...state.list, { id: nanoid(), name: normalizedItem, quantity, category }]
      };
    }
  }),
  removeFromList: (itemName, quantityToRemove = 1) => set((state) => ({
    list: state.list
      .map(item => 
        item.name.toLowerCase() === itemName.toLowerCase() ? 
        { ...item, quantity: item.quantity - quantityToRemove } : item
      )
      .filter(item => item.quantity > 0)
  })),
}));