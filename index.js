const params = new URLSearchParams(window.location.search);
const server = params.get("server") || "futaba.pls-step-on.me:9000";
const room = params.get("room") || "master";
const specialRooms = {
    "test" : ["http://futaba.pls-step-on.me/media/Gura%20doesn't%20know%20I%20exist-RXoHkAfrxzA.mp4", "http://futaba.pls-step-on.me/media/pop-on-rocks-1h.mp4"],
    "bakemonogatari": []
}
for (let i = 1; i <= 15; i++) {
    specialRooms.bakemonogatari.push(encodeURI(`http://futaba.pls-step-on.me/media/bakemonogatari/Bakemonogatari - ${i}.mp4`));
}

// function pick() {
//     $("#fpicker").click();
// }
var vid_player = $("#node")[0];
vid_player.volume = Cookies.get("volume") || 0.3;
vid_player.initialized = false;

// var username = null;
// while (username == null) {
//     username = prompt("Pick a name", "Guest_" + Math.ceil(Math.random() * 1000));
// }

// $("#fpicker").change(function (e) {
//     $("#node").attr("src", window.URL.createObjectURL($("#fpicker")[0].files[0]));
//     window.filename = $("#fpicker")[0].files[0].name;
//     window.filesize = $("#fpicker")[0].files[0].size;
// });
let username;
let playlist = null;
let playlistIndex;
let userlist = [];
const usernameInput = document.getElementById("username-input")
const okButton = document.getElementById("username-prompt").getElementsByTagName("button")[0]
const playlistSidebar = document.getElementById("playlistSidebar");
const membersSidebar = document.getElementById("membersSidebar");
usernameInput.value = Cookies.get("username") || (username = "Guest_" + Math.ceil(Math.random() * 1000));
usernameInput.select();

if (params.has("username")){
    usernameInput.value = params.get("username");
    start();
}

function start() {
    if (usernameInput.value == "")
        return;
    if (username != usernameInput.value)
        Cookies.set("username", usernameInput.value, {sameSite: "Lax"})
    username = usernameInput.value;
    document.getElementById("main-container").removeChild(document.getElementById("username-prompt"));
    let elements = document.getElementsByClassName("sidebar");
    for (let i = 0; i < elements.length; i++){
        elements[i].style.display = "block";
    }
    vid_player.style.display = "block";
    // playlistSidebar.style.display = "block";
    // membersSidebar.style.display = "block";

    function onconnect(e) {
        if (e.connected) {
            toastr.success("Connected!");
            username = e.username;
        }
    }

    window.syncplayjs = new SyncPlay({
        name: username,
        room: room,
        url: server
    }, onconnect, vid_player);
    var getterFn = {
        is_paused: function (vid_player) {
            return vid_player.paused;
        },
        get_position: function (vid_player) {
            return vid_player.currentTime;
        }
    };
    syncplayjs.setStateGetters(getterFn, vid_player);
    syncplayjs.connect();
}

okButton.addEventListener("click", start);
usernameInput.addEventListener("keyup", function (e) {
    if (e.key == "Enter") {
        start()
    }
})

$(vid_player).on("loadeddata", function (e) {
    vid_player.initialized = true;
    syncplayjs.set_file(vid_player.src, vid_player.duration, 0);
    document.title = getFilename(vid_player.src);
});

$(vid_player).on("listusers", function (e) {
    syncplayjs.seeked();
    userlist = [];
    for (const user in e.detail) {
        userlist.push(user);
    }
    userlist.sort();
    updateUserList(userlist);
});

$(vid_player).on("userlist", function (e) {
    const user = e.detail.user;
    const user_event = e.detail.evt;
    toastr.info("'" + user + "' " + user_event);
    if (user_event == "left"){
        userlist.splice(userlist.indexOf(user), 1);
    }
    else if (user_event == "joined"){
        userlist.push(user);
        userlist.sort();
    }
    updateUserList(userlist);
});

window.seekFromEvent = false;

$(vid_player).on("fileupdate", function (e) {
    var username = Object.keys(e.detail.user);
    var duration = e.detail.user[username].file.duration; // seconds
    var filename = e.detail.user[username].file.name;
    var filesize = e.detail.user[username].file.size; // bytes
});

