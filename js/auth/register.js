import { backendURL } from "../utils/utils.js";

const form_register = document.getElementById("form_register");
const togglePassword = document.getElementById("togglePassword");
const togglePasswordConfirmation = document.getElementById("togglePasswordConfirmation");
const passwordInput = document.getElementById("password");
const passwordConfimationInput = document.getElementById("password_confirmation");


togglePassword.addEventListener("click", () => {
  const type = passwordInput.getAttribute("type") === "password" ? "text" : "password";
  passwordInput.setAttribute("type", type);
  togglePassword.innerHTML = type === "password" 
    ? `<img src="assets/icon/eye-slashed.png" alt="Show Password" width="17px" class="opacity-50"/>` 
    : `<img src="assets/icon/eye.png" alt="Hide Password" width="17px" />`;
});

togglePasswordConfirmation.addEventListener("click", () => {
    const type = passwordConfimationInput.getAttribute("type") === "password" ? "text" : "password";
    passwordConfimationInput.setAttribute("type", type);
    togglePasswordConfirmation.innerHTML = type === "password" 
      ? `<img src="assets/icon/eye-slashed.png" alt="Show Password" width="17px" class="opacity-50"/>` 
      : `<img src="assets/icon/eye.png" alt="Hide Password" width="17px" />`;
  });

form_register.onsubmit = async (e) => {
    e.preventDefault();

    document.querySelector("#form_register button").disabled = true;
    document.querySelector("#form_register button").innerHTML = `<div class="spinner-border" role="status" width="30px">
                                                                </div><span class="ms-2">loading...</span>`;

    const formData = new FormData(form_register);
    const registerResponse = await fetch(backendURL + "/api/user", {
        method: "POST", 
        headers: {
            Accept: "application/json",
        },
        body: formData,
    }); 

    if(registerResponse.ok){
        form_register.reset();
        alert("Successfully created an account.");
        window.location.pathname = "/index.html"

    }else{
        const json = await registerResponse.json();
        alert(json.message);
    }
    document.querySelector("#form_register button").disabled = false;
    document.querySelector("#form_register button").innerHTML = `Create an account`;
};