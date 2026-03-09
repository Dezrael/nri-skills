import React from "react";
import { Mushroom } from "../../../types/PlayerSkill";
import "./MushroomCard.css";

interface MushroomCardProps {
  mushroom: Mushroom;
}

const MushroomCard: React.FC<MushroomCardProps> = ({ mushroom }) => {
  return (
    <div className="mushroom-card">
      <div className="mushroom-header">
        <h3 className="mushroom-name">{mushroom.name}</h3>
      </div>
      <div className="mushroom-content">
        <div className="mushroom-section">
          <h4>Базовый эффект:</h4>
          <p>{mushroom.baseEffect}</p>
        </div>
        <div className="mushroom-section">
          <h4>Эффект активации:</h4>
          <p>{mushroom.activationEffect}</p>
        </div>
        <div className="mushroom-section">
          <h4>Эффект призыва:</h4>
          <p>{mushroom.summonEffect}</p>
        </div>
        <div className="mushroom-section">
          <h4>Эффект аспекта:</h4>
          <p>{mushroom.aspectEffect}</p>
        </div>
      </div>
    </div>
  );
};

export default MushroomCard;
