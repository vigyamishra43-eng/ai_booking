require('dotenv').config();

const listModels = async () => {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`
  );
  const data = await response.json();

  if (data.models) {
    data.models.forEach((m) => {
      console.log(m.name, '-', m.supportedGenerationMethods);
    });
  } else {
    console.log(data);
  }
};

listModels();