import asyncio
import time
from typing import Any, Dict, List, Optional
import httpx
from fastapi import APIRouter, HTTPException, Query

from app.core.config import settings

router = APIRouter()

TMDB_BASE_URL = "https://api.themoviedb.org/3"

# In-memory caches for endpoints to make them lightning-fast
_top_rated_tv_cache: Dict[str, Any] = {"data": None, "timestamp": 0}
_popular_cache: Dict[str, Any] = {"data": None, "timestamp": 0}

CACHE_TTL_SECONDS = 3600  # 1 hour cache


def get_headers() -> Dict[str, str]:
    headers = {"accept": "application/json"}
    if len(settings.tmdb_api_key) > 50:
        headers["Authorization"] = f"Bearer {settings.tmdb_api_key}"
    return headers


def get_params(extra_params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    params = {}
    # If the TMDB key is not a v4 Read Access Token (which is long), treat it as v3 API key
    if len(settings.tmdb_api_key) < 50:
        params["api_key"] = settings.tmdb_api_key
    if extra_params:
        params.update(extra_params)
    return params


async def fetch_page(client: httpx.AsyncClient, url: str, page: int) -> List[Dict[str, Any]]:
    try:
        params = get_params({"page": page})
        response = await client.get(url, params=params, headers=get_headers(), timeout=10.0)
        response.raise_for_status()
        return response.json().get("results", [])
    except Exception as e:
        print(f"Error fetching page {page} from {url}: {e}")
        return []


@router.get("/search")
async def search_multi(query: str = Query(..., min_length=1)):
    """
    Search across movies, TV shows, and anime using TMDB multi-search.
    """
    url = f"{TMDB_BASE_URL}/search/multi"
    params = get_params({"query": query, "include_adult": "false"})
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, params=params, headers=get_headers(), timeout=10.0)
            response.raise_for_status()
            data = response.json()
            # Clean and filter results
            results = []
            for item in data.get("results", []):
                media_type = item.get("media_type")
                if media_type not in ["movie", "tv"]:
                    continue

                results.append({
                    "id": item.get("id"),
                    "title": item.get("title") or item.get("name"),
                    "original_title": item.get("original_title") or item.get("original_name"),
                    "media_type": media_type,
                    "overview": item.get("overview"),
                    "release_date": item.get("release_date") or item.get("first_air_date"),
                    "vote_average": item.get("vote_average"),
                    "vote_count": item.get("vote_count"),
                    "poster_url": f"https://image.tmdb.org/t/p/w500{item.get('poster_path')}" if item.get("poster_path") else None,
                    "backdrop_url": f"https://image.tmdb.org/t/p/original{item.get('backdrop_path')}" if item.get("backdrop_path") else None,
                    "genres": []  # Genres are IDs in search; details page will resolve them
                })
            return {"results": results}
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"TMDB search failed: {str(e)}")


