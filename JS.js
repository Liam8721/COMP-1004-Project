// GLOBAL VARIABLES 
var add_password_screen = document.getElementById("add_password_modal");
var add_password_button = document.getElementById("add_password_button");
var span = document.getElementsByClassName("close")[0];
var password_buttons_container = document.getElementById("password_button_container");
const saved_passwords_modal = document.getElementById("saved_passwords_modal");
const saved_passwords_div = document.getElementById("saved_passwords");
const saved_changes_button = document.getElementById("save_changes_button");
const sign_out_button = document.getElementById("sign_out_button");
const restore_default_button = document.getElementById("restore_default_button");
const dropdown_content = document.querySelectorAll(".dropdown-content")
const password_submit_button = document.getElementById("password_submit_button");
const saved_password_strength_button = document.getElementById("saved_passwords_strength");
const add_password_strength_button = document.getElementById("password_strength");

// CLASSES
// User_Manager class to manage all users
class User_Manager {
  constructor() {
    this.users = []; // Array to store all users
    this.current_user = null; // Currently logged-in user
  }

  static check_password_requirements(password) {
    let uppercase = false;
    let lowercase = false;
    let number = false;
    let special_character = false;

    // loops through the password to check if it meets the requirements
    for (let i = 0; i < password.length; i++) {
      const char = password[i];

      if (char >= 'A' && char <= 'Z') {
        uppercase = true; // Check for uppercase letters
      } else if (char >= 'a' && char <= 'z') {
        lowercase = true; // Check for lowercase letters
      } else if (char >= '0' && char <= '9') {
        number = true; // Check for numbers
      } else if (/[^a-zA-Z0-9]/.test(char)) {
        special_character = true; // Check for special characters
      }
    }

    // return all checked bool variables as object
    return {
      uppercase: uppercase,
      lowercase: lowercase,
      number: number,
      special_character: special_character
    };
  }

  static check_username_requirements(username) {
    // check if username exists in local storage
    const existing_user = localStorage.getItem(`user_${username}`);
    if (existing_user) {
      alert("Username already exists. Please choose a different username."); // alert the user that the username already exists
      return false; // keep the user on the same page
    } else {
      return true; // move to the next page
    }
  }

  static async retrieve_username(password) {
    const all_users = localStorage.getItem("accounts"); // Get all users from local storage
    if (all_users) {
      const all_users_parsed = JSON.parse(all_users); // Parse the users from local storage
      for (let i = 0; i < all_users_parsed.length; i++) {
        const user = all_users_parsed[i];
        const hashed_password = Array.from(new Uint8Array(
          await Crypto_Web_API.hash_data(password)
        ));
        // Check if the password matches the user
        if (Crypto_Web_API.compare_hashes(Object.values(user.passwordHash), hashed_password)) {
          alert(`Your username is ${user.username}`); // Alert the user with their username
          return true; // move to the next page
        }
      }
      alert("Incorrect password. Please try again."); // alert the user that the password is incorrect
    } else {
      alert("No accounts found"); // alert the user that no accounts were found
      return false; // keep the user on the same page
    }
  }
  // Method to create a new user
  async create_user(username_input, password_input, security_question_1, security_question_2, security_answer_1, security_answer_2) {
    // Create a new user account as an object
    const new_user = new Account(username_input, security_question_1, security_question_2);
    await new_user.initialise_hashes(password_input, security_answer_1, security_answer_2); // hash variables



    localStorage.setItem(`user_${username_input}`, JSON.stringify(new_user)); // Save the new user to local storage
    this.current_user = new_user; // Set the current user to the new user
    this.users.push(new_user); // Add the new user to the list of all users
    this.save_users(); // Save the updated user data to local storage
    this.current_user.save_passwords(); // Save the new user's saved passwords
  }

  // Method to log in a user
  async login(username_input, password) {
    let hash = new Uint8Array(await Crypto_Web_API.hash_data(password)); // Hash the password input
    for (let i = 0; i < this.users.length; i++) {
      const user = this.users[i];
      // Check if the user credentials match an account
      if (user.username === username_input && Crypto_Web_API.compare_hashes(user.passwordHash, hash)) {
        this.current_user = user;
        return; // Exit the loop once the user is found
      }
    }
  }

  // Method to log out the current user
  logout() {
    this.current_user = null; // reset the current user to null
  }

  // Method to add a new password to the current user
  add_password_to_current_user(name, website, username_input, password, description = '') {
    // Create a new password object
    this.current_user.add_password(name, website, username_input, password, description);
    this.save_users(); // Save the updated user data to local storage
  }

  // Method to save all user accounts to local storage
  save_users() {
    localStorage.setItem("accounts", JSON.stringify(this.users));
  }

  // Method to retrieve a user's forgotten password
  check_username(username_input) {
    // checks if the username is empty
    if (!username_input) {
      console.alert("Please enter a username"); // alerts the user to enter a username
      return false; // keeps the user on the same page
    }
    // loop through all users
    let user = localStorage.getItem(`user_${username_input}`); // get all users from local storage
    if (user) {
      user = JSON.parse(user); // parse the users from local storage
      Object.assign(new Account, user);
      Object.setPrototypeOf(user, Account.prototype); // Set the prototype of the user object to Account
      // Check if the username matches an account
      this.current_user = user; // set the current user to the matching user
      return true; // move to the next page
    } else {
      alert("Username not found"); // alert the user that the username was not found
      return false; // keep the user on the same page
    }
  }

