const GOOGLE_SCRIPT_URL =
    process.env.GOOGLE_SCRIPT_URL;


export default async function handler(req, res) {

    try {

        if (!GOOGLE_SCRIPT_URL) {

            return res.status(500).json({
                error:
                    "GOOGLE_SCRIPT_URL belum dikonfigurasi."
            });

        }


        if (req.method === "GET") {

            const response =
                await fetch(GOOGLE_SCRIPT_URL);

            const data =
                await response.json();

            return res.status(200).json(data);

        }


        if (req.method === "POST") {

            const response =
                await fetch(
                    GOOGLE_SCRIPT_URL,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify(req.body)
                    }
                );

            const data =
                await response.json();

            return res.status(200).json(data);

        }


        return res.status(405).json({
            error: "Method tidak diperbolehkan"
        });


    } catch (error) {

        console.error(error);

        return res.status(500).json({
            error:
                "Terjadi kesalahan server."
        });

    }

              }
