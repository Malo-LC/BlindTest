const users = [];

function addUser({ id, name, room }) {
  name = name?.trim();
  room = room?.trim();

  if (!name || !room) return { error: "Username and room are required" };

  const existingUser = users.find((user) => user.room === room && user.name === name);
  if (existingUser) return { error: "User is taken" };

  const firstUser = users.find((user) => user.room === room);
  const noAdmin = users.every((user) => !user.admin && user.room === room);
  const admin = !firstUser || noAdmin;

  const user = { id, name, room, admin, score: 0, goodAnswer: { artist: false, song: false, title: false } };
  users.push(user);

  return { user };
}

function removeUser(id) {
  const index = users.findIndex((user) => user.id === id);
  if (index !== -1) {
    return users.splice(index, 1)[0];
  }
}

function updateUser(id, key, value) {
  const index = users.findIndex((user) => user.id === id);
  if (index !== -1) {
    users[index][key] = value;
  }
}

function getUser(id) {
  return users.find((user) => user.id === id);
}

function getUsersInRoom(room) {
  return users.filter((user) => user.room === room);
}

module.exports = { addUser, removeUser, getUser, getUsersInRoom, updateUser };
