import React from "react";
import { Mushroom } from "../../../types/PlayerSkill";
import MushroomCard from "../MushroomCard/MushroomCard";
import "./MushroomsList.css";

interface MushroomsListProps {
  mushrooms: Mushroom[];
}

const MushroomsList: React.FC<MushroomsListProps> = ({ mushrooms }) => {
  if (mushrooms.length === 0) {
    return <div className="mushrooms-list empty">Нет грибов</div>;
  }

  return (
    <div className="mushrooms-list-container">
      <div className="mushrooms-header">
        <h2>Грибы</h2>
      </div>
      <div className="mushrooms-list">
        {mushrooms.map((mushroom) => (
          <MushroomCard key={mushroom.name} mushroom={mushroom} />
        ))}
      </div>
    </div>
  );
};

export default MushroomsList;
