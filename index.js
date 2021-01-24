const params = new URLSearchParams(window.location.search);
const server = params.get("server") || "futaba.pls-step-on.me:9000";
const room = params.get("room") || "master";
const specialRooms = {
    "test": ["http://futaba.pls-step-on.me/media/Gura%20doesn't%20know%20I%20exist-RXoHkAfrxzA.mp4", "http://futaba.pls-step-on.me/media/pop-on-rocks-1h.mp4"],
    "aobuta": ["http://futaba.pls-step-on.me/media/Dreaming%20Girl.mp4"],
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
let darkmode = Cookies.get("darkmode") !== "true";
let username;
let playlist = null;
let playlistIndex;
let userlist = [];
let newPlaylist = [];
const usernameInput = document.getElementById("username-input")
const okButton = document.getElementById("username-prompt").getElementsByTagName("button")[0]
const playlistSidebar = document.getElementById("playlistSidebar");
const membersSidebar = document.getElementById("membersSidebar");
usernameInput.value = Cookies.get("username") || (username = "Guest_" + Math.ceil(Math.random() * 1000));
usernameInput.select();

if (darkmode) {
    darkmode = !darkmode;
}
else{
    toggleDarkmode()
}

if (params.has("username")) {
    usernameInput.value = params.get("username");
    start();
}

function start() {
    if (usernameInput.value == "")
        return;
    if (username != usernameInput.value)
        Cookies.set("username", usernameInput.value, { sameSite: "Lax", expires: 3650 })
    username = usernameInput.value;
    document.getElementById("main-container").removeChild(document.getElementById("username-prompt"));
    let elements = document.getElementsByClassName("sidebar");
    for (let i = 0; i < elements.length; i++) {
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
    syncplayjs.set_file(vid_player.src, 0, 0);
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
    let message = "'" + user + "' " + user_event;
    toastr.info(message);
    showChat(message)
    if (user_event == "left") {
        userlist.splice(userlist.indexOf(user), 1);
    }
    else if (user_event == "joined") {
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

    let message = null;

    if (!paused && vid_player.paused) {
        message = "'" + username + "' resumes at " + position;
        vid_player.currentTime = e.detail.position;
        vid_player.play();
        toastr.info(message);
    }
    if (paused && !vid_player.paused) {
        message = "'" + username + "' paused at " + position;
        vid_player.pause();
        toastr.info(message);
    }
    if (doSeek == true) {
        message = "'" + username + "' seeked to " + position;
        window.seekFromEvent = true;
        vid_player.currentTime = e.detail.position;
        toastr.warning(message);
    }
    if (message != null){
        showChat(message);
    }
});

vid_player.addEventListener("playlistindex", function (e) {
    if (playlist == null || playlist.length == 0) {
        return;
    }
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
    vid_player.src = playlist[playlistIndex] || "";
    let selectedElement = document.getElementById("selected-entry");
    if (selectedElement != undefined)
        selectedElement.id = undefined;
    let playlistElements = document.getElementsByClassName("playlist-entry");
    playlistElements[playlistIndex].id = "selected-entry";
    toastr.info(message);
    showChat(message);
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
        playlistElement.innerHTML = "<p></p>";
        playlistElement.firstChild.textContent = getFilename(playlist[i]);
        playlistElement.addEventListener("click", playlistEntryClicked);
        playlistSidebar.appendChild(playlistElement);
    }
    toastr.info(message);
    showChat(message);
});

vid_player.addEventListener("chatmessage", function (e) {
    const message = e.detail.message;
    const senderUsername = e.detail.username;
    showChat(message, senderUsername);
})

vid_player.addEventListener("volumechange", function (e) {
    Cookies.set("volume", vid_player.volume, { sameSite: "Lax", expires: 3650 });
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

document.getElementById("edit-playlist-button").addEventListener("click", function (e) {
    const editor = document.getElementById("playlist-editor");
    const editorDiv = editor.getElementsByTagName("div")[0];
    const playlistInput = document.getElementById("playlist-input");
    const animationOptions = { duration: 350, easing: "ease-out" };
    playlistInput.value = playlist != null ? playlist.join("\n") : "";
    editor.style.display = "flex";
    editor.animate([{ "background": "rgba(0,0,0,0)" }, { "background": "rgba(0,0,0,0.75)" }], { ...animationOptions, ...{ fill: "forwards" } });
    editorDiv.animate([{ "transform": "translateY(-50vh)" }, { "transform": "translateY(0px)" }], animationOptions);
});

document.getElementById("playlist-cancel-button").addEventListener("click", closePlaylistEditor)

document.getElementById("playlist-ok-button").addEventListener("click", function (e) {
    closePlaylistEditor();
    newPlaylist = document.getElementById("playlist-input").value.split("\n");
    newPlaylist = newPlaylist.filter(element => /\S/.test(element));
    syncplayjs.sendPlaylist(newPlaylist);
})

function closePlaylistEditor() {
    const editor = document.getElementById("playlist-editor");
    const editorDiv = editor.getElementsByTagName("div")[0];
    const animationOptions = { duration: 250 };
    editorDiv.animate([{ "transform": "translateY(0px)" }, { "transform": "translateY(-50vh)" }], animationOptions);
    editor.animate([{ "background": "rgba(0,0,0,0.75)" }, { "background": "rgba(0,0,0,0)" }], { ...animationOptions, ...{ fill: "forwards" } })
        .onfinish = () => editor.style.display = "none";
}

document.getElementById("select-chat-button").addEventListener("click", function (e) {
    selectSelf(e);
    document.getElementById("playlist-sidebar-container").hidden = true;
    document.getElementById("chat-sidebar-container").hidden = false;
});

document.getElementById("select-playlist-button").addEventListener("click", function (e) {
    selectSelf(e);
    document.getElementById("chat-sidebar-container").hidden = true;
    document.getElementById("playlist-sidebar-container").hidden = false;
})

document.getElementById("chat-input").addEventListener("keyup", function (e) {
    if (e.key == "Enter")
        sendChat();
});

document.getElementById("chat-send").addEventListener("click", sendChat);

document.getElementById("dark-mode-button").addEventListener("click", toggleDarkmode)

function toggleDarkmode() {
    const head = $("head");
    if (darkmode){
        head[0].removeChild($("#dark-mode-stylesheet")[0]);
        darkmode = false;
    }
    else{
        head.append($('<link id="dark-mode-stylesheet" rel="stylesheet" href="index-dark.css">'));
        darkmode = true;
    }
    Cookies.set("darkmode", darkmode, { sameSite: "Lax", expires: 3650 })
}

function sendChat() {
    let chatInput = document.getElementById("chat-input");
    if (chatInput.value == "")
        return;
    syncplayjs.sendChat(chatInput.value);
    chatInput.value = "";
}

function selectSelf(e) {
    e.target.blur();
    document.getElementsByClassName("selected-sidebar-select-button")[0].className = "sidebar-select-button"
    e.target.className = "selected-sidebar-select-button";
}

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
    "hideMethod": "fadeOut",
    "escapeHtml": true
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

function updateUserList(list) {
    membersSidebar.innerHTML = "";
    list.forEach(user => {
        let userElement = document.createElement("div");
        userElement.className = "member";
        userElement.innerHTML = `<p></p>`;
        userElement.firstChild.textContent = user;
        membersSidebar.appendChild(userElement);
    });
}

function showChat(message, user) {
    let chatElement = document.createElement("div");
    chatElement.className = "chat-element";

    let timestamp = document.createElement("p");
    timestamp.className = "chat-timestamp"
    let date = new Date();
    timestamp.textContent = `[${date.getHours().toString().padStart(2,"0")}:${date.getMinutes().toString().padStart(2,"0")}:${date.getSeconds().toString().padStart(2,"0")}] `

    chatElement.appendChild(timestamp);
    if (user != undefined) {
        let chatUser = document.createElement("p");
        chatUser.className = "chat-username";
        chatUser.textContent = `<${user}> `
        chatElement.appendChild(chatUser);
    }

    let chatMessage = document.createElement("p");
    chatMessage.className = "chat-message";
    chatMessage.textContent = message;
    chatElement.appendChild(chatMessage);

    document.getElementById("chat-sidebar").appendChild(chatElement);
}