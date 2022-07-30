import type { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';

const Home: NextPage = () => {
  const moods = ["funny", "romantic", "feel-good", "thrilling", "thought-provoking", "uplifting", "challenging", "dark", "dramatic", "easy", "emotional", "heart-warming", "inspiring", "intense"];
  const sorts = ['score',
    'popularity',
    'vote_average'
  ];

  const [mood,
    setMood] = useState(moods[0]);
  const [sort,
    setSort] = useState(sorts);
  const [order,
    setOrder] = useState('desc');
  const [submitting,
    setSubmitting] = useState(false);
  const [results,
    setResults] = useState([null]);
  const [related,
    setRelated]: any = useState({});
  const [fetchingRelated, setFetchingRelated]: any = useState({});

  const fetchMovies = async () => {
    const config = await (await fetch(`/api/tmdb/configuration`)).json();
    const json = await (await fetch(`${process.env.NEXT_PUBLIC_API_URL}/movies?mood=${mood}${sort.map(sort => '&sort=' + sort).join('')}&asc=${order == 'asc'}&limit=10`)).json();

    const res = await Promise.all(json.map(async (movie: any) => {
      try {
        const poster = await (await fetch(`/api/tmdb/poster/${movie.id}`)).json();
        movie["poster_url"] = config.images.secure_base_url + "w342/" + poster.file_path;
      } catch {
        movie["poster_url"] = null;
      }

      // await fetchRelated(movie.id);
      return movie;
    }));

    setResults(res);
  };

  const fetchRelated = async (id: string) => {
    setFetchingRelated({ ...fetchingRelated, [id]: true });
    const config = await (await fetch(`/api/tmdb/configuration`)).json();
    const json = await (await fetch(`${process.env.NEXT_PUBLIC_API_URL}/related?movie_id=${id}`)).json();

    let res: any[] = [];
    for (let relatedMovie of json) {
      const movie = await (await fetch(`${process.env.NEXT_PUBLIC_API_URL}/movie?movie_id=${relatedMovie.id}`)).json();
      movie["score"] = relatedMovie.score;

      try {
        const poster = await (await fetch(`/api/tmdb/poster/${movie.id}`)).json();
        movie["poster_url"] = config.images.secure_base_url + "w342/" + poster.file_path;
      } catch { movie["poster_url"] = null; }

      res.push(movie);
      console.log(res);
    }

    setRelated((related: any) => {
      let newRelated = { [id]: res };
      return { ...newRelated, ...related };
    });
    console.log(related);
    setFetchingRelated({ ...fetchingRelated, [id]: false });
  };

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
            {moods.map((v,
              k) =>
              <option key={k} value={v}>{v}</option>
            )}
          </select>

          <br /><br />
          <label htmlFor="sort">Sort by (ctrl+click/drag to select multiple for linear combination): </label><br />
          <select multiple id="sort" value={sort} onChange={e => setSort(Array.from(e.target.selectedOptions).map(e => e.value))}>
            <option value="none">--none--</option>
            {sorts.map((v,
              k) =>
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
          <Link href="/search">Or search by keyword</Link>
          <br /><br />
          <input type="submit" disabled={submitting} />
          {submitting ? <p>Loading...</p> : null}
        </form>

        <ul>
          {results.map((movie: any,
            key) =>
            movie === null ? null :
              <li key={key}>
                <h2 style={{ display: "inline" }}><a href={`https://imdb.com/title/${movie.imdb_id}`}>{movie.title}</a></h2>
                <p>ID: {movie.id}</p>
                <p>Score: {movie.score}</p>
                <p>Popularity: {movie.popularity}</p>
                <p>Votes: {movie.vote_average}</p>
                <p>{movie.overview}</p>
                {movie.poster_url !== null ?
                  <img src={movie.poster_url} alt={`movie poster for ${movie.title}`} onError={(e) => e.currentTarget.hidden = true}></img>
                  : null}

                <p>Related:</p>
                <ul style={{ listStyle: "none" }}>
                  {movie.id in related ? related[movie.id].map((related: any) => {
                    return (
                      <li key={related.id} style={{ display: "inline-block", width: "15%", verticalAlign: "top", padding: "2%" }}>
                        <h4><a href={`https://imdb.com/title/${related.imdb_id}`}>{related.title}</a></h4>
                        <p>Score: {related.score}</p>
                        <p>{related.overview}</p>
                        {related.poster_url !== null ?
                          <img src={related.poster_url} alt={`movie poster for ${related.title}`} onError={(e) => e.currentTarget.hidden = true}></img>
                          : null}
                      </li>);
                  }) : <button disabled={fetchingRelated[movie.id]} onClick={async () => await fetchRelated(movie.id)}>
                    {fetchingRelated[movie.id] ? "Loading..." : "Show related movies"}
                  </button>}
                </ul>
              </li>
          )}
        </ul>
      </main>
    </div >
  );
};

export default Home;