  // Method to check if the security answers are correct
  async check_security_answers(answer_1, answer_2) {
    // Hash the combined answers (must match initialization order)
    const combined_hash = Array.from(new Uint8Array(
      await Crypto_Web_API.hash_data(answer_1 + answer_2)
    ));

    if (!this.current_user) {
      let all_users = localStorage.getItem("accounts");
      let found = false; // Flag to check if the user is found
      if (all_users) {
        all_users = JSON.parse(all_users);
        for (let i = 0; i < all_users.length; i++) {
          const user = all_users[i];
          if (Crypto_Web_API.compare_hashes(user.combined_answers_hash, combined_hash)) {
            this.current_user = user;
            found = true; // Set the flag to true if the user is found
            break; // Exit the loop once the user is found
          }
        }
        if (!found) {
          alert("Incorrect security answers"); // alert the user that the security answers are incorrect
          return false; // keep the user on the same page
        }
      } else {
        alert("No accounts found"); // alert the user that no accounts were found
        return false; // keep the user on the same page
      }
    }

    const encrypted_data = this.current_user.encrypted_recovery_data;

    // Check if the combined hash matches the stored hash
    if (Crypto_Web_API.compare_hashes(combined_hash, this.current_user.combined_answers_hash)) {
      // stores recovery key as plaintext in session storage for 5 minutes
      const recovery_key_plaintext = await Crypto_Web_API.decrypt_recovery_key(encrypted_data, combined_hash);
      sessionStorage.setItem("recovery_key", recovery_key_plaintext);
      setTimeout(() => sessionStorage.removeItem('recovery_key'), 900000); // Remove the recovery key from session storage after 15 minutes
      return true; // move to the next page
    } else {
      return false; // keep the user on the same page
    }

    // if (this.current_user) {
    //   const encrypted_data = this.current_user.encrypted_recovery_data;

    //   // Check if the combined hash matches the stored hash
    //   if (Crypto_Web_API.compare_hashes(combined_hash, this.current_user.combined_answers_hash)) {
    //     // stores recovery key as plaintext in session storage for 5 minutes
    //     const recovery_key_plaintext = await Crypto_Web_API.decrypt_recovery_key(encrypted_data, combined_hash);      
    //     sessionStorage.setItem("recovery_key", recovery_key_plaintext);
    //     setTimeout(() => sessionStorage.removeItem('recovery_key'), 900000); // Remove the recovery key from session storage after 15 minutes
    //     return true; // move to the next page
    //   } else {
    //     return false; // keep the user on the same page
    //   }
    // } else {
    //   let all_users = localStorage.getItem("accounts");
    //   if (all_users) {
    //     all_users = JSON.parse(all_users);
    //     for (let i = 0; i < all_users.length; i++) {
    //       const user = all_users[i];
    //       if (Crypto_Web_API.compare_hashes(user.combined_answers_hash, combined_hash)) {
    //         this.current_user = user;
    //         const encrypted_data = this.current_user.encrypted_recovery_data;
    //         const recovery_key_plaintext = await Crypto_Web_API.decrypt_recovery_key(encrypted_data, combined_hash);      
    //         sessionStorage.setItem("recovery_key", recovery_key_plaintext);
    //         setTimeout(() => sessionStorage.removeItem('recovery_key'), 900000); // Remove the recovery key from session storage after 15 minutes
    //         return true; // move to the next page
    //       }
    //     } 
    //     alert("Incorrect security answers"); // alert the user that the security answers are incorrect
    //     return false; // keep the user on the same page
    //   } else {
    //     alert("No accounts found"); // alert the user that no accounts were found
    //     return false; // keep the user on the same page
    //   }
    // }

  }

  // Method to load all user accounts from local storage
  load_accounts() {
    // Check if there are any accounts saved in local storage
    if (localStorage.getItem("accounts")) {
      // loops through all saved accounts
      const saved_users = JSON.parse(localStorage.getItem("accounts"));
      for (let i = 0; i < saved_users.length; i++) {
        const user_data = saved_users[i];
        const user = new Account(user_data.username, user_data.password, user_data.security_question_1, user_data.security_question_2, user_data.security_answer_1, user_data.security_answer_2, user_data.security_code); // Add the saved user to the list of all users

        user.saved_passwords = [];
        user.passwordHash = new Uint8Array(Object.values(user_data.passwordHash));
        user.settings = user.settings || new Settings(); // Load the user's settings
        this.users.push(user); // Add the saved user to the list of all users
      }
    }
  }
}

// Account template user information
class Account {
  constructor(username_input, security_question_1, security_question_2) {
    // security questions
    this.security_question1 = security_question_1;
    this.security_question2 = security_question_2;

    // account credentials
    this.username = username_input;

    // list containers
    this.security_questions_container = [this.security_question1, this.security_question2];
    this.saved_passwords = []; // List to store Password objects

    // instance of settings
    this.settings = new Settings(this.username); // Default settings
  }

  // Method to initialise the hashes
  async initialise_hashes(password, security_answer_1, security_answer_2) {
    // hash password
    this.passwordHash = Array.from(new Uint8Array(
      await Crypto_Web_API.hash_data(password)
    ));

    // hashed combined security answers
    this.combined_answers_hash = Array.from(new Uint8Array(
      await Crypto_Web_API.hash_data(security_answer_1 + security_answer_2)
    ));

    await this.generate_recovery_key();

  }

  async generate_recovery_key() {
    const salt = crypto.getRandomValues(new Uint8Array(16)); // Generate a random salt
    this.recovery_key = await Crypto_Web_API.create_recovery_key(this.passwordHash, salt); // Create the recovery key in plaintext

    // informs user of the security code
    alert(`Account created successfully. Your security code is ${this.recovery_key}. You MUST remember this code for account recovery if credentials are forgotten. Please place this code somewhere safe`)

    this.encrypted_recovery_data = await Crypto_Web_API.encrypt_recovery_key(this.combined_answers_hash, salt, this.recovery_key); // Encrypt the recovery key using the security answers

    this.encrypted_recovery_data.salt = Array.from(salt); // store salt in the encrypted recovery data object

    this.recovery_key = null; // Clear the plain text recovery key from memory
  }

  async validate_password_match(password, confirm_password) {
    // Check if the password and confirm password match
    if (password === confirm_password && password && confirm_password) {
      await user_manager.current_user.reset_password(password); // Call the reset password function
      return true; // Return true if the passwords match
    } else {
      // If they don't match, alert the user
      alert("Passwords do not match. Please try again.");
      return false; // Return false if the passwords do not match
    }
  }

