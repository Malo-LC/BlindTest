const http = require("http");
const express = require("express");
const cors = require("cors");
const { Server } = require("socket.io");
const { addUser, removeUser, getUser, getUsersInRoom, updateUser } = require("./users");
const { addMusique, getMusiques, clearRoom } = require("./musicHistory");
const { getNextSong, setPlaylist } = require("./playlist");
const router = require("./router");
const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(router);
app.use(express.json());

function nextSong(room) {
  const video = getNextSong(room);
  console.log(video);
  if (!video) {
    io.to(room).emit("message", {
      user: "Console",
      text: "La playlist est vide, partie terminée !",
    });
    return;
  }
  addMusique({
    nom: video.title,
    photo: video.thumbnail,
    room: room,
  });
  io.to(room).emit("setUrl", {
    URL: video.videoId,
    title: video.title,
  });
  io.to(room).emit("timer30");
}

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

function resetVoteOfRoom(room) {
  const users = getUsersInRoom(room);
  users.forEach((user) => {
    updateUser(user.id, "goodAnswer", false);
  });
}

io.on("connect", (socket) => {
  socket.on("join", async ({ name, room }, callback) => {
    const { error, user } = addUser({ id: socket.id, name, room });
    if (error) {
      return callback(error);
    }

    socket.emit("message", {
      user: "Console",
      text: `${user.name}, bienvenue dans la salle ${user.room} !`,
    });

    socket.broadcast.to(user.room).emit("message", {
      user: "Console",
      text: `${user.name} s'est connecté !`,
    });

    socket.join(user.room);

    io.to(user.room).emit("roomData", {
      room: user.room,
      users: getUsersInRoom(user.room),
    });

    callback(user);
  });

  socket.on("sendMessage", (message, callback) => {
    const user = getUser(socket.id);

    io.to(user.room).emit("message", { user: user.name, text: message });
    io.to(user.room).emit("roomData", {
      room: user.room,
      users: getUsersInRoom(user.room),
    });

    callback();
  });

  socket.on("goodAnswer", async () => {
    const user = getUser(socket.id);
    updateUser(user.id, "score", (user.score || 0) + 1);
    updateUser(user.id, "goodAnswer", true);

    const users = getUsersInRoom(user.room);
    io.to(user.room).emit("roomData", { users });

    const verify = users.every((user) => user.goodAnswer === true);
    if (verify) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      resetVoteOfRoom(user.room);
      io.to(user.room).emit("roomData", { users, musicHistory: getMusiques(user.room) });
      nextSong(user.room);
    }
  });

  socket.on("readyToPlay", () => {
    const user = getUser(socket.id);
    io.to(user.room).emit("timer30");
  });

  socket.on("start", async ({ playlistId }, callback) => {
    const user = getUser(socket.id);

    if (user.admin) {
      const resPlaylist = await setPlaylist(playlistId || undefined, user.room);
      if (resPlaylist?.error) return callback(resPlaylist.error);
      resetVoteOfRoom(user.room);
      const users = getUsersInRoom(user.room);
      io.to(user.room).emit("roomData", { users, musicHistory: getMusiques(user.room) });
      nextSong(user.room);
    }
  });

  socket.on("putUrl", () => {
    const user = getUser(socket.id);

    if (user.admin) {
      resetVoteOfRoom(user.room);
      const users = getUsersInRoom(user.room);
      io.to(user.room).emit("roomData", { users, musicHistory: getMusiques(user.room) });
      nextSong(user.room);
    }
  });

  socket.on("disconnect", () => {
    const user = removeUser(socket.id);
    if (user) {
      io.to(user.room).emit("message", {
        user: "Console",
        text: `${user.name} a quitté la salle`,
      });

      const users = getUsersInRoom(user.room);
      if (users?.length > 0) {
        io.to(user.room).emit("roomData", { users });
      } else {
        clearRoom(user.room);
      }
    }
  });
});

server.listen(process.env.PORT || 5000, () => console.log("server has started on port : 5000"));
