const express = require("express");
const path = require("path");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");

const app = express();
app.use(express.json());

let db = null;

const dbPath = path.join(__dirname, "cricketMatchDetails.db");

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const convertPlayerDetailsDbObjectToResponseObject = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};

const convertMatchDetailsDbObjectToResponseObject = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};

const convertPlayerMatchScoreDbObjectToResponseObject = (dbObject) => {
  return {
    playerMatchId: dbObject.player_match_id,
    matchId: dbObject.match_id,
    playerId: dbObject.player_id,
    score: dbObject.score,
    fours: dbObject.fours,
    sixes: dbObject.sixes,
  };
};

//get players api
app.get("/players/", async (request, response) => {
  const getPlayersQuery = `
    SELECT
    * 
    FROM 
    player_Details;`;
  const playersArray = await db.all(getPlayersQuery);
  response.send(
    playersArray.map((eachPlayer_Details) =>
      convertPlayerDetailsDbObjectToResponseObject(eachPlayer_Details)
    )
  );
});

//playerId api
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `
    SELECT 
    * 
    FROM
    player_Details
    WHERE
    player_id = ${playerId};`;
  const playersArray = await db.get(getPlayerQuery);
  response.send(convertPlayerDetailsDbObjectToResponseObject(playersArray));
});

//update playerId api
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const updatePlayerQuery = `
    UPDATE
    player_details
    SET
    player_name = '${playerName}'
    WHERE
    player_id = ${playerId};`;
  await db.run(updatePlayerQuery);
  response.send("Player Details Updated");
});

//matchId api
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchQuery = `
    SELECT 
    * 
    FROM
    match_Details
    WHERE
    match_id = ${matchId};`;
  const matchArray = await db.get(getMatchQuery);
  response.send(convertMatchDetailsDbObjectToResponseObject(matchArray));
});

//list aof all matches of a playerAPI
app.get("/players/:playerID/matches/", async (request, response) => {
   const getPlayerMatchesQuery = `
    SELECT
      *
    FROM player_match_score 
      NATURAL JOIN match_details
    WHERE
      player_id = ${playerID};`;
 const matchesArray = await db.all(getMatchesQuery);
  response.send(convertPlayerMatchScoreDbObjectToResponseObject(matchesArray));
});

//list aof all matches of a playerAPI
app.get("/matches/:matchID/players/", async (request, response) => {
  const { matchID } = request.params;
  const getMatchPlayersQuery = `
    SELECT 
    * 
    FROM 
   player_match_score
    WHERE
    NATURAL JOIN player_details
    match_id = ${matchID};`;
  const matchesArray = await db.all(getMatchPlayerQuery);
  response.send(convertPlayerMatchScoreDbObjectToResponseObject(matchesArray));
});

///players/:playerId/playerScores`
app.get("/players/:playerID/playerScores/", async (request, response) => {
  const { playerID } = request.params;
  const getPlayerScoresQuery = `
SELECT
Id,
Name,
SUM(totalScore),
SUM(totalFours),
SUM(totalSixes)
FROM
matches
WHERE
player_id=${playerID};`;
  const scores = await db.get(getPlayerScoresQuery);
  response.send({
    playerId: scores["Id"],
    playerName: scores["Name"],
    totalScore: scores["SUM(totalScore)"],
    totalFours: scores["SUM(totalFours)"],
    totalSixes: scores["SUM(totalSixes)"],
  });
});

module.exports = app;