  async reset_password(new_password) {
    // retrieves the plaintext recovery key from session storage
    const recovery_key = sessionStorage.getItem("recovery_key");
    sessionStorage.removeItem("recovery_key");

    if (!recovery_key) {
      alert("Session expired. Restart recovery.");
      // refresh page
    }

    // Generate a new password hash for the new password
    const new_password_hash = Array.from(new Uint8Array(
      await Crypto_Web_API.hash_data(new_password)
    ));

    // Update the user's password hash
    this.passwordHash = new_password_hash;

    // Generate a new salt for the recovery key
    const salt = crypto.getRandomValues(new Uint8Array(16));

    this.recovery_key = await Crypto_Web_API.create_recovery_key(this.passwordHash, salt); // Create a new recovery key using the new password hash and salt

    // Encrypt the new recovery key with the existing security answers
    this.encrypted_recovery_data = await Crypto_Web_API.encrypt_recovery_key(this.combined_answers_hash, salt, this.recovery_key);
    this.encrypted_recovery_data.salt = Array.from(salt); // store salt

    // Update the accounts in localStorage
    const all_users = JSON.parse(localStorage.getItem("accounts"));
    for (let i = 0; i < all_users.length; i++) {
      if (all_users[i].username == user_manager.current_user.username) {
        all_users[i].passwordHash = this.passwordHash;
        all_users[i].encrypted_recovery_data = this.encrypted_recovery_data;
        break;
      }
    }
    localStorage.setItem("accounts", JSON.stringify(all_users));

    const user_data = JSON.parse(localStorage.getItem(`user_${user_manager.current_user.username}`)); // Get the user data from local storage

    user_data.passwordHash = this.passwordHash; // Update the password hash in the user data
    user_data.encrypted_recovery_data = this.encrypted_recovery_data; // Update the encrypted recovery data in the user data
    localStorage.setItem(`user_${user_manager.current_user.username}`, JSON.stringify(user_data)); // Save the updated user data to local storage

    alert("Password reset successful. You can now log in with your new password.");
    alert(`Please remember your new recovery key for future reference. It is important for account recovery. ${this.recovery_key}`); // Alert the user with the new recovery key

    this.recovery_key = null; // Clear the plain text recovery key from memory

  }

  secure_serialise() {
    return {
      username: this.username,
      security_question_1: this.security_question1,
      security_question_2: this.security_question2,
    };
  }



  async get_decrypted_password(selected_password_object, key) {
    const decrypted_password = await CryptoUtils.decryptData(
      selected_password_object.enc_data.ciphertext, // Encrypted password
      key, // The same key used for encryption
      selected_password_object.enc_data.iv // The IV used for encryption
    );
    return decrypted_password;
  }

  async #deriveKey(salt) {
    const baseKey = await crypto.subtle.importKey(
      "raw",
      new Uint8Array(this.passwordHash),
      { name: "PBKDF2" },
      false,
      ["deriveKey"]
    );

    return crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: salt,
        iterations: 100000,
        hash: "SHA-256"
      },
      baseKey,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"]
    );
  }

  async encryptPassword(plaintext) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await this.#deriveKey(salt);

    const encrypted = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      new TextEncoder().encode(plaintext)
    );

    return {
      iv: Array.from(iv),
      ciphertext: Array.from(new Uint8Array(encrypted)),
      salt: Array.from(salt)
    };
  }

  async decryptPassword(encryptedData) {
    const key = await this.#deriveKey(new Uint8Array(encryptedData.salt));

    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: new Uint8Array(encryptedData.iv) },
      key,
      new Uint8Array(encryptedData.ciphertext)
    );

    return new TextDecoder().decode(decrypted);
  }

  // Modified add_password using the crypto methods
  async add_password(name, website, username_input, password, description = '') {
    const encrypted = await this.encryptPassword(password);
    const new_password = new Password(name, website, username_input, encrypted, description);
    this.saved_passwords.push(new_password);
    this.save_passwords();
  }


  // method to save password to local storage
  save_passwords() {
    localStorage.setItem(`user_${this.username}_passwords`, JSON.stringify(this.saved_passwords));
  }

  // method to delete password from local storage
  delete_password(index) {
    this.saved_passwords.splice(index, 1); // Remove the password from the list of saved passwords
    this.save_passwords(); // Save the updated list of passwords to local storage
  }

  // method to load password from local storage
  load_passwords() {
    // Load the saved passwords from local storage
    const saved_passwords = localStorage.getItem(`user_${this.username}_passwords`);
    // Check if any passwords are saved
    if (saved_passwords) {
      this.saved_passwords = JSON.parse(saved_passwords); // Load the passwords into the current user's account
      this.saved_passwords.forEach(async (password) => {
        password.enc_data.salt = new Uint8Array(password.enc_data.salt); // Convert the salt back to a Uint8Array
        password.enc_data.iv = new Uint8Array(password.enc_data.iv); // Convert the IV back to a Uint8Array
        password.enc_data.ciphertext = new Uint8Array(password.enc_data.ciphertext); // Convert the encrypted data back to a Uint8Array
      });
    } else {
      this.saved_passwords = []; // If no passwords are found, initialize an empty array
    }
  }
}

// handles all crypto web API functions
class Crypto_Web_API {

  static async hash_data(data) {
    return await crypto.subtle.digest("SHA-256", new TextEncoder().encode(data));
  }

  static async create_recovery_key(hashed_password, salt) {
    // prepares hashed password to be used as a key
    const imported_key = await crypto.subtle.importKey(
      "raw",
      new Uint8Array(hashed_password),
      { name: "PBKDF2" },
      false,
      ["deriveBits"]
    );

    // Derives the recovery key using PBKDF2 algorithm
    const recoveryKeyBits = await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt: salt,
        iterations: 100000,
        hash: "SHA-256"
      },
      imported_key,
      256 // 256-bit key
    );

    // returns the recovery key as a base64 string
    return btoa(String.fromCharCode(...new Uint8Array(recoveryKeyBits))); // Return the derived key bits
  }

  static async encrypt_recovery_key(data, salt, recovery_key) {

    const base_key = await crypto.subtle.importKey(
      "raw",
      new Uint8Array(data),
      { name: "PBKDF2" },
      false,
      ["deriveKey"]
    );

    const derived_encryption_key = await crypto.subtle.deriveKey({
      name: "PBKDF2",
      salt: new Uint8Array(salt),
      iterations: 100000,
      hash: "SHA-256",
    },
      base_key,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"]
    )

    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ciphertext = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      derived_encryption_key,
      new TextEncoder().encode(recovery_key)
    );

    return {
      iv: Array.from(iv),
      ciphertext: Array.from(new Uint8Array(ciphertext))
    };
  }

  static compare_hashes(hash1, hash2) {
    if (hash1.length !== hash2.length) {
      return false;
    }
    for (let i = 0; i < hash1.length; i++) {
      if (hash1[i] !== hash2[i]) {
        return false;
      }
    }
    return true;
  }

  // method to decrypt recovery key
  static async decrypt_recovery_key(encrypted_data, combined_hash) {
    //   const key = await crypto.subtle.importKey(
    //     "raw", new Uint8Array(combined_hash), { name: "AES-GCM" }, false, ["decrypt"]
    //   );

    //   const decrypted = await crypto.subtle.decrypt(
    //     { name: "AES-GCM", iv: new Uint8Array(encrypted_data.iv) },
    //     key,
    //     new Uint8Array(encrypted_data.ciphertext)
    //   );
    //   return new TextDecoder().decode(decrypted); // "ABCD-1234..."

    // Derive the decryption key using PBKDF2



    // OLD CODE
    const baseKey = await crypto.subtle.importKey(
      "raw",
      new Uint8Array(combined_hash),
      { name: "PBKDF2" },
      false,
      ["deriveKey"]
    );

    const derivedDecryptionKey = await crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: new Uint8Array(encrypted_data.salt), // Use the same salt from encryption
        iterations: 100000,
        hash: "SHA-256",
      },
      baseKey,
      { name: "AES-GCM", length: 256 },
      false,
      ["decrypt", "encrypt"]
    );
    console.log("Salt:", encrypted_data.salt);
    console.log("IV:", encrypted_data.iv);
    // Decrypt the ciphertext using AES-GCM
    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: new Uint8Array(encrypted_data.iv) }, // Use the same IV from encryption
      derivedDecryptionKey,
      new Uint8Array(encrypted_data.ciphertext)
    );
    const decoder = new TextDecoder("utf-8");
    return decoder.decode(decrypted);
  }
}