$(vid_player).on("userevent", function (e) {
    var username = e.detail.setBy;
    var position = e.detail.position;
    var paused = e.detail.paused;
    var doSeek = e.detail.doSeek

    if (!paused && vid_player.paused) {
        var message = "'" + username + "' resumes at " + position;
        vid_player.currentTime = e.detail.position;
        vid_player.play();
        toastr.info(message);
    }
    if (paused && !vid_player.paused) {
        var message = "'" + username + "' paused at " + position;
        vid_player.pause();
        toastr.info(message);
    }
    if (doSeek == true) {
        var message = "'" + username + "' seeked to " + position;
        window.seekFromEvent = true;
        vid_player.currentTime = e.detail.position;
        toastr.warning(message);
    }
});

vid_player.addEventListener("playlistindex", function (e) {
    playlistIndex = e.detail.index;
    if (playlist[playlistIndex] == vid_player.src) {
        return;
    }
    let username = e.detail.user;
    let message = `'${username}' changed playlist video`;
    if (typeof (playlistIndex) != "number" || !(0 <= playlistIndex && playlistIndex < playlist.length)) {
        playlistIndex = 0;
        window.syncplayjs.sendPlaylistIndex(playlistIndex);
    }
    vid_player.initialized = false;
    vid_player.src = playlist[playlistIndex];
    let selectedElement = document.getElementById("selected-entry");
    if (selectedElement != undefined)
        selectedElement.id = undefined;
    let playlistElements = document.getElementsByClassName("playlist-entry");
    playlistElements[playlistIndex].id = "selected-entry";
    toastr.info(message);
});

vid_player.addEventListener("playlistchanged", function (e) {
    if (arraysEqual(e.detail.files, playlist))
        return;
    let username = e.detail.user;
    playlist = e.detail.files;
    let message = `'${username}' updated the playlist content`;
    if (!playlist.length && specialRooms.hasOwnProperty(room)) {
        playlist = specialRooms[room];
        window.syncplayjs.sendPlaylist(playlist);
        window.syncplayjs.sendPlaylistIndex(0);
    }
    playlistSidebar.innerHTML = "";
    for (let i = 0; i < playlist.length; i++) {
        let playlistElement = document.createElement("div");
        playlistElement.className = "playlist-entry";
        playlistElement.playlistIndex = i;
        playlistElement.innerHTML = `<p>${getFilename(playlist[i])}</p>`;
        playlistElement.addEventListener("click", playlistEntryClicked);
        playlistSidebar.appendChild(playlistElement);
    }
    toastr.info(message);
});

vid_player.addEventListener("chatmessage", function(e){
    let message = e.detail.message;
    let senderUsername = e.detail.username;
    console.log(message, senderUsername);
})

vid_player.addEventListener("volumechange", function (e){
    Cookies.set("volume", vid_player.volume, {sameSite: "Lax"});
});

$(vid_player).on("seeked", function (e) {
    if (!window.seekFromEvent) {
        syncplayjs.seeked();
    }
    window.seekFromEvent = false;
});

$(vid_player).on("play", function (e) {
    syncplayjs.playPause();
});

$(vid_player).on("pause", function (e) {
    syncplayjs.playPause();
});

toastr.options = {
    "closeButton": true,
    "debug": false,
    "newestOnTop": true,
    "progressBar": true,
    "positionClass": "toast-top-right",
    "preventDuplicates": true,
    "showDuration": "30",
    "hideDuration": "1000",
    "timeOut": "2000",
    "extendedTimeOut": "1000",
    "showEasing": "swing",
    "hideEasing": "linear",
    "showMethod": "fadeIn",
    "hideMethod": "fadeOut"
}

function arraysEqual(a, b) {
    if (a === b) return true;
    if (a == null || b == null) return false;
    if (a.length !== b.length) return false;

    for (var i = 0; i < a.length; ++i) {
        if (a[i] !== b[i]) return false;
    }
    return true;
}

function getFilename(url) {
    let filename = url.split("/").pop();
    filename = filename.substring(0, filename.lastIndexOf("."));
    return decodeURI(filename);
}

function playlistEntryClicked(e) {
    let source = e.srcElement;
    if (source.tagName != "DIV") {
        source = source.parentElement;
    }
    syncplayjs.sendPlaylistIndex(source.playlistIndex)
}

function updateUserList(list){
    membersSidebar.innerHTML = "";
    list.forEach(user => {
        let userElement = document.createElement("div");
        userElement.className = "member";
        userElement.innerHTML = `<p>${user}</p>`;
        membersSidebar.appendChild(userElement);
    });
}