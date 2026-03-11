import React, { useState, useEffect } from "react";
import { Mushroom } from "../../../types/PlayerSkill";
import MushroomCard from "../MushroomCard/MushroomCard";
import "./MushroomsList.css";

interface MushroomsListProps {
  mushrooms: Mushroom[];
  className: string;
}

const MushroomsList: React.FC<MushroomsListProps> = ({
  mushrooms,
  className,
}) => {
  const [pinnedIds, setPinnedIds] = useState<Set<number>>(() => {
    const stored = localStorage.getItem(`pinned-mushrooms-${className}`);
    return stored ? new Set(JSON.parse(stored)) : new Set();
  });

  useEffect(() => {
    const stored = localStorage.getItem(`pinned-mushrooms-${className}`);
    setPinnedIds(stored ? new Set(JSON.parse(stored)) : new Set());
  }, [className]);

  const handleTogglePin = (mushroomId: number | undefined) => {
    if (mushroomId === undefined) return;
    const newPinned = new Set(pinnedIds);
    if (newPinned.has(mushroomId)) {
      newPinned.delete(mushroomId);
    } else {
      newPinned.add(mushroomId);
    }
    setPinnedIds(newPinned);
    localStorage.setItem(
      `pinned-mushrooms-${className}`,
      JSON.stringify(Array.from(newPinned)),
    );
  };

  const sorted = [...mushrooms].sort((a, b) => {
    const aPinned = a.id ? pinnedIds.has(a.id) : false;
    const bPinned = b.id ? pinnedIds.has(b.id) : false;
    if (aPinned && !bPinned) return -1;
    if (!aPinned && bPinned) return 1;
    return 0;
  });

  if (mushrooms.length === 0) {
    return <div className="mushrooms-list empty">Нет грибов</div>;
  }

  return (
    <div className="mushrooms-list-container">
      <div className="mushrooms-header">
        <h2>Грибы</h2>
      </div>
      <div className="mushrooms-list">
        {sorted.map((mushroom) => (
          <MushroomCard
            key={mushroom.name}
            mushroom={mushroom}
            isPinned={mushroom.id ? pinnedIds.has(mushroom.id) : false}
            onTogglePin={handleTogglePin}
          />
        ))}
      </div>
    </div>
  );
};

export default MushroomsList;
