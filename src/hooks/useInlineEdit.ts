"use client";

import { useState, useEffect, useRef } from "react";

/**
 * Shared inline-edit state management hook.
 *
 * Tracks which item/field is being edited and the current edit value.
 * Provides `startEdit`, `commitEdit`, and `handleEditKeyDown` helpers.
 *
 * The caller is responsible for supplying a `onCommit` callback that
 * applies the edit to the underlying data.
 *
 * @param inputRef - ref to the edit <input> element (for auto-focus / select)
 * @param onCommit - called with (id, field, value) when the user confirms the edit
 */
export function useInlineEdit<TField extends string>(
  inputRef: React.RefObject<HTMLInputElement | null>,
  onCommit: (id: string, field: TField, value: string) => void
) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<TField | null>(null);
  const [editValue, setEditValue] = useState("");

  // Auto-focus and select text when editing starts
  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingId, editingField, inputRef]);

  const startEdit = (id: string, field: TField, currentValue: string) => {
    setEditingId(id);
    setEditingField(field);
    setEditValue(currentValue);
  };

  const commitEdit = (overrideValue?: string) => {
    const value = overrideValue ?? editValue;
    if (editingId && editingField) {
      onCommit(editingId, editingField, value);
    }
    setEditingId(null);
    setEditingField(null);
    setEditValue("");
  };

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      (e.target as HTMLElement).blur();
    } else if (e.key === "Escape") {
      setEditingId(null);
      setEditingField(null);
    }
  };

  return {
    editingId,
    editingField,
    editValue,
    setEditValue,
    startEdit,
    commitEdit,
    handleEditKeyDown,
  };
}

/**
 * Simpler version that manages just the inline-edit state without a commit callback.
 * Useful when the commit logic is complex and best kept inline.
 */
export function useInlineEditState<TField extends string>(
  inputRef: React.RefObject<HTMLInputElement | null>
) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<TField | null>(null);
  const [editValue, setEditValue] = useState("");
  // Store extra per-field state (e.g., showSuggestions)
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Auto-focus and select text when editing starts
  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingId, editingField, inputRef]);

  const startEdit = (id: string, field: TField, currentValue: string, withSuggestions = false) => {
    setEditingId(id);
    setEditingField(field);
    setEditValue(currentValue);
    if (withSuggestions) {
      setShowSuggestions(true);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingField(null);
    setShowSuggestions(false);
  };

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      (e.target as HTMLElement).blur();
    } else if (e.key === "Escape") {
      cancelEdit();
    }
  };

  return {
    editingId,
    editingField,
    editValue,
    setEditValue,
    showSuggestions,
    setShowSuggestions,
    startEdit,
    cancelEdit,
    handleEditKeyDown,
    setEditingId,
    setEditingField,
  };
}

/**
 * Convenience ref creator for the inline edit input.
 * Usage: const inputRef = useInlineEditRef();
 */
export function useInlineEditRef() {
  return useRef<HTMLInputElement>(null);
}
