import React from "react";
import { PlayerSkill } from "../../../types/PlayerSkill";
import SkillCard from "../SkillCard/SkillCard";
import "./SkillsList.css";

interface SkillsListProps {
  skills: PlayerSkill[];
  onSelectSkill: (skill: PlayerSkill) => void;
}

const SkillsList: React.FC<SkillsListProps> = ({ skills, onSelectSkill }) => {
  const chosenSkills = skills.filter((s) => s.isChosen);

  if (chosenSkills.length === 0) {
    return <div className="skills-list empty">Нет выбранных заклинаний</div>;
  }

  return (
    <div className="skills-list-container">
      <div className="skills-header">
        <h2>Выбранные заклинания</h2>
      </div>
      <div className="skills-list">
        {chosenSkills.map((skill) => (
          <SkillCard
            key={skill.name}
            skill={skill}
            onSelectSkill={onSelectSkill}
          />
        ))}
      </div>
    </div>
  );
};

export default SkillsList;
