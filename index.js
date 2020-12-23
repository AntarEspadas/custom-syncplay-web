const server = "futaba.pls-step-on.me:9000";
const room = "master"
const video = "http://futaba.pls-step-on.me/media/pop-on-rocks-1h.mp4";

// function pick() {
//     $("#fpicker").click();
// }
var vid_player = $("#node")[0];
vid_player.volume = 0.3;
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
let username = null;
let usernameInput = document.getElementById("username-input")
let okButton = document.getElementById("username-prompt").getElementsByTagName("button")[0]
usernameInput.value = "Guest_" + Math.ceil(Math.random() * 1000);

function start() {
    if (usernameInput.value == "")
        return;
    username = usernameInput.value;
    document.getElementById("main-container").removeChild(document.getElementById("username-prompt"));
    vid_player.style.display = "block";
    document.title = username;

    function onconnect(e) {
        if (e.connected) {
            toastr.success("Connected!");
            // syncplayjs.set_file(filename, vid_player.duration, filesize);
            vid_player.src = video;
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
usernameInput.addEventListener("keyup", function(e) {
    if(e.key == "Enter"){
        start()
    }
})

$(vid_player).on("loadeddata", function (e) {
    console.log("loadeddata")
    vid_player.initialized = true;
});

$(vid_player).on("listusers", function (e) {
    syncplayjs.seeked();
    for (var i = 0; i < Object.keys(e.detail).length; i++) {
        var user = Object.keys(e.detail)[i];
        if (user == username) {
            continue;
        }
        var filename = e.detail[user].file.name;
        var filesize = e.detail[user].file.size; // bytes
        var file_duration = e.detail[user].file.duration; // seconds
    }
});

$(vid_player).on("userlist", function (e) {
    var user = e.detail.user;
    var user_event = e.detail.evt;
    toastr.info("'" + user + "' " + user_event);
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

vid_player.addEventListener("playlistindex", function(e){
    let username = e.detail.user;
    let message = `'${username}' changed playlist video`;
    toastr.info(message);
});

vid_player.addEventListener("playlistchanged", function(e){
    let username = e.detail.user;
    let message = `'${username}' changed playlist content`;
    toastr.info(message);
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