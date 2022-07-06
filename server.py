from typing import Literal
import json
import os
from fastapi import FastAPI, Depends, Query
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

def mooded_movies():
    with open("mooded_movies.json") as file:
        return json.load(file)

@app.get("/movies/")
async def mood(
    movies: dict = Depends(mooded_movies),
    mood: str = Query(title="The mood of the movies to get"),
    limit: int = Query(title="The maximum number of movies to return", default=50),
    sort: Literal["score", "popularity", "none"] = Query(title="The order to sort the movies", default="none"),
    asc: bool = Query(title="Whether to sort by ascending or descending", default=True),
    adult: bool = Query(title="Whether to show adult movies", default=False)):

    query = [m for m in movies[mood] if adult or m["adult"] == "False"]
    if sort != "none":
        query = sorted(query, key=lambda m: float(m[sort]), reverse=not asc)

    return query[:min(limit, len(query)) if limit > 0 else -1]
