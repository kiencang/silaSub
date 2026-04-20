console.log("process.env", process.env['GEMINI_API_KEY'] ? "EXISTS" : "MISSING");
if (typeof GEMINI_API_KEY !== 'undefined') console.log("global GEMINI_API_KEY", "EXISTS");
