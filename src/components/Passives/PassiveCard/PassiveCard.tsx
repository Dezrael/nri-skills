import React from "react";
import { PassiveAbility } from "../../../types/PlayerSkill";
import "./PassiveCard.css";

interface PassiveCardProps {
  passive: PassiveAbility;
}

const PassiveCard: React.FC<PassiveCardProps> = ({ passive }) => {
  return (
    <div className="passive-card">
      <div className="passive-header">
        <h3 className="passive-name">{passive.name}</h3>
      </div>
      <p className="passive-text">{passive.text}</p>
    </div>
  );
};

export default PassiveCard;
