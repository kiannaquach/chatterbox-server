// YOUR CODE HERE:

app = {

  server: "http://127.0.0.1:3000/classes/messages",

  newMessageAlertShown: false,

  messageList: [],

  lastRawFetchedData: [],

  roomDictionary: {},

  init: () => {
    app.fetch(true);
  },

  send: (message) => {
    message.emoji="haha"
    console.log('data sending', JSON.stringify(message));

    $.ajax({
      // This is the url you should use to communicate with the parse API server.
      url: 'http://127.0.0.1:3000/classes/messages',
      type: 'POST',
      contentType: 'application/json',
      data: JSON.stringify(message),
      success: function (data) {
        console.log('chatterbox: Message sent');
        console.log(data);
        let updatedMessage = {};
        _.extend(updatedMessage, message);
        _.extend(updatedMessage, data);
        app.messageList.unshift(updatedMessage);
        app.lastRawFetchedData.unshift(updatedMessage);
        app.renderMessage(updatedMessage, false);
        app.showSendingMessageStatus("success", "Message sent successfully");
      },
      error: function (data) {
        // See: https://developer.mozilla.org/en-US/docs/Web/API/console.error
        console.error('chatterbox: Failed to send message', data);
      }
    })
  },

  fetch: (firstTime=false) => {
    $.ajax({
      // This is the url you should use to communicate with the parse API server.
      url: "http://127.0.0.1:3000/classes/messages",
      type: 'GET',
      contentType: 'application/json',
      // data: { order: "-createdAt" },
      success: function (data) {
        // console.log('fetch worked!');
        console.log(data.results);
        data = JSON.parse(data)
        data = data.results;


        console.log(data[0].objectId);
        if (app.lastRawFetchedData.length>0 && data[0].objectId!==app.lastRawFetchedData[0].objectId) {

          // if not firstTime fetching, show new message alert
          if (!firstTime) {
            console.log("NEW MESSAGE AVAILABLE");
            if (!app.newMessageAlertShown) {
              app.newMessageAlertShown= true;
              var newAlert = $('<div class="alert alert-primary" id="new-alert">New messages available </div>')
              var newAlertRefresh = $('<span class="new-alert-refresh"></span>');
              var refreshButton = $('<button class="btn btn-primary btn-sm id="new-alert-refresh-btn"> Refresh <i class="fa fa-refresh" aria-hidden="true"></i></button>');
              refreshButton.on("click", ()=> {
                var roomname = $('#roomSelect').val();
                console.log("refresh roomname", roomname);
                app.renderRoomContent(roomname);
              });
              newAlertRefresh.append(refreshButton);
              newAlert.append(newAlertRefresh);

              $('#chats').prepend(newAlert);
            }
          }

        }
        app.lastRawFetchedData=data;
          // app.clearMessages();

          // var roomObj = {};
          if (!firstTime) {
            app.messageList=[];
          }
          data.forEach(message => {
            if (message.username && message.text) {
              if (!app.roomDictionary[message.roomname]) {
                app.roomDictionary[message.roomname] = {inRoomNameList: false};
              }
              app.messageList.push(message);
              if (firstTime) {
                app.renderMessage(message)
              }
            }
          });

          for (let roomname in app.roomDictionary) {
            console.log("app.roomDictionary", app.roomDictionary);
            if (roomname !== "undefined" && roomname !== "" && roomname !== "null" && roomname.toLowerCase() !== "all" && roomname.toLowerCase() !== "all rooms" ) {
              if (!app.roomDictionary[roomname].inRoomNameList) {
                app.addToRoomList(roomname)
                console.log("app.roomDictionary[roomname]", app.roomDictionary[roomname]);
                app.roomDictionary[roomname].inRoomNameList=true;
              }
            }
          }

      },

      error: function (data) {
        console.error('chatterbox: Failed to fetch message', data);
      }
    });
  },

  clearMessages: () => {
    $('#chats').empty();
  },

  renderMessage: (messageData, append=true) => {
    // console.log(messageData);
    var node = $('<div>');
    node.addClass("chat card border border-info my-2 p-3");
    // node.addClass("card");

    var userNode = $('<div>');
    userNode.addClass('username font-weight-bold');
    userNode.text(messageData.username);
    userNode.on('click', function () {
      app.handleUsernameClick(messageData.username);
    })

    // var dateNode = $('<div>');
    // dateNode.addClass('date');
    // dateNode.text(messageData.createdAt);

    var messageNode = $('<div>');
    messageNode.addClass('message text-muted');
    messageNode.text(messageData.text);


    node.append(userNode);
    node.append(messageNode);
    // node.append(dateNode);

    if (append) {
      $('#chats').append(node);
    } else {
      $('#chats').prepend(node);
    }

  },

  renderRoomContent: (roomname) => {
    app.clearMessages();
    if (roomname === "all") {
      app.messageList.forEach(message => app.renderMessage(message));
    } else {
      app.messageList.filter(message => roomname===message.roomname).forEach(message => app.renderMessage(message));
    }
  },

  renderRoom: (roomname) => {
    $('#roomSelect').append($(`<option class="roomOption" value=${roomname}>${roomname}</option>`))
  },

  handleUsernameClick: (username) => {
    console.log(`${username} clicked`);
  },

  handleSubmit: (data) => {
    if (data.text) {
      app.send(data);
    } else {
      app.showSendingMessageStatus("warning", "Message can't be empty");
    }
  },

  showAlert: () => {
    alert("alert something");
  },

  refresh: (roomname) => {
    app.clearMessages();
    app.renderRoomContent(roomname);
  },

  showSendingMessageStatus(alertType="danger", alertMessage="Error: Something went wrong!") {
    var node = $('<div id="message-sent-status" class="alert"></div>');

    node.text(alertMessage)
    node.addClass(`alert-${alertType}`);
    $("#chats").prepend(node);
    $("#chats").prepend($("#new-alert"));
    setTimeout(() => {
      $("#message-sent-status").remove();
    },5000)
  }
}

$(document).ready(function () {
  app.init()

  $('#send').on("submit", function (event) {
    event.preventDefault()

    var username = window.location.search.split("=")[1];
    console.log('USERNAME', username);

    var text = $("#message").val();
    console.log('TEXT', text);

    var roomSelected = $("#roomSelect").val();
    console.log('ROOM', roomSelected.toLowerCase());
    if (!roomSelected || roomSelected.toLowerCase() === 'undefined' || roomSelected.toLowerCase() === "null" || roomSelected.toLowerCase() === "all") {
      roomSelected = undefined;
    }

    var messageObj = {
      username,
      text,
      roomname: roomSelected+""
    }
    app.handleSubmit(messageObj);
    $("#message").val('')
  })

  // NEW ROOM REQUEST

  var newRoomName;
  $("#roomSelect").on("change", ()=> {

    if ($("#roomSelect").val() === "new") {
      var newRoomName;
      while ($("#roomSelect").val() === "new" && !newRoomName) {
          newRoomName= prompt("Enter new room name");
          console.log('newRoomName', newRoomName);
          $("#roomSelect").val("all")
      }

      if (newRoomName) {
        $("#roomSelect").append($(`<option val=${newRoomName}>${newRoomName}</option>`))
        $("#roomSelect").val(`${newRoomName}`);
        app.clearMessages();
      }
    } else {
      app.renderRoomContent($("#roomSelect").val());
    }
  })


  setInterval(() => {
    app.fetch(false);
  }, 10000);

  $("#logo-brand").on("click", () => {
    console.log("logo clicked");
    app.renderRoomContent("all");
  })



})