// Password template for saved passwords information
class Password {
  constructor(name, website, username_input, enc_data, description = '') {
    this.name = name;
    this.website = website;
    this.username = username_input;
    this.enc_data = enc_data;
    this.description = description;
  }
}

// Settings template for user settings
class Settings {
  constructor(username) {
    this.username = username;
    this.auto_lock = true; // Default setting
    this.background_colour = "#bcbcbc"; // Default theme
    this.title_colour = "#bc4d32"; // Default theme
    this.load_settings(); // Load the user's settings
  }

  // Method to update the background colour
  set_background_colour(colour) {
    this.background_colour = colour;
    document.body.style.background = colour;
    this.save_settings();
  }

  // Method to update the title background colour
  set_title_colour(colour) {
    this.title_colour = colour;
    document.querySelector(".page_title").style.color = colour;
    this.save_settings();
  }

  // Method to restore default settings
  restore_defaults() {
    this.auto_lock = true;
    this.background_colour = "#bcbcbc";
    this.title_colour = "#bc4d32";
    document.body.style.background = this.background_colour;
    document.querySelector(".page_title").style.color = this.title_colour;
    this.save_settings();
  }

  load_settings() {
    let settings = localStorage.getItem(`settings_${this.username}`);
    if (settings) {
      settings = JSON.parse(settings);
      this.auto_lock = settings.auto_lock;
      this.background_colour = settings.background_colour;
      this.title_colour = settings.title_colour;
      document.body.style.background = this.background_colour; // Apply the loaded background colour
      document.querySelector(".page_title").style.color = this.title_colour; // Apply the loaded title colour
    } else {
      this.save_settings(); // Save the default settings
    }
  }

  // Save settings to localStorage
  save_settings() {
    let settings = {
      auto_lock: this.auto_lock,
      background_colour: this.background_colour,
      title_colour: this.title_colour
    }
    localStorage.setItem(`settings_${this.username}`, JSON.stringify(settings));
  }
}

// INSTANTIATE CLASSES
var user_manager = new User_Manager();

// FUNCTIONS

// enters function whenever page loads
window.onload = function () {
  user_manager.load_accounts();// Load all user accounts from local storage
  display_login_screen();
}

// LOGIN SYSTEM FUNCTIONS
// sign_in function to allow user to sign in or create a new account or retrieve lost credentials
function display_login_screen() {
  // DOM elements
  const login_screen = document.getElementById("login_modal");
  const create_new_account_button = document.getElementById("create_new_account");
  const login_button = document.getElementById("login_button");
  const forgot_credential_button = document.getElementById("forgot_credentials_button");
  const login_form = document.getElementById("login_form");

  // Display the modal
  login_screen.style.display = "flex";

  // Event listeners
  // if the create new account button is clicked then the user will be taken to the create new account screen
  create_new_account_button.onclick = function () {
    login_screen.style.display = "none";
    login_form.reset(); // Reset the login form
    display_create_new_account_screen(login_screen);
  }

  // if the login button is clicked then validate the user credentials
  login_button.onclick = async function () {
    // Get the form values
    const username = document.getElementById("login_username").value;
    const password = document.getElementById("login_password").value;

    // Check if the username and password are not empty
    if (username && password) {
      // Attempt to log in the user
      await user_manager.login(username, password);

      // Check if the user was successfully logged in
      if (user_manager.current_user) {
        login_screen.style.display = "none"; // Hide the login screen
        login_form.reset(); // Reset the login form
        initialise_user_environment(); // load user environment
      } else {
        alert("Invalid username or password."); // Alert the user that the username or password is incorrect
      }
    } else {
      alert("Please enter a username and password"); // Alert the user to enter a username and password
    }
  }

  // if the forgot credentials button is clicked then the user will be taken to the forgot credentials screen
  forgot_credential_button.onclick = function () {
    login_screen.style.display = "none";
    login_form.reset(); // Reset the login form
    display_forgot_credentials_screen(login_screen);
  }
}

function display_forgot_credentials_screen(login_screen) {
  // DOM elements
  const forgot_credential_modal = document.getElementById("forgot_credentials_modal");
  const back_button = document.getElementById("forgot_credentials_back_button");
  const forgot_password_button = document.getElementById("forgot_password_button");
  const forgot_username_button = document.getElementById("forgot_username_button");
  const forgot_both_button = document.getElementById("forgot_both_button");

  // Display the modal
  forgot_credential_modal.style.display = "flex";

  // if the back button is clicked then the user will be taken back to the login page
  back_button.onclick = function () {
    forgot_credential_modal.style.display = "none";
    login_screen.style.display = "flex";
  }

  // if the forgot password button is clicked then the user will be taken to the forgot password screen
  forgot_password_button.onclick = function () {
    forgot_credential_modal.style.display = "none";
    forgot_password_screen(login_screen, forgot_credential_modal);
  }

  // if the forgot username button is clicked then the user will be taken to the forgot username screen
  forgot_username_button.onclick = function () {
    forgot_credential_modal.style.display = "none";
    forgot_username_screen(login_screen, forgot_credential_modal);
    }

  // if the forgot both button is clicked then the user will be taken to the forgot both screen
  forgot_both_button.onclick = function () {
    //forgot_credential_modal.style.display = "none";
    console.log("Forgot both button clicked"); // Log the button click
  }
}

