{activeTab === "questions" && (
  <div className="max-w-4xl">
    <div className="flex justify-between items-center mb-4">
      <h2 className="text-xl font-bold">Domande</h2>
      <button onClick={() => {
        const newQ = { text: "Nuova Domanda", type: "single", options: ["Opzione 1", "Opzione 2"], cascata: null };
        firebaseService.addQuestion(newQ).then(() => loadData());
      }} className="bg-[#0066A1] text-white px-4 py-2 rounded text-sm font-bold">+ Nuova</button>
    </div>

    {questions.map((q) => (
      <details key={q.id} className="border rounded-lg mb-3">
        <summary className="p-4 cursor-pointer bg-gray-50 font-bold hover:bg-gray-100">
          {q.text} <span className="text-xs text-gray-500 ml-2">({q.type})</span>
        </summary>

        <div className="p-4 border-t space-y-4">
          {/* Testo Domanda */}
          <div>
            <label className="block text-sm font-bold mb-1">Domanda</label>
            <input
              value={q.text}
              onChange={(e) => {
                const updated = {...q, text: e.target.value};
                firebaseService.updateQuestion(q.id, updated);
              }}
              className="w-full border p-2 rounded text-sm"
            />
          </div>

          {/* Tipo Domanda */}
          <div>
            <label className="block text-sm font-bold mb-1">Tipo</label>
            <select
              value={q.type}
              onChange={(e) => {
                const updated = {...q, type: e.target.value};
                firebaseService.updateQuestion(q.id, updated);
              }}
              className="w-full border p-2 rounded text-sm"
            >
              <option value="single">Scelta Singola</option>
              <option value="multiple">Scelta Multipla</option>
              <option value="text">Risposta Aperta</option>
            </select>
          </div>

          {/* Opzioni (solo se non è testo aperto) */}
          {q.type !== "text" && (
            <div>
              <label className="block text-sm font-bold mb-2">Opzioni</label>
              <div className="space-y-2">
                {(q.options || []).map((opt, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input
                      value={opt}
                      onChange={(e) => {
                        const newOptions = [...q.options];
                        newOptions[idx] = e.target.value;
                        const updated = {...q, options: newOptions};
                        firebaseService.updateQuestion(q.id, updated);
                      }}
                      className="flex-1 border p-2 rounded text-sm"
                      placeholder="Opzione"
                    />
                    <button
                      onClick={() => {
                        const newOptions = q.options.filter((_, i) => i !== idx);
                        const updated = {...q, options: newOptions};
                        firebaseService.updateQuestion(q.id, updated);
                      }}
                      className="text-red-600 text-sm px-3 py-1"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={() => {
                  const newOptions = [...(q.options || []), "Nuova opzione"];
                  const updated = {...q, options: newOptions};
                  firebaseService.updateQuestion(q.id, updated);
                }}
                className="mt-2 text-sm text-[#0066A1] font-bold"
              >
                + Aggiungi Opzione
              </button>
            </div>
          )}

          {/* Cascata */}
          <div>
            <label className="block text-sm font-bold mb-1">Cascata (mostra questa domanda se...)</label>
            <div className="flex gap-2 text-sm">
              <select defaultValue={q.cascata?.domanda_id || ""} onChange={(e) => {
                const cascata = e.target.value ? {...(q.cascata || {}), domanda_id: e.target.value} : null;
                const updated = {...q, cascata};
                firebaseService.updateQuestion(q.id, updated);
              }} className="flex-1 border p-2 rounded">
                <option value="">Nessuna cascata</option>
                {questions.filter(qf => qf.id !== q.id).map(qf => (
                  <option key={qf.id} value={qf.id}>{qf.text}</option>
                ))}
              </select>
              {q.cascata && (
                <select defaultValue={q.cascata?.risposta || ""} onChange={(e) => {
                  const cascata = {...q.cascata, risposta: e.target.value};
                  const updated = {...q, cascata};
                  firebaseService.updateQuestion(q.id, updated);
                }} className="flex-1 border p-2 rounded">
                  <option value="">Scegli risposta</option>
                  {questions.find(qf => qf.id === q.cascata?.domanda_id)?.options?.map((opt, idx) => (
                    <option key={idx} value={opt}>{opt}</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Elimina */}
          <button
            onClick={() => {
              if (confirm("Eliminare?")) {
                firebaseService.deleteQuestion(q.id).then(() => loadData());
              }
            }}
            className="w-full bg-red-600 text-white py-2 rounded text-sm font-bold"
          >
            🗑️ Elimina Domanda
          </button>
        </div>
      </details>
    ))}
  </div>
)}
