import type { NextPage } from 'next'
import Head from 'next/head'
import { useState } from 'react'

const Home: NextPage = () => {
  const moods = [
    'funny', 'romantic', 'mind-blowing', 'feel-good', 'thrilling', 'thought-provoking', 'weird', 'uplifting', 'challenging', 'dark', 'dramatic', 'easy', 'emotional', 'heart-warming', 'inspiring', 'instructive-2', 'intense', 'no-plot', 'slow', 'smart'
  ]
  const sorts = ['score', 'popularity', 'vote_average']

  const [mood, setMood] = useState(moods[0])
  const [sort, setSort] = useState(sorts)
  const [order, setOrder] = useState('desc')
  const [submitting, setSubmitting] = useState(false)
  const [results, setResults] = useState([null])

  const fetchMovies = async () => {
    const config = await (await fetch(`/api/tmdb/configuration`)).json()
    const json = await (await fetch(`${process.env.NEXT_PUBLIC_API_URL}/movies?mood=${mood}${sort.map(sort => '&sort=' + sort).join('')}&asc=${order == 'asc'}&limit=20`)).json()

    const res = await Promise.all(json.map(async (movie: any) => {
      try {
        const poster = await (await fetch(`/api/tmdb/poster/${movie.id}`)).json()
        movie["poster_url"] = config.images.secure_base_url + "w342/" + poster.file_path
      } catch { }

      return movie
    }))

    setResults(res)
  }

  return (
    <div>
      <Head>
        <title>Movie Recommender</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
        <h1>Movie Recommendations</h1>
        <form onSubmit={async e => { e.preventDefault(); setSubmitting(true); await fetchMovies(); setSubmitting(false); }}>
          <span>Search movies and TV shows by: </span>

          <br /><br />
          <label htmlFor="mood">Mood: </label>
          <select id="mood" required value={mood} onChange={e => setMood(e.target.value)}>
            {moods.map((v, k) =>
              <option key={k} value={v}>{v}</option>
            )}
          </select>

          <br /><br />
          <label htmlFor="sort">Sort by (ctrl+click or drag to select multiple): </label><br />
          <select multiple id="sort" value={sort} onChange={e => setSort(Array.from(e.target.selectedOptions).map(e => e.value))}>
            <option value="none">--none--</option>
            {sorts.map((v, k) =>
              <option key={k} value={v}>{v}</option>
            )}
          </select>

          <br /><br />
          <label htmlFor="order">Order: </label>
          <select id="order" value={order} onChange={e => setOrder(e.target.value)}>
            <option value="desc">descending</option>
            <option value="asc">ascending</option>
          </select>

          <br /><br />
          <input type="submit" disabled={submitting} />
          {submitting ? <p>Loading...</p> : null}
        </form>

        <ul>
          {results.map((movie: any, key) =>
            movie === null ? null :
              <li key={key}>
                <h2 style={{ display: "inline" }}><a href={`https://imdb.com/title/${movie.imdb_id}`}>{movie.title}</a></h2>
                <p>Score: {movie.score}</p>
                <p>Popularity: {movie.popularity}</p>
                <p>Votes: {movie.vote_average}</p>
                <p>{movie.overview}</p>
                <img src={movie.poster_url} alt={`movie poster for ${movie.title}`}></img>
              </li>
          )}
        </ul>
      </main>
    </div>
  )
}

export default Home
