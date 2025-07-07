const express = require("express");
const app = express();

const { handleNotionUpdate } = require("./notion");

const PORT = 3000;
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Root endpoint.");
});

app.post("/update-notion", async (req, res) => {
  let data = req.body;

  if (!Array.isArray(data)) {
    if (typeof data === "object" && data !== null) {
      data = [data];
    } else {
      return res
        .status(400)
        .json({ error: "Expected an array of data in the body request." });
    }
  } // package into an array if not already

  const invalidRows = data.filter((row) => !row.school || !row.program);
  if (invalidRows.length > 0) {
    return res.status(400).json({
      error:
        'Invalid data format. Each row must contain "school" and "program" fields.',
      invalid: invalidRows,
    });
  }

  const updateResult = await handleNotionUpdate(data);

  res.status(200).json({
    res: `Successfully processed ${updateResult.length} request(s).`,
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
