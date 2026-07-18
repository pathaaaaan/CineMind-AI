import argparse

import pandas as pd
from sqlalchemy.dialects.postgresql import insert

from app.db.session import SessionLocal
from app.models.movie import Movie
from app.preprocessing.notebook_adapter import normalize_movie_row


def ingest(csv_path: str) -> None:
    df = pd.read_csv(csv_path)
    records = [normalize_movie_row(row) for _, row in df.iterrows()]
    with SessionLocal() as db:
        for record in records:
            statement = insert(Movie).values(**record)
            statement = statement.on_conflict_do_update(
                index_elements=[Movie.tmdb_id],
                set_={key: value for key, value in record.items() if key != "tmdb_id"},
            )
            db.execute(statement)
        db.commit()


def main() -> None:
    parser = argparse.ArgumentParser(description="Ingest movie CSV into PostgreSQL")
    parser.add_argument("csv_path")
    args = parser.parse_args()
    ingest(args.csv_path)


if __name__ == "__main__":
    main()

