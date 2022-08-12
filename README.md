# Movie Recommender

You can view an overview of this project in [doc/MovieRecommender.md](./doc/MovieRecommender.md).

To gather the necessary data for the backend (`mooded_movies.json`, `related_movies.json`, `word_to_movies`.json), run the steps provided in the [notebook](./doc/Notebook.ipynb).

It is recommended you run the notebook in Google Colab.
Running the TF-IDF sections is not required if you choose to use the embedding method instead.

## Backend
1. Ensure the aforementioned files are available next to `server.py`.
2. Install dependencies with `pipenv install`.
3. Run the app for development with `pipenv run uvicorn server:app --reload`.

## Frontend
1. Set `NEXT_PUBLIC_API_URL` to the publicly accessible backend API endpoint in `.env.local`.
2. Install dependencies with `npm install`.
3. Run the app for development with `npm run dev`.
