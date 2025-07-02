const express = require("express");
const app = express();

const PORT = 3000;

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Root endpoint.");
});

app.post("/update-notion", (req, res) => {
  let data = req.body;

  if (!Array.isArray(data)) {
    if (typeof data === "object" && data !== null) {
      data = [data];
    } else {
      return res
        .status(400)
        .json({ error: "Expected an array of data in the body request." });
    }
  }

  const invalidRows = data.filter((row) => !row.school || !row.program);
  if (invalidRows.length > 0) {
    return res.status(400).json({
      error:
        'Invalid data format. Each row must contain "school" and "program" fields.',
      invalid: invalidRows,
    });
  }

  res.status(200).json({
    message: `Updated ${data.length} ${
      data.length > 1 ? "rows" : "row"
    } successfully.`,
    data: data,
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
