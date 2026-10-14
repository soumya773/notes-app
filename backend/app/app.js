const http = require("http");
const { MongoClient, ObjectId } = require("mongodb");


const PORT = process.env.PORT || 3000;
const MONGO_URL = process.env.MONGO_URL || "mongodb://mongodb:27017";

const client = new MongoClient(MONGO_URL);

async function startServer() {
  try {
    await client.connect();
    console.log("Connected to MongoDB successfully!");

    const db = client.db("myapp");
    const notes = db.collection("notes");

    const server = http.createServer(async (req, res) => {
      res.setHeader("Content-Type", "application/json");

      try {
        if (req.method === "GET" && req.url === "/api/status") {
          res.writeHead(200);
          return res.end(
            JSON.stringify({
              message: "Node.js backend is running!",
              database: "MongoDB connected",
            }),
          );
        }

        if (req.method === "DELETE" && req.url.startsWith("/api/notes/")) {
          const id = req.url.split("/")[3];

          if (!id || !/^[a-fA-F0-9]{24}$/.test(id)) {
            res.writeHead(400);
            return res.end(JSON.stringify({ message: "Invalid note ID" }));
          }

          const result = await notes.deleteOne({
            _id: new ObjectId(id),
          });

          if (result.deletedCount === 0) {
            res.writeHead(404);
            return res.end(JSON.stringify({ message: "Note not found" }));
          }

          res.writeHead(200);
          return res.end(
            JSON.stringify({
              message: "Note deleted successfully",
            }),
          );
        }

        if (req.method === "GET" && req.url === "/api/notes") {
          const allNotes = await notes.find({}).toArray();
          res.writeHead(200);
          return res.end(JSON.stringify(allNotes));
        }

        if (req.method === "POST" && req.url === "/api/notes") {
          let body = "";

          for await (const chunk of req) {
            body += chunk;
          }

          const data = JSON.parse(body);

          if (typeof data.text !== "string" || !data.text.trim()) {
            res.writeHead(400);
            return res.end(
              JSON.stringify({
                message: "A non-empty text field is required",
              }),
            );
          }

          const result = await notes.insertOne({
            text: data.text.trim(),
            createdAt: new Date(),
          });

          res.writeHead(201);
          return res.end(
            JSON.stringify({
              message: "Note saved successfully",
              id: result.insertedId,
            }),
          );
        }

        res.writeHead(404);
        res.end(JSON.stringify({ message: "Route not found" }));
      } catch (error) {
        console.error("Request failed:", error.message);
        if (!res.headersSent) {
          res.writeHead(error instanceof SyntaxError ? 400 : 500);
        }
        res.end(JSON.stringify({ message: "Request failed" }));
      }
    });

    server.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Application startup failed:", error.message);
    process.exit(1);
  }
}

startServer();
