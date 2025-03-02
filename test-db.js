const sqlite3 = require("better-sqlite3");

// Open the database
const db = sqlite3("db.sqlite");

// Insert a test embedding
const testEmbedding = JSON.stringify([0.1, 0.2, 0.3, 0.4, 0.5]);
db.prepare(
  "INSERT INTO embeddings (file_name, category, embedding) VALUES (?, ?, ?)"
).run("test-file.txt", "test-category", testEmbedding);

console.log("Inserted a test embedding.");

// Fetch all embeddings
const embeddings = db.prepare("SELECT * FROM embeddings").all();

console.log("Stored Embeddings:", embeddings);
