from typing import Literal
import json
import os
from fastapi import FastAPI, Depends, Query, HTTPException
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

def find_range(movies, key):
    minimum = None
    maximum = None
    for mood in movies.keys():
        for movie in movies[mood]:
            if key not in movie: continue
            try:
                if minimum is None or float(movie[key] or "0.0") < minimum:
                    minimum = float(movie[key])
                if maximum is None or float(movie[key] or "0.0") > maximum:
                    maximum = float(movie[key])
            except: pass
    return (minimum, maximum)

def find_weight(key):
    if key == "score": return 2
    return 1

@app.get("/movies")
async def mood(
    movies: dict = Depends(mooded_movies),
    mood: str = Query(title="The mood of the movies to get"),
    limit: int = Query(title="The maximum number of movies to return", default=50),
    sort: list[Literal["score", "popularity", "vote_average", "none"]] = Query(title="The order to sort the movies", default=None),
    asc: bool = Query(title="Whether to sort by ascending or descending", default=True),
    adult: bool = Query(title="Whether to show adult movies", default=False)):

    if mood not in movies: raise HTTPException(status_code=400, detail="Mood not found")

    query = [m for m in movies[mood] if adult or m["adult"] == "False"]
    if sort is not None:
        if "none" not in sort:
            mins = {}
            maxs = {}
            for key in sort:
                minm, maxm = find_range(movies, key)
                mins[key] = minm
                maxs[key] = maxm
            # the formula for sorting is as follows: sum(Weight_key * (Value_key - Min_key) / Max_key for key in keys) / sum([Weight_all])
            query = sorted(query, key=lambda m: sum([find_weight(key) * ((float(m.get(key, 0)) - mins[key]) / (maxs[key])) for key in sort]) / sum([find_weight(key) for key in sort]), reverse=not asc)

    return query[:min(limit, len(query)) if limit > 0 else -1]
