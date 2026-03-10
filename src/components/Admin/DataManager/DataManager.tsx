import React, { useState, useEffect } from "react";
import {
  PlayerSkill,
  SkillsDatabase,
  PassiveAbility,
  Mushroom,
} from "../../../types/PlayerSkill";
import ClassSelector from "../../ClassSelector/ClassSelector";
import SkillsTable from "../SkillsTable";
import PassivesTable from "../PassivesTable";
import MushroomsTable from "../MushroomsTable";
import { fetchAllSkillsData } from "../../../api/nriApi";
import "./DataManager.css";

interface DataManagerProps {
  authToken: string;
  onAuthExpired: () => void;
}

function DataManager({ authToken, onAuthExpired }: DataManagerProps) {
  const [skillsData, setSkillsData] = useState<SkillsDatabase>({});
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("skills");

  // Загрузка данных из JSON при загрузке
  useEffect(() => {
    const loadSkills = async () => {
      try {
        const data: SkillsDatabase = await fetchAllSkillsData();
        setSkillsData(data);
        setLoading(false);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Неизвестная ошибка при загрузке",
        );
        setLoading(false);
      }
    };

    loadSkills();
  }, []);

  const reloadData = async () => {
    try {
      setLoading(true);
      const data = await fetchAllSkillsData();
      setSkillsData(data);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Неизвестная ошибка при загрузке",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSelectClass = (className: string) => {
    setSelectedClass(className);
  };

  const classes = Object.keys(skillsData);

  const tabs = [
    { id: "skills", label: "Заклинания" },
    { id: "passives", label: "Пассивные способности" },
    { id: "mushrooms", label: "Грибы" },
  ];

  if (loading) {
    return <div className="loading">Загрузка данных...</div>;
  }

  if (error) {
    return <div className="error">Ошибка: {error}</div>;
  }

  return (
    <div className="data-manager">
      <div className="data-controls">
        <button onClick={reloadData} className="load-btn">
          🔄 Обновить данные с сервера
        </button>
      </div>

      <ClassSelector
        classes={classes}
        selectedClass={selectedClass}
        onSelectClass={handleSelectClass}
      />

      {selectedClass && (
        <>
          <div className="admin-tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`admin-tab ${activeTab === tab.id ? "active" : ""}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === "skills" && (
            <SkillsTable
              authToken={authToken}
              onAuthExpired={onAuthExpired}
              className={selectedClass}
              skills={skillsData[selectedClass]?.skills || []}
              onUpdate={(updatedSkills: PlayerSkill[]) => {
                const newData = {
                  ...skillsData,
                  [selectedClass]: {
                    ...skillsData[selectedClass],
                    skills: updatedSkills,
                  },
                };
                setSkillsData(newData);
              }}
            />
          )}

          {activeTab === "passives" && (
            <PassivesTable
              authToken={authToken}
              onAuthExpired={onAuthExpired}
              className={selectedClass}
              passives={skillsData[selectedClass]?.passives || []}
              onUpdate={(updatedPassives: PassiveAbility[]) => {
                const newData = {
                  ...skillsData,
                  [selectedClass]: {
                    ...skillsData[selectedClass],
                    passives: updatedPassives,
                  },
                };
                setSkillsData(newData);
              }}
            />
          )}

          {activeTab === "mushrooms" && (
            <MushroomsTable
              authToken={authToken}
              onAuthExpired={onAuthExpired}
              className={selectedClass}
              mushrooms={skillsData[selectedClass]?.mushrooms || []}
              onUpdate={(updatedMushrooms: Mushroom[]) => {
                const newData = {
                  ...skillsData,
                  [selectedClass]: {
                    ...skillsData[selectedClass],
                    mushrooms: updatedMushrooms,
                  },
                };
                setSkillsData(newData);
              }}
            />
          )}
        </>
      )}
    </div>
  );
}

export default DataManager;
