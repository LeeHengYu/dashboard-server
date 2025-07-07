require("dotenv").config();

const { Client } = require("@notionhq/client");
const notion = new Client({ auth: process.env.NOTION_TOKEN });

async function findPageIdMapping() {
  const response = await notion.databases.query({
    database_id: process.env.NOTION_DATABASE_ID,
  });

  const mapping = {};

  response.results.forEach((page) => {
    const schoolProperty = page.properties.School;

    // Check if school property exists and has title content
    if (
      schoolProperty &&
      schoolProperty.title &&
      schoolProperty.title.length > 0 &&
      schoolProperty.title[0].text &&
      schoolProperty.title[0].text.content
    ) {
      const schoolName = schoolProperty.title[0].text.content;
      const pageId = page.id;

      mapping[schoolName] = pageId;
    }
  });
  return mapping;
}

function convertProperties(values) {
  // Converts the input dict to Notion API format
  const properties = {};
  // Program - rich_text (required)
  properties.Program = {
    rich_text: values.program
      ? [
          {
            type: "text",
            text: {
              content: values.program,
            },
          },
        ]
      : [],
  };

  // Email - rich_text
  if (values.email) {
    if (typeof values.email === "string") {
      properties.Email = {
        rich_text: [
          {
            type: "text",
            text: {
              content: values.email,
            },
          },
        ],
      };
    } else {
      // there is displayText and url
      properties.Email = {
        rich_text: [
          {
            type: "text",
            text: {
              content: values.email.displayText || "",
              link: values.email.url ? { url: values.email.url } : null,
            },
          },
        ],
      };
    }
  }

  // PS - url
  if (values.ps) {
    properties.PS = {
      url: values.ps.url,
    };
  }

  // SoP - url
  if (values.sop) {
    properties.SoP = {
      url: values.sop.url,
    };
  }

  // Status - select
  if (values.status) {
    properties.Status = {
      select: values.status
        ? {
            name: values.status,
          }
        : undefined,
    };
  }

  // School - title (required)
  properties.School = {
    title: values.school
      ? [
          {
            type: "text",
            text: {
              content: values.school,
            },
          },
        ]
      : [],
  };

  return properties;
}

async function createRow(values) {
  try {
    const response = await notion.pages.create({
      parent: {
        database_id: process.env.NOTION_DATABASE_ID,
      },
      properties: convertProperties(values),
    });

    return response;
  } catch (error) {
    console.error("Error creating Notion row:", error);
    throw error;
  }
}

async function updateRow(values, rowId) {
  try {
    const response = await notion.pages.update({
      page_id: rowId,
      properties: convertProperties(values),
    });

    return response;
  } catch (error) {
    console.error("Error updating Notion row:", error);
    throw error;
  }
}

const values = [
  {
    school: "UCLA",
    program: "MEng",
    status: "Draft",
    ps: {
      displayText: "PS.pdf",
      url: "https://drive.google.com/file/d/1clF8uTWaqc_NEs8UE0hJBr4vwYiEn7aJ/view?usp=drivesdk",
    },
    sop: {
      displayText: "SoP.pdf",
      url: "https://drive.google.com/file/d/1bH_cnfVSVh7DLwqEUbh_QUUo1kTVbGO-/view?usp=drivesdk",
    },
    email: {
      displayText: "1 UNREAD",
      url: "https://google.com/",
    },
  },
  {
    school: "UIUC",
    program: "MCS",
    status: "Draft",
    ps: null,
    sop: null,
    email: "0 UNREAD",
  },
];

async function handleNotionUpdate(rowsData) {
  const mapping = await findPageIdMapping();

  const results = [];

  for (const rowData of rowsData) {
    try {
      let result = null;
      if (mapping[rowData.school]) {
        console.log(`Updating existing row for: ${rowData.school}`);
        result = await updateRow(rowData, mapping[rowData.school]);
      } else {
        console.log(`Creating new row for: ${rowData.school}`);
        result = await createRow(rowData);
      }

      results.push({
        success: true,
        school: rowData.school,
        action: mapping[rowData.school] ? "updated" : "created",
        result: result,
      });

      console.log(`Successfully processed ${rowData.school}`);
    } catch (error) {
      console.error(`Error processing ${rowData.school}:`, error);
      results.push({
        success: false,
        school: rowData.school,
        error: error.message,
      });
    }
  }

  const successful = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);

  console.log(
    `\nSummary: ${successful.length} successful, ${failed.length} failed`
  );

  if (failed.length > 0) {
    console.log(
      "Failed schools:",
      failed.map((f) => f.school)
    );
  }

  return results;
}

// Helper function for debug

async function query() {
  const response = await notion.databases.query({
    database_id: process.env.NOTION_DATABASE_ID,
    // filter: {
    //   property: "School",
    //   rich_text: {
    //     equals: "UIUC",
    //   },
    // },
  });

  console.log(response.results[0].properties);
}
