import { NextApiHandler } from "next"
import { MovieDb } from "moviedb-promise"

const handler: NextApiHandler = async (req, res) => {
    const id: string | undefined = req.query.id?.toString()
    if (id == undefined) res.status(400).json({ error: "ID is required" })

    const mdb = new MovieDb(process.env.TMDB_API_KEY!)
    const img = await mdb.movieImages({ id: id!, language: "en" })
    res.status(200).json(img["posters"]![0])
}

export default handler