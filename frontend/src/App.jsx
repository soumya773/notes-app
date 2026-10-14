import { useEffect, useState } from "react";
import "./App.css";

function App() {
  const [notes, setNotes] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function fetchNotes() {
    try {
      const response = await fetch("/api/notes");
      if (!response.ok) throw new Error("Could not load notes");
      setNotes(await response.json());
      setError("");
    } catch {
      setError("Could not connect to the backend. Check Docker Compose.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchNotes();
  }, []);

  async function addNote(event) {
    event.preventDefault();
    if (!text.trim() || saving) return;

    setSaving(true);
    setError("");

    try {
      const response = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) throw new Error("Could not save note");

      setText("");
      await fetchNotes();
    } catch {
      setError("Could not save your note. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteNote(id) {
    try {
      setError("");

      const response = await fetch(`/api/notes/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Could not delete note");
      }

      setNotes((currentNotes) =>
        currentNotes.filter((note) => note._id !== id),
      );
    } catch {
      setError("Could not delete note. Please try again.");
    }
  }

  return (
    <main className="page">
      <section className="notes-app">
        <header className="app-header">
          <div className="brand-icon">✎</div>
          <div>
            <h1>My Notes</h1>
            <p className="subtitle">React + Node.js + MongoDB + Docker</p>
          </div>
          <span className="tagline">Your ideas, organized</span>
        </header>

        <section className="form-card">
          <h2>Add a new note</h2>
          <form className="note-form" onSubmit={addNote}>
            <input
              type="text"
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="Write a note..."
              aria-label="Write a note"
              maxLength={500}
            />
            <button type="submit" disabled={!text.trim() || saving}>
              {saving ? "Saving..." : "+ Add Note"}
            </button>
          </form>
        </section>

        {error && (
          <p className="error-message" role="alert">
            {error}
          </p>
        )}

        <section className="saved-section">
          <div className="section-heading">
            <h2>Saved Notes</h2>
            <span className="note-count">
              {notes.length} {notes.length === 1 ? "note" : "notes"}
            </span>
          </div>

          {loading ? (
            <p className="empty-message">Loading your notes...</p>
          ) : notes.length === 0 ? (
            <p className="empty-message">
              No notes yet. Add your first note above!
            </p>
          ) : (
            <ul className="notes-list">
              {notes.map((note) => (
                <li className="note-item" key={note._id}>
                  <span className="note-icon">▤</span>
                  <span className="note-text">{note.text}</span>
                  <time className="note-date">
                    {note.createdAt
                      ? new Date(note.createdAt).toLocaleDateString()
                      : ""}
                  </time>

                  <button
                    type="button"
                    className="delete-button"
                    aria-label={`Delete note: ${note.text}`}
                    onClick={() => deleteNote(note._id)}
                  >
                    🗑
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <footer className="app-footer">
          Built with React and a little creativity.
        </footer>
      </section>
    </main>
  );
}

export default App;
