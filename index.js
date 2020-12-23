function pick() {
    $("#fpicker").click();
}
var vid_player = $("#node")[0];

var username = null;
while (username == null) {
    username = prompt("Pick a name", "Guest_" + Math.ceil(Math.random() * 1000));
}
document.title = username;

$("#fpicker").change(function (e) {
    $("#node").attr("src", window.URL.createObjectURL($("#fpicker")[0].files[0]));
    window.filename = $("#fpicker")[0].files[0].name;
    window.filesize = $("#fpicker")[0].files[0].size;
});
vid_player.volume = 0.3;
$(vid_player).on("loadeddata", function (e) {
    $("#fpicker-div").hide();
    $("#node").show();

    function onconnect(e) {
        if (e.connected) {
            toastr.success("Connected!");
            syncplayjs.set_file(filename, vid_player.duration, filesize);
        }
    }

    window.syncplayjs = new SyncPlay({
        name: username,
        room: document.location.hash || "test",
        url: "127.0.0.1:9000"
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

$(vid_player).on("seeked", function (e) {
    if (!window.seekFromEvent) {
        syncplayjs.seeked();
    }
    window.seekFromEvent = false;
});

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