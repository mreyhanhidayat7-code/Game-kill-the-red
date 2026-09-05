export default async function handler(req, res) {
  const googleURL = process.env.GOOGLE_APPS_SCRIPT_URL;

  if (!googleURL) {
    return res.status(500).json({
      ok: false,
      error: "GOOGLE_APPS_SCRIPT_URL belum dikonfigurasi",
    });
  }

  try {
    /* ========================= GET ========================= */

    if (req.method === "GET") {
      const response = await fetch(googleURL);

      const data = await response.json();

      return res.status(response.status).json(data);
    }

    /* ========================= POST ========================= */

    if (req.method === "POST") {
      const body =
        typeof req.body === "string" ? JSON.parse(req.body) : req.body;

      const scoreData = {
        username: String(body?.username || "").substring(0, 20),

        score: Number(body?.score || 0),

        kills: Number(body?.kills || 0),

        level: Number(body?.level || 1),
      };

      const response = await fetch(googleURL, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify(scoreData),
      });

      const data = await response.json();

      return res.status(response.status).json(data);
    }

    return res.status(405).json({
      ok: false,

      error: "Method tidak diperbolehkan",
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,

      error: error.message,
    });
  }
        }
