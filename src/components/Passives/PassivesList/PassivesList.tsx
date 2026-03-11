import React, { useState, useEffect } from "react";
import { PassiveAbility } from "../../../types/PlayerSkill";
import PassiveCard from "../PassiveCard/PassiveCard";
import "./PassivesList.css";

interface PassivesListProps {
  passives: PassiveAbility[];
  className: string;
  searchQuery?: string;
}

const PassivesList: React.FC<PassivesListProps> = ({
  passives,
  className,
  searchQuery = "",
}) => {
  const [pinnedIds, setPinnedIds] = useState<Set<number>>(() => {
    const stored = localStorage.getItem(`pinned-passives-${className}`);
    return stored ? new Set(JSON.parse(stored)) : new Set();
  });

  useEffect(() => {
    const stored = localStorage.getItem(`pinned-passives-${className}`);
    setPinnedIds(stored ? new Set(JSON.parse(stored)) : new Set());
  }, [className]);

  const handleTogglePin = (passiveId: number | undefined) => {
    if (passiveId === undefined) return;
    const newPinned = new Set(pinnedIds);
    if (newPinned.has(passiveId)) {
      newPinned.delete(passiveId);
    } else {
      newPinned.add(passiveId);
    }
    setPinnedIds(newPinned);
    localStorage.setItem(
      `pinned-passives-${className}`,
      JSON.stringify(Array.from(newPinned)),
    );
  };

  const filtered = searchQuery.trim()
    ? passives.filter((p) => {
        const q = searchQuery.trim().toLowerCase();
        return [p.name, p.text].some((f) => f?.toLowerCase().includes(q));
      })
    : passives;

  const sorted = [...filtered].sort((a, b) => {
    const aPinned = a.id ? pinnedIds.has(a.id) : false;
    const bPinned = b.id ? pinnedIds.has(b.id) : false;
    if (aPinned && !bPinned) return -1;
    if (!aPinned && bPinned) return 1;
    return 0;
  });

  if (passives.length === 0) {
    return (
      <div className="passives-list empty">Нет пассивных способностей</div>
    );
  }

  return (
    <div className="passives-list-container">
      <div className="passives-header">
        <h2>Пассивные способности</h2>
      </div>
      <div className="passives-list">
        {sorted.length === 0 ? (
          <div className="passives-list empty">Ничего не найдено</div>
        ) : (
          sorted.map((passive) => (
            <PassiveCard
              key={passive.name}
              passive={passive}
              isPinned={passive.id ? pinnedIds.has(passive.id) : false}
              onTogglePin={handleTogglePin}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default PassivesList;
