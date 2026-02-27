"use client";

import { useState, useRef, useEffect } from "react";

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
}

const MOCK_GOALS: Goal[] = [
  { id: "1", name: "Rainy Day Fund", targetAmount: 20000, currentAmount: 14500 },
  { id: "2", name: "New Car", targetAmount: 42000, currentAmount: 13500 },
  { id: "3", name: "Vacation", targetAmount: 6500, currentAmount: 6200 },
];

let nextId = 100;
function generateId(): string {
  return String(++nextId);
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function parseCurrencyInput(value: string): number {
  const cleaned = value.replace(/[^0-9.-]/g, "");
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

function getProgressPercent(current: number, target: number): number {
  if (target <= 0) return 0;
  return Math.min(100, Math.round((current / target) * 100));
}

function getProgressColor(percent: number): string {
  if (percent >= 100) return "bg-green-500";
  if (percent >= 75) return "bg-emerald-500";
  if (percent >= 50) return "bg-teal-500";
  if (percent >= 25) return "bg-blue-500";
  return "bg-amber-500";
}

interface GoalEntryProps {
  items?: Goal[];
  onChange?: (items: Goal[]) => void;
}

export default function GoalEntry({ items, onChange }: GoalEntryProps = {}) {
  const [goals, setGoalsInternal] = useState<Goal[]>(items ?? MOCK_GOALS);

  // Sync with parent if controlled — intentional external-system sync
  useEffect(() => {
    if (items !== undefined) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setGoalsInternal(items);
    }
  }, [items]);

  const setGoals = (updater: Goal[] | ((prev: Goal[]) => Goal[])) => {
    setGoalsInternal((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      onChange?.(next);
      return next;
    });
  };
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<
    "name" | "targetAmount" | "currentAmount" | null
  >(null);
  const [editValue, setEditValue] = useState("");
  const [addingNew, setAddingNew] = useState(false);
  const [newName, setNewName] = useState("");
  const [newTarget, setNewTarget] = useState("");
  const [newCurrent, setNewCurrent] = useState("");
  const [hoveredGoalId, setHoveredGoalId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const newNameRef = useRef<HTMLInputElement>(null);
  const newTargetRef = useRef<HTMLInputElement>(null);
  const newCurrentRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (addingNew && newNameRef.current) {
      newNameRef.current.focus();
    }
  }, [addingNew]);

  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingId, editingField]);

  const startEdit = (
    id: string,
    field: "name" | "targetAmount" | "currentAmount",
    currentValue: string
  ) => {
    setEditingId(id);
    setEditingField(field);
    setEditValue(currentValue);
  };

  const commitEdit = () => {
    if (editingId && editingField) {
      setGoals((prev) =>
        prev.map((g) => {
          if (g.id !== editingId) return g;
          if (editingField === "name") {
            return { ...g, name: editValue || g.name };
          }
          if (editingField === "targetAmount") {
            return { ...g, targetAmount: parseCurrencyInput(editValue) };
          }
          return { ...g, currentAmount: parseCurrencyInput(editValue) };
        })
      );
    }
    setEditingId(null);
    setEditingField(null);
    setEditValue("");
  };

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      commitEdit();
    } else if (e.key === "Escape") {
      setEditingId(null);
      setEditingField(null);
    }
  };

  const deleteGoal = (id: string) => {
    setGoals((prev) => prev.filter((g) => g.id !== id));
  };

  const addGoal = () => {
    if (!newName.trim()) return;
    const target = parseCurrencyInput(newTarget);
    const current = parseCurrencyInput(newCurrent);
    setGoals((prev) => [
      ...prev,
      { id: generateId(), name: newName.trim(), targetAmount: target, currentAmount: current },
    ]);
    setNewName("");
    setNewTarget("");
    setNewCurrent("");
    setAddingNew(false);
  };

  const handleNewKeyDown = (
    e: React.KeyboardEvent,
    field: "name" | "target" | "current"
  ) => {
    if (e.key === "Enter") {
      if (field === "name" && newTargetRef.current) {
        newTargetRef.current.focus();
      } else if (field === "target" && newCurrentRef.current) {
        newCurrentRef.current.focus();
      } else {
        addGoal();
      }
    } else if (e.key === "Escape") {
      setAddingNew(false);
      setNewName("");
      setNewTarget("");
      setNewCurrent("");
    }
  };

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
      <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-stone-800">
        <span aria-hidden="true">🎯</span>
        Goals
      </h2>

      {goals.length === 0 && !addingNew ? (
        <p className="text-sm text-stone-400">
          Set financial goals to track your progress toward what matters most.
        </p>
      ) : (
        <div className="space-y-3" role="list" aria-label="Goal items">
          {goals.map((goal) => {
            const percent = getProgressPercent(goal.currentAmount, goal.targetAmount);
            const isComplete = percent >= 100;
            const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);

            return (
              <div
                key={goal.id}
                role="listitem"
                className="group relative rounded-lg px-3 py-3 transition-colors duration-150 hover:bg-stone-50"
                onMouseEnter={() => setHoveredGoalId(goal.id)}
                onMouseLeave={() => setHoveredGoalId(null)}
              >
                {/* Goal name and delete */}
                <div className="flex items-center justify-between mb-1">
                  <div className="flex-1 min-w-0">
                    {editingId === goal.id && editingField === "name" ? (
                      <input
                        ref={inputRef}
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={commitEdit}
                        onKeyDown={handleEditKeyDown}
                        className="w-full rounded-md border border-blue-300 bg-white px-2 py-1 text-sm font-medium text-stone-800 outline-none ring-2 ring-blue-100 transition-all duration-200"
                        aria-label="Edit goal name"
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => startEdit(goal.id, "name", goal.name)}
                        className="truncate text-left text-sm font-medium text-stone-700 rounded px-2 py-1 transition-colors duration-150 hover:bg-stone-100 hover:text-stone-900 focus:outline-none focus:ring-2 focus:ring-blue-200"
                        aria-label={`Edit name for ${goal.name}`}
                      >
                        {goal.name}
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => deleteGoal(goal.id)}
                    className="ml-2 rounded-md p-1 text-stone-300 opacity-0 transition-all duration-150 hover:bg-rose-50 hover:text-rose-500 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-rose-200 group-hover:opacity-100"
                    aria-label={`Delete ${goal.name}`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>

                {/* Amounts row */}
                <div className="flex items-center gap-2 text-xs text-stone-500 mb-2 px-2">
                  {editingId === goal.id && editingField === "currentAmount" ? (
                    <input
                      ref={inputRef}
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={commitEdit}
                      onKeyDown={handleEditKeyDown}
                      className="w-24 rounded-md border border-blue-300 bg-white px-2 py-0.5 text-xs text-stone-800 outline-none ring-2 ring-blue-100 transition-all duration-200"
                      aria-label={`Edit saved amount for ${goal.name}`}
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        startEdit(goal.id, "currentAmount", String(goal.currentAmount))
                      }
                      className="rounded px-1 py-0.5 text-xs font-medium text-green-700 transition-colors duration-150 hover:bg-green-50 hover:text-green-800 focus:outline-none focus:ring-2 focus:ring-green-200"
                      aria-label={`Edit saved amount for ${goal.name}, currently ${formatCurrency(goal.currentAmount)}`}
                    >
                      {formatCurrency(goal.currentAmount)}
                    </button>
                  )}
                  <span className="text-stone-400">of</span>
                  {editingId === goal.id && editingField === "targetAmount" ? (
                    <input
                      ref={inputRef}
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={commitEdit}
                      onKeyDown={handleEditKeyDown}
                      className="w-24 rounded-md border border-blue-300 bg-white px-2 py-0.5 text-xs text-stone-800 outline-none ring-2 ring-blue-100 transition-all duration-200"
                      aria-label={`Edit target amount for ${goal.name}`}
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        startEdit(goal.id, "targetAmount", String(goal.targetAmount))
                      }
                      className="rounded px-1 py-0.5 text-xs font-medium text-stone-600 transition-colors duration-150 hover:bg-stone-100 hover:text-stone-800 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      aria-label={`Edit target amount for ${goal.name}, currently ${formatCurrency(goal.targetAmount)}`}
                    >
                      {formatCurrency(goal.targetAmount)}
                    </button>
                  )}
                </div>

                {/* Progress bar */}
                <div className="px-2">
                  <div
                    className={`h-2.5 w-full rounded-full bg-stone-100 overflow-hidden ${
                      isComplete ? "ring-2 ring-amber-300 ring-offset-1 shadow-[0_0_8px_rgba(251,191,36,0.4)]" : ""
                    }`}
                    role="progressbar"
                    aria-valuenow={percent}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${goal.name} progress: ${percent}%`}
                  >
                    <div
                      className={`h-full rounded-full transition-all duration-700 ease-out ${getProgressColor(percent)} ${
                        isComplete ? "animate-pulse" : ""
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>

                {/* Tooltip on hover */}
                {hoveredGoalId === goal.id && (
                  <div className="mt-1.5 px-2 text-xs text-stone-500 transition-opacity duration-200">
                    {isComplete ? (
                      <span className="font-medium text-green-600">
                        Goal reached! 🎉
                      </span>
                    ) : (
                      <span>
                        {percent}% complete — {formatCurrency(remaining)} remaining
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add new goal row */}
      {addingNew && (
        <div className="mt-2 rounded-lg border border-dashed border-blue-200 bg-blue-50/50 px-3 py-3 animate-in">
          <div className="space-y-2">
            <input
              ref={newNameRef}
              type="text"
              placeholder="Goal name..."
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => handleNewKeyDown(e, "name")}
              className="w-full rounded-md border border-blue-300 bg-white px-2 py-1 text-sm text-stone-800 outline-none ring-2 ring-blue-100 transition-all duration-200"
              aria-label="New goal name"
            />
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <label className="text-xs text-stone-500 mb-0.5 block">Target</label>
                <input
                  ref={newTargetRef}
                  type="text"
                  placeholder="$0"
                  value={newTarget}
                  onChange={(e) => setNewTarget(e.target.value)}
                  onKeyDown={(e) => handleNewKeyDown(e, "target")}
                  className="w-full rounded-md border border-blue-300 bg-white px-2 py-1 text-sm text-stone-800 outline-none ring-2 ring-blue-100 transition-all duration-200"
                  aria-label="New goal target amount"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs text-stone-500 mb-0.5 block">Saved so far</label>
                <input
                  ref={newCurrentRef}
                  type="text"
                  placeholder="$0"
                  value={newCurrent}
                  onChange={(e) => setNewCurrent(e.target.value)}
                  onKeyDown={(e) => handleNewKeyDown(e, "current")}
                  className="w-full rounded-md border border-blue-300 bg-white px-2 py-1 text-sm text-stone-800 outline-none ring-2 ring-blue-100 transition-all duration-200"
                  aria-label="New goal current amount"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setAddingNew(false);
                  setNewName("");
                  setNewTarget("");
                  setNewCurrent("");
                }}
                className="rounded-md px-3 py-1 text-sm text-stone-500 transition-colors duration-150 hover:bg-stone-100 hover:text-stone-700 focus:outline-none focus:ring-2 focus:ring-stone-200"
                aria-label="Cancel adding goal"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={addGoal}
                className="rounded-md bg-green-600 px-3 py-1 text-sm font-medium text-white transition-colors duration-150 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-300"
                aria-label="Confirm add goal"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add button */}
      <div className="mt-4 flex items-center justify-end border-t border-stone-100 pt-3">
        {!addingNew && (
          <button
            type="button"
            onClick={() => setAddingNew(true)}
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-blue-600 transition-all duration-150 hover:bg-blue-50 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-200 active:bg-blue-100"
          >
            + Add Goal
          </button>
        )}
      </div>
    </div>
  );
}
