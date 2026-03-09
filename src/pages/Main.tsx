import React, { useState, useEffect } from "react";
import {
  PlayerSkill,
  SkillsDatabase,
  PassiveAbility,
  Mushroom,
} from "../types/PlayerSkill";
import ClassSelector from "../components/ClassSelector/ClassSelector";
import SkillsList from "../components/Skills/SkillsList/SkillsList";
import PassivesList from "../components/Passives/PassivesList/PassivesList";
import MushroomsList from "../components/Mushrooms/MushroomsList/MushroomsList";
import SkillModal from "../components/Skills/SkillModal/SkillModal";
import Tabs from "../components/Tabs/Tabs";
import "../App.css";

function Main() {
  const [skillsData, setSkillsData] = useState<SkillsDatabase>({});
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [skills, setSkills] = useState<PlayerSkill[]>([]);
  const [passives, setPassives] = useState<PassiveAbility[]>([]);
  const [mushrooms, setMushrooms] = useState<Mushroom[]>([]);
  const [activeTab, setActiveTab] = useState<string>("skills");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSkill, setSelectedSkill] = useState<PlayerSkill | null>(null);

  // Загрузка данных из JSON при загрузке приложения
  useEffect(() => {
    const loadSkills = async () => {
      try {
        const response = await fetch("https://nri-backend-two.vercel.app/NRI");
        if (!response.ok) {
          throw new Error("Не удалось загрузить данные заклинаний");
        }
        const data: SkillsDatabase = await response.json();
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

  // Загрузка заклинаний при выборе класса
  const handleSelectClass = (className: string) => {
    setSelectedClass(className);
    const classData = skillsData[className];
    if (classData) {
      setSkills(classData.skills || []);
      setPassives(classData.passives || []);
      setMushrooms(classData.mushrooms || []);
    } else {
      setSkills([]);
      setPassives([]);
      setMushrooms([]);
    }
  };

  const classes = Object.keys(skillsData);

  const baseTabs = [
    { id: "skills", label: "Заклинания" },
    { id: "passives", label: "Пассивные способности" },
  ];

  const tabs =
    selectedClass === "Грибомант"
      ? [...baseTabs, { id: "mushrooms", label: "Грибы" }]
      : baseTabs;

  return (
    <div className="App">
      <header className="App-header">
        <h1>⚔️ DND Skills Selector</h1>
        <p>Выберите класс и просмотрите выбранные заклинания</p>
      </header>

      <main className="App-main">
        {loading && <div className="loading">Загрузка данных...</div>}
        {error && <div className="error">Ошибка: {error}</div>}
        {!loading && !error && (
          <>
            <ClassSelector
              classes={classes}
              selectedClass={selectedClass}
              onSelectClass={handleSelectClass}
            />
            {selectedClass && (
              <>
                <Tabs
                  tabs={tabs}
                  activeTab={activeTab}
                  onTabChange={setActiveTab}
                />
                {activeTab === "skills" && (
                  <SkillsList
                    skills={skills}
                    onSelectSkill={setSelectedSkill}
                  />
                )}
                {activeTab === "passives" && (
                  <PassivesList passives={passives} />
                )}
                {activeTab === "mushrooms" && selectedClass === "Грибомант" && (
                  <MushroomsList mushrooms={mushrooms} />
                )}
              </>
            )}
          </>
        )}
      </main>

      <SkillModal
        skill={selectedSkill}
        isOpen={selectedSkill !== null}
        onClose={() => setSelectedSkill(null)}
      />
    </div>
  );
}

export default Main;
