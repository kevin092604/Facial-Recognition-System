import os
from urllib.parse import quote_plus
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, DeclarativeBase

load_dotenv()

DB_SERVER = os.getenv("DB_SERVER", "localhost")
DB_NAME = os.getenv("DB_NAME", "UNAH_AccessControl")
DB_USER = os.getenv("DB_USER", "sa")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
DB_DRIVER = os.getenv("DB_DRIVER", "ODBC Driver 17 for SQL Server")
DB_TRUSTED = os.getenv("DB_TRUSTED_CONNECTION", "no")

driver_encoded = DB_DRIVER.replace(" ", "+")

if DB_TRUSTED.lower() in ("yes", "true", "1"):
    connection_string = (
        f"mssql+pyodbc://{DB_SERVER}/{DB_NAME}"
        f"?driver={driver_encoded}"
        f"&trusted_connection=yes"
    )
else:
    connection_string = (
        f"mssql+pyodbc://{quote_plus(DB_USER)}:{quote_plus(DB_PASSWORD)}@{DB_SERVER}/{DB_NAME}"
        f"?driver={driver_encoded}"
    )

engine = create_engine(
    connection_string,
    echo=False,
    pool_pre_ping=True,
    pool_recycle=3600,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
