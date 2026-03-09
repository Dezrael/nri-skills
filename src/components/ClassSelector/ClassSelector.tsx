import React from "react";
import "./ClassSelector.css";

interface ClassSelectorProps {
  classes: string[];
  selectedClass: string | null;
  onSelectClass: (className: string) => void;
}

const ClassSelector: React.FC<ClassSelectorProps> = ({
  classes,
  selectedClass,
  onSelectClass,
}) => {
  return (
    <div className="class-selector">
      <h2>Выберите класс</h2>
      <div className="class-buttons">
        {classes.map((className) => (
          <button
            key={className}
            className={`class-button ${
              selectedClass === className ? "active" : ""
            }`}
            onClick={() => onSelectClass(className)}
          >
            {className}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ClassSelector;
