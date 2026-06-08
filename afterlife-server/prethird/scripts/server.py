from __future__ import annotations
import logging, os
from aiohttp import web
import config
from signaling import make_app

logging.basicConfig(level=os.environ.get("PRETHIRD_LOG_LEVEL", "INFO"),
                    format="%(asctime)s %(levelname)s %(name)s %(message)s")

def main() -> None:
    app = make_app()
    web.run_app(app, host=config.BIND, port=config.PORT)

if __name__ == "__main__":
    main()