function recovery_key_screen(login_screen,) {
  // DOM elements
  const recovery_key_screen = document.getElementById("recovery_key_modal");
  const back_button = document.getElementById("recovery_key_back_button");
  const submit_button = document.getElementById("recovery_key_submit_button");
  const recovery_key_form = document.getElementById("recovery_key_form");

  // Display the modal
  recovery_key_screen.style.display = "flex";

  // Event listeners
  // if the back button is clicked then the user will be taken back to the forgot credential screen
  back_button.onclick = function () {
    // handle logic here
  }

  // if the submit button is clicked then the recovery key will be checked
  submit_button.onclick = async function () {
    const recovery_key_input = document.getElementById("recovery_key_input").value; // Get the input recovery key
    const correct_recovery_key = sessionStorage.getItem("recovery_key"); // Get the correct recovery key from session storage

    if (recovery_key_input === correct_recovery_key) {
      sessionStorage.removeItem("recovery_key"); // Remove the recovery key from session storage
      const all_users = JSON.parse(localStorage.getItem("accounts"));
      for (let i = 0; i < all_users.length; i++) {
        let user_recovery_key_plaintext = await Crypto_Web_API.decrypt_recovery_key(all_users[i].encrypted_recovery_data, all_users[i].combined_answers_hash); // Decrypt the recovery key using the security answers
        if (user_recovery_key_plaintext == recovery_key_input) {
          alert(`Your username is ${all_users[i].username}`); // Alert the user with their username
          break;
        }
      }
      recovery_key_screen.style.display = "none"; // Hide the recovery key screen
      recovery_key_form.reset(); // Reset the recovery key form
      login_screen.style.display = "flex"; // Display the login screen
    }
    else {
      alert("Incorrect recovery key. Please try again."); // Alert the user that the recovery key is incorrect
    }
  }
}

// function to display forgot both screen
function forgot_both_screen(login_screen, forgot_credential_modal) {
  // DOM elements
  const forgot_both_screen = document.getElementById("forgot_both_modal");
  const submit_button = document.getElementById("forgot_both_submit_button");
  const back_button = document.getElementById("forgot_both_back_button");

  // Display the modal
  forgot_both_screen.style.display = "flex";

  // event listeners
  // if the back button is clicked then the user will be taken back to the forgot credentials page
  back_button.onclick = function () {
    forgot_both_screen.style.display = "none";
    forgot_credential_modal.style.display = "flex";
  }

  // if the submit button is clicked then the security code will be checked and the user will be taken to the security questions page
  submit_button.onclick = function () {
    forgot_both_screen.style.display = "none"; // Hide the forgot both page
    const security_code = document.getElementById("forgot_both_security_code_input").value; // Get the input security code
    // Check if the security code is valid and displays the security questions page
    if (user_manager.retrieve_both(security_code)) {
      forgot_credential_modal.style.display = "none";
      secuity_questions_page(login_screen, "both");
    }
  }
}

// function to display forgot username screen
function forgot_username_screen(login_screen, forgot_credential_modal) {
  // DOM elements
  const forgot_username_modal = document.getElementById("forgot_username_modal");
  const submit_button = document.getElementById("forgot_username_submit_password");
  const back_button = document.getElementById("back_button_forgot_username");
  const forgot_username_form = document.getElementById("forgot_username_form");

  // Display the modal
  forgot_username_modal.style.display = "flex";

  // if the back button is clicked then the user will be taken back to the forgot credentials page
  back_button.onclick = function () {
    forgot_username_modal.style.display = "none";
    forgot_credential_modal.style.display = "flex";
    forgot_username_form.reset(); // Reset the forgot username form
  }

  // if the submit button is clicked then the password will be checked and the user will be taken to the security questions page
  submit_button.onclick = function () {
    //forgot_username_modal.style.display = "none"; // Hide the forgot username page
    const password = document.getElementById("forgot_username_password").value; // Get the input password
    // Check if the password is valid and displays the security questions page
    if (password) {
       if (User_Manager.retrieve_username(password)){
        forgot_username_modal.style.display = "none"; // Hide the forgot username page
        login_screen.style.display = "flex"; // Display the login screen
       }
    } else {
      alert("Please enter a password"); // Alert the user that the password is invalid
    }

    forgot_username_form.reset(); // Reset the forgot username form
  }
}

// function to display forgot password screen
function forgot_password_screen(login_screen, forgot_credential_modal) {
  // DOM elements
  const forgot_password_modal = document.getElementById("forgot_password_modal");
  const submit_button = document.getElementById("forgot_password_submit_username");
  const back_button = document.getElementById("back_button_forgot_password");
  const forgot_password_form = document.getElementById("forgot_password_form");

  // Display the modal
  forgot_password_modal.style.display = "flex";

  // if the back button is clicked then the user will be taken back to the forgot credentials page
  back_button.onclick = function () {
    forgot_password_modal.style.display = "none";
    forgot_password_form.reset(); // Reset the forgot password form
    forgot_credential_modal.style.display = "flex";
  }

  // if username is entered correctly then the user will be taken to the security questions page
  submit_button.onclick = function () {
    const username = document.getElementById("forgot_password_username").value; // Get the input username
    // Check if the username is valid and displays the security questions page
    if (user_manager.check_username(username)) {
      forgot_password_modal.style.display = "none"; // Hide the forgot password page
      forgot_password_form.reset(); // Reset the forgot password form
      secuity_questions_page(login_screen, "forgot password"); // Display the security questions page
    }
  }
}

