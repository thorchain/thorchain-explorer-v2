const express = require("express");
const app = express();

const axios = require("axios");
const cors = require("cors");

const requests = require('./middleware.api');

const corsOptions = {
  origin: "*",
};

app.use(express.json());
app.use(cors(corsOptions));

function createExpressApp() {
  var data = {
    dashboardData: {
      // fetcher: requests.dashboardData,
      updateEvery: 5 /*seconds*/,
    },
  };

  /* Update all the values at server init */
  setTimeout(async () => {
    for (var key of Object.keys(data)) {
      (() => {
        var record = data[key];
        record["lastUpdate"] = Date.now();

        record
          .fetcher()
          .then((res) => {
            record["value"] = res;
            record["err"] = null;
          })
          .catch((rej) => {
            record["value"] = null;
            record["err"] = rej;
          });
      })();
    }
  }, 0);

  setInterval(async () => {
    for (var key of Object.keys(data)) {
      var record = data[key];

      /* update the record if it's the time */
      if (Date.now() - record.lastUpdate >= record.updateEvery * 1000) {
        (() => {
          var currentKey = key;
          var record = data[key];
          record["lastUpdate"] = Date.now();

          record
            .fetcher()
            .then((res) => {
              if (res) record["value"] = res;
              record["err"] = null;
            })
            .catch((rej) => {
              record["value"] = null;
              record["err"] = rej;
              console.error(currentKey + ": failed");
              console.error(rej);
            });
        })();
      }
    }
  }, 2000);

  app.get("/api/:key", async (req, res) => {
    try {
      var key = req.params.key;
      if (key in data) {
        if (!data[key].value) {
          try {
            data[key]
              .fetcher()
              .then((res) => {
                data[key].value = res;
                data[key]["lastUpdate"] = Date.now();
              })
              .catch((e) => {
                throw new Error("Can't get the data from backend server!");
              });
          } catch (e) {
            return res
              .status(404)
              .json({ msg: "external api not responding", key });
          }
        }

        var value = data[key].value;
        res.setHeader(
          "Cache-Control",
          "s-maxage=60, stale-while-revalidate=119"
        );
        res.json(value);
      } else {
        res.status(404).json({ msg: "Static data Not found", key });
      }
    } catch (e) {
      console.error(e);
    }
  });

  app.get("/api/*", (req, res) => {
    res.status(404).send({ msg: "Not found", url: req.url });
  });

  return app;
}

module.exports = createExpressApp();
