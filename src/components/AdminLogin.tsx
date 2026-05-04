import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function AdminLogin({ setIsAuthenticated }: { setIsAuthenticated: (val: boolean) => void }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (code === "Ricciardi2026!") {
      localStorage.setItem("adminAuthenticated", "true");
      setIsAuthenticated(true);
      navigate("/dashboard");
    } else {
      setError("❌ Codice non valido. Riprova.");
      setCode("");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-[#0066A1] to-[#004d7a] flex items-center justify-center">
      <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full">
        <h1 className="text-3xl font-black text-[#0066A1] mb-2 text-center">Admin Dashboard</h1>
        <p className="text-gray-600 text-center mb-6">Studio Ricciardi</p>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block font-bold mb-2 text-gray-800">Codice di Accesso:</label>
            <input
              type="password"
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                setError("");
              }}
              placeholder="Inserisci il codice"
              className="w-full border-2 border-gray-200 rounded-lg p-3 font-bold focus:border-[#0066A1] focus:outline-none"
              required
            />
          </div>

          {error && <p className="text-red-600 font-bold text-center">{error}</p>}

          <button
            type="submit"
            className="w-full bg-[#0066A1] text-white py-3 rounded-lg font-black text-lg hover:bg-[#004d7a] transition-all"
          >
            Accedi
          </button>
        </form>

        <p className="text-gray-500 text-center text-sm mt-6">
          Accesso riservato solo agli amministratori
        </p>
      </div>
    </div>
  );
}