// function to display create new account screen
function display_create_new_account_screen(login_screen) {
  // DOM elements
  const sign_up_button = document.getElementById("sign_up_button");
  const back_button = document.getElementById("create_account_back_button");
  const create_new_account_screen = document.getElementById("create_new_account_modal");
  const create_account_form = document.getElementById("create_account_form");

  // Display the modal
  create_new_account_screen.style.display = "flex";

  // if the back button is clicked then the user will be taken back to the login page
  back_button.onclick = function () {
    create_new_account_screen.style.display = "none";
    create_account_form.reset(); // Reset the create account form
    login_screen.style.display = "flex";
  }

  // if the sign up button is clicked then the user will be taken to the create security questions screen
  sign_up_button.onclick = function () {
    // Get the form values
    const username = document.getElementById("create_account_username").value;
    const password = document.getElementById("create_account_password").value;

    // Check if the username and password are not empty
    if (username && password && password.length >= 8 && password.length <= 12) {
      let password_requirements = User_Manager.check_password_requirements(password); // Check if the password meets the requirements
      let check_username = User_Manager.check_username_requirements(username); // Check if the username is valid

      // if all attributes of the password are met then the user will be taken to the create security questions page
      if (password_requirements.lowercase && password_requirements.uppercase && password_requirements.number && password_requirements.special_character && check_username) {
        create_new_account_screen.style.display = "none"; // Hide the create new account page
        create_account_form.reset(); // Reset the create account form
        display_create_security_questions_screen(username, password, login_screen); // Display the create security questions page
      } else {
        if (check_username) {
          alert("Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character."); // Alert the user that the password does not meet the requirements
        }
      }
    } else {
      alert("Please enter a valid username and passsword");
    }
  }
}

// function to display security questions page
function secuity_questions_page(login_screen, previous_screen) {
  // DOM elements
  const security_questions_screen = document.getElementById("security_questions_modal");
  const submit_button = document.getElementById("submit_security_answers_button");
  const back_button = document.getElementById("security_questions_back_button");
  const security_questions_form = document.getElementById("security_questions_form");
  const question_1_label = document.querySelector('label[for="question_1"]');
  const question_2_label = document.querySelector('label[for="question_2"]');

  // Display the modal
  security_questions_screen.style.display = "flex";

  question_1_label.textContent = user_manager.current_user.security_question1; // Display the first security question
  question_2_label.textContent = user_manager.current_user.security_question2; // Display the second security question

  // Display the security questions from the usernames corresponding account
  //question_1_label.textContent = user_manager.current_user.security_question_1;
  //question_2_label.textContent = user_manager.current_user.security_question_2;

  // Event listeners
  // if the back button is clicked then the user will be taken back to the login screen 
  back_button.onclick = function () {
    security_questions_screen.style.display = "none";
    security_questions_form.reset(); // Reset the security questions form
    login_screen.style.display = "flex";
    user_manager.current_user = null; // Reset the current user
  }

  // if the submit button is clicked then check answers and display the corresponding page
  submit_button.onclick = async function () {
    // Get the form values
    const answer_1 = document.getElementById("question_1_security_questions").value;
    const answer_2 = document.getElementById("question_2_security_questions").value;

    // Check if the answers are not empty
    if (answer_1 && answer_2) {
      // Check if the answers are correct
      const correct = await user_manager.check_security_answers(answer_1, answer_2)
      if (correct) {
        security_questions_screen.style.display = "none"; // Hide the security questions page
        security_questions_form.reset(); // Reset the security questions form
        alert("Correct security answers"); // Alert the user that the answers are correct
        if (previous_screen == "forgot username") {
          recovery_key_screen(login_screen); // Display the recovery key screen
        } else if (previous_screen == "forgot password") {
          reset_password_screen(login_screen); // Display the reset password page
        }


        // // Display the corresponding page based on the lost credentials
        // if (present_loss_credentials === "username") {
        //   present_username_screen(login_screen);
        // }
        // else if (present_loss_credentials === "password") {
        //   present_passwords_screen(login_screen);
        // }
        // else if (present_loss_credentials === "both") {
        //   present_both_screen(login_screen);
        // }
      } else {
        alert("Incorrect security answers."); // Alert the user that the security answers are incorrect
      }
    } else {
      alert("Please enter both security") // Alert the user to enter both security answers
    }
  }
}

function reset_password_screen(login_screen) {
  // DOM elements
  const reset_password_screen = document.getElementById("reset_password_modal");
  const back_button = document.getElementById("reset_password_back_button");
  const submit_button = document.getElementById("reset_password_submit_button");
  const reset_password_form = document.getElementById("reset_password_form");

  // Display the modal
  reset_password_screen.style.display = "flex";

  // Event listeners
  // if the back button is clicked then the user will be taken back to the login screen
  back_button.onclick = function () {
    // functionality to be added
  }

  // if the submit button is clicked then the user will be taken back to the login screen
  submit_button.onclick = async function () {
    // Get the form values
    const new_password = document.getElementById("new_password").value;
    const confirm_password = document.getElementById("confirm_new_password").value;

    // Check if the new password and confirm password are not empty
    let validated = await user_manager.current_user.validate_password_match(new_password, confirm_password);

    if (validated) {
      reset_password_screen.style.display = "none"; // Hide the reset password page
      reset_password_form.reset(); // Reset the reset password form
      location.reload(); // Reload the page to reflect the changes
    }
  }
}

// function to display account username
function present_username_screen(login_screen) {
  // DOM elements
  const username_screen = document.getElementById("show_username_modal");
  const close_button = document.getElementById("close_username_button");
  let username = document.getElementById("show_username");

  // Display the modal
  username_screen.style.display = "flex";

  // Display the username from the current user
  username.textContent = "Username: " + user_manager.current_user.username;

  // Event listeners
  // if the close button is clicked then the user will be taken back to the login screen
  close_button.onclick = function () {
    user_manager.current_user = null; // Reset the current user
    username_screen.style.display = "none";
    login_screen.style.display = "flex";
  }
}

// function to display both account username and account password
function present_both_screen(login_screen) {
  // DOM elements
  const both_screen = document.getElementById("show_both_modal");
  const close_button = document.getElementById("close_both_button");
  let username = document.getElementById("show_both_username");
  let password = document.getElementById("show_both_password");

  // Display the modal
  both_screen.style.display = "flex";

  // Display the username and password from the current user
  username.textContent = "Username: " + user_manager.current_user.username;
  password.textContent = "Password: " + user_manager.current_user.password;

  // Event listeners
  // if the close button is clicked then the user will be taken back to the login screen
  close_button.onclick = function () {
    user_manager.current_user = null;
    both_screen.style.display = "none";
    login_screen.style.display = "flex";
  }
}

// function to display account password
function present_passwords_screen(login_screen) {
  // DOM elements
  const passwords_page = document.getElementById("show_password_modal");
  const close_button = document.getElementById("close_password_button");
  let password = document.getElementById("show_password");

  // Display the modal
  passwords_page.style.display = "flex";

  // Display the password from the current user
  password.textContent = "Password: " + user_manager.current_user.password;

  // Event listeners
  // if the close button is clicked then the user will be taken back to the login screen
  close_button.onclick = function () {
    user_manager.current_user = null;
    passwords_page.style.display = "none";
    login_screen.style.display = "flex";
  }
}

