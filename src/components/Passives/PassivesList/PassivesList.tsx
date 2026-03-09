import React from "react";
import { PassiveAbility } from "../../../types/PlayerSkill";
import PassiveCard from "../PassiveCard/PassiveCard";
import "./PassivesList.css";

interface PassivesListProps {
  passives: PassiveAbility[];
}

const PassivesList: React.FC<PassivesListProps> = ({ passives }) => {
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
        {passives.map((passive) => (
          <PassiveCard key={passive.name} passive={passive} />
        ))}
      </div>
    </div>
  );
};

export default PassivesList;
