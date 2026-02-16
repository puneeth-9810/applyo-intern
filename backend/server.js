const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config();
const app = express();
const server = http.createServer(app);


app.use(express.json());

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (origin.includes("vercel.app")) {
      return callback(null, true);
    }
    callback(new Error("Not allowed by CORS"));
  },
  credentials: true
}));



const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
});


const allowedOrigins = [
  process.env.CLIENT_URL
];

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      if (
        allowedOrigins.includes(origin) ||
        origin.includes("vercel.app")
      ) {
        return callback(null, true);
      }

      callback(new Error("Socket CORS not allowed"));
    },
    methods: ["GET", "POST"],
    credentials: true
  }
});


io.on("connection", (socket) => {
  socket.on("joinPoll", (pollId) => {
    if (pollId) {
      socket.join(pollId);
    }
  });
});


const getClientIp = (req) => {
  return (
    req.headers["x-forwarded-for"]?.split(",")[0] ||
    req.socket.remoteAddress ||
    null
  );
};


app.post("/api/polls", async (req, res) => {
  const { title, options } = req.body;

  if (!title || !Array.isArray(options) || options.length < 2) {
    return res.status(400).json({
      error: "A poll requires a title and at least two options.",
    });
  }

  const cleanedTitle = title.trim();
  const cleanedOptions = options
    .map((opt) => opt.trim())
    .filter((opt) => opt.length > 0);

  if (cleanedOptions.length < 2) {
    return res.status(400).json({
      error: "At least two valid options are required.",
    });
  }

  try {
    await pool.query("BEGIN");

    const pollResult = await pool.query(
      "INSERT INTO polls (title) VALUES ($1) RETURNING id",
      [cleanedTitle]
    );

    const pollId = pollResult.rows[0].id;

    for (let i = 0; i < cleanedOptions.length; i++) {
      await pool.query(
        "INSERT INTO options (poll_id, text, option_order) VALUES ($1, $2, $3)",
        [pollId, cleanedOptions[i], i]
      );
    }

    await pool.query("COMMIT");

    return res.status(201).json({
      message: "Poll created successfully.",
      pollId,
    });
  } catch (error) {
    await pool.query("ROLLBACK");
    return res.status(500).json({
      error: "Unable to create poll at this time.",
    });
  }
});


app.get("/api/polls/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const pollResult = await pool.query(
      "SELECT * FROM polls WHERE id = $1",
      [id]
    );

    if (pollResult.rows.length === 0) {
      return res.status(404).json({
        error: "Poll not found.",
      });
    }

    const optionsResult = await pool.query(
      "SELECT * FROM options WHERE poll_id = $1 ORDER BY option_order ASC",
      [id]
    );

    return res.json({
      poll: pollResult.rows[0],
      options: optionsResult.rows,
    });
  } catch (error) {
    return res.status(500).json({
      error: "Unable to fetch poll.",
    });
  }
});


app.post("/api/polls/:id/vote", async (req, res) => {
  const { id } = req.params;
  const { optionId, voterToken } = req.body;

  if (!optionId || !voterToken) {
    return res.status(400).json({
      error: "Invalid vote request.",
    });
  }

  const voterIp = getClientIp(req);

  try {
    
    const pollCheck = await pool.query(
      "SELECT id FROM polls WHERE id = $1",
      [id]
    );

    if (pollCheck.rows.length === 0) {
      return res.status(404).json({
        error: "Poll does not exist.",
      });
    }

    
    const existingVote = await pool.query(
      `SELECT id FROM votes
       WHERE poll_id = $1
       AND (voter_ip = $2 OR voter_token = $3)`,
      [id, voterIp, voterToken]
    );

    if (existingVote.rows.length > 0) {
      return res.status(403).json({
        error: "You have already voted in this poll.",
      });
    }

    
    const optionCheck = await pool.query(
      "SELECT id FROM options WHERE id = $1 AND poll_id = $2",
      [optionId, id]
    );

    if (optionCheck.rows.length === 0) {
      return res.status(400).json({
        error: "Selected option is invalid.",
      });
    }

    await pool.query("BEGIN");

    
    await pool.query(
      `INSERT INTO votes (poll_id, option_id, voter_ip, voter_token)
       VALUES ($1, $2, $3, $4)`,
      [id, optionId, voterIp, voterToken]
    );

    
    await pool.query(
      `UPDATE options
       SET votes = votes + 1
       WHERE id = $1 AND poll_id = $2`,
      [optionId, id]
    );

    const updatedOptions = await pool.query(
      "SELECT * FROM options WHERE poll_id = $1 ORDER BY option_order ASC",
      [id]
    );

    await pool.query("COMMIT");

    
    io.to(id).emit("voteUpdate", updatedOptions.rows);

    return res.json({
      message: "Vote recorded successfully.",
      options: updatedOptions.rows,
    });
  } catch (error) {
    await pool.query("ROLLBACK");
    return res.status(500).json({
      error: "Unable to process vote.",
    });
  }
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