// function to display saved passwords for the current user signed in
function initialise_user_environment() {
  // display any previously saved passwords on users account
  user_manager.current_user.load_passwords();
  user_manager.current_user.settings.load_settings();
  const saved_passwords = user_manager.current_user.saved_passwords;

  // checks if there are any saved passwords
  if (saved_passwords.length > 0) {
    let all_password_buttons = []; // Array to store all password buttons
    // Create a button for each saved password
    for (let index = 0; index < saved_passwords.length; index++) {
      const new_password_button = document.createElement('button');
      new_password_button.classList.add('btn', 'w-100', 'btn-block', 'password_button');
      new_password_button.textContent = saved_passwords[index].name;
      all_password_buttons.push(new_password_button);
    }

    // Append buttons to the container
    all_password_buttons.forEach(button => password_buttons_container.appendChild(button));
  }
}

// function to display page where user can create new security questions for a new account
function display_create_security_questions_screen(username, password, login_screen) {
  // DOM elements
  const back_button = document.getElementById("create_security_questions_back_button");
  const submit_button = document.getElementById("submit_new_security_questions");
  const create_security_questions_screen = document.getElementById("create_security_questions_modal");
  const create_security_questions_form = document.getElementById("create_security_questions_form");

  // Display the modal
  create_security_questions_screen.style.display = "flex";

  // Event listeners
  // if the back button is clicked then the user will be taken back to the login screen
  back_button.onclick = function () {
    create_security_questions_screen.style.display = "none";
    create_security_questions_form.reset(); // Reset the create security questions form
    login_screen.style.display = "flex";
  }

  // if submit button is clicked new account will be created and user will return to login screen
  submit_button.onclick = async function () {
    // Get the form values
    const security_question_1 = document.getElementById("new_question_1").value;
    const security_question_2 = document.getElementById("new_question_2").value;
    const security_answer_1 = document.getElementById("new_answer_1").value;
    const security_answer_2 = document.getElementById("new_answer_2").value;

    // Check if the security questions and answers are not empty
    if (security_question_1 && security_question_2 && security_answer_1 && security_answer_2 && security_answer_1.length >= 5 && security_answer_2.length >= 5 && security_answer_1.length <= 20 && security_answer_2.length <= 20 && security_question_1.length >= 10 && security_question_2.length >= 10) {
      // Create a new user account
      await user_manager.create_user(username, password, security_question_1, security_question_2, security_answer_1, security_answer_2);

      // return user to login screen
      create_security_questions_screen.style.display = "none";
      create_security_questions_form.reset(); // Reset the create security questions form
      login_screen.style.display = "flex";
      user_manager.current_user = null; // Reset the current user

    } else {
      alert("Please enter valid security questions and answers"); // Alert the user to enter valid security questions and answers
    }
  }
}

// TAB FUNCTIONS
// once the user clicks on either of the tab buttons then this function is called passing the corresponding tab name and event
function open_tab(evt, tab_name) {
  let i, tab_content, tab_link;

  // HIDE ALL TAB CONTENT
  // gets all elements with class name "tab_content" and hides them (in this case password and settings)
  tab_content = document.getElementsByClassName("tab_content");
  // loops through each element in the tabcontent collection and sets the display to none
  for (i = 0; i < tab_content.length; i++) {
    tab_content[i].style.display = "none";
  }

  // DEACTIVATEs ALL TABS
  // gets all elements with class name "tab_link" 
  tab_link = document.getElementsByClassName("tab_link");
  // loops through each element in the tab_link collection and removes the active class
  for (i = 0; i < tab_link.length; i++) {
    tab_link[i].className = tab_link[i].className.replace(" active", "");
  }

  // displays tab content
  document.getElementById(tab_name).style.display = "block";

  // add "active" class to the clicked tab link
  evt.currentTarget.className += " active";
}

// PASSWORD TAB FUNCTIONS

// when user clicks the add password button the modal will display
add_password_button.onclick = function () {
  add_password_screen.style.display = "flex";
}

// when user clicks the close button the modal will close
span.onclick = function () {
  add_password_screen.style.display = "none";
}

// when user clicks outside of the modal the modal will also close
window.onclick = function (event) {
  if (event.target == add_password_screen) {
    add_password_screen.style.display = "none";
  }
}

// displays a new password in the form of a button when the user clicks the submit button when adding a new password
password_submit_button.onclick = function () {
  // Get the form values
  const password_name = document.getElementById('password_name').value;
  const website = document.getElementById('website').value;
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  const description = document.getElementById('description').value;

  // Add the new password to the account
  user_manager.add_password_to_current_user(password_name, website, username, password, description);

  // Create a button for the new password
  const new_password_button = document.createElement('button');
  new_password_button.classList.add('btn', 'w-100', 'btn-block', 'password_button');
  new_password_button.textContent = password_name;
  password_buttons_container.appendChild(new_password_button)

  // Clear the form fields    
  password_form.reset();

  add_password_screen.style.display = "none";
};

// when user clicks on the saved passwords tab the saved password that the user selected will be displayed
saved_passwords_div.addEventListener("click", function (event) {
  const master_password_screen = document.getElementById("master_password_modal");
  if (event.target.tagName === "BUTTON") {
    master_password_screen.style.display = "flex";
    display_master_password_screen(event);
  }
});

