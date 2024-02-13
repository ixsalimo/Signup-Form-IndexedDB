"use strict";

// Get DOM elements
const Form = document.querySelector("form"),
  TableBody = document.querySelector("table tbody");

// IndexedDB Database
let DB = null;

function createTX (storeName , mode) {
  const TX = DB.transaction(storeName , mode);

  TX.onerror = (err) => console.error(err);
  
  return TX;
};

function clearInputs () {
  document.querySelectorAll("form input").forEach(input => input.value = null);
};

function insertUsersIntoTable() {
  // Get users from DB and insert them into the table
  const UsersStoreTX = createTX("users" , "readonly");

  let usersStore = UsersStoreTX.objectStore("users"),
    getUsersRequest = usersStore.getAll();

  getUsersRequest.onerror = (err) => console.error(err);

  getUsersRequest.onsuccess = (e) => {
    let users = e.target.result;
    if (users) {
      TableBody.innerHTML = null;

      let tableRow = null;

      users
        .sort(
          (previuosUser, currentUser) =>
            previuosUser.createdAt - currentUser.createdAt
        )
        .forEach(function (user) {
          tableRow = `
              <tr>
                  <td>${user.username}</td>
                  <td>${user.email}</td>
                  <td>${user.password}</td>
                  <td>${user.createdAt.getFullYear()} - ${user.createdAt.getMonth()} - ${user.createdAt.getDate()}</td>
                  <td>
                  <button data-action="delete-user" data-userID="${user.id}">Delete</button>
                  </td>
              </tr>
              `;
          TableBody.insertAdjacentHTML("beforeend", tableRow);
        });
    }
  };
}

function generateUser(username, email, password) {
  return {
    id: Math.trunc(Math.random() * 1e6),
    username: username,
    email: email,
    password: password,
    createdAt: new Date(),
  };
}

function deleteUser(userID) {
  // Delete user by its ID
  if (userID) {
    const UsersStoreTX = createTX("users" , "readwrite");

    let usersStore = UsersStoreTX.objectStore("users"),
      deleteUserRequest = usersStore.delete(Number(userID));

    deleteUserRequest.onerror = (err) => console.error(err);

    deleteUserRequest.onsuccess = () => {
      insertUsersIntoTable();
    };
  }
}

window.addEventListener("load", function () {
  const IDBRequest = indexedDB.open("site");

  IDBRequest.onerror = (err) => console.error(err);

  IDBRequest.onsuccess = (e) => {
    DB = e.target.result;
    insertUsersIntoTable();
  };

  IDBRequest.onupgradeneeded = function (e) {
    let DB = e.target.result;
    // Create users store if it not exist
    if (!DB.objectStoreNames.contains("users")) {
      DB.createObjectStore("users", { keyPath: "id" });
    }
  };
});

Form.addEventListener("submit", function (e) {
  e.preventDefault();

  let username = document
      .querySelector("form input[name='username']")
      .value.trim(),
    email = document.querySelector("form input[name='email']").value.trim(),
    password = document
      .querySelector("form input[name='password']")
      .value.trim();

  if (username && email && password) {
    const UsersStoreTX = createTX("users" , "readwrite");

    let usersStore = UsersStoreTX.objectStore("users");

    let addUserRequest = usersStore.add(
      generateUser(username, email, password)
    );

    addUserRequest.onerror = (err) => console.error(err);

    addUserRequest.onsuccess = () => {
      insertUsersIntoTable();
      clearInputs();
    };
  }
});

TableBody.addEventListener("click", function (e) {
  let target = e.target;
  if (target.tagName == "BUTTON") {
    if (target.dataset.action == "delete-user") {
      let userID = target.dataset.userid;

      deleteUser(userID);
    }
  }
});