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
import { fetchAllSkillsData } from "../api/nriApi";
import "../App.css";

const SELECTED_CLASS_STORAGE_KEY = "selected-class";

function Main() {
  const [skillsData, setSkillsData] = useState<SkillsDatabase>({});
  const [selectedClass, setSelectedClass] = useState<string | null>(() =>
    localStorage.getItem(SELECTED_CLASS_STORAGE_KEY),
  );
  const [skills, setSkills] = useState<PlayerSkill[]>([]);
  const [passives, setPassives] = useState<PassiveAbility[]>([]);
  const [mushrooms, setMushrooms] = useState<Mushroom[]>([]);
  const [activeTab, setActiveTab] = useState<string>("skills");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSkill, setSelectedSkill] = useState<PlayerSkill | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInDescription, setSearchInDescription] = useState(false);
  const [visibleSkillsCount, setVisibleSkillsCount] = useState<number | null>(
    null,
  );

  // Загрузка данных из JSON при загрузке приложения
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

  useEffect(() => {
    if (!selectedClass) {
      setSkills([]);
      setPassives([]);
      setMushrooms([]);
      return;
    }

    if (loading) {
      return;
    }

    const classData = skillsData[selectedClass];

    if (!classData) {
      setSelectedClass(null);
      localStorage.removeItem(SELECTED_CLASS_STORAGE_KEY);
      setSkills([]);
      setPassives([]);
      setMushrooms([]);
      if (activeTab === "mushrooms") {
        setActiveTab("skills");
      }
      return;
    }

    setSkills(classData.skills || []);
    setPassives(classData.passives || []);
    setMushrooms(classData.mushrooms || []);

    const hasMushrooms = (classData.mushrooms?.length || 0) > 0;
    if (!hasMushrooms && activeTab === "mushrooms") {
      setActiveTab("skills");
    }
  }, [activeTab, loading, selectedClass, skillsData]);

  const handleSelectClass = (className: string) => {
    setSelectedClass(className);
    localStorage.setItem(SELECTED_CLASS_STORAGE_KEY, className);
    setSearchQuery("");
    setSearchInDescription(false);
    setVisibleSkillsCount(null);
  };

  const classes = Object.keys(skillsData);

  const normalizedSearchQuery = searchQuery.trim().toLowerCase();

  const searchedSkillsCount = skills
    .filter((skill) => skill.isChosen)
    .filter((skill) => {
      if (!normalizedSearchQuery) {
        return true;
      }

      return [
        skill.name,
        skill.shortDescription,
        ...(searchInDescription ? [skill.description] : []),
        skill.actionType,
        skill.range,
        skill.stat,
        skill.durationInCombat,
        skill.durationOutOfCombat,
        skill.damage,
        skill.savingThrow,
        skill.inCombatCooldown,
        skill.outCombatCooldown,
        skill.outCombatCharges,
        skill.cooldownType,
      ].some((field) => field?.toLowerCase().includes(normalizedSearchQuery));
    }).length;

  const searchedPassivesCount = passives
    .filter((passive) => passive.isChosen)
    .filter((passive) => {
      if (!normalizedSearchQuery) {
        return true;
      }

      return [passive.name, passive.text].some((field) =>
        field?.toLowerCase().includes(normalizedSearchQuery),
      );
    }).length;

  const searchedMushroomsCount = mushrooms
    .filter((mushroom) => mushroom.isChosen)
    .filter((mushroom) => {
      if (!normalizedSearchQuery) {
        return true;
      }

      return [
        mushroom.name,
        mushroom.baseEffect,
        mushroom.activationEffect,
        mushroom.summonEffect,
        mushroom.aspectEffect,
      ].some((field) => field?.toLowerCase().includes(normalizedSearchQuery));
    }).length;

  const skillsTabCount =
    activeTab === "skills" && visibleSkillsCount !== null
      ? visibleSkillsCount
      : searchedSkillsCount;

  const baseTabs = [
    { id: "skills", label: `Заклинания (${skillsTabCount})` },
    {
      id: "passives",
      label: `Пассивные способности (${searchedPassivesCount})`,
    },
  ];

  const hasMushroomsForSelectedClass =
    !!selectedClass && (skillsData[selectedClass]?.mushrooms?.length || 0) > 0;

  const tabs = hasMushroomsForSelectedClass
    ? [
        ...baseTabs,
        { id: "mushrooms", label: `Грибы (${searchedMushroomsCount})` },
      ]
    : baseTabs;

  return (
    <div className="App">
      <header className="App-header">
        <h1>
          <span
            className="material-symbols-rounded title-icon"
            aria-hidden="true"
          >
            swords
          </span>
          НРИ на коленке
        </h1>
        <p>Выбор класса и просмотр заклинаний</p>
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
                <div className="search-bar">
                  <span
                    className="material-symbols-rounded search-icon"
                    aria-hidden="true"
                  >
                    search
                  </span>
                  {activeTab === "skills" && (
                    <button
                      type="button"
                      className={`search-mode-btn ${
                        searchInDescription ? "active" : ""
                      }`}
                      onClick={() => setSearchInDescription((prev) => !prev)}
                      aria-pressed={searchInDescription}
                      aria-label={
                        searchInDescription
                          ? "Выключить поиск по полному описанию"
                          : "Включить поиск по полному описанию"
                      }
                      title={
                        searchInDescription
                          ? "Поиск по полному описанию включён"
                          : "Искать в полном описании"
                      }
                    >
                      <span
                        className="material-symbols-rounded"
                        aria-hidden="true"
                      >
                        article
                      </span>
                    </button>
                  )}
                  <input
                    type="text"
                    className="search-input"
                    placeholder="Поиск..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    aria-label="Поиск"
                  />
                  <button
                    type="button"
                    className="search-clear-btn"
                    onClick={() => setSearchQuery("")}
                    aria-label="Очистить поиск"
                    style={{ visibility: searchQuery ? "visible" : "hidden" }}
                  >
                    <span
                      className="material-symbols-rounded"
                      aria-hidden="true"
                    >
                      close
                    </span>
                  </button>
                </div>
                {activeTab === "skills" && (
                  <SkillsList
                    skills={skills}
                    className={selectedClass || ""}
                    onSelectSkill={setSelectedSkill}
                    searchQuery={searchQuery}
                    searchInDescription={searchInDescription}
                    onVisibleCountChange={setVisibleSkillsCount}
                  />
                )}
                {activeTab === "passives" && (
                  <PassivesList
                    passives={passives}
                    className={selectedClass || ""}
                    searchQuery={searchQuery}
                  />
                )}
                {activeTab === "mushrooms" && hasMushroomsForSelectedClass && (
                  <MushroomsList
                    mushrooms={mushrooms}
                    className={selectedClass || ""}
                    searchQuery={searchQuery}
                  />
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
