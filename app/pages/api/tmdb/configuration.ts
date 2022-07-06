import { NextApiHandler } from "next"
import { MovieDb } from "moviedb-promise"

const handler: NextApiHandler = async (req, res) => {
    const mdb = new MovieDb(process.env.TMDB_API_KEY!)
    res.status(200).json(await mdb.configuration())
}

export default handler