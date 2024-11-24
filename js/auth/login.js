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

const headers = {
  Accept: "application/json",
  Authorization: "Bearer " + localStorage.getItem("token"),
}

form_login.onsubmit = async (e) => {
  e.preventDefault();
  
  const loginButton =  document.querySelector("#form_login button");
  loginButton.disabled = true;
  loginButton.innerHTML = `<div class="spinner-border" role="status" width="30px"></div><span class="ms-2">Loading...</span>`;

  const formData = new FormData(form_login);

  const loginResponse = await fetch(backendURL + "/api/login", {
    method: "POST", headers, body: formData }); 

  const json_login = await loginResponse.json();

  if (loginResponse.ok) {
    localStorage.setItem("token", json_login.token);
    form_login.reset();
    await checkOrgInfoStatus();
  } else {
    alert(json_login.message);
  }
  loginButton.disabled = false;
  loginButton.innerHTML = `Login`;
};
