//designed to be run in a nodejs enviroment

const request = require('superagent');      //make requests
const fs = require('fs');                   // filesystem
const fsPromises = fs.promises;             //promises module
const firebase = require('firebase-admin'); //communicate with a database
const { setIntervalAsync } = require('set-interval-async/fixed');   //async setInterval

const serviceAccount = require('./spotify-overwatch-firebase-adminsdk-wqz65-47d0d4083e.json');  //used for firebase

const CURRENT_VERSION = "0.0.1B";    //current application version

async function main() {
    //reset global stuff
    playlist_objects = [], global_playlist_tracks = [];
    CURRENTLY_RUNNING = true;
    try {
        /*
        let new_session = database.ref('playlistcombininator/sessions').push();
        new_session.set({
            sessionTimestamp:new Date().getTime(),
            sessionID:new_session.key,
            //sessionStatus:"pending",
            spotifyUID:user_credentials.uid,
            userAgent: navigator.userAgent
        }, function (error) {
            if(error) console.log("Firebase error", error);
            else console.log("Firebase data written successfully");
        });
        */
        console.log("retrieving user playlists...");
        await getUserPlaylists();
        console.log("finished retrieving user playlists!", playlist_objects);
        //now we need to retrieve a random track from each album
        console.log("retrieving songs from each playlist...");
        await getTracksFromPlaylists(playlist_objects);
        console.log("finished retrieving songs from each playlist!", global_playlist_tracks);

        console.log("filtering songs based off user's options...");
        //run checks on the track array
        let filtered_tracks = filterTracks(global_playlist_tracks);
        console.log("finished filtering songs", filtered_tracks);

        //time to add the songs to the playlist
        //first, create the playlist, storing the returned obj locally:
        console.log("creating new playlist...");
        progressBarHandler({current_operation:1, total_operations:2, stage:4});
        //var is intentional so it can be used in catch block
        var playlist = await createPlaylist({
            name: playlist_title,
            description: "A combination of all my other playlists made using www.glassintel.com/elijah/programs/playlistcombininator"
        });
        console.log("new playlist succesfully created");
        progressBarHandler({current_operation:2, total_operations:2, stage:4});
        //prep songs for addition (make sure there aren't any extras and put them in subarrays of 100)
        let prepped_uri_array = prepTracksForPlaylistAddition(filtered_tracks);
        console.log("finished preparing songs for addition to the playlist!", prepped_uri_array);
        //add them to the playlist
        console.log("adding songs to playlist...");
        await addTracksToPlaylistHandler(playlist, prepped_uri_array);
        console.log("finished adding songs to playlist!");
    } catch (e) {
        console.log("try-catch err", e);
        alert("The program enountered an error");
        //"delete" the playlist we just created
        //playlists are never deleted on spotify. see this article: https://github.com/spotify/web-api/issues/555
        deleteSpotify(`https://api.spotify.com/v1/playlists/${playlist.id}/followers`, function (ok, res) { //yay nesting callbacks!!
            if (ok) console.log("playlist succesfully deleted");
            else console.log(`unable to delete playlist, error: ${res}`);
        });
    } finally {
        progressBarHandler({stage: "done"});
        CURRENTLY_RUNNING = false;
        console.log("execution finished!");
    }

}