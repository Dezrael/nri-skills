import React, { useState } from "react";
import DataManager from "../components/Admin/DataManager/DataManager";
import { loginAdmin } from "../api/nriApi";
import "./Admin.css";

const ADMIN_TOKEN_KEY = "adminAuthToken";

function Admin() {
  const [password, setPassword] = useState("");
  const [token, setToken] = useState<string | null>(
    localStorage.getItem(ADMIN_TOKEN_KEY),
  );
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError("Введите пароль");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      const { token: authToken } = await loginAdmin(password);
      localStorage.setItem(ADMIN_TOKEN_KEY, authToken);
      setToken(authToken);
      setPassword("");
    } catch (err) {
      setError(
        err instanceof Error
          ? `Ошибка авторизации: ${err.message}`
          : "Ошибка авторизации",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    setToken(null);
    setError(null);
  };

  const handleAuthExpired = () => {
    handleLogout();
    setError("Сессия истекла. Войдите снова.");
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>⚙️ Admin Panel</h1>
        <p>Управление данными игры DND</p>
      </header>

      <main className="App-main">
        {!token ? (
          <div className="admin-auth-card">
            <h2>Вход администратора</h2>
            <p>Для редактирования данных введите пароль администратора.</p>

            <form className="admin-auth-form" onSubmit={handleLogin}>
              <label htmlFor="admin-password">Пароль</label>
              <input
                id="admin-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                placeholder="Введите пароль"
              />

              {error && <div className="error">{error}</div>}

              <button
                type="submit"
                className="admin-login-btn"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Вход..." : "Войти"}
              </button>
            </form>
          </div>
        ) : (
          <>
            <div className="admin-session-bar">
              <span>Вы авторизованы как администратор</span>
              <button onClick={handleLogout} className="admin-logout-btn">
                Выйти
              </button>
            </div>
            <DataManager authToken={token} onAuthExpired={handleAuthExpired} />
          </>
        )}
      </main>
    </div>
  );
}

export default Admin;
