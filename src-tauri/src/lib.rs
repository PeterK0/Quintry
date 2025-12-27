mod commands;

use tauri_plugin_sql::{Builder, Migration, MigrationKind};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  let migrations = vec![
    Migration {
      version: 1,
      description: "create quiz_history and quiz_results tables",
      sql: "
        CREATE TABLE IF NOT EXISTS quiz_history (
          id TEXT PRIMARY KEY,
          date INTEGER NOT NULL,
          score INTEGER NOT NULL,
          total INTEGER NOT NULL,
          accuracy REAL NOT NULL,
          duration INTEGER NOT NULL,
          difficulty TEXT NOT NULL,
          regions TEXT NOT NULL,
          countries TEXT NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_quiz_history_date ON quiz_history(date DESC);
        CREATE INDEX IF NOT EXISTS idx_quiz_history_difficulty ON quiz_history(difficulty);

        CREATE TABLE IF NOT EXISTS quiz_results (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          quiz_id TEXT NOT NULL,
          port TEXT NOT NULL,
          is_correct INTEGER NOT NULL,
          FOREIGN KEY (quiz_id) REFERENCES quiz_history(id) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_quiz_results_port_correct ON quiz_results(port, is_correct);
      ",
      kind: MigrationKind::Up,
    },
  ];

  tauri::Builder::default()
    .plugin(
      Builder::default()
        .add_migrations("sqlite:quintry.db", migrations)
        .build(),
    )
    .plugin(tauri_plugin_dialog::init())
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .invoke_handler(tauri::generate_handler![
      commands::quiz_history::save_quiz_history,
      commands::quiz_history::get_quiz_history,
      commands::quiz_history::clear_quiz_history,
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