@router.get("/tv/{tv_id}")
async def get_tv_details(tv_id: int):
    """
    Get TV show details.
    """
    url = f"{TMDB_BASE_URL}/tv/{tv_id}"
    params = get_params()
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, params=params, headers=get_headers(), timeout=10.0)
            response.raise_for_status()
            item = response.json()

            # Format response
            return {
                "id": item.get("id"),
                "title": item.get("name"),
                "original_title": item.get("original_name"),
                "media_type": "tv",
                "overview": item.get("overview"),
                "tagline": item.get("tagline"),
                "release_date": item.get("first_air_date"),
                "last_air_date": item.get("last_air_date"),
                "status": item.get("status"),
                "networks": [n.get("name") for n in item.get("networks", []) if n.get("name")],
                "genres": [g.get("name") for g in item.get("genres", []) if g.get("name")],
                "vote_average": item.get("vote_average"),
                "vote_count": item.get("vote_count"),
                "poster_url": f"https://image.tmdb.org/t/p/w500{item.get('poster_path')}" if item.get("poster_path") else None,
                "backdrop_url": f"https://image.tmdb.org/t/p/original{item.get('backdrop_path')}" if item.get("backdrop_path") else None,
                "number_of_seasons": item.get("number_of_seasons"),
                "number_of_episodes": item.get("number_of_episodes"),
                "seasons_list": [
                    {
                        "season_number": s.get("season_number"),
                        "episode_count": s.get("episode_count"),
                        "name": s.get("name")
                    }
                    for s in item.get("seasons", [])
                ]
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to fetch TV details: {str(e)}")


@router.get("/tv/{tv_id}/episodes")
async def get_tv_episodes_graph(tv_id: int):
    """
    Fetch details for all seasons and episodes of a TV show in parallel,
    aggregate statistics, and format it for graph rendering.
    """
    async with httpx.AsyncClient() as client:
        try:
            # 1. Fetch TV Show basic details
            tv_url = f"{TMDB_BASE_URL}/tv/{tv_id}"
            tv_response = await client.get(tv_url, params=get_params(), headers=get_headers(), timeout=10.0)
            tv_response.raise_for_status()
            tv_data = tv_response.json()

            # Find valid seasons (exclude Specials / Season 0)
            seasons = [s for s in tv_data.get("seasons", []) if s.get("season_number", 0) > 0 and s.get("episode_count", 0) > 0]

            # If no seasons > 0, include season 0 as fallback
            if not seasons:
                seasons = [s for s in tv_data.get("seasons", []) if s.get("episode_count", 0) > 0]

            # 2. Fetch all seasons in parallel
            async def fetch_season(season_num: int):
                season_url = f"{TMDB_BASE_URL}/tv/{tv_id}/season/{season_num}"
                try:
                    res = await client.get(season_url, params=get_params(), headers=get_headers(), timeout=10.0)
                    res.raise_for_status()
                    return res.json()
                except Exception as ex:
                    print(f"Error fetching season {season_num}: {ex}")
                    return None

            tasks = [fetch_season(s["season_number"]) for s in seasons]
            seasons_results = await asyncio.gather(*tasks)

            # 3. Process and aggregate episodes
            all_seasons_data = []
            all_episodes_flat = []

            for season_res in seasons_results:
                if not season_res:
                    continue

                season_num = season_res.get("season_number")
                episodes_list = []

                for ep in season_res.get("episodes", []):
                    vote_avg = ep.get("vote_average", 0.0)
                    # TMDB default for unrated is 0, let's skip/adjust or keep
                    vote_cnt = ep.get("vote_count", 0)

                    ep_item = {
                        "name": ep.get("name"),
                        "season_number": season_num,
                        "episode_number": ep.get("episode_number"),
                        "vote_average": vote_avg,
                        "vote_count": vote_cnt,
                        "air_date": ep.get("air_date"),
                        "overview": ep.get("overview"),
                        "still_url": f"https://image.tmdb.org/t/p/w500{ep.get('still_path')}" if ep.get("still_path") else None
                    }
                    episodes_list.append(ep_item)
                    all_episodes_flat.append(ep_item)

                all_seasons_data.append({
                    "season_number": season_num,
                    "name": season_res.get("name"),
                    "episodes": episodes_list
                })

            # Calculate stats
            valid_ratings = [ep for ep in all_episodes_flat if ep["vote_count"] > 0 and ep["vote_average"] > 0]
            avg_rating = 0.0
            highest_ep = None
            lowest_ep = None

            if valid_ratings:
                avg_rating = round(sum(ep["vote_average"] for ep in valid_ratings) / len(valid_ratings), 2)
                highest_ep = max(valid_ratings, key=lambda x: x["vote_average"])
                lowest_ep = min(valid_ratings, key=lambda x: x["vote_average"])

            return {
                "show": {
                    "id": tv_data.get("id"),
                    "title": tv_data.get("name"),
                    "poster_url": f"https://image.tmdb.org/t/p/w500{tv_data.get('poster_path')}" if tv_data.get("poster_path") else None,
                    "backdrop_url": f"https://image.tmdb.org/t/p/original{tv_data.get('backdrop_path')}" if tv_data.get("backdrop_path") else None,
                    "vote_average": tv_data.get("vote_average"),
                    "genres": [g.get("name") for g in tv_data.get("genres", []) if g.get("name")]
                },
                "seasons": all_seasons_data,
                "stats": {
                    "total_episodes": len(all_episodes_flat),
                    "rated_episodes": len(valid_ratings),
                    "average_rating": avg_rating,
                    "highest": highest_ep,
                    "lowest": lowest_ep
                }
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to compile episode ratings: {str(e)}")


@router.get("/movie/{movie_id}")
async def get_movie_details(movie_id: int):
    """
    Get Movie details.
    """
    url = f"{TMDB_BASE_URL}/movie/{movie_id}"
    params = get_params({"append_to_response": "credits"})
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, params=params, headers=get_headers(), timeout=10.0)
            response.raise_for_status()
            item = response.json()

            credits = item.get("credits", {})
            cast = [c["name"] for c in credits.get("cast", []) if "name" in c][:12]
            director = None
            for crew_member in credits.get("crew", []):
                if crew_member.get("job") == "Director":
                    director = crew_member.get("name")
                    break

            return {
                "id": item.get("id"),
                "title": item.get("title"),
                "original_title": item.get("original_title"),
                "media_type": "movie",
                "overview": item.get("overview"),
                "tagline": item.get("tagline"),
                "release_date": item.get("release_date"),
                "runtime": item.get("runtime"),
                "genres": [g.get("name") for g in item.get("genres", []) if g.get("name")],
                "director": director,
                "cast": cast,
                "vote_average": item.get("vote_average"),
                "vote_count": item.get("vote_count"),
                "poster_url": f"https://image.tmdb.org/t/p/w500{item.get('poster_path')}" if item.get("poster_path") else None,
                "backdrop_url": f"https://image.tmdb.org/t/p/original{item.get('backdrop_path')}" if item.get("backdrop_path") else None,
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to fetch Movie details: {str(e)}")


@router.get("/similar/{media_type}/{id}")
async def get_similar_items(media_type: str, id: int):
    """
    Fetch similar movies/tv shows from TMDB.
    """
    if media_type not in ["movie", "tv"]:
        raise HTTPException(status_code=400, detail="Invalid media type. Must be 'movie' or 'tv'.")

    url = f"{TMDB_BASE_URL}/{media_type}/{id}/similar"
    params = get_params()
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, params=params, headers=get_headers(), timeout=10.0)
            response.raise_for_status()
            data = response.json()

            results = []
            for item in data.get("results", [])[:10]:
                results.append({
                    "id": item.get("id"),
                    "title": item.get("title") or item.get("name"),
                    "media_type": media_type,
                    "overview": item.get("overview"),
                    "release_date": item.get("release_date") or item.get("first_air_date"),
                    "vote_average": item.get("vote_average"),
                    "poster_url": f"https://image.tmdb.org/t/p/w500{item.get('poster_path')}" if item.get("poster_path") else None,
                })
            return {"results": results}
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to fetch similar {media_type} items: {str(e)}")


@router.get("/top_rated")
async def get_top_rated_tv(
    genre: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    sort_by: str = Query("score_desc")
):
    """
    Get top rated TV shows using parallel fetching of TMDB top_rated pages.
    Calculates a custom weighted Bayesian score:
    Score = (vote_average * vote_count + global_avg * min_votes) / (vote_count + min_votes)
    Then applies filtering and sorting.
    Cached for performance.
    """
    global _top_rated_tv_cache
    now = time.time()

    # Serve from cache if valid
    if _top_rated_tv_cache["data"] is not None and (now - _top_rated_tv_cache["timestamp"]) < CACHE_TTL_SECONDS:
        shows = _top_rated_tv_cache["data"]
    else:
        # Fetch pages 1-12 from TMDB concurrently (~240 items)
        url = f"{TMDB_BASE_URL}/tv/top_rated"
        async with httpx.AsyncClient() as client:
            pages_to_fetch = 12
            tasks = [fetch_page(client, url, p) for p in range(1, pages_to_fetch + 1)]
            pages_results = await asyncio.gather(*tasks)

            # Flatten and deduplicate
            seen_ids = set()
            raw_shows = []
            for page_res in pages_results:
                for show in page_res:
                    show_id = show.get("id")
                    if show_id and show_id not in seen_ids:
                        seen_ids.add(show_id)
                        raw_shows.append(show)

            # Map TMDB genre IDs to English names for filtering
            # Standard TV Genres
            GENRES_MAP = {
                10759: "Action & Adventure",
                16: "Animation",
                35: "Comedy",
                80: "Crime",
                99: "Documentary",
                18: "Drama",
                10751: "Family",
                10762: "Kids",
                9648: "Mystery",
                10763: "News",
                10764: "Reality",
                10765: "Sci-Fi & Fantasy",
                10766: "Soap",
                10767: "Talk",
                10768: "War & Politics",
                37: "Western"
            }

            # Bayesian Scoring Setup
            # Global TV average rating is around 7.5, minimum votes to trust score is 1000
            GLOBAL_AVERAGE = 7.5
            MIN_VOTES = 1000

            shows = []
            for item in raw_shows:
                vote_avg = item.get("vote_average", 0.0)
                vote_cnt = item.get("vote_count", 0)

                # Bayesian Score calculation
                weighted_score = (vote_avg * vote_cnt + GLOBAL_AVERAGE * MIN_VOTES) / (vote_cnt + MIN_VOTES)
                weighted_score = round(weighted_score, 2)

                genre_ids = item.get("genre_ids", [])
                genre_names = [GENRES_MAP[gid] for gid in genre_ids if gid in GENRES_MAP]

                # Guess year from first_air_date
                first_air_date = item.get("first_air_date", "")
                year = first_air_date.split("-")[0] if first_air_date else "N/A"

                shows.append({
                    "id": item.get("id"),
                    "title": item.get("name"),
                    "original_title": item.get("original_name"),
                    "overview": item.get("overview"),
                    "release_date": first_air_date,
                    "year": year,
                    "vote_average": vote_avg,
                    "vote_count": vote_cnt,
                    "custom_score": weighted_score,
                    "poster_url": f"https://image.tmdb.org/t/p/w500{item.get('poster_path')}" if item.get("poster_path") else None,
                    "backdrop_url": f"https://image.tmdb.org/t/p/original{item.get('backdrop_path')}" if item.get("backdrop_path") else None,
                    "genres": genre_names,
                    "episode_count": int(vote_avg * 7) % 50 + 10, # Mock episode count for the list if details not loaded, or fetch dynamically later
                    "status": "Returning Series" if vote_cnt % 2 == 0 else "Ended" # Mock status
                })

            _top_rated_tv_cache["data"] = shows
            _top_rated_tv_cache["timestamp"] = now

    # Apply filters
    filtered_shows = shows
    if genre:
        filtered_shows = [s for s in filtered_shows if genre.lower() in [g.lower() for g in s["genres"]]]

    if status:
        filtered_shows = [s for s in filtered_shows if s["status"].lower() == status.lower()]

    # Apply sorting
    if sort_by == "score_desc":
        filtered_shows.sort(key=lambda x: x["custom_score"], reverse=True)
    elif sort_by == "score_asc":
        filtered_shows.sort(key=lambda x: x["custom_score"])
    elif sort_by == "rating_desc":
        filtered_shows.sort(key=lambda x: x["vote_average"], reverse=True)
    elif sort_by == "year_desc":
        filtered_shows.sort(key=lambda x: x["year"] if x["year"] != "N/A" else "0000", reverse=True)
    elif sort_by == "year_asc":
        filtered_shows.sort(key=lambda x: x["year"] if x["year"] != "N/A" else "9999")

    # Add Ranks
    for i, s in enumerate(filtered_shows):
        s["rank"] = i + 1

    return {"results": filtered_shows[:250]}


@router.get("/popular")
async def get_popular_dashboard():
    """
    Get popular TV shows, popular movies, and custom charts for the home page.
    """
    global _popular_cache
    now = time.time()

    if _popular_cache["data"] is not None and (now - _popular_cache["timestamp"]) < CACHE_TTL_SECONDS:
        return _popular_cache["data"]

    async with httpx.AsyncClient() as client:
        # Fetch popular TV shows and popular movies
        tv_url = f"{TMDB_BASE_URL}/tv/popular"
        movie_url = f"{TMDB_BASE_URL}/movie/popular"

        try:
            tv_res = await client.get(tv_url, params=get_params(), headers=get_headers(), timeout=10.0)
            movie_res = await client.get(movie_url, params=get_params(), headers=get_headers(), timeout=10.0)

            tv_results = tv_res.json().get("results", [])[:8]
            movie_results = movie_res.json().get("results", [])[:8]

            popular_tv = []
            for item in tv_results:
                popular_tv.append({
                    "id": item.get("id"),
                    "title": item.get("name"),
                    "vote_average": item.get("vote_average"),
                    "poster_url": f"https://image.tmdb.org/t/p/w500{item.get('poster_path')}" if item.get("poster_path") else None,
                    "release_date": item.get("first_air_date")
                })

            popular_movies = []
            for item in movie_results:
                popular_movies.append({
                    "id": item.get("id"),
                    "title": item.get("title"),
                    "vote_average": item.get("vote_average"),
                    "poster_url": f"https://image.tmdb.org/t/p/w500{item.get('poster_path')}" if item.get("poster_path") else None,
                    "release_date": item.get("release_date")
                })

            # Mock some beautiful custom charts (mock heatmap grids)
            # 1 = deep green, 0.8 = green, 0.6 = yellow, 0.4 = orange, 0.2 = red/blue
            custom_charts = [
                {
                    "title": "Breaking Bad",
                    "id": 1396,
                    "episodes": 62,
                    "rating": 9.5,
                    "likes": 128,
                    "creator": "walter_white",
                    "poster_url": "https://image.tmdb.org/t/p/w500/ztkUQjxyzw16x4V4WgT1euA42W9.jpg",
                    "heatmap": [
                        [0.9, 0.9, 0.85, 0.88, 0.92, 0.95, 0.97],
                        [0.85, 0.88, 0.9, 0.91, 0.93, 0.94, 0.96, 0.95],
                        [0.92, 0.93, 0.9, 0.88, 0.91, 0.92, 0.95, 0.94, 0.96, 0.98],
                        [0.93, 0.94, 0.92, 0.95, 0.94, 0.96, 0.95, 0.97, 0.96, 0.97, 0.98, 0.99, 0.99],
                        [0.94, 0.95, 0.96, 0.95, 0.97, 0.98, 0.99, 0.98, 0.97, 0.99, 0.99, 0.99, 0.99, 0.99, 0.99, 1.0]
                    ]
                },
                {
                    "title": "Game of Thrones",
                    "id": 1399,
                    "episodes": 73,
                    "rating": 9.2,
                    "likes": 98,
                    "creator": "stark_gary",
                    "poster_url": "https://image.tmdb.org/t/p/w500/1XS574n27j2CEgxf5qZg7j3yypM.jpg",
                    "heatmap": [
                        [0.9, 0.88, 0.89, 0.91, 0.9, 0.92, 0.91, 0.93, 0.95, 0.96],
                        [0.92, 0.91, 0.9, 0.89, 0.92, 0.93, 0.92, 0.94, 0.96, 0.97],
                        [0.93, 0.92, 0.94, 0.93, 0.91, 0.94, 0.93, 0.95, 0.98, 0.99],
                        [0.94, 0.93, 0.95, 0.94, 0.92, 0.96, 0.94, 0.97, 0.99, 0.99],
                        [0.92, 0.91, 0.93, 0.92, 0.91, 0.93, 0.92, 0.95, 0.97, 0.98],
                        [0.93, 0.92, 0.94, 0.93, 0.92, 0.95, 0.94, 0.98, 0.99, 0.99],
                        [0.95, 0.94, 0.93, 0.95, 0.92, 0.96, 0.97, 0.85, 0.82, 0.83],
                        [0.85, 0.83, 0.84, 0.75, 0.70, 0.45]
                    ]
                },
                {
                    "title": "Dexter",
                    "id": 1402,
                    "episodes": 96,
                    "rating": 8.2,
                    "likes": 56,
                    "creator": "bay_harbor",
                    "poster_url": "https://image.tmdb.org/t/p/w500/1e5LzWdsaq3G69z1l7f2dZ0f76.jpg",
                    "heatmap": [
                        [0.85, 0.83, 0.84, 0.86, 0.85, 0.87, 0.86, 0.88, 0.89, 0.91, 0.90, 0.92],
                        [0.86, 0.85, 0.87, 0.86, 0.88, 0.87, 0.89, 0.90, 0.91, 0.92, 0.91, 0.93],
                        [0.87, 0.86, 0.88, 0.87, 0.89, 0.88, 0.90, 0.91, 0.92, 0.93, 0.92, 0.94],
                        [0.88, 0.87, 0.89, 0.88, 0.90, 0.89, 0.91, 0.92, 0.93, 0.94, 0.93, 0.95],
                        [0.84, 0.82, 0.83, 0.82, 0.84, 0.83, 0.85, 0.84, 0.86, 0.87, 0.85, 0.83],
                        [0.83, 0.81, 0.82, 0.81, 0.83, 0.82, 0.84, 0.83, 0.85, 0.86, 0.84, 0.82],
                        [0.82, 0.80, 0.81, 0.80, 0.82, 0.81, 0.83, 0.82, 0.84, 0.85, 0.83, 0.81],
                        [0.80, 0.78, 0.79, 0.78, 0.80, 0.79, 0.81, 0.80, 0.82, 0.83, 0.75, 0.45]
                    ]
                },
                {
                    "title": "Invincible",
                    "id": 95557,
                    "episodes": 24,
                    "rating": 8.7,
                    "likes": 112,
                    "creator": "omni_man",
                    "poster_url": "https://image.tmdb.org/t/p/w500/j9uiKgwA7gD5S2Wl2x4npNntT9f.jpg",
                    "heatmap": [
                        [0.88, 0.86, 0.87, 0.89, 0.91, 0.90, 0.92, 0.96],
                        [0.87, 0.88, 0.89, 0.88, 0.91, 0.92, 0.94, 0.97],
                        [0.89, 0.90, 0.91, 0.92, 0.93, 0.94, 0.95, 0.98]
                    ]
                }
            ]

            payload = {
                "popular_tv": popular_tv,
                "popular_movies": popular_movies,
                "custom_charts": custom_charts
            }
            _popular_cache["data"] = payload
            _popular_cache["timestamp"] = now
            return payload

        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to fetch popular items: {str(e)}")
