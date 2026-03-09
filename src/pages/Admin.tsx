import React from "react";
import DataManager from "../components/Admin/DataManager/DataManager";

function Admin() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>⚙️ Admin Panel</h1>
        <p>Управление данными игры DND</p>
      </header>

      <main className="App-main">
        <DataManager />
      </main>
    </div>
  );
}

export default Admin;
