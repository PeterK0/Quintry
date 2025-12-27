use serde::{Deserialize, Serialize};
use sqlx::sqlite::SqlitePool;
use sqlx::Row;
use tauri::{AppHandle, Manager};

#[derive(Debug, Serialize, Deserialize)]
pub struct QuizResult {
    pub port: String,
    #[serde(rename = "isCorrect")]
    pub is_correct: bool,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct QuizHistory {
    pub id: String,
    pub date: i64,
    pub score: i32,
    pub total: i32,
    pub accuracy: f64,
    pub duration: i32,
    pub difficulty: String,
    pub regions: Vec<String>,
    pub countries: Vec<String>,
    pub results: Vec<QuizResult>,
}

async fn get_db_pool(app: &AppHandle) -> Result<SqlitePool, String> {
    let app_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data dir: {}", e))?;

    std::fs::create_dir_all(&app_dir)
        .map_err(|e| format!("Failed to create app data dir: {}", e))?;

    let db_path = app_dir.join("quintry.db");
    let db_url = format!("sqlite:{}?mode=rwc", db_path.display());

    let pool = SqlitePool::connect(&db_url)
        .await
        .map_err(|e| format!("Failed to connect to database: {}", e))?;

    // Run migrations to create tables if they don't exist
    sqlx::query(
        "CREATE TABLE IF NOT EXISTS quiz_history (
          id TEXT PRIMARY KEY,
          date INTEGER NOT NULL,
          score INTEGER NOT NULL,
          total INTEGER NOT NULL,
          accuracy REAL NOT NULL,
          duration INTEGER NOT NULL,
          difficulty TEXT NOT NULL,
          regions TEXT NOT NULL,
          countries TEXT NOT NULL
        )"
    )
    .execute(&pool)
    .await
    .map_err(|e| format!("Failed to create quiz_history table: {}", e))?;

    sqlx::query(
        "CREATE INDEX IF NOT EXISTS idx_quiz_history_date ON quiz_history(date DESC)"
    )
    .execute(&pool)
    .await
    .map_err(|e| format!("Failed to create date index: {}", e))?;

    sqlx::query(
        "CREATE INDEX IF NOT EXISTS idx_quiz_history_difficulty ON quiz_history(difficulty)"
    )
    .execute(&pool)
    .await
    .map_err(|e| format!("Failed to create difficulty index: {}", e))?;

    sqlx::query(
        "CREATE TABLE IF NOT EXISTS quiz_results (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          quiz_id TEXT NOT NULL,
          port TEXT NOT NULL,
          is_correct INTEGER NOT NULL,
          FOREIGN KEY (quiz_id) REFERENCES quiz_history(id) ON DELETE CASCADE
        )"
    )
    .execute(&pool)
    .await
    .map_err(|e| format!("Failed to create quiz_results table: {}", e))?;

    sqlx::query(
        "CREATE INDEX IF NOT EXISTS idx_quiz_results_port_correct ON quiz_results(port, is_correct)"
    )
    .execute(&pool)
    .await
    .map_err(|e| format!("Failed to create port index: {}", e))?;

    Ok(pool)
}

#[tauri::command]
pub async fn save_quiz_history(
    app: AppHandle,
    history: QuizHistory,
) -> Result<(), String> {
    let pool = get_db_pool(&app).await?;

    // Serialize regions and countries to JSON
    let regions_json = serde_json::to_string(&history.regions).map_err(|e| e.to_string())?;
    let countries_json = serde_json::to_string(&history.countries).map_err(|e| e.to_string())?;

    // Insert quiz history
    sqlx::query(
        "INSERT INTO quiz_history (id, date, score, total, accuracy, duration, difficulty, regions, countries)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
    )
    .bind(&history.id)
    .bind(history.date)
    .bind(history.score)
    .bind(history.total)
    .bind(history.accuracy)
    .bind(history.duration)
    .bind(&history.difficulty)
    .bind(&regions_json)
    .bind(&countries_json)
    .execute(&pool)
    .await
    .map_err(|e| format!("Failed to insert quiz history: {}", e))?;

    // Insert quiz results
    for quiz_result in &history.results {
        let is_correct_int: i32 = if quiz_result.is_correct { 1 } else { 0 };
        sqlx::query(
            "INSERT INTO quiz_results (quiz_id, port, is_correct) VALUES (?, ?, ?)"
        )
        .bind(&history.id)
        .bind(&quiz_result.port)
        .bind(is_correct_int)
        .execute(&pool)
        .await
        .map_err(|e| format!("Failed to insert quiz result: {}", e))?;
    }

    pool.close().await;
    Ok(())
}

#[tauri::command]
pub async fn get_quiz_history(app: AppHandle) -> Result<Vec<QuizHistory>, String> {
    let pool = get_db_pool(&app).await?;

    // Fetch all quiz history records
    let quiz_records = sqlx::query(
        "SELECT id, date, score, total, accuracy, duration, difficulty, regions, countries FROM quiz_history ORDER BY date DESC"
    )
    .fetch_all(&pool)
    .await
    .map_err(|e| format!("Failed to fetch quiz history: {}", e))?;

    let mut histories = Vec::new();

    for record in quiz_records {
        let id: String = record.get("id");
        let date: i64 = record.get("date");
        let score: i32 = record.get("score");
        let total: i32 = record.get("total");
        let accuracy: f64 = record.get("accuracy");
        let duration: i32 = record.get("duration");
        let difficulty: String = record.get("difficulty");
        let regions_json: String = record.get("regions");
        let countries_json: String = record.get("countries");

        // Parse regions and countries from JSON
        let regions: Vec<String> = serde_json::from_str(&regions_json).unwrap_or_default();
        let countries: Vec<String> = serde_json::from_str(&countries_json).unwrap_or_default();

        // Fetch results for this quiz
        let result_records = sqlx::query(
            "SELECT port, is_correct FROM quiz_results WHERE quiz_id = ?"
        )
        .bind(&id)
        .fetch_all(&pool)
        .await
        .map_err(|e| format!("Failed to fetch quiz results: {}", e))?;

        let results: Vec<QuizResult> = result_records
            .iter()
            .map(|r| {
                let port: String = r.get("port");
                let is_correct: i32 = r.get("is_correct");
                QuizResult {
                    port,
                    is_correct: is_correct != 0,
                }
            })
            .collect();

        histories.push(QuizHistory {
            id,
            date,
            score,
            total,
            accuracy,
            duration,
            difficulty,
            regions,
            countries,
            results,
        });
    }

    pool.close().await;
    Ok(histories)
}

#[tauri::command]
pub async fn clear_quiz_history(app: AppHandle) -> Result<(), String> {
    let pool = get_db_pool(&app).await?;

    // Delete quiz results first (foreign key constraint)
    sqlx::query("DELETE FROM quiz_results")
        .execute(&pool)
        .await
        .map_err(|e| format!("Failed to clear quiz results: {}", e))?;

    // Then delete quiz history
    sqlx::query("DELETE FROM quiz_history")
        .execute(&pool)
        .await
        .map_err(|e| format!("Failed to clear quiz history: {}", e))?;

    pool.close().await;
    Ok(())
}
