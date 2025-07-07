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
  const properties = {};
  // Program - rich_text
  if (values.program !== undefined) {
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
  }

  // Email - rich_text
  if (values.email !== undefined) {
    properties.Email = {
      rich_text: values.email
        ? [
            {
              type: "text",
              text: {
                content: values.email,
              },
            },
          ]
        : [],
    };
  }

  // PS - url
  if (values.ps !== undefined) {
    properties.PS = {
      url: values.ps || null,
    };
  }

  // SoP - url
  if (values.sop !== undefined) {
    properties.SoP = {
      url: values.sop || null,
    };
  }

  // Status - select
  if (values.status !== undefined) {
    properties.Status = {
      select: values.status
        ? {
            name: values.status,
          }
        : null,
    };
  }

  // School - title
  if (values.school !== undefined) {
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
  }

  return properties;
}

async function createRow(values) {
  // TODO;
  return null;
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

async function main() {
  const values = {
    school: "MIT",
    program: "Computer Science",
    status: "Draft",
    ps: "https://example.com/personal-statement",
    sop: "https://example.com/statement-of-purpose",
    email: "student@example2.com",
  };

  const mapping = await findPageIdMapping();

  try {
    if (mapping[values.school]) {
      const result = await updateRow(values, mapping[values.school]);
    } else {
      // TODO
    }
    console.log(result);
  } catch (error) {
    // console.error(error);
  }
}