function display_master_password_screen(event) {
  const master_password_screen = document.getElementById("master_password_modal");
  const submit_button = document.getElementById("master_password_submit_button");
  const back_button = document.getElementById("master_password_back_button");
  const master_password_form = document.getElementById("master_password_form");

  back_button.onclick = function () {
    master_password_screen.style.display = "none";
    master_password_form.reset(); // Reset the master password form
  }

  submit_button.onclick = async function () {
    const master_password = document.getElementById("master_password").value;
    let hashed_mater_password_input = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(master_password)));
    if (Crypto_Web_API.compare_hashes(user_manager.current_user.passwordHash, hashed_mater_password_input)) {
      master_password_screen.style.display = "none";
      master_password_form.reset(); // Reset the master password form
      for (let index = 0; index < user_manager.current_user.saved_passwords.length; index++) {
        if (user_manager.current_user.saved_passwords[index].name == event.target.textContent) {
          const span = document.getElementById("detail_close");
          const save_button = document.getElementById("save_changes_button");
          const delete_password_button = document.getElementById("delete_password_button");

          let selected_password = user_manager.current_user.saved_passwords[index];

          const decrypted = await user_manager.current_user.decryptPassword(selected_password.enc_data); // Decrypt the password


          // let key = await CryptoUtils.deriveKeyFromPW(
          //   new Uint8Array(user_manager.current_user.passwordHash), // Changed to use stored hash
          //   selected_password.enc_data.salt
          // );
          // selected_password.password = await user_manager.current_user.get_decrypted_password(selected_password, key.key); // Decrypt the password

          document.getElementById("saved_passwords_modal_name").value = selected_password.name;
          document.getElementById("saved_passwords_modal_username").value = selected_password.username;
          document.getElementById("saved_passwords_modal_passwords").value = decrypted;
          document.getElementById("saved_passwords_modal_website").value = selected_password.website;
          document.getElementById("saved_passwords_modal_description").value = selected_password.description;

          saved_passwords_modal.style.display = "flex";

          span.onclick = function () {
            saved_passwords_modal.style.display = "none";
          }

          window.onclick = function (event) {
            if (event.target == saved_passwords_modal) {
              saved_passwords_modal.style.display = "none";
            }
          }

          save_button.onclick = async function () {
            // 1. Get form values
            const name = document.getElementById("saved_passwords_modal_name").value;
            const username = document.getElementById("saved_passwords_modal_username").value;
            const password = document.getElementById("saved_passwords_modal_passwords").value;
            const website = document.getElementById("saved_passwords_modal_website").value;
            const description = document.getElementById("saved_passwords_modal_description").value;

            // 2. Generate fresh cryptographic material
            const iv = crypto.getRandomValues(new Uint8Array(12)); // New IV
            const salt = crypto.getRandomValues(new Uint8Array(16)); // New salt

            // 3. Derive new encryption key
            const baseKey = await crypto.subtle.importKey(
              "raw",
              new Uint8Array(user_manager.current_user.passwordHash),
              { name: "PBKDF2" },
              false,
              ["deriveKey"]
            );

            const encryptionKey = await crypto.subtle.deriveKey(
              {
                name: "PBKDF2",
                salt: salt,
                iterations: 100000,
                hash: "SHA-256"
              },
              baseKey,
              { name: "AES-GCM", length: 256 },
              false,
              ["encrypt"]
            );

            // 4. Encrypt with new parameters
            const encryptedPassword = await crypto.subtle.encrypt(
              { name: "AES-GCM", iv },
              encryptionKey,
              new TextEncoder().encode(password)
            );

            // 5. Securely update the password entry
            user_manager.current_user.saved_passwords[index] = {
              name: name,
              username: username,
              enc_data: {
                ciphertext: Array.from(new Uint8Array(encryptedPassword)),
                iv: Array.from(iv),
                salt: Array.from(salt) // Store new salt
              },
              website: website,
              description: description
            };

            // 6. Update storage and UI
            user_manager.current_user.save_passwords();
            event.target.textContent = name;
            saved_passwords_modal.style.display = "none";
          };

          delete_password_button.onclick = function () {
            const buttons = document.querySelectorAll('#password_button_container button')
            user_manager.current_user.delete_password(index);

            for (let i = 0; i < buttons.length; i++) {
              if (buttons[i].textContent == event.target.textContent) {
                buttons[i].remove(); // Remove the button with matching text content
                break; // Exit the loop after removing the button
              }
            }

            saved_passwords_modal.style.display = "none";
          }
          break;
        }
      }
    } else {
      alert("Incorrect master password");
    }
  }
}

add_password_strength_button.onclick = add_password_strength;
saved_password_strength_button.onclick = save_password_strength;

function password_strength_calculation(password) {
  let strength = 0;

  let number = false;
  let uppercase = false;
  let lowercase = false;
  let special_character = false;

  // Character type checks
  if (/\d/.test(password)) {
    strength += 1;
    number = true;
  }
  if (/[A-Z]/.test(password)) {
    strength += 1;
    uppercase = true;
  }
  if (/[a-z]/.test(password)) {
    strength += 1;
    lowercase = true;   
  }
  if (/\W/.test(password)) {
    strength += 1;
    special_character = true;   
  }
  
  if (number && uppercase && lowercase && special_character) {
    // Length bonus (exponential)
    return(strength += Math.floor((password.length / 4) ** 2)); 
  } else {
    return ("weak")
  }
}

function add_password_strength() {
  const password = document.getElementById("password").value;
  const strength = password_strength_calculation(password);
  if (strength === "weak") {
    alert("Password is weak"); // Alert the user that the password is weak
  } else {
    if (strength >= 6) {
      alert("Password is strong");
    } else {
      alert("Password is weak");
    }
  }
}

function save_password_strength() {
  const password = document.getElementById("saved_passwords_modal_passwords").value;
  const strength = password_strength_calculation(password);
  if (strength === "weak") {
    alert("Password is weak"); // Alert the user that the password is weak
  } else {
    if (strength >= 6) {
      alert("Password is strong");
    } else {
      alert("Password is weak");
    }
  }
}


// SETTINGS TAB FUNCTIONS

restore_default_button.onclick = function () {
  user_manager.current_user.settings.restore_defaults();
}

document.getElementById("title_colour_dropdown").onclick = function (event) {
  // Check if the clicked element is one of the colour options
  if (event.target.tagName === 'A') {
    // Get the colour from the clicked element's id
    const colour = event.target.textContent;

    user_manager.current_user.settings.set_title_colour(colour);
  }
}

document.getElementById("background_colour_dropdown").onclick = function (event) {
  // Check if the clicked element is one of the colour options
  if (event.target.tagName === 'A') {
    // Get the colour from the clicked element's id
    const colour = event.target.textContent;

    user_manager.current_user.settings.set_background_colour(colour);
  }
}



// LOGOUT FUNCTIONS
// when user clicks the sign out button the user will be signed out and the page will reset
sign_out_button.onclick = function () {
  user_manager.logout();
  display_login_screen();

  reset_ui();
}

// this functions removes all the password buttons from the page to clear the UI for the next user account or to avoid duplications on screen
function reset_ui() {
  // Clear the password buttons
  while (password_buttons_container.firstChild) {
    password_buttons_container.removeChild(password_buttons_container.firstChild);
  }
}
