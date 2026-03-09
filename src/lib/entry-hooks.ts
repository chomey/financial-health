"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { formatNumericInput } from "@/lib/format-input";

// ── ID Generation ────────────────────────────────────────────────────────────

/** Generate a unique ID with an optional prefix (e.g., "a", "d", "i") */
export function generateId(prefix = "x"): string {
  return `${prefix}${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

// ── Controlled Array Hook ────────────────────────────────────────────────────

/**
 * Manages a controlled/uncontrolled array of items with parent sync.
 * Avoids echo-back loops when parent passes back the same items we just sent.
 */
export function useControlledArray<T>(
  controlledItems: T[] | undefined,
  defaultItems: T[],
  onChange: ((items: T[]) => void) | undefined
): [T[], React.Dispatch<React.SetStateAction<T[]>>] {
  const [items, setItems] = useState<T[]>(controlledItems ?? defaultItems);
  const isExternalSync = useRef(false);
  const didMount = useRef(false);
  const syncDidMount = useRef(false);
  const lastSentToParent = useRef<T[] | null>(null);

  // Sync with parent if controlled
  useEffect(() => {
    if (!syncDidMount.current) {
      syncDidMount.current = true;
      return;
    }
    if (controlledItems !== undefined && controlledItems !== lastSentToParent.current) {
      isExternalSync.current = true;
      setItems(controlledItems);
    }
  }, [controlledItems]);

  // Notify parent of internal changes
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);
  useEffect(() => {
    if (!didMount.current) {
      didMount.current = true;
      return;
    }
    if (isExternalSync.current) {
      isExternalSync.current = false;
      return;
    }
    lastSentToParent.current = items;
    onChangeRef.current?.(items);
  }, [items]);

  return [items, setItems];
}

// ── Edit State Hook ──────────────────────────────────────────────────────────

export interface EditState<F extends string> {
  editingId: string | null;
  editingField: F | null;
  editValue: string;
  showSuggestions: boolean;
  inputRef: React.RefObject<HTMLInputElement | null>;
  startEdit: (id: string, field: F, currentValue: string) => void;
  clearEdit: () => void;
  setEditValue: (value: string) => void;
  setShowSuggestions: (show: boolean) => void;
  handleEditKeyDown: (e: React.KeyboardEvent) => void;
}

/**
 * Manages inline editing state for entry components.
 * @param textFields - field names that should NOT be formatted as numbers (e.g., "category", "ticker")
 */
export function useEditState<F extends string>(
  textFields: F[] = [] as F[]
): EditState<F> {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<F | null>(null);
  const [editValue, setEditValue] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingId, editingField]);

  const startEdit = useCallback(
    (id: string, field: F, currentValue: string) => {
      setEditingId(id);
      setEditingField(field);
      const isTextField = textFields.includes(field);
      setEditValue(isTextField ? currentValue : formatNumericInput(currentValue));
      if (isTextField) {
        setShowSuggestions(true);
      }
    },
    [textFields]
  );

  const clearEdit = useCallback(() => {
    setEditingId(null);
    setEditingField(null);
    setEditValue("");
    setShowSuggestions(false);
  }, []);

  const handleEditKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        (e.target as HTMLElement).blur();
      } else if (e.key === "Escape") {
        setEditingId(null);
        setEditingField(null);
        setShowSuggestions(false);
      }
    },
    []
  );

  return {
    editingId,
    editingField,
    editValue,
    showSuggestions,
    inputRef,
    startEdit,
    clearEdit,
    setEditValue,
    setShowSuggestions,
    handleEditKeyDown,
  };
}

// ── Add-New State Hook ───────────────────────────────────────────────────────

export interface AddNewState {
  addingNew: boolean;
  newCategory: string;
  newAmount: string;
  showNewSuggestions: boolean;
  newCategoryRef: React.RefObject<HTMLInputElement | null>;
  newAmountRef: React.RefObject<HTMLInputElement | null>;
  setAddingNew: (adding: boolean) => void;
  setNewCategory: (value: string) => void;
  setNewAmount: (value: string) => void;
  setShowNewSuggestions: (show: boolean) => void;
  resetNew: () => void;
  handleNewKeyDown: (e: React.KeyboardEvent, field: "category" | "amount", onAdd: () => void) => void;
}

export function useAddNew(): AddNewState {
  const [addingNew, setAddingNew] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [showNewSuggestions, setShowNewSuggestions] = useState(false);
  const newCategoryRef = useRef<HTMLInputElement>(null);
  const newAmountRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (addingNew && newCategoryRef.current) {
      newCategoryRef.current.focus();
    }
  }, [addingNew]);

  const resetNew = useCallback(() => {
    setAddingNew(false);
    setNewCategory("");
    setNewAmount("");
    setShowNewSuggestions(false);
  }, []);

  const handleNewKeyDown = useCallback(
    (e: React.KeyboardEvent, field: "category" | "amount", onAdd: () => void) => {
      if (e.key === "Enter") {
        if (field === "category" && newAmountRef.current) {
          newAmountRef.current.focus();
        } else {
          onAdd();
        }
      } else if (e.key === "Escape") {
        resetNew();
      }
    },
    [resetNew]
  );

  return {
    addingNew,
    newCategory,
    newAmount,
    showNewSuggestions,
    newCategoryRef,
    newAmountRef,
    setAddingNew,
    setNewCategory,
    setNewAmount,
    setShowNewSuggestions,
    resetNew,
    handleNewKeyDown,
  };
}
