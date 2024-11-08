import { backendURL, checkOrgInfoStatus } from "../utils/utils.js";

const form_login = document.getElementById("form_login");
const togglePassword = document.getElementById("togglePassword");
const passwordInput = document.getElementById("password");

togglePassword.addEventListener("click", () => {
  const type = passwordInput.getAttribute("type") === "password" ? "text" : "password";
  passwordInput.setAttribute("type", type);
  togglePassword.innerHTML = type === "password" 
    ? `<img src="assets/icon/eye-slashed.png" alt="Show Password" width="17px" class="opacity-50" />` 
    : `<img src="assets/icon/eye.png" alt="Hide Password" width="17px" />`;
});

form_login.onsubmit = async (e) => {
  e.preventDefault();

  document.querySelector("#form_login button").disabled = true;
  document.querySelector("#form_login button").innerHTML = `<div class="spinner-border" role="status" width="30px">
                                                              </div><span class="ms-2">Loading...</span>`;

  const formData = new FormData(form_login);

  const loginResponse = await fetch(backendURL + "/api/login", {
    method: "POST", 
    headers: {
      Accept: "application/json",
      Authorization: "Bearer " + localStorage.getItem("token"),
    },
    body: formData,
  }); 

  if (loginResponse.ok) {
    const json = await loginResponse.json();
    localStorage.setItem("token", json.token);
    form_login.reset();
    checkOrgInfoStatus();
  } else {
    const json = await loginResponse.json();
    alert( json.message);
  }

  document.querySelector("#form_login button").disabled = false;
  document.querySelector("#form_login button").innerHTML = `Login`;
};
