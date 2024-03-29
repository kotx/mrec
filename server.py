from typing import Literal
import json
import os
from fastapi import FastAPI, Depends, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import itertools
import re

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

def related_movies():
    with open("movie_relations.json") as file:
        return json.load(file)

def word_to_movies():
    with open("word_to_movies.json") as file:
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
            query = sorted(query, key=lambda m: sum([find_weight(key) * ((float(m[key] or "0.0") - mins[key]) / (maxs[key])) for key in sort]) / sum([find_weight(key) for key in sort]), reverse=not asc)

    return query[:min(limit, len(query)) if limit > 0 else -1]

@app.get("/related")
async def related(
    relations: dict = Depends(related_movies),
    movie_id: str = Query(title="The ID of the movie to find related movies for"),
    limit: int=Query(title="The maximum number of related movies to return", default=5)
):
    if movie_id not in relations:
        raise HTTPException(status_code=404, detail="Movie not found")
    return sorted(relations[movie_id][:min(limit, 50)], key=lambda x: x["score"], reverse=True)

@app.get("/movie")
async def movie(
    movies: dict = Depends(mooded_movies), 
    movie_id: str = Query(title="The ID of the movie to search for")):
    for mood in movies.keys():
        for movie in movies[mood]:
            if movie["id"] == movie_id:
                return movie

    raise HTTPException(status_code=404, detail="Movie not found")

@app.get("/search")
async def search(
    movies: dict = Depends(word_to_movies),
    movie_data: dict = Depends(mooded_movies),
    query: str = Query(title="The keywords of movies to search for")):
    movie_data = {m["id"]: m for m in itertools.chain.from_iterable([movie_data[mood] for mood in movie_data.keys()])}
    movie_set = None
    movie_score = {}
    for word in [re.sub("([/\",'\\.‘’!?\)\():])", "", q.lower()) for q in query.split()]:
        word = word.lower()
        if word in movies:
            word_set = set()
            for movie in movies[word]:
                word_set.add(movie["id"])
            if movie_set is None:
                movie_set = word_set
            else:
                movie_set = movie_set.intersection(word_set)
            for movie in movie_set:
                score = [m["score"] for m in movies[word] if m["id"] == movie][0]
                movie_score[movie] = movie_score.get(movie, 0) + score
    sorted_movies = sorted(movie_set or [], key=lambda x: movie_score[x], reverse=True)
    return [movie_data[id] for id in sorted_movies]
